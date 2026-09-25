---
track: reel-defaults-migration
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
