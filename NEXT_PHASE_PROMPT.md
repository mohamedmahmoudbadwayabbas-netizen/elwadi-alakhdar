# Elwadi Al Akhdar — Next Phase Prompt
## Project Engine Production Provider Connection + Full E2E Validation

Continue only from:

`SESSION_HANDOFF_2026-09-02_PROJECT-ENGINE-vNEXT.md`

## Source of truth

- Current project code = this Sources-derived release.
- `PROJECT_ENGINE_SOURCE_ID.txt` = immutable SHA-256 of the exact v1 Sources ZIP snapshot used to initialize the provider.
- Live Supabase project `gpoqacclpjadzbhevgal` = source of truth for live database schema.
- GitHub = repository/integration target only.
- LocalStorage = UI/temporary state only, never project filesystem, database, Git history, approval or audit truth.

## Do not redo

The following are already implemented and verified; do not rebuild them unless the actual code proves regression:

- Project Engine Edge Function security boundary.
- JWT verification and live admin-role check.
- Fail-closed provider gateway.
- Immutable source-ID contract.
- Real versioned filesystem provider implementation.
- Provider staging and non-code integration test.
- Durable approval/audit persistence boundary.
- RLS hardening for approval/audit tables.
- Explicit Admin Code Studio state labels.

## Required next work

### 1. Production provider

Deploy `project-engine-provider/server.mjs` behind HTTPS.

Initialize it from the exact v1 Sources ZIP using:

`node scripts/init-project-engine-provider.mjs <source-dir> <workspace-dir> <exact-sources-zip>`

The provider must expose the same immutable source ID found in `PROJECT_ENGINE_SOURCE_ID.txt` and reject all other source IDs.

### 2. Supabase secrets

Configure server-only secrets:

- `PROJECT_ENGINE_PROVIDER_URL`
- `PROJECT_ENGINE_PROVIDER_TOKEN`
- `PROJECT_ENGINE_SOURCE_ID`
- `PROJECT_ENGINE_APPROVAL_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`

Never expose these through React or `VITE_*` variables.

### 3. Real application validation

Use an environment with package registry access.

Run:

- `npm install`
- `tsc --noEmit`
- `npm run build`
- tests, if present

Fix root causes only. Do not weaken strictness or replace real validation with syntax-only parsing.

### 4. Live Project Engine E2E

With a real authenticated admin:

`Read → Plan → Validate → Preview → explicit Admin Approval → Apply → post-apply validation → Audit`

Verify all of the following:

- provider read succeeds;
- provider validation succeeds for a real code change after dependencies are available;
- approval record is created server-side;
- token is bound to actor + change-set hash + expiry + approval ID;
- approval is consumed once;
- replay is rejected;
- wrong actor is rejected;
- wrong change-set hash is rejected;
- expired approval is rejected;
- stale source ID is rejected;
- provider failure never reports success;
- apply confirmation is based on real provider persistence;
- audit records are written server-side.

### 5. High-risk operations

Keep explicit approval for:

- destructive file deletes;
- security/authorization changes;
- DB migrations;
- financial logic;
- production deployment;
- Git push;
- Git rollback.

### 6. GitHub adapter

Only after provider + validation + approval + apply are proven:

- connect GitHub as repository target;
- use server-only credentials;
- create real commits only after approval;
- never invent hashes;
- never silently use GitHub as the current Sources snapshot.

## Definition of Done

- Provider is reachable over HTTPS.
- Exact Sources snapshot identity is enforced.
- Dependencies installed.
- `tsc --noEmit` = PASS.
- `npm run build` = PASS.
- Provider read = PASS.
- Real code validation = PASS.
- Durable approval issuance = PASS.
- Approval replay rejection = PASS.
- Apply confirmation = PASS.
- Post-apply validation = PASS.
- Audit record = PASS.
- Unauthorized caller = FAIL CLOSED.
- Stale source ID = FAIL CLOSED.
- Missing provider configuration = NOT_CONFIGURED.
- Git push without approval = APPROVAL_REQUIRED.

Do not report PASS unless it was actually observed.
