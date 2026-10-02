---
track: event-header-r2
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "c958cf69"            # the launch-prep SHA the branch was cut from
board: event-header
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/event-header/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/event-header.json
  - docs/systems/host-app.md
  - src/app/(app)/dashboard/[eventId]/page.tsx
  - src/components/app/event-feed/
  - src/lib/event/sections.ts
  - src/components/guest/event-experience-head.tsx
---

# lp/event-header-r2

**Goal.** The hub's head, round two, on the head as it now ships: how it carries its facts, and one predictable way every room opens from it (Review, Guests, Settings, the reel and See it as a guest), the room cards redesigned to pair with the shared head.

## The brief

**Why.** Will answered `event-header` r1 on 2026-10-02 (`docs/reviews/event-header.json`): `guest=cover`, `host=shared`, `stays=shutter`, and `header-wiring` built all three (merged: the album opens on its cover, the hub wears the same head with its facts as glyphs and the live mark, the sticky band leads with the cover's still and closes on the code chip, the shutter at the foot). His note on `host=shared` is this round, verbatim: "Still don't love how we're presenting some of the metadata under the title (item counts, date, live, etc). Love how they're captured into a sticky menu on scroll for page-wide access. Currently hate how some actions open a sheet, some are a new page, some (reel) seems to flash a guest album as it loads the slideshow, etc. Very unpredictable handling across actions stemming from the same row. Annoying that I have to go all the way into and all the way back from a guest page, for example. Wonder if there's a better way to redesign the action cards to pair with this new host head direction?"

**Today, as built:** the rooms are `EVENT_ROOMS` (`src/lib/event/sections.ts`): the Highlight reel opens the guests' view (now behind a black curtain, the flash fixed), Guests and Review are pages, Settings is a sheet (`?room=settings`), Share a sheet. And from his create-wizard note (`hand=lit`): a host should "explore the event as a guest from their (ideally) completed host event page rather than mid-setup. That should feel like a final payoff, not mid-point distraction."

**Round two's asks** (yours to shape, each drawn whole on the hub as it ships, tonight and the week before, at 1440 and 375):
- `facts`: how the head carries its facts (the counts, the date, live, the link) so they read at a glance without a line of metadata under the title; one option is his banked idea from disposable-mode r3, the night on a dial ("The night on a dial was super cool, wonder if that could be banked and used as a cool analytics UI or something for hosts?"): the night as a clock face, every photograph a mark at its minute, the busiest moments tallest.
- `rooms`: ONE predictable way every room opens from the head (Review, Guests, Settings, the reel, and See it as a guest as the payoff), never a sheet here and a page there, never a round trip: for instance panels over the hub, tabs under the sticky band, or pages under a persistent head; and the room cards redesigned to pair with the shared head (or folded into whatever opens the rooms).

**Who asks what this round:** identity owns the atoms; host-dashboard r2 owns the dashboard; `the-wait` owns a delayed album's waiting experience (a held or developing album, its host cover); a `take-home` board owns how photographs leave (save, download all). The guest's head and the shutter are answered.

**The direction** (Will's notes, 2026-10-02): bespoke and experiential, sleek and modern, sophisticated (never tilted or playful-messy), minimal yet high-information with far less text, media as the colour. Who it is for, his words: "remaining a modern consumer app usable for anyone at any event ... would rather frame this as cool to a younger expected host/guest crowd, probably 18 [parties] to 50ish [event guests, conference attendees). Don't want to build a boring app just for the least tech-friendly guests." And: "Everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility." His role: "I'm just the tastemaker ... drive your best ideas ... as the world's leading design engineer." Draw your boldest real answers; he picks and steers. Atoms are identity's board (draw in production's).

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/event-header/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `event-header`, its title, `surface`, `desk: 50` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

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
