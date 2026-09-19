---
track: media-viewer
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

**The decisions (suggested; yours to recut, never forced apart).** THE OPENING (what a tap turns into: today's dialog over
black; the picture growing out of its tile into the same chrome; at a phone, a sheet that leaves the album peeking beneath);
WHAT IT HOLDS (the chrome around the picture: today's two pills and a counter; nothing until a tap, the picture alone;
one strip at the foot with who, when and the actions); WHO (today's attribution pill; the name alone, small, at the foot;
no name, the album speaks); NEXT (how the next photograph comes and how you know where you are: today's swipe, chevrons
and counter; a filmstrip of neighbours at the foot; swipe alone, the counter gone); CLOSE UP (a photograph up close: the
browser's pinch, as today; double-tap to zoom inside the viewer; pinch inside the viewer, staged after NEXT if the axis
matters); VIDEO (how a video plays: click-to-play with the OS controls, as today; muted autoplay with one tap for sound; a
play button alone, the controls arriving with playback); THE WAY OUT (the X and a centre tap, as today; swipe down to
dismiss, the album returning with the tile lit; the X alone); A LINK (does an open photograph have an address: none, as
today; a query on the album's link so Share opens THIS picture; Share sends the picture itself). Optional if it fits the
budget: ARRIVAL (how the big picture arrives: the pop, as today; the tile's own preview scaled up and sharpening; the
grid's skeleton). Every gesture option is a visual double drawn for the board, never a change to the engine. The seams a
decision does not absorb (the admin's Save-only viewer, Share missing from Uploads, the orphaned per-item report, the peek
grid's Escape) go under Deferred as ROADMAP lines, one each.

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

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board media-viewer` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The decisions, one line each: `<id>: the question; the options; the recommendation`
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
