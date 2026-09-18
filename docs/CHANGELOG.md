# Partyreel — Changelog (the last two rounds)

> ROLE: what shipped in the current round and the one before, with the commits and the verification.
> BELONGS HERE: at most two dated entries, newest first, each at most 160 lines. · NOT HERE: how the
> system works now (→ [`systems/`](systems)), what is next (→ [`ROADMAP.md`](ROADMAP.md)), the live
> state (→ [`STATUS.md`](STATUS.md)). GROWS BY: a new entry at a round's close, and the third-oldest
> entry deleted in the same commit. Everything older is in git: `git log --oneline` for the commits,
> `git show 932fdee9:docs/CHANGELOG.md` for the last full archive (5,495 lines, 2026-07-02 to 09-16),
> `git show dd77fc9e:docs/CHANGELOG.md` for the Library x Lab round's entry, `git show 52e9afa2:docs/CHANGELOG.md` for the revamp's.

---

## 2026-09-17 — The wind-down: the sitting's picks become working versions (`257a690d` onward)

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

**Next.** His sitting continues on type-phone, rounding, the album hero and river-visual.

## 2026-09-16 — The stepped review round: the review as an onboarding form, every board reshaped into steps (`02c409b4` to `dd77fc9e`)

Will stopped his first per-item sitting on the round-four catalogs: "the review process favors you and
makes me spend tons of time per track figuring what I'm even being asked." He asked for every open track
to run one more round shaping its previews and information for a question-based review, staged where one
depends on another, the desk current, old answers never re-sent; his model was "a multi-step onboarding
form where all context is made available for 1+ questions around the same content, then onto the next
context", with four screenshots (Cofounder, Adobe Express, Linktree, Biosites) as the feel. He rejected a
machinery-heavy first plan with the steer that binds from here: the end goal is the product, fast
iterative rounds beat slow meticulous ones for design, HTML and CSS is shaping rather than QA, the lab is
a means. The round ran in one day: the spec fields, one kit lane, then every board four agents at a time,
each integrated as it handed off; the record of the plan is `/Users/gibby/.claude/plans` (the Orchestrator's).

**The fields** (`02c409b4`). `board-spec.ts` gained `Ask.lands` (what an answer decides platform-wide),
`Ask.after` (an earlier ask or a card of the board's own catalog the question waits on), `Ask.strip` (the
controls a step keeps beside its stage), `AskOption.state` (how an option is drawn on the specimen),
`Candidate.lands`, and `CatalogSpec.mode` (`pick-one | keep-any`), `winner`, `walk` and `stage`;
`registry.test.ts` rules on them, an ask mirroring a clearable control may offer its cleared default as
`none`, and `look` is optional once every option is drawn.

**`lab-flow`** (merged `c18570c4`) rebuilt the review as the form on the pieces that existed. `step.tsx`
renders one context and its question alone on the screen: the options as preview tiles drawn on the
board's own section in each option's state (a press shows on the stage through the URL, a second records,
a third clears and puts the mirrored control back), a config strip, the real surface as the stage, the note
with "This question is not clear to me", Back and Next; a pick-one catalog is decided by its winner ask on
the cards themselves with "None of these: new directions" as the third exit, so the ledger line is
`<ask>=none "..."` and the grammar never grew a word; a keep-any catalog walks one card at a time with
`BeforeAfter` and "Lands as"; `Ask.after` stages a question until its prerequisite is decided (the ledger's
side resolved on the server, the sitting's in the store) and drops it as moot; the desk lists the walk's
own steps, badges what is held but not sent, dims what is staged, and "Copy so far" omits what the ledger
already holds. The Answer's ask pills, the board index, the sections' "Rule on:" rows, the review panel,
"Take me there" and `waitingOnWill` were deleted, which alone halved the catalog boards' reading; a tile is
a `role="button"` div with an inert preview because a section holds real buttons; `pnpm new-board`
scaffolds the pick-one shape.

**The boards**, each reshaped in half a day with no new exploration, every one now under the standard
1,200 words with its budget declaration deleted:
- `home-hero` (merged `56ea9185`, asked as pick-one at `c334de13`): round six's catalog of four
  compositions of the stream (mirror, phrase, settle, ribbon) on one engine, every seeded value a step in a
  declared table, the board recommending the settle; the winner asked on the four cards plus none; 743.
  Will answered it none in chat the same evening (the symmetric approach like the original reference over
  any scatter, `514a5902`), and round seven (`ccf93732`) was built in the root tree with no lane: the
  engine gains a turn by distance, a polar placement and a lockup with its own axis, and the board carries
  the band (Melius's shape, recommended), the orbit (Cosmos's ring centred on the code, the block hung
  under it) and the band with the whole block under or over the code; 779.
- `type-scale` (merged `ec7367e7`): one pick over five ladders, then letter spacing and the 404 heading as
  two-tile steps, the second staged behind the pick; round six's open question settled by one real page
  re-typing itself in place with a second copy under it on a fade; 486.
- `light` (merged `7ed0d2a2`): the twelve walked one at a time in Will's order on three specimens (the
  lamps on one chapter, the depth cues on one pair of overlapping tiles, the marks on one reel frame), each
  drawn as today and with it, with what it lands as and its usages; the four calls as tile steps; where the
  aurora lands staged behind keeping the aurora; the order ask renamed `second` so round five's
  `infusion=phase-1` stands; 920.
- `palette` (merged `49ed0fbf`): one pick over the twelve, the real product as the stage on one Screen
  control, the accent, card, faint-text and reach questions as tiles on one specimen each, reach staged
  behind accent on; the guest masonry and its portrait-pair ask withdrawn; 1,191.
- `floating-surfaces` (merged `514aee2d`): one pick over the seven directions, the real product as the
  stage, the four calls as tile steps each on one menu, the shipped nested-submenu bug named in its step
  for the wiring round; 922.
- `rounding` (merged `7d90465c`): one pick over the six families, one real page re-skinned in place, the
  button, ladder, dead-rung and gap questions as tiles at true pixels; 684.
- `brand-voice` (merged `0c1cfa60`): one pick over the six voices on three lines at phone size, the real
  home page as the stage, the noun, unfurl and counts questions as tiles and the scope question means-only
  behind the pick; the spot list stays as the whole board's own section off the walk.
- `media-kit` (merged `61063785`): thirteen cards in one keep-any gallery, a kept card a purchase priced
  on the card, the crowds question as two tiles on the blog's own row, the rule, spend and shoot questions
  means-only over real stages; the side-by-side section and its twenty-six dock pills deleted; 1,077.

**Fixed on the way.** The library artifact regenerated after a touchpoints edit (`627ca513`; CLAUDE.md
names `touchpoints.ts` among what triggers `pnpm design:rules`); three manifests stopped reading the merged
kit manifest (a manifest is never a stable read); the hero's touchpoint entry and two media-kit asset
references brought to round six; a card's "Lands as" line drawn on the picked card of any grid
(`ef5e737d`); the meta panel's Ideas rows visible again, a native details folds by itself (`e6e05afb`).
The kit findings sit on the ROADMAP's Now list: a true-size box whose reads settle, a declared tile size
for a board whose tile is the specimen, a one-at-a-time step's config strip, a blocked step reached by URL
numbering itself past the end, `lands` on a keep-any gallery, a tile that takes its board's canvas width.
One rule broken: the light agent force-pushed its own branch once after amending a pushed commit; no
damage, and every later brief says a fix is a follow-up commit.

Gates at every merge: `pnpm design:rules`, typecheck, lint, the tests (2,160 at the close), the build
(258 pages), each on its own exit code; `pnpm lab:smoke` over 257 checks with no route failure and only
the two glow boards over budget, on purpose. The alias build waits for Vercel's cap (2026-09-17 00:13
UTC). Next: Will's stepped sitting on the desk, then a wiring round per pick (the wind-down: a favourite
becomes a working version in the Library and the board retires), and Round 3's planning pass after the
sitting.
