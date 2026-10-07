---
track: orchestrator
status: open
cut: "d4da2464"          # the launch-prep SHA this state was written at
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

Desk 8's wave runs (2026-10-07; at 23:20Z the week 85%, the 5-hour window 54% to 02:10Z, this context 82%). Merged,
recorded and pruned since its cut: account-moments-wiring-2 (gate 78), create-wizard-wiring-2 (79), guests-room-wiring
(80), brand-marks-wiring (81), crumbs-91 (82; its migration applied on the Advisor's Q45 as 20261007230050),
no-signal-wiring (83). Running, their rows below: the boards event-page-r1 and brand-marks-r2 (told to sync for the
lines brand-marks-wiring and crumbs-91 left in its folder), cdn-version and crumbs-92. No new lane until those close: the
week's last share goes to them and to milestone 40's red-team. Will's calls paste's first sections are routed; his
Deletion and Safety sections are still to come (the Calls place holds 12, five of them new from lanes: CH1, CI1, CI2,
CJ1). Both plan-limit tokens are minted and set. Milestone 40 forms on `launch-prep`: crumbs-88, crumbs-90, calls-desk
and every merge above. Milestone 39 (`0333cd705`) is live.

| lane | what | state | model, port | agent |
| --- | --- | --- | --- | --- |
| `event-page-r1` | board: the event page from the ground up, Will's idea 1 led (presence, signature, after-party retire into it) | running (cut d4da2464) | Opus, 3136 | `a1628c600f5768eb0` |
| `brand-marks-r2` | board: the icon made bespoke on the ember Ring | running (cut d4da2464) | Opus, 3137 | `a7bf754df7e565dbb` |
| `cdn-version` | X5: an open album's "has anything changed?" answer cached at the CDN; AB5's cadence livelier where free | running (cut 5ed23311) | Opus, 3131 | `aa27be79bf2dd9424` |

**The Advisor** (Fable, read-only; the runbook's "Consult the Advisor"): agent `af9f31cb46a4e98aa`, this session; Q40 to
Q45 answered (each APPLY, each applied); the next migration's read goes to it (from another session, respawn it).

**Seats.** A successor in another session respawns a lane from its transcript
(`~/.claude/projects/-Users-gibby-local-ai-partyreel/ce3ea37b-9032-4189-8a20-a57d78adb657/subagents/agent-<id>.jsonl`).
Gate numbers continue at 78 (`$S/gate77.log` seeds a new scratchpad). The session's context names hi@willgibs.com since
18:45Z; at the cut (19:40Z) weekly 59% (resetting 2026-10-13 21:00Z), the 5-hour window 8% (resetting 21:10Z), memory
81% free, this session's context 42%.

## Next, in order

1. **Integrate each running lane as it hands off** (`integrate.sh` detached with a waiter; a Handoff read from its
   Questions down). event-page-r1's record deletes the ledgers its folder retires (`presence.json`, `signature.json`,
   `after-party.json`) and `create-wizard.json`, which its manifest read; then the desk refreshes (`desk-refresh.sh`)
   and Will is told which board opens first (event-page, desk 4). cdn-version and crumbs-92 each may carry a migration
   (crumbs-92's `20261008060000_crumbs_92.sql`): the Advisor (`af9f31cb46a4e98aa`) first, then the protocol. Waiting to
   cut when the week allows: X1's develop time (the ROADMAP's Immediate Disposable line) with the two plan-limit
   readers (Upcoming, Billing), and Settings' board.
2. **Then, as seats free (six to eight agents, `get_usage` at every cut):** the event page's wiring once Will picks its
   direction (one lane builds the whole: faces, the offer, the keepsake, the light, the end line); fresh whole designs
   on the next surfaces in its language, by leverage: the dashboard home and its event cards, the door, her own page
   (`/me` and the public page, folding account-moments r3's teaser), Settings (only the optional and Create's changes,
   never steps: ROADMAP's "Settings' rail reads as steps" line).
3. **Milestone 40** once wave 1 merges (after it ships, the kit's screens refresh from partyreel.com by
   `usher/kit/kit-capture.mjs`: brand-marks-wiring changed the marks and tokens): red-team 58 on a desk refreshed to the tip (crumbs-88's emailed-link paths need
   a real email: his walk or the red-team's), the FULL gate, `pnpm compute:model --port <3131 to 3139>`, his yes.
4. **His desk** (:3000, `b0eb89bc9`) has no open ask but the three `?` until event-page-r1 and brand-marks-r2 land;
   refresh it with `desk-refresh.sh` once both merge, never while a red-team walks it, and tell him which board opens
   first (event-page, desk 4).
5. **The order to launch holds marketing back** (PROGRAM.md): the marketing foundation, site and visuals wait for the
   app to settle, then go from the ground up (sitemap first). Waiting there: page themes, demo-framing r6, marketing's
   light, N4, N7, N9, and the ROADMAP's marketing lines unless one breaks production.
6. **His list of 100+ items, when he sends it** (Will, 2026-10-06): each batch kept verbatim first, slotted into the
   ROADMAP's buckets and areas, a proposed order of rounds on top.
7. **The alias serves `bbfcc544`** (deployed once on his word); no other deploy until he asks.
8. **★ Vercel stays on Hobby** (Will, 2026-10-07): about 3.86 of 4 CPU-hours over 30 days (REFUSE), falling toward the
   REFUSE line around 2026-10-16. Nothing runs against the alias or partyreel.com but what Will asks for by name;
   `node usher/kit/vercel-usage.mjs` before any.
9. **Pacing** (Will, 2026-10-07): the 5-hour window paces the lanes, never a kill; nothing new started when the window
   would run out before its reset. ★ The week reads 72% at 21:15Z (59% at 19:40Z: about 9 points an hour with eight lanes), so Will (21:55Z): the weekly pace is no concern, only that the 5-hour window never kills a running lane, the machine holds its peak and the Orchestrator keeps its depth, so lanes sized to close before the limit run (two cut at 22:00Z), and token efficiency is the compounding win (the runbook's line); the seven running finish, and a lane the limit stops is respawned on the other account's seat from its transcript (Seats, above). Earlier: the week ran 58% on day one:
   keep this block handoff-ready for the other account's seat, and tell Will before it runs low. Who does the work: the
   runbook's "Working with Will".

## Waiting on Will

- **His Drive walk** on partyreel.com, now Drive is live (P3's consent; drive-crumbs' Handoff lists what to press),
  and the call AH1 (Drive on every plan, Free included) before Drive sees real use.
- **The calls lab** (the desk's Calls place, `/design/lab#calls`, over `docs/calls.json`): his first sections came at
  2026-10-07 20:40Z (`docs/reviews/batches/2026-10-07-b0eb89bc9-calls.txt`; every question and the plans and life calls,
  all routed and retired); 8 calls remain, his Deletion, retention and privacy section (I7, R2, J5, AH4, CG6) and Safety
  (J2, J3, M1). His paste's AY1=keep crossed his chat answer ("when she closes", which crumbs-91 builds): asked in chat
  which stands. He asks direct questions in chat; answer in chat, never only in a file.
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
