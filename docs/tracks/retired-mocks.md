---
track: retired-mocks
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "14a17e10"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/marketing/sections/reel/live-section.tsx
  - src/components/marketing/sections/reel/live-tile.tsx
  - src/components/reel/poster-card.tsx
  - src/components/marketing/sections/how-it-works/host-pictures.tsx
  - src/components/marketing/sections/features/album/take-home-section.tsx
  - src/components/marketing/sections/features/sharing/zip-modal-demo.tsx
  - src/components/app/export/export-dialog.tsx
  - src/components/app/export/export-dialog.test.ts
  - src/components/app/export/take-home-panel.tsx
  - src/components/app/export/take-home-panel.test.tsx
  - src/components/marketing/mock-parity.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - docs/systems/testing-verification.md
  - docs/systems/marketing-content.md
---

# lp/retired-mocks

**Goal.** The marketing site's pictures that still draw retired product (the reel tile on /reel, the Download album dialog in How it works and the sharing mock, the export menu in the album page's take-home) redrawn from today's own pieces, and the dead files they kept alive deleted. A production lane: the whole gate, no board.

## The brief

**The round's direction (Will, standing since round 13):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity; nothing depends on a timeline; immediate, or a clear state and a way to stop it; no AI managing it; cost designed like the architecture; production is the working version.

**Why now.** Three of the marketing site's pictures still draw product the app retired, so the site shows a guest something she will never meet, and two dead files live on only for their pins. Each is a ROADMAP Now line; read each in full (`docs/ROADMAP.md`) and `docs/systems/marketing-content.md` first:

1. **/reel's live section** (`sections/reel/live-section.tsx`) draws the retired reel tile (`live-tile.tsx`, `PosterCard`'s last caller) at the top of the album: show it as the cover's play button opens it (the guest album's cover and its reel door, drawn from production's own parts), then delete `live-tile.tsx` and `PosterCard` (`src/components/reel/poster-card.tsx`), keeping the format helpers `clip-creator.tsx` imports.
2. **`KeepPicture`** (`sections/how-it-works/host-pictures.tsx`, drawn by /how-it-works and the help center's `loop-keep` step) still draws the retired Download album dialog, and `zip-modal-demo.tsx`'s caption says guests get the same modal: redraw both on Take it home, from the panel's own pieces exported by `take-home-panel.tsx`, so the picture cannot drift from the product again.
3. **`export-dialog.tsx`** has no caller but its test, and `mock-parity.test.ts` reads it for five quotes of the retired Download album menu for two mocks that still draw that menu (`features/album/take-home-section.tsx`, `features/sharing/zip-modal-demo.tsx`): redraw both on today's take-home (Select, then Save), then delete the file, its test and those pins, re-pointing `mock-parity.test.ts` at today's words where it guards a mock.

One picture per purpose: where a mock and the product show the same thing, the mock composes the product's own pieces (exported, never copied). Retire the three ROADMAP lines in your Handoff's list.

Out of scope: the help center's `ReelCardPicture` (it waits on event-header r6's card pick, on Will's desk), the marketing site's words beyond the captions these pictures carry, and any production behaviour (a piece exported from `take-home-panel.tsx` renders exactly as it does today; its test proves it).

**Verify on.** The whole gate on the synced tree, each step on its own exit code, and `pnpm lab:smoke` (the Library draws marketing pieces); each changed page served by your own dev server (`/reel`, `/how-it-works`, `/features/album`, `/features/sharing`, the help center's `loop-keep` step) answering 200 with the new picture's words in its HTML and none of the retired ones (`curl`); `mock-parity.test.ts` and `take-home-panel.test.tsx` green with the new pins. Screenshots at 1440 and 375 where your session's browser runs; if it is refused, say so and leave the look for Will's desk (never work around a refused step).

Model: Opus. Cut by the cloud-seated Orchestrator; you run in a cloud session of your own (the spawn prompt's boot).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- The help center's `loop-keep` alt text lives outside my paths (`marketing/help/step-screens/registry.ts:54`) and still
  reads "Download album: Everything, Photos or Videos" over the new picture. Recommended: the Orchestrator applies the
  one line `"loop-keep": "Take it home: Originals to keep, or Phone size to post",` at integration (built: not
  edited, since the path is forbidden; `curl /help/how-partyreel-works` shows it as the page's one retired phrase).

## System-doc edits (in place, owned facts only)

- None made: `docs/systems/marketing-content.md` is a read here. Proposed, for the Orchestrator, line 122's first
  clause: "**`/reel`**: the live chapter's laptop is the album's own cover (`AlbumCover` over `HeadStills`) with the
  round that opens the reel, so the motion a visitor meets there is the one they meet on their album;" and, in the same
  bullet, "(the pure `engine/style-registry` is the one engine module there)" refined to "(the pure
  `engine/style-registry`, and the cover's take picker with `engine/seed`'s PRNG, are the engine's only modules there;
  no canvas)".

## Deferred (ROADMAP one-liners, bucket named)

- Marketing (copy): `features/album/album-copy.ts`'s "Take all of it" body still says "everything, photos, or videos"
  (the retired menu's chips) over a plate that now draws Select, then Save; and the how-it-works keep step's body
  (`constants/how-it-works.ts`) says only "the whole album as a single zip", where the host's panel offers Phone size
  too (retired-mocks).
- Code hygiene: stale comments naming deleted files: `features/sharing/downloads-section.tsx`'s ★ block (the modal "STILL
  DRAWS THE RETIRED" menu: it no longer does), `lib/export/walk.ts:15` and `lib/content/help-ui-labels.test.ts:25`
  (`export-dialog.tsx`) (retired-mocks).

## Handoff (replaces the chat report)

- **Commits**: work `f87cc539` (pushed on `lp/retired-mocks`); no sync commit: `origin/launch-prep` (`ab6fec0b`) is an
  ancestor of the work (`git merge-base --is-ancestor` true at handoff). This manifest is the commit after it.
- **Gates on `f87cc539`**, each its own exit code: `pnpm typecheck` 0, `pnpm lint` 0 (no warnings), `pnpm test` 0
  (1052 files, 13227 passed, 2 skipped), `zsh scripts/build-lock.sh pnpm build` 0 (built with
  `NEXT_PUBLIC_SITE_URL=http://localhost:3000`), `pnpm lab:smoke --base http://localhost:3131` 0 (153 checks, 0
  failing; scope: library and shell, no boards). Two earlier smoke runs failed only on a cold dev compile past its
  20 s (`/design/library`, then `/design/lab/tools`); the third, warm, passed. `boom` answers 500 by design.
- **Lane check**: `git diff --name-only origin/launch-prep...HEAD` = the eleven owned paths (three deleted) + this
  file. No exceptions taken; one is asked (Questions: the help alt line).
- **Items**:
  - /reel's live section draws the album's own cover (`AlbumCover` over `HeadStills`, imported from
    `guest/event-experience-head.tsx`) in the laptop, with Add photos, the reel's Play round (haloed: the door the
    chapter is about) and Invite, the album under it; the name a ladder step down (`[&_h1]:text-page`) because the
    frame is a laptop drawn under half size. `live-tile.tsx` deleted; `poster-card.tsx` keeps only
    `formatReelDuration` and `formatReelMeta` (its one importer, `clip-creator.tsx`, is not mine to re-point, so the
    file keeps its name and says why).
  - `take-home-panel.tsx` exports `OriginalsCard`, `PhoneSizeCard` and `ClipsLine`; the panel renders through them
    (no behaviour change: its 9 tests unchanged and green, plus 2 new ones proving a card outside the panel is the
    panel's markup, and the pending and failed facts).
  - `zip-modal-demo.tsx` is `TakeHomeFigure`: the host's Take it home composed of those pieces with a fictional
    album's `ExportSummary` through the product's `takeHomeSizes`; `/features/sharing` works it (Include hidden items
    re-sizes both sets, Download answers with the icon swap), and `KeepPicture` (/how-it-works and the help center's
    `loop-keep`) holds it still. It lays out by its own width (`@min-[30rem]`: the desk pair, else the hand's stack,
    phone size first). The caption is "the host's Take it home · guests pick with Select, then Save".
  - The album page's "Take all of it" plate draws her Select, then Save: every tile picked (the tile's dim and check)
    under Save's quick choice, its title and rows in `setNoun` and `saveHints`' words.
  - `export-dialog.tsx` and its test deleted; `mock-parity.test.ts` drops its five retired quotes and the live tile's
    pin, and pins today's words instead: Save to Photos, Save to Files (`live-gallery-save.tsx`); Take it home, Send
    to Drive, Include hidden items (`take-home-panel.tsx`); Watch the highlight reel (`event-experience.tsx`);
    `title="Invite"` (`guest-share.tsx`). 53 pins green.
  - **Verified on my dev server (3131), `curl`**: `/reel` 200 with "Watch the highlight reel", 0 "Make your own clip
    to share"; `/how-it-works` 200 with Take it home, Phone size, Send to Drive, 0 "Download album" and "Pick what to
    bundle"; `/features/album` 200 with Save to Photos and Save to Files, 0 "Download album"; `/features/sharing` 200
    with Take it home, Phone size, Send to Drive, 0 of the three retired phrases; `/help/how-partyreel-works` 200 with
    the new picture's words and 0 "Pick what to bundle", but 2 "Download album": the step's alt in
    `step-screens/registry.ts` (Questions). **Screenshots** at 1440 and 375 of all five, taken in this container's
    Chromium and looked at (they die with the container; the look stays for Will's desk).
  - **ROADMAP lines to retire**: Marketing's /reel live section (line 98), Design's `KeepPicture` (line 99), Code
    hygiene's `export-dialog.tsx` (line 139).
- **Assets requested from Will**: none.
- **Board ideas**: `event-experience-head.tsx` could split the cover's frame (`EventHead`, `AlbumCover`, `HeadStills`)
  from its data half (`pickCoverIds`, `stillsFromSeed`, the bridge), so a picture of the cover ships no take picker;
  `album-tile.tsx`'s `SelectMark` exported would let the album plate compose the selection marks it draws by hand.
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none.
- **Calls his to overrule**:
  - /reel's first load now carries the cover's module (one ~17 KB chunk, 7 KB gzipped, with `live/take.ts`'s picker,
    `quick-add` and `engine/seed`'s PRNG; no canvas, no player): the price of composing the product's cover rather
    than copying it. The split above removes it.
  - The figure keeps the old demo's lower-case caption register and drops the size's number-pop (the facts are the
    card's own line now).
- **Look at first**: the help alt line (Questions), then `/reel`'s laptop at 1440 (the cover's name size and the halo
  on the Play round) and `/features/sharing`'s figure at 1440 and 375.
