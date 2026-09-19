---
track: reel-studio
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
`defineExploration`, each drawn on LOCAL REPLICAS of the studio's pieces with fixtures (one timeline of eight to twelve
photographs from `MARKETING_IMAGES` with real dimensions; a reel config per tier, Free with the watermark and the 30 s
cap, Pro without; a small pool of approved and hidden items; fourteen pre-rendered still frames, one per style; one
guest reel payload), at 1440 by 900 and 375, a recommendation each, every number measured; never many live canvas
players per option, never a real RPC, never an encode, never a portal to the body. **Not in this round:** any production
byte; the overlay's material over media (`glass`'s `reel`); the watermark and the 60 s lock as upgrade doors
(`app-pricing`'s `doors`: measure them, never re-ask); the studio's missing loading state and the builder's ghosted grid
(`app-vocabulary`'s `loading` and `empty-states`); where the guest's reel card sits in the album (ruled; `guest-shape`'s
chrome); the engine's styles themselves (fourteen looks, drawn as stills, never re-authored).

**What is measured (the tree at the cut).** The flow: pick moments (the Studio Moments sheet, the main door; also the
lightbox's reel button and the gallery's bulk select), then a style (a fourteen-look `StyleWall` grid mounted only while
open; a whole `StyleRail` with an intersection-latched economy exists with zero callers), a cover (Auto or any timeline
tile, the cover strip hand-set `h-16 w-9` while every other room tile reads `UNIFORM_TILE_ASPECT`), a length (Auto, 15,
30, 60 s chips; 60 locked with an Upgrade link on Free), a layout (portrait 9:16 by default, landscape 16:9). Rendering
is entirely on the device: one `drawReelFrame` on canvas at 24 fps feeds the live player (capped at 360 wide portrait,
640 landscape, the same literal copied in four files) and, on Download only, a dynamically imported WebCodecs H.264 encode;
no server render, no Remotion (two comments still teach a torn-out sibling module; `host-app.md` still names a dormant
render poll the code says was pruned). Publish is one RPC behind one "Share with guests" surface, refusing at zero
approved items ("Add some photos to your reel first"); a shared reel rests lit (the publish light, base 0.34 in the
studio, 0.22 on the card) and swells only on the tap that shared it; Unshare is a silent one-tap toggle with no confirm
and no undo while guests may be watching. Free: a server-stamped "partyreel.com" watermark (30 px type, a 38 by 30 badge,
48 px margin, bottom right). The studio is a fixed `h-dvh` near-black room in both themes with no `.dark` class, and on
a 1440 by 900 laptop the frame still sits at 360 by 640 inside a far taller box; its door from the event page is an 11 px
text link that `host-app.md` calls the sole load-bearing door. A blocked tile in the moments picker explains itself only
through a native `title` that never fires on touch. The guest: the same poster card (a still and a play badge) opens a
lazy full-bleed overlay with a chrome-less looping player and Share and Download; Download ladders a fresh artifact, a
self-encode, then "ask the host"; a guest has no write path. The pins, all function: about thirty lib tests (quick-add
and seed determinism, the upload and guest-download contracts, the encode gate and budget, the render hash, the
provider's reorder and revert, the engine's geometry), `publish-light.test.tsx` (mount order, aria, swell versus rest);
nothing is a visual pin.

**The decisions (suggested; yours to recut, never forced apart).** THE DOOR (into the studio from the event page: an 11 px
link, as today; a real button; the whole poster card tappable, the link kept for assistive tech); THE ROOM (the frame at
a laptop: 360 by 640 in a tall room, as today; the frame growing with the room, the wings' light re-measured; the studio
as a sheet over the event page, the album beneath); THE STYLES (fourteen looks: the wall grid, as today; the rail,
resurrected, drawn with the fourteen stills; three families, one look each, the rest behind "more"); THE MOMENTS (how
moments are picked: the sheet, as today; the album itself with a reel tray at the foot; the filmstrip as the picker,
tiles dragged in); BLOCKED (a tile the reel cannot take: a native title, as today, dead on touch; a toast on tap; an
inline caption on the tile); SHARING (share and unshare: a silent toggle, as today; an Undo toast on unshare; an inline
confirm naming who may be watching); THE WAIT (what the host sees during the on-device encode: the stitching dialog, as
today; progress inside the player; the encode in the background with a notice when it lands, drawn); THE GUEST'S (how a
guest watches: the poster opening a full-bleed overlay, as today; an inline player in the album, the overlay gone; the
reel as the album's opening frame). Optional if it fits the budget: DOWNLOAD (where Download lives: under Length, as
today; beside Share in the studio's head; in the share card). The dead rail, the four copies of one cap, the cover
strip's own aspect and the stale render-poll sentence go under Deferred as ROADMAP lines whichever option wins.

**Binds.** The bible; the reel rulings on the `reel-reveal` and `reel-experience` touchpoints as precedent (reopenable);
the never-mount rule that `publish-light.tsx` states outright (the studio "cannot be rendered on a board" and a re-typed
recipe "shows a light production never had": build local replicas, draw the light as the component's own numbers, never
a portal); the never-mutate rule (`ReelProvider` and `useReelConfig` fire real RPCs on any mounted event id; `runClientEncode`
and the reel APIs are real, authed and R2-mutating: none is ever called from a preview; mediabunny's probe loads eagerly,
the encoder stays dynamic-import only); one live canvas player at most per option, the rest stills, the way the
production style sheet protects itself; reduced motion honoured; no em-dashes; the copy is open (bible 21). Mobbin is
encouraged, never required: reel and story editors, style pickers, on-device video export, share sheets.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8
  known warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3132`,
  `pnpm lab:demo --board reel-studio` (0 failing), with `DESIGN_PREVIEW_KEY` in the environment, never on a command line.
- Every option at 1440 and 375 on local replicas with fixtures, no RPC, no encode, no upload from a preview; a capture
  of every option beside its words, the picture checked against the words; the reading budget.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board reel-studio` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The decisions, one line each: `<id>: the question; the options; the recommendation`
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
