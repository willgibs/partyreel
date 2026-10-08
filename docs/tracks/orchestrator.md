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

Desk 8's wave is in (2026-10-08 00:27Z; then the week 91%, the 5-hour window 75% to 02:10Z). Merged, recorded and
pruned since its cut, gates 78 to 87 green: account-moments-wiring-2, create-wizard-wiring-2, guests-room-wiring,
brand-marks-wiring, crumbs-91 (its migration applied on the Advisor's Q45 as 20261007230050), no-signal-wiring,
crumbs-92 (on Q46 as 20261007233007, advisors 29/4/36, the types regenerated), cdn-version (86: X5's CDN cache, about
30,000 to 9,600 calls at a lit 100-guest party; its call CL1), and the boards brand-marks-r2 (85: one ask, the icon) and
event-page-r1 (87: one ask, six whole designs, sky recommended; presence, signature and after-party retired into it, their
ledgers and create-wizard's deleted at its record). Red-team 58 walked the desk at `42ffd220d` (02:15Z to 03:55Z; ledger `../partyreel-wt/_scratch/redteam-58/ledger.txt`): one MEDIUM (a guest's cover deaf to the host's pause and reopen), three LOWs and three NITs, all fixed by crumbs-93 (gate 88, FULL: milestone 40's full gate at `fe46dbc6a`; its migration applied on the Advisor's Q47 as 20261008050912). Running, its row below: red-team 58b on crumbs-93's fixes, and the compute model. Milestone 40 forms on `launch-prep`: crumbs-88,
crumbs-90, calls-desk and every merge above. Milestone 39 (`0333cd705`) is live. Will's calls paste's first sections
are routed; his Deletion and Safety sections are still to come (the Calls place holds 16: his eight, and eight new from
lanes: CH1, CI1, CI2, CJ1, CK1 to CK3, CL1). Both plan-limit tokens are minted and set.

| lane | what | state | model, port | agent |
| --- | --- | --- | --- | --- |

**The Advisor** (Fable, read-only; the runbook's "Consult the Advisor"): agent `af9f31cb46a4e98aa`, this session; Q40 to
Q47 answered (each APPLY, each applied); the next migration's read goes to it (from another session, respawn it).

**Seats.** A successor in another session respawns a lane from its transcript
(`~/.claude/projects/-Users-gibby-local-ai-partyreel/ce3ea37b-9032-4189-8a20-a57d78adb657/subagents/agent-<id>.jsonl`).
Gate numbers continue at 89 (`$S/gate88.log` seeds a new scratchpad). The session's context names hi@willgibs.com since
18:45Z 2026-10-07.

## Next, in order

1. **Milestone 40:** red-team 58b on crumbs-93's fixes (brief `$S/redteam-58b-brief.txt`) and `pnpm compute:model --port
   3132` beside it; gate 88 is its FULL gate; then his yes. After it ships: the kit's screens refresh from partyreel.com
   (`usher/kit/kit-capture.mjs`: brand-marks-wiring changed the marks and tokens), and cdn-version's live check on his
   word (an open album's sync answers `x-vercel-cache` MISS, then HIT).
2. **His desk** (:3000) serves the event-page-r1 record: event-page r1 (desk 4) opens first, brand-marks r2's icon
   beside it; his batch is kept verbatim, then transcribed; never refreshed while a red-team walks it. Then, as seats
   free (six to eight agents, `get_usage` at every cut): the event page's wiring once he picks its direction (one lane
   builds the whole: faces, the offer, the keepsake, the light, the end line; event-page-r1's Handoff holds the wiring
   notes), and fresh whole designs on the next surfaces in its language, by leverage: the dashboard home and its event
   cards, the door, her own page (`/me` and the public page, folding account-moments r3's teaser), Settings (only the
   optional and Create's changes, never steps: ROADMAP's "Settings' rail reads as steps" line).
3. **Waiting to cut when the week allows:** X1's develop time (the ROADMAP's Immediate Disposable line) with the two
   plan-limit readers (Upcoming, Billing), and Settings' board.
4. **The order to launch holds marketing back** (PROGRAM.md): the marketing foundation, site and visuals wait for the
   app to settle, then go from the ground up (sitemap first). Waiting there: page themes, demo-framing r6, marketing's
   light, N4, N7, N9, and the ROADMAP's marketing lines unless one breaks production.
5. **His list of 100+ items, when he sends it** (Will, 2026-10-06): each batch kept verbatim first, slotted into the
   ROADMAP's buckets and areas, a proposed order of rounds on top.
6. **The alias serves `bbfcc544`** (deployed once on his word); no other deploy until he asks.
7. **★ Vercel stays on Hobby** (Will, 2026-10-07): about 3.86 of 4 CPU-hours over 30 days (REFUSE), falling toward the
   REFUSE line around 2026-10-16. Nothing runs against the alias or partyreel.com but what Will asks for by name;
   `node usher/kit/vercel-usage.mjs` before any.
8. **Pacing** (Will, 2026-10-07): the weekly pace is no concern; only that the 5-hour window never kills a running lane
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
