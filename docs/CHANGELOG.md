# Partyreel — Changelog (the last two rounds)

> ROLE: what shipped in the current round and the one before, with the commits and the verification.
> BELONGS HERE: at most two dated entries, newest first, each at most 160 lines. · NOT HERE: how the
> system works now (→ [`systems/`](systems)), what is next (→ [`ROADMAP.md`](ROADMAP.md)), the live
> state (→ [`STATUS.md`](STATUS.md)). GROWS BY: a new entry at a round's close, and the third-oldest
> entry deleted in the same commit. Everything older is in git: `git log --oneline` for the commits,
> `git show 932fdee9:docs/CHANGELOG.md` for the last full archive (5,495 lines, 2026-07-02 to 09-16),
> `git show dd77fc9e:docs/CHANGELOG.md` for the Library x Lab round's entry.

---

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

## 2026-09-16 — The revamp, in progress: the lab that works, the loop as the rulebook, the record two rounds deep (`5cdebfe0` onward)

Will opened his review of the clarity round on localhost and found the lab "super broken": the
sidebar as a full-width block at the top of every page, "On this page" a section above the title,
1:1 canvases boxed in a centred column, the dock not sticky, a pick that could not be unpicked. Behind
the bug was the finding that matters: the tracks "are turning into massively over-engineered pages"
when he wanted "design catalogs of ideas to ship in the lab" to kill, refine or promote to the
Library; agents run two and three rounds without his notes "made research papers out of their first
round's work"; and the repo "over-indexes archival documentation". The plan he approved runs four
rounds: the lab, the docs diet and the track protocol, the Library as the complete inventory, the six
paper boards rebuilt as catalogs. His directive is verbatim in `docs/design/rulings.md` (2026-09-16).

**Round 1, the lab.** The layout faults were a browser holding an old copy of the lab's stylesheet
(Turbopack names dev chunks by path) and, once, the dev server's own cache serving the old chunk after
an edit. The foundation (`5cdebfe0`): `LabChrome` reads `--lab-css-generation` off `.lab-shell` after
mount, reloads once in development and otherwise shows a strip naming both causes;
`lab-css-generation.ts` holds the number `design.css` declares and a test keeps them equal;
`pnpm lab:smoke` refuses a lab page whose stylesheet set lacks the shell; a second click on any pick
clears it, through one set of writers in `review-store.ts` that every surface uses; a wide page's
stages and frame rows take the gutter back at 1:1 (`data-lab-bleed`); `board-spec.ts` gained the
catalog's shared types (`ITEM_VERDICTS`, `LIBRARY_VERDICTS`, `Candidate.one / verdict / facts`,
`Control.clearable`, `BoardSpec.catalog`, `LIMITS.readingWords`). Two lanes ran on it.
**`lab-sweep`** (merged `88dafe50`) walked every lab page as a stranger at 1440 and 375, dark and
light, keyboard only, and fixed the shell: "On this page" closes the page header instead of opening
every page above its title (a board drops it for the dock's Sections menu); the top bar's sidebar
button collapses the sidebar on any page, not only a board; a skip link is first in the tab order
where thirty nav stops stood; the phone sheet gained a close and the two area pills; the content
column clips at 1:1 so a bleed stops at the window edge whatever a board does; a board's round badge
reads its own spec, since a manifest is deleted at its merge; the words a stranger reads were
plainened; the ⌘K palette became a combobox. ★ A bare `overflow-x: clip` is dropped by Lightning CSS
and survives only inside `@supports`. **`lab-catalog`** (merged `57b93286`) built the review's third
scope and the catalog kit: a round's ledger gained `items` beside its answers and the Library
`_library.json`; a board that declares `catalog` puts its cards on the desk as one items step per
board, walked before that board's questions; the grammar grew `item:<id>=keep|refine|kill "note"` and
`review library: <entry>=keep|redesign|retire`, parsed by `pnpm lab:review`, which reads a spec's
`candidates` off the page; the kit gained `Catalog`, `VerdictPill`, `ItemVerdictRow`, `CompareTwo`,
`SpotCompare` and `GroundBox`; `pnpm new-board` scaffolds a catalog by default; `/design/lab/kit` is
the toolbox with a live demo per tool; the smoke weighs every board's words outside every closed fold
and every specimen against the budget (all twelve standing boards are over it, 2,465 to 15,004 words,
which is the measure of the papers); the palette was rebuilt on the kit as the proof; the dock opens
collapsed at 375. Behind the merges: Next's dev indicator moved off the sidebar control (`52241e4f`),
and the lab functions' file trace fell from 2,248 files to 718 once the doc reader's dynamic root
carried `turbopackIgnore` (`ce21ac31`; the docs it needs were already traced by name).

**Round 2, the docs diet and the track protocol.** `docs/PROGRAM.md` became the loop itself: Will's
one-line ask, the questions that branch the work asked in chat, one track per board returning a
catalog, one alias build per close, his verdicts on the desk, the promote path, never a second round
without his notes; the agent boot and the integration steps; the record's depth. `CLAUDE.md` is 150
lines. `docs/tracks/README.md` carries the one-round manifest template (Questions, the items one line
each) and the spawn paragraph that says "return a catalog, not a paper"; a manifest is deleted in the
merge commit that integrates it, and the 26 integrated ones left (`44090827`). STATUS is a snapshot,
the CHANGELOG holds two entries, the ROADMAP's Now list is one line each, the PRD is eighty lines;
`src/lib/record-depth-policy.test.ts` holds the caps. **`docs-adr-fold`** (merged `d4ec4cff`) read
the 25 architecture decision records against their owning system docs and folded them: roughly thirty
still-true invariants became dateless lines in the doc's own voice, the facts a doc already stated got
no second line, the superseded ones were left to git; `docs/adr/` went whole with the decisions
tombstones, the reel spec (its product shape opens host-app's reel section) and the perf baseline;
one stale claim fell out (the guest email capture had been server-mediated since June while the doc
still called it an anon RPC). The 247 citations in `src/`, `workers/` and `scripts/` name the system
docs now (`aea90fd3`); the migrations keep theirs as immutable history. **`docs-systems-strip`** (merged `0a48db70`) stripped
the four heavy system docs to the system and its invariants: 118 dated passages fell to 25, every
survivor `(Will, <date>)` on a ruling that is still the rule; every ★ was audited against Will's rule
(forty-two kept byte-identical but for their provenance, eleven demoted to plain lines, three promoted
from mid-sentence prose, one duplicate pair folded); seven landmines in `marketing-content.md` had been
invisible to `/design/library/policies` because they sat mid-sentence, and the inventory went from 31
to 38; the craft stack's home is `docs/design/guidance.md`; the arrival choreography's heading lost its
phase name and `touchpoints.ts` followed; the rulings file's two dangling anchors were fixed.

**Round 4, the six paper boards rebuilt as catalogs** (cut `385cfa99`, on Will's answer that all six
are rebuilt before any review). **`brand-voice`** (merged `5868325e`): six voices as catalog cards,
each writing the same two screens at a phone's own 343px column, and a spot list of twenty-four real
places across the marketing site, the host's app and a guest's phone, every one drawn twice in a real
1440 or 375 document on the component that ships it; three columns became six (Plain, Everyone and
Aside written from the ground up); eighty-five lines were written six times; thirteen sections became
five, seven asks became three (the noun, the unfurl, the counts), and the reading went from 13,024
words to 2,642 against a declared 2,700; `docs/specs/brand-voice.md` shrank from 522 lines of tuning
ledgers to a 185-line standing proposal; `CardGround` stopped writing `data-mkt-skin`, which had been
flipping the lab page's own body through marketing.css. Two questions for Will ride with it: one voice
everywhere at three volumes, or a marketing voice and a product voice; and whether bible 20 (name what
we are, never what we are not) means the naming or the shape, which decides the Aside card. **`type-scale`** (merged `257df8fe`): five ladders as cards, each drawn as a type
specimen at the pixels it declares for the canvas in the real heading face, clipped rather than
scaled, a missing app step drawn as a hole and a hairline where the app's register starts; any two on
the same real page (the home, the pricing page and the dashboard, the last a lab screen route so the
app is judged at a real viewport by production components) scroll-locked; the pick worn by five real
routes including a dead link; eight sections became three, four asks became two (tracking, the
dead-link heading), the two register switches became one pick per card, and the reading went from
4,220 words to 1,155 under the budget; `docs/specs/type-scale.md` from 220 lines to 64. Its question
for Will: the compared pair scrolls sideways at 1440 (both halves stand on screen at 375); the kit's
wipe is a one-line switch if he prefers it. **`floating-surfaces`** (merged `767e6182`): seven directions as cards
(Today, Card, Glass, Command, and Compact, Paper and Lift written from the ground up, each answering a
cost one of the first four pays), each the event menu at 328 wide on the app's own dark over the
album's photographs with the Ground switch moving all seven at once; the host's desk under two
directions; the pick worn by the real pages; four asks survive (the submenu, the radius, the entrance,
the light); the reading went from 5,040 words to 2,317 against a declared 2,400 (about 1,300 of it is
the template's own chrome, now a ROADMAP line). Two frame bugs fixed in the lane (a frame seeding its
ground from the parent's first render) and one product bug found for the wiring round: nested
submenus paint nothing because `SubContent` has no portal. One asset asked of Will (row 14). **`light`** (merged `2326a924`), on Will's round-five answers (the kit lands, phase 1
first, Accent as the register): the twelve treatments as cards, each the real production surface
wearing it at true size (a crop of the section laid out at the canvas width, never a scale), four
facts, the argument folded, keep / refine / kill under every one; Pick hands the site the treatment's
block through the existing apply path and the real routes wear it at 1:1. The two asks he could not
answer are gone as questions: the depth cues are two of the cards shown as the same surface without
and with, the lit face is the `face` card's verdict, and the aurora's landing is a page-wide Landing
switch with one real chapter under two options. Nine asks became four (the infusion order, the
cadence, the paper hues, the publish beat's colour); the reading went from 10,164 words to 2,889
against a declared 2,950, about 990 of it the template's own reprints (a kit line). Two assets asked
(rows 15 and 16). **`rounding`** (merged `128aca34`): six families as cards (A to D keep their
letters; E, print, and F, half a step, written from the ground up), each the card, the menu, the
photograph and the button at true size plus a 375 frame, with the fourth fact stating bible 8's claim
as a ratio against the shipped rung (which is where D gives itself away); two families on the same
real page scroll-locked; the pick worn by the real pages; a family names the surface, the floating
layer, the photograph and the gap it pins, and the button rung and the derived ladder stay asks (with
the dead rungs and the album's gap: four); the tuner panel's mount left the board (its knobs ride every
real page already); the reading went from 4,859 words to 2,564 against a declared 2,800;
`docs/specs/rounding.md` written as the standing proposal, so its route answers. Three findings landed
in the kit at the merge: a four-option control wraps in the dock, `design.css`'s clip comment names
no deleted rule, and a trap for a post-hydration value built into a board's evidence. **`media-kit`** (merged
`8587d3ed`): thirteen sources as cards, each its contact sheet at the real blog-card size on paper
(320x400 at 1440, 343x429 at 375, measured against the real page), one line, four facts (the price,
the quoted clause, the release fact, the count), ship above the line and kill below, with Web Summit
and Flickr sitting above it although the rule bars them today because one answer to the crowds ask
moves both; two sources' frames side by side at the real card size, opening on Web Summit beside
Unsplash+; the pick worn by the real pages; the four asks kept (the rule, the spend, the crowds, the
shoot); the reading went from 15,004 words to 2,686 against a declared 2,750; the 22 staged CC0 files
stay pinned by `provenance.test.ts` until the rule is ruled. The bridge ($56) and the 36 masters are
asked of Will again (rows 13 and 7). With it, all six paper boards are catalogs: the revamp's Round 4
is closed on the tree, and Will's first review with per-item verdicts is the palette plus the six.

**During the sitting.** Will's first per-item review began on his dev server; his batches transcribe
as they arrive (the home hero ruled: the source, centred, no count, the stream wants polish; the two
glow boards' asks closed on the light board), and "Copy so far" on the review card and the desk lets a
sitting land in batches (`fd541941`). He ruled mid-sitting that the lab winds down into the Library:
a kept idea becomes a working version, a board retires, and no further exploration is cut unless he
asks for one by name; he asked for two. **`palette`, round seven** (merged `5a538c0a`) leaned the
catalog cool and made the accent a config, on his note: Apple's system greys convert to hue 286 at a
nearly flat chroma and their blue to 257, and the board had built its cool at 258 for four rounds,
which is most of why Slate read blue; four new dark sets (Onyx, Graphite, Steel, Pitch) and two light
ones (Pearl, Mist) were written from his sentence, very black and very white grounds carrying the
contrast with cool greys above them; Loft, Press, Daylight, Gallery and Signal left and Ember stayed as
the one warm comparison; every palette declares one accent behind a page-wide switch, off by default,
that the paste obeys; every card lays a colourful mix of five photographs on its own well; the reading
went from 3,817 words with no declaration to 2,924 against a declared 2,950. The home hero's stream
catalog (`lp/home-hero`, round six) is the other exploration he named.

Machine notes: four agents at once is the ceiling on 36 GB, one process each, a dev server killed by
port; Vercel's daily cap kept the alias on the Library x Lab round's Phase 1 until 2026-09-17 00:13
UTC, so every review ran on a local `pnpm dev`. Gates on the tree at the catalog's merge: typecheck,
lint, 2,213 tests, the build.
