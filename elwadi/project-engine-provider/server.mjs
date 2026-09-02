import https from 'node:https';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';

const PORT = Number(process.env.PORT || 9443);
const TOKEN = process.env.PROJECT_ENGINE_PROVIDER_TOKEN || '';
const SOURCE_ID = process.env.PROJECT_ENGINE_SOURCE_ID || '';
const ROOT = path.resolve(process.env.PROJECT_ENGINE_WORKSPACE || './project-engine-workspace');
const VERSIONS = path.join(ROOT, 'versions');
const STAGING = path.join(ROOT, 'staging');
const CURRENT = path.join(ROOT, 'current');
const MAX_BODY = 10 * 1024 * 1024;

function safePath(input) {
  const raw = String(input || '').replace(/^\/+/, '');
  const resolved = path.resolve(ROOT, 'current', raw);
  if (!resolved.startsWith(path.resolve(ROOT, 'current') + path.sep)) throw new Error('INVALID_PATH');
  return resolved;
}

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}

function changeSetHash(changeSet) { return hash(canonical(changeSet)); }

async function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  let size = 0; let raw = '';
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new Error('BODY_TOO_LARGE');
    raw += chunk;
  }
  return raw ? JSON.parse(raw) : {};
}

function auth(req) {
  if (!TOKEN) throw new Error('PROVIDER_TOKEN_NOT_CONFIGURED');
  const supplied = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const suppliedBuffer = Buffer.from(supplied); const expectedBuffer = Buffer.from(TOKEN); if (!supplied || suppliedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)) throw new Error('PROVIDER_UNAUTHORIZED');
  const source = String(req.headers['x-project-engine-source-id'] || '');
  if (!SOURCE_ID || source !== SOURCE_ID) throw new Error('STALE_OR_UNEXPECTED_SOURCE_ID');
}

async function currentRoot() {
  try { await fs.lstat(CURRENT); return CURRENT; } catch { throw new Error('WORKSPACE_NOT_INITIALIZED'); }
}

async function copyDir(src, dst) {
  await fs.rm(dst, { recursive: true, force: true });
  await fs.cp(src, dst, { recursive: true, force: true });
}

async function applyChangeSetToDir(dir, changeSet) {
  const files = Array.isArray(changeSet?.files) ? changeSet.files : [];
  if (!files.length) throw new Error('CHANGE_SET_HAS_NO_FILES');
  for (const file of files) {
    const relative = String(file.filePath || '').replace(/^\/+/, '');
    const target = path.resolve(dir, relative);
    if (!target.startsWith(path.resolve(dir) + path.sep)) throw new Error('INVALID_PATH');
    const action = file.action || 'write';
    if (action === 'delete') await fs.rm(target, { force: true });
    else {
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, String(file.content ?? ''), 'utf8');
    }
  }
}

async function run(cmd, args, cwd) {
  return new Promise(resolve => {
    const child = spawn(cmd, args, { cwd, shell: false, env: process.env });
    let stdout = '', stderr = '';
    child.stdout.on('data', d => { stdout += d.toString(); });
    child.stderr.on('data', d => { stderr += d.toString(); });
    child.on('close', code => resolve({ code: code ?? 1, stdout, stderr }));
    child.on('error', error => resolve({ code: 1, stdout, stderr: String(error) }));
  });
}

async function validate(dir, changeSet) {
  const files = Array.isArray(changeSet?.files) ? changeSet.files : [];
  const touchesCode = files.some(f => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(String(f.filePath || '')));
  const diagnostics = [];
  if (touchesCode) {
    const tsc = await run('npx', ['tsc', '--noEmit'], dir);
    diagnostics.push({ check: 'tsc --noEmit', passed: tsc.code === 0, stdout: tsc.stdout.slice(-12000), stderr: tsc.stderr.slice(-12000) });
    if (tsc.code !== 0) return { valid: false, diagnostics };
    const build = await run('npm', ['run', 'build'], dir);
    diagnostics.push({ check: 'npm run build', passed: build.code === 0, stdout: build.stdout.slice(-12000), stderr: build.stderr.slice(-12000) });
    if (build.code !== 0) return { valid: false, diagnostics };
  }
  return { valid: true, diagnostics };
}

async function diffFiles(changeSet) {
  const root = await currentRoot();
  const out = [];
  for (const file of (changeSet.files || [])) {
    const rel = String(file.filePath || '').replace(/^\/+/, '');
    const target = path.resolve(root, rel);
    const before = await fs.readFile(target, 'utf8').catch(() => '');
    const after = String(file.content ?? '');
    out.push({ filePath: `/${rel}`, action: file.action || 'write', beforeLines: before.split('\n').length, afterLines: after.split('\n').length, changed: before !== after });
  }
  return out;
}

async function stage(changeSet, csHash) {
  const stageDir = path.join(STAGING, csHash);
  await copyDir(await currentRoot(), stageDir);
  await applyChangeSetToDir(stageDir, changeSet);
  return stageDir;
}

async function atomicActivate(versionDir) {
  const nextLink = path.join(ROOT, `.current-${crypto.randomUUID()}`);
  await fs.symlink(path.relative(ROOT, versionDir), nextLink, 'dir');
  await fs.rename(nextLink, CURRENT).catch(async () => {
    await fs.rm(CURRENT, { force: true, recursive: true });
    await fs.rename(nextLink, CURRENT);
  });
}

async function handle(req) {
  auth(req);
  const body = await readBody(req);
  if (body.sourceId !== SOURCE_ID) throw new Error('STALE_OR_UNEXPECTED_SOURCE_ID');
  const operation = String(body.operation || '');
  const args = body.args || {};
  if (operation === 'status') return { ok: true, data: { configured: true, sourceId: SOURCE_ID, workspace: 'versioned-filesystem', staging: true } };
  if (operation === 'getFileContent') {
    const filePath = String(args.filePath || ''); const content = await fs.readFile(safePath(filePath), 'utf8');
    return { ok: true, data: { filePath, content, lineCount: content.split('\n').length } };
  }
  if (operation === 'getDirectoryTree') {
    const root = safePath(String(args.rootDir || '/src')); const maxDepth = Math.min(Number(args.maxDepth || 8), 16);
    const rows = [];
    async function walk(dir, depth) {
      if (depth > maxDepth) return;
      for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        rows.push(`${'  '.repeat(depth)}${entry.isDirectory() ? '📁' : '📄'} ${entry.name}`);
        if (entry.isDirectory()) await walk(path.join(dir, entry.name), depth + 1);
      }
    }
    await walk(root, 0); return { ok: true, data: { rootDir: args.rootDir || '/src', maxDepth, totalFiles: rows.filter(x => x.includes('📄')).length, treeFormatted: rows.join('\n') } };
  }
  if (operation === 'searchCodebase') {
    const query = String(args.query || '').toLowerCase(); const base = await currentRoot(); const results = [];
    async function walk(dir) {
      for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) await walk(full);
        else if (/\.(ts|tsx|js|jsx|mjs|cjs|json|md|css|sql)$/.test(entry.name)) {
          const text = await fs.readFile(full, 'utf8').catch(() => ''); const lines = text.split('\n');
          lines.forEach((line, i) => { if (line.toLowerCase().includes(query)) results.push({ filePath: '/' + path.relative(base, full), line: i + 1, preview: line.trim().slice(0, 240) }); });
        }
      }
    }
    await walk(base); return { ok: true, data: { query: args.query, category: args.category || 'all', resultsCount: results.length, results: results.slice(0, 200) } };
  }
  if (operation === 'validateChanges') {
    const cs = args.changeSet || {}; const csHash = changeSetHash(cs); const diff = await diffFiles(cs); const stageDir = await stage(cs, csHash); const validation = await validate(stageDir, cs);
    if (validation.valid) return { ok: true, valid: true, data: { changeSetHash: csHash, diff, validation, staged: true } };
    return { ok: true, valid: false, data: { changeSetHash: csHash, diff, validation, staged: false }, error: 'VALIDATION_FAILED' };
  }
  if (operation === 'applyChanges') {
    const cs = args.changeSet || {}; const csHash = changeSetHash(cs);
    if (String(args.changeSetHash || '') !== csHash) throw new Error('CHANGE_SET_HASH_MISMATCH');
    const stageDir = path.join(STAGING, csHash); await fs.access(stageDir);
    const validation = await validate(stageDir, cs); if (!validation.valid) return { ok: true, applied: false, data: { validation }, error: 'POST_APPLY_VALIDATION_FAILED' };
    const versionDir = path.join(VERSIONS, `${Date.now()}-${csHash}`); await copyDir(stageDir, versionDir); await atomicActivate(versionDir);
    return { ok: true, applied: true, data: { sourceId: SOURCE_ID, changeSetHash: csHash, version: path.basename(versionDir), validation } };
  }
  if (operation === 'gitCommitAndPush' || operation === 'gitRollback' || operation === 'rollback') return { ok: false, error: 'GIT_PROVIDER_NOT_CONNECTED' };
  if (operation === 'getAppErrors') return { ok: true, data: { source: 'provider', results: [], note: 'No runtime diagnostics provider is configured.' } };
  throw new Error('UNSUPPORTED_OPERATION');
}

async function main() {
  if (!TOKEN || !SOURCE_ID) throw new Error('PROJECT_ENGINE_PROVIDER_TOKEN and PROJECT_ENGINE_SOURCE_ID are required');
  await fs.mkdir(VERSIONS, { recursive: true }); await fs.mkdir(STAGING, { recursive: true });
  await fs.access(CURRENT).catch(() => { throw new Error('Workspace must be initialized with a current symlink before server start'); });
  const key = await fs.readFile(process.env.PROVIDER_TLS_KEY || path.join(ROOT, 'tls-key.pem'));
  const cert = await fs.readFile(process.env.PROVIDER_TLS_CERT || path.join(ROOT, 'tls-cert.pem'));
  https.createServer({ key, cert }, async (req, res) => {
    try { if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' }); const data = await handle(req); return send(res, 200, data); }
    catch (e) { const code = String(e?.message || e); const status = /UNAUTHORIZED|STALE|TOKEN/.test(code) ? 401 : 400; return send(res, status, { ok: false, error: code }); }
  }).listen(PORT, '0.0.0.0', () => console.log(`Project Engine provider listening on https://0.0.0.0:${PORT} source=${SOURCE_ID}`));
}
main().catch(e => { console.error(e); process.exit(1); });
