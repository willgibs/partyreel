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
milestone 38's work (each lane's summary is its merge commit) and red-team 56's findings, which crumbs-85 fixes. Every
lane is a cloud session of its own (the runbook's "Cut a lane", step 4); none can message back, so a `send_later`
check-in about every 40 minutes reads them (their status, pushed heads and cost) while any runs.

| lane | what | state | model | session |
| --- | --- | --- | --- | --- |
| `event-header-r6` | board event-header r6 (desk 20): the Seam made Afterglow's own (the brand's reach, its pools, the edge's own colours, the cards on the cover's foot), then `card` (`shoulder` recommended, 99+) and `attention` after it (`tally` recommended: one status token for the badges and the code's corner) | MERGED at `c224231e` (gate 37 green); on Will's desk at the next refresh; about $14.65 in 45 minutes | Opus | `session_01VLjzYrtjcchGMQBE92Cru5` |
| `lab-kit-3` | the kit and the lab at home in the cloud: Mac paths gone, nvm optional, sign-in for the test hosts (`signin.mjs`), test media of its own, the red-team harness on Linux, the lab's open lines (fitStage, DevTools port 0, the pause at the gate, a motion capture) | RUNNING (cut at `da3c5471`) | Opus | `session_01GhmBokufroMNswQZeR2w3x` |
| `identity-r5-wiring` | Will's house set (wells, flat keys, the chosen afloat) and working = words into production's atoms, the halo sweep inside its owns, Settings' roll-of-one words; the identity board retired | MERGED at `94534554` (gate 38 green); about $18.47; the halo at other lanes' call sites and their keys' working words a ROADMAP line; its calls are the lab's BJ; for Will's desk: Tab through Account and Settings on paper at 375 and 1440, Save and Create under a throttled network | Opus | `session_01T17fcgDtvANz1cvQAVCgnV` |
| `crumbs-85` | red-team 56's findings (the MEDIUM: a guest's progress and Stop where she sends in an album in order) and the album's time made whole (event-zone's, capture-time's and guest-requests' follow-ups) | RUNNING (cut at `da3c5471`) | Opus | `session_017wo11hh57XYRiRaqk7T2dM` |
| `billing-orphans` | milestone 38's billing line: an orphan's grant as one SQL function under her profiles lock, the change-plan configuration watched at its source, the Plan card's words while a credited Pro lands; one migration (`20261006120000_billing_orphans.sql`) | RUNNING (cut at `da3c5471`) | Opus | `session_015JAkfLgeuTsZZMNJXrZVeV` |
| `drive-crumbs` | Drive whole before it goes live: album folders and files found by their marks after a reconnect, the closing check held at the first unknown, Account's card naming her folder, the palette's jump; one migration (`20261006130000_drive_marks.sql`) | RUNNING (cut at `da3c5471`) | Opus | `session_01AGJfN3zW3BvB8vPM7KSgbL` |

**The Advisor** (Fable, read-only; the runbook's "Consult the Advisor"): spawned in this session for the first
migration that lands; its agent id lives only here.

**The cloud seat.** This container holds no secret (it predates Will's environment change; its `.env.local` holds the
public values) and runs the gates on 4 cores (`pnpm test` about 8.5 minutes). zsh is installed and `~/.nvm/nvm.sh` is a
no-op stub (the kit sources nvm under `set -e`); an export lasts one command, so `S` and `CHROME_PATH` live in the
shell snapshot (re-append after a worker restart; a background command reads none, so set `S` inside it). A restart
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
   `apply_migration` (its md5 against the file, advisors at 26/4/36, the types regenerated): milestone 38's three
   first (crumbs-85, billing-orphans, drive-crumbs), then identity-r5-wiring and lab-kit-3.
2. **Will's desk** holds brand r2's `take` (served at `2634388a8`, unanswered) and, at the next refresh, event-header
   r6's `card` and `attention`: he runs `git pull && S=/tmp zsh usher/kit/desk-refresh.sh <sha>` in his checkout.
   Then desk 6, the brand applied (brand-marks with the status set, which inherits his `attention` pick as its waiting
   colour; aurora; marketing-themes with N4, N7 and N9; demo-framing r6; presence r1), cut after his brand r2 pick; and
   desk 7, the moments boards (host-, guest- and account-moments, create-wizard r4: each a ROADMAP line with its calls),
   cut now that identity-r5-wiring has merged, so they draw on the house set. Before his next sitting, re-read the
   brand and event-header boards' open asks against production's `globals.css`, which the house set changed.
3. **Red-team 56b** (a lane: crumbs-85's MEDIUM re-walked, the halo sweep, the album's time), then **milestone 38** on
   Will's yes: the `FULL=1` gate here, `pnpm compute:model` (a lane, since it needs the real services), merge to
   `main`, tag, push (production deploys from the push); then the Drive and backup Workers (`wrangler`: Will's Mac, or
   a Cloudflare token in the environment) and `DRIVE_WORKER_URL` and `BACKUP_WORKER_URL` on Vercel; drive-hardening's
   live walk (P3's Google consent, Will's hand). The Advisor wants 38 soon: milestone 37's build re-grants a Pro credit
   past a day (TEST money).
4. **test-slim's two Questions**, built here with the full gate: `pool: "threads"` in `vitest.config.ts` and
   `@vitest/coverage-v8@4.1.7` with a `test:coverage` script (the calls lab's BH1 and BH2).
5. **The second wave**, from ROADMAP "Now" as owns free: accessibility after identity-r5-wiring (`--faint` at about
   3.6:1, the paper warning token at 1.85:1, `dashRange`'s spoken twin), the rest of the halo sweep (the guest's pages,
   the hub, `/admin`, pricing, Drive), uploads (Retry all re-queued once, the next burst on the last one's bytes,
   per-event byte sums in SQL), code hygiene, marketing.
6. **Compute:** lever 3 and 3b only on Will's X5; `pnpm compute:model` at every milestone.
7. **★ Vercel's Hobby Active CPU** (about 3.89 of 4 hours over 30 days on 2026-10-06; the peak rolls off in early
   November): nothing runs against the alias or partyreel.com but what Will asks for by name.
8. **Pacing:** the cloud credit (Will: $250, $17 spent by 06:00Z): full speed until he says it is spent; each lane's
   cost reads from its `get_session` usage.

## Waiting on Will

- **His desk:** brand r2's take; event-header r6 at the next refresh.
- **The SQL steps of tonight's two migrations** (billing-orphans', drive-crumbs'): their proofs, the applies and the
  types each need his approval of the Supabase connector's prompt, so they wait for his morning.
- **The calls lab** (`docs/calls.md`): the open questions X1, X2, X3, X5, X6 and X8, then each merge's calls, built and
  his to overrule. He asks direct questions in chat; answer in chat, never only in a file.
- **Milestone 38** on his yes, after crumbs-85, billing-orphans, drive-crumbs and red-team 56b.
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
- **His walks:** Settings' develop time on his iPhone (type a time, then Back or the picker's close: it holds;
  crumbs-72), the camera on his iPhone (a held-shutter video on a waiting sheet), Save into Photos, Record Video's
  size, a deletion and its Cancel deletion on hi@willgibs.com, the spend watch's uploads switch off and on; and
  trash-in-storage's permanent deletes, which no agent may press (on hi@willgibs.com: the size list's Delete for good
  on "RT51 free", Make room from Deleted back on and one upload past the line, Empty Deleted, a guest's own removal
  reading its purge that night); a Ladder A checkout with the test card on the alias.
