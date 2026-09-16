---
track: brand-voice
status: open
cut: "d5f0c3c9"          # round 6, the clarity round, cut from launch-prep
cut_round_5: "1b647d76"
merged_round_5: "d10287fa"
merged_round_4: "fa118649"
merged_round_3: "4530f2e"
merged_round_2: "b574cda"
merged_round_1: "d988c88"
preview: false          # no branch preview: the round reviews on a local pnpm dev after integration
owns:
  - src/app/(dev)/design/sandbox/brand-voice/
  - docs/specs/brand-voice.md
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

---

# lp/brand-voice

## Round 6 (the clarity round, 2026-09-15): every ask in plain words

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

**This board.** Seven asks. `b | a | today` are three voices named by a letter: label each by what it
is ("B, the room: built from the code on the table becoming an album"; "A, the house: the register the
ratified lines already speak"; "Today, as shipped") and gloss it in `context`; the dock's `voice`
control (`today | house | room`) mirrors the voice ask, so rename its ids to the ask's and wire
`control`. `whole | line-by-line`, `take | hold`, `send-back`, `split`, `email | sign-in` each need the
sentence that says what happens to the copy under them. "Bible 20", "the thesis", "the unfurl" and
"the seven provisional home headers" are nicknames: say what each is where it is asked.

**Verify on.** The gate (`pnpm typecheck && pnpm lint && pnpm test && pnpm build`, each green); the board
at 1440 and 375 on a local `pnpm dev` (`/design/lab/brand-voice`), reduced motion honoured, every evidence
section showing the options' words; the desk's session on this board (`/design/lab?session=brand-voice.voice`)
read cold, as a stranger; `pnpm lab:review --dry 'review brand-voice r5: <ask>=<option id>'` accepting one
clause per ask. No `[preview]` and no `[ci]` on your pushes: the round's review surface is a local
`pnpm dev` on launch-prep after integration.

**Handoff.** The usual (head SHA, gates, lane check) plus every ask as it now reads (the question and
the option labels, one line each), and any question you could not make plain without new evidence,
with why.

**Binds.** The bible, the contracts of every component under a path you own, and the policies;
everything else is precedent (`docs/design/README.md#what-binds-you`). Will's rulings this track works
under: 2026-09-15 · a question carries its context; an exploration is a catalog; 2026-09-15 · the review
surface.


## Round 5 (the Library x Lab migration wave, 2026-09-15)

**Goal.** The brand voice board onto the kit, with the round-four ruling kept: every comparison shows the voices in
use on production UI across marketing and the app, and every comparison names its distinction (`Compare`'s
`differs` is required, which is the rule made mechanical). `FitStage` retires to the kit's `Stage`; the
heading-ladder workaround becomes `Frame` in portal mode with `height="measured"`; `CopyPaste` becomes
`Paste`; the sixteen surfaces the guide writes are the sections' evidence through `Frame`s of the real
pages wearing each voice; the spec doc loses its asks block.

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

**Verify on.** `/design/lab/brand-voice` on your dev server at 1440 and 375, light and dark, reduced motion;
`/design/lab` shows the board's open asks; the gate and `pnpm lab:smoke` green.


## Round 4 (Will's review notes, 2026-09-15)

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

**Will's notes on this board, verbatim.** "I feel like there's a handful of notes about the voices, but not a
lot of actual usage examples that I can get a feel for each voice through. I would love to see the brand
voices previewed on a few different production UI areas across marketing and app to see how they'd write
copy in different instances." "I noticed in some copy examples, like the quiet surfaces where it shows
today's copy versus the proposed copy in the new brand voice, a lot just have the exact same versions with a
note that says 'unchanged'. That's fine for actual copy rewrites, as we don't have to force changes
everywhere, but it's absolutely useless for a brand voice comparison here. Any examples should actually show
the distinction (can include similarities as well)."

**Round 4 (the goal).** (1) **Usage over notes.** The board leads with the voices in use: each voice
writing the same real surface, side by side, on live production components and whole real pages across
marketing and the app: a hero, a chapter header and body, a feature card set, a pricing card, a help
article's opening, the dashboard's empty state and its event card, the create-event wizard's steps, the
upload sheet a guest sees, a toast, an error, an email subject and opening line, a notification. Every
example is a real line that would ship, at 1:1, on the real ground. (2) **Every comparison shows the
distinction.** No "unchanged" rows in a voice comparison: where a voice would leave a line as it is, show
how the OTHER voice would write it and say why this one holds; a comparison exists to show the difference,
and a similarity may be shown beside it. (3) The guide (`docs/specs/brand-voice.md`) grows the examples per
surface to match, so a wiring round can write in the voice from the guide alone. (4) **The dock** carries
the voice, the canvas and the ground. (5) Keep round three's recommendation, its measured cost and the
twelve chapters; recut the chapters so the usage examples come first.

### Binds (every track)

**Binds.** The bible, the contracts of every component under a path you own, and the policies
(`/design/library/policies`); everything else is precedent (`docs/design/README.md#what-binds-you`,
rendered at `/design/library`). Shell changes are asked for in the Handoff and announced in
`docs/tracks/orchestrator.md`; never edit `src/components/dev/`, `src/components/lab/`,
`touchpoints.ts`, `rules/bible.ts`, another track's files, or CHANGELOG, STATUS, ROADMAP, PROGRAM,
CLAUDE, AGENTS, `docs/ASSETS.md`, `docs/design/rulings.md`, `docs/reviews/`. Light QA (Will,
2026-09-14): the board at 1440 and 375 in a foreground tab, reduced motion honoured, the gate green
on the synced tree.

## Round 3 (Will, 2026-09-14: one more iteration cycle before his review)

**Round 3 (the goal): the last mile, walked first by you.** Two rounds built the board; this one is the
walk Will will take, taken before him. (1) **Walk it cold**, the way he will: the board on the launch-prep
alias (round 2 is integrated there) and then on your preview, in a foreground tab, at 1440 and then
375, every toggle, every candidate, and every "Apply to the site" block on the pages you listed (the home
arc, `/pricing`, `/help`, `/contact`, the dashboard and an event page with `?key=`, the demo guest page).
Note every place a stranger would stumble: an unexplained toggle, two candidates that read the same, a
stage that needs a caption or has one too many, a slow first paint, a layout that breaks at 375, a
control that does nothing visible. Fix each. (2) **Re-read the reviewer's findings** on your round-2
handoff (below) and the other boards' latest Handoffs in `docs/tracks/` and proposals in `docs/specs/`:
anything there that changes your answer changes your board. (3) **Make the decision easy**: the strongest
candidate first; a candidate cut if it no longer earns its column (say so); every ask a one-word answer
and no more asks than Will must answer; the departures only the ones he must rule on. (4) **Honesty and
cost**: every number on the board is measured or labelled a stand-in; measure what runs (frame time, layer
count) and cut what does not earn its cost; reduced motion gets the settled composition. (5) **The
record**: "Handoff (round 3)" and "Record (round 3)" below; the Record is the paragraph the CHANGELOG
carries for rounds 2 and 3 together, so write it as the whole story of what the board became.

## Round 2 (Will, 2026-09-14: "another iterative round on all active tracks before review")

**Round 2 (the goal).** The guide exists and three voices were argued on headers; now argue them on
whole pages, since a voice is judged in a paragraph and a page, not a line. (1) **The home arc, top
to bottom**, in A and in B (the recommended two; keep C only if it still earns a column): every
section's eyebrow, header, supporting text and CTA on the real section shells in order, so the arc
reads as one voice. (2) **Two feature pages whole** (`/features/album` and one more): the h1, the
hero sub, the cards and their titles, the nav label and description, the directory line, in the
chosen voice, beside today's; and the 30 feature-page strings in B as a table the infusion round can
paste. (3) **The quiet register on real app copy**: the dashboard's empty state, an error, a
notification line, an email subject and its first line, the account page's labels, in the voice.
(4) **The guest register**: the demo guest page's real lines (the door, the upload prompt, the
account-required unfurl both ways) with Partyreel nearly silent. (5) **The spec's do's tightened**
so each sentence shape has one example per surface written in the voice, and the fences read as
do's; the bible-20 replacement stated in one sentence. (6) The unfurl line and the five headers stay
on the board as the asks Will answers with a word. No "Apply to the site" (copy is not CSS); the
board is the surface. Read at 375 as well as 1440.

### The rules of round two (every track)

- **Why a second round.** Will (2026-09-14, after the first wave integrated): "They all seemed to be
  making progress in their directions, but a single round of context didn't seem to be enough for
  any of them to reach enough of their full potential for a real review." Read your round-1 Handoff
  and Record below as your own notes, look at the board as it stands on the launch-prep alias, and
  judge it from the ground up (bible 22): what would the perfect version of THIS board be, as a
  surface Will can rule on in a few words after walking it? Elevate what points there, rework what
  does not. Every candidate should be complete enough to ship as a paste; every ask a one-word answer.
- **The other boards are inputs now.** Every proposal from the first wave is in `docs/specs/`
  (`palette.md`, `light.md`, `type-scale.md`, `floating-surfaces.md`, `brand-voice.md`,
  `media-kit.md`). Use what sharpens your board (the palette's ramps under your surfaces, the light
  spec's shadow family on your cards, the type tables on your headings) and say so in BoardMeta; you
  still own only your lane, so read those boards' files, never edit them.
- **"Apply to the site".** The shell now lets a board hand the WHOLE site a CSS block, the same paste
  its ruling would land, so Will judges a candidate on the real pages and not only on a stage:
  `setCandidateCss(label, css)`, `clearCandidate()` and `useTunerCandidate()` from
  `@/components/dev/board`. One block at a time (the newest replaces the last); it renders as a
  `<style>` after every stylesheet on every lab page, every marketing page and the host app (all with
  `?key=`), persists in the browser until cleared (the tuner panel shows it with a clear button; your
  board shows a badge and its own clear). A block must be real CSS with the real selectors
  (`:root, .surface-paper`, `.dark`, `.surface-ink`, `.dark[data-mkt-skin="cinema"]`, a primitive's
  own class), never a stage-local class. Where your candidate is a CSS paste, offer it per candidate
  ("Apply A to the site") and list in BoardMeta the pages to walk with it on: `/`, `/pricing`,
  `/help`, `/contact`, `/dashboard` and an event page (the app needs the signed-in host), the demo
  guest page. The knobs are reachable too: `setTunerValue(control, value)` from
  `@/components/dev/tuner-store` with a control from `motion-tuner-config.ts`.
- **The same lane, the same wave rules.** You own exactly what your front matter says; never
  `touchpoints.ts`, `bible.ts`, the shell, `docs/ASSETS.md`, CHANGELOG, STATUS, ROADMAP, PROGRAM,
  CLAUDE, AGENTS. No mono (there is no mono face in the product now; `two-faces-policy.test.ts`
  refuses a `font-mono` class), no em-dashes, keyframes under your prefix, sheets never import
  tailwindcss, `<Glow>` only. Unlimited design resources: ask for exactly what the design needs, one
  bullet per asset in the fixed shape. Light QA: the board on your preview at 1440 and 375, reduced
  motion honoured, the gate green on the synced tree.
- **Boot.** Round one's branch and worktree are gone; cut fresh: `git fetch origin`, then
  `git worktree add ../partyreel-wt/<track> -b lp/<track> origin/launch-prep`, install, copy
  `.env.local`, fill `cut` below with the SHA you branched from, commit this manifest alone
  (`docs(tracks): reopen <track> for round two`), push `-u`; `pnpm test` green. Sync only per
  PROGRAM.md.
- **Handoff.** Fill "Handoff (round 2)" and "Record (round 2)" below (round 1's stay as history),
  `status: handed-off`, push; the chat report is one line, "handed off at <sha>".

## Round 1, for reference (integrated; the brief it was built to)

**Goal.** The brand-voice exploration of the review wave (2026-09-14). Bible 20 (affirmative only) was "messy: don'ts without do's" and bible 21 (ruled copy) was killed: all copy is open until the voice exists. This track writes the voice guide as a proposal (`docs/specs/brand-voice.md`) and shows it on a board: sample headings and lines beside today's on real section shells, with the home arc's seven provisional section headers rewritten in the proposed voice as the worked example. A later round, `voice-infusion`, carries the ruled voice site-wide; not this one. Lab and spec only: no production copy changes on this track.
**Rulings in force.** The bible's second edition: rule 20 as rewritten (affirmative only; the two fences that are product truth stand: no human-response or human-moderation promise, no automation absolutes; `content-policy.test.ts` assertion 3), rule 21 (copy is open), rule 19 (no em-dashes), rule 4 (a guest surface belongs to the host's event: the guest register is the host's voice, Partyreel nearly silent), rule 6 (a masthead is one or two words).
**Verify on.** `/design/lab/brand-voice?key=` on your preview at 1440 and 375; `docs/specs/brand-voice.md` reads whole; the gate green.

## The brief

### The question

If Partyreel's voice were written down today, what is it (in one paragraph and three registers), what are its sentence shapes with an example per surface, and what do the home arc's seven provisional headers sound like in it?

### The facts, verified at `51f40e3` (start here; do not rediscover them)

- **There is no voice doc anywhere.** `grep -rn -i "voice\|tone" docs/systems/marketing-content.md docs/PRD.md`
  finds two false positives; the written copy rule is one line (CLAUDE.md "Copy": the em-dash ban).
- **The ruled lines** (`src/lib/constants/marketing-voice.ts`): `SITE_THESIS` ("The whole event, in one
  album.") and `SITE_SUBHEAD` (ruled 2026-08-25), `SECTION_HEADERS.howItWorks` and `.pricing`,
  `DECOMPOSITION_FACTS`, `FAILURE_MODE_LINE`; `GOLDEN_LINES` (`:17-26`) are the eight lines Will ratified
  verbatim in the voice round of 2026-07-08 (the closest thing to a corpus of his taste). Ruled means
  "a change is a ruling", not "protected": all copy is open (bible 21).
- **The seven provisional headers** (`SECTION_HEADERS`, `:51-85`), each with Will's appetite in its
  `note`: `noApp` and `fullQuality` (his lines, ruling pending), `liveDemo` ("entertains other ideas"),
  `album` ("more distinctness from the live demo before it and curation after it"), `curation`
  ("guest-side benefits in the frame"), `privacy` ("cleaner"), `reel` ("a share-the-highlights framing
  that feels more alive"). The "pin update" clause at `:38-42` is dead: no copy is pinned by a test since
  `91606e9` (2026-09-12), as `:104-106` says.
- **The rest of the inventory** (the infusion round's surface, not yours to rewrite): `marketing-nav.ts`
  (44 labels, 15 descriptions, mirror-tested against `feature-pages.ts`), `feature-pages.ts` (30
  provisional strings; `navDescription` ~45 chars; `directoryLine` in one length band, Will's own
  2026-09-02 rewrite), 59 help MDX (2,959 lines) with `content/help/AUTHORING.md` as the content
  agent's brief, 23 blog MDX, legal (`legal-privacy.tsx`, `legal-terms.tsx`, 1,366 lines), ten email
  templates (`src/lib/email/templates.ts`, subjects inline), and app UI copy inline with no module
  (`help-ui-labels.test.ts` requires every `<UiLabel>` the help centre quotes to exist in the app
  source, so an app-control rename is a two-file change).
- **The fences that stay** (`src/lib/content-policy.test.ts`): assertion 2 (fabricated social proof,
  CSAM/law-enforcement language, ingress numbers; `:126-142`), assertion 3 (no human-response or
  human-moderation promise, no "business day", no automation absolutes; `:160-175`; scope: all MDX +
  `CLAIM_FILES` + every non-test `.ts(x)` under `(marketing)`, `components/marketing`, `lib/constants`,
  whole-file with whitespace collapsed; the deliberate carve-outs "every upload has a real person
  behind it" and careers' "We read every application"); `no-em-dash-policy.test.ts` (AST-based over
  `app`, `components`, `lib`; comments exempt). The ruling behind assertion 3: copy commits to OUTCOMES,
  never to WHO or WHAT delivers them.
- **Two copy rulings parked in STATUS ride this board:** the account-required unfurl line ("This event
  asks guests for an email." against "...asks guests to sign in with an email."; one word settles it)
  and the five copy-alternative picks with the two provisional home headers.
- **The three registers you name** (bible 2 and 4): marketing loud, the app quiet, the guest surface in
  the host's voice with Partyreel nearly silent.

### The board

Sample headings and lines beside today's on real section shells (`PageHero`, `SectionShell`, a
feature card, a help article head, an app label, an email subject, an error), on cinema and paper, at
1440 and 375: the seven provisional home headers rewritten in the proposed voice as the worked
example, the unfurl line both ways, the five copy-alternative picks. The candidates span the range: a
tuning of the ratified lines' register; a voice rebuilt from the product's one idea (the QR becoming
the album) with new sentence shapes; one that questions a ruled line (flagged). The asks: the voice
(the guide's paragraph and its three registers); the seven headers; the unfurl line; the five picks.
### The deliverable

`docs/specs/brand-voice.md` (a proposal until Will rules, then promoted to `docs/systems/brand-voice.md` by the Orchestrator): a ROLE blockquote; the voice in one paragraph; the three registers; the do's as sentence shapes, each with an example per surface (hero, section header, feature card, help article, app label, email subject, error); what it never does, folded from the fences; a rewrite procedure for the infusion round (how a line is judged, what it keeps, how the app's inline copy and the help catalogue's `<UiLabel>` pairs are swept). Plus the board. Read the constants, the tests and `marketing-content.md`; change none of them.

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

- none. No file outside `owns` was touched; no production byte changed.

## Deferred (ROADMAP one-liners, bucket named)

- **Design lab follow-ons from the gallery round:** a Tailwind breakpoint prefix inside a `Stage`
  reads the REAL browser viewport, not the canvas, so `sm:` fires inside the 375 stage too; note it
  in the board shell's doctrine (a board's own markup keys off the `mode` prop, while the real
  marketing components carry their own prefixes and are judged as they ship).

## Handoff (round 1)

- Head: the branch tip (the board and spec at `4d0052d`, the spec's read-through fixes after it), pushed; preview
  `partyreel-git-lp-brand-voice-partyreel.vercel.app`, the board at
  `/design/lab/brand-voice?key=8838d0dd22f626a603fcf551`, the guide at `docs/specs/brand-voice.md`.
- Synced with launch-prep: it had not moved. Still `6c19d84`, the SHA in `cut`.
- Gates on the tree: typecheck ok, lint ok (0 errors; 7 warnings, all pre-existing and none in this
  lane), test ok (1,644 in 190 files), build ok (113 routes).
- Lane check: `docs/specs/brand-voice.md`, `docs/tracks/brand-voice.md` and the three files under
  `src/app/(dev)/design/sandbox/brand-voice/` (`board.tsx`, `board.css`, `voices.ts`). No exceptions.
  Nothing production imports anything on this branch; `marketing-voice.ts` and the tests are untouched.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Assets requested from Will: none. The board is type on the real grounds, and its one stand-in (the
  feature card's grey plate) stands for the hub door's own photograph, which already exists.
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will):
  - "The voice: today, A the house, B the room, or C the guest list (the agent recommends B, with A second)"
  - "The seven provisional home headers in the ruled voice, or line by line from any column"
  - "The account-required unfurl line: asks for an email, or asks to sign in with an email (the agent recommends asks for an email)"
  - "Bible 20's replacement: lead with what arrives, an absence may be the second beat and never the first"
- Look at first:
  - **The fourth ask is the one that outlives the round.** Bible 20 as written ("say who we are,
    never who we are not") reads on the RULED "Scan, upload, done. No app to install." and on the
    whole no-app argument. The guide proposes the sharper do: lead with what arrives, an absence may
    be the second beat and never the first, and never both. It keeps the ruled line and kills
    `noApp` ("Nothing to install. Nothing to sign up for."), which is two absences and no product.
  - **Board 4, the paper chapter, on B.** `album` as a left masthead reading "Two hundred photos you
    never had to ask for." is the clearest argument the board makes for the during over the after.
  - **B's trade, visible on board 2 at 375:** its h1 runs four lines on the phone against today's
    two. A carries none of that cost and none of the lift.
  - **Two things the board found rather than built.** The three registers do not fork with the voice
    (board 1 and 6 show them once; only the marketing register's default shape moves), and the five
    copy-alternative picks have lost their list, so the board reads them as the five headers with an
    appetite for a different line. Both are in Departures.

## Record (round 1)

Merged into `launch-prep` at `<sha>` (2026-09-14). The brand voice was written down for the first
time. `docs/specs/brand-voice.md` is the guide as a proposal: the voice in one paragraph, the three
registers with a table of what changes between them, five sentence shapes, an example on each of
the seven surfaces, the two product-truth fences folded in as do's beside a word list, and the sweep
procedure the `voice-infusion` round rewrites by (how a line is judged, what a rewrite keeps, and
the order, with the `<UiLabel>` parity making an app rename a two-file change by construction). The
board on `/design/lab/brand-voice` argued it three ways on the real `PageHero` and `SectionShell`,
across cinema, paper and the app ground at 1440 and 375: A tuned the register the eight ratified
lines already speak, B rebuilt it from the code becoming the album, and C made the people the
subject and rewrote the ruled thesis to do it. The home arc's seven provisional headers were
rewritten in each, beside today's line and Will's recorded appetite; the unfurl was shown both ways.
Three departures were flagged rather than buried, and no production byte changed.

## Handoff (round 2)

- Head: the branch tip, pushed. The round-two review fixes are `da618a2` and `43c55f5`; the
  manifest commits sit on top of them. Preview
  `partyreel-git-lp-brand-voice-partyreel.vercel.app`, the board at
  `/design/lab/brand-voice?key=8838d0dd22f626a603fcf551`, the guide at `docs/specs/brand-voice.md`.
  The round-two board is the one whose root div carries `class="bv-round-two"` and whose control
  bar reads "Moves 33 of 65 lines in the arc, 15 of 30 on the feature pages."
- Synced with launch-prep at `4b035c1` (it had moved by one docs commit, `design-system.md`;
  merged in, gate re-run green).
- **Fixed after the round-two review (three defects, one of them blocking; the fourth was the QA
  claim, answered by the walk below).**
  1. **Every stage clipped, or could.** Board 5's thesis was a 520px box holding 616px of content,
     so the word "it." was cut off the second line at 1440 and the phone stopped at "as", on the
     exact surface ask 6 asks Will to choose on. The curation hero clipped 38px on candidate A.
     The cause was hand-tuned literal heights, and the reason they could not be trusted is now in
     the code: a real marketing component inside a `Stage` resolves its own `sm:`/`lg:` rungs
     against the REAL browser window rather than the canvas, so the arc's chapters measure up to
     40px taller at a 1512 window than at 1150 in the same voice. A literal cannot hold for three
     voices, two canvases, every window width AND an edit to the copy above it, which is the whole
     activity on a copy board. So there are no literal heights left: `FitStage` (board.tsx)
     measures its content in a layout effect before the first paint, re-measures on the voice
     swap, and keeps a ResizeObserver for the webfont settling and the window resizing.
  2. **The feature pages now include their cards**, which goal item (2) asked for and round two's
     first pass dropped without saying so. `PageSection` gained `cards` (and `cardColumns`), and
     the two pages carry all 24 of their real card sets: the album page's nineteen (getting in,
     the settings, the name states, the three plates, the four lifecycle steps and three notes) and
     the curation page's five (the two review modes, the three reversible calls). `today` is the
     SHIPPED object, imported from `album-copy.ts` rather than retyped, so the board cannot drift
     from the page. A count and a reason per set sit under each page.
  3. **The finding those cards produced is the reason to have rendered them.** A moves 3 of the 48
     card strings and B moves 6, against 23 and 33 of the 65 arc lines. Will's 2026-09-02 finish
     pass had already written these sets in one length band with the numbers derived from the
     constants the product enforces, and three sets quote the app's own helpers (the album page's
     `Accepting uploads` body is the settings card's helper verbatim, pinned by mock-parity, so it
     is a two-file change owned by the quiet register). Rendering them also caught a collision
     worth the whole exercise: B's supporting line for Names ended on "it rides on everything they
     add", which is the first card word for word. The line gave the clause back.
- **Light QA, done and stated (this is the bullet the review said was missing).** The board was
  walked on `pnpm dev` at both canvases in all three columns, Today, A and B, six passes:
  - **Nothing clips.** Every element inside every stage is inside its stage: a scan of all 14
    stages for any `h1/h2/h3/p/span/td/li/button` whose box crosses the stage's edge returns empty
    in all six passes, and `scrollHeight - clientHeight` is 0 on all 14 stages in all six.
  - **1440 and 375** are the two canvases above; the phone column reads with the cards stacked at
    the measure `album-copy.ts` wrote them to, and B's h1 still takes its four rows.
  - **Reduced motion is honoured.** The only animation anywhere under `.bv-round-two` is
    `bv-swap-in`, and it is inside `@media (prefers-reduced-motion: no-preference)`, so under
    `reduce` the board renders the settled composition with nothing to undo. All 7
    `[data-mkt-reveal]` slots in the stages compute to opacity 1, so no line depends on motion to
    be read. The only console error is a `cz-shortcut-listen` hydration warning from a browser
    extension on `<body>`, not from this board.
- **The preview alias is stale through no fault of this branch, and Will should know before he
  walks it.** Every push since roughly 22:00 on 2026-09-14 has produced NO deployment, on any
  track: the newest build in the project is `lp/palette` at `b4be6a2`, and the lp/palette track
  reported the same thing as a Vercel daily deployment rate limit. So
  `partyreel-git-lp-brand-voice-partyreel.vercel.app` still serves `1c109b1`, the board WITH the
  two clipped stages and without the cards. It will pick up `43c55f5` on the next build the
  project is allowed; nothing needs to be pushed again. Until then the evidence for the fixes is
  the local walk above, which is stated in numbers rather than impressions for that reason.
- Gates on the synced tree, re-run after the fixes: typecheck ok, lint ok (0 errors; 6 warnings,
  all pre-existing and none in this lane), test ok (1,698 in 193 files), build ok (114 routes, 248
  static pages).
- Lane check: `docs/specs/brand-voice.md`, `docs/tracks/brand-voice.md` and the three files under
  `src/app/(dev)/design/sandbox/brand-voice/` (`board.tsx`, `board.css`, `voices.ts`). No
  exceptions. Nothing production imports anything on this branch; `marketing-voice.ts`,
  `feature-pages.ts` and the tests are untouched, and no production byte changed. The arrow now
  runs the other way in two places, which is deliberate and worth the Orchestrator's eye:
  `voices.ts` IMPORTS `sections/features/album/album-copy.ts` and
  `lib/lifecycle/recently-deleted.ts`, read-only, so the cards' `today` column is the shipped
  object rather than a retyped copy of it. Both are pure modules with no server import in their
  chain, and the production build is unchanged at 114 routes.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Assets requested from Will: none. The board is type on the real grounds; its only stand-ins are
  the grey plates behind the unfurl cards, which stand for a link preview's own thumbnail.
- **No "Apply to the site" on this board, per the round-two goal: copy is not CSS.** The
  equivalent artifact is on the board instead: each candidate is copied out as a real TypeScript
  block, `Copy the SECTION_HEADERS paste` (board 4) and `Copy the FEATURE_PAGES paste` (board 8),
  so a ruling reaches `marketing-voice.ts` and `feature-pages.ts` without a line being retyped.
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will):
  - "The voice: today, A the house, or B the room (the agent recommends B)"
  - "The seven provisional home headers: the selected voice whole, or line by line from the ledgers"
  - "The rest of the arc (the eyebrows, the supporting lines, the CTAs): take the selected voice, or hold today's"
  - "The account-required unfurl line: asks for an email, or asks to sign in with an email (the agent recommends asks for an email)"
  - "Bible 20's replacement, in one sentence: lead with what arrives, an absence may be the second beat and never the first, and never both"
  - "The thesis: keep in one album, or take as everyone saw it (the agent recommends keeping it)"
  - "One noun for the thing: album everywhere, or album on the site and gallery on a guest's screen (the agent recommends album everywhere)"
- **Shell findings the Orchestrator must carry (both fixed inside this board's own sheet, both
  true of every board that stages a marketing component):**
  1. **The lab never compiles the heading ladder.** `design.css` scans only
     `src/app/(dev)/design`, so a responsive rung no LAB file spells is never emitted for a lab
     page: a `PageHero` on a `Stage` resolves to its base class and renders at 48px where the site
     renders 96px. Every hero on every board is currently judged at the wrong size.
  2. **The 375 stage is not 375 for type or gutters.** The documented prefix gotcha (a Tailwind
     breakpoint inside a `Stage` reads the REAL viewport) bites harder than the shell's note
     implies: inside the phone stage every `sm:`/`lg:` rung fires, so `Container` takes the 2rem
     desktop gutter and every heading takes its desktop step. `board.css` restates both, keyed to
     a `data-bv-canvas` attribute the board sets from the `mode` prop. The right home for that is
     the shell, not fourteen board sheets.
  3. **`Stage` takes a height it cannot keep.** A stage is a fixed box with `overflow: hidden`, so
     every board passing a literal height is promising something about content it does not control,
     across voices, canvases AND window widths (finding 2 is exactly why that last one bites: a
     real marketing component inside a stage resolves its `sm:`/`lg:` rungs against the browser).
     Round two's review found two clipped stages here from that alone, one of them the hero an ask
     is written on. The working fix is `FitStage` in this board's `board.tsx`, about thirty lines;
     a `fit` height mode on `Stage` itself would retire the literal from every board at once.
- **The registration line is stale.** `touchpoints.ts` (not this track's to edit) still describes
  the board as "Three candidate voices ... the seven provisional home headers rewritten in each
  beside today's line; the unfurl both ways." Round two is two candidates on whole pages; the
  Orchestrator should reword it at integration.
- Look at first:
  - **The feature pages read as pages now, cards and all, and they are where the voice does the
    least.** Boards 6 and 7 carry all 24 real card sets; the ledger under each page counts what a
    voice costs there (A moves 3 of 48 strings, B moves 6) against what it costs on the arc (23 and
    33 of 65). That gap is the sharpest thing on the board about what adopting a voice means: the
    arc is unwritten and the feature pages are finished.
  - **Board 2 to 4, the arc top to bottom, on B.** This is the round's whole point: fifteen
    sections in shipped order on their real grounds. Read it once on Today, once on B; the count
    in the control bar says how much moved, and every line a candidate keeps is marked `held`.
  - **The held markers are the finding, not an omission.** A moves 23 of 65 arc lines and 6 of 30
    feature strings; B moves 33 and 15. A is cheap because the feature pages were already written
    in its register, which is its case and its cost in one number.
  - **Board 10, the guest register.** The shipped account gate says "Create a free account to see
    the full gallery and add your own photos." on the host's own page. That is the one line bible
    4 refuses, and it is a one-sentence fix.
  - **Ask 7 is new and outlives the round.** The site says *album* in every heading, nav label and
    directory line; the guest surface says *gallery* in five places. A guest who scans a code on
    the site's promise lands on a different product's noun.
  - **B's cost is now measurable rather than asserted.** With the ladder restored, B's h1 takes
    four rows at 375 against today's three, and three at 1440 against today's two.

## Record (round 2; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). Round two argued the voice where a voice is
actually judged: on whole pages. The board walks the home arc's fifteen sections top to bottom on
their real grounds, every eyebrow, header, supporting line and CTA in the selected voice with a
ledger carrying today beside it; then `/features/album` and `/features/curation` whole, cards
included, the thirty identity strings as a table, and the app's quiet and guest copy on twelve
surfaces. Candidate C was retired after it read as B with a substitution across fifteen sections,
and its one real question, the ruled thesis, became its own ask. Copy is not CSS, so each candidate
copies out as a real `SECTION_HEADERS` and `FEATURE_PAGES` block instead, and every held line is
counted: A moves 23 of 65 arc lines and 3 of 48 card strings, B 33 and 6, which is the round's
sharpest finding, that the arc is unwritten while the feature pages are already finished. Three lab
facts that had been making boards lie about their own content were fixed and reported to the shell:
the uncompiled heading ladder, the real-viewport prefix inside a stage, and a `Stage` height that
cannot be written as a literal, measured from the content now. The guide gained an example per
surface for each shape, the fences restated as the eight do's bible 20 asked for, and two findings:
the album/gallery split, and the guest account gate that asks for an account with us on the host's
own page. No production byte changed.

## Handoff (round 3)

- Head: the tip of `lp/brand-voice` (this manifest commit); the board's code head is `cfb443d`, on
  top of the sync merge `e769c27`. The board is at
  `/design/lab/brand-voice?key=8838d0dd22f626a603fcf551`, the guide at `docs/specs/brand-voice.md`.
  **The round-three board is the one whose root div carries `class="bv-round-three"`, opens with a
  card reading "The recommendation / B, the room." and carries a twelve-chapter index in the control
  bar.**
- **The preview alias serves round TWO, not this head, and that is not this track's to fix.**
  `partyreel-git-lp-brand-voice-partyreel.vercel.app` still serves `0f40d41` (`bv-round-two`): the
  project is at Vercel's daily deployment ceiling, so no push from any track builds reliably, and
  the branch gate is not the cause. The measurement and the exact error are under "The preview
  alias, and where this head was actually verified" below. **Every claim this handoff makes was
  verified instead on a local server in this worktree, `pnpm dev -p 3031`, at a real 1440 viewport
  and a real 375 one, six passes (two canvases by three columns).** The one-line check that the
  right head is on screen either way: the root div reads `bv-round-three`.
- Synced with `launch-prep` at `dd4aa0b` (it had moved by the palette and floating-surfaces
  round-two merges and their manifests; nothing in this lane or its `reads`). Merged clean, gate
  re-run on the merged tree.
- Gates, re-run in full at this head after the review pass: typecheck ok, lint ok (0 errors; 6
  warnings, all pre-existing and none in this lane), test ok (1,719 in 193 files), build ok (248
  static pages, compiled clean).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/specs/brand-voice.md`,
  `docs/tracks/brand-voice.md` and the three files under
  `src/app/(dev)/design/sandbox/brand-voice/` (`board.tsx`, `board.css`, `voices.ts`). No
  exceptions, and no production byte changed. The two read-only production imports round two added
  are unchanged (`voices.ts` imports the album page's shipped copy module and the
  recently-deleted constant, so the cards' `today` column cannot drift from the page).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Assets requested from Will: none. The board is type on the real grounds; its only stand-in is the
  grey plate in the three unfurl cards, which stands for a link preview's own thumbnail and now
  says so on the board.
- **No "Apply to the site" block, and none is coming: copy is not CSS.** A tuner board hands the
  site a candidate STYLESHEET; a voice board hands it SENTENCES, which reach the pages only as
  TypeScript. The equivalent artifact is the pair of pastes, rendered per candidate and copyable off
  the board: `sectionHeadersPaste()` in chapter 4 (the seven home headers as the `SECTION_HEADERS`
  edit for `marketing-voice.ts`) and `featurePagesPaste()` at the foot of chapter 8 (the thirty
  identity strings as the `FEATURE_PAGES` array for `feature-pages.ts`). Nothing in this lane calls
  `setCandidateCss`, so the candidate-block check is N/A here by construction. The pages the goal
  names were brought to the board instead: the full reasoning is under "The goal's 'Apply to the
  site' block, and the real pages it names" below.
- **The one MARKED row in chapter 11 is a bible-4 compliance fix, not an eighth ask.** The shipped
  guest account gate asks a guest to make an account with us on the host's own page, which bible 4
  refuses whatever the voice, so the infusion round rewrites it either way. The board says so in the
  field name (`compelled`), the badge ("bible 4 refuses the shipped line") and the chapter headnote;
  the only choosable part is the noun, which is ask 7. **The asks stay at seven.**

### The review passes on this handoff (two of them, and what each defect got)

A read-only review of the round-three handoff found one blocking and two should-fix items; a second
read-only review re-raised the same three as should-fix. All three are answered at this head, and
the second pass also produced one real defect of its own, found by re-walking rather than re-reading
(the phone canvas at a REAL 375 browser window, item 4 below).

1. **The preview alias does not serve this head (blocking).** Not caused by this lane and not
   fixable from inside it. The cause is now measured rather than guessed, with the exact error, and
   it rules out the remedy the review proposed: the project has spent its 100 deployments for the
   rolling day, so a forced redeploy returns 402 as surely as a push does, and the only thing that
   lands one is a push timed into the window that opens every fifteen minutes or so. See "The
   preview alias, and where this head was actually verified" below. The branch gate passes on all
   three counts, and every check this round claims was re-run at this head on a local server, at a
   real 1440 viewport and a real 375 one.
2. **The round's "Apply to the site" item was dropped from the record.** Restated, with the two
   pastes named as the equivalent artifact and the reason the real pages cannot be walked in a
   candidate: see "The goal's 'Apply to the site' block, and the real pages it names" below.
3. **The one row the board called a decision reached no ask.** Fixed in the board rather than the
   manifest: the row is compelled by bible 4, not chosen, so the field, the badge and the chapter
   headnote now say so and point at ask 7 for the one part of it that IS a choice. The asks stay at
   seven. Walk item 5 and the line under the asks say it in the record too.
4. **Found by the re-walk, not by the review: the phone canvas overflowed a real 375 window
   (`cfb443d`).** Round three's own beside-the-stage grid put the 375-wide canvas in a grid item,
   whose default `min-width` is AUTO, so at a 375 browser window the single-column grid measured
   375 where the page's content box is 343: `Stage` read its wrapper as wide enough, kept `zoom: 1`
   instead of fitting, and pushed 16px of horizontal scroll onto the document in all three columns.
   Three of the sixteen stages took that path; the other thirteen were fitting correctly at 0.91.
   `min-w-0` on both cells removes the floor and `Stage`'s own zoom-fit takes over: all sixteen
   stages now measure 343 at a 375 window with **zero** document overflow, and at `lg` the track is
   an explicit 375px so the ledger still sits beside the stage at 1440 (cells 375 and 593). Worth
   the Orchestrator's eye because it is really a fifth shell finding: a fixed-width `Stage` inside
   any grid or flex cell needs that floor removed, and the shell could do it once.

### The walk, taken cold, and what it changed

The round-three brief asked for Will's walk to be taken first. Six passes (two canvases by three
columns), and every stumble it found is fixed:

1. **The verdict was at the bottom of a 15,000px board.** The recommendation, the one-line case for
   it, the case for A, and three anchored pointers now open the board; the strongest candidate is
   the FIRST column and the default; the twelve chapters are a one-row index in the sticky bar
   (borrowed from the palette board's round two, which found the same thing on a shorter board).
   The index scrolls rather than wraps, because wrapped it made the bar four rows tall on a narrow
   window.
2. **B's cost was prose, typed once.** "Four rows at 375" was a sentence, not a measurement, and
   only one column renders at a time, so it could not be checked by looking. A ruler now clones the
   LIVE heading (its own class list, its own width) and counts the line boxes for all three columns
   at the canvas on screen: the h1 takes **B 3, A 2, today 2 at 1440** and **B 4, A 3, today 3 at
   375**. The same ruler under the thesis found something the prose had missed: the alternative
   costs a row at 1440 and **nothing at 375**.
3. **Three pages the walk names had never been on a board.** `/help`, `/contact` and `/pricing` are
   chapter 9, on their real grounds, plus two real help article heads, which closes the last gap
   between the guide's surfaces table and this board. It is the cheapest chapter on the board and
   possibly the highest-yield: "How can we help?" and "Talk to Partyreel." are the two most generic
   sentences on the site.
4. **The phone canvas was a 23,000px walk with 800px of dead ground either side of every stage.**
   At 375 the ledger now sits BESIDE the stage, so the line being judged and the line it replaces
   are in one view.
5. **Twelve app and guest rewrites all read like twelve rulings.** They are the sweep's ordinary
   work, and the ONE row a rule already owns (the guest account gate) is marked with the rule that
   owns it, `bible 4 refuses the shipped line`. Both chapter headnotes say which is which. The mark
   is a compliance fix, NOT an eighth ask: bible 4 refuses the shipped line whatever the voice, so
   the infusion round changes it either way, and the only choosable part of the rewrite (the noun,
   email or sign in) is ask 7, which settles this door line and the chapter 12 unfurl together. The
   review of round three read the earlier wording ("the marked one is a decision") as a ruling that
   never reached the ask list, which was fair: the label, the headnote and the field name now all
   say compelled.
6. **A mark that meant nothing.** The dot in the ledger explained itself only in a `title`
   tooltip, on a board nobody hovers. It says what it is, and what `ruled` means beside it.
7. **Less to rule on.** Two of round two's four departures had become asks (bible 20, the
   album/gallery noun) and left; the asks were reworded so every one answers in a single word.
   Candidate A was re-judged from the ground up and KEEPS its column: it is the only answer that
   costs the finished feature pages almost nothing, which is an argument rather than a shade of B.

### The goal's "Apply to the site" block, and the real pages it names

The round-three goal asked the walk to cover "every 'Apply to the site' block" on the home arc,
`/pricing`, `/help`, `/contact`, the dashboard, an event page with `?key=` and the demo guest page.
Restating the standing judgment here, because round three's record dropped it:

- **This board has no "Apply to the site" block and will not grow one: copy is not CSS.** A tuner
  board hands the site a candidate STYLESHEET, so it can push one into the live pages and walk them
  with it applied. A voice board hands the site SENTENCES, which reach the pages only as TypeScript
  in two constants files. The equivalent artifact is the pair of pastes, rendered per candidate and
  copyable off the board: `sectionHeadersPaste()` in chapter 4's aside (the seven provisional home
  headers as the `SECTION_HEADERS` edit for `src/lib/constants/marketing-voice.ts`) and
  `featurePagesPaste()` at the foot of chapter 8 (the thirty identity strings as the `FEATURE_PAGES`
  array for `src/lib/constants/feature-pages.ts`). Nothing in this lane calls `setCandidateCss`,
  `clearCandidate` or `useTunerCandidate`, so the "a candidate block uses real selectors" check is
  N/A here by construction.
- **So the live pages were not walked in a candidate, because there is no state to walk them in.**
  Applying a voice is the infusion round running those two pastes; until then `/pricing` and the
  dashboard render today's lines whatever this board is set to. What this round did instead is bring
  the pages to the board on their real grounds: the home arc is chapters 2 to 4 (fifteen sections in
  order), the two feature pages are 6 and 7, `/help`, `/contact` and `/pricing` are chapter 9 (new
  this round, with two real help article heads), the dashboard and the app's quiet copy are chapter
  10, the demo guest page is chapter 11 and its `?key=` unfurl is chapter 12. Every `today` column is
  the SHIPPED string, imported from the page's own copy module where one exists (the album cards,
  the recently-deleted window) and transcribed verbatim from the source file otherwise, with the
  file named on each row, so the comparison is against the real page rather than a retyped memory of
  it.
- **The one thing that would still be worth walking live is the arc's ORDER**, which the board
  stages section by section rather than as one scroll. It is cheap for the infusion round to do with
  the paste applied on a branch, and it is the one judgment a staged board cannot make for Will.

### Light QA, in numbers (six passes: Desktop and Phone 375, each on Today, A and B)

- **Nothing clips, anywhere.** 16 stages; a scan of every `h1/h2/h3/p/span/td/li/button/dd/dt`
  inside every stage for a box crossing the stage edge returns empty in all six passes, and
  `scrollHeight - clientHeight` and `scrollWidth - clientWidth` are 0 on all 16 stages in all six.
- **No horizontal document overflow in any pass, which took a fix this pass.** At a real 1440
  window it was already 0 on both canvases. At a real 375 window the phone canvas was scrolling the
  document 16px in all three columns, because three stages were escaping `Stage`'s zoom-fit; see
  item 4 of the review passes above. Re-measured after `cfb443d`: `document.scrollWidth -
  clientWidth` is **0** at 375 on B, A and today, and all 16 stages measure 343 (the page's content
  box) rather than a mix of 375 and 343.
- **Reduced motion gets the settled composition.** Verified in the SERVED stylesheet, not just the
  source: the board's one animation (`bv-swap-in`) sits inside
  `@media (prefers-reduced-motion: no-preference)`, so under `reduce` there is no rule to undo. All
  13 `[data-mkt-reveal]` slots compute to opacity 1, so no line depends on motion to be read.
- **What runs, measured, and one thing cut.** The swap carried `animation-fill-mode: both`, which
  left a FINISHED animation attached to every stage for the life of the page: 17 of them measured
  sitting on the board at rest, one per stage, each a layer kept for a move that ended in 180ms. The
  keyframe's end state IS the resting state and there is no delay to cover, so the fill bought
  nothing and is gone. **At rest the board now runs 0 animations**; a voice swap runs 17 for 180ms;
  the worst frame of a swap fell from 83ms to 50ms with the median at 17ms, on 1,394 nodes.
- **Both canvases read, at real viewports.** All six passes walked top to bottom at a real 1440
  viewport (`innerWidth` 1440) and the whole board read again at a real 375 one (`innerWidth` 375,
  `clientWidth` 375). Round three's first pass had to reach 375 through a same-origin iframe because
  that browser tab would not reflow below desktop width; this pass drove a viewport that actually
  emulates the phone, which is what exposed the overflow above, so the iframe probe is retired as a
  method. Every number in this section was re-measured at `cfb443d`. The surface was a local dev
  server on the worktree tip, not the preview alias, for the reason set out below.

### The preview alias, and where this head was actually verified

The read-only review of round three confirmed this from the outside: 24 polls over twelve minutes,
every response HTTP 200 and every one of them `bv-round-two`. It is still true at this head, and the
cause is now measured rather than guessed.

- **The project is at a hard daily deployment ceiling, and the exact error is worth recording.** A
  deployment create against the Vercel REST API answers HTTP 402: `code: "payment_required"`,
  `resource: "api-deployments-free-per-day"`, `limit: {total: 100, remaining: 0}`, message
  "Resource is limited, try again in 24 hours (more than 100)". That is 100 deployments in a
  rolling 24 hours, all spent. It was tried 38 times between 23:49 and 00:05 EDT and `remaining`
  never left 0.
- **Meanwhile a push still lands one deployment per window, roughly every fifteen minutes, as the
  oldest of the hundred ages out.** The project list reads 22:48, 23:02, 23:17, 23:31, 23:46,
  00:00, each a different track. The slot goes to whoever pushes inside the open window; nine
  tracks are pushing tonight, and every push that arrives inside a closed one leaves NO record at
  all (not a canceled build: nothing). This branch has lost every window since 21:33, which is why
  the alias serves round TWO (commit `0f40d41`, deployment `dpl_4dUiy4m1eRRi538YY1A1ZLBh3oX2`),
  and the pushes at 23:42 and 23:44 of this pass went the same way.
- **So "force a redeploy" is not a move anyone has right now.** The API path an Orchestrator would
  use is the one returning 402 above; the dashboard's redeploy button is the same resource. What
  actually works is a push timed into an open window, or simply less pressure once the other tracks
  stop pushing. Either way it costs one commit, not a fix.
- **The branch gate is not the cause and there is nothing to fix on this branch.** The front matter
  says `preview: true` and `status: handed-off`, and every commit message also carries `[preview]`,
  so `scripts/vercel-ignore-build.mjs` exits 1 (build) on all three counts. A canceled build would
  have left a record; there is no record.
- **The check, in one line.** The round-three board's root div is `class="bv-round-three"`; round
  two's is `bv-round-two`. The head that serves is also visible as the card reading "The
  recommendation / B, the room." at the top and the twelve-chapter index in the control bar.
- **Where this head WAS verified, in full: a local dev server on the worktree tip.** `pnpm dev -p
  3031` in `../partyreel-wt/brand-voice`, board at
  `http://localhost:3031/design/lab/brand-voice?key=8838d0dd22f626a603fcf551`, served HTML confirmed
  to carry `bv-round-three` and the recommendation card before anything else was measured. Walked in
  a browser at **a real 1440 viewport** (`innerWidth` 1440) in all six passes, Desktop and Phone 375
  canvases each on B, A and today: 16 stages, 0 boxes crossing a stage edge, 0 stage scroll in
  either axis, 0 document overflow, 0 animations at rest, 13 reveal slots all at opacity 1, and the
  beside-the-stage grid measuring 375 and 593 as designed. Then at **a real 375 viewport**
  (`innerWidth` and `clientWidth` both 375, a viewport that emulates the phone rather than the
  iframe probe round three's first pass had to fall back on). That pass is what caught the 16px of
  document scroll fixed in `cfb443d`; re-measured after it, the three phone columns read 0 document
  overflow, 0 clipped boxes, 0 stage scroll, all 16 stages at 343, 0 animations at rest. Reduced
  motion was checked in the SERVED stylesheet rather than the source: both the `[data-bv-swap]` rule
  and the `bv-swap-in` keyframes resolve inside `(prefers-reduced-motion: no-preference)`, so under
  `reduce` there is nothing to undo.
- **So the round's light-QA rule is satisfied on the composition and not on the surface.** Will's
  rule is the board on ITS PREVIEW at 1440 and 375; this is the board at that head at 1440 and 375
  on localhost. If the alias has caught a window by the time this is read, the one-line check above
  settles it in a second; if it has not, the cheapest path is one `[preview]` commit pushed into an
  open window (they open about every fifteen minutes), and the dev server line above works at any
  time.
- **Also worth the Orchestrator's eye: the `launch-prep` alias serves ROUND ONE of this board**, not
  round two. It was checked at the start of round three, before any of its pushes: the integration
  alias builds on request and no `[preview]` push has rebuilt it since this track merged, so a walk
  there shows a board two rounds old.

### The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will)

- "The voice: B, A, or today (the agent recommends B)"
- "The seven provisional home headers: whole in the selected voice, or line by line from the ledgers (the agent recommends whole)"
- "The rest of the arc, its eyebrows, supporting lines and CTAs: take the selected voice, or hold today's (the agent recommends take)"
- "Bible 20's replacement, in one sentence: lead with what arrives, an absence may be the second beat, never the first, and never both. Yes, or send it back"
- "The thesis: keep in one album, or take as everyone saw it (the agent recommends keep)"
- "One noun for the thing: album everywhere, or album on the site and gallery on a guest's screen (the agent recommends album)"
- "The account-required unfurl line: email, or sign in (the agent recommends email)"

Seven, and nothing else on the board is waiting on Will. In particular the one MARKED row in
chapter 11 (the guest account gate, `components/guest/entry-modal.tsx`) is not an eighth ask: bible
4 refuses the shipped line, which asks a guest to make an account with us on the host's own page, so
the infusion round rewrites it whichever voice is chosen. Its only choosable part is the noun, and
that is ask 7 above, answered once for this door line and the unfurl in chapter 12.

### Findings the Orchestrator must carry

1. **The home page is about to carry two different counts.** The hero variations propose "312 photos
   from 48 guests" as a stand-in and the shipped decomposition band two sections below says "Built
   from 214 photos. Shot by 23 guests." Do 3 of the guide allows one of those, not both: one source,
   one pair of numbers, read from the demo event. It is a departure on this board and belongs to the
   composition pass. (The scan and the river already ask for a `demoCount` prop for exactly this.)
2. **`/pricing` and the home arc say one promise two ways.** The page's h1 is the ratified "Start
   free, upgrade when you host again." and the arc's ruled teaser is "Start free, upgrade for more
   events." Both are Will's; the infusion round has to pick one.
3. **The registration line is still stale.** `touchpoints.ts` (not this track's to edit) describes
   the board as "Three candidate voices ... the seven provisional home headers rewritten in each
   beside today's line; the unfurl both ways." It is the FIRST thing a walker reads and it has been
   wrong since round two: this is two candidates on whole pages, twelve chapters. Reword at
   integration.
4. **The three shell findings from round two are all still open** and are true of every board that
   stages a marketing component: the lab never compiles the heading ladder (a `PageHero` on a Stage
   renders at its base class, 48px where the site renders 96px); a Tailwind prefix inside a Stage
   reads the REAL viewport, so the 375 stage takes desktop gutters and desktop heading steps; and a
   `Stage` cannot be handed a literal height it can keep. This board restates the first two in its
   own sheet and solves the third with `FitStage` (about thirty lines in `board.tsx`); a `fit`
   height mode on `Stage` itself would retire the literal from every board at once.
5. **A fourth one, found this pass: `Stage`'s zoom-fit is silently defeated by a grid or flex
   cell.** `Stage` fits itself by measuring its wrapper, but a grid or flex item's default
   `min-width` is AUTO, so a fixed-width canvas inside one sets the track's own floor: the wrapper
   then measures the canvas width, the fit computes 1, and the stage overflows the page instead of
   scaling. It cost this board 16px of horizontal document scroll on the phone canvas at a real 375
   window, on three of sixteen stages, and it will cost any board that puts a `Stage` beside
   something. Fixed here with `min-w-0` on the cells; the durable fix is `min-w-0` on `Stage`'s own
   outer wrapper in the shell, which is one class and would immunise every board.

### Look at first

- **The first screen.** The recommendation, its cost, the three pointers. If the decision can be
  made there and confirmed in chapters 2 and 9, the round did its job.
- **Chapter 9, the pages the arc does not reach.** Newest, cheapest, and the place the voice does
  the most visible work: "How can we help?" against "Start with the short answer.", and "Talk to
  Partyreel." against "Every note gets a reply." The second is the model for the fence that keeps
  our support copy legal (an outcome, never who delivers it), and the two article heads hold in
  every column, which is how much the 59-article catalogue costs: nothing.
- **The row counter under chapter 2, then chapter 5.** B's whole typographic price in one measured
  line, and the surprise that the thesis alternative costs a row at 1440 and none at 375.
- **Chapter 2 at Phone 375.** The ledger beside the stage is the round's other structural change,
  and the phone is where B's extra row is paid.

## Record (round 3; the CHANGELOG paragraph for rounds 2 and 3, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). Rounds two and three took the voice from three
candidate headers to a board a ruling can be read off. Round two argued it where a voice is judged,
on whole pages: the home arc's fifteen sections top to bottom on their real grounds, `/features/album`
and `/features/curation` whole with all 24 card sets, the thirty identity strings as a paste, and the
app's quiet and guest copy on twelve surfaces; candidate C was retired after it read as B with a
substitution, and counting every held line produced the sharpest finding, that the arc is unwritten
while the feature pages are finished. Round three took Will's walk before him: the recommendation,
its cost and three pointers open the board, the strongest candidate is the first column, twelve
chapters are an index in the bar, and the voice's one real price is MEASURED off the live heading
rather than asserted (B's h1 takes 3 rows at 1440 and 4 at 375, against today's 2 and 3). A new
chapter put `/help`, `/contact` and `/pricing` on a board for the first time, where the voice does
its most visible work and costs the least. Four lab facts that had been making boards lie about
their own content were fixed and reported to the shell, the newest found by walking at a real 375
window (a fixed-width stage in a grid cell defeats its own zoom-fit), and the board's own cost was
cut from seventeen finished animations sitting at rest to none. The guide gained an example per
surface for each shape, the eight do's bible 20 asked for, and seven findings. No production byte
changed.

## Handoff (round 4)

- Head: the tip of `lp/brand-voice`, which is THIS commit: the second review pass lands its code,
  its guide and this manifest together, so the head a walker opens and the head this text describes
  are the same SHA. Round four's board landed at `ec839ba`, the first review pass corrected it at
  `9c3e929`, and `07ad3b21` from `launch-prep` is merged in.
  The board is at `/design/lab/brand-voice?key=8838d0dd22f626a603fcf551`, the guide at
  `docs/specs/brand-voice.md`. **The round-four board is the one whose root div carries
  `class="bv-round-four"`, opens on "The voices in use: marketing, loud" as chapter 1, and whose
  headnote reads "47 of 66 lines differ across the three columns."**
- **A SECOND review pass ran on this handoff and closed three items, all in place.** (a) Two of the
  three shell asks had already LANDED on `launch-prep` while the round finished, and this text was
  still presenting them as open; they are now recorded as landed, the board's dock workaround is
  deleted, and the walk below was re-measured on the merged tree (see the bullet above the asks).
  (b) Chapter 3's rationale said "two of these lines are marked as compelled" where exactly ONE row
  in the whole data set carries `compelled`; on a board selling a recomputed count, a hand-typed one
  that contradicts the rendered pills is the one thing that cannot be wrong, so the rationale now
  names the row in the singular and this manifest says the same. (c) The guide's "The sixteen
  surfaces, written" was 53 of the board's 66 rows while promising a wiring round it could rewrite a
  surface without opening the board. It is now **all 66** (25 marketing, 24 app, 17 guest, 19 held,
  each figure checked against `voices.ts`), the thirteen missing rows written from the same data the
  board renders: the feature band's subhead and cards 2 and 3, the pricing pair's two feature lines
  and Pro footnote, the album chapter's eyebrow, the help opening's first paragraph, the wizard's QR
  step body and both notification titles. The section now states its own count, carries the file for
  each of the sixteen surfaces (its preamble claimed one "named beside it" and none was), and the
  guest note's "five held" is corrected to six.
- **A review pass ran after the first handoff and fixed two accuracy defects**, both recorded in
  place rather than appended: (a) shell ask 3 below quoted a `touchpoints.ts` note that no longer
  existed (it was round two's string, copied out of round three's handoff instead of re-read from
  the file) and told a false history; it now carries the line as `touchpoints.ts:576` actually reads
  it, its real provenance, and the replacement text. (b) The "An error" surface compared the
  candidates against the WRONG shipped string: `signin` carried the zod validation fallback
  ("Check the form and retry.", `enter-event-prompt.tsx:126`), which sits behind a per-field message
  and is effectively unreachable, while both candidates rewrote it as a CREDENTIAL MISMATCH, which
  is a different state with its own shipped line two branches below (`:138`). B's proposal was very
  nearly that shipped line with the pointer to the email link removed, and that pointer is an
  account-enumeration decision (the comment at `:107-109`), not a preference. The row is now the
  line a guest actually meets, held in all three voices with the reason stated, so the count fell
  from 48 of 66 to **47 of 66 differing, 19 the same, 0 unexplained** (recomputed by the board, and
  re-read off the served page). The guide row at `docs/specs/brand-voice.md:218` was corrected the
  same way, because the infusion round is told it can paste from there without opening the board.
- **Where it was verified, and why not on the preview.** Vercel is capped for the trailing day
  (the round-four brief says so; round three measured the exact 402, `api-deployments-free-per-day`,
  remaining 0), so nothing here waited on a build and the Vercel API was not called. Every number
  below was measured on **a local PRODUCTION build in this worktree** (`pnpm build && pnpm start -p
  3035`), in a browser tab, at a real 1440 viewport and a real 375 one, after a walk on the dev
  server at `-p 3034`. The one-line check that the right head is on screen: the root div reads
  `bv-round-four`. **The SECOND review pass re-ran the whole gate and re-walked the board again on
  a fresh production build** (`pnpm build`, then `pnpm start -p 3147`, since another session holds
  3035), and the numbers below are that THIRD measurement, taken after the shell merge and after the
  dock workaround was deleted. Same method throughout: the 1440 and 375 figures come from
  same-origin iframes pinned to those exact widths, because twelve sessions share one window tonight
  and a resize lands on whoever is fronted. The dock was also read by eye at both widths this pass,
  since it is the part the merge moved.
- Synced with `launch-prep` at **`07ad3b21`**, the shell commit that answered this track's two dock
  and Stage asks (the earlier sync at `6484558` was one commit behind it). Merged clean, no conflict
  in this lane, and the whole gate re-run on the merged tree.
- Gates on the synced tree: typecheck ok, lint ok (0 errors; 6 warnings, all pre-existing and none
  in this lane), test ok (1,804 in 199 files), build ok (compiled clean, 248 static pages).
- Lane check, re-run on the merged tree at the head above: `git diff --name-only
  origin/launch-prep...HEAD` = `docs/specs/brand-voice.md`, `docs/tracks/brand-voice.md` and the
  three files under `src/app/(dev)/design/sandbox/brand-voice/` (`board.tsx`, `board.css`,
  `voices.ts`); this second review pass touched the first four of those and left `voices.ts`
  untouched, since every line it needed was already in the data. No
  exceptions, and no production byte changed. The read-only production imports grew by two, both
  pure constants modules with no server import in their chain, so the cards and the pricing pair
  quote the product rather than a retyped memory of it: `board.tsx` now imports the real
  `EventCard` (`components/app/event-card.tsx`) and `tiers.ts` (`planById`, `plansForTier`,
  `MAX_EVENTS`) beside round two's `album-copy.ts` and `recently-deleted.ts`. The production build
  is unchanged at 248 static pages.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- **Two of this track's shell asks are LANDED, not open.** `origin/launch-prep` moved to `07ad3b21`
  ("the dock wraps at 375...") while this round was finishing, and that commit carries both by name:
  **the dock's control cell now wraps** (`dock.tsx:98` reads
  `flex basis-full flex-wrap items-center gap-2 sm:min-w-0 sm:flex-1 sm:basis-auto`, which is
  exactly what was asked), and **`Stage`'s wrapper is `min-w-0`**, so a grid or flex cell can no
  longer defeat the fit. The previous handoff listed both as open because the track had merged
  `launch-prep` at `6484558`, one commit behind, and the review pass pushed without re-fetching.
  **This pass merged `07ad3b21` and DELETED the board's dock workaround** (`board.css`, the
  `@media (max-width: 767px)` block on `.bv-round-four`), which had stopped being redundant and
  started being wrong: it forced `flex-basis: 100%` up to 767px while the shell returns to
  `basis-auto` at 640px, so between 640 and 767 this board's dock stood a row taller than every
  other board's. Re-measured on the merged tree with the shell's own rule doing the work, below.
- **Shell changes asked for (the Orchestrator lands them).** Three: two carried from round three,
  one measured this pass on the merged shell.
  1. **Three of round three's four findings are still open** (the fourth, `Stage`'s `min-w-0`,
     landed at `07ad3b21`) and still true of every board that stages a marketing component: the lab
     never compiles the heading ladder (a `PageHero` on a Stage renders at its base class, 48px
     where the site renders 96px); a Tailwind prefix inside a Stage reads the REAL viewport, so the
     375 stage takes desktop gutters and desktop heading steps; and a `Stage` cannot be handed a
     literal height it can keep (this board's `FitStage`, about thirty lines, is the working fix,
     and a `fit` HEIGHT mode on `Stage` would retire the literal from every board at once, which the
     round-four `fit` prop does not do: that prop pins the SCALE). The first two matter MORE at 1:1
     than they did at zoom, because a specimen is now judged at the pixels it claims.
  2. **The registration line is one round behind, and it is the FIRST thing a walker reads.**
     `touchpoints.ts:576` currently reads, in full: "Two voices on whole pages beside today's: the
     home arc's fifteen sections, two feature pages whole, help, contact and pricing, the thirty
     identity strings as a paste, the app's quiet and guest copy on twelve surfaces; twelve chapters
     indexed in the bar, the recommendation and its measured cost first". That is round three's
     board, written by the Orchestrator at `abf0d74` ("the desk's board notes read rounds two and
     three"), and it was accurate when it landed. Round four moved the front of the board: sixteen
     surfaces rather than twelve, thirteen chapters rather than twelve, and the usage chapters now
     come FIRST with the ledgers behind them. Suggested replacement, at the desk's own length:
     "Two voices and today writing sixteen real surfaces on the components that ship them, at 1:1:
     the home hero, a chapter, a card set, the pricing pair and a help opening; the host's
     dashboard, event cards, wizard, toasts, errors, notifications and account; a guest's door,
     upload sheet, album and mail at 375. Then ten ledger chapters price the sweep whole page by
     whole page; thirteen chapters indexed in the dock, the recommendation and its measured cost
     with them". `variants` needs no change: the board still runs Today, A and B.
  3. **NEW, measured this pass: the dock's fix for 375 has two knock-ons, and one of them puts a
     board off the side of the screen.** `dock.tsx:98` now reads
     `flex basis-full flex-wrap items-center gap-2 sm:min-w-0 sm:flex-1 sm:basis-auto`. (a) `min-w-0`
     is now conditional, so BELOW `sm` the control cell is sized by its content's minimum. A board
     whose controls contain a `whitespace-nowrap` scroll row therefore hands the cell that row's
     full content width however loudly the row says `overflow-x-auto`: this board's thirteen-chapter
     index measured 911px, the cell took 911 inside a 343px row, and the DOCUMENT went to 927px on a
     375px window. That is a sideways-scrolling board, not a cosmetic issue, and it is silent until
     someone measures the document. This board defended itself in its own markup (`w-0 basis-full
     grow` on the nav, which reports zero and still fills its line, with the reason in a comment),
     but `min-w-0` unconditional on the shell's cell would immunise every board the way `Stage`'s
     new `min-w-0` just did. (b) `sm:basis-auto` sizes the cell by its content at desktop too, so a
     control-rich dock now takes the whole row and the shell's cluster wraps under it: 74px to 114px
     at 1440 on this board. That one reads FINE here (three clean rows, and the chapter index gets a
     full line), so it is reported rather than asked for, since the boards with one or two switches
     are the ones that would pay for it.
- Assets requested from Will: none. The board is type on the real grounds and on the real
  components; its stand-ins are the shipped ghost pack behind the two empty states (the product's
  own decorative asset, used as the product uses it) and the grey plate in the three unfurl cards,
  which stands for a link preview's own thumbnail and says so on the board.
- **No "Apply to the site" block, and none is coming: copy is not CSS.** A tuner board hands the
  site a candidate STYLESHEET; a voice board hands it SENTENCES, which reach the pages only as
  TypeScript. The equivalent artifact is the pair of pastes, rendered per candidate and copyable off
  the board: `sectionHeadersPaste()` in chapter 7 and `featurePagesPaste()` at the foot of chapter
  11. Nothing in this lane calls `setCandidateCss`, so the candidate-block check is N/A here by
  construction. What round four did instead is bring the PAGES to the board: sixteen surfaces now
  render as the real UI rather than as text in a card.

### What round four changed, against Will's two notes

**Note 1, usage over notes.** "There's a handful of notes about the voices, but not a lot of actual
usage examples that I can get a feel for each voice through... I would love to see the brand voices
previewed on a few different production UI areas across marketing and app."

The board now OPENS on the voices writing. Sixteen surfaces, each written three ways on the
component that ships it, at 1:1 on the real ground, in three chapters:

- **Chapter 1, marketing:** the home hero (real `PageHero` at the restored 96px ladder), the album
  chapter (real `SectionShell`, left masthead, on paper), a three-card feature set at the band
  `album-copy.ts` was written to, the pricing pair in the shipped markup with every number rendered
  from `tiers.ts`, and a help article's opening (badge, title, description, first paragraph).
- **Chapter 2, the host's app** (Will's fourth global note opened it): the dashboard's empty state
  with its ghost pack, **the real `EventCard`** three abreast in the dashboard's own grid, the
  create wizard's card and step rail, two toasts at sonner's width, the two errors, the
  notification panel, and the account page's labels. The app's theme is a page-wide switch in the
  dock, so all of it reads on app light and app dark.
- **Chapter 3, a guest's phone and the inbox**, always at 375 because that is the only place these
  render: the door in its three gates, the upload sheet (dropzone, the host's review note, the save
  card, the confirmation), the empty album, and the inactivity mail as an inbox row and the mail
  itself.

Round three's twelve chapters follow as the price list, minus the two these replaced (the quiet
register and the guest register, which were text cards with today beside ONE proposal). Thirteen
chapters, indexed in the dock.

**Note 2, every comparison shows a difference.** "A lot just have the exact same versions with a
note that says unchanged... it's absolutely useless for a brand voice comparison here. Any examples
should actually show the distinction (can include similarities as well)."

The cause was two different questions sharing one table. A voice COMPARISON asks how each voice
would write the line; a voice LEDGER asks what a rewrite would move and what it would leave. Round
three ran them together, so a hold printed as "unchanged" and taught nothing.

So in the usage chapters **every voice writes every line**, even where a sweep would keep today's,
and the ledger chapters keep counting what a sweep actually moves (A 23 of 65 arc lines, B 33).
Where all three still land on the same string, the row carries **the reason**, never the word
unchanged: a button the host is about to press, a help title that is also the search string, a state
pill that is a state. The board states its own compliance as a measurement rather than a promise:
**47 of 66 lines differ, 19 are the same in every voice and each says why, and a row the same in all
three WITHOUT a reason is counted as a defect out loud (there are 0).**

**The dock** (Will's global note a) carries the voice, the canvas, the app's theme and the
thirteen-chapter index, so a candidate flips from anywhere on a board this tall. **Nothing is
zoomed** (note b): every Stage renders at 1:1, which a copy board needed more than any other.

### Light QA, in numbers (a local PRODUCTION build, `pnpm start -p 3035`, at real viewports)

- **At a real 1440 viewport:** 52 stages, **0** boxes crossing a stage edge, **0** stage scroll in
  either axis, **0** horizontal document overflow, **0** of the 22 `[data-mkt-reveal]` slots below
  opacity 1, dock **114px**, board 41,526px tall. The dock was 74px before the shell merge: with
  `sm:basis-auto` the control cell is sized by its own content, so it takes the whole row and the
  shell's cluster (1:1/Fit, Sidebar, Desk, Collapse) wraps under it. Read by eye: three tidy rows,
  the voice, canvas and theme switches on the first, all thirteen chapters on the second, the
  shell's own controls on the third. Taller, not worse, and it is the shell's call rather than this
  board's (the ask is below).
- **At a real 375 viewport:** the same four zeros, dock 195px, board 58,738px, document exactly 375
  wide. Getting the last of those zeros needed a one-class fix in this board, described in the ask
  below: the merged shell drops `min-w-0` from the control cell under `sm`, and this board's
  thirteen-chapter index is a `whitespace-nowrap` scroll row, which reported its 911px content to
  the cell and scrolled the whole board sideways (a 927px document on a 375px window) until the nav
  was given `w-0 basis-full grow`. Measured before and after, both ways.
- **What "stage" means in those two lines**, because the two boxes give different answers: the
  clip and scroll counts are taken on the CANVAS (the `[data-ground]` box that holds the specimen),
  which is the thing a reader looks at. Its parent, the `[data-stage-fit]` rail, carries
  `overflow-x-auto` by design and DOES scroll wherever a 1:1 canvas is wider than the lab column
  (40 of 52 at 1440, all 52 at 375). That is the price of the round's own "nothing is zoomed" rule,
  not a defect, and it is why the canvas is the box that gets counted.
- **The phone CANVAS reads three abreast**, which was a change this round: three 375 canvases are
  1,125px and fit a 1440 window, so stacking them left a thousand pixels of dead ground beside every
  specimen and put the line being judged a screen away from the line it replaces (round three found
  the same thing on its ledgers). Measured at the phone canvas: all 52 stages 375 wide, 0 clipped, 0
  stage scroll, 0 document overflow, and the board 36.5k pixels instead of 44k.
- **Reduced motion gets the settled composition**, verified in the SERVED stylesheet rather than the
  source: both `[data-bv-swap]` rules (the rule and the `bv-swap-in` keyframes) resolve inside
  `(prefers-reduced-motion: no-preference)`, so under `reduce` there is nothing to undo.
- **At rest the board runs 0 animations**, measured on the production build at the first handoff.
  The review pass could NOT re-measure it honestly: twelve sessions share one browser tonight and
  the tab reported `document.hidden` at every attempt, which is exactly the trap below. Nothing in
  the review pass touches motion (`board.css` is byte-identical and the two fixes are prose and one
  string), so the count stands on the first measurement rather than on a hidden-tab reading. ★ A caution for the
  next reviewer, and it cost this round twenty minutes: a HIDDEN tab freezes every mount animation
  at `currentTime` 0 and they report `playState: "running"` forever, so a probe run in a background
  tab reads 53 animations on a board that is actually at rest. Twelve tracks share one browser
  tonight, so a tab is hidden more often than not; front it, then measure. The same fact is why the
  window-size tools could not be trusted this round (a resize applied to a window another session
  had fronted), and why the 1440 and 375 numbers above were taken inside a same-origin iframe at
  those exact widths, with the at-rest animation count taken on the fronted top document.

### Findings the Orchestrator must carry

1. **Three lines in the app are CORRECTIONS rather than rewrites, and land whichever voice wins.**
   (a) The create wizard's date helper says "events never expire", and the product's rule is that an
   event stays until the host deletes it: there is deliberately no end date, which is the
   anti-abuse core. It is on the board in all three voices and in the guide's sweep step 5.
   (b) "Hidden from everyone" is true and still wrong, because the host can still see the photo.
   (c) The storage notification's "before we auto-reduce it" names the machinery and then threatens
   the host with it, which is the fence do 2 exists for.
2. **Some app copy is a prop and some is a component edit, and the difference sets the size of the
   sweep.** The event card's two pills arrive from `dashboard/events-section.tsx`; its amber review
   chip is hardcoded in `event-card.tsx`. The board says so on the specimen (all three cards show
   the shipped chip and the row below is where the candidates part), and the guide's "What a rewrite
   keeps" now carries the rule.
3. **The email subject is one ruling for ten templates**, not a line-by-line call: A keeps
   "Partyreel" in it because an inbox sorts and searches by our name and this mail arrives months
   after the party; B puts the reader's own event first, which is the guide's rule everywhere else.
4. **The guest sign-in form has two error strings and only one of them can appear.** The zod
   fallback at `enter-event-prompt.tsx:126` ("Check the form and retry.") sits behind
   `parsed.error.issues[0]?.message ?? ...`, and zod always supplies a message, so the fallback is
   dead copy; the line a guest meets is the credential mismatch at `:138`. The sweep should not
   spend a rewrite on the dead one, and whoever touches that file could delete it. Found by the
   round-four review pass, which is also why the board's `signin` row now shows `:138`.
5. **Carried from round three, unchanged:** the home page is about to carry two different counts
   (312 from 48 as a hero stand-in against the shipped "Built from 214 photos. Shot by 23 guests.");
   `/pricing` and the home arc say one promise two ways ("upgrade when you host again" against
   "upgrade for more events"); and the five copy-alternative picks have lost their list.

### The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will)

- "The voice: B, A, or today (the agent recommends B)"
- "The seven provisional home headers: whole in the selected voice, or line by line from the ledgers (the agent recommends whole)"
- "The rest of the arc, its eyebrows, supporting lines and CTAs: take the selected voice, or hold today's (the agent recommends take)"
- "Bible 20's replacement, in one sentence: lead with what arrives, an absence may be the second beat, never the first, and never both. Yes, or send it back"
- "The thesis: keep in one album, or take as everyone saw it (the agent recommends keep)"
- "One noun for the thing: album everywhere, or album on the site and gallery on a guest's screen (the agent recommends album)"
- "The account-required unfurl line: email, or sign in (the agent recommends email)"

Seven, unchanged from round three, and nothing new on the board is waiting on Will. The ONE marked
row in chapter 3 (the account-required line on the door, `components/guest/entry-modal.tsx`) is
compelled by bible 4 rather than chosen: the shipped line asks a guest to make an account with us on
the host's own page, so the sweep rewrites it whichever voice wins, and its only choosable part is
the noun, which is ask 6. It is the only `compelled` in the data set, and the chapter rationale now
says so in the singular, because a walker counts the black pills.

### Look at first

- **Chapter 1, the first two surfaces.** The hero is the whole ruling in one lockup: A writes
  today's two ratified lines back, because keeping them IS A's argument, so only the eyebrow and the
  second CTA move; B writes a different sentence about the same product. Then the album chapter,
  where the three are furthest apart. Flip the canvas to 375 and the three phones sit abreast with
  B's extra row visible rather than asserted.
- **Chapter 2, the wizard and the notification.** Two of the three corrections above are on screen
  there, and they are the clearest evidence that walking the app's copy in the app's own UI finds
  things a text card hides.
- **Chapter 3, the door.** Three gates, three voices, nine cards, and bible 4 deciding more than the
  voice does. The album-and-gallery split is visible in one screen.
- **The counter under chapter 1's headnote.** It is the round's answer to the second note, stated as
  a number the board recomputes rather than a promise: 47 of 66 differ, 19 explained, 0 unexplained.

## Record (round 4; the CHANGELOG paragraph for round 4, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-15). Round four answered Will's two notes by turning
the board around: it opens on the voices WRITING rather than on notes about them. Sixteen real
surfaces, each written three ways on the component that ships it and at 1:1 on the real ground: the
home hero, a chapter, a card set, the pricing pair with every number from `tiers.ts` and a help
opening; the dashboard's empty state, the real `EventCard` three abreast in the dashboard's own
grid, the create wizard, two toasts, the two errors, a notification and the account page; a guest's
door in three gates, the upload sheet, the empty album and an email, all at 375. The "unchanged"
rows that made the old comparison useless were a symptom of two questions sharing one table, so the
usage chapters now have every voice write every line while the ledgers keep pricing a sweep, and
where all three still agree the row carries the reason rather than the word: 47 of 66 lines differ,
19 are explained, and an unexplained match is counted as a defect on the board itself. The
page-wide switches moved into the shell's dock, the phone canvas reads three abreast, and the guide
grew a section that writes all sixteen surfaces line by line, all 66 rows with the 19 held ones
carrying their reason, so a wiring round can rewrite a surface without opening the board. Three of
those app lines are corrections rather than rewrites (an event that "never expires", a photo
"hidden from everyone" the host can still see, and a storage warning that names the machinery). No
production byte changed.

## Handoff (round 5)

- Head: the tip of `lp/brand-voice` (this manifest commit, on the sync merge `52e5190`), pushed;
  preview `partyreel-git-lp-brand-voice-partyreel.vercel.app`, the board at
  `/design/lab/brand-voice`, the guide at `docs/specs/brand-voice.md`. **The round-five board is the
  one with no legacy-layout tag on its header, whose first block is the question and the verdict
  with seven ask pills under it, and whose specimens sit in captioned frames rather than in stages.**
- Synced with `launch-prep` at **`a489d563`** (it had moved by fourteen commits: the glow pair,
  home-hero and river-visual migrating, and the shell's "anchors land once, not twice"). One
  conflict, in `sandbox/registry.ts`, and it was the adjacent-line kind this wave expects: two
  tracks adding an import and a `BOARDS` entry. Resolved by keeping both and placing `BRAND_VOICE`
  in the same order the rest of the list already follows, `touchpoints.ts`'s `SANDBOX` order, which
  puts it after `LIGHT` and before `ROUNDING`. Whole gate re-run on the merged tree.
- Gates on the synced tree, each on its own exit code: typecheck ok, lint ok (0 errors; 6 warnings,
  all pre-existing and none in this lane), test ok (2,140 in 218 files), build ok (compiled clean,
  257 static pages), `pnpm lab:smoke --base http://localhost:3417` ok (300 checks, 0 failing).
- Lane check, `git diff --name-only origin/launch-prep...HEAD`: `docs/specs/brand-voice.md`,
  `docs/tracks/brand-voice.md`, and four files under `src/app/(dev)/design/sandbox/brand-voice/`
  (`spec.ts`, `board.tsx`, `frames.tsx`, `board.css`). **Three exceptions, the registration lines
  the wave allows, for this board id only:** `sandbox/registry.ts` (the spec imported and added to
  `BOARDS`), `(shell)/lab/boards.ts` (`legacy: true` dropped from the `brand-voice` entry),
  `components/lab/kit-discipline.test.ts` (`"brand-voice"` deleted from `LEGACY`). Nothing else
  outside the lane, and no production byte changed. The read-only production imports are unchanged
  from round four (`album-copy.ts`, `recently-deleted.ts`, `event-card.tsx`, `tiers.ts`), so the
  board still quotes the product rather than a retyped memory of it.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Assets requested from Will: none. The board is type on the real grounds and on the real
  components; its stand-ins are the shipped ghost pack behind the two empty states and the grey
  plate in the three unfurl cards, which stands for a link preview's own thumbnail and says so.
- **Where it was verified.** A local dev server in this worktree on port 3417, in a fronted tab, at
  a real 1440 viewport and a real 375 one, after the sync merge. Every number below was measured
  there rather than asserted.

### Shared-file changes asked of the Orchestrator (two, both written and working in this lane)

1. **`height="measured"` on the kit's `Frame`.** The migration contract named it and the kit does
   not have it yet: `Frame` takes `h: number`. This board's `frames.tsx` has the working version in
   about twenty lines (`useMeasured`): a callback ref that observes the portalled scene with the
   FRAME's own ResizeObserver, returns its teardown (React 19 ref cleanup), and hands the height
   back. Lifting it retires the literal height from every board that portals a scene, the way the
   `fit` prop retired the zoom. ★ Two traps came with it, and both are in the code with the
   measurement that found them: **the whole `fonts` chain has to be guarded** (on the top document
   `fonts.ready` is always a promise, which is why the kit writes `fonts?.ready.then(...)`; an
   about:blank document holds a FontFaceSet whose `ready` is still undefined on the tick a portal
   mounts into it, and `.then` on undefined threw inside a layout effect and took the whole board to
   its error boundary on a fast scroll), and **a frame's reserved height should be remembered**
   (`MEASURED`, a module map keyed by frame id and canvas: without it the board shrank by tens of
   thousands of pixels as fifty frames landed, and every flip of the voice or the canvas paid again).
2. **`useAnchorAfterSettle` into the kit**, beside the Walk. A board of lazily mounted,
   self-measuring frames cannot honour a hash at load: the browser applies it once, while every
   frame still holds a reserved canvas. Measured before the fix: a link carrying
   `#brand-voice-guest` landed on its section and then watched it rise 14,500px. The hook re-applies
   the hash on a short schedule while the board settles, cancelled by a wheel, a touch or a key
   (a programmatic scroll fires none of those, so the cancel cannot cancel itself), four corrections
   and it stops. It is thirty lines in `frames.tsx` and it is true of every board with frames, so it
   belongs in the kit rather than in this one. **The kit's own `Walk` wants the same tick**: a step
   scrolls, and on a board still measuring itself the section keeps moving after it.

### What the migration actually changed, and the one thing it fixed

- **The board is two files on the kit.** `spec.ts` is pure data: the question, the round line, the
  four earlier rounds as history, the context, the verdict with what would change it, the seven asks
  with stable kebab ids and one-token options, the three candidates, the four departures, the
  thirteen sections with their ledes, the three page-wide controls, a six-step walk and three
  builder's notes. `board.tsx` is the evidence per section as a function of the declared state.
  Deleted with the shell: the hand-drawn lead card, the `Chapter`/`Variant` wrapper, the
  thirteen-chapter index in the dock, the `Toggle` cluster, the `CopyPaste` button, `BoardMeta`'s
  prop strings, the `ChapterBody` layout and the board's own `FitStage`. `board.tsx` lost 1,641
  lines and gained 625.
- **Every specimen moved into a real document, and that is the round's one substantive fix.** A
  Stage is a div, so a Tailwind breakpoint prefix inside it reads the BROWSER's width rather than the
  canvas's: inside the 375 stage the hero rendered at 96px and `Container` took the 2rem desktop
  gutter. On a board about colour that is survivable; on the one board whose whole argument is where
  a sentence breaks it is the argument. Round four restored four heading tiers and the gutter by
  hand in `board.css`, keyed to a `data-bv-canvas` attribute, which was a literal copy of a type
  scale the `type-scale` track is actively proposing to change. **Measured now at the phone canvas:
  52 frames, each a 375 viewport, the hero's h1 at 48px and the gutter at 16px, which is what the
  site renders.** The block is deleted and nothing replaces it. (The other half of that old finding,
  the lab's Tailwind entry outranking production's responsive utilities, was cured by the shell's
  sub-layer: a bare `lg:text-8xl` now resolves to 96px on a lab page with nothing restoring it.)
- **`Compare` is used where the board compares two states** (it takes an `a` and a `b` by
  construction) and the three-voice rows carry the same contract in the same words: every usage
  surface states "What separates them here" under it, from `UseCase.distinction`, which is a
  required field. That is round four's ruling made mechanical in the DATA rather than only in the
  component, and it is why no comparison on this board can print the word unchanged: where all three
  voices land on the same string the row prints the REASON, and a row the same in all three WITHOUT
  one is counted as a defect on the board itself (47 of 66 differ, 19 explained, 0 unexplained).

### Light QA, in numbers (a dev server on 3417, a fronted tab, real viewports)

- **At a real 1440 viewport:** 52 frames, every one of them a live document (52 bodies, 52 with the
  parent's stylesheets copied in), **0** still holding a reserved height, **0** scrolling in either
  axis inside the frame (nothing clipped, nothing floating in dead ground), **0** horizontal
  document overflow, **0** of the `[data-mkt-reveal]` slots below opacity 1, dock 89px, board
  48,394px. Every hero measured 1440 -> 96px.
- **At the phone canvas:** the same six zeros, every frame reporting `innerWidth` 375, the hero at
  48px and `Container` at a 16px gutter. **At a real 375 browser window:** 0 document overflow and 0
  body overflow, with each frame's rail scrolling sideways inside itself, which is correct.
- **The copied link reopens the exact state.** `?voice=house&canvas=phone&app=app-dark#brand-voice-guest`
  restores all three switches from the URL and lands the section at 145px, the scroll-padding the
  dock writes, with no double count (the shell's "anchors land once" merged mid-round and this was
  re-measured after it).
- **The walk sets the dock and the review panel composes a real ruling.** Six steps, each setting
  the declared state (step 2 to the phone canvas, step 3 to the app's dark) and scrolling to its
  section. The panel's message, `review brand-voice r5: voice=b "the hero settles it";
  headers=whole; arc=take; note: "the frames make the phone honest"`, was run through
  `pnpm lab:review --root <scratch>` and recorded four rows in a SCRATCH `docs/reviews/`; the repo's
  ledger was never touched (`git status docs/reviews/` clean).
- **`/design/lab` queues all seven asks** under "Waiting on you" with their recommendations, beside
  light's nine and rounding's five.
- **Motion.** The board's only two rules (`[data-bv-swap]` and its keyframes) both resolve inside
  `(prefers-reduced-motion: no-preference)` in the SERVED stylesheet, so under `reduce` there is
  nothing to undo and the settled composition renders. **At rest the board runs 0 animations**, in
  the top document and inside every frame. Arguments, wiring notes, pastes and the history are all
  collapsed on open (18 disclosure buttons, 0 of the board's open).
- ★ **A caution for the next reviewer, and it cost this round half an hour.** Smooth scrolling is
  DISABLED in the automated browser: `scrollIntoView({behavior:"smooth"})` and
  `window.scrollTo({behavior:"smooth"})` both leave `scrollY` at 0, while `behavior:"auto"` scrolls
  correctly. It reads exactly like a broken Walk button. The control that settles it is the light
  pilot, which has no frames at all and fails the same way. Measure a walk with `auto`, or front the
  tab and use your eyes. The same shared browser also backgrounds a tab whenever another session
  fronts one, and a background tab does not run the IntersectionObserver that mounts a frame: a
  probe then reads 0 frames on a board that has 52.

### Findings the Orchestrator must carry

1. **The two kit asks above**, which are the round's real output beyond this board: a measured
   height on `Frame`, and an anchor that survives a board settling.
2. **The desk reads a board's round from its manifest, not from its spec.** `/design/lab` shows
   "The brand voice, round 4" while `spec.round.n` is 5 and the Answer block says "Round 5,
   2026-09-15". Two homes for one number; the spec is the one that a reviewer sees on the board.
3. **Carried from round four, unchanged and still Will's to rule on:** the three app lines that are
   CORRECTIONS rather than rewrites (the wizard's "events never expire" against a product with no
   end date, "hidden from everyone" that the host can still see, and the storage notification that
   names the machinery and then threatens the host with it); the event card's amber chip being a
   component edit where its two neighbours are props; the email subject being one ruling for ten
   templates; the home page's two different counts; and `/pricing` and the home arc saying one
   promise two ways.
4. **The guide lost its asks block.** `docs/specs/brand-voice.md` now points at `spec.ts` as the one
   home for the questions and names an ask by its id, and the sweep steps name their sections by
   anchor rather than by a chapter number a re-cut would move.

### Look at first

- **The first section, at the phone canvas.** Three real 375 documents abreast, one per voice, on
  the real cinema ground. This is the round in one screen: B's extra row on the h1 is visible rather
  than asserted, because those are viewports and not scaled boxes.
- **The answer block.** Seven asks, each answerable in one word, with the board's own answer filled
  and "See it" pointing at the section that argues it. A ruling is now "b, whole, take, yes, keep,
  album, email" and the panel at the foot composes it.
- **The home arc, and the ledger beside it at 375.** Fifteen sections in shipped order in one
  document, with today line by line beside them and the h1's rows measured inside the frame.
- **The pricing pair and the event card.** Both are the shipped markup with the shipped numbers, and
  both now render at the width they ship at inside a document that agrees with them.

## Record (round 5; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-15). The brand-voice board moved onto the kit's
template and became two files: a `spec.ts` carrying the question, the verdict, the seven one-word
calls, the candidates, the departures and the thirteen sections as data, and a `board.tsx` that is
nothing but the evidence for each declared section as a function of the declared state. The
hand-drawn lead card, chapter wrapper, chapter index, toggle cluster, copy button, meta panel and
the board's own FitStage all retired to the kit, and the desk, the walk and the review panel now
read the same list the board renders. The substantive change underneath it was that every specimen
moved off the Stage into a real document: a breakpoint prefix inside a div reads the browser rather
than the canvas, so the 375 stage had been rendering the hero at 96px in a 2rem desktop gutter, and
round four had been restoring four heading tiers by hand in the board's own sheet. Fifty-two frames
now each carry their canvas as a true viewport, the hand-restored ladder is deleted, and the phone
canvas measures what the site renders. Three defects came out of walking it: a font-set read that
took the board to its error boundary on a fast scroll, a reserved height that shrank the board under
the reader, and a hash anchor that could not survive the settle. No candidate, number or
recommendation changed, and no production byte changed.
