---
track: reel-teardown
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e13a98d6"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/api/reel/
  - src/app/admin/reels/
  - src/app/admin/exports/
  - src/lib/admin/nav
  - src/lib/admin/palette
  - src/lib/reel/render-service
  - src/lib/reel/upload-contract
  - src/lib/reel/own-event
  - src/lib/reel/guest-download-
  - src/lib/reel/render-hash
  - src/lib/reel/guest-reel
  - src/lib/reel/moment-picker
  - src/lib/db/queries/reel
  - src/lib/security/abuse-rate-limit
  - src/app/api/r2/complete-upload/
  - scripts/sweep-reel-files.mjs
  - src/lib/event/reel-progress
  - src/app/(app)/dashboard/[eventId]/reel/
  - src/app/(app)/dashboard/[eventId]/page.tsx
  - src/components/app/event-feed/reel-card
  - src/lib/dashboard/next-step
reads:                  # single-sources you depend on: never duplicate, never edit
  - supabase/migrations/20260924110000_live_reel_drop.sql
  - supabase/migrations/20260924100000_live_reel_expand.sql
  - src/lib/r2/keys.ts
  - src/lib/r2/delete.ts
  - src/lib/lifecycle/account-deletion.ts
  - src/lib/events/gallery-reel.ts
---

# lp/reel-teardown

**Goal.** End the stored reel's server side now that the live reel and the clip replace it: the render and download routes, the admin reels page and its switch, the old reel libraries and queries, the two reel limiter kinds, and the stored files through one deprecation window. Add the one limiter a clip needs and the admin switch for the live reel's platform lever.

## The brief

The model that replaces the stored reel: the highlight reel is live (it plays from the album, leaves no file, needs no host action) and a clip is the viewer's own file, made on their device; on a paid event a clip may be added to the album as an ordinary video with `reel_eligible = false`. Nothing is rendered or stored on a server any more.

**Delete**:
- `/api/reel/*` (render and download).
- `/admin/reels` with its nav entry and palette action (`src/lib/admin/nav.ts`, `palette.ts`) and the old `reel_render_enabled` switch.
- By name: `src/lib/reel/{render-service,upload-contract,own-event,guest-download-plan,guest-download-contract,render-hash,guest-reel,guest-reel-payload,moment-picker}` with their tests.
- `src/lib/db/queries/reel*` once their callers are gone.
- Every test that only held the deleted code up.

`reel-clip-wiring` runs beside you and deletes the stored reel's UI (the Studio under `src/components/reel/`, the guest's stored-reel card and overlay, the lightbox's Add to reel); you merge after it, synced past it, so anything the UI still imports from your set is gone by your merge. When a file outside your owns must change for a deletion (a stray import, a test fixture, a jobs or metrics row), make the smallest edit and list it in the Handoff as an exception to decide.

**The limiter.** The kinds `reel_render` and `reel_guest_download` leave `src/lib/security/abuse-rate-limit.ts`; one kind comes in, `reel_clip_add`, a daily budget per guest session for adding a clip to the album, enforced where a guest's clip arrives (`src/app/api/r2/complete-upload/route.ts`, the upload whose `reelEligible` is false). The host adds through the host route and is metered by storage, never this budget. Size the budget for a real guest (a handful of clips a night) and refuse with the route's existing shape.

**The platform lever.** `ops_flags.live_reel_enabled` (seeded by the expand, read by the gallery payload) gets its admin switch beside the exports switch (`src/app/admin/exports/`), the same shape and audit as that switch; off means no tile, no view, no screen and no Make your own anywhere. The guest lane's reports ("live reel: frames failing", one Sentry report per view) get a pointer from that card. The host's side ignores the lever today (the host lane's deferral): with it off, the event page's Reel card, the What needs you band's reel step (`src/lib/dashboard/next-step.ts`) and `/dashboard/[eventId]/reel` still treat the reel as live and open an album with no reel. Make `reelState` (`src/lib/event/reel-progress.ts`) take the lever, read server-side as the guest's payload reads it (`guest-events-admin.ts`), so all three say the reel is off. Fold `REEL_MINIMUM` into the guest's `LIVE_REEL_MINIMUM` (`src/lib/events/gallery-reel.ts`, read-only for you): one number, one home.

**The stored files' end.**
- `reelOutputKey`, the purge cron's append and `account-deletion.ts`'s append all stay through one deprecation window, untouched.
- Write `scripts/sweep-reel-files.mjs`: a one-shot sweep over `listR2Objects` that deletes every `events/<id>/reel/reel.mp4` through `src/lib/r2/delete.ts`, dry by default with a count, `--apply` to delete, and its own summary.
- The Orchestrator runs it after the drop migration (Will's yes). The commit that removes the helper and both appends comes only after that sweep reports zero, in a later lane.

**The drop migration** (`supabase/migrations/20260924110000_live_reel_drop.sql`) is already written and waits for build 9's red-team and Will's yes; do not edit or apply it. Nothing you ship may call what it drops: the five reel RPCs, `reel_items`, `reel_render_log`, `highlight_reels`, the `reel_status` enum, `notification_prefs.notify_reel_ready`, the `reel_render_enabled` flag.

You own no system doc: put the facts a doc should carry (what the lever does, the limiter's budget, the sweep) in your Handoff, and `reel-sweep`, which births `docs/systems/reel.md` and merges last, writes them.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole; `git grep` finds no import of a deleted module and no call to a dropped RPC or table; the limiter's budget and refusal in a route test; the lever's switch flips `ops_flags.live_reel_enabled` on a local admin session and the gallery payload follows; `node scripts/sweep-reel-files.mjs` dry against the real bucket prints its count and deletes nothing.

## Questions (a recommended answer each; the Orchestrator relays them)

- **The clip-add limiter's shape.** Every sibling kind in `abuse-rate-limit.ts` scopes by event (a
  venue behind one NAT is one legitimate flood); `reel_clip_add` scopes by the guest's own session
  token instead, a 24h window, cap 10, breadth disabled. Built this way because the brief asks for a
  budget per GUEST, not a shared venue envelope a handful of enthusiastic uploaders could drain for
  everyone else at the same party (`abuse-rate-limit.ts`'s WHY-comment on the kind). Overrule: fold it
  back to event-scoped like its siblings, or retune the 10/day ceiling, once real usage is seen.
- **The lever's "off" reads identically to the host's own switch off.** `reelState` collapses both
  causes into the one existing `"off"` `ReelCardData` state — a host whose reel goes dark from an
  operator's platform pause sees the same card as if they had flipped their own switch, and taps into
  their own (powerless, in that moment) Settings toggle. Built this way for the simplest correct
  answer within scope (a fourth state distinguishing "paused by the platform" was not asked for).
  Overrule: give the platform-paused case its own copy or state if operators expect a host to notice
  within the incident window.

## System-doc edits (in place, owned facts only)

- none: this lane owns no system doc (`docs/tracks/reel-teardown.md`'s header); every fact a doc
  should carry is below, for `reel-sweep` (merges last, births `docs/systems/reel.md`) to fold in.

## Deferred (ROADMAP one-liners, bucket named)

- Now: once the drop migration lands and `node scripts/sweep-reel-files.mjs` (no flag) reports zero,
  remove `reelOutputKey` (`src/lib/r2/keys.ts`), the purge cron's append and
  `src/lib/lifecycle/account-deletion.ts`'s append (this lane's deprecation window; the sweep already
  reports 1 — see Handoff below).
- Now: ROADMAP's existing ["Reel: `get_event_reel_by_qr_token` orders its item ids by `(position,
  added_at)` with no `media_id` tiebreak..."] line is now moot (its own text said so: "moot if the
  reel round drops the stored reel first") — `listReelItems` and `resolveReelRenderContext`, the two
  readers it named, are both deleted by this commit. Safe to delete the line.

## Handoff (replaces the chat report)

- Work commit `a35e6f79` (`reel-teardown: end the stored reel's server side, wire the live reel's
  lever`), pushed to `lp/reel-teardown`. Sync commit `b163c7c7` (`Merge remote-tracking branch
  'origin/launch-prep' into lp/reel-teardown`, clean, no conflicts) once the Orchestrator merged
  `reel-clip-wiring` (`38edc265`) and told this lane to sync past it. One more work commit after the
  sync, `7b0511fa`, for the orphaned-module exception below. Head: `7b0511fa`. This manifest update is
  a further, separate commit on top, per Agent boot.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = every owned path touched, this file,
  and four exceptions outside `owns` (why, below) — no fifth file, no sibling lane's path.
- **The merge-order gap in the first handoff is closed.** That version of this Handoff reported 8
  `TS2307` errors (typecheck and build both) confined to five files inside `reel-clip-wiring`'s
  `owns`, exactly as both manifests' "merge after, synced past it" language anticipated. Syncing past
  `38edc265` resolved every one with no edit from this lane: see Gates below, now fully green.

### Deletions (by name, all with their tests)
`src/app/api/reel/{upload,download}/route.ts`; `/admin/reels` whole (`page.tsx`, `actions.ts`,
`reel-render-kill-switch.tsx`) plus its `nav.ts` entry and `palette.ts` action; `src/lib/reel/
{render-service,upload-contract,own-event,guest-download-plan,guest-download-contract,render-hash,
guest-reel,guest-reel-payload,moment-picker}`; `src/lib/db/queries/{reel,reel-renders}.ts`.

### The limiter
`reel_render` and `reel_guest_download` are gone from `AbuseKind`/`ABUSE_LIMITS`
(`src/lib/security/abuse-rate-limit.ts`); `reel_clip_add` replaces them (session-scoped, 1440 min
window, cap 10, breadth `Infinity` — see the Question above for why the shape differs from every
sibling). Enforced in `src/app/api/r2/complete-upload/route.ts`'s guest strategy: a cloned-body peek
gates any completion whose `reel_eligible === false` BEFORE the pipeline writes, and records the
budget hit only after a genuine 2xx (a refused or ordinary non-clip completion never touches the
counter). Tested: `route.test.ts`'s new `"the clip-add limiter (reel_clip_add)"` block (4 cases:
checks + records on a real write, refuses before any write once spent, never touches an ordinary
upload, never counts a write the pipeline itself refused); the kind's own thresholds pinned in
`abuse-rate-limit.test.ts`.

### The platform lever
`ops_flags.live_reel_enabled` gets an admin switch beside "Download all"
(`src/app/admin/exports/{page.tsx,actions.ts,live-reel-kill-switch.tsx,live-reel-status.ts}`; Card
`id="live-reel"`, `GuardedSwitch` + `DestructiveSheet`, same shape/audit as `ExportKillSwitch`); the
palette's `action-reels` became `action-live-reel` pointing at `/admin/exports#live-reel`
(`nav.ts`/`palette.ts`/`palette.test.ts` updated to match). The card's description points an operator
at the guest lane's Sentry report ("live reel: frames failing", area `reel`) for playback errors, so
"the reel looks broken" and "the reel is off" are not confused at a glance.

`reelState`/`hubReel` (`src/lib/event/reel-progress.ts`) now take `liveReelEnabled` and outrank the
host's own switch with it silently (one `"off"`, not a fourth state — see the Question above);
`src/lib/dashboard/next-step.ts`'s `NextStepEvent` carries the same fact. Read fresh, server-side, via
the existing `getLiveReelServerFacts` (`db/queries/guest-events-admin.ts`, unedited) at both call
sites this lane owns (`dashboard/[eventId]/page.tsx`, `dashboard/[eventId]/reel/page.tsx`) — the exact
function the guest gallery payload already reads, so the host's Reel card, the "What needs you" band
and the old `/reel` redirect can never disagree with what a guest actually sees. `REEL_MINIMUM` is now
a straight alias of `gallery-reel.ts`'s `LIVE_REEL_MINIMUM` (read-only import, not a second constant).
Read-only, live confirmation (Supabase MCP, `select` only, nothing written): `ops_flags` holds
`live_reel_enabled = true`, seeded 2026-09-24 — the exact key my code reads and writes.

### The sweep
`scripts/sweep-reel-files.mjs`, dry by default (`--apply` to delete), mirrors
`src/lib/r2/delete.ts`/`listR2Objects`'s semantics (that module is `server-only` and cannot be
imported from a plain script, like `backfill-strip-exif.mjs` already works around). Dry run against
the REAL bucket: `Found 1 stored reel .mp4(s), 5,286,754 bytes total` —
`events/2485e1e6-12b1-4d02-aee3-1e2bb5d38d4f/reel/reel.mp4`, the exact object the drop migration's own
inventory comment names (the "Partyreel Demo" event); `errors: 0`, nothing deleted. `reelOutputKey`,
the purge cron's append and `account-deletion.ts`'s append are untouched, per the deprecation window
(see Deferred above for when they go).

### The orphaned-module exception (new, post-sync)
The Orchestrator's sync instruction named it directly: `src/lib/reel/client-encode-budget.ts` (+ its
test) lost its last reader when `render-service.ts` went (`a35e6f79`) — `reel-clip-wiring`'s own merge
(`38edc265`) had already removed the OTHER reader (the guest overlay). `git grep -l
"client-encode-budget"` after the sync showed only the module's own test file. Owned by no live lane
now, so deleted here (`7b0511fa`) as the decided exception the Orchestrator asked for rather than left
dead in the tree.

### Gates, each on its own exit code, all on the synced tree at `7b0511fa` (formatted first)
- `pnpm typecheck`: **green**, zero errors. The prior Handoff's 8 `TS2307` errors are gone — every one
  was a `reel-clip-wiring`-owned file importing a module this lane deletes, and syncing past their
  merge removed the importers.
- `pnpm lint`: green, 0 errors. Still the same 6 pre-existing warnings in files this lane never
  touched (`review-session.tsx`, `home-hero/shared.tsx`, `contact-form.tsx`, `album-fill-grid.tsx`,
  `review-switch.tsx`) — not this lane's per CLAUDE.md's "a warning in a file you touched is yours."
- `pnpm test`: green, **459/459 test files, 5027/5027 tests** (up from 441/4839 pre-sync: the merge
  brought in `reel-clip-wiring`'s and other batch-3 lanes' own tests).
- `zsh scripts/build-lock.sh pnpm build`: **green** — Turbopack compile, `runAfterProductionCompile`
  and the TypeScript step all passed.
- `pnpm lab:smoke --base http://localhost:3132`: green, **281 checks, 0 failing** (re-run against the
  restarted dev server on the synced tree). The one non-200 in the raw log (`/design/boom` → 500) is
  `src/app/(dev)/design/(shell)/lab/tools/boom/page.tsx`, a PERMANENT intentional boundary probe
  ("design-lab boundary probe: intentional render crash (not a real failure)") — pre-existing,
  unrelated, not a regression.
- `git grep` sweep, re-run on the synced tree, for the five dropped RPCs, the three dropped tables,
  the two dead limiter kinds and every deleted module's path (`client-encode-budget` included): every
  hit is `src/lib/db/types.ts` (generated, untouched until the drop applies), the migration-guard/
  row-cap tests (scan migration SQL text directly, never import my TS), or a doc-comment mentioning a
  column/table/file name for context (`r2/keys.ts`, `engine/style-registry.ts`, `engine/themes.ts`,
  `scripts/seed-demo-event.mjs`, this lane's own `media.test.ts`) — zero live imports or calls
  anywhere, `reel-clip-wiring`'s former files included (they are gone, not just fixed).
- The limiter's budget and refusal: `complete-upload/route.test.ts` (above).
- The lever's switch + the gallery following it: **not click-tested live.** Admin sign-in is
  alias-only (`testing-verification.md`: "typing a password or a code never is," Google-chooser only,
  TOTP for `partyr33l@gmail.com`) and, more to the point, the `launch-prep` alias does not yet serve
  this lane's code at all (no push deploys an `lp/*` branch) — there is no build anywhere a real signed
  -in admin could click this new switch before the Orchestrator integrates it. Verified instead: the
  pure lever logic (`reel-progress.test.ts`'s new cases), a read-only live confirmation the flag exists
  under the exact key (above), and that `getLiveReelEnabled`/`toggleLiveReelAction`/
  `LiveReelKillSwitch` are byte-for-byte structural mirrors of the already-shipped, already-live-tested
  `getExportEnabled`/`toggleExportsAction`/`ExportKillSwitch`. **Recommend this ride the integration's
  own red-team pass** (flip it on the alias once this lane's code is actually there, confirm a guest
  album's tile/view/screen and Make your own all disappear, flip it back).
- `node scripts/sweep-reel-files.mjs` dry, against the real bucket: above (found 1, deleted 0).

- Assets requested from Will: none.
- Board ideas: none beyond this lane.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule, one line each:
  - The clip-add limiter is scoped per guest session (cap 10/day), not per event like its siblings.
  - An operator's platform pause and a host's own switch-off render as the same "Off" Reel card.
- Look at first:
  1. This lane is synced past `reel-clip-wiring` (`38edc265`) and the gate is fully green on
     `7b0511fa` — safe to merge whenever it suits the queue; no further merge-order dependency.
  2. Red-team the live-reel admin switch on the alias as a signed-in admin once this lane's code
     actually reaches it (it could not before: see Gates above) — the one piece of this Handoff
     resting on mirrored code + unit tests rather than a live click. Confirm the switch flips
     `ops_flags.live_reel_enabled` and a guest album's tile/view/screen and Make your own all
     disappear, then flip it back.
  3. `docs/tracks/reel-sweep.md`'s Handoff needs: the limiter's shape/budget, the lever's switch
     location and behavior, and the sweep's dry-run result, all written out above for its
     `docs/systems/reel.md`.
  4. Four small exceptions outside this lane's `owns`, all minimal, all keeping the tree green:
     - `src/app/(app)/dashboard/page.tsx`: threads `liveReelEnabled` into every mapped
       `NextStepEvent` (one `getLiveReelServerFacts` call, read once since the lever is one global
       fact, not per-event, with `.tier` discarded) — required by this lane's own brief ("so all
       three say the reel is off"); `next-step.ts` alone cannot fabricate a fact its caller never
       fetches.
     - `src/lib/db/queries/media.test.ts`: one test imported `resolveReelRenderContext` from the now-
       deleted `render-service.ts` to pin a withdrawal-safety invariant twice (TS + SQL); removed the
       TS half (the invariant now lives only in the live reel's own tests) and kept the SQL half,
       which is independent of the deleted code. Left its now-unread `highlight_reels`/`reel_items`
       fixture rows in place rather than pruning someone else's fixture beyond what broke.
     - `src/lib/dashboard/viewer-day.test.ts`: the same new required field added to one fixture
       object — mechanical, no judgment call.
     - `src/lib/reel/client-encode-budget.ts` (+ its test): the Orchestrator's own sync instruction,
       above — orphaned by this lane's deletion plus `reel-clip-wiring`'s merge together, owned by
       no live lane, deleted as a decided exception rather than left dead.
