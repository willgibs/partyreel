---
track: press-page
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "e442fc55"         # the launch-prep SHA the branch was cut from
board: press-page       # round one: what Partyreel hands the world about itself
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/press-page/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/marketing-content.md
  - docs/ASSETS.md
  - docs/PRD.md
  - src/app/(marketing)/(cinema)/press/page.tsx
  - src/components/marketing/press/press-section.tsx
  - src/components/marketing/press/press-sheet.tsx
  - src/components/marketing/press/copy-button.tsx
  - src/lib/constants/press.ts
  - src/lib/constants/site.ts
  - src/lib/constants/marketing-nav.ts
  - src/lib/brand/wordmark.ts
  - src/components/shared/logo.tsx
  - src/lib/content/llms.ts
  - scripts/build-press-kit.mjs
  - src/components/marketing/system/page-hero.tsx
  - src/components/marketing/system/paper-chapter.tsx
  - src/app/(marketing)/(paper)/contact/page.tsx
---

# lp/press-page

**Goal.** Round one of `press-page`: WHAT PARTYREEL HANDS THE WORLD ABOUT ITSELF, reconceived from the ground up.
Will (2026-09-19, `docs/design/rulings.md`, "stack the lab"): "/press" is one of the surfaces he named,
"absolutely everything is up for relitigation or reconcepting from the ground up"; a board that keeps nothing is
deleted at no cost. Five to seven decisions with `defineExploration`, each drawn on the REAL page pieces
(`PageHero`, `PressSection`, `PressSheet`, the copy buttons, the fact rows, the close) with fixtures (a reporter on
a deadline, a venue or planner weighing a partnership, a copy desk checking a fact), at 1440 and 375, a
recommendation each, every number measured; a page of paragraphs is not assumed. **Not in this round:** any
production byte; the kit's files under `public/press/` and the build script (the marks are placeholders until the
v1 icon lands, ASSETS row 19; an option that wants a new file names it as an ask); the killed sitewide "media kit"
(an unrelated project that shares the word).

**What is measured (the tree at the cut).** A cinema hero pulled under the nav ("Media assets", "Press.", "The
boilerplate, the fact sheet, and the brand files, ready to quote and ready to publish...", "Download kit" with a
live byte size, "Contact"), then one paper chapter holding three sections, each a sticky 13rem heading beside a
1fr column (stacking below `lg`): the ASSETS sheet (eight numbered plates, two columns to four with 3 px gaps,
a hard 480 ms cut per frame staggered 120 ms, siblings dimming to 0.5 on hover: the mark in dark, light and mono,
the app icon, the share card, a QR that resolves to partyreel.com, the ink hex, the face), the WORDS (a
boilerplate paragraph and a one-liner, each behind a copy button with a "Copied" receipt, and two quick hits:
"Quote it freely" and "Write the name this way"), the FACT SHEET (twelve rows at `1fr/1.9fr`, two linked, the
prices derived live from `tiers.ts`), and a centred close ("Need anything else?", a `mailto:`). The whole kit is
also a committed zip, CRC-pinned by `press-kit.test.ts`; `press.ts` feeds `llms.txt` too. Will's ruling of
2026-08-28 on the retired `press-identity` board: "the contact sheet: press around the assets and quick hit
points; the logo usage guidelines cut from the page entirely." The marks on the sheet are still the retired
Aperture glyph, not the live v1 wordmark (`build-press-kit.mjs`: "the logo changes before launch"); "Availability:
Live now" is written on a branch named `launch-prep`; the ROADMAP promises "/press grows into the partnerships
kit" and nothing on the page addresses a venue (`/contact` folds "Press & partnerships" into one topic); no
spokesperson is named anywhere (the sitewide zero-team rule). Five seams are listed in the Orchestrator's map
(`docs/tracks/orchestrator.md`, "The app round's map", the press paragraph); read them. The behaviour pins:
`press-kit.test.ts` (every kit file's CRC, the QR regenerated, the facts source-pinned to `site.ts`),
`content-policy.test.ts` (`press.ts` fenced as a claims source), `marketing-nav.test.ts` (Press in the header
panel and the footer column), `page-hero-contract.test.ts`, `type-ladder-policy.test.ts` (the sheet's one
"depicted" exception counted exactly); they guard function, the look is open.

**The decisions (suggested; yours to recut, never forced apart).** WHO IT IS FOR (one page for everyone, as today;
press and partners as two doors with their own contact and promise; the press page folded into an about page with
the kit as its foot); THE SHEET (what the asset sheet shows: eight plates as today; the live wordmark and the icon
only, the placeholders pulled until v1 lands; "the brand in use", the product's own screens beside the marks);
THE WORDS (how the words are handed over: paragraphs behind copy buttons; a set of three lengths, a sentence, a
paragraph and a page, each copyable; a written voice, the founder's line under a name); A HUMAN (whether anyone
is named: a role address only, as today; one named press contact and no biography; a founder card, the sitewide
rule reopened); THE FACTS (the checkable version: rendered rows only; rows plus a stable machine-readable URL,
since `press.ts` already feeds `llms.txt`; the fact sheet as the page's opening, the assets beneath); THE ARC (how
the page reads top to bottom: masthead, assets, words, facts, close; facts and words first, assets last; one
screen, everything on a single sheet at 1440). Optional if it fits the budget: THE CLOSE (a `mailto:` as today;
the contact page's door with the topic prefilled; a form inline). The `loose-ends` board is the worked example
for a board on marketing pieces; `guest-shape` for fixtures and measured captions; copy their approach, import
nothing from another board's directory.

**Binds.** The bible; bible 18 (every frame is ours: no stock event photographs on the sheet); the zero-team rule
and the no-image-rights-tracking ruling (an image we use is one we hold the rights to, never marked as AI); the
press-identity ruling of 2026-08-28 is precedent the goal reopens by name; the kit's CRC test means a changed
file is a wiring-round act with the build script, never a board's; "Live now" pre-launch is a finding for
Questions whichever option wins; no em-dashes; the copy is open (bible 21). Mobbin is encouraged, never required:
press pages, brand and media kits, about pages, fact sheets.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8
  known warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3135`,
  `pnpm lab:demo --board press-page` (0 failing), with `DESIGN_PREVIEW_KEY` in the environment, never on a command line.
- Every option at 1440 and 375 on the real pieces with fixtures; a capture of every option beside its words, the
  picture checked against the words; the reading budget.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- **"Live now" pre-launch.** `PRESS_FACTS`'s Availability row reads "Live now. Any browser, and the free plan needs
  no card," unchanged by any option here, on a branch (`launch-prep`) that ships to a domain with zero real users
  and Stripe in TEST mode. Recommended: leave it. The product genuinely answers real traffic at partyreel.com
  today, and "Live now" is a fact about the PRODUCT's availability (you can use it right now), never a claim about
  revenue or user count, so it reads true whichever way `who-for` and the rest land. If Will disagrees, the fix is
  a one-line edit to `press.ts`, not a board decision.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head `94d57b48`, pushed; synced with launch-prep at `f2cfa26f` (three docs-only commits: the admin cutover
  record, the pricing-page cut, the upload-act tracking; no code, no registration-file conflicts)
- Gates on the synced tree: typecheck ok; lint ok (8 known warnings, 0 new); test ok (2517); build ok (254 pages);
  `pnpm lab:smoke --base http://localhost:3135` ok (297 checks, 0 failing; press-page reads at 394/1200 words);
  `pnpm lab:demo --board press-page --base http://localhost:3135` ok (7 steps, 0 failing, every option moves the
  stage by up to 100%)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the ten files under
  `src/app/(dev)/design/sandbox/press-page/` + the registration exceptions
  (`src/app/(dev)/design/sandbox/registry.ts`, `src/app/(dev)/design/(shell)/lab/boards.ts`,
  `src/app/(dev)/design/touchpoints.ts`) + `docs/design/library.md` (regenerated by `pnpm design:rules`, committed
  as written) + this file
- The decisions, one line each:
  - `who-for`: Who should /press be built for?; one page as today / press and partners as two doors / folded into
    About; **recommends one page** (a partnerships promise does not exist yet to put behind its own door)
  - `the-sheet`: What should the asset sheet show?; eight plates as today / the marks alone / the brand in use;
    **recommends eight plates** (the placeholder marks are a delivery gap, ASSETS row 19, not a design one)
  - `the-words`: How should the words be handed over?; a paragraph and a line as today / three lengths / a written
    voice, attributed; **recommends a paragraph and a line** (a signed line reopens the zero-team rule for a page
    that reads fine without a face)
  - `the-facts`: How checkable should the fact sheet be?; rendered rows only as today / rows plus a linked copy
    for a script / a stat strip in the masthead; **recommends rows plus a linked copy** (the machine-readable file
    already exists, fed by this same array, so pointing at it costs one link)
  - `a-human`: Should anyone be named on the page?; a role address only as today / one named press contact / a
    founder card; **recommends a role address only** (the zero-team rule holds sitewide with one relaxation
    already spent on /about)
  - `the-close` (waits on `a-human`): How should the page close?; a plain link to /contact as today / the same
    door with Press pre-picked / a short form inline; **recommends the same door, Press pre-picked** (the Press
    topic chip already exists on /contact, unused by either door)
  - `the-arc` (waits on `who-for` landing on one page): How should the page read, top to bottom?; masthead,
    assets, words, facts, close as today / facts and words first, assets last / one sheet, no scroll, at 1440;
    **recommends today's order** (the sheet is what every reader meets in five seconds; a reporter on a deadline
    still reaches the facts inside one scroll)
- Assets requested from Will: none (the v1 icon, ASSETS row 19, is already requested by an earlier round; this
  round's `the-sheet` decision assumes it lands before any option here ships)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: `who-for` (it frames the other six) and `the-close` (open it after picking `a-human`, since its
  copy swaps "Send a message" for a name live, reading the board's own state, the way a decision staged behind
  another should)

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). Round one of `press-page` built seven decisions with
`defineExploration`, every option drawn on the real `PageHero`, `PressSection`, `PressSheet` and copy buttons at
1440 and 375: who `/press` is for, what the asset sheet shows, how the words hand over, how checkable the fact
sheet is, whether anyone is named, how the page closes, and how the page reads top to bottom. `the-close` waited
on `a-human` and read its live answer off the board's own state (the close's copy names whoever `a-human` names);
`the-arc` waited on `who-for` landing on one page. Recommendations held the shipped shape everywhere it already
earned its keep (the eight-plate sheet, the two-length words, the unnamed role address, today's reading order) and
picked two small real additions where one existed to reach for: a link from the fact sheet to the already-shipped
`llms-full.txt` table, and pre-picking `/contact`'s existing Press chip on the close. A "Live now" pre-launch fact
was carried to Questions rather than silently changed. Gate green throughout (2517 tests, 254 pages, `lab:smoke`
and `lab:demo` both clean); no production byte moved.
