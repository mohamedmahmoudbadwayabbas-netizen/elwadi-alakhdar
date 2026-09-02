Elwadi Al Akhdar — Session Handoff
Session
2026-09-02 — Schema cleanup / low-risk fixes — v5

Source of truth
The live Supabase schema (project gpoqacclpjadzbhevgal) remains authoritative. Do NOT rerun the old migration set, do NOT create a paid Supabase branch, do NOT add Firebase back, and do NOT create ELWADI_ENGINEERING_RULES.md yet.

Work completed in this shot
Read SESSION_HANDOFF_2026-09-02_SCHEMA-CLEANUP-v4.md first and continued only from its NEXT STEP. Did not redo any of v3/v4's fallback-removal or audit work — that state was re-verified where cheap to do so, not re-done.

Dependency/build environment (blocked again, third distinct sandbox)
Direct registry check this shot: `curl -sv https://registry.npmjs.org/vite` → HTTP 403, header `x-deny-reason: host_not_allowed`, body "Host not in allowlist: registry.npmjs.org. Add this host to your network egress settings to allow access." This is the identical failure signature to v4 (an explicit egress allowlist denial), in a sandbox that is not the one used for v3 or v4. `npm install` was not re-attempted since the direct registry probe already gives the same answer without the wait. A real `tsc --noEmit` and a real `npm run build` were NOT attempted this shot either. No claim of TypeScript or build success is made. Full log appended to tsc_output.txt.

This is now three separate sandboxes across v3/v4/v5, each with a different failure signature (DNS unavailable, then E403/host_not_allowed, then host_not_allowed again) but the same practical outcome. This pattern is strong evidence the constraint is structural to this class of sandbox, not a one-off — see NEXT STEP #1, now stated more strongly.

Verification performed instead (does not replace tsc/build, but is real, reproducible, and independent of v4's claims)
Live-schema cross-check via the connected Supabase MCP tools (read-only: list_tables verbose, generate_typescript_types, get_advisors — no writes, no migrations, no branches), run fresh this session rather than trusted from the v4 handoff:
- Pulled the current live schema for gpoqacclpjadzbhevgal directly and diffed it field-by-field against src/integrations/supabase/types.ts.
- Result: structural match confirmed independently on all 10 tables, the store_settings_public view, and all 5 RPC signatures. The committed generated types file is still in sync with the live DB.
- Re-confirmed directly: store_settings has exactly first_order_coupon_enabled, first_order_coupon_code, first_order_discount_percent — no first_order_only or any other undocumented column anywhere in the schema.
- Live row counts (unchanged from v4): profiles=2, user_roles=1, all other 8 tables (products, categories, orders, order_items, cart_items, store_settings, delivery_zones, coupons) = 0 rows.
- Security + performance advisors re-pulled fresh: identical categories to v4, no drift, nothing new, nothing acted on (3 SECURITY DEFINER RPCs callable by anon/authenticated — expected for guest checkout; anon RLS read policies by design; leaked password protection still disabled, Pro-plan gated; 6 unused indexes; RLS policies re-evaluating auth.<fn>() per row on 6 tables; duplicate permissive policies on 5 tables).
Re-ran the syntax-only TypeScript parser check over all 182 .ts/.tsx files (same file count as v3/v4 — confirms no files were silently added or removed): 0 diagnostics, including on both files edited this shot. The checker was again sanity-tested against a deliberately broken .tsx file (5 diagnostics correctly produced this time), confirming it isn't silently passing.

Fixes applied this shot (low-risk, code-level, both from v4's "New findings")

1. Fixed the `updateRawJsonMetadata()` false-success bug in src/services/aiTools/operationalTools.ts.
   - Before: the function always returned `{ ok: true, messageAr: "تم الحفظ بنجاح..." }` regardless of whether a whitelisted key was supplied, whether Supabase was configured, whether a store_settings row existed, or whether the update() call actually succeeded — errors were swallowed with `console.warn` and never surfaced to the caller (the AI admin assistant), which is exactly the "phantom update" pattern this project is trying to eliminate.
   - After: key + value type are validated up front (unsupported key or non-string value → immediate `ok:false` with the allowed-keys list in the message). Supabase-not-configured, no existing settings row, and any `update()` error now all return `ok:false` with a descriptive Arabic message instead of a silent success. The rollback point is now only created once a write is actually about to be attempted, not on every call regardless of validity. Structure follows the same try/catch + `if (error) throw error` convention already used by `toolManageProduct` and its siblings in coreCatalogTools.ts, for consistency.
   - Also fixed the mismatch this bug's finding flagged in src/services/aiTools/toolDefinitions.ts: the `updateRawJsonMetadata` tool declaration listed `first_order_coupon_code` as an example valid key, but it was never in the real whitelist. Fixed the description to list the actual allowed keys (site_name, hero_title, hero_subtitle, whatsapp_number, announcement_text) instead of widening the whitelist to match the description — widening was deliberately avoided because first-order promotion UI is still intentionally disabled pending the server-side/RPC design called for in NEXT STEP #7 below; letting the AI admin assistant write those fields via natural language now would be a functional change, not a cleanup.

2. Pruned the 4 stale Firebase entries from `PROJECT_FILES_REGISTRY` in src/services/projectFilesService.ts (config.ts, firestore.ts, auth.ts, types.ts under "Firebase"), including the one whose description still named the admin email. Confirmed via repo-wide grep that no other code references these registry entries — this was dead catalog metadata only, not live code, matching v4's finding exactly.

Both fixes are narrowly scoped to what v4 flagged; nothing else in either file was touched.

Important verification state
Real tsc --noEmit: NOT run this shot (blocked by the same class of environment issue as v3/v4 — see above). Last confirmed state is still FAILING due to missing dependencies (not because of anything touched this shot).
Real npm run build: NOT run this shot (blocked). Last confirmed state is still FAILING due to missing dependencies.
Live-schema cross-check (Supabase MCP, read-only): PASS — repo's generated types.ts matches the live DB exactly, re-confirmed independently this shot.
Syntax parser: PASS, 182 files / 0 diagnostics, including both edited files.
Live Supabase schema remains the only DB source of truth.
Checkout remains through create_order().
Authenticated cart remains cart_items.
No legacy table reads/writes were restored.
No Firebase restored (directory confirmed absent in earlier sessions; this shot only removed stale catalog metadata referencing it, not code).
No old migrations rerun. No paid Supabase branch created. No ELWADI_ENGINEERING_RULES.md created. No first_order_only added anywhere. No whitelist widened.

NEXT STEP
1. Move this project to an environment with real package-registry egress (e.g. the GitHub Codespaces environment used earlier in this project, or any machine/browser with normal internet access). This is now confirmed across three separate sandboxes (v3, v4, v5) — treat "this class of sandbox cannot reach registry.npmjs.org" as an established constraint, not something worth re-probing again next shot without a genuinely different environment.
2. Install dependencies successfully.
3. Run `tsc --noEmit` for real. The live-schema cross-check has now been independently confirmed twice (v4 and v5) — genuine diagnostics, if any, are more likely to be usage-site issues than type-definition mismatches. Pay particular attention to the two files edited this shot (operationalTools.ts, toolDefinitions.ts, projectFilesService.ts) since only the syntax-only parser has checked them, not real type-checking against the project's actual type graph.
4. Run `npm run build` for real and fix actual build/module/route errors.
5. After both are genuinely green, redo the final LocalStorage audit once more, with special attention to driver_offline_queue (unchanged since v3/v4 but worth a real re-check once the environment allows it).
6. After 3-4 are genuinely successful, revisit first-order coupon. If implemented, it must be secure server-side/RPC logic using only the existing live store_settings fields (first_order_coupon_enabled, first_order_coupon_code, first_order_discount_percent) — never add first_order_only or any new column to the client or the database. Do not widen updateRawJsonMetadata's whitelist as a shortcut to this — build it as real RPC enforcement.
7. Separately from the code work: confirm with the user whether the empty products/categories/orders/etc. tables are expected — this has now been re-confirmed unchanged across two sessions (v4 and v5) — before any client demo.
8. Do not claim tsc or build success until they have actually been run and have actually passed.

Files changed in this shot
src/services/aiTools/operationalTools.ts (updateRawJsonMetadata false-success fix)
src/services/aiTools/toolDefinitions.ts (description aligned with real whitelist)
src/services/projectFilesService.ts (stale Firebase registry entries removed)
tsc_output.txt (appended this session's verification log)
this handoff file
NEXT_SESSION_PROMPT_2026-09-02_SCHEMA-CLEANUP-v5.txt
