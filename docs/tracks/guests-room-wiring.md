---
track: guests-room-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "c04da309"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(app)/dashboard/[eventId]/guests/
  - src/components/app/event-blocks/blocked-section.tsx
  - src/components/app/event-blocks/blocked-section.test.tsx
  - src/components/social/guest-peek.tsx
  - src/components/social/guest-peek.test.tsx
  - src/components/app/event-blocks/credit-look.tsx
  - src/components/app/event-blocks/credit-look.test.tsx
  - src/lib/db/queries/guest-look.ts
  - src/lib/db/queries/guest-look.test.ts
  - supabase/migrations/20261008020000_guest_look.sql
  - src/app/(dev)/design/sandbox/guests-room/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/guests-room.json
  - docs/systems/host-app.md
  - docs/systems/profiles-social.md
  - docs/systems/database-security.md
  - src/components/social/guest-list.tsx
---

# lp/guests-room-wiring

**Goal.** The Guests room and a person's card as Will picked at guests-room r1: one calm row for every person, and a card from every name holding who they are, their photos and their standing tonight.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3134 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**From Will's batch (2026-10-07; `docs/reviews/guests-room.json` round 1; the board draws both on the room as wired):**
- **`rows=list`:** every person one row, wherever they stand (at the door, a guest, invited, blocked): face, name, how they stand, its one act at the end; the door's count wears the tally (`--needs-you`). With the card below, the door's Decline leaves the row, so each row keeps one act (Let in at the door).
- **`card=standing`:** the card every name opens (in the room, the album's guest list, a photo's credit): who they are, four of their photos and See all (the album filtered to that guest), Follow and their page kept quiet, Block last; plus, for the host, how they stand tonight and its act (Decline lives here now). A guest's own side of the card has no host lines. Your neighbour's note on the guest side's card: `guest-list.tsx` renders `GuestPeek`; keep `GuestPeek`'s props stable (account-moments-wiring-2's Connections opens it too) and `FollowButton` as account-moments-wiring-2 renders it.

**The board's carried calls, as taken:** among the guests, who added most first, eight then a page at a time; at a desk the card opens beside the room's panel, its top at the name; the people who added photos head their section GUESTS and their count.

**The look's read:** a guest's photo count and four of their pictures are not on the list today. Read them through RLS where the host's own read allows (a new `lib/db/queries/guest-look.ts`, never `social.ts`), chunked and counted as CLAUDE.md's PostgREST trap says; only where RLS cannot serve it, a SECURITY DEFINER read in `supabase/migrations/20261008020000_guest_look.sql`, checked host-of-this-event inside, granted exactly (database-security.md), proved RED then GREEN in a rolled-back `execute_sql`, never applied by you. The guest's side card shows only photos the album already shows her (approved, visible).

**ROADMAP lines you close (quoted by their opening words):** Immediate's "Design: the Guests room's focus stragglers"; "the look (`social/guest-peek.tsx`) puts the face in the sheet title"; "a look's Follow reads Follow again on reopen"; "a let-in guest who adds nothing is on no list" (say what the room now shows); "the guest list sorted by upload count" (in the room); "the look's strip".

**Retire the guests-room board:** delete `src/app/(dev)/design/sandbox/guests-room/` in your branch; the Orchestrator deletes its ledger at your record.

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
