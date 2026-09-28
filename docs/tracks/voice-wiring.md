---
track: voice-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "ae7f9ed1"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/guest/upload-tracker
  - src/components/guest/upload-tracker
  - src/components/guest/upload/stack-tile
  - src/components/shared/album-window-plan
  - src/components/guest/gallery-live
  - src/components/guest/save-account-prompt
  - src/components/guest/guest-name-menu
  - src/components/app/event-feed/review
  - src/components/app/event-feed/use-review-triage
  - content/help/how-guests-join-and-upload.mdx
  - content/help/messages-guests-might-see.mdx
  - src/components/marketing/mock-parity.test.ts
  - src/app/(dev)/design/sandbox/voice-guest/
  - src/components/marketing/sections/features/album/review-switch
  - src/components/marketing/sections/features/album/album-copy
  - src/components/guest/gallery-rows
  - src/components/guest/guest-masonry
  - src/components/guest/live-gallery
  - src/components/guest/event-experience
  - src/components/guest/entry-modal
  - src/components/guest/guest-upload
  - src/lib/guest/use-upload-queue
  - src/lib/guest/keep-ask
  - src/components/marketing/sections/features/curation/curation-faq
  - content/help/review-uploads-before-they-appear.mdx
  - content/help/a-photo-is-missing-from-the-album.mdx
  - content/help/hide-remove-and-restore.mdx
  - content/help/moderate-and-curate-your-album.mdx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/voice-guest.json
  - docs/systems/guest-flow.md
  - docs/systems/host-app.md
---

# lp/voice-wiring

**Goal.** Build Will's voice-guest round 2 answers: a held photo shows only in her uploads, her uploads say "Waiting for approval" and "Not approved", the keep asks "Keep this event" (her name menu's card too), and his host note in Review that an approved photo can always be hidden later; then retire voice-guest.

## The brief

**His answers** (`docs/reviews/voice-guest.json`, r2, each note there; the options' exact words are in the board's `lines.ts` and `spec.ts`):
- `held=uploads`: a photo the host is still deciding on shows only in her uploads, the tracker's badge counting it. The album's head draws no held tile (`upload/stack-tile.tsx`'s `WaitingTile`, the head slots in `album-window-plan.ts`, `gallery-live.tsx`). A file still sending keeps its stack tile. The upload area's own held line and the keep's "Sent" sentence stay true beside it.
- `status=approval`: `TRACKER_WORDS` reads "Waiting for approval" for a held photo and "Not approved" for one the host left out. His note: "A bit more clear, I don't think anyone's feelings will be hurt by direct wording here since it offers clarity." One state, one name, everywhere it is said: the tracker, the keep's sent line, the help, and the album feature page's mock (`review-switch.tsx`, and its hint in `album-copy.ts`, which still quotes the retired toast: ROADMAP's line). `mock-parity.test.ts` moves with them.
  - The admin portal's confirm (`moderation-grid.tsx`) is `triage-wiring`'s, which takes these words; leave it.
- **His host note on `status`:** "We should have a note for the host when making approvals that they can always hide an approved photo later, so they're more lenient on 'accept and hide' vs 'reject'." One quiet line in the Review room (`review-section.tsx`), never a hint row.
- `keep=warm`: the keep step asks "Keep this event" (the warm option's words, `save-account-prompt.tsx`'s `keepCopy`). His note: "'Keep this event' is best because they likely already have their own photos saved, the incentivize is everything else in the event." Her name menu's card, which still says "Save this event for later" (`guest-name-menu.tsx`), takes the same title. The door screen that Confirm your email opens keeps its own photos-first wear (round 2's carried call `keep-confirm`).
- **Fold in** ROADMAP's review-room line: ids the room acted on never leave `known` (`use-review-triage.ts`), and `arrivals(waiting, known)` (`review-queue.ts`) filters them out. So an upload that returns to pending from elsewhere never shows until a reload. Retire both ROADMAP lines in your Handoff.

**Then retire `voice-guest`** in one commit: its folder and its lines in `registry.ts`, `boards.ts` and `touchpoints.ts` (named exceptions). The ledger is the Orchestrator's.

**Paths:** `safety-wiring` holds the guest page (`e/[token]/page.tsx`), the look and the guest list; `pricing-wiring` holds pricing; `triage-wiring` holds `src/components/admin/`. Add any other path to `owns` before editing it.

**Verify:**
- Vitest for the words, the head's slots with a held photo (none drawn) and the `known` fix.
- The album and her uploads at 375 and 1440.
- `pnpm lab:smoke` whole.
- Will's real-upload check sees it live.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **His host note's words and place.** Built: one quiet line under Review's amber header, over the queue and only
  while there is one (never caught up, never with review off): "Anything you approve can still be hidden later."
  (`review-section.tsx`, `REVIEW_NOTE`; 14px muted, one line at 375 and 1440). No noun, since the queue holds videos
  too; true as said, since Hide takes any photo off every guest's album at once. Overrule: his own words, "You can
  always hide an approved photo later.", or the line in the peek under Reject and Approve (where one is decided at a
  time, but a host clearing the queue with Approve all never sees it).
- **An empty album whose only photos of hers are held (this visit).** With no waiting tile the album's empty state
  shows again, so built: the empty state stands without its "Add the first photo" and the row keeps its Add with her
  badge beside it, one Add either way (`event-experience.tsx` passes the CTA only while `galleryEmpty`, which also
  mends two Adds beside a failed upload on an empty album). Overrule: the empty state keeps its CTA and the row drops
  its Add, which puts her badge beside Invite.
- **The keep's line for one photo and for an event with no name.** The board drew six ("with your 6 photos"); built
  "with your photo" for one, and "this event" where a name is missing. No other word moved.

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md`: the keep's Sent line ("waiting for approval") and its ask ("Keep this event",
  `KEEP_TITLE`); the empty state's one-Add rule (`galleryEmpty`); the album's head (nothing for a held file, in place
  of the WAITING tile bullet; the stack's lit edge, one tile); her tracker's words and its arrival re-read; her menu
  card's title.
- `docs/systems/host-app.md`: the Review room's host note (`REVIEW_NOTE`); the room's own writes held only until the
  album has read them back (`OwnWrites`).

## Deferred (ROADMAP one-liners, bucket named)

- Guests: a returning guest whose only uploads wait on an empty held album meets the empty state's "Add the first
  photo" with her badge beside Invite, since the row's Add returns only for this visit's files (`galleryEmpty`);
  counting her waiting rows would move the Add in a beat after they load, so it wants a layout that does not jump
  (from `voice-wiring`).

## Handoff (replaces the chat report)

- **Commits, pushed:** `438149ac` retires voice-guest alone (its folder, and its lines in `registry.ts`, `boards.ts`
  and `touchpoints.ts`; its tree typechecked and its lab and content tests run on their own, 37 files, 599 tests);
  `3a249d4d` is the wiring; the manifest's Handoff is the head. No sync: launch-prep gained only record commits since
  `ae7f9ed1` (`19709ecd`..`1b394476`: STATUS, orchestrator.md, the help-center and emails ledgers).
- **Gates on `3a249d4d`'s tree**, each on its own exit code (logs in `_scratch/voice-wiring/`): `pnpm typecheck` 0
  (`typecheck2.log`); `pnpm lint` 0, 4 warnings, none in a lane file (review-session.tsx, contact-form.tsx,
  album-fill-grid.tsx twice; review-switch.tsx's was one of the five and is gone) (`lint2.log`); `pnpm test` 0, 520
  files, 5885 tests (`test2.log`); `zsh scripts/build-lock.sh pnpm build` 0 (`build2.log`); `pnpm lab:smoke --base
  http://localhost:3133` 0, 217 checks, 0 failing, voice-guest off the desk (`smoke2.log`).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): every path under `owns`, this file and the two
  system docs above, and five exceptions in two groups: the retirement's `registry.ts`, `(shell)/lab/boards.ts` and
  `touchpoints.ts` (the brief's named ones), and help-center's `from-product.tsx` (its menu card now reads
  `KEEP_TITLE`, its note the shipped refused words) and `door-screens.tsx` (its keep shot's label "Sent, then Keep
  this event", and the event's name passed): a board that quotes production, kept true for help-wiring's
  `article=screen` and `from-product=contextual`.
- **The items:**
  - `held=uploads`: the album's head draws only files in the air (`live-gallery.tsx`'s `pendingTiles`;
    `WaitingTile` gone from `stack-tile.tsx`, `gallery-rows.tsx`, `guest-masonry.tsx`; `PendingTile` loses `held`);
    a held file keeps its object URL for her uploads' picture (`gallery-live.tsx`, `event-experience.tsx`); an empty
    album with hers held keeps one Add (`onAddFirst` only while `galleryEmpty`). Pinned: `live-gallery.test.tsx`
    ("a held photograph takes no head slot"; "an album of only her held photographs is the album's empty state").
  - `status=approval`: `TRACKER_WORDS` "Waiting for approval" / "Not approved"; the badge says "Your uploads, N
    waiting for approval"; the keep's Sent line "Your photo is waiting for approval." (a test ties it to
    `TRACKER_WORDS.waiting`).
  - `refusal-read` (the board's carried call, drawn in `uploads`' "later" frame): one of hers arriving in the album
    out of waiting re-reads her rows (`newlyInAlbum`), so the one left out beside it stops counting without an
    opening. Pinned in `upload-tracker.test.ts` and `.test.tsx`; the reshaped "with no new read" pin says why.
  - `keep=warm`: `keepCopy(count, eventName)` "Keep this event" / "Confirm your email and {event} stays in your
    account with your {n} photos, to come back to anytime."; `KEEP_TITLE` on her name menu's card; the confirm door
    keeps its own wear (`keep-confirm`).
  - His host note: `REVIEW_NOTE` over Review's queue (`review-section.tsx`); pinned in `review-room.test.tsx`.
  - ROADMAP's review-room line: `known` is derived (`knownIds`: the grid and the room's unread writes), and a write
    is the room's truth only until the album answers the catch-up after it (`OwnWrites`, `ownWrite`, `readBack`;
    `ReviewLive.sync` now settles), so an upload decided here and returned from elsewhere is counted by the line, and
    one put back here and decided elsewhere leaves. Pinned in `review-queue.test.ts`, `use-review-triage.test.tsx`
    (the two new pins fail on the old hook) and `review-live.test.tsx` (through the real store; fails on the old
    hook too).
  - One name everywhere: the help (the two named articles, plus `review-uploads-before-they-appear`,
    `a-photo-is-missing-from-the-album`, `hide-remove-and-restore`, `moderate-and-curate-your-album`, which named
    the retired toast or "not in the album"; `messages-guests-might-see` gains her uploads' three words and the
    keep), the curation FAQ, and `/features/album`'s phone plate and Review hint (`mock-parity.test.ts` moved to
    `upload-tracker.ts`, with a pin for the hint).
- **Verified locally on real rows** (a disposable name-only held event, a name-only "Priya" minted by `create_guest`,
  three photos through an R2 PUT and `create_media`; soft-deleted after, purge 2026-10-28): her album at 375 and 1440
  with no held tile and the badge beside Add (`shots/375-album.png`, `1440-album.png`); her uploads reading "Waiting
  for approval", "Not approved", "In the album" (`375-uploads.png`, `1440-uploads.png`); after one was approved and
  one hidden by SQL, the album's sync brought the approved photo within 15 seconds and the badge fell from 3 to 1
  with the list closed (the arrival's re-read). Her menu's card (`375-menu.png`); the Library's Review room with the
  note on one line at 375 and 1440 (`375-review.png`, `1440-review.png`, `375-light-review.png`); `/features/album`
  in Review, the pill "Waiting for approval" uncut and the hint on two lines at 375, one at 1440 (`375-switch.png`,
  `1440-switch.png`). Captures from a headless Chrome of the lane's own (`_scratch/voice-wiring/shoot.mjs`), closed.
- **Not reachable on localhost** (R2's CORS refuses the browser's PUT; host sign-in is allow-listed): a real upload's
  moment (the stack, then nothing at the head; the keep's words; the empty held album's one Add) is Will's real-upload
  check on the alias; the review room live wants two tabs on a disposable held event: approve an upload in one, return
  it to pending (the other tab's approve and Undo, or `status='pending'` by SQL), and the first tab's line says "1 new".
- **ROADMAP lines to retire:** the review room's `known` line (Host); `/features/album`'s Review hint quoting the
  retired toast (Marketing); `review-switch.tsx`'s unused `useEffect` and dead `dim` prop (Code hygiene); "tapping
  her own waiting tile at the album's head could open her tracker" (Guests: the tile is gone).
- **For triage-wiring:** `report-review.tsx` (the admin Reports confirm) says "her uploads list already says Not in
  the album" beside `moderation-grid.tsx`'s same line; both take "Not approved". `admin-triage/notice.tsx` (triage-r2's)
  draws `TRACKER_WORDS.refused`, so it reads "Not approved" from this merge, while its comment quotes the old words.
- **A note on the shared Browser pane:** its one tab was another lane's (`localhost:3132/pricing`) the moment I
  clicked it, and the click landed on that page and opened `/login`. I moved to a tab of my own, then to a private
  headless Chrome for every capture; nothing but that navigation happened on :3132.
- Assets requested from Will: none.
- Board ideas: her uploads draw a plain placeholder for an earlier visit's held photo (nothing not in the album is
  presigned for a guest); a thumbnail minted for its uploader's own ticket alone would let her see which one waits.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- **Calls his to overrule:**
  - The host note's words and place (Questions).
  - The empty held album's one Add (Questions).
  - "Not approved" names every photo of hers not in the album, a Reject, a Hide after approval, a removal alike (the
    tracker's rule, unchanged; his note makes approve-then-hide the common case). Overrule: a photo hidden after it was
    in the album could keep "Not in the album".
  - `/features/album`'s Review hint, "Every upload waits for you. The guest who sent it sees Waiting for approval."
- **Look at first:** `use-review-triage.ts` with `review-queue.ts` (`OwnWrites`: when a write is read back, and the
  live reconciliation re-running when it is); `event-experience.tsx`'s `onAddFirst`.
