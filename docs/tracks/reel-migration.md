---
track: reel-migration
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
