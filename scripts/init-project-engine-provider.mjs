import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { createReadStream } from 'node:fs';

const sourceDir = path.resolve(process.argv[2] || '.');
const workspace = path.resolve(process.argv[3] || './project-engine-workspace');
const sourceZip = process.argv[4] ? path.resolve(process.argv[4]) : null;
if (!sourceZip) {
  console.error('Usage: node scripts/init-project-engine-provider.mjs <source-dir> <workspace> <exact-sources-zip>');
  process.exit(2);
}
const sourceId = (await new Promise((resolve, reject) => {
  const stream = crypto.createHash('sha256');
  const input = createReadStream(sourceZip);
  input.on('data', chunk => stream.update(chunk));
  input.on('end', () => resolve(stream.digest('hex')));
  input.on('error', reject);
}));
const versionDir = path.join(workspace, 'versions', sourceId);
await fs.mkdir(path.dirname(versionDir), { recursive: true });
await fs.rm(versionDir, { recursive: true, force: true });
await fs.cp(sourceDir, versionDir, { recursive: true, force: true });
await fs.rm(path.join(workspace, 'current'), { recursive: true, force: true });
await fs.symlink(path.relative(workspace, versionDir), path.join(workspace, 'current'), 'dir');
await fs.mkdir(path.join(workspace, 'staging'), { recursive: true });
console.log(JSON.stringify({ sourceId, versionDir, current: path.join(workspace, 'current') }, null, 2));
