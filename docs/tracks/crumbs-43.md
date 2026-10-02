---
track: crumbs-43
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "07277c23"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/shared/media-lightbox
  - src/components/shared/masonry
  - src/lib/history-entry
  - src/components/ui/popup-back.ts
  - src/lib/guest/
  - src/components/guest/
  - src/components/likes/
  - src/components/social/guest-list
  - src/components/social/guest-peek
  - src/lib/db/queries/guest-events.ts
  - src/lib/db/queries/guest-events.test.ts
  - src/lib/db/guest-cap-and-faces-guards.test.ts
  - src/lib/upload/device-id.ts
  - src/app/(guest)/e/[token]/page
  - src/app/(guest)/e/[token]/card/card.test.tsx
  - supabase/migrations/20261001233000_guest_event_cap.sql
  - supabase/migrations/20261001233110_faces_move_attribution.sql
  - usher/kit/gate-lane.sh
  - src/lib/gate-dev-cache-policy.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/profiles-social.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/host-app.md
  - docs/systems/database-security.md
---

# lp/crumbs-43

**Goal.** Nine guest-side lines: the phone's Back closing an open photograph, the welcome and its consent line for each new person on a shared phone, one row for a name-only guest who re-joins, the host's own upload cap on the upload sheet, a credit's face moving at once, the Likes page's Show-more hearts, a returning guest's waiting uploads on an empty album, the retired "A guest" label, and the photo viewer's own loading state.

## The brief

Nine ROADMAP lines (each is its line there; find it by the words quoted), each fixed at its root with a test that fails on today's code:

- **Back closes the photograph**: "the phone's Back closes the open photograph (pushState and popstate) instead of leaving the album; `?photo=` rides replaceState today". The hub, the popups and the reel already share one rule for which history entry is ours (`lib/history-entry.ts`, `ui/popup-back.ts`; `host-app.md`): the viewer joins it rather than growing its own. A shared `?photo=` link still opens its photograph, and its close still lands in the album. The code card's own Back is a question still open with Will: leave it as it is.
- **The welcome on a shared phone**: "the next person on a shared phone skips the welcome, and with it the legal consent line (`pr_welcome_<qr>` survives every sign-out and the ticket drop); decide whether it goes with the tickets". Recommend under Questions and build it; the consent line is the point, so each person who joins should meet it once. `src/lib/constants/legal-privacy.tsx` names the key and no lane edits the legal pages: name any word there your change leaves stale in your Handoff.
- **One row for a re-join**: "a name-only guest whose session drops re-joins on the same device as a second guest row with the same name, so the guest list shows one person twice; key the re-join on `pr_device_id` (the same row) or de-dupe the list by name and device (Will's to pick)". Recommend one under Questions with its gain and cost and build it, keeping crumbs-29's rule (one account keeps one ticket per album) and the shared phone's claims (`shared-claims`) whole: two different people on one phone who type the same name are the case to prove against.
- **The host's own cap on the upload sheet**: "`get_event_by_qr_token` does not return `events.max_upload_bytes`, so the upload sheet's terms line states the product's limits rather than the host's own cap; add the column (with the types and `queries/guest-events.ts`) and `uploadTermsLine`'s `capBytes` seam takes it". `get_event_by_qr_token` is an anon capability read (`database-security.md`, 0028 by design): the new column is returned last, as `reel_hold_sec` was, so the deployed build reads what it reads today, and the drop and create re-grants exactly what it grants now.
- **A face moves at once** (from `crumbs-38`): "an open album's credits take a new photograph or handle only at the link's next re-mint (an hour) or a reload, since the attribution version moves on a name (`profiles_album_note` watches `display_name` alone); adding `avatar_updated_at` and `slug` to that trigger's columns would move a face at once". A migration; prove the trigger fires on each new column and on nothing else.
- **The Likes page's Show-more hearts** (from `crumbs-38`): "a Likes page that Show more adds paints its hearts when `my_liked_media_ids` answers, since the likes store takes `initialLikedIds` once at mount (`likes-provider.tsx`, crumbs-40's); a way to mark ids liked as they join would fill them at once".
- **Her waiting uploads on an empty album** (from `voice-wiring`): "a returning guest whose only uploads wait on an empty held album meets the empty state's \"Add the first photo\" with her badge beside Invite, since the row's Add returns only for this visit's files (`galleryEmpty`); counting her waiting rows would move the Add a beat after they load, so it wants a layout that does not jump".
- **"A guest" retired**: "`social/guest-list.tsx:216` draws \"A guest\" for a null `displayName`, a label the product retired (a nameless credit shows nothing)".
- **The viewer's own loading state**: "the media viewer's own image and video have no loading state (a tile has a skeleton; the opened photograph pops in when the full-size presign lands, the slowest picture in the product on venue Wi-Fi)". The tile's own picture can stand in until the full size lands; the motion follows the viewer's open (`media-viewer-wiring`'s origin), and reduced motion is honoured.

**SQL:** a change the database needs is a migration file in `supabase/migrations/` with its rolled-back proof at its foot, red first on today's schema (`database-security.md`, Workflow). Never applied by you: the Orchestrator applies it by protocol and regenerates the types. A file that replaces a function starts from its newest definition and the live body (md5-check it, as crumbs-38's headers do); a new object grants `anon` and `authenticated` nothing by default. Put your migrations' guard tests in a test file of your own, never `src/lib/db/migration-guards.test.ts`: two lanes write migrations beside you.

**Verify:**
- the gate;
- each item's test red on today's code;
- the rolled-back proofs on the live schema, red first;
- on localhost, the public demo album and a guest album signed out, at 375 and 1440: Back with a photograph open, the viewer on a throttled network, the upload sheet's terms line.

The signed-in surfaces cannot run on localhost, so name their steps for the next build's red-team in your Handoff.

**Will's desk is up:** `locked-door` describes the door (its family, shape, wait and lost screens) and `disposable-mode` the disposable roll on the guest page (the camera, the wall, the peek, the viewer's Save and Share). Change no word or behaviour their asks describe: the welcome's look and `entry-modal.tsx`'s screens stay as they are (only when the welcome shows may move), and so do the viewer's Save and Share. If the lab crawl's PREMISE line names a board, say in your Handoff why its asks still hold.

**Paths:** your owns are a start. Add each file to `owns` in your manifest before editing, or name a one-line exception. Two lanes run beside you, so don't touch their files:
- `crumbs-41` owns the admin portal (`src/app/admin/`, `lib/admin/`, `components/admin/`), billing (`api/stripe/webhook/`, `lib/stripe/`), `queries/reports.ts`, and `report_strikes` and the reports' SQL;
- `crumbs-42` owns the host app: `src/app/(app)/dashboard/`, the hub's rooms (`components/app/event-feed/`), `host-add-provider.tsx`, `host-upload.tsx`, `restore-event-button.tsx`, the create wizard, `ui/popup.tsx`, `queries/events.ts`, `mutations/media.ts`, and `restore_event`;

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended; each is Will's to overrule.

- **The welcome on a shared phone: does it go with the tickets?** Recommend YES, built: a ticket the device puts down
  (somebody else's, or one whose row is gone) takes its album's `pr_welcome_<qr>`, and every sign-out (the header's,
  the app menu's, Sign out everywhere, the door's "Use a different email") takes every album's; the door's name step
  keeps it when it puts a foreign ticket down, since its person has just passed it on the way there. Gain: everyone who
  joins on a shared phone meets the welcome and its consent line once (the door's identify and sign-in steps carry
  none: they lean on the welcome). Cost: one more Continue for a guest who signs out and back in on her own phone, or
  whose waiting ticket an album's move to a password ended; and a signed-in guest whose upload replaces another
  person's ticket mid-run meets the welcome over the album at that moment (she is joining then).
- **One row for a re-join: device-keyed re-join, or a list de-dupe by name and device?** Recommend NEITHER: both read
  `pr_device_id`, which trust-safety-forensics.md holds capture-only ("never product logic, never a gate, never shown
  to a host or a guest") and the Privacy policy discloses as an upload record. The duplicate's root is the queue
  putting a working name-only ticket down when a host turns An email first on mid-run. Built: the flip keeps her
  ticket (the files still fail in place with the server's sentence and the page still re-gates; the switch is asked
  at every upload). Gain: the switch turned off again sends her next Add on the same row, and a confirmation in
  between claims that row (it used to leave her photographs under the typed name beside her account's: one person
  twice again). Two people on one phone who type one name: no new merging anywhere (a ticket still goes down only
  when it is not the viewer's, the next person mints their own row, `whose_ticket` and crumbs-29's one ticket per
  account untouched). Cost: a guest whose browser loses its storage (Safari's seven-day cap on script-written
  storage) still re-joins as a second row (Deferred below).
- **Back closes the photograph on every album, not only the guest's?** Recommend YES, built: the grid is the one every
  album wears (the guest album, the host's hub album, the bin, the profile's feeds), so the rule is one. The phone's
  Back drops the photograph into its tile as the X does, and closes it at once where the browser drew its own swipe
  (`hasUAVisualTransition`, Baseline 2026); Forward opens it again; a shared `?photo=` link closes in place onto the
  album. The code card's own Back is untouched (still open with Will).
- **Her waiting uploads on an empty held album: which layout does not jump?** Recommend the server knowing at the first
  paint, built: on an empty album that holds uploads (and only there) the page asks whether any of hers wait, so the
  row's Add and her tracker stand from the first frame. Alternatives drawn in thought, not built: every held album's
  empty state without its own Add (changes the first-timer's empty state), or a reserved row. Cost: one read on that
  page; a pre-cookie ticket (localStorage alone) still learns late.
- **The viewer's own loading state: what does it look like?** Recommend a small glass ring on the photograph's corner
  while its original is still coming (after 600 ms, gone on load or failure; iOS Photos' precedent for an original
  still downloading, in the viewer's own busy grammar: Save and Share spin the same ring), and the same ring in a
  clip's play button while it waits for its bytes (after 500 ms). The tile's preview already stood in (media-viewer
  wiring); the ring is what was missing. Alternative: the tile skeleton's shimmer swept over the stand-in. A UI call.
- **The host's cap on the anon read: unredacted?** Recommend YES, built: like the other switches, a number the
  presign's refusal already says.
- **Gate 123's red `event-ready`: where does its fix live?** Its root is the gate's dev cache, not this lane's code
  (Handoff, "Gate 123's red"). Recommend the gate empties `.next/dev` itself between stopping its port and starting
  its server, built in `usher/kit/gate-lane.sh` (the Orchestrator's kit: one line, pinned by
  `src/lib/gate-dev-cache-policy.test.ts`). Gain: a merge resolved by hand gates on its own tree like any other.
  Cost: the gate's first lab compile is always cold, as it already is after every merge that takes `merge-lane.sh`'s
  typecheck path. The Orchestrator's to keep or drop.

## System-doc edits (in place, owned facts only)

- `guest-flow.md`: the viewer's address is a place the phone's Back closes (one pushed entry, Forward, a shared link
  closes in place); the viewer's loading state; the welcome once per person; every sign-out puts the welcomes down;
  the flip keeps a name-only ticket; the terms line states the host's own cap; an earlier visit's waiting uploads
  count from the first paint.
- `uploads-and-r2.md`: a face and a handle move the attribution version.
- `host-app.md`: the photo viewer stands on `lib/history-entry.ts` with the hub's sheets, the popups and the reel.
- `database-security.md`: `get_event_by_qr_token`'s unredacted settings name `accepts_video` and `max_upload_bytes`.
- `testing-verification.md`: the `.next/dev` gotcha's script case (a cache warmed on one tree reloads a page for ever
  on another).

## Deferred (ROADMAP one-liners, bucket named)

- Guests: a name-only guest whose browser cleared its storage (Safari's seven-day cap on script-written storage)
  re-joins as a second row under the same name; the join could adopt the `pr_guest_<eventId>` cookie's name-only row
  when the typed name matches it (from crumbs-43).
- Social: a confirmed guest whose profile has no name reads "Guest" on the album's guest list and its look
  (`guest-list.tsx`, `guest-peek.tsx`), the invented stand-in "A guest" was for a typed name; the host's at-the-door
  list says "A guest" for a person with neither name nor address (`at-the-door.tsx`) (from crumbs-43).
- Now, the lab and the kit: `capture.sh` and `capture-all.sh` start their dev server on whatever `.next/dev` the root
  last warmed, which a light-scoped merge (no lab, so no server) leaves from the tree before it, so a frame there can
  reload itself for ever as gate 123's `event-ready` did; emptying it first, as `gate-lane.sh` now does, would close
  it wherever no gate's server runs beside them (from crumbs-43).

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/crumbs-43`, cut from `11653a5e`, synced with launch-prep at `f00622f7`.** The work:
  `2e4edda2` "A guest" · `dbac674a` likes · `9b802a07` + `70b6ac72` the welcome · `0b5a1490` the flip · `219ada38` the
  two migrations and the cap · `5642b78e` + `f3594782` Back · `a75d6077` + `ec1ff430` waiting uploads · `f7421e7a` the
  loading state · `15469900` + `d5ab443d` docs · `b9181f7c` the face migration renamed to `233110` (crumbs-41's
  `233100` holds the name) · `ac4b9d65` sync at `9b0465d6` (`uploads-and-r2.md` keeps both lines, the faces' and the
  owner's "You") · `e864bb56` sync at `f00622f7` (no conflict) · `c873b1c9` gate 123's root (below) · `35536130`
  its pin in prettier's style · then this manifest. The head is in the chat line.
- **Gates on `35536130`, each on its own exit code** (logs in `_scratch/crumbs-43/g6-*.log`): `pnpm typecheck` 0 ·
  `pnpm lint` 0 · `pnpm test` 0 (732 files, 8,713 tests) · `zsh scripts/build-lock.sh pnpm build` 0 · on a dev server
  started on an empty `.next/dev`, `pnpm lab:smoke --base http://localhost:3133` 0 (137 checks, 0 failing),
  `pnpm lab:demo --board event-ready,locked-door --base http://localhost:3133` 0 (9 steps, 0 failing) and with
  `--width 375` 0 (9 steps, 0 failing); the same two presses against `next start` of that build (what the alias
  serves) 0 and 0. Every item's new pin was run against the code before it first and failed there (each commit's
  tests; the red runs restored the old file and ran the pin).
- **Gate 123's red (`520c2271`, every `event-ready` step "Cannot read properties of undefined (reading 'dock')"): the
  gate's dev cache, not this lane's code.** The merge went red on `uploads-and-r2.md` and was resolved by hand, so it
  never reached `merge-lane.sh`'s `rm -rf .next/dev` (on its typecheck path), and `gate-lane.sh` started :3130 on gate
  122's Turbopack cache, warmed on `6ae5c0b1` (the tree without this lane) by pressing five boards, these two among
  them. That cache handed the `event-ready` frame a chunk naming `qr-code-styling`'s chunk list by the old tree's name
  (measured on the first pair: `…_0d8qmm4.js`, the lane's own `…_05cdqdo.js`); the HMR subscription to it answered
  `{"type":"restart"}`, and
  Turbopack's client reloaded the frame for ever, taking the harness's `window.__labDemo` with it (`:1:18` is `.dock`
  in `window.__labDemo.dock()`). Reproduced on both pairs, red then green: a cache warmed by pressing both boards on
  launch-prep (`9b0465d6`, then `f00622f7`), then this lane served on it, reads gate 123's five failing steps; the same
  tree on an empty cache presses 9 of 9, every time (`_scratch/crumbs-43/repro-gate123.sh`, its `repro-*.log`). The
  fix is the gate's: `gate-lane.sh` empties `.next/dev` between stopping its port and starting its server, whichever
  way the merge was made, and `src/lib/gate-dev-cache-policy.test.ts` holds that line there (red on `520c2271`'s kit,
  green on this one). No test of the lane's own code can fail on that tree: one sha passes or fails by the cache
  alone.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): every path under `owns` (the gate's line and its
  pin among them, Questions) or this file, the five system docs under System-doc edits, and three exceptions, each one
  assertion in a shared pin this lane's change
  reshapes on purpose (scar kept, expired reason dropped, both named in the file): `src/lib/db/migration-guards.test.ts`
  (the read's last-column guard now names `max_upload_bytes` after `accepts_video`), `src/lib/refresh-then-write-policy.test.ts`
  (masonry's address writers are now `openItem`, `closeItem` and `leaveEntry`), `src/components/app/recently-deleted-grid.test.tsx`
  (the bin's Restore: the address clears as the close's Back lands, not in the same tick).
- **The items, one line each:**
  - Back closes the photograph: the viewer stands on `lib/history-entry.ts` (`prPhoto`): a tap pushes one entry, a walk
    replaces inside it, every close goes Back, the phone's Back drops the photograph into its tile (at once where the
    browser drew its own swipe, `hasUAVisualTransition`), Forward reopens, a shared `?photo=` closes in place.
    `masonry.tsx`, `media-lightbox.tsx` (`closeRequest`, a microtask late: `flushSync` refused inside the effect, measured).
  - The welcome goes with its ticket: `forgetWelcome` on `dropGuestTicket`, `forgetAllWelcomes` on every sign-out; the
    door's name step keeps it (its person just passed it). `use-welcome-seen.ts`, `use-stored-session.ts`.
  - One row for a re-join: the flip keeps a name-only ticket (`use-upload-queue.ts`); no device id read anywhere.
  - The host's cap: `get_event_by_qr_token` returns `max_upload_bytes` last (migration 233000), read by `hostCapOf`, handed
    to the Add sheet and the door's upload step, never the owner's.
  - A face moves at once: `profiles_album_note` and its stamp watch `avatar_updated_at` and `slug` (migration 233110).
  - Show-more hearts: an id joining `initialLikedIds` is liked before paint (`likes-provider.tsx`).
  - Her waiting uploads: `hasWaitingUploads` (server, the page, empty held albums only) → `waitingOnArrival` → `galleryEmpty`.
  - "A guest" retired: the typed-name entry's `displayName` is `string` (the server's shape), no stand-in in chip or look.
  - The viewer's loading state: a ring on the photograph's corner while the original comes (after 600 ms; load or error
    ends it; quiet while flying, pulled or zoomed); a clip's ring in its play button while it buffers (after 500 ms).
- **The rolled-back proofs, on the live schema, red first** (results at each file's foot, nothing persisted, checked
  after): 233000 red 0/1/4 fail, green 5/5 (the body hashes `024a2e476715c354436de3fa5708f30f`); 233110 red 0/1/2/5 fail,
  green 6/6 (a new face moves `attr_version` 2 -> 3).
- **Local, on `:3133` in headless Chrome** (scripts and captures in `_scratch/crumbs-43/`, never the repo): the demo
  album and a signed-out guest album (`Reel lane probe (disposable)`, joined each run: six name-only rows, "C43 Probe
  375", "C43 Probe 1440" and "C43 Console" twice each, no uploads, on no list), at 375 (touch) and 1440: a tap pushed one entry with `prPhoto`, the browser's Back closed the viewer onto
  the album (index 2 -> 1) with the 220 ms drop into the tile, Forward reopened it, a step stayed on one entry, the X
  went Back, a `?photo=` link closed in place; the terms line read "Photos and videos, up to 10 GB each." on the door's
  upload step and the Add sheet (no cap until 233000 applies); on a throttled network (50 KB/s, 300 ms) the ring stood
  on the stand-in from about 3.5 s until the original painted near 12 s, and a clip's play button turned to the ring;
  console clean on both albums after `f3594782`.
- **For the next build's red-team (signed-in, or needing the migrations):**
  1. Back on the host's hub album at 375 (willg97): open a photograph, the browser's Back closes it onto the hub;
     Forward reopens; the X goes Back; in the bin, Restore closes and the item leaves. A confirmed sender's credit look
     over the viewer (a hand's Sheet): Back closes the look alone, Back again the viewer.
  2. The welcome on a shared phone: signed in on a guest album through the welcome, the header's Sign out: the page
     stays and the door opens on the welcome, consent line and all, before its next step.
  3. The flip (names mode): a signed-out "C43 Flip" adds a photo; the host turns An email first on; her next file
     fails with the server's sentence and the page re-gates; the host turns it off; her Add lands; the Guests room and
     `guests` hold ONE "C43 Flip" row. Variation: she confirms through Google's chooser instead, and the guest list shows
     her once, confirmed.
  4. After 233000: a test event with a 100 MB cap: a guest's Add sheet and the door's upload step say "up to 100 MB
     each"; the host on her own guest page still reads 10 GB.
  5. After 233110: a confirmed guest with an upload changes her photograph or handle; an open album elsewhere shows the
     new face and door on the photograph's credit at its next poll, no reload.
  6. willg97 with more than 200 likes (bulk-like the scale probe from the hub's select mode): Likes, Show more, open a
     photograph from the new page: its heart is filled at once.
  7. An empty album that holds uploads: a signed-out guest adds a photograph (it waits), reloads: the row's Add and her
     tracker's badge from the first frame, and no "Add the first photo".
  8. Slow 3G in DevTools: the viewer's ring on a photograph and a clip's ring, at 375 and 1440, under reduced motion too.
- **The legal pages:** no word in `legal-privacy.tsx` goes stale ("small flags such as whether you have seen an event's
  welcome screen" stays true; clearing site data still removes them).
- **PREMISE (lab:smoke):** `disposable-mode`'s eight asks (the roll's camera, waiting room, wall, peek, create, video,
  cost and Save) describe the disposable roll, which none of this touches: its "waiting" is the roll before it develops,
  not a held upload, and the viewer's Save and Share are untouched. `event-ready`'s five (the host's readiness list,
  guide, create, needs, door) meet `host-app.md` only through the one line naming the viewer among the history entry's
  places. `locked-door`'s four (family, shape, wait, lost) keep their screens and words: the page gained one read on an
  empty held album, and the welcome only moved WHEN it shows, as the brief allows.
- Assets requested from Will: none.
- Board ideas: the first tap on a tile over venue Wi-Fi waited 0.6 to 1.5 s for the viewer's own code on `next dev`
  (the lazy chunk); worth a measure on a production build before any board.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** two migrations, independent, either order, each
  safe before or after the build that reads it: `20261001233000_guest_event_cap.sql` (drift check: live
  `get_event_by_qr_token` md5 `7ddab5f2a4e84c7cf788a35e2c5a7f43`; advisors: no delta; then regenerate `types.ts` and
  drop `hostCapOf` for `row.max_upload_bytes ?? null`) and `20261001233110_faces_move_attribution.sql` (before: the two
  profiles triggers on `display_name` alone; advisors: no delta; no types). Nothing else.
- **Calls his to overrule:** the welcome goes with the tickets (the name step's own put-down keeps it) · the flip keeps
  the name-only ticket, neither device-id option · Back on every album the grid lays, with the drop on the phone's Back ·
  the waiting read at first paint · the corner ring and the clip's ring as the viewer's loading state · the cap
  unredacted on the anon read.
- **Known residuals:** a tile tapped in the instant a close's Back is still landing could see the new viewer closed by
  it (only a synthetic back-to-back test reached it); a step's write inside a poll's refresh round trip is the class
  `lib/history-entry.ts` already names.
- **Look at first:** the phone's Back on a real phone over the guest album (Android's button and iOS's swipe), then the
  ring on a slow connection.
