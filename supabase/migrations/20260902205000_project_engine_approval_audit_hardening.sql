-- Project Engine durable approval/audit hardening.
-- Live schema inspection on 2026-09-02 confirmed both tables already exist.
-- This migration is intentionally idempotent: it does not recreate or alter the
-- approval/audit data model; it only documents and enforces the server-only boundary.

alter table public.project_engine_approvals enable row level security;
alter table public.project_engine_audit enable row level security;

-- No client-facing policies are granted. The Edge Function uses the server-only
-- SUPABASE_SERVICE_ROLE_KEY for approval/audit persistence. This keeps AI/browser
-- callers from directly inserting, updating, or deleting approval/audit records.
revoke all on table public.project_engine_approvals from anon, authenticated;
revoke all on table public.project_engine_audit from anon, authenticated;
