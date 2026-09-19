---
track: media-viewer
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "d909cb13"          # the launch-prep SHA the branch was cut from
board: media-viewer     # round one: what a photograph opens as, for a guest and a host
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/media-viewer/
  - public/lab/media-viewer/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/guest-flow.md
  - docs/systems/host-app.md
  - src/components/shared/media-lightbox.tsx
  - src/components/shared/media-lightbox.lazy.tsx
  - src/components/shared/media-lightbox.test.tsx
  - src/components/shared/play-badge.tsx
  - src/components/shared/upload-thumbnail.tsx
  - src/components/shared/masonry.tsx
  - src/components/guest/guest-masonry.tsx
  - src/components/guest/live-gallery.tsx
  - src/components/guest/report-dialog.tsx
  - src/components/app/media-grid.tsx
  - src/components/app/host-media-grid.tsx
  - src/components/app/event-feed/selectable-media-grid.tsx
  - src/components/app/my-uploads-gallery.tsx
  - src/components/admin/moderation-grid.tsx
  - src/components/likes/like-button.tsx
  - src/lib/media/poster.ts
  - src/lib/media/tile-aspect.ts
  - src/lib/constants/marketing-media.ts
  - src/app/(dev)/design/sandbox/guest-shape/spec.ts
  - src/app/(dev)/design/sandbox/glass/spec.ts
  - src/app/(dev)/design/sandbox/guest-upload/spec.ts
---

# lp/media-viewer

**Goal.** Round one of `media-viewer`: WHAT A PHOTOGRAPH OPENS AS when a guest or a host taps a tile, the surface every
album click ends on, reconceived from the ground up. Will (2026-09-19, `docs/design/rulings.md`, "the overnight round"):
explore every surface, everything unprotected, "at worst, net neutral and fully deleted". Six to eight decisions with
`defineExploration`, each drawn on the REAL viewer's pieces with fixtures (an open wedding album of two dozen photographs
at varied shapes, one video, one held item, the guest's own photograph, the same album for its host), phone first at 375
by 812 with 1440 on a knob, a recommendation each, every number measured; no preview touches the network, mounts a real
provider or edits a pinned file. **Not in this round:** any production byte; the viewer's MATERIAL (the backdrop, the
pills' blur and grades are `glass`'s `behind`, `recipe` and `grades`); whether a guest can take a photograph back and the
shape of the four guest dialogs (`guest-shape`'s `yours` and `dialogs`); the tile grammar and the bulk toolbar
(`app-vocabulary`); the reel.

**What is measured (the tree at the cut).** One shared viewer, `media-lightbox.tsx` (about 700 lines, code-split behind a
mount latch in `.lazy.tsx`), a raw radix Dialog portalled to `document.body` over `bg-black/90`: a 32 px close circle top
right (safe-area aware), 36 px chevrons when a neighbour exists, window-level arrow keys, a touch-only finger-follow swipe
(a mouse gets chevrons and keys; 10 px axis lock, 20 percent of the width or 0.25 px/ms to commit, 240 ms settle, 200 ms
spring back, all instant under reduced motion), tap thirds (the outer 30 percent each side navigate, the centre closes,
the edges do nothing), NO zoom of its own (pinch and vertical are ceded to the browser, by comment), a native
`<video controls>` that plays on click with a `#t=0.1` poster for iOS and a 64 px strip at its foot reserved from the
swipe, an action pill of 20 px icons (Like, Save, Share, then the host's approve / hide / remove behind a confirm), an
attribution pill (the name, a Host badge, Anonymous with an info tip, the host-only email, the event link) and an always-on
"i of N" counter. The same component serves the host gallery, Uploads, Likes, the recovery bin (Save hidden) and the admin
(Save only); personal feeds get Like but no Share; the guest grid re-implements its tiles beside `MasonryColumns`; the
Review bulk-select grid hand-rolls a THIRD full-bleed peek (a fixed div, its own X, and a comment promising Escape that no
handler honours). The viewer's own image and video have no loading state (the grid tile has a skeleton; the viewer pops
in); nothing about an open item reaches the URL (a refresh or a share link loses it); `/api/reports` accepts a `media_id`
the report dialog never sends. The behaviour pins: `media-lightbox.test.tsx` (seventeen pins on the gesture physics, the
keyboard, the tap thirds, the video strip, the host curate wiring; function, never theme), `masonry.test.tsx` (the overlay
stays a sibling of the lightbox button), `lit-edge-contract.test.ts` (where `[data-lit]` may sit). The standing rulings on
the `lightbox` and `gallery-actions` touchpoints are precedent, reopenable.

**The decisions (as cut).** Eight, four of them roots he can take in any order and four staged behind one of those, so the
round unlocks the next: THE OPENING, then WHAT IT HOLDS, then WHO and THE WAY OUT; THE NEXT ONE, then CLOSE UP; A VIDEO
and A LINK stand alone. ARRIVAL was folded into THE OPENING rather than asked twice: the option where the photograph grows
out of its tile IS the arrival, and the viewer's missing loading state is on the Deferred list instead. Every gesture
option is a visual double drawn for the board, never a change to the engine, and the seventeen physics pins survive all
twenty-four options.

**Binds.** The bible; the guest rulings (the host's event, minimal branding; a guest's reading copy at 15 to 16 px); the
never-mount rule for portal-bound components in the lab (quote the pill class for class, as `guest-shape/yours.tsx` does;
never wrap a real `LikesProvider` or `ReelProvider`, both reach Supabase on mount); the lazy mount latch (a fixture opens
the viewer client-side); reduced motion honoured in every option; no em-dashes; the copy is open (bible 21). A playable
video fixture: no committed clip exists, so if a decision needs real playback commit ONE clip under `public/lab/media-viewer/`
at most 1 MB (the test media has `videos/landscape-bigbuckbunny.mp4`), otherwise a poster and a play state as
`guest-upload` did. Pictures from `MARKETING_IMAGES` at varied shapes, as `guest-shape` did. Mobbin is encouraged, never
required: photo viewers, shared-album lightboxes, video players on phones.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8
  known warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3131`,
  `pnpm lab:demo --board media-viewer` (0 failing), with `DESIGN_PREVIEW_KEY` in the environment, never on a command line.
- Every option at 375 and 1440 on the real pieces with fixtures, no network from a preview; a capture of every option
  beside its words, the picture checked against the words; the reading budget.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- **May a guest's photograph leave the album as a file at all?** `link`'s third option puts the image itself in the
  system share sheet, which is a privacy and anti-abuse call rather than a design one: it takes a guest's photograph out
  of the host's album and off Partyreel, with nothing to revoke. **Recommended, and carried:** no. The album's link with
  the photograph on it (`query`) keeps every share a door back in, which is the loop the QR already runs; `file` stays on
  the board as the third option so he can overrule it.
- **Does `who`'s answer bind the HOST's viewer as well as a guest's?** The host's copy carries one extra fact, the
  uploader's email, which is host-gallery-only by construction. **Recommended, and carried:** yes, one shape for both, with
  the email as an extra clause on the same line rather than a second row; the `Whose viewer` knob on `holds` and `who`
  draws both, so the answer can be judged on the host's six-icon pill too.
- **While a photograph is zoomed, does a one-finger drag pan or dismiss?** `closeup`'s pinch and `wayout`'s swipe down
  want the same finger. **Recommended, and carried:** a zoomed photograph owns both axes until it settles back under the
  fit size, and only then does a drag down mean "put it away"; that is the one interaction rule the two winners have to
  agree on at the wiring.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none (this round ships no production byte; every finding about a shipped component is a Deferred line below)

## Deferred (ROADMAP one-liners, bucket named)

- **Now**: from `media-viewer` (2026-09-19, the lab), seams no decision on the board absorbs: the admin's viewer passes
  Save only (no Like, no Share) while the recovery bin passes everything but Save, so two surfaces disagree about what a
  viewer is; the personal Uploads feed has Like and Delete but no Share, alone among the six; `/api/reports` accepts a
  `media_id` the report dialog never sends, so a per-item report has a route and no caller; and the Review bulk-select
  grid hand-rolls a THIRD full-bleed peek whose comment promises an Escape no handler honours (the same line
  `host-curation` found from its own side).
- **Now**: from `media-viewer` (2026-09-19, the lab): the viewer's own image and video have no loading state at all. A
  grid tile has a `Skeleton`; the opened photograph pops in whenever the full-res presigned URL lands, which on venue
  Wi-Fi is the slowest picture in the product. Whichever `opening` wins, the wiring owes it one arrival.
- **Now**: from `media-viewer` (2026-09-19, the lab): `MediaTile` carries `loading="lazy"`, and Blink resolves that
  against the TOP window even for an image inside a same-origin iframe, so a strip of tiles below the fold never loads
  (nine filmstrip frames rendered black on the first capture of `next`). If the filmstrip wins, its frames must not be
  `MediaTile`, or `MediaTile` needs an eager escape hatch; either way a gallery tile used as CHROME is a different job.

## Handoff (replaces the chat report)

- Head `50d43ae4` (the board) plus the merge `627e7f75`, pushed; synced with `launch-prep` at `ba30b46c` (7 commits, the
  `host-curation` round: registration conflicts in `registry.ts`, `boards.ts` and both `touchpoints.ts` unions resolved by
  keeping BOTH added lines, the RULINGS hunk spliced back across its row boundary, `docs/design/library.md` regenerated).
- Gates on the synced tree, each on its own exit code: `pnpm design:rules` ok (123 components, 733 contracts, 18 policies);
  the specimen collector ok; typecheck ok; lint ok (the 8 known warnings, none of them mine); test ok (2,535); build ok
  (254 pages); `pnpm lab:smoke --base http://localhost:3131` ok (383 checks, 0 failing; the board reads 716 words of a
  1,200 budget); `pnpm lab:demo --board media-viewer` ok (8 steps, 0 failing, every step draws its options, the tallest
  1.6 screens and the wordiest 354 words).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/design/library.md` (regenerated by `design:rules`),
  `docs/tracks/media-viewer.md` (this file), `public/lab/media-viewer/clip.mp4`, the six files of
  `src/app/(dev)/design/sandbox/media-viewer/`, and the registration lines in
  `src/app/(dev)/design/(shell)/lab/boards.ts`, `src/app/(dev)/design/sandbox/registry.ts` and
  `src/app/(dev)/design/touchpoints.ts` (both unions plus one RULINGS row after `river-visual`'s).
- The decisions, one line each:
  - `opening`: what should a tap on a photograph open? the dark room as today / the photograph grows out of its tile /
    a sheet with the album still lit above it. **Recommended: grow.**
  - `holds` (after `opening`): what should stand on the screen beside the photograph? two capsules and a counter as today /
    nothing until a tap asks for it / one strip at the foot. **Recommended: strip.**
  - `who` (after `holds`): how should a photograph say who took it? a capsule of its own as today / the name and the time
    on the chrome's own line / no name at all. **Recommended: foot.**
  - `next`: how should the next photograph come, and how should a guest know where they are? swipe, chevrons and a count
    as today / a filmstrip of the neighbours at the foot / the neighbours peek at the edges. **Recommended: peek.**
  - `closeup` (after `next`): should a guest be able to get close to a photograph? leave it to the browser as today /
    double-tap fills the screen / pinch inside the viewer. **Recommended: pinch.**
  - `video`: how should a video meet a guest? the browser's own controls as today / it plays muted with one tap for sound /
    a play button alone. **Recommended: badge.**
  - `wayout` (after `holds`): how should a guest get back to the album? the circle, the centre tap and Escape as today /
    swipe it back down into the album / the circle alone. **Recommended: down.**
  - `link`: should an open photograph have an address of its own? no address as today / the album's link with the
    photograph on it / Share sends the picture itself. **Recommended: query.**
- Mobbin, for inspiration only, cited where an option came from one: Apple Photos' filmstrip of neighbours at the foot
  (`next`'s `film`, https://mobbin.com/screens/6a012417-7088-411c-a285-08337b11e49f); Google Photos' neighbours peeking at
  both edges (`next`'s `peek`, https://mobbin.com/screens/95c9046d-63a6-4662-a8c6-5c9e6b6d276d); Halide Mark III's foot
  sheet carrying the date and the actions on one row (`holds`'s `strip`,
  https://mobbin.com/screens/1120c471-816b-401b-b057-2ee1967f073b).
- Captures: 48 PNGs, every option at 375 and at 1440, in the lane's scratchpad at
  `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/924675e3-0148-4e81-9dca-d9c2f1952d0a/scratchpad/media-viewer/shots/`
  (`shoot.mjs` beside them regenerates them against `pnpm dev -p 3131`). Reading each capture against its own words caught
  four real defects, all fixed and all commented where they bit: nine filmstrip frames black (`loading="lazy"` against the
  top window), an album with no viewer on it at all (`animation-fill-mode: both` holding an entrance at opacity 0 until an
  offscreen iframe runs it), "the album behind it at 100 percent" printed beside a frame that showed the wash (Tailwind v4
  resolves `bg-black/60` to `oklab(0 0 0 / 0.6)`, which an `rgba`-only parser read as zero), and the sheet's COVERED share
  reported as its lit one with the sign backwards.
- Assets requested from Will: **one real party clip** · a vertical phone video, 1080 by 1920 or 9:16, 4 to 8 seconds,
  H.264, under 1 MB at the lab's size, of a reception moment with people moving (a toast, a dance floor, confetti) ·
  replaces the stand-in `public/lab/media-viewer/clip.mp4`, an 85 KB pan across `mkt-wedding-toast-01.jpg`. Only
  `fixtures.ts`'s `CLIP_SRC` changes when it lands. Not blocking: the stand-in answers `video` today.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: `opening` at 375, because everything else on the board is staged inside whatever it answers, and the
  three grounds read differently the moment the album is behind them. Then `closeup`, where the measured caption is the
  argument: today a face in a group photograph is 36 px across on a phone and 58 px on a laptop, and no gesture in the
  product changes either number.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-19). `media-viewer` asked the surface every album click ends on as eight
decisions, four roots and four staged behind them, drawn on the real viewer's pieces over one open wedding of twenty-six
items from nine guests, phone first at 375 with 1440 on a knob. The viewer was quoted rather than mounted, because a radix
Dialog portals out of a lab frame and every option but today's replaces the component it would come from; one 85 KB clip
was committed because the browser's own control bar and a muted autoplay cannot be judged from a poster. Reading each of
the forty-eight captures against its own words caught four defects before the desk did, including a caption that told Will
the album was at full light beside a frame that showed the wash. It shipped no production byte; four seams the board does
not absorb went to the ROADMAP, and three open calls were carried on their recommendations.
