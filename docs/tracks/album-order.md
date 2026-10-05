---
track: album-order
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "e123a6a9"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/shared/album-order
  - src/components/shared/album-window
  - src/components/guest/gallery-
  - src/components/guest/event-experience
  - src/components/app/event-feed/event-gallery
  - src/components/app/event-feed/host-album
  - src/lib/event/hub-album.ts
  - docs/systems/guest-flow.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/customize.json
  - src/lib/events/album-wire.ts
  - src/app/(dev)/design/sandbox/customize/spec.ts
---

# lp/album-order

**Goal.** The album turns once the party is over, guests keep a simple sort and filter, and arrivals that land out of sight are said without ever moving what she is looking at.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3133 is yours; 3000 is Will's desk.

**From Will's desk 3 answer:** customize r1's order = turns ("Newest first while the party is on; from the morning after its last day, or its develop, the night in order"). His note: "I like this, but it would feel weird to scroll backwards through time if we have a good idea of when the event is over to flip, which we usually do. However, guests should always have sort/filter available to browse the gallery as they'd like, doesn't need to be overcomplicated." And his question, which this lane answers in the product: "for any gallery not sorted by most recent, when a new media item/batch lands not first into the gallery, what is that animation and how does it constantly impact a user's gallery experience when they are scrolled down? Don't want anything new to push out what they're looking at, especially at big events with more frequent uploads. You're in the gallery looking at a group of photos, then 200 new ones come in and you have to scroll for ages to find what you were looking at again."

Each pinned by a test that fails on the old code:
1. **The turn, as presentation:** newest first while the party is on; in order from 9 am the morning after its last day (the event's zone: the zone the develop time was picked in) or at its develop for a disposable; an undated album stays newest first (a host's "in order now" for it is a Deferred line: no column now). "In order" runs on ARRIVAL (`created_at`): a kept capture time is Will's open privacy question (X7), never assumed; it also keeps the in-order album append-only. The wire stays as it is (`album-wire.ts` bakes `(created_at desc, id desc)` into the manifest and the delta protocol; the CDN-cached version lever rides it): reverse and filter client-side over the same manifest; the engine lays rows from whatever order it is handed.
2. **The guest's sort and filter:** Newest/Oldest and Photos/Videos/Yours, nothing more, reusing the host's control (`event-gallery.tsx`'s `HubSort`), remembered per device, defaulting to the turn. No person filter, no date groups.
3. **The arrivals pill:** the album already holds the reader's place by hand (`album-window.tsx`: nothing a reader is looking at moves; Safari included; a flick's momentum waited out). Add one quiet "N new" pill, shown only when arrivals land out of view, under the bar (never over the album's head), with the direction it takes her, cleared when she reaches them, reduced motion landing at once; the host's hub album too. A carried call Will may overrule: draw it once in your Handoff's capture.
4. **Edge cases, each a test:** undated and never closed; multi-day (the morning after its LAST day); a disposable (turns at the develop; later uploads append); the zone; the turn moving under a reader (the anchoring holds; the pill says where); a batch of 200 landing above and mid-album.

Not yours: `src/components/shared/masonry.tsx` and the viewer (back-layers, merging); Settings (settings-wiring). Wiring rigor: the whole gate; walked on your port at 375 and 1440 as a guest (the host's hub needs port 3000's sign-in: list it for the Orchestrator's desk walk).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Q1 The night in order's key (X7, Will 2026-10-05: "keep the capture time").** Recommended, built: in order runs on
  when each was taken wherever an item carries a capture time, else when it arrived, behind one function
  (`happenedAt` in `src/lib/shared/album-order.ts`, reading `takenAtOf`, which answers null until the capture-time lane
  carries `media.captured_at` on the wire: that lane changes that one function and nothing else). Newest first stays
  by arrival (the live feed). The host's Oldest first reads the same key. With capture times the in-order album stops
  being append-only (a late upload taken at the party lands mid-album): pinned with a fixture carrying a capture time,
  the anchoring holds and the pill points to where it landed. Nothing added to the wire or the database here.
- **Q2 Whose 9 am.** No event keeps a zone yet (ROADMAP's develop-zone line), so recommended, built: the reader's own
  zone, read by the page's server from the request (`x-vercel-ip-timezone`, the dashboard's day's own source) else the
  server's, and that same zone handed to the browser so the first paint and the hydration agree. `albumTurnAt` takes
  the zone as an argument, so the event's own zone drops in when that column lands.
- **Q3 The first paint must already be in her order, which crosses five files outside `owns`.** The seed embeds the
  links of exactly the first paint's photographs (an in-order album painted from newest-first links would shimmer, or
  flip at hydration), and the guest's View menu is assembled in `live-gallery.tsx`. Recommended, built, each edit
  minimal and none owned by an open lane: `src/app/(guest)/e/[token]/page.tsx` (the zone and the remembered order read
  from the request, handed to the seed and the page), `src/lib/events/gallery-access.server.ts` (the seed's first-paint
  order: one field) and its test (one case), `src/components/guest/live-gallery.tsx` (Sort and Filter in its View menu,
  the order and the filter applied) and its test (the Showing tests reshaped to Filter, their scars kept).
- **Q4 Remembered per device.** Recommended, built: the sort, per album, and only as a departure from the turn
  (choosing the album's own order again forgets it, so the album keeps turning for her), in a small cookie the page
  reads (`pr_album_sort`, the `pr_album_w` way) so her first paint is already her order. The filter stays this visit's
  (as Yours was): remembered, it would open a returning guest's album on a slice of it, and Yours cannot be known before
  her uploads are read. Overrule: the filter remembered too.
- **Q5 The pill.** Recommended, built: it counts what the album calls an arrival (someone else's photo, a late
  approval), never her own upload (the sweep and her tracker say hers); one press takes her to the top of the nearest
  landing, the arrow pointing that way; a landing (its run of rows) clears the moment she reaches it, by the pill or her
  own scroll; landings on both sides count together and the arrow points to the nearer. It stands under the page's bar
  and only once she is past the album's first row, so it never covers the head or the cover.
- **Q6 The turn under a reader.** Recommended, built: the album turns live at its moment (a timer, and a return to the
  tab), her photograph held on its pixel; a reader who chose an order keeps hers. The demo never turns (it is the party
  in progress, and its turn card sits beside the album's first tile, which is the photograph a visitor just added).
- **Q7 Photos and Videos.** Recommended, built: offered only where the album holds both kinds, Yours only while she
  owns one, no Filter group where none applies; a filter left empty falls back to All (Yours' old rule, for each).
- **Q8 The host's hub.** Recommended, built: it takes the pill but does not turn (her working view stays newest first,
  her Sort per visit as today), and a teaser's nine never turn.

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md`: "The album, in justified rows" refined (the first paint in the order it opens in,
  `albumFirstPaintIds`; her lens); a new bullet beside it, "The album's order turns once the party is over" (the turn,
  the capture-time key, whose 9 am, the first paint's order, the live turn, what is remembered); the arrival grammar's
  "One she cannot see is said" (the pill); "And which tiles are a guest's own" refined for Size, Sort and Filter.
- Proposed for docs this lane does not own (the Orchestrator's to place): `host-app.md`, beside the hub's album, "an
  arrival out of the host's sight wears the album's pill under the stuck band (`event-gallery-news.ts`, guest-flow.md's
  arrival grammar)"; `design-system.md`'s album tile, after "Nothing a reader is looking at moves", "and what lands out
  of sight is said by one glass pill (`album-window-news.tsx`)".

## Deferred (ROADMAP one-liners, bucket named)

- Now · Guest: an undated album never turns: a host's "in order now" for it (no column now).
- Now · Host: See it as a guest lays the album newest first after the turn (`as-guest-view.tsx` hands `LiveGallery` no
  order); hand it the guests' order from its server read.
- Now · refine the develop-zone line: the zone kept beside the develop time also turns the album, for every reader (the
  turn reads each reader's own 9 am until then: `albumTurnAt` takes the zone).

## Handoff (replaces the chat report)

- **Commits, pushed:** `6c58472be` (the work), `4513a2edf` (follow-ups, guest-flow.md), `41380aa80` (the sync: a merge
  of `origin/launch-prep` at `a90d27cb8`, no conflict), `37b9aaf34` (one more pin), then this manifest. After the sync
  launch-prep took records and `d6bfc64a0` (masonry's Strict Mode fix, not in this lane's reads, no overlap).
- **Gates on the synced tree at `37b9aaf34`, each its own exit code** (logs in `_scratch/album-order/gate-*.log`):
  `pnpm typecheck` 0; `pnpm lint` 0; `pnpm test` 0 (1015 files, 12639 tests); `zsh scripts/build-lock.sh pnpm build` 0;
  `pnpm lab:smoke --base http://localhost:3133` 0 (173 checks: customize, event-header and identity reached).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the owned prefixes, this file, and five exceptions
  (Q3: no open lane owns them): `src/app/(guest)/e/[token]/page.tsx`, `src/lib/events/gallery-access.server.ts` and
  `.test.ts`, `src/components/guest/live-gallery.tsx` and `.test.tsx`. The page reads `resolveViewerZone` from
  `src/lib/dashboard/viewer-day.ts`, which crumbs-82 now owns (a read, never an edit).
- **1, the turn as presentation** (`src/lib/shared/album-order.ts`, `src/components/guest/gallery-order.ts`, the page,
  `live-gallery.tsx`): newest first while on, the night in order from 9 am after the last day (the reader's zone) or
  at the develop; undated and the demo never; the seed links the opening order's first paint (`albumFirstPaintIds`);
  the page turns it live. Pinned: `album-order.test.ts` (undated, a range's LAST day, a disposable at its develop, the
  zone in LA, London, Auckland, Kolkata and Sydney, both DST nights, an unreadable zone), `gallery-order.test.tsx`
  (the timer, a return to the tab, a Develop now), `live-gallery.test.tsx` ("the album's order and her lens": the rows
  handed the night in order from its start; an arrival appends), `album-window-plan.test.ts`, the seed's one case.
- **2, the guest's sort and filter** (`gallery-view.ts`): Size, Sort (the host's `sortViewGroup`), Filter (All,
  Photos, Videos, Yours (n), each only with something to show; `lensAlbum`); her order remembered per album as a
  departure (`pr_album_sort`), her lens per visit. Pinned: `gallery-view.test.ts`, `live-gallery.test.tsx`.
- **3, the arrivals pill** (`album-window-news.tsx` over `album-window.tsx`; guest `gallery-rows.tsx`, hub
  `event-gallery.tsx` + `event-gallery-news.ts`): judged once as it stands in the rows, the pill under the stuck chrome
  (`barBottom`), past the head only, a landing cleared whole on reach, smooth press (instant reduced, focus by keyboard),
  down under a dialog. Pinned: `album-window-news.test.tsx` (21), `gallery-rows.test.tsx`, `event-gallery.test.tsx`.
- **4, the edge cases:** the turn under a reader (her photograph's pixel held; the pill flips to where the news now
  lies), a batch of 200 above (the anchor's exact scroll; "200 new" up; press, reach, clear) and with a late approval
  below ("201 new" pointing to the nearer, then "200 new" up), a disposable's later uploads appending, and X7's
  fixture: a late upload taken at the party lands mid-album by `happenedAt`, the anchoring holds and the pill points
  to it (both sides pinned).
- **Walked locally on a production build at 3133, a headless Chrome of my own** (captures in `_scratch/album-order/`):
  a turned album (Arrival wiring develop, its develop reached) opens 01, 02, 03 at 1440 (`look-781ccf-1440-2.png`) and
  375; View at 1440 and 375 (`view-781ccf-1440-1-menu.png`, `view-781ccf-375-1-menu.png`); Newest first written to the
  cookie, the same first paint after a reload, forgotten by choosing Oldest; Videos on Reel lane probe ("Showing
  videos 4 · Show all", `view-bbc329-1440-2-lens.png`). **The pill with real uploads from a second guest** on crumbs-76
  free: newest first ↑ at 1440 and 375, in order ↓ at 1440 and (after the sync) 375, the reader's photograph on the
  same pixel each time (110/110, 96/96, 160/160, 181/181), the press landing on the arrival
  (`pill-newest-1440-1-pill.png`, `pill-newest-375-1-pill.png`, `pill-oldest-1440-1-pill.png`, `*-2-landed.png`);
  the hub's album in the lab, 30 arrivals ↑, anchor 210/210 (`host-1440-1-pill.png`, `host-1440-pill-zoom.png`).
- **Test data:** name-only test guests joined the disposable albums above; each walk's upload was taken back by its
  guest except the first, one `landscape-1600x1200.jpg` by "Pill adder" on crumbs-76 free (its session went with its
  profile), the host's to delete.
- **For the Orchestrator's desk walk (3000, signed in):** the hub's pill under the app header and the stuck cards
  band (folding into pills since event-header-wiring) at 1440 and 375, its press, and the hub's Oldest first.
- **Assets requested from Will:** none.
- **Board ideas:** the album's pill and the Review room's "N new" are drawn twice (`album-window-news.tsx`,
  `review-section.tsx`): one atom; the pill could lead with the newest arrival's own picture beside its count
  (pictures before numbers); the hub's Sort could be remembered as the guest's is.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none (one new functional cookie,
  `pr_album_sort`, client-written, `Path=/e`, for the launch's cookie list if `/privacy` keeps one).
- **Calls his to overrule:** the 9 am is the reader's zone until the event keeps one; the sort remembered per album
  only as a departure, the filter per visit; the demo never turns; the pill counts others' arrivals, never her own
  upload; a landing clears whole when reached, and the pill waits until she is past the album's first row; the hub
  does not turn (its Oldest first reads the guests' key); the album turns live under a reader, anchored; Photos and
  Videos offered only where both kinds stand, without counts.
- **Look at first:** `pill-newest-375-1-pill.png` and `host-1440-1-pill.png` (the carried call, drawn once), then
  `look-781ccf-1440-2.png` (the night in order).
