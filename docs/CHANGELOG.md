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
addressed in our design system type ladder"; `rounding` r7: family C, `ladder=quarters`, `dead-rungs=drop`,
`gap=pinned`); the Terms got their generated-media sentence. The ninth (`d62dac22`) closed album-hero r3
(`composition=none`: "my calm instruction messed us up - now it feels too boring") and river-visual r2, and answered
`proportion` with the lab itself. The calm lesson is PROGRAM.md's: a relative note is answered against a reference,
never a cap and a test.

- `ladders-wiring` (`5a5c6eb4`, `d2db2629`; bible 5 and 8 ruled): the type ladder's law became the ORDER
  (`prose` 24 at a phone, a tenth step `subhead`, 126 off-ladder heading elements onto their step or named in
  `type-ladder-policy.test.ts`, the trim tracking its leading) and the corners family C in quarters (8 / 12 /
  4 with the gallery gap pinned, 3xl and 4xl set to `initial`, a `cta` Button on 46 sites, `--shadow-float`
  and `--radius-action-lg` retired). Its finding: `cn()` did not know the radius tokens (`RADIUS_TOKENS`).
- The lab's step, rebuilt (`d37be90e`): the preview is the page (every option mounted once at true size,
  flipped or side by side, a sticky head naming it) and the answer is a dock (1-9, x, g, n, ?, Enter); a
  transcribed `?` leaves the walk and the walk's end checks the ledger (`alreadySent`); `lab:demo` fails
  CLIPPED, UNLABELLED, NO DOCK and a stage below 0.6 of a screen.
- The glow boards retired with nothing open, and with them the `[data-lit]` leak into production's bright
  edge; the stylesheet floors became checks on fixed files; `lab:smoke` passes whole, so its exit is a gate.
- Four boards cut on three lanes (`33f1de95`): `privacy-hero` and `album-page` (`heroes`), `river-card`,
  `gallery-width`; a board's preview may be a function of its state.
- `gallery-width` round one integrated: four decisions, each option the real guest or host event page in a
  `Frame` at 1280, 1512 and 1920 with its columns measured inside it. The tile (180, 240 or 300 px;
  240), the width (the full window or the app's 1280 column; full), where the words sit (the album's
  edge or centred; edge, added once the wide page showed it), and whether the host follows (same). The
  candidate is one `column-width` per gallery from `sm` up, so the phone keeps its two columns.

- The Orchestrator changed seats mid-round: the previous one was cut by a weekly limit with three lanes
  mid-work, and a new one on a second account resumed all three the same day (Fable orchestrating; the
  board lanes on Sonnet, the wiring lane on Opus, by Will's ruling in PROGRAM.md "Model delegation").
- `heroes` integrated (`6b5ea1bf`): `privacy-hero` recuts "the field" as two opposite spirals behind the
  Privacy page's lockup, graded against the home hero's pace (the pace, the gap, the trail, a phone answer),
  and `album-page` answers the album hero's round four (the live album at 896 with its foot faded or today's
  filling demo, three kinds of subtle motion around the words, the album's light, a second light). Every
  option a real `Frame` at 1440 and 375, every tile measured against its words.
- `ghost-wiring` integrated (`31c94253`): the guest album's empty state trades its faint 3 by 3 grid for the
  river, so Will can judge `guest-photos=ghost` in the full app. The engine's production home is
  `src/components/shared/river/`, rewritten in fractions of its box (it takes its width from the column, and
  the fall is solved from the cut rather than typed, which had cut two of nine cards in a square box);
  ghosted by a filter on the placement's wrapper at the board's values (grayscale 0.85 at 40 percent, his
  to move), nothing at the top of the flow (bible 4), the title and CTA kept. Measured: no frame work off
  screen, on a hidden tab or under reduced motion; the flow stands with JavaScript off; 44 KB of WebPs; zero
  long tasks with four rivers running. Two contracts and a Library entry.
- `river-card` integrated (`3ed62f0c`): the river in the real QR door at 4:5 and 3:2, the code unlabelled
  and unlinked: where it sits, where the photographs end (a fourth question the drawing surfaced), what it
  opens (the short `/demo` link fixes the scan floor; the event's full link leaves 0 px of clearance in the
  short door) and what the short door does. Every drawn code measured exactly 3.0 px a module.
- `voice` integrated (`e0b92af6`; cut `13dd8ffd`): round one of the voice derived from won lines, eight real lines
  in the places they are read with three or four close candidates each, bible 20's question first (does the first win
  bind the other seven); every option a real surface at 1440 and 375.
- `body-type` integrated (`130236c2`; cut `707d99a2`): the body and label ladder as seven decisions, every number
  measured in the frame: a guest's reading copy (16 recommended), the app's body (14), marketing copy fluid 16 to 18,
  the caption step and floor (12), the label pair (12 on 0.14em), buttons on the ladder, line height 2 x size minus 8.
  Two questions: the four step names, and one size for caption and label.
- `glass` integrated (`30aaf705`; cut `5e03ffe2`): round one of the Glass exploration on the app's chrome over
  photographs: four recipes in numbers (Frost recommended), one grade or two, the lightbox's backdrop, the chips over
  tiles at a phone, the reel's controls, the host's row, the light ground on its own step, every cost read off the
  compositor trace under a 4x throttle. Marketing and the aurora marriage are round two, after his notes.
- `loose-ends` integrated (`b83b7c3d`; cut `5e03ffe2`): six ROADMAP lines as seven decisions on their real surfaces
  (the admin chart's cast in both modes, one FAQ look, the hero at a 900 px tablet, the album's three ambient pieces).
  Found on the way and fixed at `0681652c`: four of the five `--color-chart-*` aliases were never emitted by
  `@theme inline`, so a series read by name painted black; the aliases are `@theme static` now.
- **milestone-25** (`bf9cbd74`, 2026-09-18): `main` merged from the `launch-prep` tip `707d99a2` on Will's
  word ("we could begin getting main current to launch prep"), 1,138 commits: partyreel.com now serves Graphite,
  the type and corner ladders, the Aurora with shadows by role, the home hero's band and the v1 wordmark, Card's
  floating layer, the three voice picks and the river on the empty album; the lab gated (404 without a key).
  Stripe stays TEST; no launch switch flipped. The verification pass on partyreel.com is recorded below the
  merge in git.

- `admin` integrated (`d6305818`; cut `0681652c`): round one of the portal's shape as seven decisions on the real
  admin components fed one Tuesday of fixtures at 1440 by 900 (two backend runs down, one account over cap, three
  reports, nine messages): the operator's home (a ranked list of what is waiting recommended), the nav for twelve
  surfaces (a rail plus a command palette), density (a table for data and a reading pane for prose), how far a
  state's colour travels (the chip), one grammar for three destructive acts (a sheet sized to the damage), where
  health is said (a band under the bar on every page) and how much of the product's bar the portal keeps (a 44 px
  tool bar). Four screens from Mobbin shaped decisions and were designed from the ground up. Four questions carried
  on their recommendations and closed by the Orchestrator: the chart ramp stays `loose-ends`'s for the product and
  the admin gets its own in the wiring round; `touchpoints.ts` gained the `admin` surface at the merge; nothing at
  375 and no light-against-dark in round one; the palette ships closed behind a key if it wins. Three defects it
  found in the shipped portal are on the ROADMAP's admin bucket.
- `admin-split` integrated (`7f3738ba`; cut `0681652c`): the admin became its own deployment without leaving the
  tree. One pure module, `src/lib/surface`, answers which surface a build serves; the proxy, the `requireAdmin` seam
  and the purge cron decide from it (the admin surface an allow-list, the app surface 404ing `/admin`, unset serving
  both, which is the rollback). The lane's four calls stand (the probe and `robots.txt` reachable on the admin host,
  the domain after the milestone, a `[preview]` push building twice). The cutover ran the same night up to the
  preview proof: the project created by Will, a team token minted (the old one was project-scoped), settings
  mirrored, env copied and verified value by value after a first copy of ciphertext, the Sentry upload trio dropped,
  the preview callback added in Supabase, the preview host's allow-list probed and Will's sign-in there.
- `admin-jobs` integrated (`3ad58b1c`; cut `0681652c`): the jobs console stopped meaning four crons. The catalog
  gained three kinds (a `scheduled` job with its own rows, a `signal` whose only question is what failed in the last
  24 hours, a `derived` reading riding another job's counts), all through the one pure `jobHealth`, and nine jobs
  joined it. The backup Worker reads the Cloudflare queue and dead-letter depths on every run (any dead letter is a
  failure, alerting where the number arrives, since a freshness rule can only page on silence); the purge cron's four
  account-looping sweeps became jobs with their own switches and per-row isolation (QA #27 closed); `sendOnce` and
  both rate limiters stopped failing invisibly (QA #19). The lane's cross-lane patch (six files outside its owns)
  landed in the merge; the additive migration (four `ops_flags` rows, one `sent_emails` index) is applied with the
  advisor set unchanged; the Worker deployed the same night (version `d7b16bcc`, both queue producers bound), so the depth reading lands with the next 05:00 UTC run.

- `cursor-backdrop` integrated (`592955ab`; cut `9e2a573b`): demo six as a board, six decisions on the shipped
  home sections imported and drawn in place: which UI-forward section takes the first switching photograph
  backdrop (`full-quality` recommended), how the copy survives eight photographs (a glass pane; the muted tier
  leaves the copy over media, measured against every photograph's worst block), what switches it (the cursor's
  position across the section), how it arrives (a slide from the way you moved), where it sits in the
  dark/light run (on a strip of all fifteen sections), and the phone (the scroll). A pure engine with a
  scripted pointer; 61.7 frames a second under a 4x throttle; the pool's decode cost and the stand-ins' size
  became the "room frames" asset ask (row 20).
- `image-trail` integrated (`dd44692e`; cut `9e2a573b`): our own image trail as one pure engine (a photograph born on travel, sliding to
  the source and decaying behind it; no dependency; the keeper holds the newest while the hand rests, the shy
  fade yields to the words it crosses) and two boards on it: `image-trail` round one (density, the decay, the
  entrance, the size, the home on real pages, the phone) and `privacy-hero` round two, the same trail fed by
  a path where the cursor would be, replacing round one's spirals and wake after Will's none (`rush`, two
  notches over the home hero, recommended). Round one's verdict was transcribed from chat into the ledger.
- `backdrop-wiring` integrated (`9795e370`; cut `a0a84e04`): Will's ruling wired the same night and the board
  retired. `full-quality` wears a switching full-bleed pool behind the glass plate with the band trigger and its
  foot rail, the slide entrance, five of six photographs on scroll trip wires at a phone and a still under reduced
  motion; the engine and `PhotoSection` are production modules beside the river (two contracts, 48 tests, a Library
  entry). His fold landed as one line: `live-demo` changed register, so chapter one closes on the photograph and the
  paper chapter opens on the demo's stage, the order untouched (the merge into the album section was the other
  reading; his to overrule). Measured: the copy at 5.12:1 over the worst photograph, zero animation frames at rest,
  the switch compositor work; a zero-area IntersectionObserver that would have shipped the phone rule dead was
  caught. Row 20's ask is amended to 1200 px delivered, since `next/image` never upscales and the delivered width
  is the cap on what a full-bleed layer decodes.
- **milestone-26** (`df173c2e`, 2026-09-18, late): `main` merged from the `launch-prep` tip `353ad884` (48
  commits) after Will's sign-in on the admin preview: partyreel.com runs the surface module, the jobs console on
  three kinds with the Worker's depth reading, the sub-sweeps and the limiters that report, and the static chart
  aliases; the four new boards answer 404 without a key. The cutover closed the same night: Will moved the domain in
  the dashboard (the API move is the one step the Orchestrator's guardrails refuse), a fresh `_vercel` TXT at GoDaddy
  verified it (the apex domain object lives under his personal account), the apex took `NEXT_PUBLIC_SURFACE=app`
  with a redeploy, and the live red-team matched the runbook's table (every app route, the lab and the webhook 404
  on the admin host under GET and POST; the cron there 401 without the secret, `skipped: not_this_surface` with
  it); Will signed in on the new host and the three env-proving pages rendered.

**The round's second sitting, first batch (build `93d00ff`).** `cursor-backdrop` r1 whole (`full-quality`, `plate`,
`band` "I absolutely love the rail of the foot", `slide`, `insert` as a soft ruling, `scroll` at four or five
photographs) with the ruling that full-image sections are chapter transitions, used sometimes, never at every cut,
and for this instance closing chapter one with the live demo folded into the next; `backdrop-wiring` cut from it.
`image-trail` r1 begun: `d140`, `decay=long` with three seconds suggested.

**Next.** His sitting on the boards on the desk (`privacy-hero` already answered none, its round two in
`image-trail`), and the ghost on a disposable event on the alias; `image-trail` and `cursor-backdrop` integrate as
they hand off; the domain move, then the apex flag, close the cutover; then the wiring lanes from his notes.

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
