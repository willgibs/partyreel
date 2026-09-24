---
track: refresh-pages
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "ce9c13df"            # the launch-prep SHA the branch was cut from
board: help-center
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/help-center/
  - src/app/(dev)/design/sandbox/emails/
  - src/app/(dev)/design/sandbox/contact-page/
  - src/app/(dev)/design/sandbox/press-page/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(dev)/design/sandbox/gallery-fixtures.ts
---

# lp/refresh-pages

**Goal.** The help center, the emails, the contact page and the press page. Each open board refreshed under the new guidance: its strong options kept and improved, bolder directions added, and nothing fenced by an earlier pick or rule.

## The brief

**The refresh.** Design is now guidance and nothing is treated as finished, so every open board gets refreshed. The boards hold good ideas, but many were drawn fenced in by earlier picks and rules. This refresh improves on what each board has. Will runs through the refreshed boards once, the picks are wired, and any surface stays open to later rounds with fresh ideas.

- **Keep and improve.** Keep each board's strong options and make them better. Add bolder directions, so each ask has as many options as it has real directions: a binary ask gains a real third, and a set of variations on one idea gains a genuinely different one.
- **Each ask on its own case.** No earlier pick, rule or other board's answer fences an option: "worn as law", "never re-judged" and "givens" go. A question retired earlier may come back if its premise has since changed. His notes on record are direction; answered asks stay answered.
- **Start from the Library's recipe** (`/design/library`): the brand kit, the ten, production as it is now (open the live surface and look at it at 1440 and 375), the tests that have to keep passing, then a creative shot. The album's grid is being explored on its own board (`album-columns`), so draw the album as production has it.
- **The same shape as before:** one question per decision, in plain words, every option drawn on the real surface.
- **Comments too.** Rewrite your boards' comments the same way: each keeps its reason and drops any authority ("Will ruled", "law").
- **The one listed exception to your owns:** your board's row in `touchpoints.ts`, if what the board asks changed.

**What an audit of your boards saw** (a starting point, not a rule):
- `help-center` (7x3; range: real variety): "hub"/"feedback" picks lean on app-pricing/admin rulings, not help's own traffic. Worth trying: Re-judge "hub" against help's own needs, not others' rulings.
- `emails` (8: 3,4,3,3,2,3,3,3; range: mostly real): chained citations of app-door/app-vocabulary rulings; "code" ask binary. Worth trying: Give the mail button's wording a genuine third option.
- `contact-page` (6x3; range: real variety): receipt ask admits "a fourth option this board does not draw yet". Worth trying: Draw the fourth receipt option the board admits is missing.
- `press-page` (7x3; range: real variety): brand-guidelines content "cut... by the 2026-08-28 ruling and not reopened here". Worth trying: Reconsider whether brand-guidelines deserves a fresh look now.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** Each board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke` whole; `pnpm lab:demo --board <id>` pressing every step, for `help-center`, `emails`, `contact-page`, `press-page`.

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
