---
track: crumbs-91
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "c04da309"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/shared/album-order.ts
  - src/lib/shared/album-order.test.ts
  - src/lib/event/zone-morning.ts
  - src/lib/event/zone-morning.test.ts
  - src/components/guest/gallery-order.ts
  - src/components/guest/gallery-order.test.tsx
  - src/lib/event/hub-album.ts
  - src/lib/event/hub-album.test.ts
  - src/app/(guest)/e/[token]/page.tsx
  - src/components/guest/event-experience.tsx
  - src/app/(app)/dashboard/[eventId]/as-guest.server.ts
  - src/app/(app)/dashboard/[eventId]/as-guest.server.test.ts
  - src/components/app/share/as-guest-view.tsx
  - src/components/app/share/as-guest-view.test.tsx
  - src/lib/security/abuse-rate-limit.ts
  - src/lib/security/abuse-rate-limit.test.ts
  - src/app/api/r2/presign-upload/
  - src/components/guest/file-dropzone.tsx
  - src/components/app/host-upload.tsx
  - src/components/app/host-upload.test.tsx
  - src/components/app/event-settings/settings-state.tsx
  - src/components/app/event-settings/settings-state.test.tsx
  - src/components/app/event-settings/settings-state-unpark.ts
  - src/components/app/event-settings/settings-state-unpark.test.tsx
  - src/app/(dev)/design/(shell)/lab/tools/motion/motion-playground.tsx
  - scripts/compute-model/
  - src/lib/guest/device-tickets.test.tsx
  - src/lib/guest/use-welcome-seen.ts
  - src/lib/guest/use-welcome-seen.test.tsx
  - src/components/app/event-card.tsx
  - src/components/app/event-card.test.tsx
  - src/components/app/event-card-qr.tsx
  - src/app/(dev)/design/(shell)/library/compositions/gallery-demos.tsx
  - src/lib/shared/tile-size-cookie.ts
  - src/lib/shared/tile-size-cookie.test.ts
  - src/lib/event/zone.server.ts
  - src/app/(dev)/design/(shell)/library/compositions/pricing-demos.tsx
  - src/components/app/pricing/leave.ts
  - src/lib/db/mutations/events.ts
  - src/lib/db/mutations/events.test.ts
  - supabase/migrations/20261008030000_crumbs_91.sql
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/ROADMAP.md
  - docs/systems/guest-flow.md
  - docs/systems/database-security.md
  - docs/systems/host-app.md
  - docs/systems/billing-caps.md
  - docs/systems/lifecycle-recovery.md
---

# lp/crumbs-91

**Goal.** Will's AY1 answer wired (an album's order turns at her close, never on a date), and Immediate's small lines no wiring lane takes, each fixed at its source.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3138 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**First, Will's answer to call AY1 (2026-10-07, in chat; the Immediate line "Guests: an album's order turns when its host closes adding, never on a date"):** today the album turns from newest first to the night in order at 9 am the morning after its last day or at its develop (`lib/shared/album-order.ts`'s `albumTurnAt`, the page's `guestAlbumOrder`, the browser's `gallery-order.ts`), and an undated album never turns. His keepsake note: "we need to be very careful about how we're flipping event UI after an event ends ... let's say I create an event for a trip with friends and I simply put in a single date on there, but wanted to stay open for the entire week." So the turn becomes the album's state: it reads in order once its host closes adding (`accepting_uploads` false, the closed state the guest sync already sends live) and newest first while it is open; reopening turns it back; an undated album turns the same way; a Disposable's develop, her own chosen moment, still turns its album (the Orchestrator's call, his to overrule); the demo never turns; her own chosen order still wins (`pr_album_sort`). One moment for every reader still holds (PRD: "One moment for every guest"). The host's Sort follows the same rule (`hub-album.ts`). Rewrite guest-flow.md's "The album's order turns" lines in place; the `morningAfter` instant stays only where something else reads it.

**Then Immediate's lines (each quoted by its opening words in `docs/ROADMAP.md`; the Orchestrator retires each at your record):**
1. "Auth: around 19:19Z on 2026-10-06": a read; try once to reproduce, and if it does not, say what you checked in a line (the Orchestrator moves it on).
2. "QA hardening: a per-guest `presign` abuse kind".
3. "Host: `guest/file-dropzone.tsx` is rendered only by the host's manual add" (move it to the host's side; claim its new path in your manifest at boot).
4. "Dashboard: the Table at 375 shows no needs-you dot" (find the Table's row; claim it at boot).
5. "Settings: her own \"An email first\"" (the `events_email_held` trigger: a migration, below).
6. "Settings: the save's nudge (`settings-state-unpark.ts`)".
7. "Storage sums: the restores take their rows without waiting" (NOWAIT and SKIP LOCKED: the migration, below).
8. "Design: Settings' radio cards are each a Tab stop" (claim the radio group's file at boot).
9. "The lab and the kit: `pnpm compute:model`'s lab-demo scenario reads 24.5 calls".
10. "The lab: the motion playground".
11. "Code hygiene: `device-tickets.test.tsx` still pins the welcome".
12. "Code hygiene: `EventCard`'s dashboard-only props".
13. "Code hygiene: drop `resolveRowStep`'s legacy pixel-width mapping".
14. "Code hygiene: five stale comments" (all but `server-pipeline.ts:544`, no-signal-wiring's).
15. "Code hygiene: retire crumbs-88's typed seam".
16. "Host: pin See it as a guest's two new facts in its own tests" (`as-guest.server.test.ts` and `as-guest-view.test.tsx`).
A file a line needs that your manifest lacks: claim it in your manifest at boot (`src/lib/track-manifests.test.ts` refuses a path another lane owns; then it is an exception, listed with why).

**The migration, one file for lines 5 and 7:** **The migration, `supabase/migrations/20261008030000_crumbs_91.sql`:** start from `restore_media`, `let_back_in` and the `events_email_held` trigger function's newest definition in `supabase/migrations/` (never from memory) and follow `docs/systems/database-security.md`'s Workflow and checklist (grants revoked from public before they are granted exactly; the migration guards; its pre-flight on a throwaway local cluster). Prove it on the live schema inside `begin; ... rollback;` in one `execute_sql` call (that doc's recipe: the proof commented at the file's foot, RED then GREEN), and never apply it: the Orchestrator applies it through the Advisor and the protocol after your handoff, so your Handoff names the file's md5 and every caller. partyreel.com's live build (milestone 39) shares this database, so the change must leave that build working (an expand where a signature or behaviour changes; the header names what that build sees meanwhile: PROGRAM's "Before launch there are no real users").

**`as-guest-view.tsx`'s `GuestBar`:** create-wizard-wiring-2 may list a one-line exception there (its corner says "Make one like this"); leave that line to it.

**Lanes running beside you (never edit their paths; a line you need there is an exception in your Handoff, with why):** brand-marks-wiring (`globals.css`, `theme.css`, the marks, `badge.tsx`), create-wizard-wiring-2 (Create, readiness, the checklist, `settings-rows.tsx`, the hub's `page.tsx`, the guest header and name menu), no-signal-wiring (the upload queue, `components/guest/upload/`, the roll's counting files), guests-room-wiring (`dashboard/[eventId]/guests/`, `guest-peek.tsx`), account-moments-wiring-2 (FollowButton, RelationToggle, Connections, `/me`, `u/[slug]/`), crumbs-91 (the album's order, the guest page, `event-experience.tsx`, `as-guest*`, Immediate's lines), and the boards event-page-r1 and brand-marks-r2 (their folders).

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`. Verify what your change adds antagonistically (its error cases, malformed input, and the cross-tenant and abuse paths of anything that reaches data), walking your own new paths once at 375 and 1440 and reading the page's text and state before a screenshot; the wide walk across surfaces, themes and assistive settings is the milestone red-team's. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired. A Handoff states what the Orchestrator needs to integrate and record, never an essay.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, each naming its bucket and area)

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
- Calls for Will: only a decision built in that he cannot see by using the product (plans, billing and renewals; lifecycle and timing; deletion, retention and privacy; safety and moderation; what the product does on its own), one line each, or none. A design, wording or flow choice is never one: production and the lab show it
- Look at first: ...
