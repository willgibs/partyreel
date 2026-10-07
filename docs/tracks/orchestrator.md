---
track: orchestrator
status: open
cut: "7600c223"          # the launch-prep SHA this state was written at
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
(`docs/reviews/batches/2026-10-06-bbfcc54.txt`) and transcribed, his three program-wide notes folded into PRD.md.
Merged since, gates 56 to 66, each recorded and pruned, each one's calls his to overrule in `docs/calls.md` (BZ to CF):
the six wirings (`account-moments-wiring` `1fdeca5e0`, `create-wizard-wiring` `0617cac99`, `event-header-wiring-2`
`273a911ac`, `camera-wiring` `770efb29d`, `host-moments-wiring` `a78930d9c`, `album-moments-wiring` `3eace21ad`),
`storage-sums-signal` `a72c8a64a`, `crumbs-87` `a7991bc30`, and six boards for the next desk (`brand-marks-r1`
`3d2c9d1de`, `signature-r1` `556ad4dc1`, `account-moments-r2` `857376f49`, `create-wizard-r5` `7f228e58a`, gate 68,
`guests-room-r1` `89c6a94c7`, gate 69; its 12 portraits joined ASSETS.md's row 41; `presence-r1` `8b04c5afb`,
gate 70). Three migrations live by protocol
(`reshoots`, `let_in`, `storage_sums_signal`; the Advisor's Q40 to Q42), the types regenerated after them and the three
typed seams dropped (`7600c223e`). The gap audit (`app-gaps-r1`, done): its nine product decisions are the calls lab's
X9 to X17, its design gaps ROADMAP lab lines, its bugs closed by crumbs-87 (ledger
`../partyreel-wt/_scratch/app-gaps-r1/ledger.md`). **Red-team 57** (agent `a4ff00e0ff54750d0`, done 07:55Z) walked the
desk build `b1e219f26` whole: every walk PASS, no HIGH or MEDIUM; its LOW (the folded hub's Review pill, its 99+ badge
over the icon) and NIT (the hub cover's address link without the house ring) are Immediate lines; its own four events
and the lanes' seven test events are in Deleted; what no agent can drive is under His walks (ledger
`../partyreel-wt/_scratch/redteam-57/ledger.txt`).

| lane | what | state | model, port | agent |
| --- | --- | --- | --- | --- |
| `crumbs-88` | red-team 57's LOW and NIT, Create's retry key (a migration), Immediate's app lines, the docs crumbs-87 left stale | HANDED OFF at `8a0005679` (gates green on `f58fbb833`); its migration `event_create_key` APPLIED (20261007111050, md5 8a1e9e56 = the file's; the Advisor's Q43: APPLY; the column, index and insert-only grant as proved; advisors 27/4/36), the file reaching `launch-prep` with the merge; the merge waits until milestone 39 is on `main`, then `types.ts` regenerates and its seam retires (its Deferred line); its look-at-first's two emailed-link paths go to milestone 40's red-team | Sonnet, 3131 | `a6dae4d7c2d5e78f5` |
| `redteam-57b` | the second half of the walk before milestone 39, on the desk build `cd38cf21a` | DONE 11:50Z: one MEDIUM (crumbs-87's names-only restore misses after a load: 7 of 12; production's 38 never restores, so 39 improves but does not close it) to `crumbs-89`, with its two LOWs (Settings' rows after a load, dormant's 12 px tap band); its six NITs Immediate lines; its four RT57b events in Deleted; ledger `../partyreel-wt/_scratch/redteam-57b/ledger.txt` | Opus | `a81cf69c76e8039ff` |
| `crumbs-89` | milestone 39's last MEDIUM at its source, the door page's consequence line, Settings' rows after a load (a React canary bug, nudged), dormant's tap band | MERGED at `cab0dc0ac` (gate 72 green); migration `email_first_memory` APPLIED (20261007135056, md5 4836beb3 = the file's; the Advisor's Q44: APPLY, the nudge SHIP; hashes as the proof's; advisors 27/4/36); types regenerated with `create_key` and its `heldOf` seam dropped; its stale `host-app.md` lines wait for crumbs-88's merge (both edit that doc): "An email first" (the event remembers the hold, every path gives names only back, `email_restored`), "A setting with no effect right now" (a folded side is inert), and a gotcha (a revalidating save's commit can be parked by React; `settings-state-unpark.ts`); PREMISE: guests-room's asks name `invited-section.tsx`, touched only by the save's nudge, so they stand; pruned | Opus, 3131 | `a02926c18b226cb2f` |
| `after-party-r1` | board (desk place 12): the album after its party (over, recap, keepsake, card, bridge) | MERGED at `8e55608e6` (gate 73 green), for the desk after next with no-signal r1; its Deferred and board ideas placed, its lab line retired; pruned | Opus, 3135 | `a4c7c77694c1f980f` |
| `no-signal-r1` | board (desk place 14): a party with no signal: how far her unsent photos are carried, the drop, a Disposable's roll offline (Will's one-way door, drawn both ways) | MERGED at `fa28bf495` (gate 71 green), for the desk after next; its two album bugs Immediate lines; pruned | Opus, 3136 | `aece05f608a1f0346` |
| `crumbs-90` | the guest's send and album: Immediate's upload and album lines | HANDED OFF at `9a78cd146` (gates green on `6e8aee8ee`; no migration); merges after milestone 39 and crumbs-88; its test events in Deleted | Opus, 3132 | `a792a2c5719fc2ca0` |
| `redteam-57c` | the re-walk that closes milestone 39, on the desk build `bea40689d` | DONE 15:15Z: no MEDIUM or worse; every path 57b named restores (its strand path 5 of 5); two LOWs (two of her own pages undo her own step under a hold; a slow stream outlasts the save's nudge) and three NITs to the ROADMAP; its two RT57c events in Deleted; ledger `../partyreel-wt/_scratch/redteam-57c/ledger.txt` | Opus | `a93c1b646bf62a281` |
| `calls-desk` | the calls lab moved into the lab's desk (Will, 2026-10-07): `docs/calls.json`, a Calls place answered in a press, its answers in the desk's one message, `usher/kit/calls.py` the record's door (the test, the cap of 30) | RUNNING | Opus, 3133 | (spawning) |

**The Advisor** (Fable, read-only; the runbook's "Consult the Advisor"): agent `af9f31cb46a4e98aa`, this session; Q40 to
Q43 answered (each APPLY, each applied); the next migration's read goes to it.

**Seats.** A local `launch-prep` ahead of `origin` holds a merge made after this note: push it, then record it from its
merge message and its lane's Handoff (`git show <merge>^2:docs/tracks/<track>.md`). A successor in another session
respawns a lane from its transcript (`~/.claude/projects/-Users-gibby-local-ai-partyreel/ce3ea37b-9032-4189-8a20-a57d78adb657/subagents/agent-<id>.jsonl`)
on its worktree, the same port. Gate numbers continue at 67 (`$S/gate66.log` seeds a new scratchpad).

## Next, in order

1. **The next desk is whole** (brand-marks r1, signature r1, account-moments r2, create-wizard r5, guests-room r1,
   presence r1, all merged): his desk refreshed to the tip at 10:30Z for red-team 57b's walk, which serves his next
   sitting too; tell him it is ready when he is back (never refreshed while a red-team walks it).
2. **Milestone 39 on Will's yes** (one walk, both waves): red-teams 57, 57b and 57c walked it, nothing above LOW open;
   the FULL gate is green at `3ec66b8fe` (gate 74, 1,228 s, red steps 0) and the compute budget ran (every production
   scenario within budget). On his yes: Drive's Worker first (below), then the merge to `main` (`git merge --no-ff
   launch-prep`, the subject naming what 39 ships), the tag, production READY at the merge, a verification pass on
   partyreel.com, `launch-prep` fast-forwarded; then `crumbs-88` and `crumbs-90` merge.
   **Drive goes live with 39** (Will, 2026-10-07): just before 39's production deploy, from this Mac (`wrangler` is
   logged in as P3), `workers/drive`'s `npm ci`, its two queues (README), `DRIVE_APP_URL` partyreel.com, its secret from
   `.env.local` by stdin, `wrangler deploy`, then `DRIVE_WORKER_URL` on production; his Drive walk follows (P3's
   consent; drive-crumbs' Handoff lists what to press).
3. **Wave 2's open seats, paced by the 5-hour window** (six to eight agents, `get_usage` at every cut), each spec
   written in the session scratchpad's `specs/wave3/` (cut with `cut-lane.py`): `crumbs-88` RUNNING (In flight);
   `after-party-r1` and `no-signal-r1` RUNNING (In flight); next by leverage, the audit's other design gaps
   (turned-away demand, the host's picks, duplicates, video playback) once the desk after this one has room. The
   audit's nine decisions wait on Will (X9 to X17); a board draws a decision's surfaces once he picks its model. Lanes
   take ports 3131 to 3139 only (R2's CORS). The desk's old leftovers: drive-export's unclear `exit` and `naming`,
   reworded or retired.
4. **The order to launch holds marketing back** (PROGRAM.md): the marketing foundation, site and visuals wait for the
   app to settle, then go from the ground up (sitemap first). Waiting there: page themes, demo-framing r6 (his r5 note
   on `stage`, kept in its ledger, is that round's brief for the home's hero), marketing's light, N4, N7, N9, and the
   ROADMAP's marketing lines unless one breaks production. Crumbs lanes take app lines first.
5. **His list of 100+ items, when he sends it** (Will, 2026-10-06: after the desk batch, with a fresh context): each
   batch kept verbatim first, slotted into the ROADMAP's buckets and areas, a proposed order of rounds on top.
6. **The alias serves `bbfcc544`** (deployed once on his word); no other deploy until he asks. His local desk on :3000
   serves `b1e219f26` (red-team 57's walk).
7. **★ Vercel stays on Hobby** (Will, 2026-10-07; he offered his personal account for Partyreel, not needed: since the
   desks and red-teams moved to the Mac the team's calls fell from 20,000 to 57,000 a day to about 2,000, so at ~250 a
   day the window falls under the REFUSE line around 2026-10-16 and under WARN in early November, when 2026-09-29 to
   10-04 roll off; qrcdn is 1 to 14% of a day). Until then nothing runs against the alias or partyreel.com but what Will
   asks for by name; `node usher/kit/vercel-usage.mjs` before any.
8. **Pacing** (Will, 2026-10-07): the 5-hour window paces the lanes, never a kill: six to eight agents, `get_usage`
   read at every cut, and nothing new started when the window would run out before its reset, so the account rolls
   into about 99% at the reset and the session goes on in context. At 13:36Z the window read 34% (it resets 16:10Z)
   with three lanes; ★ weekly 52% only 16 hours into this account's week (it resets 2026-10-13 21:00Z), so at this
   pace it runs out around 2026-10-08 06:00Z: keep the handoff block current for the next account's seat, and tell
   Will. Who does the work: the runbook's "Working with Will" (a lane for focus; small in-context work the
   Orchestrator's own).

## Waiting on Will

- **Milestone 39's yes** (Next 2): everything merged; red-teams 57, 57b and 57c walked it, nothing above LOW open; the
  compute budget ran; the FULL gate re-runs at the tip before the merge to `main`.
- **The calls lab** (`docs/calls.md`, reshaped 2026-10-07 at his word: only what he cannot see by using the product):
  the open questions X1, X2, X3, X5, X6 and X9 to X17, then 16 built calls by theme; X8 settled by the Orchestrator.
  He asks direct questions in chat; answer in chat, never only in a file.
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
  1440, light and dark, above all the live reel's bar, the moderation tile and the upload stop keys on a photograph
  and the hub reel curtain's close; Tab through Account and Settings on paper at 375 and 1440, Save and Create under a
  throttled network (identity-r5-wiring); Settings' develop time on his iPhone (type a time, then Back or the picker's
  close: it holds; crumbs-72), the camera on his iPhone (a held-shutter video on a waiting sheet), Save into Photos,
  Record Video's size, a deletion and its Cancel deletion on hi@willgibs.com, the spend watch's uploads switch off and
  on; and trash-in-storage's permanent deletes, which no agent may press (on hi@willgibs.com: the size list's Delete
  for good on "RT51 free", Make room from Deleted back on and one upload past the line, Empty Deleted, a guest's own
  removal reading its purge that night); a Ladder A checkout with the test card on the alias; and what red-team 57
  could not drive: a guest waiting at a door that asks for a confirmed email (a second confirmed account: the code's
  corner counting her, a fresh Decline, the password's waiting line), and `/me` without a handle on hi@willgibs.com.
