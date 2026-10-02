---
track: disposable-foundation
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "7a875407"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/
  - src/lib/db/queries/album-guest
  - src/lib/db/queries/album-state
  - src/lib/db/queries/guest-events
  - src/lib/db/queries/guest-gate
  - src/lib/db/queries/social
  - src/lib/db/queries/my-uploads
  - src/lib/db/queries/likes
  - src/lib/db/queries/reports
  - src/lib/db/queries/media
  - src/lib/db/queries/exports
  - src/lib/db/mutations/
  - src/lib/events/gallery-access
  - src/lib/events/guest-experience-summary
  - src/lib/validation/event
  - src/lib/media/limits
  - src/lib/disposable/
  - src/app/api/album/guest/
  - src/app/api/guests/mine/
  - src/app/api/export/guest/
  - src/app/api/reports/
  - src/app/api/r2/
  - src/app/api/cron/purge/
  - src/lib/jobs/
  - src/lib/lifecycle/sweeps/
  - src/app/admin/jobs/
  - src/app/(guest)/e/[token]/card/
  - src/app/(guest)/e/[token]/actions
  - src/app/(app)/dashboard/[eventId]/actions
  - src/components/app/event-settings/adds-page
  - src/components/app/event-settings/settings-state
  - src/components/app/event-settings/camera-settings
  - docs/systems/disposable-mode.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/database-security.md
  - docs/SYSTEMS.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/disposable-mode.json
  - src/app/(dev)/design/sandbox/disposable-mode/
  - docs/systems/guest-flow.md
  - docs/systems/billing-caps.md
  - docs/systems/reel.md
  - src/lib/constants/tiers.ts
---

# lp/disposable-foundation

**Goal.** Build disposable mode's foundation: an event's mode and reveal, a per-row seal every guest read path honours from one predicate, a develop that is a write so a parked phone learns it, the server-counted roll, and the host's control in Settings; no camera or waiting-room UI yet.

## The brief

**Why.** Every product decision for a disposable-camera event is taken (`docs/reviews/disposable-mode.json`, rounds 1 to 3; the board `src/app/(dev)/design/sandbox/disposable-mode/` draws them):
- The reveal is the host's setting: straight away, or a develop time guests can see (9 am the next day by default), with Develop now (r1, his note: "This should be a host config so they can either choose immediate uploads/visibility or set a 'develop' time guests can see to get them excited and in the loop. It creates that 'return' payoff moment where everyone sees the final album.").
- The mode switches both ways at any time (r1: "Ideally, it's very streamlined for hosts to switch between if they'd like, so if a host changes their mind last minute despite having everything set up ... we don't tell them 'sorry, have to make a new event from scratch'.").
- 24 shots a guest, counted by the server, at full size; videos on paid plans with Videos on, up to 10 s; a video is one shot (`cost=one`); a deleted shot never gives its frame back; no look (`look=none`: the originals, untouched).
- Before develop a guest sees and deletes her own shots and everyone's only as a count and their minutes (the contact sheet, `waiting=sheet`, wave 2's); the host's album waits under a cover she can lift (`peek=covered`, UI later); the room's screen plays the live slideshow until develop (`wall=slideshow`, UI later); at develop the reel premieres the roll.

**The model** (the Advisor's read of the live catalog, Q8; build it or say plainly where you found better):
1. **The event**: its mode (album or disposable), its reveal, its develop time, and `sealed_from` (when a disposable period starts). The new columns join BOTH the INSERT and the UPDATE column grants on `events` (live: 16 columns each; `authenticated` holds no table-level write), so the wizard's later wiring needs no migration. `get_event_by_qr_token` returns the mode and the develop time by the Q7 pattern (DROP and CREATE, the four holders restated).
2. **The seal is per row**: `media.sealed_until timestamptz`, null meaning visible. One predicate, `sealed_until > now() and e.host_id is distinct from (select auth.uid())` (the host exempt), applied inside every SQL home (`event_covers`, `event_stills`, `event_card_stats`, the album functions) and as a column filter on the guest path's four PostgREST reads (`album-guest.ts:144` and `:211`, `guest-events-admin.ts:178` and `:469`), or those reads move into SQL. `sealed_until` joins no client UPDATE grant (today only `removed_at, status`). Not `pending`: `create_media` derives status from `moderation_mode` alone, `pending` feeds the host's Review and its counts, and a mass flip would stamp `let_in_at` on every row.
3. **Sealed ids never leave the server.** The album's scope (`album_changes_since`) carries no sealed row; the sync's answer carries `sealed: {count, minutes[]}`, hashed into its ETag; her own sealed shots ride her tracker's read (`/api/guests/mine`); the links route refuses every sealed id. `countApprovedMedia` takes the same predicate, or every poll heals forever.
4. **Develop is a write.** The guest poll's quiet path never reads media or the clock (`src/app/api/album/guest/sync/route.ts:110-126` builds its validator from `album_state` and the count, `165-167` answers 304), so a lazy predicate alone reaches nobody until a reload. The first guest or host read after the develop time runs an idempotent `develop_due(event)` (one guarded UPDATE clearing the due rows); the album triggers (`notify_gallery_change`, `media_album_note`, `media_album_stamp`) and `album_scope` learn `sealed_until`, so the unseal versions the album and rings the doorbell, and never stamps `let_in_at`; a daily `develop_due` sweep joins the purge cron with its own card on `/admin/jobs` (a job ships its health signal), so an album nobody reads still converges. Develop now and disposable to album are the same UPDATE by hand. (If you find `pg_cron` available and better, propose it in your Questions; don't install it.)
5. **Switching**: album to disposable seals only what comes after; disposable to album unseals everything at once; a new develop time rewrites the event's sealed rows; a second disposable period restarts the roll from `sealed_from`.
6. **The roll**: refused early at presign through `get_upload_gate`'s answer (`roll: {used, cap}`) and enforced in `create_media` under `pg_advisory_xact_lock` on the guest (two concurrent completes otherwise both count 23), counting the guest's rows of any status since `sealed_from`; `create_media_as_host` exempt. Presign stays stateless (`uploads-and-r2.md`). Two gaps, accepted and written down: a signed-out guest who clears her storage mints a new ticket and a new roll; a video's length is the client's word, so a disposable video also carries a byte ceiling (`src/lib/media/limits.ts`).
7. **Every id-keyed route is a matrix cell by name**: the links route, the card route (`/e/[token]/card?photo=`), `like_media`, `create_report`, the export's `ids` (`src/app/api/export/guest/route.ts:65`), plus the reel and `event_stills`, covers on cards, profiles and OG images, faces and credits, likes, the doorbell and every count.

**Questions with my recommendations** (build the recommendation, write each under Questions):
- A sealed uploader joins the Guests list and the credits at develop, not before (the two attribution reads: `guest-events-admin.ts:322`, `social.ts:945`).
- Her own sealed shots are in her own download (`set = "yours"`).
- "The room's screen" is the host's own signed-in session only; a screen link anyone could open is Will's question for the rooms lane, never built here.

**Settings and the guest's Add.** The mode and the reveal are one mountable component (`camera-settings`) on Settings' "what guests add" page (`adds-page`, yours), so the create wizard's later wiring mounts the same control. Until the camera lands (wave 2), Add in disposable mode is today's sheet with its photos counted against the roll; the 25th is the server's sentence, which the queue already surfaces. `event-experience.tsx` and the queue are `header-wiring`'s: never touched.

**Migrations.** Files in `supabase/migrations/`, each with a rolled-back Supabase MCP check of every new or changed RPC in your Handoff; the Orchestrator applies them by protocol after the Advisor reads them and regenerates `src/lib/db/types.ts` (never hand-edited: write a seam for the new columns, named in the Handoff, dropped at the regeneration). A new enum value cannot be used in the transaction that adds it, should you add one. ★ Prod (milestone 33) and the alias share the database: a sealed test album is readable through partyreel.com's older app-side reads until milestone 34; that is accepted for test data and written into build 43's red-team brief.

**Tests.** The leak matrix in Vitest (every SQL home and the four app-side reads, a guest never reaching another's sealed shot by any route above), the develop reaching a parked poll (the 304 path), the roll's 25th refused and its race held by the lock, the switches both ways. System docs: a new `docs/systems/disposable-mode.md` (registered in `docs/SYSTEMS.md`), `uploads-and-r2.md`, `database-security.md`.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:3133`; a rolled-back Supabase MCP check of every new or changed RPC, its output in the Handoff; the leak matrix green; signed-in and upload steps localhost cannot drive named for build 43's red-team.

## Questions (a recommended answer each; the Orchestrator relays them)

Each answer below is built; Will's to overrule. The model is the program's synthesis of 2026-10-02 (two answers,
disposable a preset); where this lane found better, it says so.

- **The period also starts when the camera begins.** The brief stamped `sealed_from` only when `develops_at` goes from
  none to a time, which leaves a camera with no develop time no period to count a roll from. Recommend: it stamps when a
  develop time comes ahead (from none, or from one already reached: a new develop is a new roll) and when the camera
  begins (an upload album turned camera starts every guest on a fresh roll), and clears when neither remains.
- **The ceiling lives in its own ledger** (`camera_rolls`), not a count of media rows: the fast purge deletes the very
  rows such a count reads, so it would forget the churn by morning. Recommend: the ledger (one deny-all table, the
  advisors' `rls_enabled_no_policy` 18 to 19).
- **The churn bound, as asked.** The premise "deleted bytes still count against the host's cap until the purge" does
  not hold: the cap reads ACTIVE bytes (`host_active_bytes`), so a withdrawn shot leaves it at once. What bounds a
  delete-and-reshoot: the monthly ingress meter (every upload counts and is never given back: 20 GB on Free, 3x the cap
  on paid), the ceiling (rows), the fast purge (storage). Recommend: as built, nothing on the cap's side.
- **The fast purge's reach:** her own withdrawal (`removed_by_uploader`) of a row taken in the camera's period only; a
  host's removal and a withdrawn free upload keep the bin's 30 days. Recommend: as built.
- **A save into a develop time seals the album's held rows too.** Else a host moving from approving each to a develop
  time approves the held photos (`approveAllPending`) and shows them at once. Recommend: as built (no guest has seen a
  held row, so sealing one hides nothing anyone saw).
- **The save's rewrite takes only the rows it can lock (SKIP LOCKED)** inside the event row its own UPDATE holds; a
  skipped row heals on the next read. The narrow cost: a straggler sealed to an earlier time that no read reaches
  before that time shows once, then. Recommend: accept (an event-row lock closed measured deadlock cycles).
- **A held upload now moves the guest album's `album_max` and rings** (what waits counts held rows), so a hold album's
  open pages answer one 200 per held upload where they answered a 304, carrying no change. Recommend: as built.
- **`waiting` carries `developsAt`** beside `{count, minutes}`, so a parked page learns a moved develop time (the
  validator hashes it); the field is absent where nothing waits and no develop time is set. Recommend: as built.
- **`get_event_by_qr_token` returns four columns last** (`develop_due`, then `develops_at`, `capture`, `roll_size`).
  Recommend: as built.
- **The roll's identity is hers, not a ticket's:** her ticket's rows and her account's rows at this album, so an account
  holding two tickets (a claim) has one roll. Recommend: as built.
- **`roll_size` takes 1 to 24 through the column grant** (no Settings control; the trigger fills 24 and clears it for
  free uploads). Recommend: as built; a larger roll is a pricing call.
- **The Settings sentence:** the review word stays a two-way live word where no develop time is set; with one set it is
  prose (the page owns the time), so the sentence never offers approve plus develop. Recommend: as built
  (`settings-rows.tsx` untouched).
- **The host's own uploads seal with everyone's** (exempt from the roll, the ceiling and the video bounds, not the
  seal), so the album develops whole. Recommend: as built.
- **The brief's three, built:** a sealed uploader joins the Guests list and the credits at develop, not before; her own
  sealed shots are in her own download (Yours); the room's screen is the host's own signed-in session only (nothing
  built here).
- **No pg_cron:** the album's first read develops it in the day and the purge cron's `develop_rolls` is the nightly
  backstop. Recommend: no pg_cron.
- **The words** ("You've taken all 24 shots on your roll.", "You've used every retake this roll allows.", a camera
  video's two lines, the control's labels and lines) are the plain working version; the design board after this lane
  owns them (each sentence has one home and a parity test).


## System-doc edits (in place, owned facts only)

- `docs/systems/disposable-mode.md`, new, registered in `docs/SYSTEMS.md`: the model, the one predicate and its homes,
  what waits, develop as a write, the save's rewrite and the lock rule, the roll, its ceiling and the fast purge, the
  control, the seams, how it is verified.
- `uploads-and-r2.md`: the seal and the camera decided at insert; her own held and sealed pictures presigned for her
  alone; Yours plus her sealed shots.
- `database-security.md`: the advisor count (19 `rls_enabled_no_policy`); `develop_due` and its sweep service-role
  only; the develop's five helpers the owner's alone; `camera_rolls` among the deny-all tables; a write that holds an
  event row never waits on a media row.
- Exceptions, facts this lane changed, refined in place: `guest-flow.md` (the doorbell rings on what waits),
  `lifecycle-recovery.md` (a withdrawn camera shot's purge that night; `develop_rolls` first of the budgeted sweeps),
  `admin-observability.md` (`develop_rolls` a sub-sweep job); the help center's
  `review-uploads-before-they-appear.mdx` and `event-settings-explained.mdx` (the Review switch moved into the
  three-way answer; `help-ui-labels.test.ts` holds every quoted label to a shipped string).


## Deferred (ROADMAP one-liners, bucket named)

- Guests: her tracker draws the `picture` `/api/guests/mine` now answers for her held and sealed items (presigned for
  her alone; the server half shipped in `disposable-foundation`), which retires the two lines on her placeholders for
  held photos once drawn.
- Guests: the camera (the shutter, the roll's count, a 10-second hold), the waiting room (what waits, its minutes, the
  develop time) and the reveal draw on this foundation (`waiting` on the sync, `roll` on the upload reads), a design
  board's first (from `disposable-foundation`).
- Host: the host's cover over a waiting album on her dashboard, and approve plus develop in Settings, a design board's
  (the schema takes both today; from `disposable-foundation`).
- Ops: drop the lane's typed seams at the types' regeneration (the Handoff names each), and `readOwnUploads`'
  missing-column fallback once the migration is applied (from `disposable-foundation`).


## Handoff (replaces the chat report)

- **Commits, pushed to `lp/disposable-foundation`:** the work `876a8a49`; the sync `bb3f4d62` (origin/launch-prep
  `c958cf69` merged, no conflicts; no migration had landed there since the cut); this manifest's commit on top (the
  chat line's head).
- **Gates on the synced tree, `bb3f4d62`, each on its own exit code:** `pnpm typecheck` 0; `pnpm lint` 0; `pnpm test`
  0 (777 files, 9,191 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3133`
  0 (163 checks, 0 failing). Logs: `_scratch/disposable-foundation/sync-{typecheck,lint,test,build,smoke}.log`.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` (81 files) = owned paths and this file, plus these
  exceptions, each a fact or a pin this lane's change moved:
  - `content/help/review-uploads-before-they-appear.mdx`, `content/help/event-settings-explained.mdx`: the Review switch
    moved into "When everyone sees what's added"; both quoted its old label and dialog (`help-ui-labels.test.ts`).
  - `docs/systems/guest-flow.md`, `lifecycle-recovery.md`, `admin-observability.md`: the doorbell on what waits, the
    withdrawn camera shot's purge and `develop_rolls`, refined in place.
  - `src/components/marketing/mock-parity.test.ts`: the curation page's quoted review line moved, word for word, to
    `camera-settings.tsx`; the pin follows it.
  - `src/lib/album/testing/album-sim.ts` (mirrors `album_bits`: the seal and what waits) and `src/lib/album/store.test.ts`
    (a held upload now moves `album_max`: reshaped, scar kept).
  - `src/lib/db/migration-guards.test.ts`, `src/lib/db/guest-cap-and-faces-guards.test.ts`: pins on bodies this
    migration carries (the event read's four columns, the insert's `sealed_until`), reshaped with their scars.
  - `src/lib/errors/codes.ts` and its test: the `roll_spent` code and its fallback.
  - `src/lib/events/album-wire.ts`, `album-validator.ts`: `waiting` on the full sync; the develop time in the validator.
- **The migration, `20261002200000_disposable_foundation.sql`**, applied by its header's protocol:
  - drift, read-only on live (2026-10-02): all 17 bodies it replaces hash as its header records, and none of its new
    columns, table, functions or flag exists;
  - its rolled-back check, at its foot: LIVE RED 18/18 fail, each on what it lacks; LIVE GREEN 18/18, plus the 26 bodies
    it writes fingerprinting `79b9b7ec8e395fa4ae75cfe33a8e3c7d`, the stand-in's own from the file verbatim; nothing
    persisted (re-read after: no new object, no fixture row, `create_media` still `70a83228`); the stand-in (PG17,
    every migration replayed) the same, red without the file and green with it;
  - expected advisor delta: `rls_enabled_no_policy` 18 to 19 (`camera_rolls`); 0028 and 0029 unchanged;
  - concurrency, on the stand-in: twelve writers of every shape on one host's two albums for 90 s, 137 deadlocks in
    8,718 transactions, none naming the event row or an album row and none in a save (998 saves of the develop time or
    the capture, each rewriting its rows; the baseline before this lane, 176 in 9,529);
  - regenerate `types.ts`: events `capture`, `roll_size`, `develops_at`, `sealed_from`; media `sealed_until`; the table
    `camera_rolls`; `get_event_by_qr_token`'s four columns; `develop_due`, `develop_due_sweep`.
- **Typed seams to drop at the regeneration:** `developFactsOf` (`src/lib/disposable/facts.ts`, keep it as the
  parser, drop the field-by-field comment), the `develop` record cast in `updateEvent`
  (`src/lib/db/mutations/events.ts`), `untypedAdmin` (`src/lib/disposable/develop.server.ts`), `untyped`
  (`src/lib/lifecycle/sweeps/develop.ts`), the host media selects' `overrideTypes` (`src/lib/db/queries/media.ts`);
  and once applied, `readOwnUploads`' missing-column fallback (`seal_schema_missing`, `guest-media.ts`).
- **The items:**
  - the event's two answers (`capture`, `develops_at`, with `moderation_mode`), `roll_size` and the stamped
    `sealed_from`; the per-row seal and its one predicate in all eight SQL homes and every guest-path read;
  - no waiting id leaves the server: `album_bits`' third bit, `waiting: {count, minutes, developsAt}` on the full sync
    and the seed (full access only), the develop time in the validator, the doorbell on the album's own bits;
  - develop as a write: `develop_due` on the read that needs it, the `develop_rolls` sub-sweep with its card and switch,
    a save's rewrite in that save (`events_develops_rewrite`), Develop now in the database's clock;
  - the roll on live shots (a withdrawn one frees its frame) under the profiles lock and its advisory lock; the ceiling
    in `camera_rolls`; a withdrawn camera shot purged that night; a camera video 10 s and 128 MB; presign refusals in
    the server's words, the complete's 409;
  - her own held and sealed items in her tracker with pictures presigned for her alone, and her own sealed shots in
    Yours; another guest can neither read nor withdraw one (the check's step 17);
  - Settings: "How guests add" and "When everyone sees what's added", one mountable control (`CaptureAndReveal`),
    today's Review switch moved into it, a consequence line before anything held or waiting shows;
  - tests: the SQL guards, the app leak matrix (teeth proved: dropping the filters fails 7 of 9), the seal model with
    held rows, the roll's parity, the routes, the control, the sweep.
- **Red-team for build 43, on the alias** (what localhost cannot drive): as a guest on Will's phone at a camera album,
  shoot 24 and meet the 25th's sentence at the presign, withdraw one in her tracker and shoot again; set a develop time
  and check that `/api/album/guest/sync` and `/api/album/guest/media` never carry a sealed id (the network panel), that
  her tracker shows her sealed shot, and that the host's dashboard shows every shot; Develop now from Settings, and a
  parked guest page fills on its next poll; move from "Once you approve each" with a held photo to a develop time and
  confirm it waits; check the hub's guest count stays put until the develop. ★ Prod and the alias share the database:
  until the build with the app's half deploys, a sealed TEST album reads through the older build's guest reads.
- **Calls his to overrule:**
  - the two answers, how guests add and when everyone sees, with "disposable" a preset (camera plus a develop time),
    never a column (the program's synthesis);
  - "When everyone sees what's added" as one three-way choice, today's Review switch inside it;
  - the ceiling: three rolls' worth a guest a period, removed or not;
  - the fast purge: a camera shot she withdraws purges that night;
  - the period starts when a develop time comes ahead or the camera begins (a new develop or a camera is a new roll);
  - a held upload counts in what waits, so a hold album's guests see a waiting count.
- **Proposed migrations:** the one above. Worker, Vercel, Stripe, env: none.
- **Assets requested from Will:** none.
- **Board ideas:** the camera, the waiting room and the reveal (what waits, its minutes, the develop time are on the
  wire); the host's cover over a waiting album; whether approve plus develop is ever offered, and the preset's name.
- **Look at first:** the migration's header (the model, the lock analysis) and its check; `camera-settings.tsx` (the
  three-way choice and its consequences); `develop_rows` and `events_develops_rewrite` (the save's rewrite, SKIP
  LOCKED); `waitingFor` and the sync route's validator.
