---
track: orchestrator
status: open
cut: "958b6ee7"          # the launch-prep SHA this state was written at
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
announces:
  - "kit fix at launch-prep (2026-10-04): `integrate.sh` passes the lane's sha whole and `merge-lane.sh` compares heads whole (git's short form grew to 9 characters, so comparing short forms refused every lane); `negative.sh`'s check 2 reworded. A lane editing `usher/kit/` syncs before touching those three."
---

# The Orchestrator's state

The pickup: read this first at every session start, compaction or restart, then `docs/STATUS.md`. It holds only what
is true now: what runs, what comes next, what waits on Will. How to cut, integrate, deploy and recover is the runbook,
[`usher/kit/README.md`](../../usher/kit/README.md). Rewritten in place, never a log. The Orchestrator is whichever
model Will seats (Fable or Opus); nothing here depends on which.

## In flight

Round 15 (2026-10-04), on Will's desk answers on build 31b7c65 (transcribed at `7575ce528`) and his brand note. Milestone
35 is live; Ladder A, trash in storage and the reel's tap are merged on launch-prep for milestone 36. Six lanes with a
dev server at most; every production build takes turns through `scripts/build-lock.sh`.

| lane | what | state | model, port | agent |
| --- | --- | --- | --- | --- |
| `drive-export-r1` | board drive-export r1, desk 2 alone: Send to Google Drive, nine asks; the design safe to wire as designed (Q27) | MERGED at `c33e578d0` (gate 200 green: lab:demo 9 steps); on build 52 for his desk 2; the wiring lane after his pick | Opus, 3132 | `af71a05c6c8bafbf7` |
| `docs-prune` | Will's ask: the docs' dead weight cut (17 system docs 5,724 to 4,574 lines, 575 to 209 stars; ROADMAP's Now 332 to 181); take-home retired; the 26 policy tests classified for him | MERGED at `4578653a5` (gate 201 green); its ready files copied in at the record (the two deferred calls it cut re-added) | Opus, 3134 | `a2b0267d4162e3314` |
| `customize-r1` | board customize r1 (desk 15): the roll (film's 12/24/36 or 1 to 99), where options live, "use for new parties", the album's order; Linear's lessons and the audit in `_scratch/customize/` | HANDED OFF at `97a8d62b9`, parked for desk 3 (integrated with the foundation boards) | Opus, 3133 | `a1ba7927eb8a90754` |
| `camera-clip` | Will's yes: the camera's held clip to 30 s at about 5 Mbps; `create_media` restated from `ladder_a` with Q26's hardening | RUNNING (resumed after plan mode); its migration to the Advisor from its WIP push | Sonnet, 3131 | `a98733f142bf3116e` |
| `identity-r4` | board identity r4 (desk 10): Will's mix as seven trait asks (field, button, focus, selected, press, loading, toggles; his leanings recommended: keys and wells, never the viewfinder focus, a lighter selection), each drawn wearing the picks before it; the edge on nine real screens; A1 to A4 and H3 folded in; form, never hue | RUNNING (cut at `312af72fe`); three helpers, one fresh-eyes pass | Opus, 3132 | `a4152d141563a9a7d` |
| `event-header-r4` | board event-header r4 (desk 20): the three doors (glass with its badges, cards over the seam owning the phone, windows), each by its own helper; form and behaviour only (the waiting color is the brand's); G1, G2, G4 folded in | RUNNING (cut at `312af72fe`); three helpers, one fresh-eyes pass | Opus, 3134 | `a4eaf6f839b991e91` |
| `brand-r1` | board brand r1 (desk 5, a desk of its own): what the agency returned, three cohesive brand visions (positioning, wordmark and icon, a palette whose status set never reads as the brand, the aurora or another signature, the hashvatar as atmosphere, type, imagery, motion, the pages' dark or light philosophy), each on six touchpoints as sketches | RUNNING (cut at `312af72fe`); three agency-team helpers, a creative director's pass | Opus, 3135 | `aab7f784008cbcfeb` |
| `host-dashboard-r4` | board host-dashboard r4 (desk 25): the stage's corner explored again (read as the corner menu, drawn with the lit stage around it), two to four directions; H6 folded in | RUNNING (cut at `ea9737d2f`) | Opus, 3136 | `a2252d0ff7db3ba6f` |
| `dashboard-wiring` | Will's picks: events=menu (the Display popover, Recent, search from 9, her choices kept per the board's carried call) and stage=lit; owns `dashboard/actions.ts`; a migration only if `kept` needs a profile column | RUNNING (cut at `ea9737d2f`) | Sonnet, 3137 | `a5e85465d0cc30de7` |
| `redteam-52` | build 52's red-team (`e8d11584`): Ladder A on `/pricing` (every number, every hover line, the fair-use line, no "ingress"), the plan sheet as willg97 (now Pro 1 TB), the Free words, the reel's tap, regressions | RUNNING; brief `../partyreel-wt/_scratch/redteam-52/brief.md` | Opus, Will's Chrome | `a2e373dc2ce9e647b` |

**The Advisor** (Fable, read-only; the runbook's "Consult the Advisor"): agent `a2e44f7ad679754e8`, this session. Its
model of the pricing rules is `../partyreel-wt/_scratch/pricing/q15-advisor.md`. From another session, respawn it from
`usher/kit/advisor-prompt.txt`.

**Handoff across accounts** (Will's rule: watch the weekly from 96%, refresh this block often from 98%). The
Orchestrator session is `2ba90542-62d6-487c-8c79-3657619f9133` (hi@willgibs.com, seated 2026-10-01 18:08Z; its weekly
resets Tuesday 2026-10-06 21:00Z, willg97's Sunday 2026-10-04 13:00Z; Will hands off only when one maxes its weekly
limit). willg97's `157caa18` stays idle and `b01c012e` stays retired. From another session, respawn each running lane
per the runbook's "Resume a lane": kill by port any dev server left on 3131 to 3136 (and any orphaned headless Chrome),
then `spawn-prompt.txt` filled (same track, same port) plus a note naming its pushed commits, what remains, its
predecessor's transcript at
`~/.claude/projects/-Users-gibby-local-ai-partyreel/2ba90542-62d6-487c-8c79-3657619f9133/subagents/agent-<id>.jsonl`
(grep it, never read it whole), that a stale `.next/dev/lock` may be deleted and that MCP tool ids change with the
account. Connectors follow the account: Claude in Chrome (every red-team needs it), the Supabase MCP on
`ddafaemglzmuekbtjwzn`, the Vercel MCP on his personal team (deploys ride `$VERCEL_TOKEN`; only runtime logs need P3).

If the cut-off lands mid-integration: a local `launch-prep` ahead of `origin` holds a merge made after this note (push
it, then record it from its merge message and its lane's Handoff, `git show <merge>^2:docs/tracks/<track>.md`); a
staged, uncommitted merge is finished by `usher/kit/merge-lane.sh`'s own steps or reset with `git merge --abort`.
This session's scratchpad holds the specs (`specs-r15/`) and gate logs (the next gate is 202); nothing there is needed that these lines and the manifests do not carry. Everything a successor reads lives
in the repo or in `../partyreel-wt/_scratch/` (the calls lab, the red-team briefs and ledgers, the Drive research).

## Next, in order

Round 15, on Will's desk answers of 2026-10-04 06:00Z (build 31b7c65, transcribed at `7575ce528`) and his brand note.
The approved plan, whole, is `../partyreel-wt/_scratch/desk/round-15-plan.md` (self-reviewed, the Advisor's Q29 and
Q30 folded in): read it first. Its spine:

1. **Desk 2 is Drive alone.** drive-export r1 integrated, then build 52 `[preview]` (Ladder A, the reel's tap, the Drive
   board). After build 52 serves: move willg97's old TEST subscription onto Pro 1 TB monthly (`stripe_test.py` in the
   session scratchpad: TEST key only, livemode checked on every answer); red-team 52 (`/pricing`'s matrix and hover
   lines, the plan sheet, the pass card, the reel's tap); `lab:demo --board drive-export` on the alias at 1440 and 375,
   then tell Will desk 2 is ready.
2. **The boards now** (no system doc needed): identity-r4 (the mix as seven trait asks, the edge on nine real screens,
   A1-A4 and H3 folded in, form never hue), event-header-r4 (the three doors, each by its own helper; form only; G1, G2,
   G4), brand-r1 (three agency visions, desk 5, above everything its answer shapes); host-dashboard-r4 (the corner with
   its stage; H6) at the first free seat. Specs in the session's `specs-r15/`. Six dev-server lanes at most.
3. **docs-prune merges** (its ready files copied after reading each diff, re-adding every ROADMAP line recorded after
   its snapshot; the take-home ledger deleted in that record), which frees the 17 system docs for the wirings.
4. **The wirings**, as seats free: dashboard-wiring (events=menu, stage=lit; owns `dashboard/actions.ts`),
   hub-strip-wiring (facts=strip, Q5's Reel card; owns `event-feed/` and `host-app.md`), arrival-wiring (in-place),
   styles-wiring (styles, Review everywhere, the time under the Disposable card), graphite-wiring (room=graphite, the
   popover gutter; owns `src/components/ui/`), small-fixes (E6, Q2's spoken "to", the name-only guest's hashvatar:
   `seedFor(guests.id)`). Then red-team 53, and milestone 36 on Will's yes.
5. **Desk 3** (identity r4, customize r1, event-header r4, host-dashboard r4) after the desk pass; **desk 4** brand r1
   alone; **desk 5** the moments boards (host-moments: B1, Q6, B2, L3; guest-moments: C7, D3 with the flat 3, Q3, G6;
   account-moments: I4, I5; create-wizard r4: the styles' polish, F1, F2), cut after desk 3's identity and customize
   picks; **desk 6** the brand applied (brand-marks with the status set, aurora, marketing-themes with N4, N7, N9,
   demo-framing r6, presence r1), cut after brand r1's pick. The Drive wiring lane after his desk-2 pick, his Google
   Cloud step relayed then. camera-clip's migration to the Advisor from its WIP push.
6. **The close of the day:** STATUS, this pickup, the calls lab (text calls only now; 45 remain). Moltbook hourly only
   on his word.

## Waiting on Will

- **Desk 2, Drive alone** (nine asks), on build 52 once it serves:
  `https://partyreel-git-launch-prep-partyreel.vercel.app/design/lab?key=fiesta`.
- **The calls lab** (`../partyreel-wt/_scratch/calls/calls-lab.md`): text calls only now (45), whenever he likes; the
  visual ones are on boards. He asks direct questions in chat; answer in chat, never only in a file.
- **The 26 policy tests, GUARD or TASTE** (`../partyreel-wt/_scratch/docs-prune/policy-tests.md`): which taste rules he
  keeps as his voice and which go.
- **His walks:** the camera on his iPhone (a held-shutter video on a waiting sheet), Save into Photos, Record Video's
  size, a deletion and its Cancel deletion on hi@willgibs.com, the spend watch's uploads switch off and on; and
  trash-in-storage's permanent deletes, which no agent may press (on hi@willgibs.com: the size list's Delete for good
  on "RT51 free", Make room from Deleted back on and one upload past the line, Empty Deleted, a guest's own removal
  reading its purge that night); a Ladder A checkout with the test card on the alias.
