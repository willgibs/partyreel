---
track: reel-defaults-migration
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "242e0bf4"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/20260925100000_reel_host_defaults.sql
  - src/lib/db/migration-guards.test.ts
  - src/lib/db/mutations/events
  - src/lib/validation/event
  - src/lib/reel/defaults
  - docs/systems/database-security.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - supabase/migrations/20260924100000_live_reel_expand.sql
  - supabase/migrations/20260924020000_row_cap_host.sql
  - docs/reviews/reel-host.json
  - src/app/(dev)/design/sandbox/reel-host/spec.ts
  - src/lib/reel/engine/style-registry.ts
  - src/lib/db/read-all.ts
---

# lp/reel-defaults-migration

**Goal.** Give the host's reel its event-wide defaults and the dashboard's event cards their stills: one additive migration, its guards, and the write path both the reel view and Settings will call. Will picked `reel-host.style=both`: a host sets the reel's look and hold for everyone, from the view ("Set for everyone") and from a Highlight reel section in Settings. `events.reel_style_id` already exists; the hold needs a column. His dashboard crossfade needs a few stills per event, where `event_covers` returns one.

## The brief

**The SQL** (`supabase/migrations/20260925100000_reel_host_defaults.sql`; additive only; the Orchestrator applies it through the Supabase MCP):
- `events.reel_hold_sec numeric` (NULL means the default hold), a column comment, and the column grant the expand's precedent uses (`grant insert (reel_hold_sec), update (reel_hold_sec) on public.events to authenticated`), no table-level grant.
- `get_event_by_qr_token(text)` dropped and re-created from its newest definition (the expand) to return `reel_hold_sec` last. The QA #40 redaction and `limit 1` carry over verbatim, and the whole ACL is restated (`to public, service_role`), as `migration-guards.test.ts` requires of a latest definition; update the guards that pin the expand's tail.
- `event_stills(p_event_ids uuid[], p_per_event int)`: security invoker (RLS decides what a caller sees), returning up to N recent approved, visible photos per event (the event id and the preview key), within the row-cap rules (`docs/systems/database-security.md`, `src/lib/db/read-all.ts`). Revoke EXECUTE from `anon` explicitly: a function created through the MCP inherits it (CLAUDE.md's ★).
- A rolled-back check block at the foot, the expand's precedent: the column and its grant; the RPC's new key with the redaction intact; `event_stills` returning at most N per event for the owner and nothing for anon or another host.

**The checkpoint.** Commit the SQL and the guards, push, and end your turn with one line: "SQL ready at <sha>". The Orchestrator applies it, regenerates `src/lib/db/types.ts` on launch-prep and messages you. Then merge `origin/launch-prep` and finish on the new types.

**The write path** (after the types):
- `src/lib/reel/defaults.ts`: the hold steps (1, 1.5, 2.2, 3, 3.6, 5 and 7 seconds; 3 by default) in their one home, and pure validation (a style id against the mood catalog, a hold against the steps). The held guest lane holds a copy (`HOLD_STEPS_SEC`) that it replaces with an import once you merge.
- `updateEvent`'s reel fields (`show_reel`, `reel_style_id`, `reel_hold_sec`) and their validation in `src/lib/validation/event`.
- One owner-checked Server Action in `src/lib/reel/defaults-action.ts` (`setReelDefaults({ eventId, showReel?, styleId?, holdSec? })`): it re-verifies with `auth.getUser()` and relies on RLS and the column grant. It serves both the view's "Set for everyone" and the Settings section. Tests: the validation, and the action's refusals (signed out, not the owner, an unknown style, a hold off the steps).
- `database-security.md`: the new column among the unredacted ones, and `event_stills` in the inventory.

Nothing renders anywhere yet: the guest lane (the view) and the host lane (Settings, the cards) call these after you merge, which happens before either of them.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each on its own exit code; `migration-guards.test.ts` green on the new latest definition; the rolled-back block in the SQL runs clean when the Orchestrator applies it (he runs it and `get_advisors`); the validation and action tests.

## Questions (a recommended answer each; the Orchestrator relays them)

- **The hold gets an envelope CHECK, beyond the brief.** Built: `events_reel_hold_sec_range`, NULL or 0.5 to 30 s. The column is host-writable by grant, so a direct PostgREST write skips the app's step check, and every guest device plays what it holds; the envelope refuses a flicker, a stall, NaN and Infinity (NaN sorts above every number, so the upper bound is what catches it), while the steps (1 to 7 s) still change with no migration. Overrule: no CHECK, each reader snapping to the nearest step.
- **`event_stills` answers one jsonb, not rows.** Built: `{ "<event id>": ["<preview key>", ...] }`, newest first. Rows of (event id, preview key) would be a set-returning function with no `p_limit`, which `row-cap-sql.test.ts` refuses unless it pages; one jsonb carries the same two facts, the way `event_covers` does. Overrule: a paged table.
- **Stills are previews only.** Built: a photo with no preview is passed over and the next previewed one takes its place; an event with none is absent and its card keeps its `event_covers` cover (which falls back to the original). Overrule: fall back to originals too (tens of MB on a phone for a page of cards).
- **The clamp.** Built: `p_per_event` is clamped to 0..12 (twice the guest tile's six slots); a null or non-positive N answers `{}`, never everything. Overrule: another ceiling.

## System-doc edits (in place, owned facts only)

- `docs/systems/database-security.md`: `reel_hold_sec` joins `get_event_by_qr_token`'s unredacted fields ("its switches and the reel's defaults"); `event_stills` named under "SECURITY INVOKER is the default for a new read" (authenticated-only, another host's event absent, only granted media columns).

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- **Commits**, all pushed on `lp/reel-defaults-migration`: `3e51d6a2` the migration and its guards; `ea6208fb` the SQL's four calls under Questions (the "SQL ready" checkpoint); `368c5d0c` the sync, merging `origin/launch-prep` at `d375f520` (the applied migration's regenerated types); `5a3e5456` the write path; the head is this manifest commit. launch-prep has not moved since `d375f520`.
- **Gates on `5a3e5456`** (the synced tree), each on its own exit code: `pnpm typecheck` 0; `pnpm lint` 0 (0 errors; its 7 warnings all sit in files this lane never touched); `pnpm test` 0 (429 files, 4,622 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3132` 0 (290 checks, 0 failing). No board, so no `lab:demo`.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the 11 owned paths + this file, no exceptions.
- **The migration** (`supabase/migrations/20260925100000_reel_host_defaults.sql`, applied at `d375f520`'s regeneration): `events.reel_hold_sec` numeric (NULL = the default hold) inside `events_reel_hold_sec_range` (NULL or 0.5 to 30 s) with a bare column grant; `get_event_by_qr_token` = the expand's body plus the hold, last and unredacted, its whole ACL restated; `event_stills(uuid[], integer)`, SECURITY INVOKER, one jsonb `{ event id: [preview_key, ...] }` of each event's newest approved, non-removed, previewed photos, clamped to 0..12, authenticated-only. Its rolled-back check held on the live schema before the apply (md5s `52a56b21` and `f0d4e91b` in its header, the catalog unchanged afterwards), and again in the Orchestrator's apply.
- **Live after the apply**, as anon with the public key: `get_event_by_qr_token` on the scale probe answers 17 keys ending `show_reel, reel_style_id, reel_hold_sec`, with `reel_hold_sec: null`; `event_stills` answers 42501 "permission denied for function event_stills"; a PATCH of `events.reel_hold_sec` answers 42501. The probe's guest page renders 200 on the new payload locally.
- **The guards** (`src/lib/db/migration-guards.test.ts`, item 14): the column, its envelope and bare grant (no revoke on events, no anon grant); the recreate IS the expand's definition with only the hold appended (compared character for character, so QA #40 and `limit 1` cannot drift); the hold last; drop before create and both ACL grants; `event_stills`' signature, INVOKER mode, predicates, clamp, grants, never anon, and that it names only media columns the replayed host SELECT grant holds. The expand's two tail pins now stop before the hold, reshaped on purpose and saying so. Ten deliberate breakages of the SQL each failed them.
- **`src/lib/reel/defaults.ts`**: `HOLD_STEPS_SEC` and `DEFAULT_HOLD_SEC` under the names the guest lane's copy uses (`src/lib/guest/reel-prefs.ts`), so its swap is an import; `REEL_MOOD_IDS` (the catalog's eight moods); `isHoldStep`, `isReelMoodId`; `nearestHoldStep` (the guest lane's semantics, importable too); `resolveHoldSec`, which reads null as the default and never as the 1 s step, for the RPC's `reel_hold_sec` (typed `number`, NULL until a host sets it). `defaults.test.ts` reads the envelope off the migrations and holds every step inside it.
- **`validation/event.ts` and `updateEvent`**: `show_reel`, `reel_style_id` (a mood or null) and `reel_hold_sec` (a step or null) join `updateEventSchema` only (a create strips them); `reelDefaultsInputSchema` is the action's input, unknown keys stripped; `updateEvent` patches the three as sent (`events.test.ts`).
- **`src/lib/reel/defaults-action.ts`**: `setReelDefaults({ eventId, showReel?, styleId?, holdSec? })` answers `{ ok: true, defaults: { showReel, styleId, holdSec } }` (what the row now holds) or a refusal coded `validation`, `unauthorized` or `unknown`. The input is refused before a session is read; `updateEvent` re-verifies with `auth.getUser()`; RLS and the column grant are the owner check; only the three columns are writable; it revalidates nothing (every reader renders per request, and from the view a `revalidatePath` would re-render the presign-heavy album under a playing reel). `defaults-action.test.ts` runs through the real `updateEvent`: signed out, not the owner (PGRST116), an unknown or treatment look, holds off the steps, hostile types, an empty save, each save's patch, extra keys dropped. Five deliberate breakages of the write path each failed its tests.
- **For the next lanes:** the guest lane reads the host's hold with `resolveHoldSec(row.reel_hold_sec)` and imports `HOLD_STEPS_SEC`, `DEFAULT_HOLD_SEC` and `nearestHoldStep` in place of its copies; the host lane reads `event_stills` on the user's client and presigns each key server-side (as `readCoverUrls` does), and calls `setReelDefaults` from Settings.
- **Not verified live:** `setReelDefaults` itself, since nothing calls it yet and a session cannot be driven without a surface. Its SQL half held in the live rolled-back check (the host's write lands, another host's matches no row, anon is refused, the envelope refuses 0.4, 0, -1, 31, NaN, Infinity and -Infinity); the first lane that wires the action red-teams it on the alias.
- Assets requested from Will: none
- Board ideas: none
- Proposed migrations / Worker / Vercel / Stripe / env changes: none (the one migration is applied)
- Calls his to overrule: the four under Questions (the envelope CHECK, jsonb stills, previews only, the clamp at 12)
- Look at first: the migration's section 3 (`event_stills`) and its rolled-back check, then `src/lib/reel/defaults-action.ts`'s header
