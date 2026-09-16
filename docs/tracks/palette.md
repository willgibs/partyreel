---
track: palette
status: open
cut: "02c409b4"        # the stepped review round (2026-09-16): the palette board reshaped for it
board: palette
owns:
  - src/app/(dev)/design/sandbox/palette/
  - docs/specs/palette.md
reads:
  - src/components/lab/
  - src/app/(dev)/design/sandbox/light/
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/sandbox/registry.test.ts
  - src/app/(dev)/design/(shell)/lab/_desk/
  - src/app/globals.css
  - src/app/theme.css
  - scripts/lab-smoke.mjs
  - scripts/lab-review.mjs
  - docs/reviews/README.md
  - docs/reviews/_window.json
  - docs/design/README.md
  - docs/design/rulings.md
  - docs/tracks/lab-flow.md
---

# lp/palette

**Goal.** Reshape the palette catalog (round seven: nine cool palettes, Ember, Ladder and Today, the accent
on a switch) into a stepped review Will can walk in minutes, in half a day, with NO new palette and no new
exploration: round eight. The board is a set of variants of one thing, so it is decided by ONE pick:
`catalog.mode: "pick-one"`, a `winner` ask (`id: "palette"`, `control: "palette"`, its options the twelve
card ids plus `none` labelled "None of these", meaning "new directions: say what in the note"; `lands`:
the grey ramp and every surface token in `src/app/theme.css`), `stage` the section that shows the real
pages wearing the pick, and every card's `lands` one line (what winning lands as). Keep the Today card,
keep the wipe for any two, keep the accent switch as a control the strip can show. Will's words that
frame the winner: "I'm a much bigger fan of the cooler gray direction in slate, studio, and reel... Looks
beautiful with the very black/white backgrounds for solid contrast then cooler surfaces rather than
darker bland grays"; and the accent: "We will likely not use an accent color to stick with our achromatic
direction, but I would like to add a single optional accent color config per theme where I can decide if
an accent color would pair well." Then the asks become tile steps, each on ONE specimen with every option
drawn: `accent` (two tiles, the dashboard with the accent off and on, `state: { accent: "none" | "own" }`,
worn by the winner: the step's stage follows the pick control); `reach` staged `after: { ask: "accent",
option: "own" }`, three tiles on the same dashboard; `card` (three tiles on one card over the same
photograph); `faint` (two tiles on one text block). Every ask carries `lands`; a dock control that serves
one decision only becomes that decision's option states and leaves the dock (`strip` names the one or two
a step still wants beside its stage, such as Canvas). Delete context that only restates what the tiles
show, fold or delete the argument, and re-measure the reading budget (2,950 declared today; a stepped
board should need far less).

**The kit you build against.** `src/components/lab/board-spec.ts` at the `cut` above carries the fields
(`Ask.lands / after / strip`, `AskOption.state`, `Candidate.lands`, `CatalogSpec.mode / winner / walk /
stage`) and `registry.test.ts` their rules (a winner ask mirrors the pick control and may offer its cleared
default as `none`); the step surface that renders them is being built beside you on `lp/lab-flow` (read
`docs/tracks/lab-flow.md` for exactly what each field draws). Until it merges, your board page still
renders on the old card: write the spec against the fields, keep `pnpm test` green, and when the
Orchestrator tells you the flow has landed, merge `origin/launch-prep` and verify the walk on it before
handing off. The `palette` ask retired into Pick in round seven; it returns as the winner ask, which IS
the pick.

**Binds.** The bible, the contracts of every component under a path you own, and the policies
(`docs/design/README.md#what-binds-you`); Will's rulings in `docs/design/rulings.md` (2026-09-15 and
2026-09-16: a question carries its context; an exploration is a catalog; the wind-down: a kept idea lands
in the Library as a working version and the board retires); no em-dashes in any copy; no mono face; the
lab ships no production byte this round.

**Verify on.** A local `pnpm dev -p 3123` (`rm -rf .next/dev` first) at 1440 and 375 with reduced motion
honoured; once the flow is in: the walk from the desk end to end (the gallery step with the twelve as
tiles, a chosen card worn by the stage, "None of these" clearing it; the accent step; the reach step
hidden until accent=own is held, then reachable), a composed line accepted by `pnpm lab:review --dry`;
`pnpm lab:smoke --base http://localhost:3123` green for this board with its reading words;
`registry.test.ts` green; the four gates.

**Discipline on this machine.** The dev server on :3000 is not yours: never touch it. Your server on
:3123 only, killed by port; one process at a time, stopped before a build, a test run and the handoff;
never `[preview]` or `[ci]`; stage files explicitly; the `Co-Authored-By: Claude Opus 5
<noreply@anthropic.com>` trailer on every commit. Three other agents run beside you (`lab-flow`,
`light`, `home-hero`); merge `origin/launch-prep` before your handoff if it moved, never rebase.

**Questions.**

1. **What is the stage under the pick?** The goal says "the section that shows the real pages wearing the
   pick" and `lab-flow`'s own sketch says "the real dashboard". **Taken: both, on one toggle.** `stage:
   "pages"`, and that section folded the whole `app` section into itself: one Screen control carrying the
   four marketing routes as real documents, the demo album's own PUBLIC route as a real document, and the
   two signed-in screens (the dashboard, an event) as compositions, all wearing the pick. It opens on the
   dashboard, which is the surface Will's note is about and the one a tile press repaints rather than
   reloads. That deleted a section, its two ledes and six stage labels, and it deleted `GuestAlbum`: the
   album is the one app surface a frame CAN load, so a rebuilt guest page beside the real one was two
   answers to one question.
2. **Does `card` really want three tiles when two of them are identical pixels?** For every cool palette
   "solid as declared" and "solid, ruled" resolve to the same `--card` (the palette's own value is already
   opaque); on Today it is "declared" and "see-through" that match. **Taken: three tiles, with the resolved
   `--card` printed on the specimen.** The goal asks for three, the third option is a real ruling rather
   than a look, and the printed value is what makes two identical tiles read as an answer rather than a
   bug.
3. **`lands` on the winner names which file?** The goal says `src/app/theme.css`; the token VALUES live in
   `globals.css` and `marketing.css`, and theme.css only maps them into Tailwind's namespace
   (`css-source-policy.test.ts` pins that split). **Taken: the accurate pair**, "the grey ramp and every
   surface token in globals.css and marketing.css". A `lands` line naming the wrong file is a lie to the
   reviewer at the exact moment he is deciding.
4. **The reading budget could not be measured on the stepped surface yet.** Declared 1,950, from 3,078
   measured on the old card minus the 1,138 words `lab-flow` deletes (the answer block's ask pills 593, the
   index 187, the review panel 243, the sections' Rule-on rows 115), all four counted live on :3123.
   **To re-measure and correct at the merge** before the handoff; if the meta panel folding closed in
   browse mode takes the twelve rationales with it, it lands nearer 1,600.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none: the round touched no system doc. `docs/specs/palette.md` (owned) gained its round-eight section and
  had the accent's "three jobs" corrected (they are identity, attention and the media stand-in; round
  seven wrote the attention job's three call sites there instead, which is what the reach ask turns on).

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Not mine, but blocking every lane (found merging `origin/launch-prep` at `e54ad6a9`)

`pnpm test` is RED on `launch-prep` itself: `rules-registry.test.ts` fails because `a978d791` rewrote the
home hero's line in `src/app/(dev)/design/touchpoints.ts` without regenerating `docs/design/library.md`,
which still says "Round four: the source in its emanating direction". One `pnpm design:rules` fixes it. Not
touched here on purpose: `docs/design/library.md` is `lp/lab-flow`'s owned path this round and it
regenerates the artifact as part of its own work, so a second regeneration would only be a conflict. Every
gate below is otherwise green, and every palette test passes.

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` green for this board, its reading words
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The steps, one line each: `<ask>: decides <lands>; tiles | means-only; after <...>`
- The cards, one line each: `<id>: lands as <...>`
- Assets requested from Will: none, or one per line
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
