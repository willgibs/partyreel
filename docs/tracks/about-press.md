---
track: about-press
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "cba704dd"            # the launch-prep SHA the branch was cut from
board: about-press
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/about-press/
  - src/app/(dev)/design/sandbox/press-page/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/press-page.json
  - docs/systems/marketing-content.md
  - src/app/(marketing)/(cinema)/about/page.tsx
---

# lp/about-press

**Goal.** Explore folding the press kit into /about (with or without its four facts, as a usage note or none) or dropping it, on the real About page, replacing the press-page board.

## The brief

**His press-page r1 answers** (`docs/reviews/press-page.json`, 2026-09-29): press doesn't deserve its own page right now. Fold the press kit into /about cleanly and remove /press after; if it can't be worked in, remove the kit for now too. The future partners page deserves its own focus, never shared with Press. The boilerplate goes: he won't reach out to press (partners, free passes for couples, social ads, an always-current llms.txt, the blog and SEO carry the outreach). Whether the four facts help About, or go too, is open: he asked.

**The round:** a new board, `about-press`, that replaces `press-page` (retire that board's folder in-lane once yours stands, `git rm -r` in its own commit; its ledger stays for the Orchestrator). Draw /about with the press kit folded in, a few ways (with and without a four-fact strip; the kit's sheet as a short usage note, or none), and /about with no kit at all, each on the real /about at 1440 and 375 from production's components fed fixtures. Ask only what branches the work: where the kit sits in About and in what form, and whether the facts earn a place. press-page's open `a-human` ask is reshaped into this round, or retired if the fold answers it (an open ask whose road no longer beats the current path goes). The wiring after his pick redirects /press to /about and keeps the nav, footer, sitemap and llms files current; that is not this round.

Take `desk: 95` (a marketing board, at the foot: app work first).

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/about-press/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `about-press`, its title, `surface`, `desk: 95` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- **press-page's `a-human`: reshaped or retired?** Retired: the fold answers it (the kit's one door is /contact's
  "Press & partnerships" topic, About's "we" names nobody, no press outreach is planned). Built as the board's carried
  call `named` (no one named beside the kit), so he sees it and can overrule; `the-close` and `the-arc` go with it.
- **Is the usage line asked again now the kit moves?** No: his usage-note pick rides every kit that stays, one wording
  ("Use the marks as provided: no recoloring, no stretching."), in the kit's lead (the whole sheet already ends on
  PressSheet's own footnote, so a second footnote under it would stack). Settled in the board's opening.
- **Where do four facts sit with no kit to hold them?** After the six convictions, before the close, under an "At a
  glance" eyebrow in the ledger's measure; inside the kit when one stays. Built.
- **Which four facts?** Founded, How it works, Guests need, Pricing, read from `PRESS_FACTS` by label (the array
  /llms-full.txt is built from). Carried call `four`.
- **For the wiring: the /press redirect, permanent or temporary?** Temporary (307) while press is "not right now": a
  308 is cached by browsers for good, so a /press page that returns would keep sending early visitors to /about. To
  `/about#press` when a kit stays (every kit drawing carries `id="press"`), else `/about`. Not built (the wiring).
- **For the wiring: the boilerplate in the llms files.** It leaves every human page, but /llms.txt keeps its summary
  paragraph (today `PRESS_BOILERPLATE`), moved out of press.ts to the llms builder's own home, since he wants the llms
  files "always available and current"; `PRESS_FACTS` keeps feeding /llms-full.txt whatever `facts` picks. Not built.
- **For the wiring, if `none` wins: the kit's files.** public/press/, the zip, `build-press-kit.mjs`,
  `build-press-qr.mjs`, `PRESS_KIT` and press-kit.test.ts retire with /press (git keeps them, reversible); the fact
  sheet and the llms builders stay. Not built.

## System-doc edits (in place, owned facts only)

- none (an exploration ships no production byte; the facts it changes land with the wiring)

## Deferred (ROADMAP one-liners, bucket named)

- none (the wiring after his pick is the pickup's own next step; its three open calls are under Questions)

## Handoff (replaces the chat report)

- **Commits, pushed:** `1f5950fd` the board; `b957df84` the kit ask's why and reason as measured; `2723da34` press-page
  retires (a folder deletion, its own commit; `docs/reviews/press-page.json` stays). No sync: launch-prep moved
  (unfence at `ab61c350`, records) but touched none of this lane's reads or owns, and `git merge-tree HEAD
  origin/launch-prep` merges clean.
- **Gates on `2723da34`**, each its own exit 0 (logs in `../_scratch/about-press/g-*.log`): typecheck; lint; test (615
  files, 7,221 tests); build (263 pages); `lab:smoke --base http://localhost:3135` (18 checks, 0 failing; about-press
  498 words of 1,200); `lab:demo --board about-press --base http://localhost:3135` (kit ok, 4 options by 2 frames,
  the stage moves up to 45.05%; facts ok, 2 by 2, up to 39.27%).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = `sandbox/about-press/` (5 files),
  `sandbox/press-page/` (10 deletions, owned) and this file. No exceptions.
- **`kit`** (desk 95): how the press kit lives on /about: its own chapter with the whole sheet, a short muted band
  before the close (recommended), one line in the close, or none (today). Each option is the whole page from
  production's pieces (`about.tsx` quotes about/page.tsx's composition verbatim, header and footer inert) at 1440 and
  375, each frame opened where the answer changes, its caption read off the frame.
- **`facts`**, staged after `kit` and drawn in its world: four facts in a strip (inside the kit, else after the
  convictions) or none (recommended).
- **Measured, 1440 / 375** (the captions): the page runs 4,801 / 5,214 px today; 5,846 / 6,645 with the whole sheet
  (the chapter 1,045 / 1,430 tall, the story 1,011 / 773); 5,162 / 5,654 with the band (361 / 440 tall); 4,910 /
  5,363 with the line; four facts on their own add 281 / 353.
- **The drawings are the same in either lab theme**: the band's 1440 frame captured under the lab's light and dark
  themes is byte-identical (`../_scratch/about-press/light-bandf-0.png`, `dark-bandf-0.png`).
- **Records for the Orchestrator:** ROADMAP's line "The lab: `press-page`'s preview frames run short..." retires with
  the board; STATUS.md and the pickup's "press-page's `a-human` (the About round)" now read as answered by this
  round's carried call `named`. ROADMAP's `CONTACT_TOPICS.press.hint` line stays for the wiring.
- Assets requested from Will: none (every mark is the Aperture stand-in until ASSETS row 19, already requested).
- **Board ideas:** the lab's step in a hand: `lab:demo --width 375` fails reach on every standing board (event-ready
  0.85 to 1.12 of a screen, locked-door 0.98 to 1.33, about-press 0.92 to 0.94), because the required context layer
  stacks between the question and the stage on a phone; the step at `<sm` could fold the layer under the question or
  open on the stage (`../_scratch/about-press/cmp-demo-375.log`).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- **Calls his to overrule:** the band over the whole sheet, the line and none; no facts; `a-human` retired as the
  carried call `named`; the four facts (`four`); the usage line settled on every kit, in its lead; the whole sheet a
  step wider (`max-w-5xl`) than About's ledger (`max-w-4xl`) so PressSheet's captions read whole (at 4xl they cut to
  "Mark, dark c..."); the band's four plates show the share card, not the app icon (at plate size the icon is the dark
  chip again); the download is /press's own "Download all" link, never a third button near the close's and the
  footer's; for the wiring, a temporary redirect to `/about#press` and the llms summary kept (Questions).
- **Look at first:** `/design/lab/about-press?key=fiesta&session=about-press.kit` (the band, then flip to the whole
  sheet and to none), then `?session=about-press.facts` after a kit answer.
