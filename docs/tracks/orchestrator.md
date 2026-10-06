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

Round 15 resumed at 15:55Z on 2026-10-06 on a new seat, the willg97 seat's cloud credit spent: a claude.ai cloud session
on hi@willgibs.com's account (`session_01D1RcsL5Ejp5qbbtv1T7oUq`, environment "Default"), on Will's $250 cloud credit at
full pace until he pauses for a desk round. Milestone 38 is live (`90ab891c2`, 21:37Z), and `launch-prep` is `main`
there; the second wave, all handed off, integrates on top (each lane's summary is its merge commit). Every lane is a
cloud session of its own (the runbook's "Cut a lane", step 4); none can message back, so a `send_later` check-in about
every 40 minutes reads them (their status, pushed heads and cost) while any runs.

| lane | what | state | model | session |
| --- | --- | --- | --- | --- |
| `marketing-crumbs` | nine marketing lines: today's product in the site's words and pictures, the postmark, the cinema 404, the demo modal on the popup, three wells | HANDED OFF at `adaa07645` (18:42Z); integrates after milestone 38 | Opus | `session_01YKZtbayaXAkLj5ZQSZabgU` |
| `upload-sums` | per-event byte sums in SQL (PRICING.md's lever 7): an upload's three reads and the size list stop walking every item; one migration (`20261006180000_upload_sums.sql`) through the Advisor | HANDED OFF at `96f3e80ba`; integrates after milestone 38, its migration through the Advisor and its proofs here | Opus | `session_01XwyY3CKaLeoiXrtikFMvXb` |
| `halo-last` | the halo and the working words at the four call sites that waited on their lanes: pricing's three focus rings and its "Opening billing", Drive's album picker and its "Starting" | HANDED OFF at `3075d32d5`; integrates after milestone 38 | Sonnet | `session_01AP6FaNfAyNyBG8FUkqkX6h` |

**The Advisor** (Fable, read-only; the runbook's "Consult the Advisor") read billing_orphans and drive_marks, both
applied (2026-10-06); its caveats are ROADMAP lines. A successor respawns it from `usher/kit/advisor-prompt.txt` for the
next migration (upload-sums').

**The cloud seat.**
- The "Default" environment holds the app's variables, Full network and a setup script (zsh, kept by dpkg's
  `--force-confold`, and the Chrome wrapper) since 17:45Z: lanes boot, build, sign in and drive Chrome.
- Seated here: zsh, `node_modules`, the `--no-sandbox` wrapper `/usr/local/bin/chrome-ns` and `.env.local`, written from
  the environment by the spawn prompt's recipe.
- ★ A worker restart (every 15 to 60 minutes) rebuilds the shell snapshot without the seat's exports: re-append `S` to
  the newest `~/.claude/shell-snapshots/snapshot-*.sh` at each resume, and the three the environment carries since
  19:00Z (the localhost site URL, `CHROME_PATH`, `NODE_USE_ENV_PROXY`, Will's) while this container predates them; a
  lane reads them from the environment. The disk survives a restart, but a dev server it killed can leave `.next/dev`
  half-written, and typecheck then fails inside it: `rm -rf .next/dev`. A background command reads no export, so set
  them inside it.
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

1. **Milestone 38 is live** (`90ab891c2`, 21:37Z; partyreel.com's alias record on `dpl_4AbVgjyu9UECuHcFVd2SuBEcpHQt`,
   the admin's on `dpl_H4Err88MLcTj1u8gyBnPdkSDsg3E`). Two things finish it: **its tag**, which this seat's git access
   refuses (HTTP 403 on a tag push, a policy, never routed around): from Will's Mac or a local seat, `git fetch origin
   && git tag -a milestone-38 90ab891c2 -m "milestone-38: the album at one moment for every guest, capture time kept,
   the house set and the halo, the hub's doors and Back, money and the meter as one truth, Drive whole" && git push
   origin milestone-38`; and **the Workers**: Drive's and the backup's (restore and reconcile) deploy with `wrangler`
   once a seat holds `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (Will's, in the environment: a new container
   reads them), then `DRIVE_WORKER_URL` and `BACKUP_WORKER_URL` on Vercel; Drive's live walk is Will's hand (P3's Google
   consent; drive-crumbs' Handoff lists what to press).
2. **The second wave integrates** on top of 38, one lane at a time (each handed off): crumbs-86 (`3f459b91b`), halo-last
   (`3075d32d5`), marketing-crumbs (`adaa07645`), then upload-sums (`96f3e80ba`), whose migration the Advisor read:
   APPLY after this seat's own RED then GREEN, on three conditions (its scratch notes are lost with this container, so
   here whole): a pre-check for transactions open past 30 s before `apply_migration` (its backfill's SHARE ROW EXCLUSIVE
   lock queues every media writer behind one); the Q1 signal lane (a `storage_sums` sweep paging `storage_sums_drift` on
   the purge cron, its /admin/jobs entry closing ERROR on drift, a Rebuild control calling `rebuild_storage_sums`, and
   `remove_my_upload`'s already-removed arm taking her profiles row first) cut and merged in the same milestone; two doc
   lines (database-security.md's lock order names the one new deadlock, a guest's withdrawal of a block-removed upload
   against the host's Restore or Let back in, 40P01 then a retry; advisors 26 -> 27 for `host_storage_sums`). Live it
   replays exactly: the six names absent, `host_storage_summary` at 30b70bbe84e35dfc0662eda92ab7fa5c, the proof's step 5
   reading five hosts at parity. Each lane's merge retires its lines from the ROADMAP's Landing.
3. **The ROADMAP is five buckets** (3827bb5b7): `record.py` places each line by bucket and area and refuses an Immediate
   past 40. The next crumbs lane is cut from Immediate (red-team 56b's LOWs and NITs lead it). Two check upgrades wait
   there, both Will's rising tide (a check that obstructs is upgraded): `pnpm test:rules` in the board lanes' light
   gate, and `compute:model` holding CPU only on its budget's own machine.
4. **For the local seat, with a fresh context** (Will, 2026-10-06): his desk review batch (brand r2, event-header r6 and
   desk 7's four moments boards, all on the alias), committed verbatim to `docs/reviews/` before a word of it is
   transcribed; then his personal list of 100+ items in batches, each committed verbatim first and slotted into the
   ROADMAP's buckets and areas with a proposed order of rounds on top; and a lab triage tool (Keep, Later or Drop with a
   note beside each `[unsure: …]` line and any bucket he asks for, its answers a paste back, as the desk's are).
5. **The alias serves `bbfcc544`** (19:45Z, deployed once on Will's word): his desk is at
   `https://partyreel-git-launch-prep-partyreel.vercel.app/design/lab?key=fiesta`. No other deploy until he asks.
6. **★ Vercel's Hobby Active CPU** (about 3.89 of 4 hours over 30 days on 2026-10-06; the peak rolls off in early
   November): nothing runs against the alias or partyreel.com but what Will asks for by name.
7. **Pacing:** this cloud seat finishes what is open, with no new tracks (about $68 of Will's cloud credit left at
   21:15Z); the program then hands to a local Orchestrator on Will's Mac with a fresh weekly limit.

## Waiting on Will

- Sentry and Stripe to authorize on this account.
- **His desk, on the alias** (`/design/lab?key=fiesta`): brand r2's take, event-header r6 and desk 7 whole.
- **The calls lab** (`docs/calls.md`): the open questions X1, X2, X3, X5, X6 and X8, then each merge's calls, built and
  his to overrule. He asks direct questions in chat; answer in chat, never only in a file.
- **The `milestone-38` tag** from his Mac (Next 1 has the command), and **the Cloudflare token** for the Workers.
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
