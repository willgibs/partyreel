---
track: crumbs-52
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "fac5dc83"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/event-experience
  - src/lib/guest/reel-url
  - src/components/guest/reel/
  - src/components/app/event-feed/reel-card
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/reel.md
  - src/app/(guest)/e/[token]/page.tsx
---

# lp/crumbs-52

**Goal.** Fix red-team 43's second MEDIUM at its cause: the hub's Highlight reel card (a client-side navigation to the album with ?reel) shows the album for 0.3 to 1 s before the reel, because the black curtain never stands on a soft navigation.

## The brief

**Why.** Will's note on the hub, 2026-10-02: "some (reel) seems to flash a guest album as it loads the slideshow". `header-wiring` fixed it for a typed or reloaded `?reel` (the server knows `reelAsked` and the page wears the reel's black from the first byte), but build 43's red-team found the real door still flashes, verbatim from its ledger:

"MEDIUM: W3 the hub's Reel card still shows the album before the reel (the curtain never stands on the real door). Surface: /dashboard/<id> Highlight reel card (Next Link to /e/<token>?reel, a client-side navigation). Steps: willg97 E3 hub > MutationObserver on the document (curtain [data-reel-curtain], album head, imgs, dialogs) + pushState hook > click the Reel card: drive 1: the album page committed (data-event-head=album, 9 then 15 imgs) with NO curtain at +19,368 ms, the reel dialog ('Highlight reel / Make your own') only at +20,339 ms (~970 ms of album); re-driven after a fresh load + screenshot: pushState +10,643, album with no curtain +10,686, reel +11,009 (~320 ms of album). The curtain was in the DOM at no point on either drive. Likely cause: on a soft navigation the reel param's store reads window.location before Next updates the URL, so the first head bridge says viewAsked false and event-experience.tsx:615 drops the curtain at once (useReelParam's useSyncExternalStore snapshot reads window.location.search). The SSR HTML of the same URL (fetched by the owner) does carry the curtain."

**Where:** `event-experience.tsx` (the curtain: `const [curtainDown, setCurtainDown] = useState(!reelAsked); if (!curtainDown && head && !head.reel.viewAsked) setCurtainDown(true);`, about line 689) and `src/lib/guest/reel-url.ts` (`useReelParam`'s `useSyncExternalStore` snapshot of `window.location`).

**Do:**
1. Prove the cause first, red: a test of the soft navigation's order (the page committing with `reelAsked` while the URL snapshot still lacks `?reel`) that drops the curtain on today's code.
2. Fix it at the cause so the curtain stands from the first frame on a soft navigation exactly as on a hard load, and goes only once the address truly stops asking (the view closed). For example, the curtain must not drop on a snapshot that predates the navigation, or the param must be read from Next's own navigation state.
3. Leave the hub's Reel card a client-side navigation unless the fix cannot hold otherwise (say why in your Handoff).

Will's standard: "Everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback." Never the album flashing under the reel.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:3134`; the soft navigation driven in a headless Chrome of your own from a page that links to `/e/<token>?reel` with a MutationObserver on the curtain and the album head (the curtain present at the album's first commit); the signed-in hub's real card is build 44's red-team step.

## Questions (a recommended answer each; the Orchestrator relays them)

- **The black has no mark and no ceiling.** Will's "anything taking longer should provide clear state feedback": with
  the fix the black stands from the page's first commit until the view opens, and measured on a production build with a
  slow phone's emulation (4x CPU, 150 ms, 1.6 Mbps) it is 1.43 s with the chunk cold (`prod2-B-fixed-plain-slow.txt`)
  and 0.14 s with the real card's press warm-up (`prod2-C-fixed-card-slow.txt`); the old code showed the album bare
  for 1.44 s there (`prod2-A-old-plain-slow.txt`; every capture named here is in `_scratch/crumbs-52/`, the harness
  `probe.mjs` beside them). It says nothing of what it waits on, and
  an album seed or a view chunk that never lands leaves the owner on black until Back (as a hard load already did).
  Recommended: leave as built (the hard load's own black, which Will asked for) and take the pending mark and the
  ceiling as a small board (Deferred). Built: nothing.
- **The press warms the view's chunk** (`reel-card.tsx`, commit `db0db9dc`, standing alone). Recommended: keep: it is
  what makes the black a beat on a slow link, a plain press only (a modified click opens a tab that loads its own), and
  the card stays a client-side navigation. Built; drop that one commit to undo it.
- **Wording, built and his to overrule.** An empty camera album's cover says "Take the first photo" (parity with "Add the
  first photo"), "Take photos" once anything is on the roll or waits; the live Reel card says "Live at the develop" while
  the album's develop time is ahead, "Live for guests" from it (a timer turns it the moment it comes).
- **Cannot be placed here: other guests' waiting shots.** Red-team 43's NIT as worded ("the empty state still says 'Add
  the first photo' / 'The album starts with you' while 2 shots wait") is true of a guest with none of her own: the
  sync's `waiting` count (everyone's, as a number: `GuestFullSync.waiting`) never reaches the page, since
  `lib/album/store.ts` and `GalleryLive` do not carry it, and the empty state's words are `gallery-empty-state.tsx`'s.
  Placed: HER shots (this visit's, by the sealed landing now kept in `inFlightUploads`; an earlier visit's, by
  `waitingOnArrival`, which door-reveal's `hasWaitingUploads` already counts sealed: `page.waiting.test.tsx`).
  Recommended: carry `waiting` to the page as the waiting room's wiring (one store field, `GalleryLive.waiting`), where
  the cover reads "Add photos" over an album that holds shots and the empty state says what waits (the-wait board's).
- **The shutter atom is untouched.** `ui/shutter.tsx`'s face is already its `children` (`children ?? <ImageUp/>`), so the
  camera glyph and the words ride the dock's new `camera` prop (`guest-action-dock.tsx`, its only caller). If identity's
  board wants a `look` hook on the atom itself, that is one more prop on a file outside this lane's owns.

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md`: the owner-on-`?reel` curtain paragraph (a soft navigation, kept one; the album's word is
  the address read when told; both orders pinned), the keep held while the camera is open, THE ADD CHOICE's camera
  exception, and the cover's Add words (a sealed landing is hers waiting; Take photos where the Add opens the camera).
- `docs/systems/reel.md`: the `?reel` address bullet (a page that arrives by `<Link>` renders against the address it
  left; `reelOfAddress()`), and the Reel card bullet (the press warms the view's chunk; "Live at the develop").
- `docs/systems/disposable-mode.md`: "The guest's camera", the page's half (keep held, sealed landing kept, `isOwner` and
  `onOwnRemoved`, the Add's words).

## Deferred (ROADMAP one-liners, bucket named)

- Guests: the reel's black over a soft navigation has no ceiling and no mark: an album seed or a view chunk that never
  lands leaves the owner on black until Back, and a slow link's black (1.4 s cold, 0.14 s warmed, at 4x CPU on 1.6 Mbps)
  says nothing of what it waits on (from `crumbs-52`).
- Host: the hub's Reel card shows no pending state between a press and the album's first commit (the album's server
  render, a second or more on a slow link); `useLinkStatus` could dim it, the card staying a link (a board idea from
  `crumbs-52`).
- Guests: a guest with none of her own shots on a sealed album still reads "Add the first photo" and "The album starts
  with you" while others' shots wait: the sync's `waiting` count never reaches the page (`lib/album/store.ts` and
  `GalleryLive` do not carry it), and the waiting room's wiring would carry it and word both (from `crumbs-52`, red-team
  43's NIT).

## Handoff (replaces the chat report)

- **Commits, pushed** (`lp/crumbs-52`, cut at `fac5dc83`): work `3f06d0d9` (the curtain), `db0db9dc` (the card's press
  warm-up, standing alone), sync `911b2d5c` (launch-prep at `c45b69a8`, disposable-camera merged: no conflict; at that
  moment `origin/launch-prep` did not hold it yet, so the SHA was merged from the shared repo; launch-prep has since
  moved to `c418312c`, a record commit that retired the disposable-mode board and touches none of this lane's files, so
  no second sync), `780d82f7` (the camera's page half), `0fb084e3` (the Reel card's develop wording), and this file.
- **Gates on the synced tree, `0fb084e3`**, each on its own exit code (logs in `_scratch/crumbs-52/final-*.log`):
  typecheck 0; lint 0; test 0 (799 files, 9,460 tests); `zsh scripts/build-lock.sh pnpm build` 0 (no error or failure
  line); `pnpm lab:smoke --base http://localhost:3134` 0 (148 checks, 0 failing). No board, so no `lab:demo`.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): this file, and owned paths (`reel-url.ts`,
  `reel-url-history.test.tsx`, `reel/live-reel.tsx`, `event-experience.tsx`, `event-experience.curtain.test.tsx`,
  `event-experience.camera.test.tsx`, `reel-card.tsx`, `reel-card.test.tsx`), the three system docs above, plus these
  exceptions, each a line or a prop and each the Orchestrator's addendum or the feature's necessity:
  `src/components/guest/guest-action-dock.tsx` and its test (the camera addendum's item 4: the shutter's words and face
  need a prop, and this page is its only caller); `src/app/(app)/dashboard/[eventId]/page.tsx` (one line: the card gets
  the album's develop time, `developsAt: event.develops_at`) and its `page.test.tsx` (one source pin, red on HEAD).
- **The items:**
  - **The cause, measured first** (`_scratch/crumbs-52/before-soft.txt`, the console trace under `next dev` with the
    page's seed resolved, which is a fast host's order and the red-team's): the album mounts in the SAME commit as the
    page and renders against the address it left (`LiveReel render {"mode":null,"search":""}`, the router writing the
    new address in that commit's insertion effect), its first effect tells the head `viewAsked: false` while the address
    already says `?reel` (`LiveReel publish {"viewAsked":false,"search":"?reel"}`), and the page lets the curtain go
    for good in the same task (`EE render ... "curtainDown":true`): the MutationObserver batch holds the curtain's add
    and its removal together, and the first painted frame is the album with 15 images and no curtain. A hard load never
    meets it (`before-hard.txt`: the curtain in every frame). Confirmed on a production build, the old behaviour behind
    a temporary flag on one bundle: `prod-before-soft.txt` (album bare 34 ms, here) and `prod2-A-old-plain-slow.txt`
    (1.44 s at 4x CPU, 150 ms, 1.6 Mbps).
  - **Red first**: `event-experience.curtain.test.tsx` drives the real `EventExperience`, `LiveReel` and `useReelParam`
    through Next's commit order (the address written from an insertion effect, the album in the page's commit); on
    today's code four of its nine fail (the curtain gone after the commit, the curtain gone before her Close, the
    album's first word `false`, a `false` before her Close) while the late-album, hard-load and not-asked controls
    pass. `reel-url-history.test.tsx` pins the render/effect fact the fix rests on.
  - **The fix**: `live-reel.tsx` tells the head the address read when it tells it (`reelOfAddress()`, `reel-url.ts`'s one
    reader), never `mode` copied out of the render; the curtain's own logic is unchanged (a comment in
    `event-experience.tsx` says why). Verified on the same two builds: `after-soft.txt` and `prod-after-soft.txt` (the
    curtain in the first painted frame and through to the dialog, never removed), `after-soft-cpu4.txt`,
    `prod2-B-fixed-plain-slow.txt`, a second press in the same document (`prod2-again.txt`), the hard load unchanged
    (`prod-new-hard.txt`), and Close dropping it with the album staying (`after-hard-escape.txt`: the dialog and the
    curtain leave in one commit; the owner's Close going back to the hub leaves no bare album frame either way,
    `prod2-exit.txt`, `prod2-exit-slow.txt`). A reel that cannot play still lets the black go once the controller drops
    the address (a test).
  - **The Reel card stays a client-side navigation**: the fix holds with it, so nothing about the door moved; a plain
    press now asks for the view's chunk (`db0db9dc`), the black on a slow link 1.43 s to 0.14 s (`prod2-C-fixed-card-slow.txt`,
    the real `ReelCard` mounted on a temporary probe page).
  - **The addendum, the camera's page half** (`780d82f7`, `event-experience.camera.test.tsx`, red first: nine of its
    eleven failed on the old page): the door's keep held while the camera is open; a `sealed` landing kept in
    `inFlightUploads` (her tracker's picture, the cover says Add photos once she has shot); `isOwner && !isDemo` and
    `onOwnRemoved` handed to `GuestUpload` (the host's camera keeps no roll; a taken-back shot re-asks a
    require-an-upload door); Take photos with the camera glyph on the cover's Add and, through the dock's `camera`
    prop, on the shutter's face (`guest-action-dock.test.tsx`, red on the old dock).
  - **Red-team 43's NITs**: the sealed album's cover (item 5) is placed for her own shots, and the rest is a Question
    above; the Reel card (item 6) says "Live at the develop" until the time and turns at it (`0fb084e3`,
    `reel-card.test.tsx` red first, with a fake-timer test of the turn).
  - Verified through a TEMPORARY local patch, never committed and reverted before the gate: the demo album forced to an
    owner (`page.tsx`) with `?reel` and a page delay so the seed is resolved before the page returns, a probe page
    holding a plain Link and the real card, and a flag for the old behaviour; the harness is
    `_scratch/crumbs-52/probe.mjs` (my own headless Chrome over its DevTools protocol; a recorder of every mutation and
    every frame). The gate's tree has none of it.
- **Assets requested from Will:** none.
- **Board ideas:** the Reel card's pending mark and the black's ceiling (the two Deferred lines); a mouse's hover warm-up
  of the view's chunk (a head start of the hover-to-click gap) if the press's proves late on the alias.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:**
  - The Reel card's press warms the view's chunk (one commit, `db0db9dc`).
  - "Take the first photo" on an empty camera album, "Take photos" after; "Live at the develop" on the live card.
  - The black stays unmarked, as a hard load's is.
  - The two one-line exceptions (the dock's prop, the hub page's `developsAt`), each revertible alone: without the page's
    line the card reads "Live for guests" as before.
- **Look at first:** `live-reel.tsx`'s publishing effect and `reel-url.ts`'s header (the cause and its one-line fix), then
  `event-experience.curtain.test.tsx` (red on HEAD), then build 44's red-team on the alias: the hub's real card with a
  MutationObserver that counts records (a live query at callback time misses a curtain drawn and removed in one task,
  as the red-team's did) and a per-frame sampler as in `probe.mjs`; the curtain must stand in the album's first painted
  frame and until the dialog. Then, on a camera album, the keep staying down while she shoots and "Take photos" on both
  Adds.
