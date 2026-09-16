---
track: palette
status: handed-off
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
4. **What reading budget should the board declare?** It could only be estimated before the step surface
   merged (1,865, from 3,078 on the old card minus the 1,138 words the flow deletes). Measured on the
   merged tree it is **1,191 against the standard 1,200**, so **taken: no declaration at all.** The last
   hundred words came out of duplication rather than evidence: a second "Apply to the site" the sticky dock
   already carries, a bullet list saying what the section's own wiring fold says, sixteen lightnesses in a
   caption under a picture, and a verdict repeating the winner ask's argument. The headroom is nine words,
   which is the honest state to leave it in: a board that does not need the escape hatch should not claim
   one, and the next sentence above the fold has to replace one.
5. **Is a tile a window or a thumbnail?** The kit draws one as the board's section inside a 1440 canvas,
   zoom-fitted to the tile's width, then clipped at `--lab-tile-h`, so the default 240px minimum is five
   columns at a 0.17 scale and a dashboard at 0.17 is a smudge. **Taken: `--lab-tile-min: 430px` and
   `--lab-tile-h: 320px` on the board root**, which is three columns at 0.32 with nothing cropped, so every
   option of every ask on this board lands in ONE row. The three ask specimens also stopped capping
   themselves at `max-w-2xl`, which was leaving half of every tile empty, and cap their MEDIA instead so a
   1440 canvas does not turn a 4:3 photograph into a 500px-tall tile.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none: the round touched no system doc. `docs/specs/palette.md` (owned) gained its round-eight section and
  had the accent's "three jobs" corrected (they are identity, attention and the media stand-in; round
  seven wrote the attention job's three call sites there instead, which is what the reach ask turns on).

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Not mine, found and already fixed upstream

Merging `origin/launch-prep` at `e54ad6a9` made `pnpm test` red: `rules-registry.test.ts` failed because
`a978d791` rewrote the home hero's line in `touchpoints.ts` without regenerating `docs/design/library.md`.
Not touched here (that file is `lp/lab-flow`'s owned path this round, so a second regeneration would only
be a conflict); the Orchestrator regenerated it at `627ca513`, which is merged in and green.

## Handoff (replaces the chat report)

- Head is this manifest's own commit, the tip of `lp/palette`; the last code commit is `e75bc0de`. Pushed;
  synced with `launch-prep` at `2b9e38d0` (merged four times, never rebased: the hero's round six, the
  library artifact, the stepped review itself at `c18570c4`, and the type-scale cut).
- Gates on the synced tree: typecheck ok, lint ok (0 errors; the 6 warnings are pre-existing files outside
  this lane), test ok (2,165), build ok (258 pages); `pnpm lab:smoke --base http://localhost:3123` ok (257
  checks, 0 route failures; the 2 budget failures are the two glow boards, which fail on purpose).
  **The board reads 1,191 words against the standard 1,200 and declares no budget at all**, from round
  seven's 2,924 against a declared 2,950.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` is 10 files, every one under an owned path
  plus this manifest. No exceptions.
- The steps, one line each:
  - `palette` (the winner): decides the grey ramp and every surface token in globals.css and marketing.css;
    tiles are the twelve catalog cards themselves plus "None of these"; strip `canvas` + `accent`; the
    stage is the real product. A press shows, a second press records, "None of these" clears the pick,
    which is the right preview of none. Verified all three live.
  - `accent`: decides whether `--brand` stays the alias for `--primary`; two tiles, the dashboard with the
    hue off and on, mirrored on the `accent` control.
  - `card`: decides `--card` in `.dark`; three tiles, one card over one photograph, the resolved value
    printed on the specimen. For a cool palette two of the three ARE the same pixels (the palette's own
    value is already opaque) and on Today it is the other pair that match; the printed value is what makes
    that read as an answer.
  - `faint`: decides a new `--faint`; two tiles, one text block across the page, a card and the panel.
  - `reach`: decides which `--brand` call sites keep the hue; three tiles on the same dashboard;
    `after: { ask: "accent", option: "own" }`. Verified both ways live: with `accent=own` held, Next from
    the accent step lands on it and the walk goes 41 to 42; with `accent=none` held, Next skips to `card`
    and the walk stays 41.
- The cards, one line each (`lands`): `today` no line changes · `ladder` the new rhythm with no hue, which
  rules the cool out by ruling · `ember` a warm 0.120 room under a true grey page · `onyx` a near-black
  0.075 room at half Apple's tint · `graphite` a 0.105 room, a 0.995 page, their greys between ·
  `steel` the same shape at twice their tint · `pitch` a true black 0.030 room · `mist` a 0.963 cool page
  with a white card lifting 0.037 · `slate` their grey hue at a third of their chroma · `reel` Slate's room
  on the paper page with the reel's violet · `studio` one room derived as veils of the ink · `dusk` the
  dark side only.
- Assets requested from Will: **one, already logged.** The four hard cases inside the media kit's shot list
  (ASSETS row 7 names all four). Round seven's portrait pair is WITHDRAWN: the guest masonry was a
  composition with hand-set tile ratios and the board now loads the demo event's own public route, which
  shows real media at its real ratios.
- Two findings on the merged kit, neither mine to fix:
  1. **`Candidate.lands` never draws on a pick-one gallery.** `catalog.tsx:271` guards it with `solo`, so
     the twelve lines this round wrote are declared, validated by `registers.test.ts` and invisible on the
     one catalog shape that is decided by a single pick, which is where "what would winning change" is
     most worth reading. One line in `catalog.tsx` would draw it on the ringed card.
  2. **The spine miscounts a blocked step opened by URL.** `/design/lab/palette?session=palette.reach` with
     no `accent=own` held reads "step 42 of 41": the staged step is out of the total but numbered past it.
     Walking with Back and Next is correct in both directions.
- Look at first: `/design/lab/palette?key=...&session=palette.reach&accent=own&palette=graphite`. Three
  tiles, one row, the same dashboard: the mark, the badge, the button, the live dot, the wizard pips and
  the marketing frame are lit or near-black by the option, and pressing the next tile FADES the hue in and
  out over 200ms rather than cutting, so what the ruling moves is what you see move. Then
  `?session=palette.palette`: press Graphite once (the dashboard under the tiles re-skins, nothing
  recorded), press it again (the ring, and "Copy so far" counts it), then press "None of these" (the ring
  clears and the pick control is dropped from the URL).

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-16). Round eight reshaped the palette catalog into a stepped
review without adding a palette or an argument: the twelve became one pick (`mode: "pick-one"`, the
`palette` winner ask mirroring the pick control with "None of these" as the new-directions exit) over a
stage that shows the real product, and the four remaining questions became tile steps with every option
drawn on ONE specimen. The accent wall of six job rows became one dashboard carrying all three of the
accent's jobs, the card question became one card over one photograph with its resolved `--card` printed,
the third text step became one block across three grounds, and the reach waits on `accent=own`. The four
one-question switches left the dock for their own option states; the app section folded into the real
pages, taking `GuestAlbum` with it. The board reads 1,191 words against the standard 1,200 and declares no
budget at all, down from 2,924 against a declared 2,950.
