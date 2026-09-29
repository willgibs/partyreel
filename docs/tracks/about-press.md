---
track: about-press
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
