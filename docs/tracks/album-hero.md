---
track: album-hero
status: integrated
cut: "be1638f2"          # round 3, the clarity round, cut from launch-prep
merged: "5ec2c679"      # the branch head merged into launch-prep
cut_round_2: "1b647d76"
merged_round_2: "f7a78883"
merged_round_1: "bd5f63b5"
preview: false          # no branch preview: the round reviews on a local pnpm dev after integration
owns:
  - src/app/(dev)/design/sandbox/album-hero/
reads:
  - src/components/lab/
  - src/app/(dev)/design/sandbox/light/
  - src/app/(dev)/design/sandbox/rounding/
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/sandbox/registry.test.ts
  - src/app/(dev)/design/(shell)/lab/boards.ts
  - src/app/(dev)/design/(shell)/lab/[board]/page.tsx
  - src/app/(dev)/design/(shell)/_shell/index.ts
  - src/app/(dev)/design/_data/state.ts
  - src/app/(dev)/design/touchpoints.ts
  - src/components/lab/kit-discipline.test.ts
  - scripts/new-board.mjs
  - docs/decisions/design-record.md
  - docs/reviews/README.md
  - docs/design/README.md
  - src/app/(dev)/design/sandbox/home-hero/shared.tsx
  - src/components/guest/
  - src/components/marketing/
  - src/app/(marketing)/(cinema)/features/album/
  - src/lib/constants/feature-pages.ts

---

# lp/album-hero

## Round 3 (the clarity round, 2026-09-15): every ask in plain words

**Goal.** Every ask on this board rewritten so that someone who has not read the board can answer it
where they meet it (the desk's session, and the review card that pins under the dock): a real
question, its context, where to look, options labelled in words with what each means; the evidence
labelled with the options' names; the board's question, verdict and section ledes in the same plain
words. No candidate, number or recommendation changes and no new evidence is built. Will's first review
through the desk (2026-09-15) answered three asks on the light board and stopped at two that were labels
with token options ("The aurora's placement: no | seam | both | room"): "it was tough to understand what
I was being asked for most of those questions... when you use very technical terms or nicknames from
spots in these reports, it makes me have to go deep into the track to gain the relevant context and even
begin understanding the question being asked. Having the link helps a bit, but framing the context more
with the question would help a ton... the more clearly you can ask me questions, the more easily it is
for me to respond." His ruling is `docs/design/rulings.md` (2026-09-15 · a question carries its context; an
exploration is a catalog) and the guidance is `docs/design/guidance.md#boards-the-review-surface`.

**The exemplar.** `src/app/(dev)/design/sandbox/light/spec.ts` (read it whole, first) and the relabelled
columns in `sandbox/light/depth.tsx` (`cueLabel`). The shape is `Ask` in `src/components/lab/board-spec.ts`:
`question` (a real question, ends with `?`, 160 max), `context` (what the thing is and where it lives on
the site, for a stranger; a nickname glossed the first time or dropped; 400 max), `look` (which section,
which dock switch, which labelled specimens to compare; 240 max), `options` as `{ id, label, means }`
(the id UNCHANGED, one token; the label in words, 48 max, never the token itself; `means` one sentence on
what choosing it does, 160 max), `recommended` (an id), `because` in plain words (300 max), `overrule`
(160 max), `evidence`, `state` (the dock state that shows this ask's evidence; the review card applies it
on landing), `control` (a dock control whose option ids equal this ask's, so picking an option previews it;
use it wherever an ask mirrors a switch).

**The rules.**

1. Ask ids and option ids never change: the ledger joins on them. An ask may be split into two clearer
   asks, or added where the verdict decides something nobody was asked; new asks get new ids. An ask that
   decides nothing is removed.
2. The evidence carries the options' names. Every `Cell`, `Labeled`, `Compare` label, frame caption or
   column an ask is judged on is labelled with the option's `label` (the way `depth.tsx` does it), and a
   dock control an ask mirrors uses the same labels as the ask's options. Where a control's option ids
   differ from the ask's (`today` against `a`), rename the CONTROL's ids to the ask's, never the ask's, or
   leave `control` off; the ask's ids are the ledger's.
3. The board's `question`, `verdict` and every section `title` and `lede` in the same plain words,
   within `LIMITS`; a technical term stays only with its gloss. Arguments stay collapsed. Anything that
   decides nothing is cut, not rewritten. Do not bump `round.n` (the ledger's round guard reads it); edit
   `round.changed` to say the asks were rewritten in plain words.
4. Nothing else changes: no new specimens, no candidate or number or recommendation changed, no kit
   edits (`src/components/lab/` is not yours; a kit need goes in Handoff), no other board touched.
5. Remove this board's line from `PLAIN` in `src/app/(dev)/design/sandbox/registry.test.ts` (that file
   is otherwise read-only for you); the ratchet then checks the shape.

**This board.** Five asks. The tokens a stranger cannot read: `lg | xl` (the headline's size step: say
what each does to the field and the album), `both | ship` (the album's width: the guest page's own
632 px column against the wider one), `pulse | arrival` (the album's one live signal: the green dot
against a tile landing at the head), `lockup | settled` (what a reader with no JavaScript sees),
`page | voice` (whose copy the hero renders). The dock's `step` and `columns` controls mirror the
headline and width asks: wire `control` and make their labels the ask's.

**Verify on.** The gate (`pnpm typecheck && pnpm lint && pnpm test && pnpm build`, each green); the board
at 1440 and 375 on a local `pnpm dev` (`/design/lab/album-hero`), reduced motion honoured, every evidence
section showing the options' words; the desk's session on this board (`/design/lab?session=album-hero.headline`)
read cold, as a stranger; `pnpm lab:review --dry 'review album-hero r2: <ask>=<option id>'` accepting one
clause per ask. No `[preview]` and no `[ci]` on your pushes: the round's review surface is a local
`pnpm dev` on launch-prep after integration.

**Handoff.** The usual (head SHA, gates, lane check) plus every ask as it now reads (the question and
the option labels, one line each), and any question you could not make plain without new evidence,
with why.

**Binds.** The bible, the contracts of every component under a path you own, and the policies;
everything else is precedent (`docs/design/README.md#what-binds-you`). Will's rulings this track works
under: 2026-09-15 · a question carries its context; an exploration is a catalog; 2026-09-15 · the review
surface.


## Round 2 (the Library x Lab migration wave, 2026-09-15)

**Goal.** The album page's hero board onto the kit. The board reads the page three ways (the hero alone, the album
below it, the two plus the first chapter): those become the spec's `controls` and the dock's switches, the
forty-frame field at 1440 and thirty-six at 375 stays exactly as built, the `Stage` usage moves to the
kit's, the portrait asset ask rides the spec's `assets`, and the board's question, verdict and asks are
written down once in `spec.ts` (the manifest's round-one Handoff and the record hold them today).

**The migration contract (every board in the wave).** A board is two files on the kit: `sandbox/<id>/spec.ts`,
pure data through `defineBoard` (the question; `round {n, date, changed}` with this round's line; `history`
from this manifest's rounds; `context` for how the board got here; the `verdict`; the `asks` Will answers in
one word each, with stable kebab ids, one-token options, the recommendation, `because`, `overrule` and the
`evidence` section; the `candidates` with their rationale, departures and assets; the `departures` from a
bible rule, a ruling or precedent with their cost; the `assets` in the ASSETS.md shape; the `sections` with
a title and a one-line lede, arguments collapsed; the page-wide `controls` the dock renders; `lookFirst` as
an executable walk; `notes` as the builder's; `links {bible, record, track, spec, pages}`); nothing about
the board is scraped from JSX any more, and `sandbox/registry.test.ts` pins the density limits and refuses
a spec that imports React, CSS or the board. And `sandbox/<id>/board.tsx`, the client composition:
`BoardPage({spec, dock, evidence, review})` from `@/components/lab`, the evidence per section as a
function of the declared state (`useBoardState`), the kit's `Frame`, `Compare` (its `differs` line
required), `Specimen`, `ApplyToSite`, `CostMeter`, `Walk`, `Paste`, `Loupe`, `SelectTable`, `ConceptCard`,
`useReplay`, `useMotionState` in place of the board's local copies (`kit-discipline.test.ts` refuses a
local `Row|Part|Knob|PageFrame|ApplyToSite|CostMeter|Paste|CellLabel|Labeled|Cell|BoardIndex|RuleIndex`
once the board's id leaves its LEGACY list); no prose before the first section (the template has no slot
for it); every ask restated from the same array; comparisons name their distinction; captions never sit
inside the judged area; never zoom, scale or transform a judged specimen (1:1 is the law of the lab).
Read `sandbox/light/{spec.ts,board.tsx}` and `sandbox/rounding/{spec.ts,board.tsx}` whole first: they are
the pilots and the model. Keep what is genuinely the board's own (a candidate's engine, a sourcing sheet, a
scoped token block) and delete the rest of its shell code. No candidate, number or recommendation changes
in a migration unless the manifest's round says so: the wave moves the argument, it does not re-argue it.

**Registration, three lines you may edit for YOUR board id only** (declared as exceptions in the Handoff;
the Orchestrator resolves the adjacent-line merges): `sandbox/registry.ts` (import the spec, add it to
`BOARDS` in the list's existing order), `(shell)/lab/boards.ts` (drop `legacy: true` on your entry),
`src/components/lab/kit-discipline.test.ts` (delete your id from `LEGACY`). Nothing else outside your
lane; a shared-file change is asked for in the Handoff with the exact patch.

**Verify.** The board on your dev server at 1440 and 375, light and dark, reduced motion honoured: the
answer block first with the ask pills linking under the dock; every section anchored and in the dock's
Sections menu; arguments and pastes collapsed; the walk's steps set the dock and land on their section; a
copied link reopens the same canvas, candidate and section; the review panel's copied message parses with
`pnpm lab:review '<line>'` against a SCRATCH copy of `docs/reviews/` (never commit a ledger); `/design/lab`
queues the board's open asks; the gate green (typecheck, lint, test, build) and `pnpm lab:smoke --base
http://localhost:<your port>` green. Light QA (Will, 2026-09-14): a lab-only round verifies its board and
moves on; the red-team belongs to the wiring round. Push freely (no CI on `lp/*`); the preview builds at
`status: handed-off`.

**Binds.** The bible, the contracts of every component under a path you own, and the policies
(`/design/library/policies`); everything else is precedent (`docs/design/README.md#what-binds-you`,
rendered at `/design/library`). Never edit another track's files, `touchpoints.ts`, `rules/bible.ts`,
CHANGELOG, STATUS, ROADMAP, PROGRAM, CLAUDE, AGENTS, `docs/ASSETS.md`, `docs/design/rulings.md` or
`docs/reviews/`. No em-dashes and no `font-mono` anywhere a person reads.

**Verify on.** `/design/lab/album-hero` on your dev server at 1440 and 375, light and dark, reduced motion;
`/design/lab` shows the board's open asks; the gate and `pnpm lab:smoke` green.


## Round 1 (Will's ruling, 2026-09-15)

**The global notes, which bind every board this round** (Will, 2026-09-15, after a scroll through every
board on launch-prep): (a) **Page-wide controls always on screen.** "For any pagewide configs, the GUI
control should be fixed so that variants can be toggled on different previews anywhere on the page for
better back-and-forth comparisons. Having to scroll back to the top makes it very hard to review
differences." The shell now ships `BoardDock` (`src/components/dev/board/dock.tsx`, exported from
`@/components/dev/board`; the floating board's sticky bar, generalised: it sticks from `sm` up, writes its
height to `scroll-padding-top` so anchors land under it, and carries the shell's Fit/1:1, Sidebar and Desk
controls). Put every switch that changes the whole page in it (the candidate, the ground, the canvas, the
ramp, Replay, Apply to the site); a control that changes one specimen stays beside that specimen. (b)
**Pixel-perfect previews.** "The iFrame previews throw off anything related to size, making those reviews
particularly difficult. This needs to be fixed for pixel-perfect lab demos/previews." Every `Stage` now
renders at 1:1 by default (the lab preference in `lab-prefs.ts`; the board page lifts its max-width and
tucks the sidebar away so a 1440 canvas has its room; "Fit" keeps the old zoom for a glance at the whole).
Never zoom, scale or transform a specimen whose size is being judged; anything you render inside an iframe
renders at true pixels; if a 1440 canvas needs sideways scroll on a narrower window, that is correct. (c)
**More real UI.** Will wants live production components and whole real pages as the preview surfaces
("I'd love to see more UI examples for comparison, especially if they can be live production components";
"more UI to preview the variations on"), not a screen of specimens. (d) **The app's UI is open.** "The app
is functionally great, but UI design lags far behind the design work we've been doing for the marketing
site... any UI that touches App in an active lab track may be worked on before the dedicated app agents get
to it later." So where your board shows an app surface, you may redesign it (rising tides, bible 22), in
the lab, as a candidate. (e) **Vercel is capped** (the free plan's 100 deployments per trailing day, hit at
23:31 on the 14th; the window frees through the afternoon of the 15th): push, but verify on a local
production build or dev server at 1440 and 375 in a foreground tab, and say so in the Handoff. (f) The
record: "Handoff (round 4)" and "Record (round 4)" below; the Record is the paragraph the CHANGELOG carries
for round 4, so write it as what the board became and why.

**Will's ruling, verbatim.** "3 can be killed as the home hero, but the background (images emanating) would
be beautiful for the /features/album hero for the live album. Use that for the hero animation looped to add
the 'live' feel of an album full of images, then keep an album page visual wide below as the actual live
album product, with less animation so the hero images and album animation don't conflict and get too
overwhelming. It doesn't need the QR code for the new version."

**Goal.** The `/features/album` hero, rebuilt from the burst's field. Your lane is seeded with the burst as
it left the home hero board (`burst.tsx`, `burst.css`, moved here whole; read `docs/tracks/hero-burst.md`
for its three rounds of notes): the field where every frame is born at a point and radiates around the
compass and forward out of the screen, with the acceptance walk, the ease-out flights in world units and
the lockup's quiet zone. (1) **The hero.** The field becomes the album page's hero: no code at the centre
(the origin is the album itself, or the page's headline, or nothing visible), looped forever so the album
reads as alive and full, the headline and subhead of the album page over it in the quiet zone (today's
copy from `src/app/(marketing)/(cinema)/features/album/` and `feature-pages.ts`; the voice board's
proposal may be read), at 1440 and 375, reduced motion as the settled field, JavaScript off as the first
paint. (2) **The album below.** Under the hero, the live album product as a wide visual: the real guest
album's grid (compose on the production components: the gallery, the media tiles, the lightbox trigger)
filled with the stand-in frames, with less animation than the hero (a calm entrance, a slow drift at
most), so the two do not fight; the hero is the feeling and the album is the product. (3) **The page.**
Show the two together as the top of the real page on the cinema ground, then the rest of the page's
sections as they ship, so the hand-off from hero to album to chapters is judged whole. (4) The board
composes the shell (`Stage` at 1:1, `Toggle`, `BoardDock` for the canvas and Replay, `BoardMeta` with the
asks); it is registered on the desk as `album-hero`; keyframes and classes keep the `hhb-` prefix or move
to `alb-` (say which). (5) The assets: the same 24 squares (row 2) and the portraits (row 9) serve; say so.
The asks: the departures Will rules on, no more.

**The contract.** Your board is `sandbox/album-hero/board.tsx`, exporting `AlbumHeroBoard` and importing
`./board.css`; it is registered on the desk as `album-hero` (`touchpoints.ts`, the Orchestrator's; its
placeholder variants are renamed at integration from your Handoff). Compose the shell from
`@/components/dev/board`: `Stage` (a real viewport at 1:1 on the cinema ground; pass `bodySkin` on a
cinema-only board), `Toggle`, `BoardDock` for the page-wide switches, `BoardMeta` for the question, the
candidates, the asks, the departures and the assets; `setCandidateCss` if the board hands the site a paste.
The seed in your lane (`burst.tsx`, `burst.css`) is the burst as it left the home-hero board, imports fixed
to `../home-hero/shared`; keep it, cut it or rewrite it, it is yours. Keyframes and classes under `hhb-`
or `alb-` (say which). Production components are composed, never edited (`src/components/guest/`,
`src/components/marketing/`): a redesign of one is a candidate in your lane.

**Rulings in force.** The bible on `/design/library/rules` (second edition): 1 (media is the color), 4 (a guest
surface is the host's, so the album visual carries the host's event, not Partyreel's chrome), 13, 14, 17
(chapters open strong), 21 (copy is open), 22 (rising tides). The media manifest is the only source of
paths (bible 18).

**Verify on.** `/design/lab/album-hero?key=` on a local production build at 1440 and 375, reduced motion, the
gate; the preview alias once Vercel's window frees.

### Binds (every track)

**Binds.** The bible, the contracts of every component under a path you own, and the policies
(`/design/library/policies`); everything else is precedent (`docs/design/README.md#what-binds-you`,
rendered at `/design/library`). Shell changes are asked for in the Handoff and announced in
`docs/tracks/orchestrator.md`; never edit `src/components/dev/`, `src/components/lab/`,
`touchpoints.ts`, `rules/bible.ts`, another track's files, or CHANGELOG, STATUS, ROADMAP, PROGRAM,
CLAUDE, AGENTS, `docs/ASSETS.md`, `docs/design/rulings.md`, `docs/reviews/`. Light QA (Will,
2026-09-14): the board at 1440 and 375 in a foreground tab, reduced motion honoured, the gate green
on the synced tree.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none. The board is lab-only and ships no production byte; the wiring round owns
  `docs/systems/design-system.md` when Will rules this in.

## Deferred (ROADMAP one-liners, bucket named)

- Marketing overhaul: wire the album hero onto `/features/album` once Will rules the step and the
  album's width rule (the field replaces `ArrivalsHero`'s `ArrivalsStage`; the album visual goes
  under it).
- App overhaul: the guest album's WIDTH rule, and it is two declarations, not one:
  `columns-2` -> `columns-2 md:columns-3 xl:columns-4` in `src/components/guest/guest-masonry.tsx`
  AND a wider laptop cap than `max-w-2xl` in `src/components/guest/event-experience.tsx` (which holds
  the whole guest column at 632 px of content at every viewport, so the column rule on its own would
  ship 156 px tiles), if the board's candidate is ruled in.

## Handoff (round 1)

- Head `0edcacd` plus this manifest commit, pushed. Round one's first hand-off was `13d6eb9`; a
  first read-back found four defects (closed at `fe41436` + `01bf584`, listed under "What the first
  read-back changed"), and a second read-back found one more, closed in this pass and listed under
  "What the second read-back changed". The preview at
  `partyreel-git-lp-album-hero-partyreel.vercel.app` was NOT waited on and the Vercel API was not
  called (Vercel is at its daily deployment cap, so no preview will build for this head either).
  **Everything below was verified on a LOCAL PRODUCTION BUILD** (`pnpm build && pnpm start`, my own
  worktree's server, never the root checkout's on 3000) at 1440 and at 375, this pass included. The
  port moved from 3011 to 3047 for this pass, because another track's server had taken 3011; check
  the port before trusting a localhost read, since a stale server on a sibling worktree serves a
  different board at a 200.
- **Say the tab honestly.** The first hand-off walked a fronted tab. This pass could not hold one:
  seven tracks are driving the same Chrome window tonight and each new lab tab steals the foreground,
  so this tab read `document.visibilityState === "hidden"` throughout and an occluded window suspends
  rAF completely (0 frames; `docs/systems/testing-verification.md`). Rather than call that a walk, the
  loop was driven by hand: `requestAnimationFrame` was replaced with a queue a stepper drains at a
  synthetic 16.7 ms, which is the doc's own "freeze the loop at a chosen elapsed" and what
  `burst.tsx`'s loop was written to allow. Every number below is a DOM measurement at a stepped
  instant, and every screenshot was cross-checked against the DOM (the capture paints the region a
  beat late, and the arrival reveals need their `data-inview` forced because IntersectionObserver
  never delivers in a hidden tab, both known blind-spots, neither a product fault). **What a human
  eye still owes this board: thirty seconds of reading 1 at real speed.** Nothing measurable is left.
- Synced with `launch-prep` at `6484558` (it had moved two doc commits since the cut; merged clean).
- Gates, re-run on this pass's tree: typecheck ok, lint ok (0 errors; the 6 warnings are all
  pre-existing files outside this lane), test ok (1804 in 199 files), build ok (114 routes). The
  board was re-walked on the fresh production build at 1440 and 375 after the change (reading 2 under
  both switch positions, reading 3's cut), since this pass touched a caption the board renders.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/album-hero/`
  (board.tsx, board.css, burst.tsx, burst.css, album.tsx, album.css) + this file. No exceptions.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.

### What the second read-back changed (this pass)

- **The one production change on the board is now argued from the APP's canvas, not the BOARD's.**
  The ask, the matching departure, the ROADMAP one-liner and the two WHY-comments (`album.tsx`'s
  header and `album.css`'s) all said "two columns of a 1440 canvas are 700 px tiles" and priced the
  candidate at "about 700 px to about 280 px". Those are the BOARD's frame (1154 px) and not even
  that: the shipped guest album is 632 px wide at every viewport, because `event-experience.tsx:165`
  caps the whole guest column at `max-w-2xl` with `px-5`. So the shipped tile is about 314 px, and
  `columns-2 md:columns-3 xl:columns-4` ON ITS OWN would have shipped **156 px** tiles into the real
  album, which is worse than what ships. The ask now names TWO declarations (the column rule plus a
  wider laptop cap), carries the arithmetic for each, prices the cost honestly (about 314 px to about
  276 px, and a cap that widens the event header, the reel card and the action row with the grid),
  and says in the stage caption that the 1154 px frame is the end state rather than today's page. The
  full arithmetic is under "What was measured". Nothing shipped changed: this lane is lab-only and
  the correction is text, in `board.tsx`, `album.tsx`, `album.css` and this file.
- `src/components/guest/event-experience.tsx` was added to this manifest's `reads`, since the ask now
  cites it.

### What the first read-back changed

- **Reading 3 is the whole route now.** It stopped at `GettingInSection` and `EverywhereSection`,
  which quietly left off the hand-off most at risk from a full-bleed hero that never resolves: the
  cinema-to-paper cut. It now runs `QualitySection`, the six-section `PaperChapter`,
  `RelatedFeatures`, the FAQ with `GoDeeper` and the `CtaBand`, in the shipped order, mirrored by
  hand from `page.tsx` with a comment that says so and says what is left out (the BreadcrumbJsonLd,
  invisible; the overlay `MarketingHeader`, whose sticky position would resolve against the lab page
  and ride down the board instead of sitting over the hero).
- **The candidate's density figure is the field's.** BoardMeta said "forty frames at 1440 and
  thirty-six at 375" against `GEO` at 52 and 44. Will rules the headline step against that number, so
  it now reads fifty-two and forty-four, with the steady-state count beside it.
- **The no-script paint is described the right way round**, in all three places a person reads it (the
  board's departure, this Handoff, the Record) and in the three code comments that carried the same
  sentence (`burst.css`'s header, two in `burst.tsx`). See the bullet under "What was measured".
- **The desk entry now has names to land**: the three readings and the two candidates are listed
  under "Shell changes asked for", with a replacement `note`, because the contract says the
  Orchestrator renames the placeholder from this Handoff and the first pass forgot to supply it.

### What the board is now

Three readings of the top of `/features/album`, every page-wide switch in `BoardDock` (canvas,
headline step, the album's column count, Replay), every stage at 1:1:

1. **The hero.** The burst's field with its centre taken out. The origin is nothing visible: a vent
   the album emanates from. Because the QR plate used to be what hid a birth, the birth had to become
   a POINT (`s0` 0.24 -> 0.035, so a new frame is about 13 px at 1440 and 8 px at 375 and grows out of
   nothing), and `geo.vent` is what `geo.qr` was, at 116 against 140. The lockup is
   `/features/album`'s SHIPPED lockup, measured off the real page rather than restyled: PageHero's
   `max-w-3xl` measure, the lg ramp's `text-7xl` at `leading-[1.0]` (two lines, 732 px of ink), the
   `text-lg` subhead at `max-w-xl`, the two shipped buttons untinted, the real eyebrow. It loops for
   ever with no resolution, which is the "live" Will asked for.
2. **The live album, wide.** The shipped guest album COMPOSED, not drawn: `GuestMasonry`, `MediaTile`,
   the lightbox trigger, the host's own event chrome in the shape the guest page ships (name, byline,
   stats), inside the marketing `BrowserFrame`. Its only motion is the product's own entrance
   (globals.css's `[data-media-tile]` fade-rise, 45 ms stagger capped at 540) plus one 6 px green
   status dot, so it never competes with the hero.
3. **The page, whole.** Hero, album, then every section `/features/album` ships, in its shipped
   order, down to the closing band: the first chapter's `GettingInSection`, `EverywhereSection` and
   `QualitySection` on cinema, the paper chapter's six desk sections, then the close (the doors, the
   FAQ and the CtaBand) back on cinema. 13,796 px of stage at 1440 and 15,064 at
   375, measured by the stage itself (`MeasuredStage`), so no section is ever clipped in half. The
   cut from cinema to paper is the thing to look at: it is the hand-off a hero that never stops
   moving is most likely to disturb, and it is a chapter and a half below the field.

### What was measured (local production build, 1440 and 375; this pass re-measured everything)

- **The quiet zone holds at every combination, re-proved on this tree.** A running-field probe
  stepped the loop and tested every visible card's bounding box against the lockup's INK at each
  instant: 908 card-instants at desktop lg, 671 at desktop xl, 520 at phone xl and 866 at phone lg,
  **2965 in all, zero overlaps, worst overlap 0 px2**. Two notes for whoever runs it next. The probe
  uses the card's AABB, which is larger than the rotated card, so the test is stricter than the
  guarantee. And the ink is NOT the five `[data-alb-block]` element rects: `under` and `actions` are
  `absolute inset-x-0`, so their rects span the canvas and a card out at x=540 "overlaps" a box whose
  ink is 160 px wide in the middle. Measure the ink (a `Range` over each text block, plus the two
  action anchors' own rects, which is what `KEEP`'s hand-measured half-extents model); an element-rect
  probe reports dozens of overlaps that are not there.
- **The settled composition is whole.** With the loop suppressed (the reduced-motion state), every
  card at desktop lg, phone lg and phone xl is entirely inside the canvas. It was not, before: one
  card of 52 hung 3 px past the left rim, because `extents()` models the 2D rotation only and the
  per-card 3D tilt goes through a `perspective(760px)`. `RIM_GUARD` (6 px) closes it; worst margin is
  now 4 px INSIDE at 1440 and 7 px at 375.
- **Density.** 52 frames at 1440 and 44 at 375 over a 9.6 s flight; steady state 19 to 27 on screen
  at 1440 and 13 to 22 at 375. The pool fills at every combination (52/52 and 44/44), which means the
  acceptance walk still found that many watchable directions against a lockup this large.
- **Density costs nothing on the wire.** 52 frames are **12 image requests, 536 KB, 45 KB average**,
  because the browser dedupes the shared sources. 120 fps with two fields running (104 cards), 34 MB
  heap.
- **The server's own HTML** carries the h1 at full opacity with no `data-mkt-cut`, `data-mkt-reveal`
  or `.mkt-line` on it (bible 13), and 104 cards each with its `--alb-rest` rest-state transform
  (52 per field, two fields at 1440). Zero em-dashes in the rendered page.
- **What a reader with JavaScript off actually gets, which round one stated backwards.** The rest
  state is in the markup, but `burst.css` collapses `.alb-card` to `scale(0)` at `opacity: 0` inside
  `@media (prefers-reduced-motion: no-preference)`, and no-preference is the DEFAULT match, so it
  overrides the rest rule for everyone who has not asked for less motion. Measured rather than
  reasoned: with `matchMedia("(prefers-reduced-motion: no-preference)").matches === true`, a card
  carrying no inline style computes to `matrix(0, 0, 0, 0, 0, 0)` at opacity 0. So a crawler and a
  JavaScript-off reader get **the lockup alone on the cinema ground, no photographs**; a
  REDUCED-MOTION reader is the one who gets the settled album, whole and still. Nothing that carries
  meaning is gated (the type is plain markup at full opacity, the field is `aria-hidden`), and the
  swap would be worse to look at, not better: paint the album settled for everyone and the loop has
  to snap it back to the vent on every load. It stands as a departure, stated as what it is, and Will
  can rule the no-script frame the other way in one line of CSS.
- **The phone reading of the page tail is approximate, and the reason is the shell.** A Tailwind
  breakpoint prefix inside a `Stage` reads the REAL browser viewport, not the canvas (`stage.tsx`
  says so; the brand-voice board found it), so inside the 375 canvas on a 1600 window the shipped
  sections resolve their `md:`/`lg:` rules as DESKTOP and only their widths are truly 375. The cut,
  the order and the type sizes read correctly; the per-section vertical rhythm at 375 does not. It is
  not worth a change in this lane, and it is why the phone judgement here is the hero and the cut
  rather than the tail's spacing.
- **The production components work in the board**: a tile opens the real lightbox and Escape closes
  it; the column switch flips the shipped `columns-2` to 4 and back.
- **The album's real geometry, which the width ask is now argued from** (the second read-back's
  finding). Every number below is arithmetic off the shipped classes AND was measured in the live
  DOM on this pass, by building a probe with the shipped container's exact classes inside a 1440 px
  box. `GuestMasonry` is rendered in exactly ONE place in the product, `live-gallery.tsx` inside
  `event-experience.tsx:165`, whose container is `mx-auto w-full max-w-2xl flex-1 px-5 py-8`: 42rem
  less 2 x 20 px = **632 px of content at every viewport, 1440 included** (measured 632). With
  `columns-2 gap-[3px]` that is a tile of **(632 - 3) / 2 = about 314 px** (measured 314.5), three
  columns would be about 209 px (208.66), and the responsive rule ON ITS OWN would give **(632 - 9)
  / 4 = about 156 px** at `xl` (measured 155.75). A laptop cap of `max-w-6xl` gives 1112 px of
  content and about 276 px at four columns (measured 1112 and 275.75), which is the figure the ask
  quotes. This board's own frame is a different width again: 1440 less `px-16` is 1312, capped by
  `max-w-[1180px]`, less `BrowserFrame`'s `p-3` and its 1 px border each side = **1154 px**
  (measured 1154), so its two-column tile is about 576 px (575.5) and its four-column tile about
  286 px (286). The board's stage is therefore a picture of the END STATE (both declarations), not
  of the column rule alone, and the ask, the departure, the ROADMAP one-liner and the two code
  comments all say so now.
- **The lab's blind-spots bit four times across the two passes** and none was a product bug
  (`docs/systems/testing-verification.md`): a capture past about 1000 px of scroll comes back black
  though the DOM is correct; a capture taken straight after a scroll paints the region a beat late
  (the album's twelve tiles read as grey boxes while the DOM had all twelve images `complete` at
  `naturalWidth` 900 and every tile at opacity 1); an occluded tab suspends rAF outright, so the
  field reads as empty until the loop is stepped by hand; and an occluded tab never delivers the
  first IntersectionObserver callback, so 49 arrival reveals sat un-shown until `data-inview` was
  forced. Every one was settled by measuring the DOM, and an `await` on a `setTimeout` in a
  background tab is its own trap (Chrome's intensive throttling made a 900 ms wait outlast a 45 s CDP
  timeout; wait across tool calls, not inside one).

### Shell changes asked for (the Orchestrator lands them)

- **The desk entry's placeholder variants, which the contract says you rename from this Handoff**
  (`touchpoints.ts`, the `album-hero` entry; it still reads `variants: ["The seed (the burst)"]`, the
  seed this board replaced). The board has three readings and two candidates; the readings are what a
  reader sees down the page, so land them as the variants:
  `["The hero", "The live album, wide", "The page, whole"]`. And the `note` on that entry still
  describes the seed; the board it now points at is: "The burst's field with its centre taken out as
  the album page's hero, looped for ever with the page's own shipped lockup in a quiet zone no frame
  enters, the real guest album composed and calm below it, and the whole shipped route under the two
  so the cinema-to-paper cut is judged with the hero running". Nothing in this lane touches that file.
- **Rename `sandbox/album-hero/field.tsx` and `burst.css` to `field.tsx` / `field.css`** when
  `lp/hero-source` closes. The file is no longer the home hero's burst and the name says the wrong
  thing, but `docs/tracks/hero-source.md` declares that exact path in its `reads`, so renaming it now
  turns a LIVE track's lane guard red (`track-manifests.test.ts` caught it). The rename is one
  `git mv` plus the two import lines in `board.tsx` and the sheet import in the file itself.
- Nothing else. `src/components/dev/`, `touchpoints.ts` and `bible.ts` were not touched.

### Assets requested from Will

- 24 event photographs as 512 x 512 squares · one grade, 6 to 35 KB webp each, across weddings,
  birthdays, corporate and festivals, framed tight enough to read at 90 px (a face, two hands, a
  glass, a sparkler, a first dance), never a wide room shot · replaces the 12 landscape stand-ins the
  field cycles (`FRAMES` in the home hero's `shared.tsx`). Already `docs/ASSETS.md` row 2; the same
  24 serve BOTH the hero field and the wide album grid.
- 11 more of the same as 4:5 portraits · 512 x 640, same grade, recrops of the 24 are fine · one for
  every 4:5 slot the field lays out. Already ASSETS row 9. Guests shoot vertical: eleven of the twelve
  stand-ins are landscape, which is why the wide album grid reads flatter than a real album does.
- 2 short clips as album tiles · 6 to 10 s, 4:5 or 9:16, muted, under 2 MB each, poster frame
  included · so the album grid can show a real video tile with the corner play badge the guest album
  ships. Every tile is a photograph today because `MediaTile` renders a real `<video>` and pointing
  one at a jpg shows an empty box. NEW: not on ASSETS yet.
- Nothing else. No plate art, no lamp, no QR: the code left the composition with Will's ruling.

### The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will)

- "Rule on, the headline step: lg or xl. It is the one choice that changes the composition rather than the styling, because the field is re-solved against the lockup the step draws. lg (text-7xl at 1440, text-4xl at 375) leaves the album the canvas and keeps the corridor beside the vent wide enough to be born in; xl (text-8xl, text-5xl) is the louder promise and takes about 80 px of quiet zone in every direction, which at 375 drops a further slice of the compass out of the pool."
- "Rule on, the album's width, and it is an APP-UI change, not a marketing one, and it is TWO declarations rather than one. What decides the tile is the CONTAINER before the column count: the shipped guest page caps its whole column at max-w-2xl with px-5 (event-experience.tsx), so the album is 632 px wide at EVERY viewport, 1440 included, and columns-2 makes that two tiles of about 314 px. Raising the column count alone (columns-2 md:columns-3 xl:columns-4 in guest-masonry.tsx) would cut the same 632 px into four tiles of about 156 px, which is worse than what ships. So the candidate is that rule AND a wider laptop cap, for instance max-w-2xl lg:max-w-6xl, which is 1112 px of content at 1440 and four tiles of about 276 px. WHAT IT BUYS: the album stops being a 632 px strip down the middle of a laptop and becomes the page, at roughly twice the photographs in a screenful, and the marketing page can show the album wide at all. WHAT IT COSTS: the cap carries the WHOLE guest page, so the event header, the reel card and the action row widen with the grid; the tile goes from about 314 px to about 276 px; and the masonry's natural-ratio signature reads quieter the more columns it has. NOTE the stage above is the board's own frame at 1154 px, which is about what the widened cap would give (about 576 px at two columns, about 286 px at four), not the 632 px that ships today."
- "Rule on, the album's life: the pulse alone, or an arrival. It ships with one live signal, a 6 px green dot pulsing every 2 s, and nothing else; the product's real behaviour is a new tile landing at the head of the album every few seconds with its green check. The second is the truer demonstration of live and is the thing most likely to fight the hero, which is why it is an ask and not a default."
- "Rule on, the copy: the page's own lines stand (bible 21 leaves them open). The hero renders /features/album's shipped eyebrow, h1 and subhead verbatim from feature-pages.ts. The brand-voice board's proposal would rewrite the subhead here; this board proposes nothing of its own, because the field is the argument and the sentence is the page's."

### Look at first

`/design/lab/album-hero?key=` at 1440. Reading 1 for thirty seconds with nothing else on screen: the
album should never stop arriving, and no word should ever sit on a photograph. (Those thirty seconds
are also the one check no tool could run tonight, for the reason in the second bullet at the top of
the Handoff.) Then reading 3, which is now the whole route: the only place both animations run at
once, and the only place to see what a hero that never resolves does to the CINEMA-TO-PAPER CUT a
chapter and a half below it, the hand-off most likely to be disturbed and the one missing from the
first hand-off. Then flip **Headline lg / xl** from the dock at any scroll position, which is the ask
that changes the composition rather than the styling.

### Findings against a rule (a finding, not a wall)

- **Bible 10 (the hero is unlit)**: the frames carry the light spec's LIFT shadow at four times the
  offsets, inherited from the burst and re-flagged here. It is a shadow and never a lamp; without an
  edge the depth axis collapses into a flat scatter.
- **Bible 13, decorative layer only**: the field's first frame lives inside the
  `prefers-reduced-motion: no-preference` block, which is the DEFAULT match, so a reader with
  JavaScript off who has not asked for less motion gets the lockup alone on the cinema ground and no
  photographs; the reduced-motion reader is the one who gets the album settled and whole. Nothing
  that carries meaning is gated, and the trade is on the board as a departure for Will to rule.
- **No rule blocked the work.** The one thing that blocked a change was another track's lane claim
  (the rename above), which is the guard doing its job.

## Record (round 1; the CHANGELOG paragraph for round 1, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-15). The burst, killed as the home hero, became the
live album's. Its centre came out: with no QR plate to hide a birth behind, the birth became a point
(a frame is born at 13 px at 1440 and 8 px at 375 and grows out of nothing) and the plate's radius
became a vent the album emanates from. The lockup over it is `/features/album`'s SHIPPED lockup,
measured off the real page rather than restyled, and the field is denser and slower than the home
hero's so the album reads full and never resolves: 52 frames at 1440 and 44 at 375 over a 9.6 s
flight, 19 to 27 on screen, and 12 image requests for all of them. Under the hero the board put the
shipped guest album itself, composed and not drawn (GuestMasonry, MediaTile, the lightbox, the
host's own chrome), calm by design: the product's own entrance and one status dot, so the two halves
of the page do not fight. A third reading stacks the hero, the album and then the whole shipped
route beneath them, every section in its shipped order on a stage that measures its own content, so
the cut from cinema to paper is judged with the hero still running rather than imagined. The quiet
zone was re-proved on the running field at all four canvas-and-step combinations: 2965 card-instants
against the lockup's ink, no word ever under a photograph; the settled composition, which is what a
reduced-motion reader gets, was found hanging 3 px past the rim and guarded; and the no-script frame
turned out to be the lockup alone, because the collapsed first frame sits in the no-preference query
that matches by default. The board asks Will for the headline step, the guest album's width rule (an
app-UI candidate of two declarations, argued from outside the shipped component), whether the album
should breathe,
whether a reader with JavaScript off should get the settled album instead, and three short clips.

## Handoff (round 2)

- Head `04b20557` plus this manifest commit, pushed; preview
  `partyreel-git-lp-album-hero-partyreel.vercel.app`, which builds on this push (`status: handed-off`).
  Everything below was verified on **my own dev server on port 3411**, never the root checkout's, plus a
  local production build for the gate.
- Synced with `launch-prep` at `167d2cef` (it had moved five commits: the glow pair landed with its own
  specs). ONE conflict, `sandbox/registry.ts`, and it is the adjacent-line collision the wave was expected
  to produce: both sides add imports and both add a name to `BOARDS`. Resolved by keeping all five, with
  `BOARDS` in the desk's order (`touchpoints.ts`), so `album-hero` sits after `rounding` where the board
  pages page through it. Merge commit `04b20557`.
- Gates, each on its own exit code, re-run on the merged tree: typecheck ok, lint ok (0 errors; the 8
  warnings are pre-existing files outside this lane), test ok (2140 in 218 files), build ok (128 routes,
  257 static pages), `pnpm lab:smoke --base http://localhost:3411` ok (290 checks, 0 failing).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` =

  ```
  docs/tracks/album-hero.md
  src/app/(dev)/design/(shell)/lab/boards.ts          <- registration (exception 2)
  src/app/(dev)/design/sandbox/album-hero/board.css
  src/app/(dev)/design/sandbox/album-hero/board.tsx
  src/app/(dev)/design/sandbox/album-hero/field.tsx
  src/app/(dev)/design/sandbox/album-hero/spec.ts
  src/app/(dev)/design/sandbox/registry.ts            <- registration (exception 1)
  src/components/lab/kit-discipline.test.ts           <- registration (exception 3)
  ```

  The three exceptions are the registration lines the round's contract allows for THIS board id only, and
  each touches one place: the spec imported and added to `BOARDS`; `legacy: true` dropped from the
  `album-hero` entry; `"album-hero"` deleted from `LEGACY`. Nothing else outside the lane, and no other
  board's id was touched in any of the three.
- Shared-file changes asked of the Orchestrator: **one, and it is a finding rather than a request to
  land blind** (below, "A kit finding"). Nothing else. `src/components/dev/`, `touchpoints.ts` and
  `bible.ts` were not touched.
- Assets requested from Will: **the same three as round one, unchanged**, now carried by
  `spec.ts`'s `assets` in the ASSETS.md shape rather than by prose, so the Orchestrator folds fields
  rather than sentences: the 24 squares (row 2), the 11 4:5 portraits (row 9), and the 2 short clips
  (still NEW, not on ASSETS). Round one's fourth bullet ("nothing else: no plate art, no lamp, no QR")
  was not an asset request and is not an asset row; it is in the board's history instead.
- Look at first: the board's own walk, which is executable now. Press **Look first** in the dock and
  press Next five times: reading 1 at lg, reading 1 at xl (the ask that changes the composition rather
  than the styling), the album as it ships at two columns, the album at four, the whole route with both
  animations running, and the whole route at 375. Each step sets the dock and lands on its section.

### What the migration did, and the two reconciliations

- **Two files on the kit.** `spec.ts` is the argument as pure data through `defineBoard` (the question,
  round 2 with what changed, round 1 as history, the context, the verdict, five asks, two candidates,
  three departures, three assets, three sections with their ledes and arguments, three controls, a
  six-step walk and two builder's notes). `board.tsx` is `BoardPage({spec, dock, evidence})` and nothing
  else: the evidence for each declared section as a function of the declared state.
- **The board's own shell code went to the kit.** Its measuring stage is the kit's `FitStage` (which also
  re-measures when the webfont lands, which round one's did not); its stage captions are `Labeled`; its
  Replay is `ReplayButton` + `useReplay`; its three hand-built `Toggle`s are `ControlKnobs` off
  `spec.controls`, so the canvas, the headline step and the album's column rule are now URL state. The
  board imports `@/components/lab` and never the `@/components/dev/board` shim.
- **Reconciliation 1, the fifth ask.** Round one asked Will four things in `BoardMeta` but FIVE in its
  Record, because "rule on whether the no-script frame should be the settled album anyway" was buried
  inside a departure. It is an ask now (`no-script`: lockup or settled, recommended lockup) and the
  departure keeps the trade without the question. No new argument: both strings are round one's.
- **Reconciliation 2, where the width arithmetic lives.** `askBecause` caps at 300 characters and round
  one's width ask was 1100. The number that DECIDES the call stays in the ask (632 px of content at every
  viewport, so `columns-2` is about 314 px, and the candidate is the column rule AND a wider cap); the
  full working, measured in the live DOM, is the album section's argument, where a reader who disagrees
  will look for it. Every figure is round one's, re-measured on this tree: container 632, tile 314.5,
  three columns 208.66, four columns of today's container 155.75, `max-w-6xl` 1112 and 275.75, and this
  board's own frame 1154 with tiles of 575.5 and 286.
- **One export was added to the field**, `FIELD_DENSITY` (plus `FIELD_FLIGHT_S`), so the stage caption
  reads the pool size off `GEO` instead of carrying it as prose. Round one carried "fifty-two frames at
  1440" in four separate strings and one of them was already stale at its first read-back. Nothing about
  the field's geometry, pool or loop changed: the diff on `field.tsx` is the export and its comment.
- **The two shell asks from round one are both already landed** on `launch-prep` and needed nothing from
  me: `touchpoints.ts`'s `album-hero` entry carries the three readings as its variants and the replacement
  note, and `burst.tsx` / `burst.css` are `field.tsx` / `field.css`.

### An interpretive call, stated because the round's goal line can be read either way

The goal says "the board reads the page three ways ... those become the spec's `controls` and the dock's
switches". I read the three READINGS as the three declared SECTIONS, and the board's page-wide VARIANT
switches (the canvas, the headline step, the album's column rule) as the declared `controls`. The reason
is that a reading is not a variant of one specimen, it is a different specimen: as sections the three get
anchors, the index, the dock's Sections menu, their asks restated over the evidence that argues them, and
a walk that lands on them, and a link to one survives being pasted into a chat. Collapsed into a single
switch they would share one anchor and the board would have exactly one section, which is the shape the
template exists to replace. The three readings ARE reachable from anywhere on the page, through the dock's
Sections menu, which is Will's note (a) satisfied. If the Orchestrator reads the line the other way, the
change is a `reading` control plus one section, and it is small; it is written down here rather than
decided silently.

### A kit finding (a finding, not a wall, and not mine to land)

**Every anchored section lands one dock-height lower than it should, on every migrated board.** The kit
declares the offset TWICE: `BoardDock` writes `scroll-padding-top` on `<html>` (measured 145 px: the top
bar plus the dock plus 8) and `BoardSection` also carries
`scroll-mt-[calc(var(--lab-topbar-h)+var(--board-dock-h)+12px)]` (measured 149 px). A scroll-margin box is
placed at the scroll-padding edge, so the two ADD and a section arrives 294 px down instead of ~149. It
hides nothing, so it is air rather than a defect, but it is a duplicated single source. Reproduced on the
`light` pilot with the same two numbers, so it is the kit's and not this board's, and
`src/components/lab/` is only in this track's `reads`. The patch, if the Orchestrator wants it, is one
line: drop the `scroll-mt-[...]` from `BoardSection`'s className in `src/components/lab/answer.tsx` and
let the dock's `scroll-padding-top` own it (the dock already re-measures on resize and one frame after
mount, which the static class cannot).

### What was verified, and the three places the tooling lied

- **The board on the dev server at 1440 and 375, light and dark.** The template's order is what a reviewer
  meets: the dock, the answer (the question, the verdict, what would change it, the round-2 line), the
  five ask pills with their recommendation filled, the index, then the three sections. In light the shell
  chrome is light and the stage stays cinema at `oklch(0.11 0 0)`, which is right: the board's chrome
  follows the theme and the stage carries the page's own ground.
- **The three stages measure honestly**: 1440x930 for the hero (a viewport), 1440x1088 for the album, and
  1440x10521 for the whole route, against a content height of 10518 plus `FitStage`'s 3 px of slack. All
  nine children of the page reading are present in shipped order (the hero box at exactly one viewport,
  the album, GettingIn 713, Everywhere 511, Quality 505, the paper chapter 5043, RelatedFeatures 468,
  the FAQ 874, the CtaBand 389). **Round one's "13,796 px" should not be re-quoted**: the stage is derived
  from its content, so the number moves with the sections and with the build, and this tree measures
  10,521. Nothing is clipped at either number.
- **The album's geometry**: the frame is 1154 px, the shipped `columns-2` gives 12 tiles at 576 px, the
  candidate gives four columns, and the switch is a no-op at 375 by design (the caption and a builder's
  note both say so). All twelve stand-ins load.
- **The settled composition, which is what a reduced-motion reader gets**, re-proved at 1440: 52 cards,
  zero outside the canvas, worst overhang 0 px. The reduced-motion CSS in `field.css` and `album.css` is
  untouched by this round.
- **The walk**: six steps, each setting its declared state (`step=xl`, then `columns=ship`, then
  `columns=wide`, then `canvas=phone`) and landing on its declared section (hero, hero, album, album,
  page, page).
- **The review panel composes the ledger line exactly**, character for character against the grammar, and
  `node scripts/lab-review.mjs --root <scratch>` recorded all five asks plus a board note into a SCRATCH
  copy of `docs/reviews/` (never the repo's: `git status` is clean and `docs/reviews/` still holds only
  `README.md` and `_window.json`). A deliberately bad token was refused by name against this spec
  ("huge" is not an option of album-hero.headline (lg, xl)) and wrote nothing.
- **`/design/lab` queues all five open asks** under the board, because the desk reads the registered spec.
- **No horizontal document scroll**, and nothing inside the board overflows the viewport. The widest dock
  knob is 223 px including its label, which clears 375 less the page's gutters, so the dock cannot take
  the document sideways at the phone width the `Toggle` landmine is about.
- **Three tooling lies, none of them a product fault**, and all three cost time before they were pinned
  down. (1) **A synthetic mouse click does not reach React in either browser tool here**: a click
  dispatched at the dock's own measured centre, with `elementFromPoint` returning that exact button and
  nothing over it, changed nothing, while a programmatic `.click()` on the same node set `?step=xl` and
  `data-step="xl"` immediately. The board is driven by its URL instead, which is the template's own share
  format, and that is how everything above was set. (2) **A hidden tab suspends rAF outright**, so the
  field reads as an empty canvas (0 of 104 cards animating, `data-paused` true, all 104 images
  `complete`); seven tracks were driving the same browser and each new lab tab stole the foreground. A
  builder's note on the hero section now tells the next reader to front the tab before concluding
  anything. (3) **A hidden tab also drops `scrollIntoView({behavior:"smooth"})` on the floor** while
  `behavior:"auto"` scrolls normally, which is why the walk's landings were measured with the smooth
  branch forced to auto. The one console error on the board is a browser extension writing
  `cz-shortcut-listen` onto `<body>`.
- **What a human eye still owes this board is round one's thirty seconds**, unchanged: reading 1 at real
  speed with nothing else on screen.

### A stale figure in the round's own goal line

The round-2 goal says "the forty-frame field at 1440 and thirty-six at 375 stays exactly as built". The
field as built is **52 at 1440 and 44 at 375** (`GEO.cards`); the forty/thirty-six pair is the
pre-read-back figure round one corrected on 2026-09-15. The field is exactly as built and untouched; the
numbers should not be carried forward from that line.

## Record (round 2; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-15). The album page's hero board moved onto the kit's
template, and the argument it had been carrying in prop strings became data. `spec.ts` now holds the
question, the verdict, the five one-word calls, the two candidates, the departures and the three assets;
`board.tsx` holds only the evidence for each declared section as a function of the declared state. A
reviewer's first screen is the answer and the words he can reply with rather than seventeen thousand
pixels of field, and the three readings became anchored sections with an executable six-step walk that
sets the dock and lands on its evidence. Two things round one had said in two places were reconciled
rather than re-argued: the no-script question, buried in a departure while the Record counted it among
the asks, is the fifth ask, and the width call's arithmetic moved from the ask into the album section,
where the density limit could hold it. The board's own shell code went to the kit (the measuring stage,
the captions, the Replay, the toggles), and the field gained one export so a caption reads its pool size
off the geometry instead of repeating it in prose. No candidate, number or recommendation changed.


## Handoff (round 3, the clarity round)

- Head `ee240bd8` plus this manifest commit, pushed. **No preview and no `[ci]`**: the round's review
  surface is a local `pnpm dev` on `launch-prep` after integration. Everything below was verified on
  **my own dev server on port 3468**, never the root checkout's, plus a local production build.
- Synced with `origin/launch-prep` at `99544a2b` (it had moved 26 commits: glow-specs, brand-voice,
  rounding, the review card and home-hero all integrated). ONE conflict, and it is exactly the
  adjacent-deletion collision the round expected: `registry.test.ts`'s `PLAIN` list, where my side
  deletes `"album-hero"` and theirs deletes `"brand-voice"` (and four more). Resolved by keeping EVERY
  side's deletions, so `PLAIN` is now `floating-surfaces, media-kit, palette, river-visual, type-scale`.
  Merge commit `ee240bd8`.
- Gates, each on its own exit code, on the merged tree: typecheck **0**, lint **0** (0 errors; the 6
  warnings are pre-existing files outside this lane), test **0** (2170 in 219 files), build **0**
  (257 static pages), `pnpm lab:smoke --base http://localhost:3468` **0** (325 checks, 0 failing).
  `pnpm format` ran on the three changed files (no rewrites).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` =

  ```
  src/app/(dev)/design/sandbox/album-hero/board.tsx
  src/app/(dev)/design/sandbox/album-hero/spec.ts
  src/app/(dev)/design/sandbox/registry.test.ts      <- the one exception the brief names
  ```

  (plus this manifest commit). The single exception is the `PLAIN` deletion the round's rule 5 allows
  for THIS board id; nothing else in that file was touched, and no other board's line was.
- Shared-file changes asked of the Orchestrator: **none**. `src/components/lab/`, `touchpoints.ts`,
  `bible.ts`, `docs/design/`, `docs/reviews/` and every other board were not touched.
- Assets requested from Will: **the same three as round two, unchanged and unmoved** (they live in
  `spec.ts`'s `assets`): the 24 squares (row 2), the 11 4:5 portraits (row 9), the 2 short clips
  (still NEW, not on ASSETS). This round asked for no new asset: it changed words, not evidence.
- Look at first: `/design/lab/album-hero?session=album-hero.headline`. The review card pins under the
  dock with the question, its context, the look line and both options in words; picking one sets the
  dock's Headline switch, because the ask and the control now share their ids.

### The five asks, as they now read

One line each: the question, then the two option labels in the reviewer's own words. The ask ids and
the option ids are UNCHANGED, because the ledger joins on them.

- **headline** · "How big should the headline over the field be?" · `lg` **Today's headline** ·
  `xl` **One step louder**
- **width** · "How wide should the live album be on a laptop?" · `ship` **As it ships** ·
  `both` **Wider: four columns**
- **life** · "What should show that the album is filling live?" · `pulse` **The green dot, as it
  ships** · `arrival` **A photograph landing at the top**
- **no-script** · "What should the hero show when the animation cannot run?" · `lockup` **Words alone,
  as it is today** · `settled` **The album, spread out and still**
- **copy** · "Whose words should the hero say?" · `page` **The live page's own words** ·
  `voice` **Hold for the brand voice line**

Every one carries a `context` (what the thing is and where it lives on the site), a `look` (which
section, which dock switch, what to compare) and a `means` line per option (what choosing it would do).
The five nicknames the round named are gone from everything a reviewer reads: `lg | xl` became the two
headline sizes, `both | ship` the album's width, `pulse | arrival` the live signal, `lockup | settled`
what a reader with no JavaScript sees, `page | voice` whose copy the hero renders. The vent is "the
point in the middle", the lockup is "the page's own words", the quiet zone is "a space no photograph
ever enters", and the cinema-to-paper cut is "the switch from the dark chapters to the light ones".

### The two asks that mirror a switch, and the id that moved

`headline` mirrors the dock's `step` and `width` mirrors its `columns`, so a pick on the review card IS
the preview. That needs the two id sets to be EQUAL (`registry.test.ts` checks it), and `columns`'
second position was `wide` against the ask's `both`. **The CONTROL's id moved to the ask's**, never the
other way round, because the ask's ids are the ledger's: `columns=wide` in a pasted URL is now
`columns=both`, and `board.tsx` reads the option rather than the old string. Verified live: landing on
`?session=album-hero.width` with `canvas=phone&columns=ship` in the URL forced the canvas back to 1440
(the ask's declared `state`) and left the Album switch on "As it ships"; clicking "One step louder" on
the headline card set the dock and wrote `&step=xl`. `pnpm lab:review --dry 'review album-hero r2:
width=wide'` now refuses with `"wide" is not an option of album-hero.width (ship, both)`, which is the
proof that renaming the control created no second vocabulary.

### Both dock labels are short on purpose

A two-option `Toggle` renders `wrap={false}` (`ControlKnobs` only wraps past five), so a long pair of
labels would be one unwrappable row. Each of these measures about 210 px against the roughly 343 px a
375 viewport gives, and the knob ROW wraps between knobs, so the dock stays inside the canvas. A future
round that lengthens a mirrored option's label should re-measure rather than assume.

### The one ask I could not make fully plain without new evidence

**`life`, the album's live signal.** The question, its context and both option labels are plain, and the
evidence carries the shipped option's name ("Its only live signal is the green dot, as it ships, beside
the words Live now"). But the board can only SHOW one of the two options: the pulsing dot exists and the
arriving tile does not, and building it is new evidence, which this round's rule 4 forbids. So the
`look` line says so in as many words ("The landing photograph is a proposal and is not built on this
board, so judge whether the dot says enough on its own") rather than pointing at a specimen that is not
there. If Will answers `?` on this one, the fix is a round that builds the arrival, not more words.

Two asks are judged on evidence that is honest but one-sided for the same reason, and both say so:
`no-script` cannot paint a no-JavaScript page inside a live board, so its `look` gives the reviewer the
one thing that DOES reproduce the alternative ("Turn Reduce Motion on in your system settings and
reload the Hero section"); `copy` shows the live page's line and names the voice board rather than
printing a sentence this board did not write.

### A note for the wiring round

Nothing here changed a candidate, a number, a recommendation or a pixel of the field: the diff is
strings, three captions and one control id. Round two's measurements, departures and assets all stand
exactly as recorded above.

## Record (round 3; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-16). The album page's hero board's five asks were
rewritten in plain words, after Will's first review through the desk stopped at asks that were labels
with token options. Each is a real question now, carrying what the thing is and where it lives on the
site, where to look and what each option would do, with the ids untouched so the ledger still joins on
them: the headline's size step, the album's width on a laptop, its one live signal, what a reader with
no JavaScript sees, and whose words the hero says. The evidence learned the same vocabulary, reading
each option's label off the spec so a caption and the ask a reviewer answers cannot drift apart, and the
board's question, verdict and three section ledes dropped the nicknames (the vent, the lockup, the quiet
zone, the cinema-to-paper cut) for what they are. The dock's Headline and Album switches now wear the
asks' own labels and ids, so picking an option on the review card previews it; the album switch's second
position moved from `wide` to `both` to match the ask, because a control's ids bend to an ask's and
never the reverse. No candidate, number or recommendation changed, and no new evidence was built.
