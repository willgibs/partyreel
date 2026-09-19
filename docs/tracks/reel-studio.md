---
track: reel-studio
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "d909cb13"          # the launch-prep SHA the branch was cut from
board: reel-studio      # round one: the highlight reel, from the album to a guest's hands
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/reel-studio/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/host-app.md
  - docs/systems/guest-flow.md
  - docs/PRICING.md
  - src/app/(app)/dashboard/[eventId]/reel/page.tsx
  - src/components/reel/reel-studio.tsx
  - src/components/reel/reel-builder.tsx
  - src/components/reel/studio-moments-picker.tsx
  - src/components/reel/studio-filmstrip.tsx
  - src/components/reel/style-rail.tsx
  - src/components/reel/use-reel-config.ts
  - src/components/reel/reel-stage-provider.tsx
  - src/components/reel/reel-provider.tsx
  - src/components/reel/reel-stitching-dialog.tsx
  - src/components/reel/publish-light.tsx
  - src/components/reel/reel-reveal.tsx
  - src/components/reel/reel-share-card.tsx
  - src/components/reel/poster-card.tsx
  - src/components/reel/reel-button.tsx
  - src/components/guest/guest-reel-card.tsx
  - src/components/guest/guest-reel-overlay.tsx
  - src/lib/reel/engine/player.tsx
  - src/lib/reel/engine/style-registry.ts
  - src/lib/reel/engine/registry.ts
  - src/lib/reel/engine/constants.ts
  - src/lib/reel/guest-reel-payload.ts
  - src/lib/media/tile-aspect.ts
  - src/lib/constants/tiers.ts
  - src/lib/constants/marketing-media.ts
  - src/app/(dev)/design/sandbox/glass/spec.ts
  - src/app/(dev)/design/sandbox/app-pricing/spec.ts
  - src/app/(dev)/design/sandbox/app-vocabulary/spec.ts
---

# lp/reel-studio

**Goal.** Round one of `reel-studio`: THE HIGHLIGHT REEL, from the moment a host opens the studio to the moment a guest
watches it, reconceived from the ground up. Will (2026-09-19, `docs/design/rulings.md`, "the overnight round"): explore
every surface, everything unprotected, "at worst, net neutral and fully deleted". Six to eight decisions with
`defineExploration`, each drawn on LOCAL REPLICAS of the studio's pieces with fixtures, at 1440 by 900 and 375, a
recommendation each, every number measured; never many live canvas players per option, never a real RPC, never an
encode, never a portal to the body.

**What came back.** Eight decisions at `/design/lab/reel-studio`, 706 of the 1,200 reading words, 1440 by 900 leading
with 375 on the knob. Five roots (`door`, `room`, `moments`, `sharing`, `guests`) and three staged
(`styles` and `wait` behind `room`, `blocked` behind `moments`), so one answer really does unlock the next question and
`styles` genuinely changes its answer between rooms. The whole studio is a local replica, because `ReelProvider`,
`useReelConfig` and `runClientEncode` fire real RPCs, a real encode and a real R2 PUT against any event id they are
handed; what IS shipped code is imported and never edited: `StudioPublishLight` at its own call site (a `relative
isolate` wrapper, the lamp first, nothing clipping), `PosterCard`, `ReelShareCard` with the real card lamp,
`ReelStatusChip`, `FeedSectionHeader`, `MediaTile`, `GALLERY_COLUMNS` and `formatReelMeta`. Every reel frame on the
board is `drawReelFrame` over the fixture clips, drawn once per style into an offscreen canvas and shared by all
twenty-four options, because the step mounts every option of a decision at once and a wall plus a rail would be
twenty-eight live canvases on one stage.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- **The goal's suggested DOWNLOAD decision was cut.** Eight is the ceiling and the export already has a decision
  (`wait`). Recommended and carried: leave Download where it is for this round and re-ask it in the wiring, once
  `room` and `wait` are answered, because its home ("under Length", "beside Share", "in the share card") is a
  consequence of the room's shape rather than a question of its own.
- **The goal's suggested ROOM option "the studio as a sheet over the event page" was replaced by `bench`.** A sheet
  re-opens Will's own R3 ruling that the reel deserves a route you GO to, and it answers nothing about the laptop,
  which is where the room is least designed. Recommended and carried: the workbench (the reel large, the open work in
  a column beside it, a phone unchanged) as the third option, with `float` as the one-cap-removed middle.
- **`guests` option three was narrowed to "no cinema, it plays where it sits".** The goal offered "the reel as the
  album's opening frame", but where the guest's card SITS is ruled and `guest-shape`'s. Recommended and carried: keep
  the question to the CONTAINER (a poster and a cinema, a poster that is already moving, or no cinema at all) so no
  option quietly moves a placement another board owns.
- **A finding rather than a question, but his to overrule:** the host's poster card on the event page is the full
  `max-w-7xl` column with a 360 px reel floating in its middle (measured: a 1280 px card around a 360 px reel at
  1440), because `CanvasReelPlayer` caps itself and `PosterCard` does not. The `door` decision's third option fixes it
  at its source by making the card hug the reel; if he picks `link` or `button` the card's geometry is still wrong and
  needs its own fix (it is on the Deferred list below either way).

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none (a lab-only round ships no production byte; every finding below is a ROADMAP line or a question above)

## Deferred (ROADMAP one-liners, bucket named)

- **Now:** `StyleRail` in `src/components/reel/style-rail.tsx` has zero callers (the intersection latch, the
  placeholder geometry, the whole economy) since the Studio took `StyleWall`; either the `styles` ruling revives it or
  it is deleted with the round's wiring.
- **Now:** the 360/640 player cap is a literal copied into four files (`player.tsx`'s `max-w-[360px]`/`max-w-[640px]`,
  `reel-studio.tsx`'s `FRAME_CAP`, `guest-reel-overlay.tsx`'s `screenWidth`, `guest-reel-card.tsx`'s stage hold); the
  `room` ruling moves it, so it needs one source first.
- **Now:** `PosterCard` spreads to its column while the player inside caps at 360, so the host's Reel section draws a
  1280 px card around a 360 px reel at 1440, with the event's name a column away from the picture it names.
- **Now:** `docs/systems/host-app.md` still names a dormant render poll in the reel section; `reel-stitching-dialog.tsx`
  says the poll mode and its `/api/reel/render` GET were pruned on 2026-07-08 with the Lambda teardown.
- **Now:** the Studio's cover strip is the only room tile that does not read `UNIFORM_TILE_ASPECT` (a hand-set
  `h-16 w-9` in `reel-studio.tsx`), so the opening shot is chosen at a different shape from every other tile.
- **Later:** `studio-moments-picker.tsx`'s pool uses `grid-cols-4 sm:grid-cols-5`, a VIEWPORT breakpoint, so in a sheet
  spanning a 1440 room it draws five 280 px tiles and shows five of thirty; the `moments` ruling decides whether that
  grid survives at all.

## Handoff (replaces the chat report)

- Head `<pending>`, pushed; synced with `origin/launch-prep` at `9f976f7c` (one docs-only commit, no overlap)
- Gates on the synced tree, each on its own exit code: `pnpm design:rules` ok · `pnpm typecheck` ok · `pnpm lint` ok
  (the 8 known warnings) · `pnpm test` ok (2,533) · `pnpm build` ok (254 static pages) ·
  `pnpm lab:smoke --base http://localhost:3132` ok (373 checks, 0 failing; reel-studio reads 706 of 1,200) ·
  `pnpm lab:demo --board reel-studio` ok (8 steps, 0 failing, every step draws its options, nothing clipped,
  unlabelled or out of reach)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` =
  `docs/design/library.md` (regenerated by `pnpm design:rules`, committed as written) ·
  `docs/tracks/reel-studio.md` (this file) ·
  `src/app/(dev)/design/(shell)/lab/boards.ts` (one import + one head line) ·
  `src/app/(dev)/design/sandbox/registry.ts` (one import + one head line) ·
  `src/app/(dev)/design/sandbox/reel-studio/` (7 files) ·
  `src/app/(dev)/design/touchpoints.ts` (both unions + one RULINGS row after `river-visual`'s)
- The decisions, one line each:
  - `door`: how a host gets into the studio (an 11 px link, as today · a button beside the chip · the poster is the
    door, the card hugging the reel and Edit at its corner). **Recommend `poster`.** Measured at 1440: the link is 80
    by 17 px at 11 px type on a 1280 px card around a 360 px reel; the press becomes 360 by 640.
  - `room`: what the studio is on a laptop (360 px wide as today · the reel takes the whole room, chrome floating ·
    a workbench, the reel and the open work side by side). **Recommend `bench`.** Measured at 1440: 360 by 640 at 18
    percent of the screen with 57 percent covered · 506 by 900 at 35 percent, still 52 percent covered · 390 by 693 at
    21 percent beside a 360 px column, 0 percent covered. Growing the reel buys screen and covers nothing new.
  - `styles`: how fourteen looks are offered (the four-column wall as today · one scrolling rail, the dead code
    revived · three to start and More). **Recommend `rail`**, and this is the decision that flips on `room`: in
    today's room the wall draws four 348 px frames in a 360 px panel and NOT ONE fits whole, while in the bench's
    column the same wall shows nearly all fourteen. The rail shows 11 of 14 at 112 px with 31 percent of the reel
    covered.
  - `moments`: where membership is chosen (the 70 percent sheet as today · a pool that never covers the reel, a
    column on a bench and a band at the foot elsewhere · the event page's own gallery under a tray holding the cut).
    **Recommend `pool`.** Measured at 1440: the sheet shows 5 of 30 and covers 72 percent of the reel; the pool shows
    30 of 30 and covers none; the tray shows 18 of 18 at 253 px under an 80 px bar.
  - `blocked`: how a photograph the reel cannot take explains itself (a native tooltip as today · a line on the tap ·
    the tile says it itself with Show). **Recommend `caption`.** Measured: today the reason is an attribute no finger
    can reach, on the phone the room was designed for.
  - `sharing`: how sharing and unsharing are answered (a silent toggle as today · an Undo held for a few seconds · a
    panel naming the 19 guests who can watch). **Recommend `undo`.** Measured: today nothing on the screen offers a
    way back; the Undo is a 384 by 34 px row at 12 px.
  - `wait`: what a host sees during the on-device encode (the modal as today · progress on the reel itself with
    Cancel in the bar · the encode behind them with a notice). **Recommend `player`.** Measured at 375: the modal is
    27 percent of the screen over a scrim and covers 42 percent of the reel; the bar covers 5 percent.
  - `guests`: how a guest meets the reel (a 4:5 cover and a play badge opening the cinema, as today · a poster
    already moving · no cinema, it plays in the column). **Recommend `overlay`**, the one decision where today wins:
    the ruled cinema is built on the swap from a small still, and both alternatives put the whole canvas engine on the
    first paint of every album. A "One tap in" knob draws the cinema on the same stage.
- Mobbin citations: none (the surfaces are all ours and all shipped; the round's ideas came from measuring them)
- Assets requested from Will: **none.** Every reel frame on the board is the engine drawing the twelve bootstrap
  marketing stills, so the Higgsfield month swaps in with no board change.
- Captures (every option at 1440 and 375, read against its own words):
  `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/924675e3-0148-4e81-9dca-d9c2f1952d0a/scratchpad/reel-studio/shots/`
  (48 pictures plus the measured captions as JSON; scratch, not committed)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: **`room`**, and read the three captions against each other. It is the trunk the studio's other two
  decisions hang off, and the numbers say plainly what a phone-shaped room costs on a laptop. Then `styles`, with
  `room` set to `bench` and then back to `capped`: it is the clearest case in the round of an answer that changes
  because an earlier one did.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-19). Round one of the highlight reel returned eight decisions from the
door into the studio to the moment a guest meets the reel, asked at 1440 by 900 with 375 on the knob because every
surface that shapes the reel was composed for a hand. Five roots and three staged behind them, so the room's answer
unlocks where fourteen looks live and what the export's minute looks like, and the picker's answer unlocks what a
blocked tile says. The studio was rebuilt as a local replica (its providers fire real RPCs and its Download a real
encode) with `StudioPublishLight`, `PosterCard`, `ReelShareCard` and the gallery's own tile imported unchanged, and
every reel frame drawn by the real engine once per style and shared by all twenty-four options. The measured captions
carried the round: today's style wall shows none of its fourteen looks whole at a laptop, the moments sheet covers 72
percent of the reel it is re-cutting, and the export's modal hides 42 percent of the thing it is describing. Six
findings went to the ROADMAP, including the dead `StyleRail`, the player cap copied into four files and a poster card
that spreads to its column around a reel that does not.
