---
track: orchestrator
status: open
cut: "c224231e"          # the launch-prep SHA this state was written at
owns:                    # the standing claims no lane touches
  - src/app/(dev)/design/rules/bible.ts
  - src/app/(dev)/design/rules/bible.test.ts
  - src/lib/design-gate/
  - src/app/api/design-gate/
  - scripts/vercel-ignore-build.mjs
  - .github/workflows/ci.yml
reads:
  - CLAUDE.md
  - docs/PROGRAM.md
---

# The Orchestrator's state

The pickup: read this first at every session start, compaction or restart, then `docs/STATUS.md`. It holds only what
is true now: what runs, what comes next, what waits on Will. How to cut, integrate, deploy and recover is the runbook,
[`usher/kit/README.md`](../../usher/kit/README.md). Rewritten in place, never a log. The Orchestrator is whichever
model Will seats (Fable or Opus); nothing here depends on which.

## In flight

Round 15 continues (2026-10-06), the Orchestrator seated in a claude.ai cloud session for the first time
(`session_01CbMRwiSRndG3eAjNpzHAvJ`, willg97's account). Milestone 37 is live (`b67cdc1f2`); `launch-prep` holds
milestone 38's work (each lane's summary is its merge commit), red-team 56's findings fixed by crumbs-85 among it. Every
lane is a cloud session of its own (the runbook's "Cut a lane", step 4); none can message back, so a `send_later`
check-in about every 40 minutes reads them (their status, pushed heads and cost) while any runs.

| lane | what | state | model | session |
| --- | --- | --- | --- | --- |
| `billing-orphans` | milestone 38's billing line: an orphan's grant as one SQL function under her profiles lock, the change-plan configuration watched at its source, the Plan card's words while a credited Pro lands; one migration (`20261006120000_billing_orphans.sql`) | HANDED OFF at `4a113e5d4`; waits on the morning's SQL (Waiting on Will) | Opus | `session_015JAkfLgeuTsZZMNJXrZVeV` |
| `drive-crumbs` | Drive whole before it goes live: album folders and files found by their marks after a reconnect, the closing check held at the first unknown, Account's card naming her folder, the palette's jump; one migration (`20261006130000_drive_marks.sql`) | HANDED OFF at `6d1731c27`; waits on the morning's SQL (Waiting on Will) | Opus | `session_01AGJfN3zW3BvB8vPM7KSgbL` |
| `a11y-halo` | the halo and the working words at the 27 files identity-r5-wiring could not own (the guest's pages, the hub, /admin, the create step, the menus, the lab's own five; pricing's and Drive's wait for their lanes), and `--faint` and paper's warning text lifted to 4.5:1 | RUNNING (cut at `462cea3f`) | Opus | `session_01PEB31d9qJAC99XBwktcpDY` |
| `host-moments-r1` | board host-moments r1 (desk 40): B1 a password added, Q6 a develop time added mid-party, B2 the door's decline and block, L3 over her plan with a goal, each built answer drawn beside real alternatives | RUNNING (cut at `462cea3f`) | Opus | `session_01LTciadsfNCGdfN4DK1rYF7` |
| `guest-moments-r1` | board guest-moments r1 (desk 45): C7 a first photo's glow, D3 taking a shot back, Q3 a batch of others' photos landing, G6 the reel opening | RUNNING (cut at `462cea3f`) | Opus | `session_01RxBppeLymQLuF5HFzzZzcM` |
| `redteam-56b` | red-team 56b on its own build of `c5b16be7` at :3000: crumbs-85's MEDIUM re-walked, its LOW and NITs, the album's time, the house set and working words, regressions; never commits; its report is its last message | RUNNING | Opus | `session_017cgyXnS3nnK35ifo2L6bEa` |
| `uploads-bursts` | the upload queue's two throughput lines: a dropped burst's Retry all re-queued as one burst, the next burst started once the last one's bytes are up | RUNNING (cut at `e74f8e07`) | Opus | `session_01XYnfk95UWgKLYDRLebNNxH` |

**The Advisor** (Fable, read-only; the runbook's "Consult the Advisor") read both of tonight's migrations
(2026-10-06): APPLY each, after its drift read and its proof's GREEN; the hashes and its caveats are under Waiting on
Will. A successor respawns it from `usher/kit/advisor-prompt.txt` for the next migration.

**The cloud seat.** Since its restart at 09:52Z the container carries Will's environment (every app variable), and
its `.env.local` is written from it by the spawn prompt's recipe (the site URL kept at `http://localhost:3000`); it runs
the gates on 4 cores (`pnpm test` about 8.5 minutes). zsh is installed and `~/.nvm/nvm.sh` is a
no-op stub (the kit sources nvm under `set -e`); an export lasts one command, so `S`, `CHROME_PATH`, `NODE_USE_ENV_PROXY` and the
site URL's override live in the shell snapshot (re-append after a worker restart; a background command reads none, so
set them inside it). A restart
resumes in the session record's mode, so the mode stays Auto. The lanes' sessions carry the environment's variables
and an open network. The Vercel connector sees Will's personal team, not P3's (`VERCEL_TOKEN` in the lanes' environment
serves the kit's REST calls); no Cloudflare token is in the environment. ★ **The Supabase connector's SQL tools
(`execute_sql`, `apply_migration`) wait on a human approval in Auto mode** (billing-orphans and drive-crumbs each sat
35 minutes on one, 2026-10-06): a lane never calls them and writes its rolled-back proofs into its Handoff, and the
Orchestrator runs them, applies a migration and regenerates the types when Will can approve (his morning, or a word
from him that he is watching).

**Handoff, if this session ends:** the next Orchestrator reads this pickup, then STATUS; finds each lane's session
(`list_sessions`, titled "partyreel lane: <track>") and resumes one that is mid-work by `send_message` to its id, or
respawns it on its pushed branch (the runbook's "Resume a lane"); a lane whose manifest says handed-off is ready to
integrate. A local `launch-prep` ahead of `origin` holds a merge made after this note: push it, then record it from its
merge message and its lane's Handoff (`git show <merge>^2:docs/tracks/<track>.md`). Out of a cloud seat's reach: Will's
desk at `localhost:3000` (he refreshes it himself), the Mac's old `../partyreel-wt/_scratch/` (history now) and the
local agents' transcripts.

## Next, in order

1. **Integrate each handoff as it lands**, one at a time, each lane's migration through the Advisor before
   `apply_migration` (its md5 against the file, advisors at 26/4/36, the types regenerated): billing-orphans and
   drive-crumbs after the morning's SQL, then each lane below as it hands off.
2. **Will's desk** holds brand r2's `take` (served at `2634388a8`, unanswered) and, at the next refresh, event-header
   r6's `card` and `attention`: he runs `git pull && S=/tmp zsh usher/kit/desk-refresh.sh <sha>` in his checkout.
   Then desk 6, the brand applied (brand-marks with the status set, which inherits his `attention` pick as its waiting
   colour; aurora; marketing-themes with N4, N7 and N9; demo-framing r6; presence r1), cut after his brand r2 pick; and
   desk 7, the moments boards (host-, guest- and account-moments, create-wizard r4: each a ROADMAP line with its calls),
   host- and guest-moments running (In flight), account-moments and create-wizard r4 after them. The PREMISE re-read
   is done (11:15Z): gate 40 flagged event-header's two asks against crumbs-85's one line in the hub page (the develop
   facts carry the zone), which moves nothing `card` or `attention` asks; no gate flagged brand's.
3. **Red-team 56b** (its own cloud session, below: crumbs-85's MEDIUM re-walked, the house set, the album's time; its
   report is its last message, read with `list_events`), then **milestone 38** on
   Will's yes: the `FULL=1` gate here, `pnpm compute:model` (a lane, since it needs the real services), merge to
   `main`, tag, push (production deploys from the push); then the Drive and backup Workers (`wrangler`: Will's Mac, or
   a Cloudflare token in the environment) and `DRIVE_WORKER_URL` and `BACKUP_WORKER_URL` on Vercel; drive-hardening's
   live walk (P3's Google consent, Will's hand). The Advisor wants 38 soon: milestone 37's build re-grants a Pro credit
   past a day (TEST money).
5. **The second wave**, from ROADMAP "Now" as owns free: accessibility after identity-r5-wiring (`--faint` at about
   3.6:1, the paper warning token at 1.85:1, `dashRange`'s spoken twin), the rest of the halo sweep (the guest's pages,
   the hub, `/admin`, pricing, Drive), uploads (Retry all re-queued once, the next burst on the last one's bytes,
   per-event byte sums in SQL), code hygiene, marketing.
6. **Compute:** lever 3 and 3b only on Will's X5; `pnpm compute:model` at every milestone.
7. **★ Vercel's Hobby Active CPU** (about 3.89 of 4 hours over 30 days on 2026-10-06; the peak rolls off in early
   November): nothing runs against the alias or partyreel.com but what Will asks for by name.
8. **Pacing:** the cloud credit (Will: $250, $168 left at his good night, a gift: spend it): full speed until he says
   it is spent. The account's seven-day limit read `allowed_warning` at 10:31Z (it resets about 2026-10-11 13:00Z).

## Waiting on Will

- **His desk:** brand r2's take; event-header r6 at the next refresh.
- **The SQL steps of tonight's two migrations** (billing-orphans', drive-crumbs'): each connector prompt needs his
  approval. First the drift read, live `md5(btrim(regexp_replace(prosrc,'\s+',' ','g')))` against the Advisor's:
  `record_pass_credit_grant` `8605ffe454f7e3ab41cdeaf8384edc6e`, `release_pass_credit`
  `daf8070ceefe570939df3dd5965ecb5d`, `convert_pass_credit` `17dd8a3c42b8a3301206eb3de5462a9a`, `claim_pass_credit`
  `608bb620d856a71389345ce194ddb6d4`, `cloud_export_ready` `998368c3d63a02382117a077f8f70668`, `cloud_export_lease`
  `c92cf0439d5b687adb6ca61da496c0aa`, `cloud_export_check_page` `0172036645d31e4eefe10c8f5218a58b`;
  `adopt_pass_credit_orphans` and `cloud_exports.folder_found` absent. Then each file's RED/GREEN proof (a GREEN
  failing on a fixture is the fixture's; on an assertion, HOLD), the applies (either order), advisors at 26/4/36, the
  types once after both, and the two integrations with the Advisor's words folded in: billing-caps' "all or nothing"
  covers only the orphans that held grants; drive-export's closing check re-asks a non-rate unknown every 90 s with no
  growth (a ROADMAP line for the Worker's cadence); adopt's orphan loop wants `and c.profile_id = p_host_id` (a nit).
- **The calls lab** (`docs/calls.md`): the open questions X1, X2, X3, X5, X6 and X8, then each merge's calls, built and
  his to overrule. He asks direct questions in chat; answer in chat, never only in a file.
- **Milestone 38** on his yes, after billing-orphans, drive-crumbs and red-team 56b.
- **A Cloudflare API token** in the environment (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`), only if the
  Workers should deploy from the cloud.
- **The private note** scratch-synthesis wrote for this seat on his Mac (`CLOUD-ORCHESTRATOR-PRIVATE.md`): uploaded
  here when convenient.
- **Two backup copies to delete (privacy; a permanent delete is his hand):** in the `partyreel-backup` R2 bucket,
  `events/38290e85-c23c-4d3a-bdbb-c6240e6b5074/photo/326b519d-b453-42a4-b24c-ade0ac7f7a07/original.jpg` and
  `events/38290e85-c23c-4d3a-bdbb-c6240e6b5074/photo/c4992e06-1423-4ed7-9ac0-81359b408f7c/original.jpg`: backed up
  2026-06-21, before the 2026-07-03 EXIF backfill stripped their primaries, so they still carry EXIF (GPS where the
  photo had it). Once deleted, the next reconcile copies the stripped originals; until then the deployed reconcile
  reads Needs a look and mails daily (backup-reconcile's Q1).
- **Vercel:** Pro now, or Hobby until the window clears in early November (he said hold, 2026-10-05).
- **Six retired env names** (`STRIPE_PRICE_PRO_100` to `_2TB_YR`) to delete from both Vercel projects, `.env.local`
  and now the cloud environment: unread by any code, their Stripe TEST prices archived.
- **His six motion links, a note:** libraries.dev is blocked on his home network (the ISP's CUJO filter), so three of
  the six (voice, image, gooey) were read from their MIT source on GitHub, never watched.
- **His walks:** Tab through Account and Settings on paper at 375 and 1440, Save and Create under a throttled
  network (identity-r5-wiring); Settings' develop time on his iPhone (type a time, then Back or the picker's close: it holds;
  crumbs-72), the camera on his iPhone (a held-shutter video on a waiting sheet), Save into Photos, Record Video's
  size, a deletion and its Cancel deletion on hi@willgibs.com, the spend watch's uploads switch off and on; and
  trash-in-storage's permanent deletes, which no agent may press (on hi@willgibs.com: the size list's Delete for good
  on "RT51 free", Make room from Deleted back on and one upload past the line, Empty Deleted, a guest's own removal
  reading its purge that night); a Ladder A checkout with the test card on the alias.
