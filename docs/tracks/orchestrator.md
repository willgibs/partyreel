---
track: orchestrator
status: open
cut: "711c11ff"          # the launch-prep SHA this state was written at
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
38's work, whole since drive-crumbs merged at gate 47 (each lane's summary is its merge commit). Every lane is a cloud
session of its own (the runbook's "Cut a lane", step 4); none can message back, so a `send_later` check-in about every
40 minutes reads them (their status, pushed heads and cost) while any runs.

| lane | what | state | model | session |
| --- | --- | --- | --- | --- |
| `redteam-56b` | red-team 56b on milestone 38's whole tip: crumbs-85's MEDIUM re-walked, the bursts, the house set and the halo's Tab walk, the album's time, the roll, marketing's pictures, the 404s, the regressions | RUNNING since 19:03Z on `28ac0f813`, its boot reading the environment as it stands (the first session, `session_01KZTtpNFbXk3YiQS79BqG9j`, walked nothing: its permission check refused four boot steps that overrode the environment, until Will set the localhost site URL, `CHROME_PATH` and `NODE_USE_ENV_PROXY` there); its report is its `result` event, its MEDIUM-or-worse lines in its events as it walks | Opus | `session_01Bn45Y2nTKbfTSXZsoCPGMT` |
| `account-moments-r1` | board account-moments r1 (desk 50): I4 Follow and Block staying quiet, I5 a profile before a public page, each built answer drawn beside real alternatives | BACK WITH ITS LANE (18:58Z): gate 48 red on one test, `layer-is-up.test.tsx` refusing the hand-written dialog selector at `relations.tsx:113` (every other step green); the local merge undone, the lane resumed by message to fix it and hand off again | Opus | `session_01NRUnVBvmM6AN8RZvcVryuV` |
| `marketing-crumbs` | nine marketing lines: today's product in the site's words and pictures, the postmark, the cinema 404, the demo modal on the popup, three wells | HANDED OFF at `adaa07645` (18:42Z); integrates after milestone 38 | Opus | `session_01YKZtbayaXAkLj5ZQSZabgU` |
| `upload-sums` | per-event byte sums in SQL (PRICING.md's lever 7): an upload's three reads and the size list stop walking every item; one migration (`20261006180000_upload_sums.sql`) through the Advisor | RUNNING since 17:48Z (cut at `567e8710`); integrates after milestone 38 | Opus | `session_01XwyY3CKaLeoiXrtikFMvXb` |
| `crumbs-86` | ten small things: the 404s' one noindex, the host's capture clock, See it as a guest's zone and words, Create's seeding, billing's seam, two Library specimens, lifecycle comments, Blocked's address; no migration | RUNNING since 17:48Z (cut at `567e8710`); integrates after milestone 38 | Opus | `session_01NdLRsbCC4Nknxu3h5cbE8f` |
| `halo-last` | the halo and the working words at the four call sites that waited on their lanes: pricing's three focus rings and its "Opening billing", Drive's album picker and its "Starting" | RUNNING since 18:36Z (cut at `28ac0f81`); integrates after milestone 38 | Sonnet | `session_01AP6FaNfAyNyBG8FUkqkX6h` |

**The Advisor** (Fable, read-only; the runbook's "Consult the Advisor") read billing_orphans and drive_marks, both
applied (2026-10-06); its caveats are ROADMAP lines. A successor respawns it from `usher/kit/advisor-prompt.txt` for the
next migration (upload-sums').

**The cloud seat.**
- The "Default" environment holds the app's variables, Full network and a setup script (zsh, kept by dpkg's
  `--force-confold`, and the Chrome wrapper) since 17:45Z: lanes boot, build, sign in and drive Chrome.
- Seated here: zsh, `node_modules`, the `--no-sandbox` wrapper `/usr/local/bin/chrome-ns` and `.env.local`, written from
  the environment by the spawn prompt's recipe.
- ★ A worker restart (every 15 to 60 minutes) rebuilds the shell snapshot without the seat's four exports (`S`,
  `CHROME_PATH`, `NODE_USE_ENV_PROXY`, the site URL's override): re-append them to the newest
  `~/.claude/shell-snapshots/snapshot-*.sh` at each resume. The disk survives one, but a dev server it killed can leave
  `.next/dev` half-written, and typecheck then fails inside it: `rm -rf .next/dev`. A background command reads no
  export, so set them inside it.
- The session's mode reads auto (Will's mode picker), so lanes spawn in auto; a child never exceeds its parent's mode.
- SQL runs through the scoped connector `Superbase_Custom` (the runbook's "Migrations"), each call on Will's Allow.
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

1. **Red-team 56b** walks `28ac0f813` (In flight); its report is its
   `result` event, and each MEDIUM-or-worse line shows in its events as it walks. Rows it names for a read-back are
   read here (SELECT, on Will's Allow). Its findings go to a crumbs lane; with no HIGH, **milestone 38** goes to Will
   for his yes: the `FULL=1` gate here, `pnpm compute:model` (a lane, since it needs the real services), merge to
   `main`, tag, push (production deploys from the push); then the Drive and backup Workers (`wrangler`: Will's Mac, or
   a Cloudflare token in the environment) and `DRIVE_WORKER_URL` and `BACKUP_WORKER_URL` on Vercel; Drive's live walk
   (P3's Google consent, Will's hand: drive-crumbs' Handoff lists what to press). The Advisor wants 38 soon: milestone
   37's build re-grants a Pro credit past a day (TEST money).
2. **Lanes run:** desk 7's two boards merge as they hand off (dev-only); the second wave (marketing-crumbs, upload-sums,
   crumbs-86) and halo-last integrate after milestone 38's merge, so what ships is what red-team 56b walked;
   upload-sums' migration goes through the Advisor, then its drift read, RED, GREEN and apply here. A `send_later`
   check-in about every 40 minutes reads them.
3. **The alias, once, for the desk review** (Will's ask, 18:29Z: "should be fine on our Vercel usage"): when desk 7's
   last two boards are merged, their record carries `[preview]` and the runbook's "Deploy to the alias" runs once
   (`vercel-usage.mjs` read first, `alias-ensure.mjs`, the prune); Will reviews the desk there.
4. **Will's desk** holds brand r2's `take` (served at `2634388a8`, unanswered) and, at the next refresh, event-header
   r6's `card` and `attention` and desk 7's moments boards (host-moments r1, guest-moments r1 and create-wizard r4
   merged; account-moments r1 when it lands): he runs `git pull && S=/tmp zsh usher/kit/desk-refresh.sh <sha>` in his
   checkout. Desk 6, the brand applied (brand-marks with the status set, which inherits his `attention` pick as its
   waiting colour; aurora; marketing-themes with N4, N7 and N9; demo-framing r6; presence r1), is cut after his brand r2
   pick.
5. **Compute:** lever 3 and 3b only on Will's X5; `pnpm compute:model` at every milestone.
6. **★ Vercel's Hobby Active CPU** (about 3.89 of 4 hours over 30 days on 2026-10-06; the peak rolls off in early
   November): nothing runs against the alias or partyreel.com but what Will asks for by name.
7. **Pacing:** Will's $250 cloud credit on this account, full pace until he pauses for a desk round (a board lane ran
   $9 to $15, a production lane $6 to $29).

## Waiting on Will

- Sentry and Stripe to authorize on this account.
- **His desk:** brand r2's take; event-header r6 and desk 7 at the next refresh.
- **The calls lab** (`docs/calls.md`): the open questions X1, X2, X3, X5, X6 and X8, then each merge's calls, built and
  his to overrule. He asks direct questions in chat; answer in chat, never only in a file.
- **Milestone 38** on his yes, after red-team 56b (billing-orphans and drive-crumbs merged).
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
