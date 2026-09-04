# Project Engine Live Schema Verification

Verified against Supabase live project `gpoqacclpjadzbhevgal` on 2026-09-02.

The live database already contains:

- `public.project_engine_approvals`
- `public.project_engine_audit`

Both tables have Row Level Security enabled. The Project Engine persists approval/audit records with the server-only Supabase service-role credential; browser and AI callers do not receive direct table permissions.

The approval record binds actor, source ID, change-set hash, change-set payload, status, expiry and timestamps. The audit record stores event type, actor, approval ID, source ID, change-set hash, validation result, provider result, metadata and timestamp.

No new business columns were added. No legacy migration was rerun.
