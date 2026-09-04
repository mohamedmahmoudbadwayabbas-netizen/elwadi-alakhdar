# Elwadi Al Akhdar — Project Engine Provider Contract

## Purpose

`supabase/functions/project-engine/index.ts` is the server-side security boundary for real project operations. It never treats an Edge Function ephemeral filesystem as the project source tree.

The release source is the exact Sources ZIP snapshot. The live Supabase project is authoritative for the database schema. GitHub is a repository/integration target only and must never silently replace the release snapshot.

## Required server-side configuration

- `PROJECT_ENGINE_PROVIDER_URL` — HTTPS endpoint for the real project workspace provider.
- `PROJECT_ENGINE_PROVIDER_TOKEN` — server-only credential for that provider.
- `PROJECT_ENGINE_SOURCE_ID` — immutable SHA-256 identifier of the exact Sources ZIP snapshot synchronized to the provider.
- `PROJECT_ENGINE_APPROVAL_SECRET` — server-only HMAC secret for approval tokens.
- `SUPABASE_SERVICE_ROLE_KEY` — server-only credential used only by the Edge Function to persist/consume approval and audit records. It is never exposed to React.

Never prefix any of these with `VITE_` and never expose them to browser code.

## Provider request contract

The Edge Function sends JSON:

```json
{
  "operation": "status | getFileContent | getDirectoryTree | searchCodebase | getAppErrors | validateChanges | applyChanges | gitCommitAndPush | gitRollback | rollback",
  "args": {},
  "actorUserId": "authenticated-user-uuid",
  "sourceId": "configured-source-snapshot-id"
}
```

The provider must return JSON. Successful provider responses contain `ok: true` (or omit `ok`) and may include `messageAr` and `data`. HTTP errors or `{ "ok": false }` are failures.

## Reference provider implementation

`project-engine-provider/server.mjs` is the real versioned-filesystem provider implementation shipped with this release. It is deployed separately behind HTTPS.

Its storage model is:

- `versions/<version>` — immutable workspace versions.
- `current` — active version pointer.
- `staging/<changeSetHash>` — prepared multi-file change sets.

The provider validates staged code before activation and activates a new version by switching the active pointer. It rejects a stale or unexpected `sourceId` before every operation.

Initialize it from the exact release ZIP with:

`node scripts/init-project-engine-provider.mjs <source-dir> <workspace-dir> <exact-sources-zip>`

## Security requirements

1. The Edge Function requires a valid Supabase JWT.
2. The Edge Function checks the live `user_roles` table and requires `admin` or `super_admin`.
3. Provider credentials and the approval secret are server-only.
4. Read operations fail closed when the provider is not configured.
5. Mutations stop at an approval boundary; AI output cannot directly apply a file mutation.
6. `prepareChangeSet` performs provider validation, creates a durable approval record, and issues a short-lived HMAC token bound to actor, change-set hash, expiry and approval ID.
7. `applyChanges` consumes the durable approval record once, verifies the HMAC binding, and requires provider confirmation of `applied: true`.
8. Approval/audit tables are RLS-enabled with no `anon`/`authenticated` table permissions; only the server-side service-role path writes them.
9. Git operations never invent commit hashes and never claim push/rollback without provider confirmation.
10. The provider rejects unexpected source IDs.

## Durable approval/audit schema

The live Supabase schema was inspected on 2026-09-02 and already contains:

- `public.project_engine_approvals`
- `public.project_engine_audit`

The approval table binds actor, source ID, change-set hash/payload, status, expiry and timestamps. The audit table records event type, actor, approval ID, source ID, change-set hash, validation result, provider result, metadata and timestamp.

The release includes an idempotent hardening migration:
`supabase/migrations/20260902205000_project_engine_approval_audit_hardening.sql`

No business schema columns were added and no legacy migrations were rerun.

## Validation contract

Before an approval token is issued, `prepareChangeSet` calls provider `validateChanges`. The provider must run the real checks appropriate to the staged change and return `valid: true` only after they actually pass.

For code changes, the reference provider runs `tsc --noEmit` and `npm run build` when dependencies are available. Missing dependencies are a validation failure/blocker, not a fabricated pass.

For `applyChanges`, the provider must return `applied: true` only after the change is persisted and post-apply validation succeeds. Otherwise the Edge Function returns `FAILED` and the approval remains reusable when safe.

## Git

GitHub integration is deliberately separate from the source snapshot. `gitCommitAndPush` and `gitRollback` remain approval-gated and unavailable until a real Git adapter confirms the operation. No fake hashes, localStorage commit logs, or simulated rollback are permitted.
