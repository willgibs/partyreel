---
track: drive-crumbs
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "b5042226"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/20261006130000_drive_marks.sql
  - src/lib/drive/
  - workers/drive/
  - src/app/api/drive/
  - src/app/api/internal/drive/
  - src/components/app/drive/
  - src/app/admin/exports/
  - src/lib/admin/palette.ts
  - src/lib/admin/palette.test.ts
  - src/lib/admin/palette-actions.ts
  - src/lib/db/queries/drive.ts
  - src/lib/db/queries/drive-stops.ts
  - src/lib/export/drive-names.ts
  - src/lib/export/drive-names.test.ts
  - src/lib/db/drive-marks.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/drive-export.md
  - docs/systems/database-security.md
---

# lp/drive-crumbs

**Goal.** Drive made whole before it goes live at milestone 38: a re-send after a reconnect adds only what is missing (album folders and files found by their marks, one migration), a closing check holds at the first file Google never answered for, Account's card names her folder on reconnect, and the palette reaches Drive's admin section.

## The brief

**The round's direction (Will, standing since round 13):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity; nothing depends on a timeline; immediate, or a clear state and a way to stop it; Partyreel runs with no AI managing it (zero silent failures); cost designed like the architecture; production is the working version.

**Why now.** Send to Google Drive goes live at milestone 38, when its Worker deploys (production reads "not set up" until then). drive-fixes, the desk re-walk and drive-hardening made it correct for a first connect and send; they left three lines a real host can meet after that, and Drive should not go live with them. Read `docs/systems/drive-export.md` first (its ★ lines, and "The next versions"), then `workers/drive/README.md`; the newest definitions of its SQL are in `supabase/migrations/20261005120000_cloud_export.sql` and `20261005180000_cloud_export_fixes.sql`. The calls lab's BE3 is Will's own view of the first line.

**The work (each line retired from the ROADMAP in your Handoff):**
1. **A re-send after a reconnect adds only what is missing.** After a same-account Disconnect and Connect, sending an album again sends it whole into a second same-named album folder (the forget dropped its files' ids). Mark album folders (`pr_event`) as the Partyreel folder already is, and look files up by `pr_media` when the press found the folder rather than made it: a column on the send, a migration (`supabase/migrations/20261006130000_drive_marks.sql`, from the newest definitions, grants exact, with rolled-back proofs through the Supabase MCP in your Handoff; you never apply it, the Orchestrator does after the Advisor reads it).
2. **"Every one checked" means every one answered.** A slow down on a closing check's `files.get` answers `unknown`, which the check route drops while the cursor walks past it: pace the check's asks and hold the cursor at the first unknown (`check.ts`, `/api/internal/drive/check`, `cloud_export_check_page`).
3. **Account's Drive card names her Partyreel folder as soon as she reconnects** (found by its mark), not only after her next send.
4. **The command palette jumps to `/admin/exports#drive`** (`lib/admin/palette.ts`).

Out of scope: the account view's Drive controls on `/admin/accounts/[id]` (billing-orphans holds `/admin/accounts` this round; the line stays), Drive v2 (live sync, Dropbox), and any deploy: the Worker deploys at milestone 38 by the Orchestrator, never from a lane. Google's side needs a real consent (P3's, Will's hand), so a live send waits for the milestone's walk: prove the Worker's logic in its own tests and under `wrangler dev --local` where it can run without Google, and say in your Handoff exactly what the milestone's live walk must press.

**Starts from.** CLAUDE.md's working loop and security guardrails (tokens sealed server-side, never a raw R2 key to the browser), and production as it is; the tests say what has to keep working.

**Verify on.** The whole gate on the synced tree, each step on its own exit code (`workers/drive`'s own tests too), and `pnpm lab:smoke`; the SQL proofs; Account's Drive card at 375 and 1440 in the state a reconnect leaves.

Model: Opus. Cut 2026-10-06 by the cloud-seated Orchestrator; you run in a cloud session of your own (the spawn prompt's boot).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- An album's folder is found by its mark wherever she moved it (no parent clause), the oldest out of the bin, as the
  Partyreel folder is. Recommended and built: yes (moving an album's folder is her choice; a second folder of the same
  name is the bug). Will's to overrule.
- A reconnect's re-send keeps a file found by its `pr_media` mark wherever it is in her Drive, not only inside the album
  folder, as `prior_file_id` already does. Recommended and built: yes. Will's to overrule.
- A check page held at a file Google will not answer for keeps the send "Checking" on her page; an hour of pages
  answering nothing marks it Stuck on /admin (Cancel there), and 14 days expire it as before. Recommended and built:
  this, rather than closing "every one checked" over a doubt.
- The connect callback asks Google once for her Partyreel folder before she lands (one `files.list`, sub-second, its
  10 s ceiling), so the card names it at once. Recommended and built: inline (an `after()` would race the page she
  lands on).

## System-doc edits (in place, owned facts only)

- none in this lane (docs/systems/drive-export.md is a `reads`). Proposed for the Orchestrator, each in place:
  - "A send", the root folder line: album folders carry `appProperties` `pr_event` (the album's id) too; a press that
    knows no live album folder finds it by that mark (`findAlbumFolder`: out of the bin, oldest, no parent clause), and
    the send records `folder_found`, which its lease carries as each item's `lookUp`.
  - "Sending again never duplicates": replace "after a Disconnect sending again sends the album whole, into a new album
    folder" with: after a Disconnect, the press finds the album's folder by its mark and each file by `pr_media`
    (kept when there and whole), so a re-send adds only what is missing; a folder in her bin is made again, marked.
  - "The closing check": a slow down on a check's asks is paced (one pace a page, `RATE_BACKOFF_MS`), past it the page
    ends `throttled` (the connection slows); an `unknown` holds the cursor at the first unanswered file (the page's
    lease kept a minute, the lane back in 90 s), and an hour of pages answering nothing marks the send stuck.
  - "The connection": the callback adopts the Partyreel folder by its mark (`adoptRootFolder`), so Account's card
    names it at reconnect.
  - Operating it: the palette's "Pause or resume Send to Google Drive" lands on `#drive`.

## Deferred (ROADMAP one-liners, bucket named)

- Drive (next): a check page throttled before its folder's duplicate listing skips the count, and once its cursor has
  moved no later page counts it (`first` is "cursor null"); count once a walk on the first page that answers.

## Handoff (replaces the chat report)

- Work `66a5eb59`, sync `3b2bf9a5` (launch-prep had moved to `e4c2d7c3`: merged, no conflict), the migration's hashes
  and proof `2fe810e0`; this manifest commit is the head in the chat line.
- Gates on the synced tree (`3b2bf9a5` + the proof's comment-only commit), each on its own exit code: `pnpm typecheck`
  0, `pnpm lint` 0, `pnpm test` 0 (1,054 files, 13,191 passed, 2 skipped), `workers/drive` `npx vitest run` 0 (77) and
  `npx tsc --noEmit` 0, `zsh scripts/build-lock.sh pnpm build` 0, `pnpm lab:smoke --base http://localhost:3131` 0
  (138 checks, 0 failing; the first run timed out on the Library's cold compile, the second after a warm-up passed).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file: the four routes under
  `src/app/api/drive/` and `src/app/api/internal/drive/`, `src/lib/drive/*` (google, service.server, protocol and two
  tests), `src/lib/db/queries/drive.ts`, `src/lib/db/drive-marks.test.ts`, the palette and its test, `workers/drive/src/*`
  and the migration. No exceptions.
- The items:
  1. Re-send after a reconnect: album folders marked `pr_event` (`google.ts` `createFolder`, `findAlbumFolder`);
     `makeSendFolders` finds one by its mark when it knows none live (never the one it just saw binned or gone) and
     calls `markReady(job, folder, found)`; the lease carries `folder_found`, `leaseItemsFor` makes it each item's
     `lookUp`, and the Worker's `sendOne` looks such an item up by `pr_media` first, keeping it when whole
     (`transfer.test.ts` "★ a send whose folder was found…", `root-folder.test.ts` "★ the album's folder, found by its
     mark…"). Migration `supabase/migrations/20261006130000_drive_marks.sql`: `cloud_exports.folder_found`,
     `cloud_export_ready(uuid, text, boolean default false)` (DROP and CREATE, grants restated), `cloud_export_lease`
     verbatim from capture_time but for `folder_found`.
  2. Every one answered: `check.ts` paces slow downs (one pace a page, a confirmed answer resets it) and ends
     `throttled` past it, the unanswered `unknown`; the check route passes `unknown` through; `cloud_export_check_page`
     holds the cursor below the first unknown, keeps a held page's lease a minute, takes `throttled` as the connection's
     (as a report does), counts no progress for a page answering nothing (an hour of them: `stuck_since`), and never
     reopens a send its throttle paused; `lane.ts` comes back in `CHECK_HELD_DELAY_S` (90 s) when a held slice goes idle
     and requeues after a throttled check (`check.test.ts`, `lane.test.ts`, `drive-marks.test.ts`).
  3. Account's card at reconnect: the callback calls `adoptRootFolder` (find by `pr_root`, compare-and-set against
     none, nothing made, best-effort) before landing (`root-folder.test.ts` "★ a reconnect names her Partyreel folder").
  4. Palette: `action-drive` → `/admin/exports#drive` (`palette.test.ts` "★ names Send to Google Drive").
- ROADMAP lines to retire: the three Drive lines at ROADMAP.md 42 to 44 (re-send after a reconnect; the closing check's
  unknown; Account's card at reconnect). The palette line was not in the ROADMAP.
- ★ SQL PROOFS NOT YET RUN (the Orchestrator's word: no Supabase SQL in this lane). Ready to run, in order:
  1. Drift read (expected: the three hashes, and no rows for the column):
     `select proname, md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))) from pg_proc where pronamespace = 'public'::regnamespace and proname in ('cloud_export_ready', 'cloud_export_lease', 'cloud_export_check_page');`
     expecting `cloud_export_ready 998368c3d63a02382117a077f8f70668`, `cloud_export_lease c92cf0439d5b687adb6ca61da496c0aa`,
     `cloud_export_check_page 0172036645d31e4eefe10c8f5218a58b`; and
     `select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cloud_exports' and column_name = 'folder_found';` → no rows.
  2. The rolled-back proof at the migration's foot (uncomment it): one execute_sql of `begin;` + the file's statements
     + that block + `rollback;`. Expected GREEN 7/7 (fixtures; the column, no client read; ready with `p_found`; the
     lease's `folder_found`; a page held at the first unknown, the hi file confirmed, the lease kept a minute, the
     connection slowed; a held page skipped by the next lease, idle; an hour of unanswered pages stuck, then a page
     answering both closes it `done` and clears the mark; the grants and the old signature gone). RED without the
     file's statements. Its fixtures insert `media` and `cloud_connections` rows directly (written from types.ts, never
     run): if a trigger or CHECK refuses a fixture, adjust the fixture, not the assertions.
  3. Applied, the bodies hash as the migration's header says; get_advisors: no delta expected.
  ★ Apply before this lane's build is pushed: the build names `p_found` (PGRST202 without it) and sends `unknown`,
  which the old check_page would read as missing and send again. The reverse order is safe.
- Account's Drive card at 375 and 1440 in the reconnect state: NOT walked. This container refused a no-sandbox Chrome
  wrapper (auto mode's classifier), so no browser ran here, and the state needs a real Google consent besides. For the
  milestone 38 walk (Will's hand, P3's consent, the desk build at :3000 with the Worker under `wrangler dev`):
  (a) Connect, send an album, wait for done; (b) Account → Disconnect; Connect the same Google account: the card at
  375 and 1440 reads "Folder: My Drive › Partyreel" at once (not "Made at your first send"); (c) send the same album
  again: no second "Maya & Jay · …" folder appears, the send ends with every file kept ("already in your Drive"),
  nothing new uploaded; delete one file in Drive and send again: exactly that one goes; (d) the closing check's held
  path cannot be forced live; it rests on `check.test.ts`, `lane.test.ts` and the SQL proof.
- Worker under `wrangler dev --local`: not run (its tests cover the changed paths against the fake Drive; a local run
  without Google proves nothing more for these three paths).
- Assets requested from Will: none.
- Board ideas: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: migration `20261006130000_drive_marks.sql` (above); the
  Worker's code changes ride the milestone 38 deploy (protocol: a lease item's `lookUp`, the check word's `throttled`;
  both sides change together, so the app and the Worker must ship as one, which milestone 38's first deploy is).
- Calls his to overrule: the four Questions above.
- Look at first: `cloud_export_check_page` in the migration (the hold, the minute's lease, the stuck mark), then
  `makeSendFolders` in `src/lib/drive/service.server.ts`.
