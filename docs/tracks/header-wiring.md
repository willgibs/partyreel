---
track: header-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "7a875407"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/event-experience
  - src/components/guest/guest-header
  - src/components/guest/guest-action-dock
  - src/components/guest/guest-share
  - src/components/guest/guest-bar
  - src/components/guest/guest-upload
  - src/components/guest/upload-tracker
  - src/components/guest/reel/
  - src/app/(guest)/e/[token]/page
  - src/app/(app)/dashboard/[eventId]/page
  - src/app/(app)/dashboard/[eventId]/loading
  - src/app/(app)/dashboard/[eventId]/reel/
  - src/components/app/event-feed/event-cards-row
  - src/components/app/event-feed/room-card
  - src/components/app/event-feed/reel-card
  - src/components/app/event-feed/checklist
  - src/components/app/event-feed/event-hub
  - src/components/app/event-feed/host-album
  - src/components/app/event-feed/edge-fade-scroller
  - src/components/app/event-feed/event-gallery
  - src/components/app/event-feed/feed-section-header
  - src/components/app/share/
  - src/components/app/host-upload
  - src/lib/guest/use-upload-queue
  - src/lib/db/queries/head
  - src/components/ui/shutter
  - src/components/ui/code-mat
  - src/components/ui/code-chip
  - src/components/ui/glyph-count
  - src/components/ui/button
  - src/components/ui/badge
  - src/app/(dev)/design/(shell)/library/
  - src/components/marketing/help/step-screens/
  - docs/systems/guest-flow.md
  - docs/systems/host-app.md
  - docs/systems/design-system.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/event-header.json
  - src/app/(dev)/design/sandbox/event-header/
  - docs/systems/reel.md
  - src/lib/event/sections.ts
  - docs/systems/uploads-and-r2.md
  - src/components/guest/upload/intent-sheet.tsx
---

# lp/header-wiring

**Goal.** Wire event-header's three picks into production: the guest album opens on the cover, Maya's hub wears that same head with its sticky bar, and the shutter stands at the foot with his scroll fade and a matching right-hand button; the heads' new atoms are built in src/components/ui/ under the one contract identity r2 styles.

## The brief

**Why.** Will answered `event-header` r1 on 2026-10-02 (`docs/reviews/event-header.json`): `guest=cover`, `host=shared`, `stays=shutter`, each the board's recommendation. The drawings are `src/app/(dev)/design/sandbox/event-header/` (read only: its r2 lane is cut after you merge). His notes, verbatim:
- on `host=shared`: "Still don't love how we're presenting some of the metadata under the title (item counts, date, live, etc). Love how they're captured into a sticky menu on scroll for page-wide access. Currently hate how some actions open a sheet, some are a new page, some (reel) seems to flash a guest album as it loads the slideshow, etc. Very unpredictable handling across actions stemming from the same row. Annoying that I have to go all the way into and all the way back from a guest page, for example. Wonder if there's a better way to redesign the action cards to pair with this new host head direction?"
- on `stays=shutter`: "Maybe a gradient overlay from the bottom, between the album and shutter/share controls, when there is more to scroll, both hinting to continue scrolling and providing more contrast between the gallery and UI. Could also add another button to the right side of the shutter (similar secondary design as other side) to visually balance those controls symmetrically."

**What to build.**
1. **The album's head is the cover**, on every event: the reel's own stills dissolving edge to edge under the name; Add photos standing white on them, the reel and Invite beside it. The board's three carried calls are taken: the reel's tile above the album goes (the reel lives in the head: its stills and its numeral); counts are glyphs with their words on hover and a tap; over the cover the guest's header stands on the photograph in white with no rule, elsewhere it is today's. An empty album shows the house light, as drawn. A **sealed** album (disposable mode, whose server lands in a parallel lane: its stills read `event_stills`, which will exclude sealed shots) shows the house light the same way until it develops. Reduced motion stands the cover still on its first still.
2. **The hub wears the same head** (`host=shared`): one head component on both sides of the code, with Maya's counts and link on it, the code on its white mat, and the room cards under it. The sticky bar he loved carries the facts once the head scrolls away. Leave today's facts line under the title and the rooms' handling as they are: `event-header` r2, cut after you merge, redesigns both from his note above. One exception: if the reel's door from the hub can open straight into its player without first painting the guest album (`[eventId]/reel/` is the old room's redirect), fix that flash at its cause.
3. **What stays is the shutter**: one round Add at the foot's centre in the album's light; while hers send, its ring is their progress. His two notes are part of the pick: a gradient rising from the foot under the controls while more album lies below (it hints the scroll and gives the controls contrast over photographs) and gone at the album's end; and a matching secondary on the shutter's right, Invite's twin on its left. **Call, his to overrule:** the right-hand one plays the Highlight reel, so the foot mirrors the head's three acts (Invite, Add, the reel); say in your Questions what that slot holds before an album has a reel.

**The atom contract** (header-wiring builds these in `src/components/ui/`; identity r2 styles exactly these hooks in the lab at the same time, so the names are fixed):

| Hook | What it is |
| --- | --- |
| `data-slot="shutter"` | the round Add: `data-state` `idle`, `sending` or `done`, its progress in `--progress` (0 to 1) |
| `data-surface="photo"` | any container standing on a photograph |
| Button `data-variant="on-photo"` | the white primary on a photograph |
| Button `data-variant="glass"` | the glass round on a photograph (usually `size="icon"`) |
| `data-slot="code-mat"` | the code on its white mat |
| `data-slot="code-chip"` | the code as a chip in the sticky bar |
| `data-slot="glyph-count"` | an icon and a number, its words on hover and a tap |
| Badge `data-variant="live"` | the live mark |

Each is a real primitive (its states, keyboard and reduced motion, a Library catalog entry) used by the heads. The board's other new atoms (photo-filled type, the number door) are not in the picks: leave them unbuilt.

**Folded in:**
- red-team 40's LOW: opening or closing the hub's code card in a hidden tab throws two `InvalidStateError: Transition was aborted` (its view transition): a hidden document skips the transition.
- `HostUpload` still `router.refresh()`es the hub when a batch drains though the hub's album is the live store (the ROADMAP's Host line): drop it if the store already brings the batch.

**For the next lane.** `door-reveal` is cut after you merge: its walk-through grows the doorway past the screen and settles the album's photographs into place on your cover. Leave a named landing (the cover's first stills addressable by a stable hook) and name it in your Handoff.

**Boundaries.**
- `use-upload-queue.ts` is imported by twelve files (`door/wait-picks.tsx` among them): the ring's progress is an additive export, a derived selector; the queue's API does not move.
- The Add sheet itself (`upload/intent-sheet.tsx`) stays as it is: identity r2 draws it.
- `src/components/guest/door/` is door-reveal's next and the dashboard is `dashboard-wiring`'s now: never touched. A new read goes in a new file under `src/lib/db/queries/head*`, never in a shared queries file.
- System docs: `guest-flow.md` (the album's head, what stays), `host-app.md`'s event page section, `design-system.md` (the new atoms and the contract).

**The direction, one for every board and wiring this round** (Will's notes, 2026-10-02):
- **Bespoke and experiential**, sleek and modern (never vintage), sophisticated (never playful-messy: "for grids, I'd prefer not to get messy and begin tilting anything"), minimal yet high-information with far less text, and the bible's ten (`/design/library`: media is the color, premium is the floor).
- **Who it is for**, his words with this desk: "Want to ensure we feel bespoke without getting too dev-tool-ish, remaining a modern consumer app usable for anyone at any event (it's okay if grandma and grandad slip through, would rather frame this as cool to a younger expected host/guest crowd, probably 18 [parties] to 50ish [event guests, conference attendees). Don't want to build a boring app just for the least tech-friendly guests. Seems like our core entry -> upload -> view path is pretty clear for anyone."
- **His role**: "I'm just the tastemaker at this point - let's act accordingly, drive your best ideas across our site/app/platform as the world's leading design engineer." Build and draw your boldest real answer; he picks and steers.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:3131`; every head read in a headless Chrome of your own at 1440 and 375 with reduced motion honoured: the album full, empty and scrolled deep (the fade, the shutter, the right-hand button), the hub tonight and the week before, the sticky bar; sign-in and upload cannot run on localhost, so name those steps for build 43's red-team in your Handoff.

## Questions (a recommended answer each; the Orchestrator relays them)

- **What the shutter's right-hand slot holds before an album has a reel** (the brief's ask). Built: **Back to the
  top**, an ArrowUp round in Invite's outline that scrolls to the cover and hands a keyboard's focus to the event's
  name; the slot becomes the reel's Play the moment the reel can start (the host's switch on, a second photograph).
  Alternatives: the slot left empty (the foot lopsided), or Download all there. Recommend as built: the foot stays
  balanced and the cover's acts are one tap away (`event-experience.tsx`'s `twin`, `guest-action-dock.test.tsx`).
- **A sealed album on the hub's head** (disposable mode, its server in `disposable-foundation`): the guests' cover
  stands on the house light until it develops, since their payload never carries a sealed still; the hub's head
  reads her own album, which may. Recommend the house light there too, so she sees the night as her guests do
  (`host=shared`): one filter in `event-hub-head-stills.ts`'s `isCoverEntry` once the sealed flag reaches the host's
  manifest (Deferred). Nothing built: the flag is not on this base.
- **The cover at a desk**: its stills are the 640px previews every reel surface draws, which soften across a 1440
  window (the scrim and the dissolve carry them at a phone). Recommend keeping previews now and a cover rendition
  (about 1600px, one more derivative per photograph) as its own board (Board ideas).
- **Make your own from the album**: the tile's "Make your own clip to share" line went with the tile, so a guest
  reaches the creator from the reel's view, one tap past the cover's round. Recommend leaving it there (far less
  text on the cover); the view still honours a door that asks for the creator on arrival (`creatorAsked`) should a
  later board draw one.

## System-doc edits (in place, owned facts only)

- `guest-flow.md`: the album's head (the cover on every event; its ground always lit and its stills' one rule; the
  cover reading the page's seed, then the live album through the head's bridge; the guest header on the cover; the
  door-reveal's landing hooks); WHAT STAYS IS THE SHUTTER in place of the dock's paragraph (the ring, the fade, the
  flanks); the one Add (the empty state's own button gone) and the album's count label; the tracker's Remove for what
  waits; the reel's face is the cover (the tile's lines gone) and the owner's `?reel` curtain; the demo's header.
- `host-app.md`, the event page: its intro and its head (the guests' cover, hers; its stills' rule; the facts as
  glyphs and the live mark); the code beside the h1 on its mat; the sticky band's lead and code chip; the code card's
  hidden-document guard; the head's glyph counts among the hydrated-only tooltips; `HostUpload`'s `onBatchLanded`;
  the Reel card's door and its curtain.
- `design-system.md`: "The event's head: the atoms on a photograph" (the contract's table and its notes: a photograph
  is the room, `--progress` and its registered copy, a server page's glyph as an element, the head's own sheet), and
  its open-this-before line.
- Not made (a read of this lane, so the Orchestrator's): `reel.md`'s "The Highlight reel tile" bullet (line 80)
  describes `LiveReelTile`, which is gone; the reel's face is the cover ([guest-flow.md](../systems/guest-flow.md)).

## Deferred (ROADMAP one-liners, bucket named)

- Now · Help: `the-highlight-reel.mdx` (lines 22 and 52), `make-your-own-clip.mdx` (line 23) and `browse-the-album.mdx`
  describe the Highlight reel tile above the album; the reel now lives in the album's cover, its stills and its
  round (from `header-wiring`).
- Now · Marketing: the reel section's live tile (`sections/reel/live-tile.tsx`, `live-section.tsx`) and `careers.ts`'s
  "the tile at the top of the album" draw the retired tile, and `reel/poster-card.tsx` has no app consumer left
  (from `header-wiring`).
- Now · Admin: the live-reel kill switch's sheet says every event "loses its reel tile"
  (`admin/exports/live-reel-kill-switch.tsx`); it now takes the cover's reel round and the shutter's (from
  `header-wiring`).
- Now · Guests: `lib/guest/reel-tile.ts` is named and described for the retired tile while its `tileStills` is the
  cover's first pass; renamed with its next change (from `header-wiring`).
- Now · Guests: `GuestActionDock` draws the shutter under its old name, kept so the event-header and identity
  boards' imports stand; renamed when those boards retire (from `header-wiring`).
- Now · Host: on a sealed album the hub's head drops sealed shots in `event-hub-head-stills.ts`'s `isCoverEntry` once
  `disposable-foundation`'s flag reaches the host's manifest, if the Question's answer stands (from `header-wiring`).

## Handoff (replaces the chat report)

- **Commits**, pushed (`origin/lp/header-wiring` at `61c67e25` before this record): the work `765d37a9`; the sync
  `99634800` (`git merge origin/launch-prep` at `ec9f8c3f`: dashboard-wiring had edited `route-skeleton.tsx` and the
  Library's compositions catalog on its side; merged clean, specimens unchanged on regeneration); `61c67e25`,
  comments only (the reel's comments stop naming the retired tile).
- **Gates on `61c67e25`**, the synced tree, each its own exit code, logs in
  `/Users/gibby/local/ai/partyreel-wt/_scratch/header-wiring/`: `pnpm typecheck` 0 (`typecheck.log`); `pnpm lint` 0,
  no warnings (`lint.log`); `pnpm test` 0, 764 files and 9035 tests (`test.log`); `zsh scripts/build-lock.sh pnpm
  build` 0 (`build.log`); `pnpm lab:smoke --base http://localhost:3131` 0, 168 checks and 0 failing (`smoke.log`).
  Not a board, so no `lab:demo`.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`, 57 paths): owned paths and this file, plus four
  exceptions:
  - `src/app/(dev)/design/gallery/playgrounds.tsx`: the Library's knob lists must equal the atoms' cva keys, so
    Button's `on-photo`, `glass` and `icon-cta` and Badge's `live` take their knobs.
  - `src/app/(dev)/design/gallery/specimens.generated.json`: the generated specimen source, regenerated by
    `collect-specimens.mjs` after the catalog changed (`specimens.test.ts`).
  - `src/components/shared/route-skeleton.tsx`: `HubSkeleton` holds the head's dark room at its own height in place of
    the retired code-and-title stack, or the hub jumps as it streams in.
  - `src/components/marketing/mock-parity.test.ts`: its Highlight reel cases read the retired tile's words in
    `live-reel.tsx`; they read `src/lib/event/sections.ts` now, and the tile's clip-line case left with its scar.
- **Items**:
  1. The album opens on its cover (`guest/event-experience-head.tsx` and `.css`, composed in `event-experience.tsx`):
     the reel's opening stills (else the newest) dissolving in CSS over the house light, the name, the byline, the
     note, Add white on the photograph, her tracker, the reel's round and Invite in glass; its first paint from the
     page's seed (`CoverGround`), then the live album's through the head's bridge.
  2. The reel's tile above the album is gone (`reel/live-reel.tsx`): its controller publishes the cover's stills and
     the reel's door to the head.
  3. The guest header stands on the cover in white with no rule (`guest-header.tsx`'s `over`, `guest-header-cover.ts`),
     paper elsewhere (the door's stage, the demo once it moves).
  4. The hub wears the same head (`event-feed/event-hub-head.tsx`, `event-hub-head-stills.ts`, `[eventId]/page.tsx`):
     the stills by the guests' rule, the facts as glyphs with the live mark, the link, the code on its mat.
  5. The sticky band leads with the cover's still and the name and closes on the code chip while the head's code is
     off screen (`event-cards-row.tsx`).
  6. The reel door's flash, fixed at its cause: the guest page's server knows its owner asked for `?reel`
     (`e/[token]/page.tsx`'s `reelAsked`), so the page wears the reel's black until its view is up (the curtain in
     `event-experience.tsx`; `event-experience.head.test.tsx`).
  7. What stays is the shutter (`guest-action-dock.tsx`, `ui/shutter.tsx`): one round Add at the foot in the album's
     light, its ring the run's progress (`useRunProgress`, additive in `use-upload-queue.ts`), a check for the beat a
     run lands whole; Invite left, the reel right (Back to the top before a reel); the gradient from the foot while
     more album lies below, gone at its end.
  8. The contract's atoms: `ui/shutter`, `ui/code-mat`, `ui/code-chip`, `ui/glyph-count`, Button `on-photo` and
     `glass` (with `icon-cta`), Badge `live`, each with its tests and a Library entry; the cover, the hub's head and
     what stays as Library compositions (`album-cover`, `hub-cover`, `what-stays`).
  9. Folded in: a hidden tab never starts the code card's view transition, and an aborted one is let go
     (`share/event-share-provider.tsx`, `event-share-morph.test.tsx`); `HostUpload` asks the album's store once per
     landed batch instead of refreshing the router (`host-upload.tsx`'s `onBatchLanded`).
  10. The addendum: her tracker gives each upload of hers that waits (held, and sealed once those ride
      `/api/guests/mine`) a Remove, `remove_my_upload` for an account (`removeMyUploadGuestAction`) and
      `/api/guests/remove` for a ticket; Removing with a spinner, then gone or "Couldn't remove it" with Try again; it
      leaves the in-flight count at once (`upload-tracker.tsx`, `upload-tracker.test.tsx`).
- **The door-reveal's landing**: the head is `[data-event-head="album"]`, its photographs `[data-head-stills]` (the
  count of distinct stills), each still `img[data-head-still="<slot 0-5>"]`, slot 0 the one at rest (`data-rest`)
  and the one a reduced-motion reader sees; pinned in `event-experience-head.test.tsx`.
- **Verified locally** (my own headless Chrome, reduced motion; captures in the scratch folder): the demo album at 375
  and 1440, light and dark, at the cover, mid-album and deep (the fade on, gone at the album's end; the shutter,
  Invite and the reel's round): `demo-*.png`, and `sync-375-*.png` on the synced tree; an empty album's first paint
  without script at both widths (the house light, "Add the first photo"): `empty-*.png`; the Library's album cover,
  the hub's head (tonight, the week before, scrolled into the album) and the stuck band with its lead and chip:
  `lib-*.png`. Localhost cannot draw the album's tiles or the reel's canvas (R2's CORS allows the allow-listed
  origins only); the cover's plain `<img>` stills do load.
- **Build 43's red-team** (sign-in and upload cannot run on localhost; the account chooser only):
  1. The hub signed in as the host: an event with photos tonight (the stills dissolving, the mat opening the code
     card, the glyphs' words on hover and a tap, Live) and one the week before (the house light); scroll until the
     band sticks (its still, its name, the chip opening the card); open and close the card with the tab hidden (no
     `InvalidStateError` in the console).
  2. The hub's Reel card into the album at `?reel`: black from the first byte to the playing reel, never the album;
     closing the reel lands on the album.
  3. A host upload on the hub: the batch drains into the album with no router refresh (no RSC refetch after it lands).
  4. A guest upload on the album (Will's file pick): the ring fills with the run, the count on its shoulder, the check
     for a beat when all land; a refused file leaves no check.
  5. A hold-for-approval album: Remove on a waiting upload, signed in and as a ticket guest; the row leaves and the
     host's Review never sees it; a failure reads Try again.
  6. The album on the alias at 375 and 1440: the tiles and the reel's canvas over R2, the cover's dissolve, the header
     on the cover, the foot's fade, reduced motion standing the cover on its first still, a phone's safe area under
     the shutter.
- **Assets requested from Will**: none.
- **Board ideas**:
  - A cover rendition (about 1600px) for the album's cover and the hub's head at a desk, where the 640px previews
    soften.
  - The guest album's own sticky band: once the cover scrolls away, its header could carry the event's still and name
    as the hub's band does.
  - A Make your own door from the cover (the reel view's `creatorAsked` has had no opener since the tile went).
  - Marketing's reel section and the help's reel pages redrawn on the cover (Deferred).
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none.
- **Calls his to overrule**:
  - At a phone the cover's byline carries no counts (the album's own label under the cover says it); at a desk they
    ride it as glyphs.
  - The album's cover is `clamp(26rem, 74svh, 34rem)` tall, so the album's first row peeks at a phone; the hub's head
    is 20.5rem, 25rem from `sm`.
  - The hub's facts line is today's facts worn as the contract's atoms (glyph counts, `Badge` live), otherwise left
    for `event-header` r2.
  - The shutter's check (1.6s) shows only for a run that landed whole; a refusal leaves the tracker to speak.
  - The foot's gradient is the page's own ground rising 9rem from the foot while the album's end is off screen.
  - The tracker's Remove has no confirm (none of its other removes has one).
  - The reel's curtain is the owner's alone (the server knows her `?reel`); a guest's `?reel` link meets the door
    first, as today.
  - The demo's "Start your own" rides the cover's row in glass (full width at a phone), and its pinned header turns
    paper once the page moves.
- **Look at first**: `/demo` at a phone (the cover, then the foot), then the Library's `album-cover`, `hub-cover` and
  `what-stays` (`/design/library/<id>?key=`).
