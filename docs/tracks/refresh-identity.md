---
track: refresh-identity
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "516c6bb2"            # the launch-prep SHA the branch was cut from
board: identity-door
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/identity-door/
  - src/app/(dev)/design/sandbox/identity-claims/
  - src/app/(dev)/design/sandbox/identity-profile/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(dev)/design/sandbox/gallery-fixtures.ts
---

# lp/refresh-identity

**Goal.** The guest's identity: the door, claims and the profile. Each open board refreshed under the new guidance: its strong options kept and improved, bolder directions added, and nothing fenced by an earlier pick or rule.

## The brief

**The refresh.** Design is now guidance and nothing is treated as finished, so every open board gets refreshed. The boards hold good ideas, but many were drawn fenced in by earlier picks and rules. This refresh improves on what each board has. Will runs through the refreshed boards once, the picks are wired, and any surface stays open to later rounds with fresh ideas.

- **Keep and improve.** Keep each board's strong options and make them better. Add bolder directions, so each ask has as many options as it has real directions: a binary ask gains a real third, and a set of variations on one idea gains a genuinely different one.
- **Each ask on its own case.** No earlier pick, rule or other board's answer fences an option: "worn as law", "never re-judged" and "givens" go. A question retired earlier may come back if its premise has since changed. His notes on record are direction; answered asks stay answered.
- **Start from the Library's recipe** (`/design/library`): the brand kit, the ten, production as it is now (open the live surface and look at it at 1440 and 375), the tests that have to keep passing, then a creative shot. The album's grid is being explored on its own board (`album-columns`), so draw the album as production has it.
- **The same shape as before:** one question per decision, in plain words, every option drawn on the real surface.
- **Comments too.** Rewrite your boards' comments the same way: each keeps its reason and drops any authority ("Will ruled", "law").
- **The one listed exception to your owns:** your board's row in `touchpoints.ts`, if what the board asks changed.

**What an audit of your boards saw** (a starting point, not a rule):
- `identity-door` (5x3; range: real variety): door-steps's "shipped shape... worn here as law, not reopened". Worth trying: Ask whether the 5-step door order itself still deserves law.
- `identity-claims` (5x3; range: surface-only): "the model itself is ruled... every option here changes only what a screen says". Worth trying: Let one option touch the claim model, not only the screen.
- `identity-profile` (4x3; range: real variety): "every event off by default" is "this board's floor". Worth trying: Test the default-off floor itself, not just its display.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** Each board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke` whole; `pnpm lab:demo --board <id>` pressing every step, for `identity-door`, `identity-claims`, `identity-profile`.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Work commit `d1c5b055` (the three boards refreshed); sync commit `4f9704e2` (merge of `origin/launch-prep`, which
  had moved with `refresh-guest`'s landing: voice-guest, guest-capture and media-viewer, and a `touchpoints.ts` edit
  that auto-merged clean, no conflict, against my two rows). Both pushed: `lp/refresh-identity` is at `4f9704e2`.
- Gates on the synced tree: `pnpm typecheck` exit 0, `pnpm lint` exit 0 (0 errors, 7 warnings, all pre-existing in
  files this lane never touched), `pnpm test` exit 0 (427 files, 4584 tests), `pnpm build` exit 0.
- `pnpm lab:smoke --base http://localhost:3138`: 315 checks, 0 failing. `pnpm lab:demo --base http://localhost:3138
  --board <id>`: identity-door 6/6 steps ok, identity-claims 5/5 steps ok (`pass` now carries 4 options), identity-
  profile 5/5 steps ok (`default` is a new fifth ask); every step's stage moves, none frozen.
- Every new option walked by hand in the browser too, at 375 and 1440 (identity-door's `walk` in both the sheet and
  the side-panel posture). One live bug found and fixed this way: identity-profile's `default` measure read
  `[data-checked]`, which is only a Tailwind custom variant name, never a real attribute; Radix's Switch actually
  sets `data-state="checked"`, so the `on` option's count read "0 of 3" until the selector was fixed.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the three owned board directories, `touchpoints.ts`
  (the listed exception: both boards' rows widened for a new question) and this manifest. Nothing else.
- The items:
  - `identity-door`: a sixth question, `walk`, asks whether the welcome deserves its own screen before the name
    step at all (`door-steps`'s own order, previously "worn as law, not reopened"). Recommends folding it into the
    name step's own screen on a first visit only; a returning device is untouched either way. The other five asks
    keep their range; comments reworded (the gate no longer calls its own copy "the ruled line").
  - `identity-claims`: `pass` widens from three options to four; the fourth decides by photograph instead of by
    event, the one option that touches the claim model rather than only the screen (today's RPCs,
    `claim_guest_rows_by_email` and `disown_guest_rows_by_email`, group by event only, by design; a real build of
    this option needs a photograph's own id, not only an event's). The recommendation stays `rows`.
  - `identity-profile`: a fifth question, `default`, tests "every event off by default" directly instead of holding
    it as the board's own floor: off (as shipped), asked once and applied to all, or on by default. The
    recommendation stays off, because `profiles-social.md` names `profile_shown_events`'s opt-in a one-way door
    that `/privacy` and the Terms word too; the option to flip it is drawn for him, not ruled out beforehand.
  - Every board's own comments reworded to drop "Will ruled", "verbatim", "law", "DECIDED ALREADY" framing while
    keeping the reason underneath. A few purely mechanical uses of "ruling" survive (e.g. "a board's directory is
    deleted the moment its ruling lands"): that names `PROGRAM.md`'s own lifecycle, not a fenced design call.
- Assets requested from Will: none (every still is the existing twelve marketing images, bible 9).
- Board ideas: none beyond this lane.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. (If `identity-claims`'s `pass=photos` is
  picked, its wiring round would need `claim_guest_rows_by_email` / `disown_guest_rows_by_email`, or a new RPC, to
  accept a photograph id; that is a cost to weigh against the pick, not a proposal now.)
- Calls his to overrule, one line each:
  - `identity-door.walk`: recommends folding the welcome into the name step on a first visit (one fewer screen);
    overrule if the arrival's own dedicated beat is worth the extra tap.
  - `identity-profile.default`: recommends keeping off, since flipping it touches `/privacy` and the Terms, not
    only this screen; overrule if most guests would show most events anyway, since asking once still never
    publishes one she has not seen.
- Look at first: `identity-door`'s `walk`, the lane's own headline question and the most structural of the three
  reopened asks.
