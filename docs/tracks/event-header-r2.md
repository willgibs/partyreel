---
track: event-header-r2
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "9f4a7d90"            # the launch-prep SHA the branch was cut from
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

- **Which way the hub carries its facts** (ask `facts`). Recommended and marked: `dial`, his banked night on a dial,
  drawn as a 12-hour clock face beside the code (a photograph at 9:30 stands at 9:30), its marks the night every ten
  minutes, the count at its heart, now a point that holds its light (the live mark's rule: never a pulse), and the
  week before a countdown ("6 days to go"). Overrule: `name` for the calmest cover, `strip` for the same night as a
  waveform along the cover's foot.
- **What the doors look like** (ask `doors`). Recommended: `windows`, each door a picture of its room (the reel's
  stills, the faces at the door, the uploads waiting as a mosaic, Settings' steps as a ring, her album in a phone) on
  the cover's own house light where a room has no photograph. Overrule: `glass` puts the doors on the photograph and
  the album 116 px higher at 1440 (544 against 660, the captions).
- **How every room opens** (ask `rooms`). Recommended: `over`, every room in the settings kind (a panel at a desk,
  the whole screen in a hand), the reel and her guests' album over everything, each closing back to the hub as she
  left it. Overrule: `under`, the doors as the band's tabs, every room one press from every other.
- **The doors got their own ask** rather than riding `rooms` (the brief allowed either): what a door looks like and
  what it opens are separate decisions, and each is drawn in the other's current answer. Built: three asks, none
  staged, so a note on one never holds the others out of his walk.
- **Tabs under the band and pages under a persistent head are one option** (`under`), not two: a tab that brings the
  band to the bar is a page under the band, so they would draw one picture twice (PROGRAM: two options that land on
  one answer are a finding). Built: one option; the bolder spatial alternative it leaves undrawn is a room that grows
  out of its own door, which `over` covers at a phone.
- **Where See it as a guest lives** (carried `guest-door`). Built: the row's last door, a phone with her album in it,
  the payoff at the row's end and never mid-setup (create-wizard's settled line). Overrule: her own white button on
  the cover.
- **Where each fact goes once the line goes** (carried `fact-homes`). Built: guests onto Guests, the album's count
  onto its label (production's "Album 214"), the date over the name, the link under the code as its address. Views
  leave the cover; their home is the night's analytics (Board ideas).
- **What the night plots, for the wiring** (dial or strip). Recommend the album's own upload times, which every
  host manifest entry already carries (`ManifestEntry`'s `t`, created_at; live, no new read), over a window of
  twelve hours from the first photograph so a next-morning upload never wraps onto the same face; anything after
  counts in the total. A capture time would need EXIF read at upload, which nothing reads today.
- **One panel for every room** (`over`): 512 px at a desk where Settings' kind is 448 today, a step wider for Review's
  grid and the Guests room's rows, so Settings would open 64 px wider than it ships. Built as drawn; overrule keeps
  448 for every room.

## System-doc edits (in place, owned facts only)

- none (the round is lab only; `host-app.md`'s event page changes with the wiring)

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- **Commits**, pushed to `origin/lp/event-header-r2`: the work `ff78ca3b` (round two drawn) and `c20cbac1` (polish: a
  phone's door takes a second line where the album is a sixth door, its faces a size smaller; two comments).
  launch-prep moved (crumbs-50, demo-r4, save-speed and disposable-foundation merged, records and pickups) but nothing
  in this lane's reads or folder (`git diff --name-only 9f4a7d90 origin/launch-prep` on the six reads and the board
  folder holds none), so no sync; the head is this manifest's commit.
- **Gates on `c20cbac1`**, each on its own exit code (logs `/Users/gibby/local/ai/partyreel-wt/_scratch/event-header-r2/`):
  `pnpm typecheck` 0 (`gate2-typecheck.log`); `pnpm lint` 0, no warnings (`gate2-lint.log`); `pnpm test` 0, 765 files
  and 9,051 tests (`gate3-test.log`); `zsh scripts/build-lock.sh pnpm build` 0 (`gate3-build.log`);
  `pnpm lab:smoke --base http://localhost:3133` 0, 5 checks and 0 failing, the board reading 819 words of 1,200
  (`gate3-smoke.log`); `pnpm lab:demo --board event-header --base http://localhost:3133` 0, 3 steps and 0 failing,
  at 1440 each stage starting 0.30 down, at 375 0.33 to 0.35 (`gate3-demo.log`); and the same with `--width 375`
  (`gate3-demo-375.log`) and with `--state moment=before` (`gate3-demo-before.log`), each 0 failing. lab:demo runs
  under reduced motion, where every room stands whole at once (`event-header.css`: every movement behind
  `no-preference`).
- **Lane check**: `git diff --name-only origin/launch-prep...HEAD` = 15 paths, all under
  `src/app/(dev)/design/sandbox/event-header/` (round one's `guest.tsx`, `host.tsx`, `light.tsx` and `replay.tsx`
  deleted with its answered asks; `doors.tsx`, `head.tsx`, `hub.tsx`, `night.tsx` and `rooms.tsx` new), and this file;
  no exceptions.
- **The board** (`spec.ts`, round 2, surface `host`, desk 50): three decisions top to bottom of the hub, none staged,
  each drawn wearing what the board holds for the other two (his pick once made, production until then: every ask
  declares `today`). Every frame is production's hub in its own order: `AppShell` and its crumbs, the cover in
  `EventHead` and `HeadStills` (the real dissolve over the house light), `EventCodeDoor`, today's line in `GlyphCount`,
  `Badge live` and `EventLinkRow`, the room-card shell, `EventChecklist` the week before, `FeedSectionHeader` and the
  album's rows; the rooms are production's own over writes that answer and change nothing (the Library's way):
  `ReviewRoom`, the Guests page's `AtTheDoor`, `GuestList` and `GuestsInvite`, Settings' `SettingsRows` under
  `SettingsProvider`, the guests' `AlbumCover`.
  1. `facts`, four options, each the hub tonight and the week before (`head.tsx`, `night.tsx`): `today` (HubCover's
     line), `dial` (recommended; 128 px beside the 128 px code at a desk, 92 px over it at a phone), `strip` (the night
     as a waveform under the name, 170 marks at a desk and 46 at a phone, each the photographs around its moment),
     `name` (the date and the live mark over the name). The captions read the cover's words, the instrument's size and
     where it peaked, and where the album starts (`scene.tsx`'s `measureFacts`).
  2. `doors`, three options, each at rest and scrolled into the album with the doors in the band, the Moment knob for
     the week before (`doors.tsx`): `cards` (today's, a fifth card for See it as a guest), `windows` (recommended; 176
     by 112 at a desk with the needs-action count on an amber corner, 60 px squares under their word at a phone, a
     round picture in each pill of the band), `glass` (pills on the cover's foot at a desk, glyph rounds with their
     counts at a phone, the band arriving fixed under the bar so it never pushes the album). The band holds the
     resting row's height (production's footprint), so condensing never moves the album.
  3. `rooms`, three options, each Try it then Review, the reel and See it as a guest opened, the Moment knob for the
     week before (`hub.tsx`): `today` (Review and Guests pages under their crumb, Settings a panel, the reel the
     guests' album with its close landing there, See it as a guest a new tab; Try it says the trip back), `over`
     (recommended; the panel with its close outside its edge, the whole screen under a back arrow in a hand, the reel
     risen over everything, her album in a real 390 by 844 viewport, a frame inside the frame, in a phone over the
     dimmed hub), `under` (the album a door, a room swapping in under the band, the reel in the cover grown to the
     screen, See it as a guest turning the page, her way back in the guest header's corner).
- **Try it, pressed headless in every option** (`_scratch/event-header-r2/trycheck.sh`): in `over` the band sticks on
  the frame's scroll and lets go back up, Review opens as a panel, Esc closes it, Settings opens as a panel and a
  press on the scrim closes it; in `today` Review is a page and its crumb returns, the reel's close lands on the
  guests' album and its Back on the hub; in `under` Review swaps in with its tab pressed, the album's tab returns,
  the reel grows the cover, See it as a guest turns the page and its way back returns with the album pressed; at 375
  the same, the room a whole screen and its back arrow returning.
- **Assets requested from Will**: none (the bootstrap stills, the house light, seeded faces).
- **Board ideas**:
  - The night, pressed: the dial or the strip opens the night's analytics (the busiest moments, who added most, the
    code's opens over time), his "analytics UI" line, once `facts` is answered.
  - The checklist's last tick offers See it as a guest, the payoff at the moment the event is ready.
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none.
- **Calls his to overrule**: the doors as their own ask; tabs and pages as one option (`under`); See it as a guest the
  row's last door (`guest-door`); each fact onto what it counts (`fact-homes`); the dial a 12-hour clock with a mark
  every ten minutes; one 512 px panel for every room; the album a door only where rooms open under the band.
- **Look at first**: the rooms step at 1:1, `over`'s Try it (press Review, then the reel, then As a guest, Esc each
  time), then `under`'s the same way; then the facts step's `dial` at 1:1, tonight and the week before.
