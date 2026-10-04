---
track: drive-export-r1
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "50de9a79"            # the launch-prep SHA the branch was cut from
board: drive-export
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/drive-export/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/app/export/export-dialog.tsx
  - workers/export/README.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/database-security.md
  - docs/systems/admin-observability.md
  - docs/systems/auth-accounts.md
  - docs/systems/durability-backups.md
---

# lp/drive-export-r1

**Goal.** Send to Google Drive, round 1: the architecture's design note for the Advisor's review (OAuth with drive.file only, the encrypted token store, the Worker and Queue streaming R2 to Drive, every failure path, the guards, the /admin signal, live sync, Will's one Google Cloud step), then the board drawing every moment a host meets (the way in, connecting, progress, done and the clean exit, the hard moments, the connection in Account).

## Where I am

- Booted: worktree `drive-export-r1` on `lp/drive-export-r1`, cut from `738c72d0`, synced with `origin/launch-prep` at
  `38f88e12` (trash-in-storage's merge: the storage chart the board quotes) as `65ed9dcb`.
- **The design note, amended in place on the Advisor's Q25** (`../partyreel-wt/_scratch/drive-export/design.md`; the
  review beside it, `q25-advisor.md`). Q25 is met, each F by its line:
  - F1: the exit's proof is the app's own (section 8, "What proves an item safe"): Drive `files.get` batched and R2
    `HeadObject`, metadata only, every item the album holds now, never a write to her Drive; the Worker's closing check
    decides the page and nothing else (section 4); Partyreel never bins in her Drive on its own (section 3).
  - F2: identity is `drive_file_id`, then `appProperties` with no parent clause (section 3, "Never a duplicate"); a
    moved file is still hers (section 5's row).
  - F3: a `wait`/`paused`/`stopped` lane acks and ends; only `throttled` and an app outage re-queue; a kick adds
    `concurrency` minus live lanes at most once a minute; three dead lanes a day pause the connection with an `/admin`
    Resume (section 3, "Lanes").
  - F4: one RPC, `cloud_export_snapshot`, its predicate pinned to `chosenRows`; names at the lease; nothing to send
    ends the job at the press (section 4, "Making one"; section 3, "Names").
  - F5 the refresh claim, F6 `refresh_expires_at`, F7 the operator's connection pause and the audited Delete our copy,
    F8 the Google URL allowlist; N1 to N9 folded into their lines; Ladder A's numbers in the cost math (section 6).
  - One place it departs from Q25, on purpose: the snapshot does not filter quiet legal holds, since a quietly held row
    is invisible to its host by design and her zip includes it (section 3).
- The board `drive-export` (desk 20) is drawn, its clean exit on N9's proof, and the gate is green on the synced tree
  `ed2e5d28` (the Handoff below). Handed off.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Will's ask (2026-10-04 02:50Z), in his words, because the wording is the point:** "if it's that easy to dump into Google Drive and we can basically swallow WedUploader/WeddingQR/PixBearer's entire feature set at $29/event within a cancellable $9/month unlimited events drive-offload one month subscription, that's a hilariously great win. Even though the easy 'delete' after export makes it easy to manage our storage and never need to upgrade, that's such good UX. let's ensure this is fully planned and reviewed, then do it. lab exploration first to nail UI." And: "Definitely don't want to pay for that security audit": we never ask for Google's full `drive` scope (it is restricted: a yearly CASA assessment). `drive.file` only.

**The research is done** (2026-10-03, every claim linked to its vendor page): `../partyreel-wt/_scratch/drive-export/research.md`. Read it whole first. In short: `drive.file` is non-sensitive (brand verification only, no CASA, no 100-user cap); a Cloudflare Worker plus a Queue streams R2 into Drive's resumable uploads at about $0.0007 a GB; the competitors (WedUploader, WeddingQR $39, PixBearer $29 to $39) connect the host's Google once and land every guest upload in a folder in her own Drive; Dropbox's `save_url` is the natural second target; Google Photos (10,000 requests a day per project) and iCloud (no web API) are out.

**This round is two things, in this order.**

**1. The design note, first: `../partyreel-wt/_scratch/drive-export/design.md`.** Write it before you draw, push a WIP commit the moment it is complete and say so in your manifest's `## Where I am`, because the Advisor (the Orchestrator's architecture reviewer) reads it while you draw. Plain words, with the code paths it touches; the reviewer's job is to break it, so name every failure path. It decides:
- **The OAuth flow.** `drive.file` plus whatever names the connected account ("connected as …"); offline access for a refresh token; our own callback route with state (and PKCE if Google's web flow takes it). Partyreel already has a Google OAuth web client in the P3 Google Cloud project for sign-in (`docs/STATUS.md`, `docs/systems/auth-accounts.md`): say whether Drive reuses that project (the Drive API enabled, the scope added to its consent screen) and that client or a second one, and why. Sign-in's Google session never carries Drive's consent: a host who signed in by email connects Drive the same way.
- **The token store.** Encrypted at rest, server-only (no `anon` or `authenticated` grant at all; `docs/systems/database-security.md`), one connection per account, revoked at Google and deleted on Disconnect, at account deletion, and when Google answers `invalid_grant`. Where the key lives and who can decrypt (Vercel, the Worker, or both), and why.
- **The transfer.** R2 to Drive in a Worker with a Queue, never a byte through Vercel (`media-cost-policy.test.ts`); one message per file; a long video resumed across messages (256 KB multiples, the session's offset); idempotent per media item (Drive's `appProperties` or our own row), so a retry never makes a duplicate; originals only (the phone copy and the preview never travel). The folder layout and the file names (what we hold: a guest's name, the time taken, the original's name or not), and what an export holds: the album as the host sees it, and whether held, sealed or Deleted items go.
- **The job and its progress.** Its tables (a job and its items), what the host's page reads for progress (owner-scoped by RLS, the Worker writing with the service role), the tab closable mid-export, an email when it is done, cancel.
- **Every failure path.** Her Drive full (`about.get` before; `storageQuotaExceeded` mid-job: pause, tell her, resume), Google's rate limits and 429s (backoff), the 750 GB a day per user (pause until tomorrow), a token revoked mid-job, an event or item deleted mid-job, a Worker or Queue outage, a job that never finishes.
- **Cost and guards.** The per-GB cost, and the vector: one album re-exported forever. A breaker sized for real hosts (PRICING's rule 3: a circuit breaker at about 10x the trailing peak), and whether it is a limit a host could meet (then it is published, by Will's rule: a row in the pricing table with a hover line, never a hidden limit). `docs/PRICING.md` is read-only to you (another lane owns it).
- **Operators.** The job's health signal and its `/admin` controls (retry, cancel, a stuck job surfaced) in the same change: Partyreel runs with no AI managing it.
- **The clean exit.** After a verified export, deleting from Partyreel. Deleted is about to count in storage (the trash-in-storage lane merges today: deleting frees nothing until an item leaves Deleted, unless "Make room from Deleted", on by default, frees the oldest when an upload needs room). So say what the exit does to her storage and how she knows every item is safe in Drive before anything is deleted for good.
- **Live sync**, the competitors' whole product: every new upload also lands in her Drive as it arrives. Whether it is this feature's first version or its second, and how the same queue serves it.
- **Dropbox next:** keep the design provider-neutral wherever that costs nothing.
- **Will's one step,** written for him: what he does in Google Cloud (the API, the consent screen, the client, the redirect URIs for production, the alias and localhost, brand verification), click by click.
- **The wiring lane's shape:** the migration (tables, RPCs, grants), the Worker and its bindings, the env vars, the routes, the owns, and what its live red-team walks.

**2. The board `drive-export`, round 1: nail the UI.** Production's look (identity's wired picks: voice=camera, layers=display, status=lights), at 1440 and 375, light and the room. Draw every moment a host meets:
- **the way in:** Send to Google Drive on the host's Download panel (`src/components/app/export/export-dialog.tsx`, beside Originals and Phone size), and wherever else a host would look for it (an event's menu, the dashboard for several events at once, the storage page when space runs short);
- **connecting:** our own words before Google's consent screen (what we can and cannot see: only the files Partyreel puts there), and the return;
- **the progress:** the folder, the count and the size, safe to close the tab, the email, cancel;
- **done:** Open in Drive, then the clean exit (free its space from Partyreel), with her storage visibly freed;
- **the hard moments:** Drive full, paused until tomorrow, disconnected, partly done;
- **the connection** in Account: connected as her Google address, Disconnect;
- **live sync**, if the design note makes it this version's: an event's "also save every upload to Drive".

Each ask two to four options with your recommendation, delight where it costs nothing in clarity. This is the feature Will is most excited about tonight: make the board one he can pick from in a sitting.

**Questions to raise** in your manifest's Questions, each with your recommended answer (build the board on it): which plans get it (Free's 100 MB included or paid only: the competitors charge for exactly this); live sync in the first version or the second; the clean exit's delete (to Deleted, or for good once verified in Drive); the folder and file naming. Anything that is a one-way door is a question, never a guess.

**Never:** a real Google consent, connection or upload in this round (the board draws them; the wiring lane connects); a request to Will to set anything up (your design note writes his steps; the Orchestrator relays them at the wiring); editing production code (this is a lab lane: your board's folder and the design note in scratch).

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/drive-export/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `drive-export`, its title, `surface`, `desk: 20` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended (the board draws it and its alternatives) and listed under "Calls his to overrule".

- **Q1. Which plans get Send to Google Drive: every plan, Free included.** It costs about $0.0007 a GB (Free's whole
  100 MB is under a hundredth of a cent), it is the honest way out ("your photos are yours, in your own Drive"), and it
  cannibalizes nothing: what a real event outgrows on Free is 100 MB and photos only, not the way out. What the
  competitors charge for is the automatic copy of every upload as it arrives, which is live sync, and that is where a
  plan line belongs. Asked rather than guessed because PRICING's only-up rule makes a gift on Free permanent.
- **Q2. Live sync: the second version, a fast follow on the same queue.** Version one proves the hard parts (OAuth, the
  token store, the transfer, every failure path, `/admin`) on a send she starts and watches. Live sync opens what the
  one-shot send does not (the Advisor's N8): a live-moderation album would copy a troll's upload into her Google account
  in seconds (so only approved items, after a grace window); a guest's take-back must reach the Drive copy (Partyreel's
  first automatic removal in a user's Drive); an idle sync must hold no lane; guests' uploads leaving our custody is a
  new disclosure in the guest-facing privacy text. Version one still covers a growing album: Send on an album already
  sent sends only what is new.
- **Q3. The clean exit: to Deleted, behind the app's own fresh check, never for good by default.** Free 7.4 GB has the
  app itself check every item the album holds now (hidden, waiting and sealed too) in her Drive and in R2, from
  metadata (exists, not trashed, size and MD5 equal), within ten minutes, nothing new since; then the existing soft
  delete. With Make room from Deleted on (the default) its room goes to her next uploads whenever they need it; Delete
  for good is the quieter second act, for a host moving to a smaller plan. A long background job is exactly where a bug
  would cost a wedding, and Deleted's 30 days are the difference.
- **Q4. The folder and the names: `My Drive / Partyreel / Maya & Jay · 12 Sep 2026 / 2026-09-12 21.14.05 · Priya.jpg`.**
  One Partyreel folder, one folder per album (its date when it has one), every file named by when it reached the album,
  in her time zone, and who sent it, so the folder reads as the evening in order (a batch sent the morning after sorts
  by when it arrived: we hold no capture time and no original name). Never an email address.

## System-doc edits (in place, owned facts only)

- None: a lab lane. The wiring writes `docs/systems/drive-export.md` (with the design note's leak table and runbook).

## Deferred (ROADMAP one-liners, bucket named)

- Drive: wire Send to Google Drive on the board's picks and the amended design note
  (`_scratch/drive-export/design.md`, Q25 met), Will's Google Cloud step (its section 11) relayed first (drive-export-r1).
- Drive: live sync as v2 on the same queue, its decisions per the design note's section 9 (drive-export-r1).
- Drive: Dropbox through `save_url`, the lease carrying a presigned GET (drive-export-r1).

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/drive-export-r1`:** `8d3f605e` the design note's WIP (Where I am and the Questions);
  `65ed9dcb` the first sync (a merge of `origin/launch-prep` at `38f88e12`: trash-in-storage's storage chart, which the
  board quotes); `1ef7f9c5` the design note amended on Q25 (Where I am names each F by its line); `f2b4bf71` the board;
  `f467131b` its prettier pass (wrapping only); `ed2e5d28` the second sync (a merge of `78ad4b3d`: the types regenerated
  after `deleted_counts`, whose `storage-figures.ts` and storage actions the board's ring and inert source read).
  launch-prep has since moved by records and crumbs-63's reel merge only (no path of this lane's or its reads), so no
  third sync. The head is in the chat line.
- **Gates on the synced tree `ed2e5d28`**, each on its own exit code (logs under `../partyreel-wt/_scratch/drive-export-r1/`):
  `pnpm typecheck` 0 (`gate2-typecheck.log`); `pnpm lint` 0 (`gate2-lint.log`); `pnpm test` 0, 877 files and 10,565 tests
  (`gate3-test.log`; the run before it failed one test outside this lane, `storage-list.test.tsx` "opens on every event's
  items, largest first, with a chip per event", a load flake: green alone three times and on the rerun,
  `gate2-test.log`); `zsh scripts/build-lock.sh pnpm build` 0 (`gate2-build.log`); `pnpm lab:smoke --base
  http://localhost:3132` 0, 25 checks, the board's reading 835 of 1,200 words (`gate2-smoke.log`); `pnpm lab:demo --board
  drive-export --base http://localhost:3132` 0, 9 steps, every option drawn and seen whole at 1440 and 375 above the dock
  (`gate2-demo.log`).
- **Captures, every frame of every option** (named by ask, option and frame): the room at 1440 `final/` and at 375
  `final375/`; light at 1440 `final-light/` and at 375 `final-light375/` (lab:demo pins `prefers-color-scheme: dark`, so a
  copy with light, `tools/lab-demo-light.mjs`, 9 steps 0 failing each: `gate2-demo-light*.log`). Reduced motion is
  lab:demo's own still pass; the board's one animation (the toast's spinner) stops under it.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = this file and the ten files of
  `src/app/(dev)/design/sandbox/drive-export/`. No exceptions.
- **The items:**
  - The design note `_scratch/drive-export/design.md`, amended in place on the Advisor's Q25 (F1 to F8 and N1 to N9 in
    their lines, Ladder A's numbers), with one departure from Q25 on purpose: the snapshot does not filter quiet legal
    holds, which are invisible to their host by design and in her zip already (its section 3).
  - The board `drive-export` (desk 20, host, `tracks: drive-export-r1`): nine asks of three options, every option drawn
    on production's look (the real `Popup` in its plan, confirm and list kinds, `Progress`, `Badge`, `Button`, `Card`,
    `Switch`, `Logo`, `StorageChart` over an inert source; the hub's bar and rows, Your events, the toaster and the size
    rows quoted where production's own needs a session), two staged asks (the hard moments on While it sends' place;
    freeing its room behind When it's done), three carried calls (plans, live sync, where in her Drive).
  - Freeing its room is drawn on N9's proof: the confirm once the app has checked every item the album holds (hidden,
    waiting and developing too), her storage chart after, and the refusal when the check finds a gap.
  - Google's consent screen and her Drive are neutral stand-ins carrying our words and names, never Google's look.
- **Assets requested from Will:** none for the board (a lucide folder stands in for Google's Drive mark, which the
  wiring places by Google's own brand rules). For the wiring: the logo · 120×120 PNG · 1 · for the consent screen's
  branding, if the P3 project has none (the design note's section 11, step 3).
- **Board ideas:**
  - Keep each photo's capture time (EXIF `DateTimeOriginal`, read before the strip removes it), so Drive's names, the
    album's order and the reel can say when a photo was taken, not when it arrived (the naming ask's cost).
  - Send a selection to Drive from the album's Select bar, beside Download (the same job over chosen ids).
  - `storage-list.test.tsx` "opens on every event's items, largest first" flakes under the full suite's load.
  - Two orphaned headless Chromes from 2026-10-03 12:44 (pids 44980 and 45014, parent launchd, `lab-demo-*`
    profiles) still run on this machine; not this lane's.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none in this lane. The wiring's are the design
  note's section 12 (the `cloud_export` migration, the `partyreel-drive` Worker and its Queue, six env vars), after
  Will's Google Cloud step (section 11), which the Orchestrator relays.
- **Calls his to overrule** (each built as recommended):
  - Q1 every plan; Q2 live sync second; Q3 to Deleted behind the app's own check; Q4 when it arrived, then who.
  - The way in: a third way, Google Drive (else the row under the two, or a second act on Originals).
  - The other doors: Your events and storage too (else storage alone, or Take it home alone).
  - Connecting: our promise, then a final press (else straight to Google, or Google's screen said first).
  - While it sends: on the album it's sending (else a toast that follows her, or inside Take it home).
  - The hard moments: on the send itself, one act each (else a banner across the app, or the email carries it).
  - Done: Open in Drive, then free its room (else free its room first, or freeing in storage only).
  - The connection: its own card under Plan (else a line in Plan, or a Connected apps card).
  - The design note's own: a second OAuth client in the P3 project; the Vercel app the token's only decrypter; a new
    Worker beside the export Worker; Partyreel never bins in her Drive on its own.
- **Look at first:** the board's Freeing its room step (the app's check drawn, the chart after, the gap), then The way
  in; the design note's section 8 (what proves an item safe) and section 3 (the lanes and their ends).
