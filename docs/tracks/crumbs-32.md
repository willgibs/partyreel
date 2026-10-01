---
track: crumbs-32
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "d53b02cb"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/export/
  - src/components/ui/popup-back.ts
  - src/components/ui/popup-back.test.tsx
  - src/components/social/guest-list.tsx
  - src/components/social/guest-peek.tsx
  - src/lib/social/cards.ts
  - src/app/(guest)/e/[token]/page.tsx
  - src/app/(guest)/e/[token]/page.test.tsx
  - src/app/(guest)/e/[token]/page.host-card.test.tsx
  - src/app/(guest)/e/[token]/page.own-delete.test.tsx
  - src/lib/db/mutations/guest-media.ts
  - src/lib/db/mutations/guest-media.test.ts
  - src/lib/guest/reconcile-album-items.ts
  - src/lib/guest/reconcile-album-items.test.ts
  - src/components/guest/gallery-live.tsx
  - src/components/guest/live-gallery.tsx
  - src/components/guest/live-gallery.test.tsx
  - src/components/guest/event-experience.tsx
  - src/components/app/event-feed/bulk-bar.tsx
  - src/components/app/event-feed/bulk-bar.test.tsx
  - src/components/app/event-feed/feed-section-header.tsx
  - src/components/app/event-feed/event-gallery.tsx
  - src/components/app/storage/
  - src/components/app/dashboard/grace-banner.tsx
  - src/components/app/dashboard/grace-banner.test.tsx
  - src/components/app/dashboard/storage-meter.tsx
  - src/app/(app)/dashboard/page.tsx
  - src/components/app/media-grid.tsx
  - src/components/app/media-grid.test.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
  - docs/systems/guest-flow.md
  - docs/systems/uploads-and-r2.md
---

# lp/crumbs-32

**Goal.** Seven ROADMAP items: the owner's Delete true on her guest page, an export walk surviving a reload, the bulk bars' 44px targets, a place popup's link leaving no dead Back, a guest's own upload landing once, the over-cap banner's door to the size list, and two dead optional props gone.

## The brief

Seven items the ROADMAP holds (each is its line there; find it by the words quoted), each fixed at its root with a test that fails on today's code:

- **The owner's Delete on her guest page** (from `crumbs-31`).
  - "the owner's Delete on a photo she just added on her album's guest page" says the guest's "can't be recovered" until the album's next sync hands the tile its `isHost`, though `remove_my_upload`'s host arm puts it in her Deleted.
  - After a reload that page offers her no Delete on her own uploads at all: `canDeleteIds` reads guest rows only, where the hub offers it.
  - Make both true from the first frame.
- **A reload mid-export** (from `export-wiring`): "a walk lives in the page, so a reload mid-walk forgets it". Keep its cursor in sessionStorage, so the next part is offered again.
- **The bulk bars' touch targets** (build 15's red-team): "in a hand the bulk bars' icon buttons are 28 by 28 and Download sits 32px from Remove to Deleted". Give them the 44px the peek's verdicts use, and keep the destructive one apart.
- **A link inside a place popup** (from `claims-wiring`): it "navigates away and leaves the place's same-URL history entry behind, one dead Back" (the claims review's Open album, the look's Open full profile). The place takes its entry back as a link inside it navigates (`ui/popup-back.ts`).
- **A guest's own upload fading in twice** (from `crumbs-23`, "unmeasured"). `MediaTile`'s `sameObject` is false across her object URL and the presigned preview, so the landing resets to the shimmer and fades in a second time. Measure it in a local walk first, then make the swap seamless if it is real, or retire the line with the measurement if it is not.
- **The over-cap banner's door** (from `storage-wiring`): "the over-cap grace banner says 'largest files first' with no door". It opens the size list with her own cap as the goal.
- **Code hygiene** (from the marketing refresh): `GuestListItem`'s optional `kind` (`guest-list.tsx`) and the optional `seed` in `lib/social/cards.ts` have no lab caller left to protect. Remove what nothing reads.

**Verify:**
- the gate;
- each item's test red on today's code;
- on localhost, drive what runs there.

The hub, the host's own guest page and the export walk cannot run signed in on localhost, so name their steps for the next build's red-team in your Handoff.

**Will's desk is up:** `locked-door`, `event-ready` and `disposable-mode` describe the door, the hub and the guest page. Change no word or behaviour their asks describe; `entry-modal.tsx` and the door stay untouched. If the lab crawl's PREMISE line names a board, say in your Handoff why its asks still hold.

**Paths:** your owns are a start. Add each file to `owns` in your manifest before editing, or name a one-line exception. No SQL.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended; none is a one-way door.

- **In a hand, while selecting, the album's header gives its row to the bulk bar (built).** Five 44px verbs, All/Clear
  and the count do not fit beside "ALBUM 1,234" at 375 (measured: the bar alone runs 348px of the row's 351), so the
  label steps aside (kept for a screen reader, `actionFills`) and comes back when the selection ends; the band stays
  28px, so nothing bounces. **Recommended**: it is the platform's own contextual bar (the title yields to the
  selection's verbs). Overrule → a second row for the bar (the album moves down as Select opens), or smaller targets.
  Review's two verdicts and the size list's footer fit beside their labels and keep them.
- **The destructive verb's hairline shows at a desk too (built)**, one rule for the bar (21px at a desk, 17px in a
  hand). **Recommended**: the lightbox already groups its verbs with a rule. Overrule → hand only.
- **A walk a reload brought back says what it said before the reload (built):** "Part 1 of 2 is downloading. [Get part
  2]", no new words. **Recommended**: the browser's download manager may still hold that part, and the offer is the
  same tap. Overrule → new words, e.g. "Part 2 of 2 is next."
- **Her own plan's goal counts to her plan's cap, the meter's number (built)**, not the sweep's line (it clears a
  grace at the upload headroom, 10% above), so reaching it always ends the grace. Its words: "5.3 GB left to free to
  fit your plan", then "Enough selected to fit your plan" (only selected: the bar's Remove to Deleted finishes it), then
  "Enough freed to fit your plan"; no button, since there is nothing to switch. **Recommended.** Overrule → other
  words, or a Remove button in the strip.
- **The banner's door reads "See plans or see what's using space." (built)**, the meter door's own name for the size
  list. **Recommended.** Overrule → other words.
- **The meter's own door carries the same goal whenever she stores more than her cap (built)**, the ROADMAP line's
  second clause, so the meter and the banner open one list. **Recommended.** Overrule → only the banner's door.
- **Her own upload lands once by taking its link in place over her object URL (built)**, scoped to a tile showing an
  object URL (`blob:`); any other new object under a tile still lands as a photograph (shimmer, fade), as crumbs-18
  pinned. **Recommended**: an object URL is only ever this device's own picture of the photograph its link serves.
- **A link inside a place takes the place's entry by itself (built)**: any plain click a `Link` would navigate in this
  tab, to another page of the site, while the window stands on a place's own entry, so a future link needs no
  opt-in. **Recommended.** Overrule → a `replace` each link opts into.

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md`: the owner's own on her guest page (the host's read, `hostOwn` from the first frame), in
  "A guest's own photographs, removable ever"; her own upload lands once, in "Optimistic tiles".
- `docs/systems/host-app.md`: the grace banner's two doors and the meter's goal, in "The storage line"; the bulk bars'
  hand targets, the hairline and `actionFills`, in "Album bulk select".
- `docs/systems/uploads-and-r2.md`: a walk between parts survives a reload, in "Past one zip's ceilings".
- `docs/systems/design-system.md` (a one-line exception: the home of the place popup's history rule): a link inside a
  place takes the place's entry with it.

## Deferred (ROADMAP one-liners, bucket named)

- Code hygiene: `DemoTicket` has one bare caller (the Library specimen), and `components/lab/scene.tsx` still names the
  retired boards (from `marketing-refresh`; the rest of its line, `GuestListItem`'s `kind` and the cards' `seed`, landed
  in crumbs-32).
- Billing: in a hand, Back from Stripe (Checkout, change-plan's confirm, the billing portal), left by a full navigation
  from inside the plan sheet (a cover, a place), lands on the sheet's same-URL entry with nothing open, one dead Back:
  `popup-back.ts` now takes its entry with a `Link`'s click, not a `location.href` (from crumbs-32).

## Handoff (replaces the chat report)

- **Work `dada4dea`**, pushed to `origin/lp/crumbs-32`; no sync: `origin/launch-prep` had not moved past `3826bda0`
  (fetched before the handoff).
- **Gates on `dada4dea`**, each on its own exit code (logs `../partyreel-wt/_scratch/crumbs-32/gate2-*.txt`):
  typecheck 0, lint 0, test 0 (674 files, 8,061 tests), build 0, `pnpm lab:smoke --base http://localhost:3131` 0 (148
  checks, 0 failing). No board, so no `lab:demo`.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = owned paths + the four system docs (Record
  subtractively; `design-system.md` the one exception above) + this file. The brief's owns named two paths that do not
  exist (`app/export-dialog.tsx`, `shared/guest-list.tsx`): `app/export/` and `social/guest-list.tsx` took their place.
- **PREMISE** (smoke): `disposable-mode` (guest-flow.md, uploads-and-r2.md, event-experience.tsx; its drawing imports
  `feed-section-header.tsx`), `event-ready` (host-app.md; imports `storage-meter.tsx`) and `locked-door`
  (guest-flow.md, the guest page; imports `popup-back.ts`). Their asks still hold: no word, step or design they draw
  moved. `actionFills` is opt-in and none of their headers passes it; the meter's goal appears only over the cap and
  event-ready's meter draws under it; the place's link rule acts only on a place in a hand holding its entry. The
  camera, the waiting room, the wall, the host's peek of the roll, the roll's save, the checklist, What needs you, the
  door's family, shape, wait and lost read none of the owner's Delete, the export's reload, the bars or the banner.
- **The items**, each test red on the old code (the old files swapped back; `_scratch/crumbs-32/item*-red.txt`):
  - The owner's Delete → `listOwnerMediaIds` (`guest-media.ts`, her own RLS client) for the owner in the page;
    `isOwner` → `hostOwn` (`reconcile-album-items.ts`) and the optimistic tile's `isHost` (`gallery-live.tsx`). Red 7:
    `page.own-delete.test.tsx` "★ are the host's own read…", `guest-media.test.ts` "the owner's own photographs on her
    guest page" (3), `live-gallery.test.tsx` "the owner's own uploads are the host's from the first frame" (3). Local:
    a signed-out guest's own Delete still says "can't be recovered" (her words, unchanged).
  - A reload mid-export → `export-walk.ts` keeps a walk between parts (`keep`, `between`, `resume`,
    `readSavedWalks`), `use-export-download.ts` the sessionStorage store and the resume a tick after mount. Red 5:
    `export-walk.test.ts` "a reload between parts". Local (`item2-measurement.txt`): a seeded walk on the guest page
    came back after a reload as "Part 1 of 2 is downloading. [Get part 2]"; its x emptied the store.
  - The bulk bars in a hand → `HAND_TARGET` / `HAND_TARGET_BORDERED` and `Apart` (`bulk-bar.tsx`), `actionFills`
    (`feed-section-header.tsx`, `event-gallery.tsx`). Red 3: `bulk-bar.test.tsx` "BulkBar in a hand". Measured at 375
    (`item3-measurement.txt`): every control 44px or more in all three bars, the band 28, no overflow, Download and
    Remove 61px apart (were 32); 28x28 at a desk.
  - A place popup's link → `popup-back.ts` (`pageLinkHref`, the capture click, `router.replace`). Red 2:
    `popup-back.test.tsx` "a link inside a place in a hand". Under `next dev` with a real `Link`
    (`item4-measurement.txt`): new, the link replaced the place's entry and one Back landed on the page beneath; old,
    it pushed and the second Back changed nothing (the dead Back).
  - Her own upload landing twice → measured real first (`item5-measurement.txt`: a local walk, R2's PUT forwarded by a
    scratch proxy since R2's CORS refuses localhost; the link landed 494 ms after her photograph, the tile sat on the
    shimmer 344 ms and faded in again), then `media-grid.tsx` takes the link in place over a tile showing an object
    URL. Red 2: `media-grid.test.tsx` "MediaTile and her own upload". Re-measured: no class change, no shimmer, the
    object URL drawn (`currentSrc`) until the preview loaded. The walk's three test photos were deleted by their guest.
  - The over-cap banner's door → `grace-banner.tsx` (the page's banner, extracted), `StorageGoal`'s `fit` kind
    (`storage-list.tsx`, `storage-list-body.tsx`, `goal-strip.tsx`, `fitStep`), the meter's door
    (`storage-meter.tsx`). Red: `storage-list.test.tsx` "her own plan's goal" (2), `grace-banner.test.tsx` (no door on
    the old banner). Local in a 375 probe (`item6-measurement.txt`): counting, enough selected, enough freed.
  - Code hygiene → `GuestListItem`'s `kind?: "profile"` gone (`"kind" in item`, `guest-list.tsx`, `guest-peek.tsx`);
    `ProfileCardItem.seed` required (`cards.ts`), the list's own type optional for the credit's look. No behaviour to
    pin red: the typecheck is its proof (every `withAvatarUrls` caller compiles on the required seed).
- **For the next build's red-team** (what localhost cannot sign in to):
  - The owner's Delete: willg97 at 375 on an album he hosts, `/e/<token>` → Add photos → Send 1 → open it → Delete:
    the host's words (Deleted, 30 days) at once; Delete → it is in the hub's Deleted. Reload, open one of his own
    (one added on the hub too) → Delete is there, the host's words. A guest's photograph there shows him no Delete.
  - The export walk: needs an album past 2,000 items or 20 GB (none on the alias; the Scale probe holds 1,200): Download
    all → Everything → once part 1 starts, reload → "Get part 2" is offered → it takes part 2 (its zip named part 2);
    the x → reload → nothing offered.
  - The bars, at 375 on a phone: the hub → Select → the bar takes the header's row, each icon a full thumb, a hairline
    before Delete; Review → Select; the dashboard's meter → See what's using space → select → Download | Remove to
    Deleted apart.
  - A place's link, at 375: the claims review (staged claimable rows) → Claim → Open album → one Back → the dashboard
    with nothing open; a guest list of 13+ named guests (staged) → the faces row → a name → Open full profile → one
    Back → the album.
  - Her own upload on a phone: a guest's Add → Send 1 → her photograph shows at once and never drops to the shimmer or
    fades again when its link lands (Network: the preview's request about half a second later).
  - The banner: a test host in grace (staged `storage_grace_until` over its cap) → the dashboard's banner → see what's
    using space → "X left to free to fit your plan" → select → Remove to Deleted → "Enough freed…" → close → the meter
    re-reads; the meter's door shows the same goal while she is over.
- **Assets requested from Will:** none.
- **Board ideas:** the bulk bar in a hand as a bottom contextual bar (iOS Photos' selection toolbar), since five verbs
  crowd the header's row at 375; the walk a reload brings back could say what is next ("Part 2 of 3 is next") rather
  than repeat the part already handed over.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** the eight Questions above, all built as recommended.
- **Look at first:** `popup-back.ts`'s `pageLinkHref` and the capture click; `export-walk.ts`'s `between`/`resume`;
  `media-grid.tsx`'s object-URL swap; `guest-media.ts`'s `listOwnerMediaIds`.
