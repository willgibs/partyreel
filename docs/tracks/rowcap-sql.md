---
track: rowcap-sql
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "2429807e"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/20260924010000_row_cap_album.sql
  - supabase/migrations/20260924020000_row_cap_host.sql
  - supabase/migrations/20260924030000_row_cap_sweeps.sql
  - src/lib/db/migration-guards.test.ts
  - src/lib/db/row-cap-sql.test.ts
  - docs/systems/database-security.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - supabase/migrations/20260622140000_gallery_rpcs_preview_key.sql
  - supabase/migrations/20260609160000_media_likes.sql
  - supabase/migrations/20260923120000_guest_by_upload.sql
  - supabase/migrations/20260729150000_qa_q1_media_destruction_guards.sql
  - supabase/migrations/20260707150000_upload_forensics_legal_hold.sql
  - supabase/migrations/20260923160000_withdrawn_out_of_standby.sql
  - supabase/migrations/20260529003529_init_schema.sql
  - src/app/api/cron/purge/route.ts
  - src/lib/lifecycle/account-deletion.ts
  - src/lib/forensics/legal-hold.ts
  - src/lib/admin/kpi.ts
  - docs/systems/lifecycle-recovery.md
---

# lp/rowcap-sql

**Goal.** Every SQL shape the 1,000-row fixes need, in three new migration files, each backward compatible for the deployed builds and ending in a rolled-back check on the 1,200-photo scale probe: the guest album RPC paged on a display-order cursor with its index, like counts paged over liked media, a POST-body likes lookup, per-event card stats and covers as one row each, the claim list paged, the admin metrics as one snapshot, the legal-hold partition and the standby budget's host discovery as sweep helpers; plus a test that every set-returning function pages or returns one row.

## The brief

**Will's words (2026-09-23), verbatim.** "In other project builds, I've also hit errors around that 1000 item handling (maybe a PostgREST issue? could be off there) for things like pagination, item counts, filtering, etc. Let's ensure we will not face any of those issues here." And: "Anything within the work we're doing now may be addressed in a near-term round, and anything that requires more dedicated focus can be logged in the roadmap."

**The cause and the round.** PostgREST's `max_rows = 1000` cuts every table read and every set-returning RPC at 1,000 rows with no error and no flag. An audit found 50 sites, none fixed at `2429807e`. Stage 1 is you (every SQL shape the fixes need) and a parallel lane, `rowcap-kit` (the TypeScript helper `readAllPages`, a policy test, a runtime tripwire). Stage 2 is four lanes that call your functions: the guest album, the host album, the host dashboard and admin, the purge cron. They compile against the types the Orchestrator regenerates when he applies your files at your merge. So the SHAPES you write are the contract, and your Handoff lists every final signature.

**Facts the Orchestrator settled on the scale probe before your cut** (a real 1,200-photo album on the live database, disposable test data): The scale probe is event "Scale probe" `14bb4318-80cd-4eed-b219-92c097ee16c7` (qr `d02631f1bfb3455188d224e41bf9510f`), host willg97, seeded by `scripts/seed-demo-event.mjs` through the real write path: 1,200 photos `p0001` (the oldest) to `p1200`, attributed in turn to the host, Ana P., Ben K. and Cal M. (300 each), 320x240 with no preview (under the preview size), the event name-only, live and open. On its OLDEST items the Orchestrator sets disposable states by SQL: the first 20 pending, the next 30 removed the way a host's Remove writes them, five guest-owned items after those withdrawn by their guest (`removed_by_uploader`), and three liked by willg97 and hi@willgibs. **The live cap is 1,000:** an unbounded `select id` over the probe's 1,024 rows returned 1,000 rows with `Content-Range: 0-999/*` (and a `count=exact` HEAD answered `0-999/1024`), on 2026-09-23 at 23:3x UTC. **Writes are NOT capped:** a no-op `PATCH ... Prefer: return=representation` over 1,040 probe rows returned all 1,040 (`Content-Range: 0-1039/*`), so a mutation's returned rows are complete.

**The convention you write into `docs/systems/database-security.md`** (a new short section beside the Workflow, plus the inventory lines):
- A set-returning function pages on `p_after` (keyset) and `p_limit`, clamped in SQL to `least(p_limit, 1000)`, or returns one row (a scalar, a `jsonb` or a `uuid[]`).
- Prefer SECURITY INVOKER; a new DEFINER function is service-role only, so the advisor lists never grow (the accepted set stays 15 / 5 / 32).
- MCP-created functions inherit an anon EXECUTE grant, so every file revokes from `public, anon` first and then grants exactly.
- ★ The TypeScript helper reads a short page as the end, so the live `max_rows` must never go below 1,000; the Orchestrator verified the live value on 2026-09-23 (1,000 rows with `Content-Range: 0-999/*` on the 1,200-photo scale probe).

**Every change is backward compatible.** partyreel.com runs `milestone-27` and the alias an older build; both call today's functions until milestone 28, hours after your files are applied. So:
- a new parameter has a default that behaves exactly as today;
- a new function is additive;
- nothing is dropped except the old signature in a drop-and-create that replaces it in the same transaction (PostgREST forbids overloads);
- a replaced function starts from its NEWEST definition in `supabase/migrations/` and restates its grants in full.

**The three files** (use exactly these names; the manifest owns them):

1. **`supabase/migrations/20260924010000_row_cap_album.sql`**
   - **`get_event_media_by_qr_token(p_qr_token text, p_before_created_at timestamptz default null, p_before_id uuid default null, p_limit int default null)`.**
     - Its newest definition is `20260622140000_gallery_rpcs_preview_key.sql:9-37`: SQL, stable, SECURITY DEFINER, empty search_path, `visibility = 'open'`, `deleted_at is null`, `status = 'approved'`, `order by m.created_at desc` with no tiebreaker, no LIMIT, granted to anon and authenticated. It is the anon capability RPC, so it stays DEFINER with the same return table.
     - It ALWAYS orders `m.created_at desc, m.id desc`, which adds the tiebreaker.
     - With a cursor, it returns `(m.created_at, m.id) < (p_before_created_at, p_before_id)`.
     - It applies `limit least(p_limit, 1000)` only when `p_limit` is given; a null limit keeps today's unlimited read, which the deployed builds rely on.
     - It is drop-and-create with `revoke all ... from public; grant execute ... to anon, authenticated` restated.
     - The only TS caller is `src/lib/db/queries/guest-events.ts:175`.
   - **The index** `media_event_created_id_idx on public.media (event_id, created_at desc, id desc)`. The only per-event index today is `(event_id, status)` (init_schema `:141`); a plain `create index` inside the migration is fine at zero traffic.
   - **`get_event_like_counts(p_event_id uuid, p_after uuid default null, p_limit int default null)`.**
     - Its newest definition is `20260609160000_media_likes.sql:99-116`: DEFINER, host-gated (zero rows to a non-host), one row per media of the event whatever its status and whether liked or not, unordered; revoked from public, anon and authenticated, granted to authenticated.
     - It becomes liked media only, keyset by `media_id` (`media_id > p_after`, `order by media_id`), with the same limit rule and the same host gate and grants.
     - The deployed readers default a missing id to 0 (`src/lib/event/gallery-items.ts:72`). Confirm the same in `src/lib/reel/quick-add.ts:204, 231-245`, `src/components/reel/reel-builder.tsx:84` and `src/components/reel/studio-moments-picker.tsx:66`; if any does not, say so in your Handoff.
   - **`my_liked_media_ids(p_media_ids uuid[]) returns uuid[]`:** the caller's own likes among the given ids.
     - SECURITY INVOKER over `media_likes`' owner-only RLS; `revoke ... from public, anon`, `grant execute ... to authenticated`.
     - It replaces the browser's `.in("media_id", <every visible id>)` (`src/components/likes/likes-provider.tsx:112-115`, about 37 bytes an id in the URL): the ids ride the POST body.

2. **`supabase/migrations/20260924020000_row_cap_host.sql`**
   - **`event_card_stats(p_event_ids uuid[]) returns jsonb`:** `{ "<event id>": { "approved": n, "pending": n } }` over non-removed media of those events, an event with none present as zeros.
     - SECURITY INVOKER: the host's own RLS (`media_host_all`) and the authenticated column grants (`20260707150000_upload_forensics_legal_hold.sql:123-128`) apply exactly as for today's read, `src/lib/db/queries/events.ts:202-214`, which counts in JS over an unordered, capped read.
     - Granted to authenticated.
   - **`event_covers(p_event_ids uuid[]) returns jsonb`:** `{ "<event id>": { "preview_key": ..., "original_key": ... } }`, the newest approved, non-removed photo per event (`distinct on (event_id) ... order by event_id, created_at desc, id desc`), events with no photo absent.
     - SECURITY INVOKER, granted to authenticated and service_role.
     - It serves the dashboard (`events.ts:104-141`, user client) and `adminCoverUrls` (`src/lib/db/queries/social.ts:535-563`, admin client).
   - **`list_guest_rows_by_email(p_after_at timestamptz default null, p_after_id uuid default null, p_limit int default null)`.**
     - Its newest definition is `20260923120000_guest_by_upload.sql:287-350`: plpgsql, stable, DEFINER, the caller's confirmed address only, `order by coalesce(m.last_at, g.created_at) desc`, no LIMIT, granted to authenticated.
     - It gains a keyset on its own order plus `guest_id` as the tiebreaker, and the same limit rule.
     - Caller: `src/lib/db/queries/claims.ts:58`.
   - **`admin_metrics_snapshot() returns jsonb`:** service-role only (revoked from public, anon, authenticated).
     - It carries every figure `src/lib/db/queries/metrics.ts` derives today from its three capped list reads (`:126-132`: all profiles, all `link_stats`, all `newsletter_signups.source`), and that `src/lib/admin/kpi.ts:43-116` and `/admin/metrics` show: accounts total, new and active, paid, the tier mix, signups per day over the trend window, storage used, QR scans and album views with their per-day trend, and newsletter sign-ups by source.
     - Read those two consumers and `src/lib/db/queries/analytics.ts:15-29` (a per-event per-day `link_stats` sum; add an `event_link_totals(p_event_id uuid) returns jsonb` or fold it in, your call, stated in the Handoff) and name the keys from what they render.
     - The head counts `metrics.ts:133-165` already does stay where they are.

3. **`supabase/migrations/20260924030000_row_cap_sweeps.sql`** (both functions service-role only)
   - **`held_event_ids(p_event_ids uuid[]) returns uuid[]`:** the ids among the input that hold any media under legal hold (`legal_hold_at is not null`).
     - Today the purge cron (`src/app/api/cron/purge/route.ts:415-424`) and account deletion (`src/lib/lifecycle/account-deletion.ts:242-256, 483-491`) read ONE ROW PER HELD PHOTO and partition events with `partitionEventsByHold` (`src/lib/forensics/legal-hold.ts:41-52`). Past 1,000 held rows an event with held media reads as purgeable and its held files are deleted: a legal-hold breach this function ends.
   - **`standby_hosts(p_after uuid default null, p_limit int default null) returns table (host_id uuid, standby_bytes bigint)`:** per host, keyset by host id, exactly the bytes the purge cron's standby budget counts.
     - Count removed media with `removed_by_system = false` and `removed_by_uploader = false` and `legal_hold_at is null`, plus the non-removed media of a soft-deleted event with `legal_hold_at is null`, and only hosts with more than zero.
     - It mirrors `route.ts:1170-1184` plus delete-final's rule: a guest's own withdrawal never counts in the host's budget and purges on its own 30-day `purge_at`, which the `removed_media` sweep already does.
     - Today's discovery (`route.ts:1106-1135`) reads one row per removed photo platform-wide.
   - **`purge_media_rows` stays as it is** (`20260729150000_qa_q1_media_destruction_guards.sql:287-321`): one row per host among at most its input; its SQL caller `purge_media_now` sums it. The cron lane pins its callers to at most 1,000 ids a call.

**Each file ends in a ROLLED-BACK check** (commented out, the house pattern; see `20260923160000_withdrawn_out_of_standby.sql`'s foot): a `do $$ ... $$` block ending in a deliberate `raise exception 'ROLLED BACK: ...'`, which the Orchestrator runs after applying. It rides EXISTING rows only (creating an event trips `enforce_event_limit`), and the scale probe gives you 1,200 real rows. The checks prove:
- The album RPC paged at 400 returns 1,200 unique ids in the same order as the unpaged call, and the null-limit call still returns the whole set.
- The like counts paged, compared with a direct count.
- `event_card_stats` and `event_covers` equal a hand tally for willg97's events.
- `list_guest_rows_by_email` paged equals unpaged, for a confirmed address found by SELECT.
- `held_event_ids` against a hand tally.
- `standby_hosts` against a hand tally of the same predicate. A guest-withdrawn row moves no host's figure: withdraw one probe row inside the block and compare.
- `has_function_privilege` for every grant (anon never on anything but the album RPC).

**Pre-flight every file** on a throwaway local cluster before handing it off (`database-security.md`: Homebrew `postgresql@17`, `initdb` into a scratch dir, the socket under `/private/tmp`, `LC_ALL=C`). Load a stand-in with the real column types of the tables you touch, the Supabase roles, an `auth.uid()` stub and the CURRENT bodies of the functions you replace. Apply your file VERBATIM, run its check, then drive the deployed build's calls (`get_event_media_by_qr_token` with `p_qr_token` alone, `get_event_like_counts` with `p_event_id` alone, `list_guest_rows_by_email()`) through `set local role anon / authenticated`. Put the `pg_get_functiondef` before and after in your scratch directory.

**Tests you own:**
- `src/lib/db/row-cap-sql.test.ts`: every set-returning function's LATEST definition (drop-aware: `20260923130000_drop_saves.sql` drops `get_saved_events`, and `migration-guards.test.ts`' `latestDefinition` sees only creates, so write your own reader) takes `p_limit`, or sits on a `SINGLE_ROW` list whose entries each carry a why: `get_event_reel_by_qr_token` (one reel per event, 0 or 1 row), `host_storage_summary` (one aggregate row), `tier_limits` (one row), `purge_media_rows` (one row per host among at most its input).
- Pins in `src/lib/db/migration-guards.test.ts` for each new or replaced function: the signature, the security mode, `search_path = ''`, the grants, the order and limit shape of the album RPC, and the liked-only filter.

**Boundaries.**
- `rowcap-kit` owns `src/lib/db/queries/`, `src/lib/db/mutations/`, `src/lib/supabase/`, `src/lib/db/read-all.ts`, `src/lib/db/testing/`, `src/lib/db/row-cap-policy.test.ts` and about fifty other files, where it only adds marker comments. Touch no TypeScript outside your two test files.
- Never `src/lib/db/types.ts`. Never `apply_migration`: the Orchestrator applies each file at your merge by the protocol (drift md5, apply verbatim, md5 and grants, `get_advisors`, your check, regenerated types).
- Never an edit to an applied migration: add, never change.
- The live database is read-only for you, apart from the rolled-back pre-flight probes you run inside `begin; ... rollback;` through a single `execute_sql` call, IF your tools include the Supabase MCP. Otherwise the local cluster is your proof and the Orchestrator runs the live check.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The gate on the synced tree, each step on its own exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:<port>`. Each file pre-flighted on the local cluster (the deployed calls and the new ones, each role), its rolled-back check run there, `pg_get_functiondef` before and after saved. The Handoff lists every final signature, return shape, security mode and grant, the order in which to apply the three files, and anything the check needs from the live data.

## Questions (a recommended answer each; the Orchestrator relays them)

- None open. Every call the brief left to me was taken as its recommended answer (or the one the evidence
  pointed to) and is listed, one line each, under "Calls his to overrule" below.

## System-doc edits (in place, owned facts only)

- `docs/systems/database-security.md`: the accepted advisor set's counts (15 / 5 / 32, `get_advisors` on
  2026-09-24); the claim by address under its new signature (the three parameters a cursor and a page size,
  never an address); the Likes paragraph (liked-only counts paged on media_id; the heart state through
  `my_liked_media_ids(uuid[])`); a new bullet placing the seven SECURITY INVOKER helpers and their grants; the
  new section "Set-returning functions and the row cap" beside the Workflow (the convention, the null-limit
  rule, INVOKER first, the grant rule, the ★ `max_rows` of at least 1,000, the three files).

## Deferred (ROADMAP one-liners, bucket named)

- Speculative / longer-horizon backlog: `standby_hosts`, like the removed_media sweep, scans every removed row
  platform-wide on each page; past about a million media rows, a partial index on removed media
  (`where status = 'removed'`) keeps the nightly host discovery an index scan.

## Handoff (replaces the chat report)

`$S` below is this session's scratchpad, `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad`;
every artifact named is under `$S/rowcap-sql/`.

- **Commits.** Work `dcd6d47c`; sync `58430d37` (merged `origin/launch-prep` at `3b44ff40`, which touched only
  `docs/STATUS.md` and `docs/tracks/orchestrator.md`); both pushed. The head is in the chat line.
- **Gates on the synced tree `58430d37`**, each on its own exit code (logs `synced-*.log`): `pnpm design:rules` 0 ·
  `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` 0 · `pnpm typecheck` 0 · `pnpm lint` 0 (8 warnings,
  none in a touched file) · `pnpm test` 0 (383 files, 4,284 passed, 1 skipped) · `pnpm build` 0 ·
  `pnpm lab:smoke --base http://localhost:3132` 0 (520 checks, 0 failing). No board, so no `lab:demo`; port 3132
  freed after.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`; this file joins it in the handoff commit), no
  exception:
  ```
  docs/systems/database-security.md
  src/lib/db/migration-guards.test.ts
  src/lib/db/row-cap-sql.test.ts
  supabase/migrations/20260924010000_row_cap_album.sql
  supabase/migrations/20260924020000_row_cap_host.sql
  supabase/migrations/20260924030000_row_cap_sweeps.sql
  ```
- **The final signatures** (the contract stage 2 compiles against; every function pins `search_path = ''`; a
  paged function's null `p_limit` reads everything, a given one is clamped to 1,000, and a page ends the read
  when it comes back short):

  | function | returns | security | EXECUTE | page or shape |
  | --- | --- | --- | --- | --- |
  | `get_event_media_by_qr_token(p_qr_token text, p_before_created_at timestamptz = null, p_before_id uuid = null, p_limit integer = null)` | table (id, type, original_key, preview_key, width, height, duration_seconds, created_at), unchanged | DEFINER | anon, authenticated | `created_at desc, id desc`; pass the last row's `created_at` and `id`; rows strictly after |
  | `get_event_like_counts(p_event_id uuid, p_after uuid = null, p_limit integer = null)` | table (media_id, like_count), LIKED media only | DEFINER, host-gated | authenticated | `media_id` ascending; pass the last `media_id` |
  | `my_liked_media_ids(p_media_ids uuid[])` | uuid[]: the caller's own likes among the ids, sorted, `{}` for none | INVOKER | authenticated | one value |
  | `event_card_stats(p_event_ids uuid[])` | jsonb `{ "<event id>": { "approved": n, "pending": n } }`, every non-null input id | INVOKER | authenticated | one value |
  | `event_covers(p_event_ids uuid[])` | jsonb `{ "<event id>": { "preview_key": text or null, "original_key": text } }`, an event with no approved photo absent | INVOKER | authenticated, service_role | one value |
  | `event_link_totals(p_event_id uuid)` | jsonb `{ "qr_scans": n, "album_views": n }`, zeros for a non-host | INVOKER | authenticated | one value |
  | `list_guest_rows_by_email(p_after_at timestamptz = null, p_after_id uuid = null, p_limit integer = null)` | table unchanged (guest_id, event_id, event_name, event_date, display_name, upload_count, last_upload_at, pending_email_at) | DEFINER | authenticated | `coalesce(last_at, created_at) desc, guest_id desc`; pass the last row's `last_upload_at` and `guest_id` (never null: every listed row has a live upload) |
  | `admin_metrics_snapshot(p_window_days integer = 30, p_fortnight_days integer = 14)` | jsonb: `as_of`, `window_days`, `fortnight_days`; `accounts.{total, new_in_window, active_in_window, new_in_fortnight, new_in_prior_fortnight, active_in_fortnight, active_in_prior_fortnight, paid, storage_used_bytes, by_tier {raw tier: n}, signups_by_day {YYYY-MM-DD: n}}`; `engagement.{qr_scans, album_views, by_day {YYYY-MM-DD: {qr_scans, album_views}}}`; `newsletter.by_source [{source (raw, nullable), count}]` | INVOKER | service_role | one value; a window under 1 raises 22023 |
  | `held_event_ids(p_event_ids uuid[])` | uuid[]: the input ids holding any held media, sorted, `{}` for none | INVOKER | service_role | one value |
  | `standby_hosts(p_after uuid = null, p_limit integer = null)` | table (host_id uuid, standby_bytes bigint), hosts with more than zero | INVOKER | service_role | `host_id` ascending; pass the last `host_id` |

  Plus `media_event_created_id_idx on public.media (event_id, created_at desc, id desc)`. `purge_media_rows` is
  unchanged. The authenticated-granted functions also keep service_role's default EXECUTE, as every existing one does.
- **Apply order:** 1 `20260924010000_row_cap_album.sql`, 2 `20260924020000_row_cap_host.sql`,
  3 `20260924030000_row_cap_sweeps.sql` (independent; this is the order proved). Each header carries its
  protocol: the drift md5s (live on 2026-09-24, each equal to its newest file: `get_event_media_by_qr_token(text)`
  `04252d11838c2d273461ac0fe8e33d68`, `get_event_like_counts(uuid)` `c2ca518640ae248c451a7263d7490600`,
  `list_guest_rows_by_email()` `efba056af25969e1ec9f2caa0956d9db`), the post-apply md5 of every new body (read
  off the pre-flight's `pg_proc`), the grants, the advisor delta (none: 15 / 5 / 32; the three replaced
  functions show their new argument lists), the rolled-back check at the foot, and `types.ts` regenerated. The
  deployed calls still type-check against it: with the three new `Args` shapes typed into `types.ts` for one
  run and reverted (no diff left), `tsc --noEmit` exited 0 (`tsc-with-regen-types.log`), the no-argument
  claim-card call included.
- **What each check needs from the live data** (all present on 2026-09-24): the scale probe (qr
  `d02631f1bfb3455188d224e41bf9510f`, more than 1,000 approved); a second profile; a confirmed account; at least
  three name-only guest rows with a live upload (15 today); three events, two of them with media (8 today); a live
  upload on an unclaimed guest row with its session token (the probe's guests). Each check writes only inside
  its own block (1,100 likes, a forced timestamp tie, pending addresses, the confirmed account briefly
  unconfirmed, 1,100 holds, a real `remove_my_upload_by_session`, a host and a system removal, a soft-delete)
  and ends in its raise.
- **Items:**
  - `20260924010000_row_cap_album.sql`: the album paged on (created_at, id), the event resolved as a scalar
    subquery so the index walks from the cursor (pre-flight, 51,210 rows in one event: a page of 1,000 read
    1,000 index entries, against all 51,210 rows and a sort through the join); the index; like counts liked-only
    on media_id; `my_liked_media_ids`.
  - `20260924020000_row_cap_host.sql`: card stats, covers and link totals as one jsonb each; the claim card
    paged; the operator's metrics as one jsonb, keys named from what `/admin` and `/admin/metrics` render.
  - `20260924030000_row_cap_sweeps.sql`: `held_event_ids`; `standby_hosts` with delete-final's rule in (a
    guest's own withdrawal never counts in the host's budget).
  - `src/lib/db/row-cap-sql.test.ts`: a drop-aware reader of every winning definition; each set-returning
    function pages (a keyset cursor, `p_limit`, the clamp equal to `supabase/config.toml`'s `max_rows`, the
    null-limit case) or sits on `SINGLE_ROW` or `CALLER_BOUNDED` with its reason; a stale entry fails.
  - `src/lib/db/migration-guards.test.ts`: pin group 12 (each new or replaced function's signature, security,
    search_path, grants and load-bearing clauses); the claim card's no-oracle pin moved to the new signature
    (no text parameter), its grants and its no-anon pin with it.
  - The deployed like-count readers all default a missing id to 0: `gallery-items.ts:72` (`?? 0`) is the only
    path from `getEventLikeCounts` to the three host pages, the reel builder (`reel-builder.tsx:84`) and the
    studio picker (`studio-moments-picker.tsx:66`; `:191` reads `?? 0`); `quick-add.ts:204, 233, 237` read `?? 0`.
  - **Local pre-flight** (Homebrew PG 17.10; a stand-in with the live column types, constraints, RLS policies,
    grants, default privileges and triggers, and the CURRENT bodies loaded verbatim, their md5s equal to live):
    each file applied verbatim and its check green (`check-{1,2,3}.local.log`); the deployed calls through
    `anon`/`authenticated` before and after (`deployed-calls-{1,2}.{before,after}.log`: the same album order, the
    same liked counts, the same claim-card set); `pg_get_functiondef` before and after (`functiondef/`). 29
    mutations of the SQL: 28 caught by the checks (the album tiebreak and the unconfirmed gate only after I
    strengthened the checks), the survivor an equivalent mutant (dropping the claim card's session gate changes
    nothing, the confirmation gate returns anyway); the Vitest pins fail on a dropped tiebreak, a bare `least`
    and a dropped withdrawal filter.
  - **Live rolled-back probe** (one `execute_sql`, `begin; … rollback;`, the files' executable statements
    verbatim through EXECUTE in exception blocks): all three applied; the deployed calls unchanged (the album
    1,145 rows in the same order; like counts 1,200 rows to 3, the same 6 likes and the same liked counts; the
    claim card the same 15 rows in the same order); every check "ROLLED BACK: every … check held"; the live
    catalog unchanged afterwards (`live-probe.result.log`, script `live-probe.ran-2026-09-24.sql`).
- **Assets requested from Will:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** the three migrations above, applied at the
  merge by the protocol; no Worker, Vercel, Stripe or env change.
- **Calls his to overrule:**
  - `admin_metrics_snapshot` takes the two windows as optional parameters (defaults 30 and 14, the pages'
    WINDOW_DAYS and FORTNIGHT_DAYS), so the windows keep one home in TypeScript; `admin_metrics_snapshot()` still works.
  - `by_tier` and `newsletter.by_source` carry RAW values; the reader folds them with `toBillingTier` and
    `countBySource`'s rule, so neither mapping gets a second home in SQL.
  - `getLinkStats` gets its own function, `event_link_totals(uuid)` (INVOKER over the host's RLS), not a fold.
  - A null `p_limit` reads everything on EVERY paged function, the new `standby_hosts` included: one rule (the
    bare `least` would give a new function a silent 1,000 in SQL).
  - The album resolves its event as a scalar subquery instead of the join (identical gates), for the index walk.
  - `event_card_stats` answers every non-null input id, zeros where nothing counts (the TypeScript's seeding),
    so another host's or an unknown id reads zeros rather than going absent.
  - The service-role-only helpers are SECURITY INVOKER, not DEFINER.
  - `my_liked_media_ids` takes any number of ids: it is owner-RLS scoped and the ids are the browser's visible set.
  - `row-cap-sql.test.ts` puts `get_event_by_qr_token` on SINGLE_ROW (qr_token is unique), keeps a
    CALLER_BOUNDED list for the two 200-item feeds, and asks for a keyset cursor beside `p_limit`.
  - The claim card's grant block revokes from `public, anon, authenticated` and grants back to authenticated
    (the drop-and-create form) where the old file revoked from `public, anon`.
- **Look at first:** `live-probe.result.log`, then each file's APPLY PROTOCOL header. At the apply: the
  performance advisor will likely list `media_event_created_id_idx` as unused (unused_index 7 to 8) until the
  album lanes page on it. For the cron lane: when it moves to `standby_hosts`, withdrawals leave the budget
  (the TypeScript bin counts them today, which the dashboard's over-budget warning already disagrees with).
