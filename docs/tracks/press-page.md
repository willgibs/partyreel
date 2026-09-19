---
track: press-page
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board press-page` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The decisions, one line each: `<id>: the question; the options; the recommendation`
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
