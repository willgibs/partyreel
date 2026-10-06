---
track: guest-requests
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "e7ac98fe"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/event-experience
  - src/components/guest/door/welcome
  - src/components/guest/guest-upload
  - src/components/guest/gallery-live
  - src/components/app/event-feed/host-album
  - src/lib/events/album-sync
  - src/components/guest/camera/
  - supabase/migrations/20261006030000_sync_accepting.sql
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/marketing/chrome/chrome-link.tsx
  - docs/systems/database-security.md
  - supabase/migrations/20261005200000_capture_time.sql
---

# lp/guest-requests

**Goal.** Requests a guest's page never needed: the demo's links prefetch the marketing home only on intent, the first poll stops re-asking every link the seed answered, and the camera learns a closed album from the sync instead of asking.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3136 is yours; 3000 is Will's desk.

**Cost is designed like the architecture (Will):** we scale by events, not users, so a request saved on every guest's page compounds. Three ROADMAP lines, each quoted whole (read the code each names first):
- Guests: the demo fetches the marketing home on sight (six requests a load) from its three "Start your own" links (`event-experience.tsx` twice, `door/welcome.tsx`, `guest-upload.tsx`'s turn card); draw them through `ChromeLink` with `prefetchOnIntent`.
- Guests and host: on an event whose `attr_version` is above 0, the first poll after a page opens re-asks every link the seed answered (a `/api/album/guest/media` call of up to a window's ids), since those asks go out at the link store's attribution 0; set `store.links.setAttr(seed.sync.attr)` where the store is built (`gallery-live.tsx`'s initializer, likely `host-album.tsx`'s `createHubAlbum`); the compute model's test event has `attr_version` 0, so seed one whose attribution moved.
- Guests: the album's sync carries no `accepting_uploads`, so the camera asks a closed album again by itself (10 s, 20, 40, then each minute); carry it in the sync (a migration and the sync's reader) and the asking goes.

Each change pinned by a test that fails on the old code, and each measured: the requests a guest's page makes before and after, read in a headless Chrome of your own (CDP Network) on your port, and `pnpm compute:model` before and after (seed a test event whose attribution moved, as the second line says; a disposable test event of your own on willg97, deleted through its Settings at the end). The third needs a migration: `album_changes_since` was last defined by `supabase/migrations/20261005200000_capture_time.sql` (start from that body verbatim), the expand milestone 38's build and milestone 37's live build both survive (a deployed build's call still resolves: database-security.md's proof with no fixtures), named in its header with a rolled-back proof at its foot; the Orchestrator has the Advisor read it before the apply, and a typed seam stands until the types regenerate. The camera stops asking a closed album by itself, and still learns when the host reopens it.

`src/components/guest/live-gallery.tsx`, `gallery-order.ts`, `gallery-access.server.ts` and the guest page are event-zone's this round: if the seed's attribution must be read there, write it under Questions with the fewest lines and the Orchestrator sequences it. Docs: `docs/systems/guest-flow.md` is event-zone's and `uploads-and-r2.md` crumbs-83's: write the lines they need under your Handoff's proposed doc lines.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Q1. The switch rides the sync from the route's own read of the event, with no migration** (recommended, built).
  The guest sync route already reads `accepting_uploads` on every poll (`resolveAlbumViewer` → `get_event_by_qr_token`,
  the read that gives it the develop time), so the payload's word (`accepting`) and the validator's are one read and can
  never disagree, the develop time's own pattern. A copy inside `album_changes_since` would be a second read of one
  switch: the quiet path (the 304) never calls that function, so the validator would still hash the event row's value,
  and a flip between the two reads would leave a 304 standing on a stale word unless the 200's validator hashed the
  snapshot's instead; and it costs an apply, the Advisor's read, a drift check and a deploy order for no gain.
  `20261006030000_sync_accepting.sql` was not written. Overrule: the migration and the planner carry it (the payload's
  word from the snapshot), the validator lines below unchanged.
- **Q2. The validator hashes the switch, only while it is off** (recommended, built; outside owns, held by no open
  lane, event-zone merged first). Without it a close or a reopen moves no media row, so a quiet album's poll answers 304
  through either and an open camera never hears a reopen. Only while off: an album taking uploads keeps its validator
  byte for byte (nothing rolls at the deploy), and the page's seed hashes it too (one line in
  `gallery-access.server.ts`), so a closed album's first poll is still a 304. A closed album's validator moves once at
  the deploy: one 200 per open page on a closed album, then 304s.
- **Q3. A full album keeps the camera's calm cadence** (recommended, built). No answer says whether the host made room,
  and carrying it would read her storage on every 200. Overrule: carry the upload gate's `albumFull` word beside
  `accepting`, and the cadence goes for both.
- **Q4. An idle camera hears a reopen on the album's own net** (recommended, built). It used to ask a presign every
  minute of its own; it now hears the album's next poll: within a minute for a guest at the camera, at once on any touch
  (the net asks at once when its last ask is older than a minute), and at the net's rest (five minutes) after ten
  untouched minutes, never by a presign. Measured: reopened after ten untouched page-minutes, heard on the rested poll
  two page-minutes later (the camera measure under the Handoff).
- **Q5. A refusal over a word that said open asks the album afresh** (recommended, built): one sync with no validator
  (`askUploadsWord`), since that word's validator says open too and a host who reopened before the next poll would be
  answered 304 and never heard. One 200 per closed refusal the page did not already know about; nothing when the page's
  word already said closed.
- **Q6. The door's camera keeps its cadence for both refusals** (recommended, built as it stands). `entry-modal.tsx`
  (not mine) mounts it with no word, and at the door the album is a teaser or not mounted, which carries none; uploads
  closing fails Require an upload to view open, so a held guest is let past the door anyway. Deferred below.

## System-doc edits (in place, owned facts only)

- none in place: this lane owns no system doc; the lines `guest-flow.md`, `disposable-mode.md` and `host-app.md` need
  are proposed under the Handoff.

## Deferred (ROADMAP one-liners, bucket named)

- Guests: the door's camera (`entry-modal.tsx`'s `AlbumCamera`) is handed no word on uploads, so it still asks a closed
  album again on the calm cadence; hand it `uploadsWord` and `onAskUploadsWord` as the album's own camera has them
  (`guest-upload.tsx`).
- Tooling: `pnpm compute:model` measures only "Compute model (test)" (`EVENT_NAME` in `run.mjs`); a `--event-name` flag
  would let a lane measure an album of its own (guest-requests ran a scratch copy for an album whose attribution moved).

## Handoff (replaces the chat report)

Artifacts are under `/Users/gibby/local/ai/partyreel-wt/_scratch/guest-requests/` (`S/` below).

- **Commits, pushed:** `9bd0e10bb` (the sync's word on uploads and its validator: the out-of-owns half, below),
  `a16eb354b` (the three items), sync `f862c08f5` (merge of launch-prep at `62a471d69`: crumbs-83, lab-kit-2 and
  drive-hardening; crumbs-83's reshaped case in `guest-upload.test.tsx` kept as it is). Since then launch-prep moved
  only in crumbs-84's, brand-r2's and the records' paths, touching nothing of mine (`git merge-tree` clean against
  `0d78236fd`), so no second sync. The two work commits land together or not at all: without `9bd0e10bb`'s validator a
  quiet album's reopen is never heard, and the camera no longer asks by itself.
- **Gates on `f862c08f5`**, each on its own exit code: typecheck 0, lint 0, test 0 (1,054 files, 13,192 tests), build 0,
  `lab:smoke --base http://localhost:3136` 0 (181 checks, 0 failing): `S/gate2-{typecheck,lint,test,build,smoke}.log`.
  (On `a16eb354b` before the sync: typecheck, lint and test 0, `S/gate-*.log`.)
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file, and the exceptions of Q1
  and Q2 (held by no open lane, event-zone merged before the edit), all in `9bd0e10bb`:
  `src/app/api/album/guest/sync/route.ts` and its test, `src/lib/events/album-validator.ts` and its test,
  `src/lib/events/album-wire.ts` (`GuestFullSync.accepting`), and one line of `src/lib/events/gallery-access.server.ts`
  (the seed's validator) and its test. Not written: `supabase/migrations/20261006030000_sync_accepting.sql` (Q1).
- **1. The demo's doors to the home prefetch on intent** (`door/welcome.tsx`, `event-experience.tsx` twice,
  `guest-upload.tsx`'s turn card, through `ChromeLink`'s `prefetchOnIntent`; pinned by
  `event-experience.demo-links.test.ts`, `door/welcome.test.tsx`, `guest-upload.turn-card.test.tsx`, each red on the
  old code). Measured on `next start` (the measuring server), a fresh headless Chrome context each, 390 and 1440:
  108 requests a load to 85 and 86; the home's six segment prefetches (`/_tree`, `/_head`, `/_index` and three route
  segments) 6 to 0, its three sheets and thirteen chunks to 0; a pointer on the welcome door's link fetched the home's
  22 (`S/measure/out/{before,after}-demo.json`).
- **2. The link stores start at the seed's attribution** (`gallery-live.tsx`'s initializer, `host-album.tsx`'s
  `createHubAlbum`; pinned by `gallery-live.test.tsx`'s ask made as the album mounts and `host-album.test.ts`, red on
  the old code). On "guest-requests attr probe (test)" (attr_version 1), a returning guest's load: a 24-id
  `/api/album/guest/media` call 0.5 s after the first poll, gone (`S/measure/out/{before,after}-attr.json`). The compute
  model's guest scenarios on that album (a scratch copy aimed at it, `S/cm/`, K 20): links calls join-upload 3 to 0,
  hour-live 2 to 1, hour-down 2 to 1, viewer-20 1 to 0, the hours' one left their re-mint at sixty minutes
  (`S/cm-{before,after}/results.json`). The hub is unit-pinned: the hidden Browser pane flushes no hub effects (its
  `/dashboard/<id>` showed no sync at all), so its live check is the desk's (below).
- **3. The camera hears a closed album reopen from the album's own word** (the route carries `accepting` and its
  validator hashes it while off; `gallery-live.tsx` tells each word and `askUploadsWord`; `event-experience-open.ts`'s
  `useLiveUploadsWord` counts them; `album-camera.tsx` asks once on the first word after the refusal that says open;
  pinned by the route's, the validator's, the seed's, gallery-live's, the hook's, the page's and the camera's tests, red
  on the old code where they assert the change). On "guest-requests camera probe (test)", a fake camera, K 20: a shot
  refused as closed, then ten page-minutes closed: presigns 12 to 1 (the shot itself), polls 11 to 12 (one 200 asked
  afresh after the refusal, the rest 304); reopened, the album's next poll (a 200 saying `accepting: true`, on the net's
  rest, 6.3 s real) and one presign landed it (`S/measure/out/{before,after}-camera.json`; the device's whole run in
  the ledgers `S/measure/server-{before,after}.jsonl`: presigns 14 to 2, their CPU 163 to 31 ms).
- **The standard compute model on `a16eb354b`**: every scenario within `budget.json` (host-dashboard skipped, no
  session), exit 0 (`S/cm-standard.log`). Its scenarios reach none of the three paths (an attribution of 0, no camera,
  no demo), hence the attr-moved album's runs above.
- **For the desk:** (a) the two probe events above, on willg97, seeded through `scripts/seed-demo-event.mjs` (ids
  `efdaa41e-6434-45d0-8061-d3be396833ca` and `08fccfb6-3636-4a3a-bf09-ee6338d89c51`; uploads left on) are to be deleted
  through their Settings, a press the lane left to the desk; (b) the hub's live check on the Scale probe
  (attr_version 4): a load makes one `POST …/sync` and no `…/media`, where the old code asked the first window's ids
  right after it.
- **Proposed doc lines** (their docs are not mine; `host-app.md` is crumbs-84's until its record):
  - `guest-flow.md`, the seed paragraph, after "the store adopts it as its own first `sync()`, answered locally.": ★ Its
    link store starts at the seed's attribution (`setAttr(seed.sync.attr)` where the store is built): the page mints the
    first window's links after it reads that version, and the asks made as the album mounts (the reel's cover stills)
    go out before the seed is adopted, so a store left at 0 re-asked every embedded link on the first poll of any album
    whose attribution had ever moved.
  - `guest-flow.md`, the validator bullet, after "+ the live reel's facts (so a host's switch reaches an open page)":
    + whether the album takes uploads, while it is off (each full answer carries the switch as `accepting`, from the
    same read of the event, and the page's seed hashes it too: a close or a reopen moves no media row).
  - `disposable-mode.md`, "The camera over a refusal of the album", its middle: ... stops the shutter in the server's
    words. Closed, it hears the album's own word (`uploadsWord`: the sync's `accepting`, each word the page hears
    counted) and asks again once, on the first word heard after the refusal that says open, never by itself; a refusal
    over a word that said open asks the album afresh (`askUploadsWord`, one sync with no validator, since that word's
    validator says open too). Full, and closed on the door's camera, which is handed no word, it asks again by itself,
    calmly: after 10 s, then 20, 40 and every minute, ... (the rest as it stands).
  - `host-app.md`, the hub's album bullet: its link store starts at the seed's attribution (`createHubAlbum`), so the
    first window's links are never re-asked by the first poll of an album whose attribution moved.
- **ROADMAP:** the three lines this lane was cut for are done (the demo's prefetch, the first poll's re-ask, the sync's
  `accepting_uploads`), for the record to retire; the two Deferred lines above are new.
- Assets requested from Will: none.
- Board ideas: the page's Add follows the album's live word on uploads (`useLiveUploadsWord` is on the page now: a
  host closing uploads mid-party leaves Add offered until a refusal says so, and reopening leaves the view-only line
  until a refresh; what Add says over a closed album is the question) · the demo's Start your own dims while its
  navigation waits, as the wordmark does (`LinkPending`), now a phone's tap has only the touch-down's head start.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none (Q1).
- Calls his to overrule: no migration (Q1) · the validator moves only while closed, once for a closed album at the
  deploy (Q2) · a full album keeps the cadence (Q3) · an idle camera hears a reopen on the net's rest, five minutes after
  ten untouched (Q4) · one sync asked afresh per closed refusal over an open word (Q5) · the door's camera keeps its
  cadence (Q6) · the demo's links fetch on intent with no wait shown (board idea).
- Look at first: `album-camera.tsx`'s word block (the refusal's `heard`, one ask a word), `gallery-live.tsx`'s tapped
  sync (the word told, the afresh ask), then the route's three `accepting` lines.
