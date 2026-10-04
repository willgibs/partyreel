---
track: event-header-r4
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "d1a3a7585"           # the launch-prep SHA the branch was cut from
board: event-header
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/event-header/
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
---

# lp/event-header-r4

**Goal.** event-header round 4: the three doors (glass, cards over the seam, windows) each refined by its own helper to its best version, glass's counts as badges on its icons, cards owning the phone, each with its sticky form; form and behaviour only (the waiting color is the brand's); calls G1, G2 and G4 folded in.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**The method this round (Will's two-level rounds, made yours).** He has watched boards improve most when a first pass picks the direction with a full context and a second pass spends a full context on that direction's best version, and drift or overcomplicate past that without his feedback. So:
- **A foreground helper per option (or trait family)**, holding this whole brief and thinking only about its one option; you coordinate, compose and keep the board one voice. Run helpers in the foreground (a background helper's notice never reaches you).
- **One fresh-eyes pass, then stop:** after the drawings, a helper that sees only this brief and your captures answers "of each direction, what is its best version?", and you refine once from it. No third round: Will's feedback is the next one.
- **The budget is stated below** and is not yours to grow.

**Will's answers to event-header r3 (2026-10-04):** facts=strip (being wired now by `hub-strip-wiring`: draw it as settled). The guest row he loved (the facts ask's `faces` option) goes to its own board after the brand round; do not draw it here. And doors=?, in his words: "This is really difficult. All three are well-designed and stand on their own merits, but I'm currently leaning toward one glass capsule. We'd like to see all three through another round of design to see how they improve, so we can see more of each's potential. for example, a small add to glass capsule (far from exhaustive, you're more creative) is stacking the counts on the icons as badges, also don't love our yellow color, makes the page feel dull. total freedom there too. Cards over seam probably works best on mobile right now. Just trying to add context, but let your best ideas & max creativity fly. We're defining core experience here, if hosts have a bad UX using an event we'll lose them."

**Round 4: the three doors, each refined by its own helper, each its best version.** Glass (one capsule of segments; his first idea, counts stacked on the icons as badges; its stuck dock), cards over the seam (owning the phone; its stuck pills), windows (the rooms' small pictures, quieter; its stuck pill). Each with its sticky-band form as she scrolls, at 1440 and 375, light and the room. She presses these all night: they read at a glance and stay one press away however far she scrolls.
- **Form and behaviour only.** His "don't love our yellow" is a brand question (the warning amber reads as the brand's color), asked once on the brand's own boards: the doors wear today's waiting light here, and you add no new hue.
- **Calls folded in** (each drawn here, never asked elsewhere): G1, See it as a guest as a door (an inert phone over the dimmed hub); G2, Review and Guests sharing Settings' one panel, a room opening another room, the reel full screen; G4, Settings' "2 left" plain, never amber, and uploads reading Open or Paused.
- `opening.settled`: rooms=over (wired), facts=strip (wired now), the atoms identity's. `earlier`: his r3 note. `history`: r4, the doors refined.

**Budget:** three helpers (one per door), one fresh-eyes pass, one refinement. `desk: 20`.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/event-header/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `event-header`, its title, `surface`, `desk: 20` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended, drawn on the board and carried there (`spec.ts` `carried`), and listed under "Calls his to
overrule".

- **Q1. Where the glass capsule goes once she scrolls (`glass-stuck`): at a desk it stops under the bar where it
  reached it, the code's chip joining its end; on a phone it is a tab bar at the screen's foot from the first screen,
  the code its last door.** No face leads the desk dock (the crumbs right above name the event, and a lead would shift
  every door sideways the moment it docks); on a phone the bar never moves and sits where her thumb is all night,
  which is glass's answer to "cards probably works best on mobile". Overrule: a full-width band under the bar holding
  the capsule, the cover's face leading, at both sizes (round three's carried alternative).
- **Q2. How the cards stand on a phone (`cards-phone`): a two by two grid over the seam with As a guest the width under
  it.** Round three's sideways shelf showed two and a half cards, hid Settings and As a guest past the screen's edge
  and cut Review's count mid-word, the regression production's own phone grid was built to end. Overrule: the shelf,
  larger cards she scrolls sideways.
- **Q3. What Settings' door says while uploads are paused (`settings-paused`): Paused, the uploads' own word
  (`uploadsLabel`), plain and never amber, in place of the door's word.** G4 as built puts Open or Paused on the
  dashboard's card and the code's corner mark; the board carries the word to the Settings door because after the party
  it is the state she most needs, and the code's mark scrolls away with the cover. Overrule: the door's word stays
  (Private · You let in), only the code's corner says paused, as production does now.

## System-doc edits (in place, owned facts only)

- None: a lab lane ships no production byte. The wiring of the picked door edits `docs/systems/host-app.md`.

## Deferred (ROADMAP one-liners, bucket named)

- Host: the picked hub door at a tablet's width (640 to 1024), undrawn on event-header r4 (five cards there are about
  190px and cut "Highlight reel"; the capsule and the windows' row each need their own step) (event-header-r4).

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/event-header-r4`:** `51e84a1b6` round four's base (the doors split into their own files
  through one contract, `door-kit.tsx`'s `DoorOption`; round three's drawings moved unchanged and measured the same);
  `2777779d5` the three doors, each refined by its own helper; `ead6245a9` the calls G1, G2 and G4 drawn in every
  option, and the doors' shared asks; `2d6f692d5` one refinement from the fresh-eyes pass, and the spec's words. No
  sync: launch-prep moved (hub-strip-wiring, dashboard-wiring, records and pickups; now `242c3cff1`) but touched neither
  this folder nor any of the 46 production modules the board imports (`upstream.txt` against `imports.txt` in the
  scratch folder: no line in common). The head is in the chat line.
- **Gates on `2d6f692d5`** (the handoff commit adds this file alone), each on its own exit code, logs in
  `../partyreel-wt/_scratch/event-header-r4/`: `pnpm typecheck` 0 (`gate-typecheck.log`); `pnpm lint` 0
  (`gate-lint.log`); `pnpm test` 0, 876 files and 10,574 tests (`gate-test.log`); `zsh scripts/build-lock.sh pnpm build`
  0 (`gate-build.log`); `pnpm lab:smoke --base http://localhost:3134` 0, 18 checks, the board's reading 728 of 1,200
  words (`gate-smoke.log`); `pnpm lab:demo --board event-header --base http://localhost:3134` 0, 1 step, its three
  options drawn and differing (the stage moves by up to 92%), each seen whole above the dock at 1440 and at 375
  (`gate-demo.log`). Reduced motion: every fold lands at once, no animation running 60ms after the scroll
  (`shots/reduced/`).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the 17 files of
  `src/app/(dev)/design/sandbox/event-header/` and this file; no exceptions.
- **The board:** round 4, desk 20, one ask (the doors: glass, cards, windows), recommended glass ("your lean, refined:
  one object that never moves, its counts on its icons, the album highest, and on a phone it waits under her thumb all
  night"); three moments (tonight, the week before, the week after with uploads paused), both screens, both grounds;
  three calls carried (`spec.ts` `carried`, the Questions above).
- **The method, as briefed:** three foreground helpers, one per door, each in its own file and sheet; one fresh-eyes
  pass that saw only the brief and the captures (`shots/fresh/`), whose one finding across all three was a door that
  moved when a count came or went; one refinement from it (`shots/refined/`, the set to judge).
- **Glass:** every count a badge cut into its glyph's shoulder (amber where something waits, a filled disc in the
  door's ink for steps left and for paused); at a desk the capsule stops under the bar where it reached it, the code
  joining its end; on a phone a tab bar at the screen's foot from the first screen, the code its last door; a steadier
  glass off the cover; no door moves between moments.
- **Cards:** every door in sight at rest on a phone (a two by two grid, As a guest the width under it); a waiting count
  a big numeral beside its light, never an amber wash; shorter desk cards over an eased seam; the five cards fold into
  the band's pills in one interruptible movement (FLIP, never a remount); every pill one slot; a plain pause on
  Settings' pill once the cover's code has gone.
- **Windows:** no card at rest, each door its room in miniature; a window lit only where something waits (its own
  colour, a count chip on its corner at both sizes), so a phone shows colour exactly where she is needed; stuck, the
  windows shrink into the band, gathered after the face and the name at a desk, the face round and parted by a hairline
  in a hand; the open room's door ringed.
- **G1, G2, G4 in every option, on production's components:** Review and Guests in Settings' own panel (production's
  `Popup` of the `settings` kind), Settings with its rows and four pages, a link in one room opening another in the same
  panel (`roomOfHref`: Settings, Who can get in, Let them in from Guests), the reel full screen, As a guest an inert
  phone with the door's own line; Settings' "N left" plain; the week after's Paused.
- **The board's honesty:** a still frame takes the form its real scroll gives the doors (the week before at a desk is
  too short to scroll the cover away, so its doors rest, as production's would); every caption is read off its frame.
- **Tools left in the scratch folder:** `cap.mjs` (a contained headless Chrome that captures a board's frames at 1:1
  after scripted steps inside a frame), `shoot-set.sh` (the standard set per option), `sheet.sh` (contact sheets).
- **For the wiring lane, whichever door wins:** production's never-remount and resting-height rules hold in all three;
  glass also needs the page's bottom padding to equal its phone bar (about 68px and the safe area), Select mode's bar
  to stand in for the tab bar, toasts above it, and its desk capsule as one element that pins (the lab draws two,
  swapped); every pill and segment keeps a fixed slot.
- **Assets requested from Will:** none.
- **Board ideas:**
  - Any door's sticky form at a phone's foot, under the thumb (glass draws it; the fresh-eyes pass suggested cards
    borrow it, kept out here so the options stay apart).
  - Production's cards row could fold its phone grid into the band (cards' FLIP) rather than snapping.
  - Windows' "lit only where she is needed" for the dashboard's event cards: only an event with something waiting takes
    colour.
  - A waiting count as a big numeral beside its light (cards), a candidate for the status set's one "something waits"
    form (brand-marks).
  - The board's strip is its own drawing of the pick; production's (`event-hub-head-strip.tsx`, merged after this cut)
    can replace it next round.
  - On a phone, the app bar's back crumb could carry the event's name once the cover has gone.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** Q1 `glass-stuck` (desk: stops under the bar; phone: the tab bar at the foot); Q2
  `cards-phone` (a two by two grid, every door at rest); Q3 `settings-paused` (Settings' door reads Paused).
- **Look at first:** `/design/lab/event-header?key=fiesta`, glass at 1440 then 375: scroll Try it, press Review, then
  Settings, Who can get in, Let them in from Guests; the Moment knob's week after; then cards and windows the same way.
  The captures: `../partyreel-wt/_scratch/event-header-r4/shots/refined/sheet-*.png`.
