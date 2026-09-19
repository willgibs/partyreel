# Partyreel — Changelog (the last two rounds)

> ROLE: what shipped in the current round and the one before, with the commits and the verification.
> BELONGS HERE: at most two dated entries, newest first, each at most 160 lines. · NOT HERE: how the
> system works now (→ [`systems/`](systems)), what is next (→ [`ROADMAP.md`](ROADMAP.md)), the live
> state (→ [`STATUS.md`](STATUS.md)). GROWS BY: a new entry at a round's close, and the third-oldest
> entry deleted in the same commit. Everything older is in git: `git log --oneline` for the commits,
> `git show 932fdee9:docs/CHANGELOG.md` for the last full archive (5,495 lines, 2026-07-02 to 09-16),
> `git show dd77fc9e:docs/CHANGELOG.md` for the Library x Lab round's entry, `git show 52e9afa2:docs/CHANGELOG.md` for the revamp's,
`git show d2db2629:docs/CHANGELOG.md` for the stepped review round's.

---

## 2026-09-18 — The ladders and the dock: both ladders wired, the lab's step rebuilt, four question-first boards cut (`00e82dba` onward)

**What Will did.** The eighth batch (`00e82dba`) answered both ladders (`type-phone` r1: "Everything should be
addressed in our design system type ladder"; `rounding` r7: family C, quarters, dead rungs dropped, the gap pinned);
the Terms got their generated-media sentence. The ninth (`d62dac22`) closed album-hero r3 (`composition=none`: "my
calm instruction messed us up - now it feels too boring") and river-visual r2, and answered `proportion` with the lab
itself. The calm lesson is PROGRAM.md's: a relative note is answered against a reference, never a cap and a test.

- `ladders-wiring` (`5a5c6eb4`, `d2db2629`; bible 5 and 8 ruled): the type ladder's law became the ORDER (`prose` 24 at a
  phone, a tenth step `subhead`, 126 headings onto their step) and the corners family C in quarters (8 / 12 / 4, a `cta`
  Button on 46 sites). The lab's step rebuilt (`d37be90e`): the preview is the page, the answer a dock, `lab:demo` fails
  CLIPPED, UNLABELLED, NO DOCK. The glow boards retired with the `[data-lit]` leak; `lab:smoke` passes whole. Four boards
  cut on three lanes (`33f1de95`). `gallery-width` r1: four decisions on the real event pages in a `Frame` at 1280, 1512
  and 1920: the tile (240), the width (full), the words (edge), the host (same).
- The Orchestrator changed seats mid-round (a weekly limit; a second account resumed three lanes: Fable orchestrating,
  boards on Sonnet, wiring on Opus). Integrated: `heroes` (`6b5ea1bf`: `privacy-hero` to round three, `album-page`
  answered whole), `ghost-wiring` (`31c94253`: the river on the guest album's empty state, `src/components/shared/river/`),
  `river-card` (`3ed62f0c`: the river in the real QR door, 3.0 px a module), `voice` (`e0b92af6`: eight real lines, three
  or four candidates each, bible 20 first), `body-type` (`130236c2`: the body and label ladder as seven measured decisions;
  two questions his), `glass` (`30aaf705`: four recipes in numbers, Frost recommended, every cost measured), `loose-ends`
  (`b83b7c3d`: six ROADMAP lines as seven decisions; four chart aliases fixed at `0681652c`).
- **milestone-25** (`bf9cbd74`): `main` merged from `707d99a2` on Will's word, 1,138 commits: Graphite, the ladders, the
  Aurora, the wordmark, the river; the lab gated.
- `admin` (`d6305818`: the portal's shape as seven decisions on the real components with a Tuesday of fixtures at 1440
  by 900: a ranked home, a rail plus a palette, density, the state chip, destructive acts, a health band, a 44 px bar; four
  questions closed), `admin-split` (`7f3738ba`: `src/lib/surface` decides which surface a build serves; the cutover closed
  with milestone-26) and `admin-jobs` (`3ad58b1c`: the jobs console through one pure `jobHealth`, nine jobs, the Worker's
  depth reading, the purge's four sweeps as jobs (QA #27), the limiters reporting (QA #19); the migration applied, the
  Worker `d7b16bcc`) integrated.
- `backdrop-wiring` (`9795e370`): `full-quality` wears a switching full-bleed pool behind the glass plate with the band
  trigger and the foot rail, a still under reduced motion; the engine and `PhotoSection` beside the river; his fold as one
  line (chapter one closes on the photograph; his to overrule). 5.12:1; row 20 at 1200 px. Retired.
- `gallery-wiring` (`666ee8bc`): galleries declare a column WIDTH, never a count, one rule in `shared/masonry.tsx`:
  2 / 5 / 6 / 8 columns at 375 / 1280 / 1512 / 1920, the album 20 px from each edge, the words at 632, the host page the
  same shape. Two calls for Will (the column-major flow at eight; the 632 action block). Retired.
- `trail-wiring` (`73451c79`): the trail in `src/components/shared/trail/` at his numbers (d140, three seconds, flick,
  180 / 100 px) on the root 404, a phone walking its own path; the shy fade a feathered window (4.90:1). The group 404s
  keep their strip, his to widen. Retired.
- `app-shape` (`aa338766`): the host app's shape as eight decisions on one host's Saturday night, on the shipped `AppShell`,
  `EventCard`, `FilterChips`, `StorageMeter` and the grids: what the home opens on (what needs you), how an event draws,
  what an event's page is (a front page with a door into each room), how seven routes are reached, sharing, settings, You,
  the shape in a hand (a bar at the thumb). Four questions carried.
- `guest-shape` (`beee6325`): the guest experience's shape as seven decisions on one wedding in four access states, phone
  first, the portal-bound shells quoted: the door after the scan (one screen), an empty album (the river), the chrome over
  a wide album (docked at the foot), whether the album admits it is filling, one sheet for four dialogs, a window to take a
  photograph back, one voice for the account. Three questions carried.
- `app-vocabulary` (`e442fc55`): the vocabulary under both shapes as seven decisions: three empty-state tiers, one loading
  primitive only where a route waits (the Reel Studio freezes blank), two of four tile grammars unified, icons on both bulk
  toolbars (measured at 375), the tile-size control in each row remembered per device, one confirm switch.
- `contact-page` (`a8afce0c`; cut `e442fc55`): how someone reaches a person at Partyreel, six decisions on the real desk
  over a host mid-event, a planner and a reporter: whether a form is required (it leads), what the sender holds afterwards
  (the card; a receipt is a send to an unverified address), urgency (a promise per topic), the topic (required), the page
  against the cinema rhythm (the desk inside a cinema frame), what stands beside the form (the directory). Three findings deferred.
- `press-page` (`060dfdf4`; cut `e442fc55`): what Partyreel hands the world about itself, seven decisions on the real
  `PageHero`, `PressSection`, `PressSheet` and copy buttons: who the page is for (one page), the sheet (eight plates; the
  marks are ASSETS row 19), the words (a paragraph and a line), the facts (rows plus the machine-readable copy), a human (a
  role address), the close (the contact door with Press pre-picked), the arc (today's). One question his: "Live now" pre-launch.
- `demo-event` (`e3a2c1b6`; cut `391c40e9`): the demo as the product's first impression, seven decisions on the shipped
  guest page in demo mode and the real doors, laptop first: the arrival (a screen that hands them a role), the framing (a
  mark in a header that stays), the upload as the moment (then the turn), the way out (the blanked Save slot becomes "Start
  your own"), what a door promises (the party named), the phone scanned off the laptop (one session), how many parties
  (one). Three questions carried (the entry-modal pin; the pairing's transport; the demo's server side is UI-only). Seven defects fixed.
- `app-pricing` (`0379c529`; cut `e442fc55`): pricing inside the app as eight decisions on the shipped chrome with four
  hosts, every number from `tiers.ts`, no preview reaching Stripe: what a click opens (a sheet in a hand, a dialog at a
  laptop), what it opens on (the reason they clicked), how much it holds (fitted: 58 percent of a laptop window against
  parity's 95), how `/pricing` stays a click away (a quiet line), the pass (one line and a button), the doors (plus a plan
  row in the user menu; the third option is app-shape's `you`), how a locked control asks (a lock chip), what Checkout
  returns to (the control itself, open). Three questions carried; five defects fixed.
- `pricing-page` (`f79a8037`; cut `1928c3c4`): the marketing pricing page as eight decisions, one per part, every option
  the real pieces with a measured caption and every price from `tiers.ts`: the opening (a fork: the first price 426 px
  down against 735), the pair (Pro takes the row, Free one line beneath), the size (three rows), the pass (an equal card),
  the calculator (today's wall), the sheet (the table alone: 2,676 px to 2,053), the close (four questions open), the
  phone (a swipe row, 1,250 px against 1,850). Three questions carried; three defects fixed.
- `app-door` (`2960db15`; cut `e442fc55`): login and signup as seven decisions on the shipped auth components, no preview
  touching the network: what the door asks first (the code), how many account surfaces (one object worn four ways; 0 of 2
  guest surfaces carry the Terms line), what stands before the app (the name, then a first event ending on a live QR),
  what `/login` is (the door with the product beside it: 13 percent of a laptop today, 50 beside), an existing email (open
  it and say so), failure (the ways out as buttons), a host the browser knows (welcome back, one field). Four questions
  carried; five defects fixed.
- `first-event` (`728513ee`; cut `060dfdf4`): a host's first event from "Create" to a code on the table, eight decisions in
  three beats on the real create card, the preset picker and real `StyledQr` plates, every caption reporting the module
  edge against the 3 px scan floor: what creating asks (the name), where the style is chosen (after, on the real code), a
  Free host at the limit (the form says so), how the code reaches the venue (stock the app prints), where the host lands
  (a beat of its own), what a host holds out (the code alone, full screen), the empty event (a launch list), the first
  photograph (it lands while she looks). Six questions carried; two product misses (swatches at 2.3 px a module; a preview
  link that 404s). Seven defects fixed.
- `guest-upload` (`1649506c`; cut `a8afce0c`): the moment a guest adds a photograph as eight decisions, phone first, on
  the shipped guest components over one wedding, nothing uploading: the tap (two inputs, one carrying `capture`), sending
  (no chrome until two seconds), held (the guest's own photograph waits under a clock), failed (the tile keeps its reason
  and a Retry), the batch (one stacked tile: nine tiles hold 43 percent of a phone screen, one holds 11), the landing (the
  banked shimmer spent once), the warning (the terms at the act; a named stand-in), the words (12 px to 15 px). Four
  questions carried (the camera input drops multi-select; a guest seeing their own held item; a tile before its bytes;
  body-type's floor). Four defects fixed.
- `river-wiring` (`5297cb07`): the album pours out of a real scannable code a tenth down a tall 4:5 door, the card
  streaming behind the copy; the card engine folded into the shared river as one `origin`; `CARD_COPY_SCRIM` on every
  media-forward card; `/demo` a 307. Two questions carried. Both boards retired. `privacy-concept` (`6c99e128`): round
  three, three concepts on the page's theme (a breathing aperture, tiles taking turns clearing, sealed cards).
  `album-wiring` (`2ca47448`): the live album under the host's header at 896, its foot dissolving, lit by the halo,
  photographs falling in at the home hero's pace, the stream a pure engine in `src/components/shared/album-stream/`;
  `album-motion` open with three variations. Three calls his to overrule. Both boards retired.
- **milestone-26** (`df173c2e`): `main` merged from `353ad884` (48 commits) after Will's sign-in on the admin preview: the
  surface module, the jobs console, the sub-sweeps, the static chart aliases; the cutover closed the same night (the domain
  moved by his click, the apex on `NEXT_PUBLIC_SURFACE=app`) and the one purge run on the app surface closed the runbook on
  2026-09-19.

**The second sitting.** The first batch (build `93d00ff`): `cursor-backdrop` r1 whole ("I absolutely love the rail of the
foot") with the ruling that full-image sections are chapter transitions, never at every cut; `image-trail` begun. The
second (build `9720798`, 2026-09-19): `image-trail`, `album-page`, `river-card` and `gallery-width` whole; `privacy-hero`
r2 a `?`; four wiring lanes cut.

**Next.** His sitting on the desk (`voice`, `glass`, `loose-ends`, `body-type`, `admin`, `app-shape`, `guest-shape`,
`app-vocabulary`, privacy-hero round three, `album-motion`); five boards from his stacking steer; then the wiring lanes.

## 2026-09-17 — The wind-down: the sitting's picks become working versions (`257a690d` to `00e82dba`)

**What Will did.** He opened his stepped sitting on the hero, answered its round six `none` in chat ("I
think I liked the more symmetrical approach more than the variants we're using to scatter the photos"), and
round seven was built the same evening. His first batch picked the hero (`stream=stack-above`) and the
palette (`graphite`, no accent), answered four of the light board's asks and ruled the aurora off the light
ground, all at `257a690d` and verbatim in `docs/design/rulings.md`. "Copy so far" stopped resending handled
questions (`a6afec3b`). Two wiring lanes cut at `6f5c61e1`, the album hero's round three at `cbad7faf`.

- `palette-wiring` (merged `88d0bec0`; bible 1 ruled and the ledger gone at `52e9afa2`). Graphite became
  the palette in both modes: a Pearl page at 0.995, one Graphite room at 0.105 for the app and every cinema
  chapter, Apple's cool greys at hue 286 between them, no accent anywhere. The dark card went opaque, which
  retired the system's one translucent surface by ruling; `--faint` landed as the third text step and took 40
  hand-faded sites off their five alphas. The one unforeseen split: the media well fell to 0.065 and the
  footer slab rose to 0.165, so `.surface-ink` writes its values out.
- `hero-wiring` (merged `0c58ff76`; the ledger gone and the artifacts regenerated at `137e504b`). The home
  hero is the band of photographs streaming out of the real demo QR on one axis, the ruled block at the
  band's measured clear line, no caption; the living album wall left with its scrims and the kinetic word.
  The engine came out of the lab as `hero-stream.ts`. Its finding: the ruled 560 px hero minimum does not
  survive it (683 at `lg`, 642 at `base`, pinned). The 34 squares (ASSETS row 2) stay the ask.
- `album-hero`, round three (merged `57e2c2e4`; the touchpoint at `759a557b`). Will's six notes on round
  two answered: four calm compositions on one engine, and the lockup composed for this page as ONE block, so
  the centre gap left with the vent it held open. `compositions.ts` places every photograph off the lockup's
  measured box rather than behind a scrim, and the calm rule became arithmetic (nothing over 40 px a second,
  at most sixteen frames lit, every card sized to its largest moment so a photograph only scales down, which
  was the jitter). Three calls it made on its own recommendation still wait for Will on the board.
- The production bug it found, fixed on its own branch (merged `0c9caedc`): `/features/album` threw for
  every reader with Reduce Motion on, because a looping fill's end tick was Infinity and the jump indexed
  `arrivals[NaN]`. A loop has no end, so its still is now defined rather than reached.

**The second batch (`1cb34f70`).** Will ruled the type scale on every ask and kept the throw and the
aurora, which with the seam is the whole of what he calls the Aurora ("another alternative way to infuse
the Aurora into our UI", every form off paper). He returned six light cards as `refine`, each note saying
the card did not show what it asked, then reread his paste worried the notes were crossed. They were not:
the trailing `note: "on paper: ..."` was a withdrawn step whose text his browser still held. `composeSoFar`
now sends nothing for a withdrawn step and `Transcribed` carries the round's notes (`4280a59c`).
Three lanes cut at `c338c95c`: `type-wiring`, `light` (round eight) and `aurora-wiring`.

- `aurora-wiring` (merged `2987a5e5`; the tuner knob at the next commit). The three forms of light Will
  kept landed as one family in his word: the clock ruled to 8s on every lamp with `--aurora-cadence` beside
  it as a sibling (three laps, 24s), and `SectionLight` as the field's one mount. The no-light-ground ruling
  became a CSS fence keyed on `[data-section-light]`. Being the first lamp on the transform drive exposed
  that drive's missing resting `translate`, which parked the comet dead centre at full strength for every
  reduced-motion visitor.
- `type-wiring` (merged `0a52c8dc`; bible 5 ruled at `aaa057dd`, the ledger gone at `4c5500da`). Will's
  type ruling shipped: ladder B baked as one `@theme static` block of nine `--text-*` steps generated from
  the board's own `themeBlock(B)` rather than retyped, each a clamp through (375) and (1440). Three
  four-breakpoint ramps collapsed to one class each and about sixty headings moved onto a step by ROLE. Four
  traps were measured and held by `type-ladder-policy.test.ts`, the sharpest being that `cn()` silently
  dropped a step beside a text colour until `utils.ts` declared the ladder to tailwind-merge. The board
  retired into Foundations. Left for Will at 375: marketing's sub-heads (20) out-shout the `prose` h2 above
  them (18), and the dead-link title is 18 beside 17px body.
- `light`, round eight (merged `ee0b21d6`): it found why round seven showed nothing, its effects all having painted behind or under opaque boxes.

**The third batch (`c9903c99`, `dc4530df`).** Will finished round seven's walk on the ALIAS, which still
served that round because no `[preview]` had followed `aaa057dd`, so his line arrived as `r7` against a tree
on round eight, and was transcribed against round seven's own spec on a scratch tree. It closed all twelve
of that round's cards: the bloom kept, the halo kept "only to light objects from behind" and never as a
button wrapper, the beam kept with "matching radii", and the Aurora "a mix of all of them... custom and
bespoke, not a couple of identity components reused everywhere in the same way constantly."
The beam's defect was the board's: its specimen named a radius token that does not exist, computed square,
and the vendored library falls back to 16px on a zero, so `ProCardBeam` measures its card's corner now.
The Aurora reached the home page the same day, each place composed for itself: the closer takes light at
its bottom edge only, rising from the line it shares with the footer's seam, and the guest ledger is lit
from its open side. `SectionLight` lost its default placement and gained `from` and `reach`. The lesson is
in the manifest: the alias is rebuilt whenever a board changes.

**The fourth batch (`871f650b`).** `light r8` answered every step (`depth=both`: "I now see how step,
ring, lift, and float work together"; `face=keep`, with "a tweak to feel more polished" and the radius
mismatches he saw in the preview; `sweep=skip`, the shimmer banked as "a delight moment") and
`floating-surfaces r7` picked Card with Glass's quieter group labels and no one-off glass, kept the
submenu at two levels, and asked by name for a Glass exploration across marketing and app. He stopped
there: "Clicking the configs didn't seem to change anything." The presses had registered; the 6x corner
drawing he was judging was read once and never again, a press on a catalog card's picture landed inside its
frame, and rounding's stage mounted lazily. `pnpm lab:demo` is the check that was missing: real Chrome over
its DevTools protocol, pressing every open step and failing a stage that moves under 0.1 percent.

- `publish-bloom` (merged `7e713fe8`). The publish moment joined the Aurora: the engine's bloom as wings
  behind the Studio's frame and a pool under the share card, mounted only while a reel is shared, the
  swell owed to the tap (`sharedHere`, which also ended the violet replaying on every load), nothing on a
  light ground through the ONE fence rule extended rather than copied; signed in on the alias both resting
  states and the fence hold.

**The fifth batch.** `entrance=by-frequency`, and `radius=nested` with "Rounder seem to be the same
option... please pop this question back up." There is a difference (8px with 4px rows against 12px with
8px), hidden because both NEST and a tile was a third of true size: the corner is drawn filled at true size
through the kit's new `TrueFit`, and a staged step re-asked only that pair. He also delivered **the v1
wordmark**: `src/lib/brand/wordmark.ts` holds his one path, `Logo` is the wordmark alone in `currentColor`
on every door (22px in a bar), the social card draws the same path. The mark stays a stand-in until his v1
icon (ASSETS row 19).

**The sixth batch.** `roundness=nested` ("Still no visual difference, but let's go with your pick for now")
closes floating surfaces. Then the one that matters: **Will killed the brand voice exploration.**
`brand-voice r7` left `voice` open and answered the three questions the voice never decided
(`noun=album`, `unfurl=join`, `counts=hero`). His reason: the agent "worked too hard trying to generate
multiple unique voices rather one that's perfect, then we kept running in through unreviewed rounds to dig
deeper into each without shaping along the way." The tree agreed: ROUND SEVEN with the ledger never once
written, six voices and 4,121 lines deep, and its own contract made two voices that AGREED owe a written
excuse, which is the machine that forced them apart. Two rules stopped being prose: `registry.test.ts`
fails a board past round 1 with no ledger, and options are never forced apart. He kept none of the 510
lines, so `voice-picks` shipped his three answers and a new `voice` board rebuilds the voice from won
lines. He specified that form himself after withdrawing a two-draft idea of his own: a shape that "would
likely require many fine notes over one cohesive answer" is the wrong shape, whatever its content. **The
seventh:** the media kit killed for generated frames, one Higgsfield month before launch (ROADMAP); no
agent tracks an image's rights, so the stills' `credit` field went with the board.

- `light-wiring` (merged `47bba92a`; bible 10 and 11 ruled and the ledger gone in the same window). Depth
  became four techniques with one job each: the step and the ring everywhere, `--shadow-lift` only where one
  object really overlaps another, `--shadow-layer` under anything the page keeps living behind, and nothing
  under a flat surface in either mode. Paper kept its bytes; dark and the ink slab gained the ramp that made
  them read as shadowless. Forty-five raw shadows and thirty readers of one token were judged once each by
  role, three surfaces joined the floating family (select, the nav indicator, the toast), and
  `elevation-policy.test.ts` refuses the four ways back in. The bright edge shipped as one `data-lit`
  attribute on the box that owns the radius, fenced to dark grounds, its contract mutation-tested twelve
  ways. Foundations gained the legend Will said made the system legible; the shimmer stays unwired.
- `voice-picks` (merged `2735ad92`). The only three things the killed exploration decided, shipped as working
  versions. `noun=album` swept **17** guest strings, not the five the board claimed, and deliberately left the
  CODE noun alone (`/api/guests/gallery`, `gallery-access*`, `LiveGallery`): guest-flow.md records that split
  so nobody "fixes" it in either direction. `unfurl=join` made the link preview one invitation for every open
  event. `counts=hero` put 312 and 48 on one line with "Created for you." under it, which needed `splitFact`
  taught to split on digit RUNS (it took the first integer and swallowed the rest). Three marketing mocks
  quoted the old guest copy and nothing went red because they were never pinned; swept and added to
  `mock-parity.test.ts`.
- `floating-wiring` (merged `8bb6aa9e`; bible 15 ruled and the ledger gone in the same window). Card shipped
  as PARTS a menu may leave out rather than a shape baked into the panel, which is the board's own cost line
  answered ("a two-row menu is suddenly furniture"): five menus gained a title row, labelled groups in
  Glass's treatment, an icon rail and a footer rail; two wear the layer and nothing else, each saying so.
  Bible 15 became a MODULE, `ui/floating-layer.ts`, with the row's corner DERIVED from `--radius-float`, so
  the ruled 8/4 pair is one token to retune, and its first test refuses a panel that spells its own corner
  or clock, an exit slower than its entrance, a new primitive nobody listed, and any `backdrop-filter`
  while Glass is banked. `select` joined the family, the submenu is portalled and capped at two levels, and
  entrances went by frequency: instant for the tooltip, dropdown, submenu and select.

**The lab itself, upgraded (Will asked for it while the lanes ran).** Measured first across all 21 open
steps: the stage sat up to 5.6 SCREENS below the option it answers to, one step was 19.7 screens tall, and
nothing in the lab was sticky anywhere. That is what "clicking the configs didn't seem to change anything"
actually was, twice. A step now reads the way a configurator does, stage above the options and pinned with
the knobs that drive it, at every width: out of reach went 3 of 11 to 0, worst reach 5.6 screens to -0.2,
tallest step 19.7 to 6.6. `look`, the author's sentence naming what separates the options, was carried on
the step type and never rendered, which left river-visual's four words-only steps as a question and three
unlabelled words; it prints now. `lab:demo` fails a stage that drifts back below its options and prints the
tallest step, the wordiest, and how much of the sitting asks with nothing to press. The paste says which
build composed it, so a batch composed a round behind can be told apart from one composed on the tree.

Then the authoring surface itself, which was the actual cause. An agent wrote a PAGE (`BoardSpec`:
sections, candidates, departures, assets, a verdict, a catalog) and the steps were derived from it, so an
option's preview was "a section id plus a state patch" some section had to be built to vary on, `look` was
the legal way out, and nothing required an option to be drawn at all. **`defineExploration` takes the
questions and emits an ordinary board**: it derives the sections, the controls, the state patches and the
verdict, so the desk, the walk, the grammar and `lab:review` work with no seam, and **every option is
pictured by construction**. A missing preview is a TYPE error at the board, not a blank tile at the review
(proved by deleting one). `type-phone` is the first, and it is the three type calls that had sat in the
ROADMAP as prose since `type-wiring`: three decisions, 48 to 61 words each against the old boards' 112 to
413, every option the real surface in a 375 column. Two bugs it forced out: the transcriber found its
object with `indexOf("{", indexOf("defineBoard("))`, which CLAMPS to 0 when the call is absent, so a spec it
did not understand was silently mis-scanned rather than refused; and a tile always drew in a 1440 canvas,
so a phone column arrived as a thumbnail.

**Then.** His sitting finished on type-phone, rounding, the album hero and river-visual in the next two batches.
