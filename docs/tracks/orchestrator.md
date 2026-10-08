---
track: orchestrator
status: open
cut: "08303a65"          # the launch-prep SHA this state was written at
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

**Milestone 40 is live** (2026-10-08 07:40Z, `f1dfc6349`, tagged `milestone-40`; both projects READY; cdn-version's live
check on partyreel.com answered MISS, then HIT; the kit's screens retaken from partyreel.com). It holds desk 8's wave
(gates 78 to 87) and crumbs-93 (gate 88: red-team 58's MEDIUM, three LOWs and three NITs; its migration applied on the
Advisor's Q47 as 20261008050912); gate 89 is its FULL gate; red-teams 58 and 58b left nothing above NIT open; the
compute model held six scenarios, its two hour scenarios a harness clock artifact. At 07:45Z the week reads 95%
(resetting 2026-10-13 21:00Z) and the 5-hour window 0%: one small Sonnet lane runs on Immediate's six small lines; X1's
develop time (with the two plan-limit readers) and the next boards wait for the reset or the other account's seat.
Will's calls paste's first sections are routed; his Deletion and Safety sections are still to come (the Calls place
holds 16: his eight, and eight new from lanes: CH1, CI1, CI2, CJ1, CK1 to CK3, CL1). Both plan-limit tokens are minted
and set.

| lane | what | state | model, port | agent |
| --- | --- | --- | --- | --- |

**The Advisor** (Fable, read-only; the runbook's "Consult the Advisor"): agent `af9f31cb46a4e98aa`, this session; Q40 to
Q47 answered (each APPLY, each applied); the next migration's read goes to it (from another session, respawn it).

**Seats.** A successor in another session respawns a lane from its transcript
(`~/.claude/projects/-Users-gibby-local-ai-partyreel/ce3ea37b-9032-4189-8a20-a57d78adb657/subagents/agent-<id>.jsonl`).
Gate numbers continue at 89 (`$S/gate88.log` seeds a new scratchpad). The session's context names hi@willgibs.com since
18:45Z 2026-10-07.

## Next, in order

1. **His desk, desk 9** (:3000) serves `ae16365c3`, milestone 40's code: event-page r1 (desk 4) opens first, brand-marks r2's icon
   beside it; his batch is kept verbatim, then transcribed; never refreshed while a red-team walks it. Then, as seats
   free (six to eight agents, `get_usage` at every cut): the event page's wiring once he picks its direction (one lane
   builds the whole: faces, the offer, the keepsake, the light, the end line; event-page-r1's Handoff holds the wiring
   notes), and fresh whole designs on the next surfaces in its language, by leverage: the dashboard home and its event
   cards, the door, her own page (`/me` and the public page, folding account-moments r3's teaser), Settings (only the
   optional and Create's changes, never steps: ROADMAP's "Settings' rail reads as steps" line).
2. **Waiting to cut when the week allows:** X1's develop time (the ROADMAP's Immediate Disposable line) with the two
   plan-limit readers (Upcoming, Billing), and Settings' board.
3. **The order to launch holds marketing back** (PROGRAM.md): the marketing foundation, site and visuals wait for the
   app to settle, then go from the ground up (sitemap first). Waiting there: page themes, demo-framing r6, marketing's
   light, N4, N7, N9, and the ROADMAP's marketing lines unless one breaks production.
4. **His list of 100+ items, when he sends it** (Will, 2026-10-06): each batch kept verbatim first, slotted into the
   ROADMAP's buckets and areas, a proposed order of rounds on top.
5. **The alias serves `bbfcc544`** (deployed once on his word); no other deploy until he asks.
6. **★ Vercel stays on Hobby** (Will, 2026-10-07): about 3.86 of 4 CPU-hours over 30 days (REFUSE), falling toward the
   REFUSE line around 2026-10-16. Nothing runs against the alias or partyreel.com but what Will asks for by name;
   `node usher/kit/vercel-usage.mjs` before any.
7. **Pacing** (Will, 2026-10-07): the weekly pace is no concern; only that the 5-hour window never kills a running lane
   (nothing starts that would outrun its reset), the machine holds its peak and the Orchestrator keeps its depth. Lanes
   sized to close before the weekly limit run; token efficiency is the compounding win (the runbook's line: a lane near
   800K of context a turn draws the window several times faster than a fresh one). A lane the limit stops is respawned
   on the other account's seat from its transcript (Seats, above): keep this block handoff-ready for that seat, and tell
   Will before the week runs low. Who does the work: the runbook's "Working with Will".

## Waiting on Will

- **His Drive walk** on partyreel.com, now Drive is live (P3's consent; drive-crumbs' Handoff lists what to press),
  and the call AH1 (Drive on every plan, Free included) before Drive sees real use.
- **The calls lab** (the desk's Calls place, `/design/lab#calls`, over `docs/calls.json`): his first sections came at
  2026-10-07 20:40Z (`docs/reviews/batches/2026-10-07-b0eb89bc9-calls.txt`; every question and the plans and life calls,
  all routed and retired); 8 calls remain, his Deletion, retention and privacy section (I7, R2, J5, AH4, CG6) and Safety
  (J2, J3, M1); AY1 is settled (his keep meant the turn at her close, which crumbs-91 built). He asks direct questions in chat; answer in chat, never only in a file.
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
  corner counting her, a fresh Decline, the password's waiting line), and `/me` without a handle on hi@willgibs.com; and red-team 58's, each needing a second account: Make one like this from a shut door as a signed-in non-host, a second follow.
