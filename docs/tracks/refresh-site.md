---
track: refresh-site
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "5b17e8f3"            # the launch-prep SHA the branch was cut from
board: site-chrome
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/site-chrome/
  - src/app/(dev)/design/sandbox/privacy-hero/
  - src/app/(dev)/design/sandbox/profile-page/
  - src/app/(dev)/design/sandbox/album-motion/
  - src/app/(dev)/design/sandbox/loose-ends/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(dev)/design/sandbox/gallery-fixtures.ts
---

# lp/refresh-site

**Goal.** The site's chrome, the privacy hero, the profile page, the album's motion and the loose ends. Each open board refreshed under the new guidance: its strong options kept and improved, bolder directions added, and nothing fenced by an earlier pick or rule.

## The brief

**The refresh.** Design is now guidance and nothing is treated as finished, so every open board gets refreshed. The boards hold good ideas, but many were drawn fenced in by earlier picks and rules. This refresh improves on what each board has. Will runs through the refreshed boards once, the picks are wired, and any surface stays open to later rounds with fresh ideas.

- **Keep and improve.** Keep each board's strong options and make them better. Add bolder directions, so each ask has as many options as it has real directions: a binary ask gains a real third, and a set of variations on one idea gains a genuinely different one.
- **Each ask on its own case.** No earlier pick, rule or other board's answer fences an option: "worn as law", "never re-judged" and "givens" go. A question retired earlier may come back if its premise has since changed. His notes on record are direction; answered asks stay answered.
- **Start from the Library's recipe** (`/design/library`): the brand kit, the ten, production as it is now (open the live surface and look at it at 1440 and 375), the tests that have to keep passing, then a creative shot. The album's grid is being explored on its own board (`album-columns`), so draw the album as production has it.
- **The same shape as before:** one question per decision, in plain words, every option drawn on the real surface.
- **Comments too.** Rewrite your boards' comments the same way: each keeps its reason and drops any authority ("Will ruled", "law").
- **The one listed exception to your owns:** your board's row in `touchpoints.ts`, if what the board asks changed.

**What an audit of your boards saw** (a starting point, not a rule):
- `site-chrome` (3: 4,2,3; range: one binary): first-event r1 makes one foot-phone option "the weakest of the three". Worth trying: Judge foot-phone fresh, not pre-weighted by an unrelated ruling.
- `privacy-hero` (1: 4; range: near-duplicate pair): access & sweep are "the same" 8-tile circuit, differing only fade-vs-sweep. Worth trying: Merge access/sweep and draw a real fourth concept instead.
- `profile-page` (3: 4,3,3; range: real variety): round 1's 8 asks retired outright; round 2 pre-shaped by 3 rulings. Worth trying: Revisit a retired round-1 question now other boards have shipped.
- `album-motion` (1: 3; range: one mechanism, 3 params): ruling flips the pick but "no option was added". Worth trying: Draw a 4th option built for the fade rule, not just rescore.
- `loose-ends` (7: 4,4,3,3,3,3,3; range: workable): "Hover is ruled a desk verb"; faq-look leans on pricing-page's order. Worth trying: Judge faq-look on its own page, not pricing-page's precedent.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** Each board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke` whole; `pnpm lab:demo --board <id>` pressing every step, for `site-chrome`, `privacy-hero`, `profile-page`, `album-motion`, `loose-ends`.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
