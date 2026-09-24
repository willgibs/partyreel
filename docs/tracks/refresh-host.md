---
track: refresh-host
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "75631277"            # the launch-prep SHA the branch was cut from
board: export-flow
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/export-flow/
  - src/app/(dev)/design/sandbox/admin-triage/
  - src/app/(dev)/design/sandbox/host-curation/
  - src/app/(dev)/design/sandbox/host-storage/
  - src/app/(dev)/design/sandbox/event-safety/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(dev)/design/sandbox/gallery-fixtures.ts
---

# lp/refresh-host

**Goal.** The host's and the operator's boards. Each open board refreshed under the new guidance: its strong options kept and improved, bolder directions added, and nothing fenced by an earlier pick or rule.

## The brief

**The refresh.** Design is now guidance and nothing is treated as finished, so every open board gets refreshed. The boards hold good ideas, but many were drawn fenced in by earlier picks and rules. This refresh improves on what each board has. Will runs through the refreshed boards once, the picks are wired, and any surface stays open to later rounds with fresh ideas.

- **Keep and improve.** Keep each board's strong options and make them better. Add bolder directions, so each ask has as many options as it has real directions: a binary ask gains a real third, and a set of variations on one idea gains a genuinely different one.
- **Each ask on its own case.** No earlier pick, rule or other board's answer fences an option: "worn as law", "never re-judged" and "givens" go. A question retired earlier may come back if its premise has since changed. His notes on record are direction; answered asks stay answered.
- **Start from the Library's recipe** (`/design/library`): the brand kit, the ten, production as it is now (open the live surface and look at it at 1440 and 375), the tests that have to keep passing, then a creative shot. The album's grid is being explored on its own board (`album-columns`), so draw the album as production has it.
- **The same shape as before:** one question per decision, in plain words, every option drawn on the real surface.
- **Comments too.** Rewrite your boards' comments the same way: each keeps its reason and drops any authority ("Will ruled", "law").
- **The one listed exception to your owns:** your board's row in `touchpoints.ts`, if what the board asks changed.

**What an audit of your boards saw** (a starting point, not a rule):
- `export-flow` (7: 3,3,2,2,2,3,3; range: four binaries): "a further ruling forbids outright" dropped 5 options; one whole ask deleted. Worth trying: Restore a dropped option or add a real third to each binary.
- `admin-triage` (8: 2,2,2,2,3,2,3,3; range: ruled-row vs one alt): "THE SHELL IS SETTLED LAW HERE, NOT A VARIABLE"; 6 of 8 asks binary. Worth trying: Add a genuine third shape to each binary ask.
- `host-curation` (7x3; range: uniform threes): app-vocabulary etc "cited here and never re-judged". Worth trying: Name and relitigate one old rule.
- `host-storage` (5: 3,2,2,3,3; range: two binaries): pricing/view-menu rulings pre-fence the surface; order & goal binary. Worth trying: Add a genuine third option to "order" and to "goal".
- `event-safety` (13: 4,3,3,3,3,3,3,3,3,2,3,3,3; range: mostly wide): Will's 3 answers are "the walls every option stands inside". Worth trying: Give "newcomer" a real third door, not same-vs-honest.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** Each board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke` whole; `pnpm lab:demo --board <id>` pressing every step, for `export-flow`, `admin-triage`, `host-curation`, `host-storage`, `event-safety`.

## Questions (a recommended answer each; the Orchestrator relays them)

- none: the brief's own audit named the gap on each board (a genuine third per binary, host-curation's relitigation), so no new product ambiguity opened.

## System-doc edits (in place, owned facts only)

- none: every change is inside the five sandbox directories; no `docs/systems/` fact changed.

## Deferred (ROADMAP one-liners, bucket named)

- none: nothing here is product work waiting on a later round.

## Handoff (replaces the chat report)

- Work commit `d1d6b686` ("refresh-host: a genuine third on every flagged binary, and one relitigated door"), pushed to `origin/lp/refresh-host`. No sync commit: `git diff --name-only 75631277 origin/launch-prep` since the cut touches only `touchpoints.ts` (refresh-guest's and kit-streamline's own rows) and never my `owns` or my one `reads` (`gallery-fixtures.ts`), and a merge would not conflict, so PROGRAM.md's sync bar is not met.
- Gates, all on this commit: `pnpm typecheck` clean; `pnpm lint` 0 errors (7 pre-existing warnings, none in files this lane touched); `pnpm test` 4,584 passed, 427 files; `pnpm build` clean (every route, including every `/design/lab/*`). `pnpm lab:smoke --base :3133`: 313 checks, 0 failing, every board's reading under its 1,200-word budget (`admin-triage` 640, `export-flow` 624, `event-safety` 815, the two others under 500). `pnpm lab:demo --base :3133 --board <id>` for all five: 0 failing on every step, including all ten new options; reduced motion honoured (the tool's own default).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` lists exactly the 22 files under the five owned directories, nothing else (`touchpoints.ts` correctly untouched: no board's ASK topics changed, only their options, so the brief's one listed exception never fires).
- The items, one line each:
  - `export-flow`: `stuck`, `hollow`, `cap`, `object` (its four binaries) each gain a real third (`retry`, `offer`, `auto`, `menu`); `stuck`'s recommendation moves to `retry` and `hollow`'s to `offer` (both reasoned in the board's own `because`/`overrule`, both real UI, not text-only).
  - `admin-triage`: `look`, `reason`, `verdict`, `closed`, `phone` (its five true binaries, not six as the audit counted) each gain a real third (`grid`, `marked`, `always`, `window`, `hold`); `reason`'s recommendation moves to `marked` and `closed`'s to `window`. A fourth closed report ("Marlow Christening") was added to `fixtures.ts` so `undo` (24h) and `window` (30-day) pick out different rows; `historyRead`'s caption no longer hardcodes "three".
  - `host-storage`: `order` gains `hybrid` (grouped, worst event first), `goal` gains `toast` (quiet until the goal is hit); both are its only two binaries, per the audit. Recommendations unchanged (`flat`, `live`).
  - `event-safety`: `newcomer` (its one binary) gains `ask` (the honest line plus a way to reach the host), a different function from `same`/`honest`, not a wording variant. His three founding answers (the block, the three closed-door kinds, free on every plan) are kept exactly and only reframed off "the walls every option stands inside" to "the brief's own terms."
  - `host-curation`: already three genuine, non-redundant options on all seven asks (confirmed by rereading each one), so no option was added; the `queue` ask's existing reopen of the 2026-06-22 uniform-grid pick stands, its own authority language (and the app-vocabulary/app-shape citations') reworded to state the reason without "ruled"/"never re-judged"/"by law".
  - Comments swept for the same authority framing across all five directories (`grep -rniE "ruled|ruling|law|never re-judged"` now clean everywhere but one self-descriptive line in host-curation's own `round.changed`, quoting the words it removed).
  - Known, not fixed (out of this board's ask, found while verifying): `event-safety.entry`'s `all` option (three stacked scenes) reads as a "same picture" against `credit` in `lab:demo`'s default capture, because the comparison window does not scroll the `Several` stack far enough to reach the second and third scenes. Pre-existing, not touched by `newcomer`'s change; a `Several`/`short`-scene reach fix would touch `door` and `unlisted` too, which also use it.
- Assets requested from Will: none.
- Board ideas: none beyond this lane's own five boards.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule, one line each: `stuck.retry`, `hollow.offer`, `reason.marked` and `closed.window` are now recommended over the board's earlier pick; each option tile carries its own `overrule` line back to the original if he prefers it.
- Look at first: `export-flow` (the manifest's named board, and the most real UI variety: a quiet retry, an offer-and-retry, an automatic trim, a popover); then `admin-triage.look`'s `grid` (the boldest shape change); the other three read fast.
