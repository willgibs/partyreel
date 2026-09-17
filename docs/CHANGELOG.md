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

**What Will did.** He opened his stepped sitting on the hero, answered its round six `none` in chat
("I think I liked the more symmetrical approach more than the variants we're using to scatter the photos
as they stream out, similar to our original reference example"), and the Orchestrator built round seven
in the root tree the same evening (the band, the orbit, the two stacks; `ccf93732`, recorded under the
stepped review round below). His batch then picked the hero (`stream=stack-above`, "We can drop the
'Every photo here came from a guest who scanned it' label underneath the QR code") and the palette
(`palette=graphite`, `accent=none`, `card=declared`, `faint=in`), answered four of the light board's asks
(`cadence=8s`, `publish=house-five`, `second=home-arc`, `item:seam=keep`) and ruled the aurora off the
light ground ("No light ground usage is a decision for now"); all transcribed at `257a690d`, verbatim in
`docs/design/rulings.md`, the light board's `paper` ask withdrawn at `716cb49c`. He also asked that a
handled question never copy again: "Copy so far" sends only a board's open round from `a6afec3b`
(the rules artifact it left stale regenerated at `78a54014`). Ahead of his sitting he left six notes on
the media kit and the album hero; the media kit's cards open a door to each source's own search
(`c667db3c`) and the album hero's round three was cut on the notes (`cbad7faf`).

**The lanes.** Two wiring lanes cut at `6f5c61e1` (`hero-wiring`, `palette-wiring`), the album hero's
round three at `cbad7faf`; three of the four slots.

- `palette-wiring` (merged `88d0bec0`; bible 1 ruled and the ledger gone at `52e9afa2`). Graphite
  became the site's palette in both modes: a Pearl page at 0.995 with a card the same white, one
  Graphite room at 0.105 for the app and every cinema chapter, Apple's cool greys at hue 286 between
  them, and no accent anywhere. The dark card went opaque, so the system's one translucent surface
  retired by ruling rather than by accident, and the cinema deepening in marketing.css went with it
  because the room is cinema now. `--faint` landed as the third text step in all four registers and
  took the 40 hand-faded sites off their five alphas. The one unforeseen split: the media well dropped
  to 0.065 and the footer slab lifted to 0.165, so `.surface-ink` writes its values out instead of
  deriving them. The board retired into its ruling; 2,117 tests, 258 pages, the smoke at 0 route
  failures. Its finding: the rule page falls through to a deleted manifest when a ruled board retires
  (a ROADMAP line), and its deferred lines are the ROADMAP's (`.surface-mat`, the chart ramp, the
  `--faint` a11y pass, the lab boards' hand-faded sites).
- `hero-wiring` (merged `0c58ff76`; the ledger gone and the artifacts regenerated at `137e504b`).
  Will's round-seven pick shipped: the home hero is the band of photographs streaming out of the real
  demo QR on one axis, with the ruled headline, the ruled sentence and the two actions in one block at
  the band's measured clear line, and no caption. The living album wall left with its three scrims,
  its reel card and the kinetic word. The board's engine came out of the lab as `hero-stream.ts`, cut
  to the one composition, with its horizontal turned into a fraction of the hero's half-width (so the
  band is fluid) and its geometry turned from two canvases into two breakpoints, each solved at the
  canvas Will judged and re-checked at the narrowest viewport it serves. Four numbers were measured
  on the rendered page rather than reasoned about, one of which was a phone QR too small to scan. The
  board retired in the same act; the Library's `cinema-hero` entry is badged new; 2,108 tests, 257
  pages, the smoke at 0 route failures. Its finding: the ruled 560 px hero minimum does not survive
  the composition (683 at `lg`, 642 at `base`, derived and pinned by the contract); its deferred line
  is the tablet breakpoint (the ROADMAP). The 34 squares (ASSETS row 2) stay the ask: 18 are needed
  for no photograph to be on screen twice.
- `album-hero`, round three (merged `57e2c2e4`; the touchpoint at `759a557b`). Round three answered
  Will's six notes on round two with four calm compositions on one engine and a lockup composed for
  this page as ONE block, so the centre gap went with the vent it used to hold open. `compositions.ts`
  places every photograph off the lockup's measured box rather than holding it off with a scrim, at
  both headline steps, and the calm rule became arithmetic: nothing over 40 px a second, at most
  sixteen frames lit, and every card's DOM box sized to its largest visible moment so a photograph only
  ever scales down, which was the jitter. The still is now the loop's own first frame, which is why the
  no-script answer flipped to painting the album settled. The album below is centred on a 720 / 880 /
  1040 step, and the board is a pick-one catalog at 830 words with its declaration deleted. Three calls
  it made on its own recommendation, for Will to overrule on the board: the page's arrivals stage goes
  with the old hero (the centred album says "live" with the product); the arrival card's settle is the
  one thing allowed past 40 px a second, written into the rule by name; at the louder headline step a
  station with no room is dropped rather than shrunk, so the picture tells the truth about the cost.
- The production bug it found, fixed on its own branch (merged `0c9caedc`, on the alias at 04:45 UTC):
  `/features/album` threw for every reader with Reduce Motion on, because a looping fill's end tick
  was Infinity and the reduced-motion jump indexed `arrivals[NaN]`. A loop has no end, so its still is
  defined rather than reached: one pass landed with its checks cleared and its columns bounded
  (`stillAlbumFill`), derived through the non-looping path; a running loop is never clamped at its
  pass end; the test pins the still, the reported repro and the unclamped loop.

**The second batch (`1cb34f70`).** Will ruled the type scale on every ask (`ladder=b`,
`tracking=adopt`, `not-found=on-ladder`) and kept the throw and the aurora, which with the seam is the
whole of what he calls the Aurora ("another alternative way to infuse the Aurora into our UI", every
form off paper). He returned six light cards as `refine`, each note saying the card did not show what it
asked ("our step, ring, lift, and float: a set of four options to choose from, or are we trying to use
everything, and if so, how?"), and then reread his paste worried the notes were crossed. They were not:
the trailing `note: "on paper: ..."` was a step withdrawn inside the round whose text his browser still
held. `composeSoFar` now takes the open round's shape and sends nothing for a withdrawn step, and
`Transcribed` carries the round's notes so held words never ride twice (`4280a59c`, five new cases).
Three lanes cut at `c338c95c`: `type-wiring`, `light` (round eight) and `aurora-wiring`.

- `aurora-wiring` (merged `2987a5e5`; the tuner knob at the next commit). The three forms of light Will
  kept landed as one family in his word. The clock is ruled to 8s on every lamp, with
  `--aurora-cadence` declared beside it as a sibling (three laps, 24s) rather than a re-tune, and
  `SectionLight` ships as the field's one mount: four placements, the accent register in one object,
  the bottom band the top one flipped. The no-light-ground ruling became a CSS fence keyed on
  `[data-section-light]`, the dark variant inverted, scoped to the field so the four shipped seams keep
  their own paper history. Being the first shipped lamp on the transform drive exposed that drive's
  missing resting `translate`, which parked the comet dead centre at full strength for every
  reduced-motion visitor; it rests at its own from-keyframe now. Foundations presents the engine as
  Aurora with a specimen per form, and `SectionLight` ships its placements plus a paper frame that
  paints nothing on purpose. No production call site yet: the placement is round eight's first step,
  and the throw's plate and the publish flourish wait on the bloom card. Verified on a fresh stylesheet:
  8s on the token, 24s on the field's bands, `display: none` inside `.surface-paper`.

- `type-wiring` (merged `0a52c8dc`; bible 5 ruled at `aaa057dd`, the ledger gone at `4c5500da`). Will's
  type ruling shipped: ladder B baked as one `@theme static` block of nine `--text-*` steps in
  theme.css, generated from the board's own `themeBlock(B)` rather than retyped, each step a clamp
  through (375, phone) and (1440, desktop) carrying its own leading and tracking. The three
  four-breakpoint ramps collapsed to one class each and about sixty headings moved onto a step by ROLE,
  including the dead-link title, which joined the set through a `surface` prop rather than a second
  component. Two traps were measured before anything moved (the card step ships as `card-title`
  because `text-card` is already the colour; a step's tracking proven to beat `font-heading`'s flat
  value in dev and in the production build, so the flat value stays as the off-ladder fallback) and two
  more were found at the wiring: `cn()` silently dropped a step beside a text colour until `utils.ts`
  declared the ladder to tailwind-merge, and `tracking-tight` resolves to 0em here and cancels a step's
  tracking. All held by `src/lib/type-ladder-policy.test.ts`. The board retired atomically into the
  Library's Foundations page, which draws the ladder at true size off the live tokens. Left for Will,
  measured at 375: marketing's sub-heads (20 flat) now out-shout the `prose` h2 above them (18) on
  /about and /help, the dead-link title is 18 beside 17px body, and the guest title went 28 to 24.

**The alias.** Rebuilt at `a964d4a6` the moment Vercel's cap freed (00:16 UTC), the production smoke
at 261 checks with the door closed; rebuilt again on the two wirings (the `[preview]` commit after the
hero's fold; the smoke's result is STATUS's live state).

**Next.** The light board's round eight is in flight; Will's sitting continues on
round eight (its first step places the Aurora's field on the home page), then the album hero's four.

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
