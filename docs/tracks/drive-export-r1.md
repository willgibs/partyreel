---
track: drive-export-r1
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
