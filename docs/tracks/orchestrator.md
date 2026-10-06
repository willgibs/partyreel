---
track: orchestrator
status: open
cut: "fef6fc53"          # the launch-prep SHA this state was written at
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

Nothing runs. Round 15's cloud seat (`session_01D1RcsL5Ejp5qbbtv1T7oUq`, hi@willgibs.com's account, environment
"Default") wound down at a clean handoff point on 2026-10-06, its credit spent to plan: milestone 38 live (`90ab891c2`),
and the second wave merged on `launch-prep` (crumbs-86, halo-last, marketing-crumbs and upload-sums, each its merge
commit's summary; `upload_sums` applied live), every lane's branch integrated and none open. The next Orchestrator is
local, on Will's Mac, with a fresh weekly limit: it seats in by the runbook (its lanes local worktrees again, Will's
desk at `localhost:3000`).

| lane | what | state | model | session |
| --- | --- | --- | --- | --- |

**Will's first prompt to the next seat carries his desk review batch** (brand r2, event-header r6 and desk 7's four
moments boards, all on the alias): committed verbatim to `docs/reviews/` before a word of it is transcribed, then
worked as the runbook's "Run a round" says, before anything else in Next.

**The Advisor** (Fable, read-only; the runbook's "Consult the Advisor") read upload_sums (APPLY, on three conditions:
its pre-check and doc lines are done; the storage sums' signal lane is Next 2). A successor respawns it from
`usher/kit/advisor-prompt.txt` for the next migration (that lane's `remove_my_upload` arm).

**Seats.** The runbook's "Seat in" covers a local seat and a cloud one (a cloud seat's SQL through the scoped
`Superbase_Custom` connector, its exports re-appended to the shell snapshot after every worker restart). A local
`launch-prep` ahead of `origin` holds a merge made after this note: push it, then record it from its merge message and
its lane's Handoff (`git show <merge>^2:docs/tracks/<track>.md`).

## Next, in order

1. **Milestone 38 is live** (`90ab891c2`, 21:37Z; partyreel.com's alias record on `dpl_4AbVgjyu9UECuHcFVd2SuBEcpHQt`,
   the admin's on `dpl_H4Err88MLcTj1u8gyBnPdkSDsg3E`). Two things finish it: **its tag**, which a cloud seat's git
   access refuses (HTTP 403 on a tag push, a policy, never routed around): from Will's Mac or a local seat, `git fetch
   origin && git tag -a milestone-38 90ab891c2 -m "milestone-38: the album at one moment for every guest, capture time
   kept, the house set and the halo, the hub's doors and Back, money and the meter as one truth, Drive whole" && git
   push origin milestone-38`; and **the Workers**: Drive's and the backup's (restore and reconcile) deploy with
   `wrangler` from a seat holding `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (the Mac's, or the cloud
   environment's in a new container), then `DRIVE_WORKER_URL` and `BACKUP_WORKER_URL` on Vercel; Drive's live walk is
   Will's hand (P3's Google consent; drive-crumbs' Handoff lists what to press).
2. **Milestone 39 is the second wave** (crumbs-86, halo-last, marketing-crumbs, upload-sums: merged on `launch-prep`,
   each its merge commit's summary; `upload_sums` applied live, verbatim, every host at parity). Before its yes: **the
   storage sums' signal lane** (the Advisor's condition: ROADMAP Immediate, "Jobs: the storage sums' nightly signal"),
   cut and merged; then **red-team 57** on that tip, its walks: halo-last's Tab walk (pricing's sheet, Account's Plan
   card, the Drive picker at 375 and 1440, light and dark, the working words on a throttled network); upload-sums'
   (willg97's size list against its 21 totals, then an upload, a Remove and a Delete permanently, each total moving by
   the file, and `storage_sums_drift(null, 1000)` empty after); marketing-crumbs' look-at-first (/how-it-works step 03,
   the nav's Features pane, /features/curation, a weddings page's table card); crumbs-86's See it as a guest on a far
   party. Then the FULL gate, `pnpm compute:model` on the Mac, and Will's yes.
3. **The next crumbs lane** comes from Immediate (red-team 56b's LOWs and NITs lead it). The ROADMAP is five buckets
   (`record.py` places each line and refuses an Immediate past 40); its two check upgrades wait there, both Will's
   rising tide: `pnpm test:rules` in the board lanes' light gate, and `compute:model` holding CPU only on its budget's
   machine.
4. **After his desk batch, with a fresh context** (Will, 2026-10-06): his personal list of 100+ items in batches, each
   committed verbatim first and slotted into the ROADMAP's buckets and areas with a proposed order of rounds on top; and
   a lab triage tool (Keep, Later or Drop with a note beside each `[unsure: …]` line and any bucket he asks for, its
   answers a paste back, as the desk's are).
5. **The alias serves `bbfcc544`** (19:45Z, deployed once on Will's word): his desk is at
   `https://partyreel-git-launch-prep-partyreel.vercel.app/design/lab?key=fiesta`. No other deploy until he asks.
6. **★ Vercel's Hobby Active CPU** (about 3.89 of 4 hours over 30 days on 2026-10-06; the peak rolls off in early
   November): nothing runs against the alias or partyreel.com but what Will asks for by name.
7. **Pacing:** the cloud seat's credit is spent down to its consolidation point; the program goes on from a local
   Orchestrator on Will's Mac with a fresh weekly limit.

## Waiting on Will

- **His desk review batch**, in the next seat's first prompt (brand r2's take, event-header r6 and desk 7 whole, on
  the alias at `/design/lab?key=fiesta`).
- **The calls lab** (`docs/calls.md`): the open questions X1, X2, X3, X5, X6 and X8, then each merge's calls, built and
  his to overrule. He asks direct questions in chat; answer in chat, never only in a file.
- **The `milestone-38` tag** from his Mac (Next 1 has the command), and **the Cloudflare token** for the Workers
  (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`: the Mac's, or the cloud environment's for a new container).
- **The private note** scratch-synthesis wrote on his Mac (`CLOUD-ORCHESTRATOR-PRIVATE.md`), for the next seat there.
- **Two backup copies to delete (privacy; a permanent delete is his hand):** in the `partyreel-backup` R2 bucket,
  `events/38290e85-c23c-4d3a-bdbb-c6240e6b5074/photo/326b519d-b453-42a4-b24c-ade0ac7f7a07/original.jpg` and
  `events/38290e85-c23c-4d3a-bdbb-c6240e6b5074/photo/c4992e06-1423-4ed7-9ac0-81359b408f7c/original.jpg`: backed up
  2026-06-21, before the 2026-07-03 EXIF backfill stripped their primaries, so they still carry EXIF (GPS where the
  photo had it). Once deleted, the next reconcile copies the stripped originals; until then the reconcile, once
  deployed, reads Needs a look and mails daily (backup-reconcile's Q1).
- **Vercel:** Pro now, or Hobby until the window clears in early November (he said hold, 2026-10-05).
- **Six retired env names** (`STRIPE_PRICE_PRO_100` to `_2TB_YR`) to delete from both Vercel projects, `.env.local`
  and the cloud environment: unread by any code, their Stripe TEST prices archived.
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
