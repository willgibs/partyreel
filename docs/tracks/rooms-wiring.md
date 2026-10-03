---
track: rooms-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "5dc4dee8"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(app)/dashboard/[eventId]/
  - src/components/app/event-feed/event-cards-row
  - src/components/app/event-feed/room-card
  - src/components/app/event-feed/reel-card
  - src/components/app/event-feed/review-room
  - src/components/app/share/
  - src/lib/event/sections
  - src/lib/notifications/build
  - src/components/app/dashboard/act-door
  - docs/systems/host-app.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(dev)/design/sandbox/event-header/
  - docs/reviews/event-header.json
  - src/app/(guest)/e/[token]/page.tsx
  - src/components/guest/event-experience.tsx
  - docs/systems/database-security.md
  - docs/systems/guest-flow.md
---

# lp/rooms-wiring

**Goal.** Wire event-header's rooms=over: every room opens one predictable way over the hub (Review, Guests and Settings in one panel at a desk and a screen on a phone, the reel full screen), and See it as a guest is new: a true guest render, a phone over the dimmed hub.

## The brief

**The round's direction (Will, round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule. Milestone 34 (round 12) ships to `main` while you read: build nothing heavy (no `pnpm build`, no lab crawl) before the Orchestrator's message that its gate has ended; read, plan and write tests meanwhile.

**Will's answers (event-header r2, his desk on build 45, 2026-10-03), in full:**
- rooms=over: "This feels phenomenally more fluid, natural, and intuitive. As a guest screen is a really cool idea."
- facts=strip and doors=? go to event-header r3, cut after you merge: leave the head's facts and the cards' look as they are. His doors note, so you leave room for it: "For today's cards, I don't love filling the highlight reel anymore. we have images in event head and gallery below, this crowds it too much... option 3, on the cover in glass... slides right into the sticky menu on scroll (important for all options to have their version in cleanly doing so)."
- His round-12 words this answers: "Currently hate how some actions open a sheet, some are a new page, some (reel) seems to flash a guest album as it loads the slideshow... Very unpredictable handling across actions stemming from the same row. Annoying that I have to go all the way into and all the way back."

**Build:**
1. **Review, Guests and Settings share one right-edge panel over the hub at a desk, and a screen on a phone**, one way in and out. Review (`review-room.tsx`) and Guests leave their route pages. Their addresses redirect into `?room=review` and `?room=guests`, as `settings/page.tsx` already does for Settings.
2. **The reel opens full screen**, its curtain as `crumbs-52` and `crumbs-54` made it.
3. **See it as a guest** (new; it does not exist in `src/`): a phone over the dimmed hub at a desk, a whole screen on a phone. It must be a true guest render, because the host's session is the owner everywhere and every SQL home exempts her from the seal. It needs a server read that sees what a let-in guest sees: no owner select, sealed shots hidden, no owner controls.
   - Build it as a route of its own under `[eventId]/`. Never edit the guest page itself (`wait-wiring` owns it).
   - It reuses the guest experience's components with that read's props.
   - Write its design as a Question with your recommendation and build that.
   - Security pins prove it grants nothing: no write, no ticket, no row a guest could not see.
4. **Every old way in keeps answering:** the bell (`notifications/build.ts`), the door act (`act-door.tsx`), the Reel card, the sheet's guests link, and `sections.ts`'s legacy `?eventTab=`.
5. **The sticky band stays**, and its doors open the same rooms.

**Constraints:**
- `wait-wiring` owns the hub's head (`event-hub-head.tsx`) and `event-gallery.tsx`. It may add one line to the hub page, so merge kindly with it.
- `identity-wiring` merges first: sync onto it.
- Red first.
- Prefetch a room's chunk on intent, so a panel opens at once.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate (CLAUDE.md's four steps, each on its own exit code); `pnpm lab:smoke --base http://localhost:3134`; `pnpm lab:demo --board event-header` at 1440 and 375 (its PREMISE moves: report what its drawings no longer match); Vitest red first for each room's open and close (address, focus, Back), every legacy entry landing, See it as a guest's read (a sealed album shows no sealed shot; no owner control; no write); captures at 1440 and 375 of each room over the hub and See it as a guest, in your Handoff.

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
