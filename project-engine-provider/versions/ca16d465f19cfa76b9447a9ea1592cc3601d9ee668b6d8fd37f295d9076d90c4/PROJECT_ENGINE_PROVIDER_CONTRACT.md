# Elwadi Al Akhdar — Project Engine Provider Contract

## Purpose

`supabase/functions/project-engine/index.ts` is the server-side security boundary for real project operations. It deliberately does **not** pretend that an Edge Function's ephemeral filesystem is the application's source tree.

The current code source remains the **Sources ZIP** used to build this release. The live Supabase project remains authoritative for database schema. GitHub is only a future repository/integration target.

## Required server-side configuration

- `PROJECT_ENGINE_PROVIDER_URL` — HTTPS endpoint for the real project workspace provider.
- `PROJECT_ENGINE_PROVIDER_TOKEN` — server-only credential for that provider.
- `PROJECT_ENGINE_SOURCE_ID` — immutable identifier for the exact Sources snapshot that the provider is operating on.
- `PROJECT_ENGINE_APPROVAL_SECRET` — server-only HMAC secret used to bind an approval token to the authenticated admin and change-set hash.

Never prefix these with `VITE_` and never expose them to React/browser code.

## Provider request contract

The Edge Function sends JSON:

```json
{
  "operation": "getFileContent | getDirectoryTree | searchCodebase | getAppErrors | validateChanges | applyChanges | gitCommitAndPush | gitRollback | rollback",
  "args": {},
  "actorUserId": "authenticated-user-uuid",
  "sourceId": "configured-source-snapshot-id"
}
```

The provider must return JSON. A successful provider response must contain `ok: true` (or omit `ok`) and may include `messageAr` and `data`. HTTP errors or `{ "ok": false }` are treated as failures.

## Security requirements

1. The Edge Function verifies the caller's Supabase JWT.
2. The Edge Function checks the live `user_roles` table and requires `admin` (or the project's explicitly supported equivalent).
3. Read operations fail closed when the provider is not configured.
4. File mutations never apply directly from an AI tool call. They stop at an approval-gated change request.
5. `applyChanges` requires a server-issued HMAC approval token bound to the authenticated admin, change-set hash, and short expiry.
6. The AI model has no tool that can mint its own approval token.
7. Git operations never invent commit hashes and never claim a push/rollback without provider confirmation.
8. The provider must enforce source identity and must reject operations against an unexpected snapshot.
9. A durable one-time approval/audit database layer is **not** claimed by this foundation yet.

## Source-of-truth rule

A provider must only be connected after the exact Sources snapshot has been deliberately synchronized into that provider. The provider must not silently use an older GitHub repository state as a substitute for the current Sources ZIP.

## Validation contract

Before an approval token is issued, `prepareChangeSet` calls the provider's `validateChanges` operation. The provider must perform real validation appropriate to the change (for example TypeScript/build/tests when available) and return `valid: true` only after those checks actually pass.

For `applyChanges`, the provider must return `applied: true` only after the requested change was actually written and any required post-apply verification completed. Otherwise the Edge Function returns `FAILED`.
