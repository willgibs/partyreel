---
track: event-ready
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "f9db585d"            # the launch-prep SHA the branch was cut from
board: event-ready
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/event-ready/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
  - content/help/day-of-checklist-for-hosts.mdx
  - src/components/app/event-settings/event-settings-sheet.tsx
  - src/components/app/create-event-wizard.tsx
---

# lp/event-ready

**Goal.** Explore how a host knows her event is ready and what she does next: an event checklist, the settings' mini wizard (and whether Create shares it), a never-empty "what needs you", and the hub's code as the event's live door.

## The brief

**His note** (event-settings, build 19's sitting, on the door drawn in steps): "Almost feels like a mini wizard within settings to always ensure it's ready to go - wonder if we could extend this concept. Could also be helpful to create an event checklist for hosts so they know everything is ready." Settings has since shipped as four sentences with pages of their own and the door in steps (`settings-wiring`, merged at `7c0fbcb1`: `src/components/app/event-settings/`), and Create is Name, Style, Ready (`src/components/app/create-event-wizard.tsx`).

**The round:** how a host knows her event is ready, and what she does next, explored from production as it is:
- **The event checklist:** what "ready" means for an event (the door set as she means it, a code printed or shared, a cover, the reel's defaults, the room she has left, a look from a guest's side), where it lives (the hub, the event card, Settings, the end of Create) and when it steps aside. Every item is real state the product already holds, never an invented feature.
- **The settings' mini wizard:** his idea extended, a guided pass that leaves the event ready, and whether Create shares it or hands over to it.
- **"What needs you", never empty** (ROADMAP's major-overhauls line): one suggested job per event from real state (a queue, paused uploads, a code to print, storage near the cap), one pure function feeding the pulse and the event card.
- **The hub's code as the event's live door** (the same ROADMAP bucket): paused uploads dim it, a private event marks it.
- The help's `day-of-checklist-for-hosts` article is the written twin of whatever wins; its two Help-sync lines in the ROADMAP name where it is already wrong. The article is not yours: say what it should become in your Handoff.

Each ask draws every option on the real surface, from production's components fed fixtures, at 1440 and at 375 (hosts set events up on phones). Ask only what branches the work, and merge two asks that decide one thing. Anything that would change what an event is, or add a new obligation for hosts, is a one-way door: a Question with its recommendation, never an option.

**You are the first board authored after the lab revamp** (a board is one folder: `pnpm new-board`, the toolbox page `/design/lab/kit`): note in your Handoff what the kit made hard, so the next author finds it easier. Take `desk: 35` (after the door family, ahead of the marketing boards: app work first).

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/event-ready/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `event-ready`, its title, `surface`, `desk: 35` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Is "ready" something an event is, or only something its host is told?** A stored ready, a mark a guest sees, or anything that waits on it would change what an event is (today it is live the moment Create makes it). **Recommended: only something she is told.** Ready is computed from state the app already holds (`sandbox/event-ready/readiness.ts`), for the host's eyes, never stored, never shown to a guest, gating nothing. The board is drawn on this answer (its first two settled lines).
- **Does ready wait on the date, the note and the first photos?** Holding it until they are done turns three optional things into obligations for every host. **Recommended: no.** Ready waits on what a guest needs to get in and add (a door that lets her in, uploads open, the code opened once, room once the shelf is full); the date, the note and the first photos sit under "Worth doing" and never hold it back. Carried on the board as `ready`; `readiness.test.ts` holds it.
- **Does the code's first open count the host's own test scan?** `recordLinkHit` counts every non-bot visit to `/e/<token>` and does not know whose it was, so counting only guests would take a new stored fact (a migration). **Recommended: yes, her own scan counts:** it is the help's own advice, it proves the code opens, and it needs nothing new. Carried as `opened`.

## System-doc edits (in place, owned facts only)

- none: an exploration ships no production byte; the round's facts live in `sandbox/event-ready/` until a wiring lands its picks in `docs/systems/host-app.md`.

## Deferred (ROADMAP one-liners, bucket named)

- Host: the dashboard card says Closed for paused uploads (`statusLabel`, `app/(app)/dashboard/page.tsx`) while the hub's Settings card words the gate Only people already in as "Private · Closed" (`doorLabel`): one word, two states; the card could say Paused, the code's own word (from `event-ready`).
- Host: at 375 the album's name before the first photo, "Before the first photo", wraps to two lines under Add photos and View (`event-feed/event-gallery.tsx`); it retires with the launch list if `event-ready`'s `list` leaves the album's place (from `event-ready`).
- The lab and the kit: a portalled frame is not its own world: a production `<Link>` pressed in it navigates the lab (boards carry `stopLinks` or `Inert`), radix layers (the settings `Popup`, a word's menu) portal to the lab's document, and a `loading="lazy"` image never loads (`EventCard`'s cover drew only through its `living` stills); `Frame` swallowing links and handing radix a frame-scoped portal container would let a board draw production whole (from `event-ready`).
- The lab and the kit: `Strip` (phones side by side in one `Fit`, laptops stacked, rows of N) and the 375/1440 Screen knob are copied in `locked-door` and `event-ready`; the front door could carry both (from `event-ready`).

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/event-ready`:** `65c9edaf` (the board), `d72df1de` (the after-party window, the reunion, captions, dead exports), and this manifest's commit (the head in the chat line). No sync: launch-prep moved to `18cb085f`, but `git diff --name-only 61a4ee00 origin/launch-prep` touches none of my `reads` and nothing the board imports (records, the door family board, schema-pass's SQL and social queries; `grep 'from "' sandbox/event-ready/*` names none of them).
- **Gates on `d72df1de`'s tree, each on its own exit code** (logs in `../partyreel-wt/_scratch/event-ready/gate-*.log`): `pnpm typecheck` 0; `pnpm lint` 0 (no warnings); `pnpm test` 0 (609 files, 7,074 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3135 --all` 0 (174 checks, 0 failing; the board reads 879 words of 1,200); `pnpm lab:demo --board event-ready --base http://localhost:3135` 0 (5 steps, 0 failing, every option draws). Also `--state screen=1440`: 5 of 5 ok. `--width 375`: all five steps OUT OF REACH (the stage 0.85 to 1.12 screens under the question), the lab's own known line (ROADMAP "fold the opening's two lists and the context lines below `sm`", locked-door measures 1.0 to 1.3); every stage draws there.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the 13 files of `src/app/(dev)/design/sandbox/event-ready/` + this manifest. No exceptions.
- **The board,** `/design/lab/event-ready`, desk 35, surface host, five asks, 375 first with 1440 on the Screen knob, every option drawn on production's own components (`AppShell` and its bell and menu, the rooms' shell and Review's face, `ReelCard`, `LaunchList`, `FeedSectionHeader`, `SettingsProvider` with inert writes and its rows and four pages, `NextStepBand`, `StorageMeter`, `EventCard` with `EventCardQr`, `EventCodeDoor`, `StyledQr`); what cannot mount (the hub's page, Create's beat, the settings panel's layer) is quoted class for class and says so in its file:
  - `list`, where the checklist lives, across three moments of Maya's 30th (an hour after Create; three photos in, the code never opened; the night before): today's launch list in the album's place (it leaves at the first photo), **the head of the hub until it's done (recommended)**, or inside Settings counted on its card.
  - `guide`, a walk through Settings, drawn in the home `list` holds: four rows as today, **the rows as numbered steps with a tick each and the code a fifth, every page ending in Next (recommended)**, or a pass of its own ("Set it up", one question a screen).
  - `create`, Create's hand-off, drawn in the walk `guide` holds: the beat as today, **the beat handing over (the code first, then what is left, and Get it ready into the walk's first step) (recommended)**, or Create walking the door and the welcome before the beat (the one option that reopens `asks=one`, and says so).
  - `needs`, What needs you when nothing waits, the band and the cards on a quiet Friday and on the 30th's night: nothing as today, **each event's next job from one function (recommended)**, or how ready it is; the card carries the same line in the top-right slot its amber review chip holds.
  - `door`, the hub's code as the door, in five doors (Public; Private, you let each in, 2 waiting; a password; Only me; paused): dimmed when paused as today (an Only me code looks ready to scan), a mark on the mat's corner, or **a line of words on the mat (recommended)**.
  - One function under every drawing, `readiness.ts` (13 tests in `readiness.test.ts`): what a guest needs first (the door, uploads, the code opened once, room when full), then worth doing (the first photos, the welcome); `nextJob` keeps production's `nextStepForEvent` first, then the checklist, then Invite guests, and after a party Share the album for 30 days (`AFTER_PARTY_DAYS`), then quiet.
- **The help's twin** (`content/help/day-of-checklist-for-hosts.mdx`, not mine): its two ROADMAP Help-sync lines are already fixed on launch-prep (Approve all now points at Review, from `settings-wiring` `b25d4595`; the private-window test no longer mentions an email step), so both lines can go. What it should become once a pick is wired: open by saying the event page keeps this list and ticks it itself; lead with the app's items in the app's order (Decide who can get in; keep uploads open; print the code big and scan it once from your phone, which ticks it, the article's Print and Test merged; add the first photos, two start the reel; write the welcome, the date and a note), then the day-of items the app cannot see, unchanged (review or not, where people look, the reel on a screen, tell everyone once, glance at Review and the door, close uploads when it's over); its own device-local ticks stay for those.
- **What the kit made hard, for the next author:** a Next `<Link>` inside a portalled frame navigates the lab (this board's `Inert` in `scene.tsx`, as `demo-framing`'s `stopLinks`); radix layers portal out of the frame, so the settings panel is quoted from `popup.tsx`, as the Library draws it inline; JS breakpoint hooks read the lab's window, not the frame's (another reason the panel is quoted); `loading="lazy"` images never load in a frame; `Strip` and the Screen knob had to be copied from `locked-door` (about 150 lines); a term said only in a carried call fails the term check (carried calls are not scanned). Easy: `PreviewsFor` caught a missing preview as a type error, the context layer's caps gave exact messages, and `lab:smoke` and `lab:demo` scoped to the board ran in minutes. I wrote `spec.ts` and `board.tsx` in the scaffold's shape rather than running `pnpm new-board`; probed afterwards (`er-kit-probe`, removed), it writes both and the registry lists its 23 TODOs as the checklist, as designed. The two actionable ones are under Deferred.
- **Assets requested from Will:** none (the bootstrap stills throughout).
- **Board ideas:** a host's own look from a guest's side ("See it as a guest", which the help tells her to fake with a private window); the dashboard card's code chip wearing the same door as the hub's code once `door` is picked; What needs you after the month's Share the album, a board for "what an album becomes weeks after the party" (ROADMAP already names it).
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none this round. The wiring of `needs=job` (or `count`) reads each event's first open on the dashboard, today one `event_link_totals(p_event_id)` call an event: a batched read over the id list is that wiring's one migration.
- **Records for the Orchestrator at this board's merge:** ROADMAP's two "Lab explorations no board asks yet" lines (a never-empty What needs you; the hub's code as the live door) are asked here, and the two stale Help-sync lines above can go.
- **Calls his to overrule** (carried on the board, above its sections): `items` (what the checklist holds), `ready` (ready waits only on what a guest needs), `window` (a party keeps a job for a month after its date), `opened` (the host's own scan counts). Also taken in the drawings: essentials first in the list with a "Worth doing" group; the head's list folds to one line once the album has photos; the Settings card counts what a guest still needs, then returns to the door; `steps` adds the code as a fifth step opening Share; `sign` says "Only you" for Only me and a gate's short word under a lock.
- **Look at first:** `/design/lab/event-ready?key=fiesta&session=event-ready.list` at 375, then `needs` on the quiet Friday (today's grey line beside its next job), then `door` (today's Only me code at full strength).
