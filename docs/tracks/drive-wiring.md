---
track: drive-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "46682654"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/20261005120000_cloud_export.sql
  - workers/drive/
  - src/lib/drive/
  - src/lib/export/drive-names
  - src/lib/db/queries/drive
  - src/app/api/drive/
  - src/app/api/internal/drive/
  - src/components/app/drive/
  - src/components/app/export/take-home-panel
  - src/app/(app)/account/page.tsx
  - src/components/app/storage/storage-list
  - src/components/app/dashboard/events-section
  - src/lib/env.ts
  - src/lib/email/templates
  - src/app/admin/exports/
  - src/lib/jobs/spend-watch.ts
  - docs/systems/drive-export.md
  - docs/SYSTEMS.md
  - docs/systems/database-security.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/trust-safety-forensics.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/export/
  - workers/export/
  - workers/backup/
  - src/lib/r2/presign.ts
  - src/lib/db/read-all.ts
---

# lp/drive-wiring

**Goal.** Send to Google Drive, wired as Will picked it on desk 2 (2026-10-05): from Take it home's Originals card beside Download, from Your events and from What's using space; connecting behind our own promise; progress on the album it sends; a stop said in place with its one act, its email, and an app-wide flag when it needs her; done as done, with nothing that suggests deleting what was sent; a Google Drive card in Account; files named when, then who. The design note `../partyreel-wt/_scratch/drive-export/design.md` (Advisor-reviewed, Q25 and Q27) is the build, minus its clean exit.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU is at its limit). Port 3136 is yours; 3000 is Will's desk and the red-teams', never touched; 3130 is the Orchestrator's gate. Sign-in works only on the desk build at 3000 (Supabase allows that callback alone), so your own walks of the signed-in surfaces run against fakes and tests; the live connect, send and disconnect walk is the Orchestrator's on the desk build after your merge, once Will's Google client exists.

**Read first, whole:** `../partyreel-wt/_scratch/drive-export/design.md` (sections 1 to 7 and 12 are the build; 8 is dropped, below; 9 and 10 are later versions; 11 is Will's step, being relayed now; 13's answers are below), `q25-advisor.md` and `q27-advisor.md` beside it, the board's own `spec.ts` and drawings (`src/app/(dev)/design/sandbox/drive-export/`, every option Will picked), and his ledger `docs/reviews/drive-export.json` with his notes.

**Will's picks (desk 2, his notes synthesized):**
- **way-in = originals:** Send to Drive is a second act on Take it home's Originals card, beside Download: original quality goes home by Download or by Drive; Phone size stays its own card. Not a third card.
- **doors = both:** Your events can send several albums at once, and What's using space offers Drive.
- **connect = promise:** our promise of how little drive.file reaches, then Google's screen, then a final press back on the album.
- **progress = album:** the send shows on the album it sends; she can close the tab.
- **hard = in-place, plus a flag she cannot miss.** Each stop turns the send's own place to its light, its words and its one act (Check again, Reconnect, Retry), and sends one email. His note: a warning tucked where she can navigate away is easily never seen. So a stop that needs her (Drive full, disconnected, files that won't go) also flags itself app-wide: the house's toast on her next page anywhere in the app, once per stop, carrying the act or the way to the album, and the app's bell where one exists. A pause that resumes by itself (Google's daily 750 GB) stays quiet in place, with its email.
- **done = done-only:** "Done, every one checked", Open in Drive. **Nothing in the export flow suggests deleting what it sent** (PRICING.md's new rule, "Export is an off-ramp, never a one-click exit"): storage tiers are what Partyreel is paid for, and an easy off-ramp is what makes a month of Pro an easy opt-in. Deleting stays where it already is (select and delete in an album, Delete event in Settings, What's using space).
- **exit: dropped.** Design section 8 (the clean exit, its fresh re-check, Free 7.4 GB) is not built: no exit act in `cloud_export_act`, no Free line anywhere, no exit email.
- **account = card:** a Google Drive card under Plan: connected as, the Partyreel folder, what's been sent, Disconnect.
- **naming = when, then who** (`Partyreel / Maya & Jay · 12 Sep 2026 / 2026-09-12 21.14.05 · Priya.jpg`). Will asked whether batches make arrival time group by guest; capture time would be truer, but the app keeps none today (the browser strips everything but orientation before upload; `media` holds only `created_at`). Build the names on arrival time through one naming function that takes a capture time when one is known (null today), and set each Drive file's `modifiedTime` to the same stamp so Drive's own sort agrees. Keeping a capture time at upload is a separate decision, Will's.
- **Which plans:** every plan (section 13's recommendation, built; his to overrule). Live sync and Dropbox are later versions.

**The wiring points owned by crumbs-75 until it merges** (`src/lib/email/send-kinds.ts`, `src/app/admin/jobs/catalog.ts`, `src/lib/lifecycle/account-deletion.ts`, `docs/systems/admin-observability.md`): each is a one-line exception you touch only after crumbs-75 merges (orchestrator.md announces it), syncing first by `git merge origin/launch-prep`; list each under your lane check.

**The migration** is exactly `supabase/migrations/20261005120000_cloud_export.sql` (section 12's tables, RPCs and `ops_flags` row, minus the exit), with its rolled-back contract check at its foot run through the Supabase MCP (begin; ... rollback;). The Orchestrator applies it after the Advisor reads it; nothing of yours writes to the database. **The Worker** (`workers/drive/`, its own tests with a fake Drive and a fake R2) and its queues and secrets are deployed by the Orchestrator: your Handoff lists every command and env value to set (names and how to make each, never a value). **The env** names in section 12, each `.optional()` with a lazy `assertDriveEnv()`.

**Operators in the same change** (section 7): `/admin` shows every send, a stuck lane, the dead letters and the switch; zero silent failures.

Build boldly and completely; every Question you would ask goes under Questions with its recommendation built. Wiring rigor: the whole gate, the Worker's own tests, and a written walk script for the Orchestrator's live walk on the desk build (section 12's red-team list, minus the exit).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Which plans have Send to Google Drive?** Built: every plan. It costs about $0.0003 a GB, it is the honest way
  out, and it cannibalizes nothing (live sync, the automatic copy competitors charge for, is where a plan line would
  belong). One-way in practice: PRICING's rule that a marketed number only moves up keeps it on Free once it is there.
- **Your events: one list, or checks on the tiles (the board drew checks)?** Built: one list beside Display
  (`album-picker.tsx`): it reads the same over the gallery, the table and the list, and a host with two hundred albums
  picks from rows. Will's to overrule.
- **Keep a capture time at upload?** The names and Drive's `modifiedTime` say when each file reached the album (the
  app keeps no capture time: the EXIF strip removes it on purpose); `driveFileStem` takes `capturedAt` the moment one
  is kept. Recommend deciding it apart, as a privacy question (capture time is what the strip removes).
- **A takedown's copy already in her Drive:** it stays hers (Partyreel deletes nothing in her Drive, and `drive.file`
  reaches only our files). Recommend the audited operator act "Delete our copy from her Drive" before launch, beside
  the CSAM runbook (Deferred).
- **The guards' numbers:** the account breaker `max(10 x plan storage, 5 GB)` in 30 days (unpublished), and the spend
  watch's `drive_bytes` floor of 1 TB a day. Built on those; Will's to tune.

## System-doc edits (in place, owned facts only)

- `docs/systems/drive-export.md` (new): the connection, the tokens, a send, cost and guards, the Worker, the leak
  table, operating it and the leak runbook, the choices with their reasons.
- `docs/SYSTEMS.md`: its row.
- `docs/systems/database-security.md`: the advisor reads 25 `rls_enabled_no_policy`; Drive's five deny-all tables, its
  two owner-only helpers, the `cloud_*` functions service-role only, `cloud_exports`' column grant.
- `docs/systems/uploads-and-r2.md`: "Send to Google Drive" (no presign and no byte through Vercel, a read an original
  plus a verification read, gone and missing items skipped).
- `docs/systems/trust-safety-forensics.md`: a quiet hold goes in her send as in her zip; a copy already in her Drive is
  out of our reach.
- `docs/systems/admin-observability.md` (crumbs-75's, freed): the Drive switch's direction, the `drive_export`
  heartbeat and its readings, the spend watch's Drive reading and its pause.

## Deferred (ROADMAP one-liners, bucket named)

- Trust & safety: "Delete our copy from her Drive", an audited operator act for a takedown of an item a send delivered
  (it needs the connection's key at the time; written to `forensic_audit_log`).
- Product: keep a capture time at upload, so a Drive file's name and `modifiedTime` say when it was taken
  (`driveFileStem`'s `capturedAt` waits for it).
- Admin: the account view (`/admin/accounts/[id]`) shows its Drive connection with Pause and Disconnect (today on
  `/admin/exports#drive`, found by address).
- Admin: the command palette jumps to `/admin/exports#drive` (`lib/admin/palette.ts`).
- Drive v2: live sync, then Dropbox (the design note's sections 9 and 10).

## Handoff (replaces the chat report)

- **Commits.** Code head `866d30f9b`; syncs `06638c20e` (launch-prep `164fb5b8d`), `737d7a9ac` (`102f64379`: types
  regenerated after crumbs-75; its seam in `queries/jobs.ts` dropped, Drive's kept), `c22697e04` (`3cfd7ae27`) and
  `74fe2bd81` (`f271601bd`), the last two pickup commits alone (`docs/tracks/orchestrator.md`). The chat line's sha is
  this manifest's commit.
- **Gates on `866d30f9b`** (the synced code; the syncs after it carried `orchestrator.md` alone), each its own exit:
  `zsh scripts/build-lock.sh pnpm typecheck` 0; `pnpm lint` 0; `zsh scripts/build-lock.sh pnpm test` 0 (960 files,
  11,974 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3136` 0 (198
  checks). The Worker (`workers/drive`, unchanged since `31b93f51f`): `npm test` 52/52, `npx tsc --noEmit -p .` 0,
  `npx wrangler deploy --dry-run` 38.67 KiB. Logs: `_scratch/drive-wiring/gate-*.log`.
- **The migration** `20261005120000_cloud_export.sql` (md5 `f2f9cafea54bbe6f75ecc6545ac482c2`). Drift on
  `ddafaemglzmuekbtjwzn` (read-only, before): no `cloud_` table or function, no `drive_export_enabled` row,
  `spend_watch_readings` md5 `54b229ac1c20aa05143f0d119ec086df` = 20261003190000's body. Preflight on a local
  postgresql@17 stand-in: its 24 checks hold (`_scratch/drive-wiring/pg/run.sh`). **Live rolled-back proof through
  the Supabase MCP**: the file's statements and the check in one transaction ending `rollback;`, outcome `ROLLED BACK:
  every cloud_export check held {"job": {"kept": 1, "sent": 33, "total": 35, "failed": 0, "skipped": 2}, "lanes": 3,
  "drive_bytes": 217000576}`; read-only after: 0 tables, 0 functions, no flag row, the readings' md5 unchanged, no
  check users (`_scratch/drive-wiring/pg/live-proof.compact.sql`). Apply per its header (advisor delta 20 -> 25
  `rls_enabled_no_policy`, nothing in 0028 or 0029), regenerate the types, then drop three typed seams: `untyped` in
  `src/lib/db/queries/drive.ts`, the cast in `src/lib/db/queries/drive-stops.ts`, `untypedDb` in
  `src/lib/db/queries/jobs.ts`. ★ Apply before this code deploys: nothing deployed today names a new object, but this
  code's jobs console signal and spend-watch reading read the new tables, and would read as unreadable (loudly, never
  as a calm zero) until it applies.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = 124 files: the owned prefixes, this file, and 25
  exceptions: `.env.example` (Drive's six keys, the env parity test); `docs/systems/admin-observability.md` (freed by
  crumbs-75: the switch, the heartbeat, the readings); `src/app/(app)/layout.tsx` (`<DriveFlag />`, 3 lines);
  `src/components/app/event-feed/event-gallery.tsx` (the album's strip, 4 lines); `src/app/admin/jobs/catalog.ts`,
  `owed-words.ts`, `page.tsx` (the four Drive jobs and their labels; catalog freed by crumbs-75);
  `src/app/admin/jobs/spend-watch-card.tsx` (the Drive switch's line); `src/lib/db/queries/jobs.ts` and `jobs.test.ts`
  (the `drive_transfer` signal; the fixtures carry Drive's tables, two tests); `src/lib/db/queries/notifications.ts`,
  `src/lib/notifications/build.ts` and `build.test.ts` (the bell's Drive rows); `src/lib/db/mutations/account.ts`,
  `src/lib/lifecycle/account-deletion.ts`, `account-deletion.test.ts`, `operator-removal.test.ts` (Drive revoked at the
  request and before `deleteUser`; the tests mock it and pin the order; account-deletion freed by crumbs-75);
  `src/lib/email/send-kinds.ts` and its test (the Drive kinds and `drive_breaker`, never held; freed by crumbs-75);
  `src/lib/events/event-dates.test.ts` (the end-date guard names Drive's two readers that say when);
  `src/lib/jobs/spend-watch-switches.ts` and `spend-watch.test.ts`, `spend-watch-run.test.ts`,
  `spend-watch-switches.test.ts` (the switches read whole from `SWITCH_KEYS`; each list gains the Drive switch and
  reading); `src/lib/security/abuse-rate-limit.ts` (`drive_connect`, `drive_send`).
- **The items.**
  - The migration: six tables (five deny-all), 23 functions under one lock order (the connection row first), the
    switch seeded on, `spend_watch_readings` restated with `drive_bytes`; its rolled-back check at the foot.
  - `src/lib/drive/`: the token seal, the signed protocol (twin pinned by shared vectors), Google's calls under one
    allowlist, the state cookie, the moments (one table of words), the service (folders, leases, kicks, tokens), the
    mails, the disconnect; `src/lib/export/drive-names.ts` (when, then who; the SQL ordinal mirrored).
  - Routes: connect, callback, the press, her acts (cancel, check, refolder, retry, seen), items, status, preview,
    albums; the Worker's lease, report, check, lanefail, sweep.
  - `workers/drive/`: kick, lanes in 11-minute slices and their ends, the transfer (resumable, 128 MiB chunks, MD5,
    handle-only undo, identity by file id then `appProperties`), the closing check, the sweep, queue readings, the
    local-walk config pinned to the deployed one.
  - The UI: Send to Drive beside Download on Originals with our promise and the final press; the album's strip; the
    app-wide flag, once a stop; Your events' picker and tile lights; What's using space's door; Account's Google Drive
    card; the bell's rows.
  - Operators: `/admin/exports#drive` (the switch and four readings, every send with Resume, Retry failed and Cancel,
    the connections that need someone with Pause, Resume, Lift breaker and Disconnect, any account's by address, the
    client's idle clock, Revoke every connection); the jobs console's `drive_export`, `drive_queue`,
    `drive_dead_letters`, `drive_transfer`; the spend watch's `drive_bytes`; the breaker's ops mail.
  - Mail: `drive_connected`, `drive_export_done` (an hour's folded), `drive_export_paused`, `drive_export_stopped`,
    `drive_reconnect`, `drive_breaker` (to us).
  - Tests: the Drive library, the migration's load-bearing facts, the snapshot equal to `chosenRows`, the URL
    allowlist, the return word against the router stand-in, the operator's words, the signals, the bell, the Worker's
    52.
- **Assets requested from Will:** Google Drive's product mark · SVG, 24 and 48 px, the official mark unaltered per
  Google's Drive branding guidelines, beside the words "Google Drive" · replaces the stand-in `DriveGlyph` (lucide
  FolderUp) in `src/components/app/drive/drive-parts.tsx`.
- **Board ideas:** "In your Drive since 3 Oct" as a quiet line on Take it home's Originals card and the album head after
  the strip's day; the Library could carry a specimen of the strip's every moment (`moments.ts` is pure).
- **Proposed migrations / Worker / Vercel / env changes:**
  - The migration above.
  - The Worker, once (`workers/drive/README.md`, "Setup"): `npm ci`; `npx wrangler queues create partyreel-drive
    --message-retention-period-secs 1209600`; the same for `partyreel-drive-dlq`; `npx wrangler secret put
    DRIVE_WORKER_SECRET`; `npx wrangler deploy`. Its `DRIVE_APP_URL` (wrangler.jsonc) is the alias until the milestone
    that ships Drive, then partyreel.com.
  - Vercel env (both projects, non-sensitive until launch): `GOOGLE_DRIVE_CLIENT_ID` and `GOOGLE_DRIVE_CLIENT_SECRET`
    (Will's, set); `DRIVE_TOKEN_KEY` (`openssl rand -base64 32`); `DRIVE_WORKER_URL` (the Worker's workers.dev
    origin); `DRIVE_WORKER_SECRET` (`openssl rand -base64 48`, equal to the Worker's). `DRIVE_TOKEN_KEY_PREVIOUS` only
    at a rotation.
  - The desk build's `.env.local` for the walk: the same, with `DRIVE_WORKER_URL=http://localhost:8787` and the
    Worker run locally (README, "A local walk"; `wrangler login` for the real bucket).
- **Calls his to overrule:**
  - A same-account reconnect never revokes the token it replaces (Google's revoke removes the whole grant the new
    token rides); another account's grant is revoked.
  - Disconnect deletes our row first and revokes after, three tries: Google not answering never keeps a key here.
  - Account deletion disconnects at the request and again before `deleteUser`, both isolated: a grant Google keeps
    listing is inert without our key and never holds a person who asked to be forgotten.
  - An operator's cancel, pause or disconnect mails her nothing; her album says "We stopped this send" or "Sending
    stopped on our side".
  - Google's day is counted by the hour (`cloud_export_sent_hours`), which also carries the breaker's 30 days and the
    spend watch's day and outlives a disconnect.
  - The spend watch reads a day (floor 1 TB), not the design's hour, to ride its `last_day` machinery.
  - The jobs console's Drive job is `drive_export`, named for its switch (the catalog's id-equals-flag rule).
  - Her Drive's room is kept a minute on the connection; a later press asks Google again.
  - A stop that waits on her stands in the host's bell, read only where the `pr_drive` hint cookie is; the same hint
    gates every poll of `/api/drive/status`, so a host who never used Drive costs no Vercel CPU.
  - Revoke every connection (the leak runbook's act) wipes keys but keeps rows as `revoked`, so each host's sends
    resume when she reconnects.
- **Look at first:** the migration's lock order and the live proof above; `src/app/api/drive/callback/route.ts` (the
  `getUser()` lock); the protocol twin (`src/lib/drive/protocol.ts`, `workers/drive/src/protocol.ts`);
  `workers/drive/src/transfer.ts` (one file, its undo); `send-strip.tsx` and `drive-flag.tsx` (the strip and the
  flag).
- **The walk** (the Orchestrator's, on the desk build at :3000, after the apply, the types and the merge; a disposable
  Google account Will signs into in the chooser; an album of about 20 photos and one clip past 128 MiB). Drive full,
  Google's day and the breaker are proved by the Worker's suite and the SQL check (no account fills 15 GB on demand).
  1. Account, Google Drive card, Connect: the chooser, consent naming only "the specific Google Drive files you use
     with this app", back on `/account?drive=connected` with "Connected as" and the toast; `drive_connected` arrives.
  2. Connect, then Cancel at Google: "Nothing was connected". Again, untick the Drive box: the permission words, no
     row, and no new grant at myaccount.google.com/connections.
  3. Start Connect as the host, sign in as the admin account in another tab, finish Google's screen: `?drive=failed`,
     nothing connected to either. A bare `/api/drive/callback?code=x&state=y`: failed.
  4. An album, Download, Originals, Send to Drive: the final press (count, size, her free space, "<album> · <day>"),
     Send. The strip moves; close the tab and reopen; done says every one checked, with Open in Drive. In Drive:
     `My Drive / Partyreel` (coloured) `/ <album> · <day> /` files named `YYYY-MM-DD HH.MM.SS · Name.ext`, each
     modified at that moment. The done mail within the hour.
  5. Send it again: nothing new; pressed anyway, every file kept, no duplicate. Bin one file in Drive and send again:
     that one goes again, same name.
  6. A bigger album: Cancel mid-send (asked first), "You canceled this send"; Send again: only the rest.
  7. The clip past 128 MiB crosses chunks (the Worker's `drive-file` log, MD5 matched); stop the local Worker mid-clip
     and start it again: the session resumes.
  8. Move a sent file out of the album's folder in Drive and send again: kept, not sent again.
  9. Bin the album's folder mid-send: "folder is in your Drive's bin" with Check again and Send to a new folder; the
     flag on another page, once; restore and Check again carries on (or Send to a new folder).
  10. Remove Partyreel at myaccount.google.com/connections mid-send: "Partyreel lost access", the flag, the bell's row
      and the reconnect mail; Reconnect the same account: it carries on.
  11. Your events, Send to Drive, ten albums: at most three lanes (the Worker's log), the oldest album first, tile
      lights in percent.
  12. What's using space, one album: its Drive door sends it.
  13. As another host: `POST /api/drive/exports/<the first host's send id>` `{"act":"cancel"}` and `GET .../items`: 404.
  14. `node _scratch/drive-wiring/probe.mjs` with `B` and the secret set to the desk's: malformed 400; wrong secret,
      stale, future and tampered 401; an oversized report 400.
  15. PostgREST with the publishable key and with a host's JWT: `cloud_connections`, `cloud_export_items`,
      `cloud_export_leases` 42501; `cloud_exports` her rows only, and `folder_id` 42501.
  16. The admin host's `/admin/exports#drive`: Pause her connection (her strip: "Sending stopped on our side"),
      Resume; the switch off (sends wait) and on; after a sweep (`curl "http://localhost:8787/__scheduled?cron=*/5+*+*+*+*"`),
      `/admin/jobs` shows `drive_export` and the queue readings.
  17. Disconnect on Account (asked first, naming what stops): "Google Drive is disconnected", the card offers Connect,
      Google's connections page no longer lists Partyreel Drive.
