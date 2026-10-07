---
track: orchestrator
status: open
cut: "4b1abf0b"          # the launch-prep SHA this state was written at
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

Round 15 goes on from a local seat on Will's Mac (session `ce3ea37b-9032-4189-8a20-a57d78adb657`, willg97@gmail.com,
from 2026-10-07 01:10Z), after the cloud seat's clean handoff. His desk batch on build `bbfcc54` is kept verbatim
(`docs/reviews/batches/2026-10-06-bbfcc54.txt`) and transcribed (24 answers; account-moments' `follow` unclear), his
three program-wide notes folded into PRD.md. Wave 1 of its round, cut at `2e094108` (manifests `156e30906`), eight
lanes, then two more on Will's +2 seats (2026-10-07; six to eight again as lanes close, paced by the 5-hour window). His order
to launch (PROGRAM.md, 2026-10-07) stopped `page-themes-r1` minutes in (the marketing foundation round's question; its
drawing kept at `../partyreel-wt/_scratch/page-themes-r1/`, its branch and manifest gone) and gave its seat to an audit
of the app's gaps:

| lane | what | state | model, port | agent |
| --- | --- | --- | --- | --- |
| `event-header-wiring-2` | event-header r6 wired: the Seam as corrected, shoulder badges, one "needs you" token (tally) for badges, pills and the code's corner; retires the board | RUNNING | Opus, 3131 | `a7804ee4f7918a72c` |
| `host-moments-wiring` | password's two groups at the field, Let in for a declined newcomer (migration `20261007020000_let_in.sql`), the banner's number and one key, the plan's line on the size list | RUNNING | Opus, 3132 | `a8058c7c922d55e9a` |
| `camera-wiring` | tell's consequence line, the fresh-roll panel, a flat 3 re-shoots (migration `20261007021000_reshoots.sql`, `create_media`'s ceiling), the reel's take-back | RUNNING | Opus, 3133 | `a23d9b0f7dc57c8d5` |
| `album-moments-wiring` | her photo glows as everyone's, the send's done toast (the Orchestrator's call), a batch settling whole, the reel opening on its still | RUNNING | Opus, 3134 | `ab30d4c8edd82e500` |
| `account-moments-wiring` | block's quiet well, Connections' rows staying turned back with names opening `GuestPeek`, `/me` private | MERGED at `1fdeca5e0` (gate 56 green); calls in the lab's BZ; account-moments r2 (follow, the invitation) next when a seat frees; pruned | Sonnet, 3135 | `a88d304f53085a3af` |
| `create-wizard-wiring` | the focused styles (Disposable's own screen), the one-line close, a failure held with everything kept | MERGED at `0617cac99` (gate 57 green); calls in the lab's CA; create-wizard r5 next when a seat frees; test events to delete through Settings: willg97's `ea9115da-60ab-48f4-9349-56a2653fa333` and `3e997ec3-913f-4b0c-86ab-e421289d5867`; pruned | Opus, 3136 | `ac3e135ee3680e27f` |
| `storage-sums-signal` | the Advisor's condition for 39: the nightly drift sweep, its /admin/jobs card and Rebuild, `remove_my_upload`'s arm (migration `20261007022000_storage_sums_signal.sql`) | RUNNING | Opus, 3137 | `a91b00d18e7060ca2` |
| `brand-marks-r1` | board, desk 6's first: the wordmark and icon final, the palette's tokens, the status set (tally given), in Aperture | RUNNING | Opus, 3138 | `a8c41c014cb4714e8` |
| `signature-r1` | board (desk place 8): where the Ring, Seam and Bloom live across the APP, at rest and answering (narrowed by message 2026-10-07: marketing's light waits for the marketing foundation round; the lane records it under its brief) | RUNNING (cut at `e6fa3cc8`) | Opus, 3139 | `a1b22d3b2ec761625` |
| `app-gaps-r1` | an experience audit, no manifest (a walk, as a red-team is): the whole app as hosts and guests across a party's arc, the gaps ranked by what they would reshape decided late, the top six to eight as board briefs, bugs in passing; ledger `../partyreel-wt/_scratch/app-gaps-r1/ledger.md`; its report becomes boards and ROADMAP lines | RUNNING (from `f4becf84`, a detached worktree) | Opus, 3140 | `a53af3259c7e25b2e` |

**The Advisor** (Fable, read-only; the runbook's "Consult the Advisor"): spawned from `usher/kit/advisor-prompt.txt` at
the first of this wave's three migrations; read `let_in` and `storage_sums_signal` together (`let_back_in` and
`remove_my_upload` share the lock order the sums' trigger set).

**Seats.** A local `launch-prep` ahead of `origin` holds a merge made after this note: push it, then record it from its
merge message and its lane's Handoff (`git show <merge>^2:docs/tracks/<track>.md`). A successor in another session
respawns a lane from its transcript (`~/.claude/projects/-Users-gibby-local-ai-partyreel/ce3ea37b-9032-4189-8a20-a57d78adb657/subagents/agent-<id>.jsonl`)
on its worktree, the same port. Gate numbers continue at 56 (`$S/gate55.log` seeds a new scratchpad).

## Next, in order

1. **Integrate wave 1** as each hands off, one at a time (the runbook), its migration through the Advisor and the
   protocol first; at each record: the board's ledger deleted when its picks are all built (event-header with its
   wiring; host-moments and guest-moments once both of each one's wirings merge, by `crumbs-87`), the calls his to
   overrule into `docs/calls.md`, Deferred lines by `record.py`.
2. **Wave 2, as seats free, by leverage** (specs drafted in the session scratchpad's `specs/wave2/`; a successor writes
   them again from this line): first the boards `app-gaps-r1`'s report ranks highest (the app is phase 1); presence r1
   (the guest row with the newest ringed in light, the hashvatar, the avatar-group hover, inside the guest rules); then
   each follow-up board once its wiring merges: **account-moments r2** (follow: a first follow saying once that only
   she sees whom she follows, beside a Following state that carries the privacy itself, polished; the invitation redrawn
   beautiful and inviting, never loud, on the wired `/me`), **create-wizard r5** (Create finishing the event as PRD's
   core loop now says: the close as the payoff, its "Get it ready" foot and the hub's checklist included; the styles'
   previews, one playing and the rest still, and wider ideas), **guests-room r1** (the Guests room's person rows and
   `GuestPeek`, polished: his let-back note); **crumbs-87** from Immediate (red-team 56b's LOWs and NITs first); the
   lab's triage tool (Keep, Later or Drop beside each `[unsure: …]` line, its answers a paste back). The desk's old
   leftovers: drive-export's unclear `exit` and `naming`, reworded or retired.
3. **Milestone 39 carries both waves** (Will, 2026-10-07: one walk): red-team 57 on the desk build (`desk-refresh.sh`)
   once `storage-sums-signal` and wave 1's six wirings merge. Its walks: halo-last's Tab walk (pricing's sheet,
   Account's Plan card, the Drive picker at 375 and 1440, light and dark, the working words on a throttled network);
   upload-sums' screen (willg97's sums equal the walk: 21 of 24 events listed, the heaviest `dc74eb95` at 302,608,403
   bytes in 111 items; an upload, a Remove and a Delete permanently move each by the file; `storage_sums_drift(null,
   1000)` stays empty); marketing-crumbs' look-at-first (/how-it-works step 03, the nav's Features pane,
   /features/curation, a weddings page's table card); crumbs-86's See it as a guest on a far party; and each wave 1
   Handoff's walk list. Findings to `crumbs-87`; the FULL gate; `pnpm compute:model` on the Mac; his yes.
   **Drive goes live with 39** (Will, 2026-10-07): just before 39's production deploy, from this Mac (`wrangler` is
   logged in as P3), `workers/drive`'s `npm ci`, its two queues (README), `DRIVE_APP_URL` partyreel.com, its secret from
   `.env.local` by stdin, `wrangler deploy`, then `DRIVE_WORKER_URL` on production; his Drive walk follows (P3's
   consent; drive-crumbs' Handoff lists what to press).
4. **The order to launch holds marketing back** (PROGRAM.md): the marketing foundation, site and visuals wait for the
   app to settle, then go from the ground up (sitemap first). Waiting there: page themes, demo-framing r6 (his r5 note
   on `stage`, kept in its ledger, is that round's brief for the home's hero), marketing's light, N4, N7, N9, and the
   ROADMAP's marketing lines unless one breaks production. Crumbs lanes take app lines first.
5. **His list of 100+ items, when he sends it** (Will, 2026-10-06: after the desk batch, with a fresh context): each
   batch kept verbatim first, slotted into the ROADMAP's buckets and areas, a proposed order of rounds on top.
6. **The alias serves `bbfcc544`** (deployed once on his word); no other deploy until he asks. His local desk on :3000
   still serves `2634388a8`: refresh it to the tip for his next sitting (never while a red-team walks it).
7. **★ Vercel stays on Hobby** (Will, 2026-10-07; he offered his personal account for Partyreel, not needed: since the
   desks and red-teams moved to the Mac the team's calls fell from 20,000 to 57,000 a day to about 2,000, so at ~250 a
   day the window falls under the REFUSE line around 2026-10-16 and under WARN in early November, when 2026-09-29 to
   10-04 roll off; qrcdn is 1 to 14% of a day). Until then nothing runs against the alias or partyreel.com but what Will
   asks for by name; `node usher/kit/vercel-usage.mjs` before any.
8. **Pacing** (Will, 2026-10-07): the 5-hour window paces the lanes, never a kill: six to eight agents, `get_usage`
   read at every cut, and nothing new started when the window would run out before its reset, so the account rolls
   into about 99% at the reset and the session goes on in context. At 03:16Z the window read 50% (it resets 06:10Z)
   after two hours of ten agents, so nothing is cut until the reset; weekly 14% (resets 2026-10-13 21:00Z). Who does
   the work: the runbook's "Working with Will" (a lane for focus; small in-context work the Orchestrator's own).

## Waiting on Will

- **The calls lab** (`docs/calls.md`): the open questions X1, X2, X3, X5, X6 and X8, then each merge's calls, built and
  his to overrule. He asks direct questions in chat; answer in chat, never only in a file.
- **Two backup copies to delete (privacy; a permanent delete is his hand), now urgent:** `partyreel-backup` redeployed
  its reconcile and restore at 01:43Z 2026-10-07 (version `892795dc`), so its daily run reads Needs a look and mails
  until they go: in the `partyreel-backup` R2 bucket,
  `events/38290e85-c23c-4d3a-bdbb-c6240e6b5074/photo/326b519d-b453-42a4-b24c-ade0ac7f7a07/original.jpg` and
  `events/38290e85-c23c-4d3a-bdbb-c6240e6b5074/photo/c4992e06-1423-4ed7-9ac0-81359b408f7c/original.jpg`: backed up
  2026-06-21, before the 2026-07-03 EXIF backfill stripped their primaries, so they still carry EXIF (GPS where the
  photo had it). Once deleted, the next reconcile copies the stripped originals (backup-reconcile's Q1).
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
