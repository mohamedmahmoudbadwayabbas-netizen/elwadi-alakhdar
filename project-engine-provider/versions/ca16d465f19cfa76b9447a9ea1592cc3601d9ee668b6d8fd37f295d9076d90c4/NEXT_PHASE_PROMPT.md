# Elwadi Al Akhdar — Next Phase Prompt
## Project Engine Provider + Validation + Durable Approval/Audit

Continue **only** from `SESSION_HANDOFF_2026-09-02_REAL-PROJECT-ENGINE-v1.md`.

### Non-negotiable source-of-truth rules

- Current project code = the Sources ZIP used for the v1 release.
- Supabase Live Project = source of truth for live DB schema.
- GitHub = repository/integration target only.
- Do not inspect GitHub to reconstruct current code.
- Do not merge GitHub into Sources.
- Do not rerun old database migrations.
- Do not add schema columns/tables casually; any durable approval/audit schema is a separate reviewed phase.
- Do not claim an operation succeeded unless the real backend/provider confirmed it.

### Current state

A server-side `supabase/functions/project-engine/index.ts` now exists with:

- JWT verification;
- live `user_roles` admin authorization;
- fail-closed configuration handling;
- real-provider gateway contract;
- server-issued HMAC approval token foundation;
- read/write/Git operation routing;
- no fake filesystem, fake Git, fake commit hash, fake rollback, or fabricated diagnostics.

The React client now uses `src/services/aiTools/projectEngineService.ts`.
DevOps tools no longer use localStorage as a project filesystem.
Gemini code generation produces drafts only; Apply requires explicit admin approval and Project Engine confirmation.

### Phase goals

Build the next layer:

`Sources snapshot`
`→ real provider`
`→ Read`
`→ Plan`
`→ Validate`
`→ Diff/Preview`
`→ explicit Admin Approval`
`→ Apply`
`→ post-apply validation`
`→ Audit`

### Step 1 — environment

Use a normal environment with package-registry access.

Run:

- `npm install`
- `tsc --noEmit` (or the project's real typecheck script if added)
- `npm run build`

Fix real diagnostics only. Do not replace real validation with syntax-only parsing.

### Step 2 — provider

Implement or connect a real server-side project provider.

Requirements:

- It must operate on the exact Sources snapshot used for this release.
- It must expose an immutable source identifier.
- It must reject stale/unexpected source IDs.
- It must support real file reads and code search.
- It must support staged file changes.
- It must support real validation.
- It must return `applied: true` only after actual persistence and verification.

Do not silently use an old GitHub repository as the workspace.

### Step 3 — validation

Provider-side `validateChanges` must run the real checks appropriate to the change:

- TypeScript/typecheck;
- build;
- tests, when present;
- route/module validation;
- security-sensitive checks where relevant.

Return `valid: true` only after the actual checks pass.

### Step 4 — multi-file Change Set

Implement:

`Change Set`
`→ validation`
`→ preview/diff`
`→ approval`
`→ atomic apply`
`→ post-apply validation`
`→ audit

If atomicity is not genuinely available, return `STAGING_NOT_IMPLEMENTED` instead of pretending.

### Step 5 — durable approval/audit

Design this separately and carefully.

If database persistence is required:

- inspect the live schema first;
- create a minimal migration only for the approval/audit requirement;
- document why it is necessary;
- enforce RLS/authorization correctly;
- never let the AI write its own approval record;
- bind approval to actor, change-set hash, expiry, and status;
- make approvals one-time/replay-safe;
- record who approved, what changed, validation results, provider result, and timestamps.

### Step 6 — high-risk policy

Require explicit approval for:

- destructive file deletes;
- authorization/security changes;
- DB migrations;
- financial logic;
- production deployment;
- Git push;
- Git rollback.

Do not expose approval-token creation as an AI tool.

### Step 7 — GitHub

Only after the provider is proven real:

- connect GitHub as repository target;
- use server-side credentials only;
- never invent commit hashes;
- never claim Push/Rollback without provider confirmation;
- never let GitHub silently replace the current Sources snapshot.

### Step 8 — UI

Make the Admin Code Studio show explicit states:

- Draft
- Validating
- Preview Ready
- Approval Required
- Applying
- Applied
- Validation Failed
- Apply Failed
- Not Configured

No “100% Operational” or equivalent claim without verified evidence.

### Step 9 — final verification

Before closing the phase:

- real `tsc --noEmit` = PASS;
- real `npm run build` = PASS;
- provider read = PASS;
- provider validation = PASS;
- approval enforcement = PASS;
- apply confirmation = PASS;
- post-apply validation = PASS;
- audit record = PASS;
- unauthorized caller = FAIL CLOSED;
- stale source ID = FAIL CLOSED;
- missing provider credentials = NOT_CONFIGURED;
- GitHub push without approval = APPROVAL_REQUIRED.

Only report what was actually observed.
