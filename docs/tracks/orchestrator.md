---
track: orchestrator
status: open
cut: "5dd7ee60"          # the launch-prep SHA this state was written at
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

Nothing runs: no lane, no red-team, no background job (2026-10-07 18:50Z). Round 15 went on from a local seat on Will's
Mac (session `ce3ea37b-9032-4189-8a20-a57d78adb657`, from 2026-10-07 01:10Z) and shipped **milestone 39**
(`0333cd705`, tagged, live 16:15Z; its merge commit says what it holds; Drive's Worker deployed with it). **Milestone 40
forms on `launch-prep`:** `crumbs-88` (`7224261b3`, gate 75: red-team 57's LOW and NIT, Create's retry key, Immediate's
app lines), `crumbs-90` (`38e51ae9c`, gate 76 FULL: the guest's send and album), `calls-desk` (`ed704a2f8`, gate 77:
the calls lab at the desk's Calls place, `docs/calls.json`, `usher/kit/calls.py` its only writer). Their migration
`event_create_key` is live (Q43). Each lane's own summary is its merge commit; their ledgers and the red-teams' (57,
57b, 57c) are under `../partyreel-wt/_scratch/`.

| lane | what | state | model, port | agent |
| --- | --- | --- | --- | --- |

**The Advisor** (Fable, read-only; the runbook's "Consult the Advisor"): agent `af9f31cb46a4e98aa`, this session; Q40 to
Q44 answered (each APPLY, each applied); the next migration's read goes to it (from another session, respawn it).

**Seats.** A successor in another session respawns a lane from its transcript
(`~/.claude/projects/-Users-gibby-local-ai-partyreel/ce3ea37b-9032-4189-8a20-a57d78adb657/subagents/agent-<id>.jsonl`).
Gate numbers continue at 78 (`$S/gate77.log` seeds a new scratchpad). The session's context names hi@willgibs.com since
18:45Z; its usage reads the same week as before (weekly 58%, resetting 2026-10-13 21:00Z; the 5-hour window 5%,
resetting 21:10Z).

## Next, in order

1. **Will's review batch, the first thing after this compaction** (he asked for the compaction first, to plan with a
   fresh context): his desk serves `b0eb89bc9` (the next desk's six boards, the two gap boards behind them, and the
   Calls place). Keep the paste verbatim in `docs/reviews/batches/<date>-<build>.txt`, committed before a word of it is
   transcribed (the runbook's "Run a round"); `pnpm lab:review --dry` over it, then for real (the boards' lines into
   their ledgers; the `calls:` line printed as a routing list, nothing written: route each answer, then
   `python3 usher/kit/calls.py retire <ids>`); then plan the next round with him: the wirings of his picks first, and a
   pick that changes what a board's open ask describes re-read against production (`PREMISE` lines).
2. **Milestone 40** when it holds a round's worth (crumbs-88, crumbs-90 and calls-desk so far): a red-team of what
   merged since 39 on a desk refreshed to the tip, the FULL gate, `pnpm compute:model --port <3131 to 3139>`, his yes.
   crumbs-88's emailed-link paths (a told name to an album, a Create account link for an existing address) need a real
   email: his walk or the red-team's.
3. **Open seats, paced by the 5-hour window and the week** (six to eight agents, `get_usage` at every cut): a crumbs
   lane on Immediate (21 lines: red-team 57c's two LOWs and 57b's NITs first, crumbs-88's typed seam); the gap audit's
   other design gaps (turned-away demand, the host's picks, duplicates, video playback) once a desk has room. Lanes take
   ports 3131 to 3139 only (R2's CORS). Specs written so far live in the session scratchpad's `specs/` (`common.py`, the
   `make-*.py` generators).
4. **The order to launch holds marketing back** (PROGRAM.md): the marketing foundation, site and visuals wait for the
   app to settle, then go from the ground up (sitemap first). Waiting there: page themes, demo-framing r6 (his r5 note
   on `stage`, kept in its ledger, is that round's brief for the home's hero), marketing's light, N4, N7, N9, and the
   ROADMAP's marketing lines unless one breaks production. Crumbs lanes take app lines first.
5. **His list of 100+ items, when he sends it** (Will, 2026-10-06): each batch kept verbatim first, slotted into the
   ROADMAP's buckets and areas, a proposed order of rounds on top.
6. **The alias serves `bbfcc544`** (deployed once on his word); no other deploy until he asks. His local desk on :3000
   serves `b0eb89bc9` (refreshed 17:20Z), never refreshed while a red-team walks it.
7. **★ Vercel stays on Hobby** (Will, 2026-10-07): about 3.86 of 4 CPU-hours over 30 days (REFUSE), falling at about
   250 calls a day toward the REFUSE line around 2026-10-16 and WARN in early November. Nothing runs against the alias
   or partyreel.com but what Will asks for by name; `node usher/kit/vercel-usage.mjs` before any.
8. **Pacing** (Will, 2026-10-07): the 5-hour window paces the lanes, never a kill: six to eight agents, nothing new
   started when the window would run out before its reset, so the account rolls into about 99% at the reset. ★ The week
   ran fast (58% by 18:50Z on day one of seven): keep this block handoff-ready for another account's seat, and tell
   Will before it runs low. Who does the work: the runbook's "Working with Will".

## Waiting on Will

- **His Drive walk** on partyreel.com, now Drive is live (P3's consent; drive-crumbs' Handoff lists what to press),
  and the call AH1 (Drive on every plan, Free included) before Drive sees real use.
- **The calls lab** (the desk's Calls place, `/design/lab#calls`, over `docs/calls.json`): the open questions X1, X2,
  X3, X5, X6 and X9 to X17 and 16 built calls he cannot see by using the product; his answers ride the desk's paste.
  calls-desk's three calls, built and his to overrule (relayed in chat): an untouched call is never kept by silence
  ("Keep the other N" is one press); a fifth theme, "What Partyreel is", for the product-shape questions; an entry's
  words never change under its id. He asks direct questions in chat; answer in chat, never only in a file.
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
