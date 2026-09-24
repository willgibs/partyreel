---
track: refresh-reel-cut
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "5b17e8f3"            # the launch-prep SHA the branch was cut from
board: reel-front
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/reel-front/
  - src/app/(dev)/design/sandbox/reel-cut/
  - src/app/(dev)/design/sandbox/reel-story/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(dev)/design/sandbox/gallery-fixtures.ts
---

# lp/refresh-reel-cut

**Goal.** The album's reel tile, the cut and the reel's marketing story: the refresh gates the reel round's wiring, so it goes first. Each open board refreshed under the new guidance: its strong options kept and improved, bolder directions added, and nothing fenced by an earlier pick or rule.

## The brief

**The refresh.** Design is now guidance and nothing is treated as finished, so every open board gets refreshed. The boards hold good ideas, but many were drawn fenced in by earlier picks and rules. This refresh improves on what each board has. Will runs through the refreshed boards once, the picks are wired, and any surface stays open to later rounds with fresh ideas.

- **Keep and improve.** Keep each board's strong options and make them better. Add bolder directions, so each ask has as many options as it has real directions: a binary ask gains a real third, and a set of variations on one idea gains a genuinely different one.
- **Each ask on its own case.** No earlier pick, rule or other board's answer fences an option: "worn as law", "never re-judged" and "givens" go. A question retired earlier may come back if its premise has since changed. His notes on record are direction; answered asks stay answered.
- **Start from the Library's recipe** (`/design/library`): the brand kit, the ten, production as it is now (open the live surface and look at it at 1440 and 375), the tests that have to keep passing, then a creative shot. The album's grid is being explored on its own board (`album-columns`), so draw the album as production has it.
- **The same shape as before:** one question per decision, in plain words, every option drawn on the real surface.
- **Comments too.** Rewrite your boards' comments the same way: each keeps its reason and drops any authority ("Will ruled", "law").
- **The one listed exception to your owns:** your board's row in `touchpoints.ts`, if what the board asks changed.

**What an audit of your boards saw** (a starting point, not a rule):
- `reel-front` (2: 4,3; range: near-duplicate treatments): "Every option below is a variation ON the crossfade, never a re-litigation". Worth trying: Let one "signature" option challenge the crossfade mechanism itself.
- `reel-cut` (9x3; range: one mechanism, fenced scope): "no music, no end card, no timeline... All ruled". Worth trying: Reopen one ruled-out axis (music, editing) as a real ask.
- `reel-story` (7: 3,3,4,4,4,3,4; range: varied, rule-anchored): teaser pick leans on "reel-front, ruled" not its own case. Worth trying: Judge the teaser's motion on its own case, not reel-front's.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** Each board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke` whole; `pnpm lab:demo --board <id>` pressing every step, for `reel-front`, `reel-cut`, `reel-story`.

## Questions (a recommended answer each; the Orchestrator relays them)

- none: nothing here rose to a one-way door before building; the judgment calls are in the Handoff's "Calls his to overrule"

## System-doc edits (in place, owned facts only)

- none: a lab-only round, nothing wired to production, so no systems fact changed

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- Work commit `d7d5aed6` (`lp/refresh-reel-cut`), pushed. No sync commit: `origin/launch-prep` moved to `2e5bce41`
  while this lane ran (kit-streamline's merge and a guest-capture/voice-guest lane's records), but
  `git diff --name-only 75631277 origin/launch-prep` touches none of this lane's `owns` or `reads`, and
  `git merge-tree --write-tree HEAD origin/launch-prep` reports no conflicts — a sync would only bring unrelated
  records, which PROGRAM.md says costs a full gate for nothing.
- Gates, all green on the tree at `d7d5aed6`: `pnpm typecheck` (0 errors), `pnpm lint` (0 errors; 7 pre-existing
  warnings, none in a file this lane touched), `pnpm test` (4584/4584, including `registry.test.ts`'s per-board
  string-length caps), `zsh scripts/build-lock.sh pnpm build` (exit 0), `pnpm lab:smoke --base :3132` (314 checks, 0
  failing), `pnpm lab:demo --board <id> --base :3132` for all three boards (reel-front 2 steps, reel-cut 10 steps,
  reel-story 7 steps, all 0 failing; lab-demo's default capture already runs under `prefers-reduced-motion: reduce`).
  Each board also checked by eye in the browser at 1440 and 375 (the new options rendering, the carried `mute` call
  showing, the touchpoints header line).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the three owned dirs' files
  (`reel-front/{board,fixtures,parts,spec}.tsx|ts|css`, `reel-cut/{board,parts,room,spec}.tsx|ts`,
  `reel-story/{board,spec,surfaces}.tsx|ts` and the two `.css` files) + `touchpoints.ts` (the one listed exception,
  reel-cut's row only, for its new ask) + this manifest.
- The items:
  - `reel-front.signature` gains a fifth option, `hardcut` (no dissolve at all, the stills jump-cut instead of
    fading): the one option that varies the crossfade's own mechanism rather than dressing it, now the
    recommendation over `graded`.
  - `reel-front.badge` gains a fourth option, `duration` (a camera-roll-style "0:08" mark); `none` stays recommended.
  - `reel-cut` gains a new ask, `sound` ("Should a cut ever carry sound, and if so, whose?"): `silent` / `native`
    (a video moment's own captured audio) / `bed` (one ambient track); `native` recommended, since it is the
    guest's own recording and licenses nothing. A carried call, `mute`, on whether every option needs its own mute
    control (taken: only `native`'s).
  - `reel-story.teaser` keeps `crossfade` recommended, reasoning rewritten around bible 8 (one system) and the
    section's own cost, not reel-front's pick.
  - `reel-story.help` keeps `highlight-reel` recommended, reasoning rewritten around the guest's own path from the
    tile to a help article, not reel-front's pick.
  - Every "ruled" / "the given" / "DECIDED, NOT ASKED" citation in these three boards' own comments (`spec.ts`,
    `board.tsx`, `parts.tsx`, `room.tsx`, `surfaces.tsx`, the two `.css` files) rewritten to state the fact plainly.
- Assets requested from Will: none — every option reuses the fourteen marketing images already in the fixtures
  (bible 9), nothing new to shoot.
- Board ideas:
  - The live reel itself (not only a personal cut) could reopen the same question `reel-cut.sound` raises: a video
    moment's captured audio is silent on the wall and the album tile too, and a venue screen's own tradeoffs
    (ambient noise, a browser's autoplay-mute policy) differ from a guest's own phone. `reel-view` or `reel-screen`
    is the board to carry it, not this one.
  - `reel-cut.finish` has a real bolder direction this pass did not draw: one adaptive door (Share where the
    browser can hand off a file, Save where it cannot) instead of always showing both. Dropped here for scope.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule:
  - Reopened `sound` rather than `editing` for reel-cut's one axis (the audit named both as candidates): sound is
    free (the guest's own recording, no licence), where a timeline/per-clip edit is a bigger, costlier feature. If
    editing is the one he actually wants back, this pass drew the other one.
  - Changed reel-front `signature`'s own recommendation from `graded` to the new `hardcut`: a real product opinion
    (a jump cut over a dissolve-plus-wash), not only an added option.
  - Left `entry`, `room`, `looks`, `moments`, `blocked`, `wait` and `finish` on reel-cut at their existing option
    counts (only rewording "ruled" language): judged each a real, already-distinct 3-way split, and the audit's own
    callout was the missing sound axis, not these individual asks.
- Look at first: `reel-front`'s `signature` ask — its recommendation changed (`graded` to `hardcut`), and it is the
  board most directly answering his own note ("I'd love to see other design ideas for this differentiation").
