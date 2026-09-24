---
track: reel-migration
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "03b70bed"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/20260924100000_live_reel_expand.sql
  - supabase/migrations/20260924110000_live_reel_drop.sql
  - src/lib/db/migration-guards.test.ts
  - src/lib/db/row-cap-sql.test.ts
  - docs/systems/database-security.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - supabase/migrations/20260921150000_identity_require_verified_email.sql
  - supabase/migrations/20260729190000_qa_writespine_guards.sql
  - supabase/migrations/20260923150000_identity_contract.sql
  - supabase/migrations/20260924010000_row_cap_album.sql
  - src/lib/db/queries/media.ts
  - docs/systems/testing-verification.md
  - docs/systems/uploads-and-r2.md
---

# lp/reel-migration

**Goal.** The reconceived reel's data model as an expand file the deployed code survives untouched (the host's default mood and off switch on events, media.reel_eligible live and backfilled, create_media and the guest reads carrying it, a live_reel_enabled flag) and a drop file that removes every stored-reel table, RPC, enum and preference, each guarded and proved.

## The brief

**Will's words (2026-09-22), verbatim, the lines this lane serves.** "The main reel is a dynamically created, faster-paced slideshow (designed as somewhat of a clickable showpiece in the album) that randomizes all the current/existing (not hidden) media in the event gallery for an immediately watchable reel anytime. This dynamic version is looped, includes most or all media, but not immediately downloadable." · "Does not require any host action for main reel, but allows *anyone* to create their own reels" · "This means we never have to deal with reel storage files". His answers in chat:
- Look: "Host picks a mood as you recommend it. However, this can be the default mood, and we could have a selectable dropdown as the reel plays ... so guests can also switch styles on their own devices (since it costs us nothing, rendered on device)."
- Off switch: "A switch, default on (Recommended)".
- Recipes: "No, cuts leave on devices as you recommended. Huge advantage of this new system. However, when we render videos on-device for users to download, we should create an easy loop where they can also save that video to the event album ... using the event's storage the same any other video would (pro events only). This should not get in the way of us dropping every table and route built for stored reels."

**What this lane is.** The data model of the reconceived reel, as two SQL files in the expand and contract pattern this repo already runs (the `20260921150000` identity precedent). The reel today is one stored mp4 per event, curated by the host (`highlight_reels`, `reel_items`, `reel_render_log`, five RPCs). The new reel is a live montage of the album the viewer's device composes, and a "cut" is a clip anyone renders on their own device.
- **The expand file** is applied by the Orchestrator, and `src/lib/db/types.ts` regenerated, BEFORE the wiring lanes are cut. The deployed code (partyreel.com at milestone 28 and the `launch-prep` alias) keeps working against it untouched.
- **The drop file** is applied only after the wiring's alias build is red-teamed, and only on Will's yes, since it is destructive.

You write both files, their guards and their proofs. The Orchestrator applies them.

**The expand file: `supabase/migrations/20260924100000_live_reel_expand.sql`.**
1. **Events.** `alter table public.events add column reel_style_id text, add column show_reel boolean not null default true;`
   - NO check on `reel_style_id`: the engine falls back for an unknown id, and the Server Function validates against the style catalog, so a new mood never needs a migration. Null means the default mood.
   - Both columns are host-readable and host-writable by COLUMN grant, beside `show_guest_list` (read the existing grants on `events` and follow them exactly; host table writes are column-locked, see `database-security.md`).
   - Add a comment on each column.
2. **`media.reel_eligible`.** It shipped as dead scaffold, `default false` on every row. It is repurposed as "plays in the live reel": false only for a cut added to the album.
   - `alter column reel_eligible set default true`.
   - Backfill `true` on every existing row. Without the backfill every existing album's reel is empty.
   - The backfill must not move `updated_at`: the gallery ETag fingerprint and the host's recency reads key on it. Read the triggers on `media` (an `updated_at` trigger, and `media_guard_privileged_transitions`, which SKIPS a client write to a held row). Make the update touch `reel_eligible` alone, disabling a trigger for the statement inside the migration if one would interfere. Say what you found and did in the file's header.
   - Rewrite the column comment.
   - The flag is WRITE-ONCE at `create_media`, so it rides OUTSIDE the gallery fingerprint, like `width` and `height`. The wiring lane says so in `gallery-fingerprint.ts`; you say it in the comment.
3. **`create_media` and `create_media_as_host`** gain `p_reel_eligible boolean default true` as the LAST parameter and write the column.
   - Drop and create: PostgREST resolves by name, and an overload would make every call ambiguous.
   - The default keeps every deployed call resolving unchanged.
   - Carry EVERY guard in the current definitions verbatim. The latest `create_media` is in `20260921150000_identity_require_verified_email.sql`, the latest `create_media_as_host` in `20260729190000_qa_writespine_guards.sql`; `src/lib/db/migration-guards.test.ts` pins their guards on the last definition.
   - Re-apply exactly the grants each function carries today. Read them from the live catalog first (`pg_proc.proacl`, `information_schema.routine_privileges`). MCP-created functions inherit an `anon` EXECUTE grant: `database-security.md`.
4. **`get_event_media_by_qr_token`** also returns `reel_eligible`.
   - Drop and create (the return type changes), with the same parameters (`p_qr_token, p_before_created_at = null, p_before_id = null, p_limit = null`), the same keyset paging and the same `least(p_limit, 1000)` clamp as `20260924010000_row_cap_album.sql`.
   - Keep the same DEFINER posture and the same grants.
   - `src/lib/db/row-cap-sql.test.ts` keeps it CALLER_BOUNDED.
5. **`get_event_by_qr_token`** also returns `show_reel` and `reel_style_id`. Its QA #40 redaction must survive the drop and create: `migration-guards.test.ts` pins it.
6. **`ops_flags`.** INSERT a new row `live_reel_enabled` (true) and leave `reel_render_enabled` alone. The flagship runs a decode loop on every guest device, so a platform lever is worth a row. The wiring's code reads the new row from its first alias build, and the old code keeps its own until the drop. This is an insert here plus a delete in the drop, rather than a rename, so neither build ever meets a missing flag.
7. **Leave alone:** `highlight_score`, `clip_start_seconds` and `clip_end_seconds` are NOT touched. They sit in the host's column-scoped select list and grant, where a stale list is a runtime 400 on every host read; a later ROADMAP line drops them. `tier_limits().max_reel_seconds` STAYS (it becomes the cut's length cap).
8. **The foot of the file:** the rolled-back check, as a comment the Orchestrator can paste. Run it yourself too, as ONE `do $$ ... raise exception 'rolled back' $$` block over the live database, and confirm afterwards that nothing persisted. It proves:
   - a cut's `create_media(..., p_reel_eligible => false)` lands a row that `get_event_media_by_qr_token` returns with `reel_eligible = false`;
   - a pre-migration event answers `true` for all its approved media;
   - the host can write `show_reel` and `reel_style_id` (as `authenticated` with the owner's claims) and anon reads both through `get_event_by_qr_token`;
   - the grants on every function you recreated match their before.
   
   Use disposable test data only; the scale probe (`14bb4318-80cd-4eed-b219-92c097ee16c7`, on willg97) is a good pre-migration event.

**The drop file: `supabase/migrations/20260924110000_live_reel_drop.sql`.** Its header states "APPLY ONLY after the live-reel wiring's alias build is red-teamed, on Will's yes (destructive)". In dependency order, all `if exists`:
- the RPCs `add_to_reel`, `reorder_reel`, `upsert_reel_config`, `set_reel_guest_visible`, `get_event_reel_by_qr_token`;
- the tables `reel_items`, `reel_render_log`, `highlight_reels` (`if exists` means the never-committed live `style_id` and `orientation` columns need no reconciliation);
- the enum `reel_status`;
- `profiles.notify_reel_ready`, with anything that references it (find every dependency: `pg_depend`, and every function body, view, policy and grant naming it);
- `delete from public.ops_flags where key = 'reel_render_enabled'`.

It never touches `media.reel_eligible`, `tier_limits`, or anything the expand added. You never execute the drop file, not even rolled back: it takes exclusive locks on tables the deployed code still reads, so its rolled-back proof is the Orchestrator's at apply time. Prove it complete another way: a read-only inventory of every object naming the reel tables and the column, listed in your Handoff.

**The guards (`src/lib/db/migration-guards.test.ts`).** Pin:
- the recreated functions' guards on their last definitions, plus `p_reel_eligible`;
- `get_event_media_by_qr_token`'s paging and its `reel_eligible`;
- `get_event_by_qr_token`'s redaction and its two new keys;
- the drop file removing exactly its list and never `reel_eligible` or `tier_limits`.

Keep `row-cap-sql.test.ts` green.

**Look at first (your Handoff):**
- The expand's rolled-back output.
- The grants before and after for every recreated function.
- The trigger finding for the backfill.
- The drop file's dependency inventory.
- The advisor readings now (`get_advisors`, security and performance, read-only), with the expected delta after the drop: `get_event_reel_by_qr_token` leaves the anon SECURITY DEFINER set.

**Boundaries.**
- SQL, the two guard tests and `docs/systems/database-security.md` (the inventory, the `events` column grant, `get_event_by_qr_token`'s keys; the facts only).
- Never `apply_migration`, never `src/lib/db/types.ts`, never an edit to an existing migration file, never TypeScript that reads the new columns: the types regenerate after the Orchestrator applies the expand, and `toGridItems` carrying `reelEligible` belongs to the guest wiring lane.
- A live write only inside the one rolled-back block.
- A fact for another system doc goes in your Handoff as the line to change.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The gate on the synced tree, each step on its own exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:<port>`; the surfaces the Handoff is judged on, local at 1440 and 375.

## Questions (a recommended answer each; the Orchestrator relays them)

Every call below is taken and built; each is his to overrule. No one-way door came up.

- **The preference is `notification_prefs.notify_reel_ready`, not `profiles.notify_reel_ready`.** The live catalog has no such
  column on `profiles`; the drop removes the `notification_prefs` one (0 rows; no send path reads it, per profiles-social.md).
  Recommended: as built.
- **`get_event_media_by_qr_token` stays a PAGED function in `row-cap-sql.test.ts`, not CALLER_BOUNDED** (the brief's word).
  It was on neither allow-list: it takes a cursor and clamps, which the test's default path checks; putting it on
  CALLER_BOUNDED fails that test by construction ("clamps now: move it off CALLER_BOUNDED"). Recommended: as built.
- **`show_reel` and `reel_style_id` come back UNREDACTED from `get_event_by_qr_token`**: presentation settings like `qr_style`
  and `moderation_mode`, never the identifying metadata QA #40 withholds, so an unlocked viewer needs no admin re-read for
  them. The alternative is `case when r.hide_meta` on both plus the two keys in `rehydrateUnlockedDetails`. Recommended: as built.
- **`get_event_by_qr_token` keeps its PUBLIC EXECUTE** ("exactly the grants each function carries today"): the 20260923150000
  recreate inherited it from Postgres's default and never revoked it; it adds nothing anon/authenticated/service_role lack.
  Recommended: keep here; revoke as a separate tidy (Deferred).
- **The backfill pauses `media_set_purge_at` as well as `media_set_updated_at`.** A no-op today (0 of 1,290 rows diverge),
  but it makes "touches reel_eligible alone" true by construction (a removed row with a null `removed_at` would take
  now() + 30 days). Recommended: as built.
- **`coalesce(p_reel_eligible, true)`**: an explicit null behaves as the omitted default instead of a raw 23502 that
  `mapCheckViolation` does not map. Recommended: as built.
- **One stale comment inside `create_media`'s carried body is reworded** to the rule it states (mapCheckViolation now tests
  "verified email" first); every guard and every other byte is verbatim. Recommended: as built.
- **A cut's "pro events only" rides the existing video gate** (`tier = 'free'` refuses video: Event Pass, Pro and Max pass).
  A Pro-only rule that excludes the Event Pass would be a new guard. Recommended: the existing gate.
- **`reel_style_id` has no CHECK at all, per the brief** (like `qr_style`): a direct PostgREST write by the host can store any
  text on their own event, and the engine falls back. Recommended: as built.

## System-doc edits (in place, owned facts only)

- `docs/systems/database-security.md`: the advisor model's counts gain the expand's delta (none) and the drop's (14, 4, 27);
  the anon-read bullet notes `get_event_media_by_qr_token`'s `reel_eligible`, `get_event_reel_by_qr_token` leaving at the
  drop, and `get_event_by_qr_token`'s unredacted switches plus `show_reel`/`reel_style_id` and its PUBLIC EXECUTE; the 0029
  list's four stored-reel RPCs leave at the drop; the deny-all list's `reel_render_log` and `reel_render_enabled` leave and
  `live_reel_enabled` joins; the `media` column lock gains `reel_eligible` (SELECT-granted, write-once); the `events` column
  grant gains `show_reel` and `reel_style_id` and states table-level SELECT; `reel_items` leaves at the drop; the row-cap
  shapes line notes the expand carries the album's paging; a Workflow lesson: a backfill fires no trigger that writes
  another column (pause, run, re-enable in one file, fingerprint before and after).

## Deferred (ROADMAP one-liners, bucket named)

- Major overhauls, The reel: delete the demo's rendered `events/2485e1e6-12b1-4d02-aee3-1e2bb5d38d4f/reel/reel.mp4` from R2
  (and its backup copy) when the live reel's drop applies; nothing names it after the drop, and the orphan sweep never will.
- Launch checkpoint: revoke the PUBLIC EXECUTE `get_event_by_qr_token`'s recreates inherited (anon, authenticated and
  service_role hold it explicitly), beside the table-level TRUNCATE/REFERENCES/TRIGGER revoke line.

## Handoff (replaces the chat report)

- **Commits, pushed:** the work `8ea9e634`; the sync `fb320f06` (a merge of `origin/launch-prep` at `04396e29`, which
  touched only `docs/STATUS.md` and `docs/tracks/orchestrator.md`). The head is in the chat line.
- **Gates on the synced tree (`fb320f06`), each on its own exit code:** `pnpm design:rules` 0 ·
  `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` 0 · `pnpm typecheck` 0 · `pnpm lint` 0 (7 warnings, all
  pre-existing, none in a touched file) · `pnpm test` 0 (427 files; 4,663 passed, 1 skipped) · `pnpm build` 0 ·
  `pnpm lab:smoke --base http://localhost:3137` 0 (520 checks, 0 failing). `board: none`, so no `lab:demo`; no UI
  surface changed, so nothing to capture at 1440 or 375. The dev server on :3137 is stopped.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`):

  ```
  docs/systems/database-security.md
  docs/tracks/reel-migration.md
  src/lib/db/migration-guards.test.ts
  src/lib/db/queries/media.test.ts
  src/lib/db/row-cap-policy.test.ts
  src/lib/db/row-cap-sql.test.ts
  supabase/migrations/20260924100000_live_reel_expand.sql
  supabase/migrations/20260924110000_live_reel_drop.sql
  ```

  The owned paths and this file, plus two single-line exceptions the drop file forces (no open lane owns either):
  `src/lib/db/row-cap-policy.test.ts` loses its `SINGLE_ROW` line `get_event_reel_by_qr_token` (the drop removes the
  function, and the file's own check "every SINGLE_ROW entry names a live set-returning function" failed on it);
  `src/lib/db/queries/media.test.ts` line 264's reader `/function public\.get_event_reel_by_qr_token\s*\(/` matched the
  drop statement and read the drop file, so it now reads `create (?:or replace )?function` and still finds the stored
  reel's last definition until the wiring retires that test (prettier would wrap the line in three; left as one line).
- **Items:**
  1. `20260924100000_live_reel_expand.sql` §1: `events.reel_style_id text` (no check, like `qr_style`) and `events.show_reel boolean not null default true`, both commented, host-written by `grant insert (show_reel, reel_style_id), update (show_reel, reel_style_id) on public.events to authenticated`, no table revoke.
  2. §2: `media.reel_eligible` default true, then `update public.media set reel_eligible = true where not reel_eligible` between `disable trigger` and `enable trigger` of `media_set_updated_at` and `media_set_purge_at`; the column comment says write-once and outside the ETag fingerprint.
  3. §3 and §4: `create_media` and `create_media_as_host` dropped and created with `p_reel_eligible boolean default true` last; bodies generated byte-for-byte from 20260921150000 and 20260729190000 (asserted single replacements) with the insert writing `coalesce(p_reel_eligible, true)` and one stale comment reworded in `create_media`; service-role only.
  4. §5: `get_event_media_by_qr_token` dropped and created with `reel_eligible boolean` appended; the four parameters, gates, keyset, `least(p_limit, 1000)` clamp, DEFINER, empty search_path, grants (anon, authenticated, service_role, never PUBLIC) and its comment restated.
  5. §6: `get_event_by_qr_token` dropped and created with `show_reel boolean, reel_style_id text` appended unredacted; the QA #40 redaction verbatim; its whole ACL restated (anon, authenticated; PUBLIC, service_role).
  6. §7: `insert into public.ops_flags (key, enabled) values ('live_reel_enabled', true) on conflict (key) do nothing`; `reel_render_enabled` untouched.
  7. The expand's header: why the deployed code survives it, the trigger finding, the locks, the apply protocol with the four live md5s (equal to their files: no drift) and the four new ones; its foot: the post-apply rolled-back check (the same block this lane ran, less the pre-apply wrapper).
  8. `20260924110000_live_reel_drop.sql`: exactly 11 statements, all `if exists`, no cascade: the five RPCs (live signatures), `reel_items`, `reel_render_log`, `highlight_reels`, `reel_status`, `notification_prefs.notify_reel_ready`, the `reel_render_enabled` row. Header: the APPLY ONLY line, what milestone-28 loses, the demo's R2 object, the drop order, the inventory, the pre-apply grep and function-body query, the advisor delta; foot: the Orchestrator's post-apply contract check.
  9. `migration-guards.test.ts`: a 25-test live reel block (the columns, the grant and no events revoke, the ordered backfill, every migration re-enables what it pauses, `reel_eligible` write-once, both write RPCs' signatures and every guard and the insert and drop-first service-role grants, the guest reads' keys and grants, the flag, the drop's exact statement list with no cascade, nothing it must keep, its header gate, no revival); the row-cap album pins follow the new shape; the identity contract's order test reads each statement's last occurrence at or before the column drop, because the expand legitimately re-drops `get_event_by_qr_token`.
  10. `row-cap-sql.test.ts`: `get_event_reel_by_qr_token` off `SINGLE_ROW`; the drop-aware reader asserts it gone and the album's RETURNS TABLE ending in `reel_eligible boolean`.
  11. Mutation-checked: ten deliberate breaks of the two SQL files (no re-enable, no coalesce, a table revoke on events, a lost `for update`, a reworded guard, a redacted switch, a client grant, a cascade, the drop naming `reel_eligible`, the enum kept) each failed the guards; the files were restored byte-identical.
  12. Pre-flighted on a throwaway PostgreSQL 17.10 cluster rebuilt from the 95 committed migrations plus Supabase stubs, the live default privileges and the one live drift (`highlight_reels.style_id`, `orientation`, `highlight_reels_orientation_chk`, never committed): the pre-apply proof, the expand applied and its foot check, a deployed-build probe through `authenticated` (the settings save, an event create defaulting both columns, the `MEDIA_HOST_COLUMNS` read, moderation still moving `updated_at`, `reel_eligible` refused), then the drop applied, its foot check, and a re-run as a no-op. The drop never ran against the live project.
- **Assets requested from Will:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** the two files. Apply the expand, then regenerate
  `src/lib/db/types.ts`, when the reel verdicts land (before the wiring lanes are cut); apply the drop only after the
  wiring's alias build is red-teamed, on Will's yes. No Worker, Vercel, Stripe or env change.
- **Calls his to overrule:** the nine under Questions; the two single-line exceptions above; the identity contract's
  order test reshaped (item 9); the drop executed only on the throwaway cluster, never live (item 12).
- **Lines for other system docs** (not this lane's to edit; each takes effect when its migration applies):
  - `docs/systems/host-app.md` (owned by `clocks-and-counts` today) lines 520-521, "`media.reel_eligible`/`highlight_score`/`clip_*` are DEAD scaffold ... reel membership is `reel_items`, never `reel_eligible`" → "`media.reel_eligible` means plays in the live reel: default true, false only for a cut saved to the album, write-once at `create_media*`; `highlight_score` and `clip_*` stay dormant". Its stored-reel curation, Studio and render half retires at the drop.
  - `docs/systems/guest-flow.md` "The guest reel" (lines 826-862) retires at the drop; the live reel reads `reel_eligible` off the album rows and `show_reel`/`reel_style_id` off `get_event_by_qr_token`.
  - `docs/systems/admin-observability.md` line 168: `reel_render_log` and `reel_render_enabled` leave at the drop; `live_reel_enabled` joins the platform kill switches, and the wiring ships its `/admin` toggle and signal.
  - `docs/systems/uploads-and-r2.md` "`create_media*` is the ONLY write path": both take `p_reel_eligible` (default true; a cut's save passes false); the reel key `events/<id>/reel/reel.mp4` loses its last database pointer at the drop.
  - `docs/systems/profiles-social.md` line 143: `notification_prefs` loses `notify_reel_ready` at the drop; `notification-prefs.test.ts` pins TS to 20260708120000's CREATE block, so the lane that removes `notifyReelReady` updates it.
- **For the wiring lanes:** the drop's pre-apply grep answers 40 files today (outside `types.ts` and the two guards): every
  stored-reel reader (`reel-provider.tsx`, `use-reel-config.ts`, `guest-reel.ts`, `render-service.ts`, `queries/reel.ts`,
  `queries/reel-renders.ts`, `queries/pulse.ts` which embeds `highlight_reels`, `api/reel/download`, `admin/reels`, the
  dashboard's `setReelGuestVisibleAction`, `queries/social.ts` + `mutations/social.ts` + `notification-prefs.ts` for
  `notify_reel_ready`, `scripts/seed-demo-event.mjs`) plus comments, lab fixtures and tests. And beside `toGridItems`,
  the unlocked password album's table read (`getApprovedMediaForUnlock`, `guest-events-admin.ts`) needs `reel_eligible`
  in its select list, and `getEventMediaByQrToken` in its row mapping.
- **Look at first:**
  1. **The expand's rolled-back output, on the live project** (2026-09-24, one `do $proof$ ... raise exception` block through
     `execute_sql`: the before-state captured, then this file's statements executed verbatim (its column-0 comment lines
     left out; every function body byte-identical, the md5s prove it), then the foot check, then the raise). The error it
     ended on, verbatim:

     ```
     ROLLED BACK: every live_reel_expand check held {"md5": {"create_media": "e4947c742f3d8be5fe2c93e11b1816a5", "create_media_as_host": "6ce738cc759eabb584fda44c040234d5", "get_event_by_qr_token": "be4ec8731968894473dc2c78b30acc26", "get_event_media_by_qr_token": "761378943be63576d2a427a2c69620ec"}, "grants": {"create_media": ["postgres", "service_role"], "create_media_as_host": ["postgres", "service_role"], "get_event_by_qr_token": ["PUBLIC", "anon", "authenticated", "postgres", "service_role"], "get_event_media_by_qr_token": ["anon", "authenticated", "postgres", "service_role"]}, "pre_apply": {"md5_before": {"create_media": "40051356341c181a2e3207fc54470669", "create_media_as_host": "f0081879fc670f77cf147c1456bd9e9b", "get_event_by_qr_token": "49dfa8b305c1bcb54d4415e26283c689", "get_event_media_by_qr_token": "a6b29838596a5a19f419919d2a149278"}, "media_rows": 1290, "fingerprint": "21ab5b4bb2579e3b52a7883f9e4085b0", "grants_after": {"create_media": ["postgres", "service_role"], "create_media_as_host": ["postgres", "service_role"], "get_event_by_qr_token": ["PUBLIC", "anon", "authenticated", "postgres", "service_role"], "get_event_media_by_qr_token": ["anon", "authenticated", "postgres", "service_role"]}, "grants_before": {"create_media": ["postgres", "service_role"], "create_media_as_host": ["postgres", "service_role"], "get_event_by_qr_token": ["PUBLIC", "anon", "authenticated", "postgres", "service_role"], "get_event_media_by_qr_token": ["anon", "authenticated", "postgres", "service_role"]}, "signatures_before": ["create_media(text,uuid,media_type,text,bigint,text,double precision,integer,integer)", "create_media_as_host(uuid,uuid,uuid,media_type,text,bigint,text,double precision,integer,integer)", "get_event_by_qr_token(text)", "get_event_media_by_qr_token(text,timestamp with time zone,uuid,integer)"], "not_eligible_after": 0, "not_eligible_before": 1290, "grants_match_expected": true, "id_updated_at_purge_at_fingerprint_unchanged": true}, "album_reads": {"host_cut": false, "guest_cut": false, "guest_null": true, "host_deployed_call": true, "guest_deployed_call": true}, "probe_approved": 1145, "probe_eligible": 1145, "anon_reads_open": {"keys": 16, "show_reel": false, "reel_style_id": "reel-check-mood"}, "media_not_eligible": 0, "anon_reads_password": {"show_reel": false, "description": null, "name_present": true, "reel_style_id": "reel-check-mood", "host_display_name": null}}
     ```

     It proved: a cut's `create_media(..., p_reel_eligible => false)` (guest and host paths) reads back `false` through the
     anon album; the deployed nine-argument calls and an explicit null read `true`; the scale probe's 1,145 approved items
     all answer `true`; the host (as `authenticated` with the owner's claims) wrote `show_reel` and `reel_style_id`, a
     stranger's write touched 0 rows, anon's was refused, and anon read both through `get_event_by_qr_token` (16 keys; on
     a password event the description and host name redact and the reel settings do not). Afterwards, read-only: no new
     events column, `reel_eligible` default `false`, 1,290 of 1,290 rows `false`, the fingerprint unchanged, the four old
     signatures and md5s, no `live_reel_enabled` row, all five media triggers `O`, the probe still `hold_for_approval`,
     open, no password, no "Reel check" guest, no 10-byte media: nothing persisted.
  2. **Grants before and after** (EXECUTE; before = the live `proacl`, after = inside the proof; equal as sets):
     `create_media` and `create_media_as_host` `{postgres=X/postgres,service_role=X/postgres}` → postgres, service_role;
     `get_event_media_by_qr_token` `{postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}`
     → the same four; `get_event_by_qr_token` `{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}`
     → the same five, PUBLIC included. The column grants: `show_reel` and `reel_style_id` insert and update for
     `authenticated`, none for `anon`; `custom_slug` still unwritable; `show_guest_list` and `require_upload_to_view` intact;
     `reel_eligible` SELECT-only.
  3. **The trigger finding** (the live catalog): `media_set_updated_at` (`new.updated_at = now()` on every update) and
     `media_set_purge_at` (re-derives `purge_at`; 0 of 1,290 rows diverge today) are paused around the one backfill
     statement and re-enabled in the same file; `media_guard_privileged_transitions` exempts the migration's role (postgres)
     before its held-row skip, and 0 rows are held; `media_derive_removal_provenance` and `media_gallery_doorbell` act only
     on a status change, so both are no-ops. Proved by the `(id, updated_at, purge_at)` fingerprint above over all 1,290 rows.
  4. **The drop's dependency inventory** (read-only, 2026-09-24): `pg_depend` on the three tables holds only their own FKs
     (`highlight_reels` to events and media via `cover_media_id`; `reel_items` to events and media), primary keys, the
     never-committed `highlight_reels_orientation_chk`, defaults, indexes (`highlight_reels_cover_media_id_idx`,
     `_event_id_idx`, `_one_per_event`, `reel_items_event_position_idx`, `reel_render_log_created_idx`, `_event_time_idx`),
     policies (`highlight_reels_host_all`, `reel_items_host_select`, `reel_items_host_delete`), toast tables, row types and
     the `highlight_reels_set_updated_at` trigger; `reel_status`: `highlight_reels.status`, its default, the array type; the
     five functions: nothing depends on them. Function bodies in every schema: only the five RPCs name a table, the enum,
     the flag or the preference (the pre-apply query in the drop's header answers zero rows). No view, matview, publication,
     other table's FK or policy, or column default names them; pg_cron is absent. `notification_prefs.notify_reel_ready`:
     only its two column grants; 0 rows; `profiles` has no such column. Rows: `highlight_reels` 1 (the demo's, status
     ready, `output_key` its R2 mp4), `reel_items` 0, `reel_render_log` 128. `reorder_reel`'s live body differs from its
     file (md5 `2b75aa94…` live), which the drop removes regardless.
  5. **Advisors now** (`get_advisors`, read-only, 2026-09-24): security 15 `rls_enabled_no_policy` (incl. `reel_render_log`),
     5 in 0028 (incl. `get_event_reel_by_qr_token`), 32 in 0029 (incl. it, `add_to_reel`, `reorder_reel`,
     `upsert_reel_config`, `set_reel_guest_visible`); performance 6 `unindexed_foreign_keys` (incl.
     `reel_items_media_id_fkey`), 2 `no_primary_key`, 7 `unused_index`, 1 Auth connection strategy. Expected after the
     expand: no change. After the drop: 14, 4 (`get_event_reel_by_qr_token` leaves the anon SECURITY DEFINER set) and 27,
     and 5 unindexed foreign keys.
