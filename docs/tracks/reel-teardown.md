---
track: reel-teardown
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

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
