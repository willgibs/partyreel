---
track: orchestrator
status: open
cut: "c02efdbc"          # the launch-prep SHA this state was written at
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

Round 15 resumed at 15:55Z on 2026-10-06 on a new seat, the willg97 seat's cloud credit spent: a claude.ai cloud
session on hi@willgibs.com's account (`session_01D1RcsL5Ejp5qbbtv1T7oUq`, environment "Default"), on Will's $250 cloud
credit at full pace until he pauses for a desk round. Milestone 37 is live (`b67cdc1f2`); `launch-prep` holds milestone
38's work (each lane's summary is its merge commit). Every lane is a cloud session of its own (the runbook's "Cut a
lane", step 4); none can message back, so a `send_later` check-in about every 40 minutes reads them (their status,
pushed heads and cost) while any runs. The willg97 seat's lane sessions are out of this account's reach; none was
mid-work.

| lane | what | state | model | session |
| --- | --- | --- | --- | --- |
| `billing-orphans` | milestone 38's billing line: an orphan's grant as one SQL function under her profiles lock, the change-plan configuration watched at its source, the Plan card's words while a credited Pro lands; one migration (`20261006120000_billing_orphans.sql`) | HANDED OFF at `4a113e5d4`; its lane check clean; waits on its SQL (Next 1) | Opus | willg97's `session_015JAkfLgeuTsZZMNJXrZVeV` |
| `drive-crumbs` | Drive whole before it goes live: album folders and files found by their marks after a reconnect, the closing check held at the first unknown, Account's card naming her folder, the palette's jump; one migration (`20261006130000_drive_marks.sql`) | HANDED OFF at `6d1731c27`; its lane check clean; waits on its SQL (Next 1) | Opus | willg97's `session_01AGJfN3zW3BvB8vPM7KSgbL` |
| `account-moments-r1` | board account-moments r1 (desk 50): I4 Follow and Block staying quiet, I5 a profile before a public page, each built answer drawn beside real alternatives | CUT at `6ccc5b4e`, not spawned: an auto lane spawns only under a session whose record is auto (Waiting on Will) | Opus | (to spawn) |
| `create-wizard-r4` | board create-wizard r4 (desk 60): the styles' step polished on his round-3 note, F1 what is left as Settings' steps, F2 the develop playing while the event is made | CUT at `6ccc5b4e`, not spawned (as above) | Opus | (to spawn) |
| `redteam-56b` | red-team 56b on the tip after both merges | to respawn once the environment holds the app's variables (Waiting on Will); the willg97 session `session_017cgyXnS3nnK35ifo2L6bEa` ended BLOCKED at 11:22Z, no findings | Opus | (to spawn) |

**The Advisor** (Fable, read-only; the runbook's "Consult the Advisor") read both of tonight's migrations
(2026-10-06): APPLY each, after its drift read and its proof's GREEN; its caveats are under Next. A successor respawns
it from `usher/kit/advisor-prompt.txt` for the next migration.

**The cloud seat.**
- Its container holds no app variable yet; Will is adding them to the "Default" environment with a Setup script (zsh,
  the Chrome wrapper). A new session picks an environment change up, a worker restart sometimes: the network change
  he made at about 16:30Z reached this seat at its next restart (Supabase, Vercel and partyreel.com answer).
- Seated here: zsh, `node_modules`, the `--no-sandbox` wrapper `/usr/local/bin/chrome-ns` (Will's yes, 16:41Z), and a
  public-only `.env.local` (the Supabase URL and publishable key from the connector, the localhost site URL,
  `DESIGN_PREVIEW_KEY`), rewritten from the environment by the spawn prompt's recipe once its variables arrive.
- The four exports (`S`, `CHROME_PATH`, `NODE_USE_ENV_PROXY`, the site URL's override) live in `~/.zshrc` and
  `~/.bashrc` as well as the snapshot, so a worker restart (every 15 to 60 minutes here) rebuilds them; the disk
  survives one. A background command reads none, so set them inside it.
- ★ The session's record was born in plan mode and stays `plan` until Will sets the mode picker to Auto: every worker
  restart drops the seat back into plan mode, and `create_session` refuses an auto lane under a plan parent.
- ★ The Supabase connector asks a form confirmation (an MCP elicitation) before SQL it detects as destructive (a
  DELETE or DROP as a statement or inside a function body; comments and strings pass), and no client of Will's renders
  it: the call times out at 60 s and nothing runs. The fix (Supabase's troubleshooting page "SQL confirmations do not
  appear in your MCP client"): a custom connector at
  `https://mcp.supabase.com/mcp?project_ref=ddafaemglzmuekbtjwzn&skip_elicitations=execute_sql,apply_migration`, which
  Will is adding (16:50Z); every SQL call still waits on his Allow pop-up. Never reword or obfuscate a DELETE or DROP
  past the detector.
- The Vercel connector here sees the P3 team (`team_ht9qAVBQVZf60dpGNJUwmaj5`); Sentry and Stripe wait on their
  authorization on this account.
- This account's seven-day limit read `allowed_warning` (it resets 2026-10-06 21:00Z): this pickup is kept current
  after every step.

**Handoff, if this session ends:** the next Orchestrator reads this pickup, then STATUS; finds each lane's session
(`list_sessions`, titled "partyreel lane: <track>") and resumes one that is mid-work by `send_message` to its id, or
respawns it on its pushed branch (the runbook's "Resume a lane"); a lane whose manifest says handed-off is ready to
integrate. A local `launch-prep` ahead of `origin` holds a merge made after this note: push it, then record it from its
merge message and its lane's Handoff (`git show <merge>^2:docs/tracks/<track>.md`). A migration's rolled-back proof is
built from its file's foot: RED is `begin;` + the uncommented block + `rollback;`, GREEN puts the file's statements
before the block. Out of a cloud seat's reach: Will's desk at `localhost:3000`, the Mac's old `../partyreel-wt/_scratch/`
and another account's sessions.

## Next, in order

1. **Tonight's two migrations, through the scoped connector**, once its tools reach this session (a restart or a new
   session; its server may carry a new name): the drift read re-run (it matched at 16:25Z: all seven hashes, both new
   objects absent); billing-orphans' RED (1a true, 1b to 4 false) and GREEN (0 to 5 true); drive-crumbs' GREEN (7/7;
   its RED passed at 15:35Z). A GREEN failing on a fixture is the fixture's; on an assertion, HOLD and consult the
   Advisor. Then the applies (`apply_migration`, the whole file from the lane's head, `md5(statements[1])` against
   `md5sum`), advisors at 26/4/36, and the types once after both.
2. **Integrate billing-orphans, then drive-crumbs**, each record folding in the Advisor's words: billing-caps' "all or
   nothing" covers only the orphans that held grants; drive-export's closing check re-asks a non-rate unknown every
   90 s with no growth (a ROADMAP line for the Worker's cadence); adopt's orphan loop wants `and c.profile_id =
   p_host_id` (a nit, a ROADMAP line); billing's `orphansDb` seam drops once the types carry the function (a
   code-hygiene line).
3. **Spawn desk 7's two boards** (account-moments-r1, create-wizard-r4) the moment this session's record reads auto;
   they merge as they hand off (dev-only).
4. **Red-team 56b** once the environment holds the app's variables: a fresh cloud session on the tip after both merges
   (crumbs-85's MEDIUM re-walked, the house set, the album's time, billing's "Pro on its way" line at 375 and 1440, the
   upload bursts); its report is its `result` event. Then **milestone 38** on Will's yes: the `FULL=1` gate here,
   `pnpm compute:model` (a lane, since it needs the real services), merge to `main`, tag, push (production deploys
   from the push); then the Drive and backup Workers (`wrangler`: Will's Mac, or a Cloudflare token in the
   environment) and `DRIVE_WORKER_URL` and `BACKUP_WORKER_URL` on Vercel; Drive's live walk (P3's Google consent,
   Will's hand: drive-crumbs' Handoff lists what to press). The Advisor wants 38 soon: milestone 37's build re-grants a
   Pro credit past a day (TEST money).
5. **The second wave**, cut as the environment allows and integrated after milestone 38's merge, so what ships is what
   red-team 56b walked: halo-last (pricing's three focus rings and Drive's album picker, once both merges free them),
   upload-sums (per-event byte sums in SQL, a migration through the Advisor), crumbs-86 (code hygiene: billing's seam,
   the 404s' robots metadata, Create's zone seeding, the host's `captured_wall`), marketing-copy (retired-mocks' copy
   line).
6. **Will's desk** holds brand r2's `take` (served at `2634388a8`, unanswered) and, at the next refresh, event-header
   r6's `card` and `attention` and desk 7's moments boards (host-moments r1 and guest-moments r1 merged;
   account-moments r1 and create-wizard r4 when they land): he runs `git pull && S=/tmp zsh
   usher/kit/desk-refresh.sh <sha>` in his checkout. Desk 6, the brand applied (brand-marks with the status set, which
   inherits his `attention` pick as its waiting colour; aurora; marketing-themes with N4, N7 and N9; demo-framing r6;
   presence r1), is cut after his brand r2 pick.
7. **Compute:** lever 3 and 3b only on Will's X5; `pnpm compute:model` at every milestone.
8. **★ Vercel's Hobby Active CPU** (about 3.89 of 4 hours over 30 days on 2026-10-06; the peak rolls off in early
   November): nothing runs against the alias or partyreel.com but what Will asks for by name.
9. **Pacing:** Will's $250 cloud credit on this account, full pace until he pauses for a desk round (a board lane ran
   $9 to $15, a production lane $6 to $29).

## Waiting on Will

- **This session's mode to Auto** (the app's mode picker): its record says `plan`, so restarts drop the seat into plan
  mode and no lane spawns in auto.
- **The scoped Supabase connector** (above): tonight's DELETE and DROP steps wait on it.
- **The environment's app variables and Setup script** (zsh, the chrome-ns wrapper; `CHROME_PATH` and
  `NODE_USE_ENV_PROXY=1` among its variables), as on willg97's: red-team 56b, `compute:model` and every lane that walks
  the app need them. Sentry and Stripe to authorize on this account.
- **His desk:** brand r2's take; event-header r6 and desk 7 at the next refresh.
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
- **His walks:** the halo's Tab walk a11y-halo could not drive (its browser refused): each changed control at 375 and
  1440, light and dark, above all the live reel's bar, the moderation tile and the upload stop keys on a photograph and
  the hub reel curtain's close; Tab through Account and Settings on paper at 375 and 1440, Save and Create under a throttled
  network (identity-r5-wiring); Settings' develop time on his iPhone (type a time, then Back or the picker's close: it holds;
  crumbs-72), the camera on his iPhone (a held-shutter video on a waiting sheet), Save into Photos, Record Video's
  size, a deletion and its Cancel deletion on hi@willgibs.com, the spend watch's uploads switch off and on; and
  trash-in-storage's permanent deletes, which no agent may press (on hi@willgibs.com: the size list's Delete for good
  on "RT51 free", Make room from Deleted back on and one upload past the line, Empty Deleted, a guest's own removal
  reading its purge that night); a Ladder A checkout with the test card on the alias.
