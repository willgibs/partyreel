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

Round 14 (2026-10-04): milestone 35 is live at `20c1deb7` (tag `milestone-35`, gate 196 green FULL, the read-only walk
PASS: every page 200 with no console error, the lab 404, the headers, both crons registered, the admin domain at its
login); round 13 closed with it (its lanes' records are their merge commits). Will's answers of 02:50Z drive this
round: trash in storage at once, Ladder A's pricing, Send to Google Drive planned and reviewed with its UI in the lab
first. Up to four lanes while `memory_pressure` reads at least 50% free; every production build takes turns through
`scripts/build-lock.sh`.

| lane | what | state | model, port | agent |
| --- | --- | --- | --- | --- |
| `trash-in-storage` | Will's word (2026-10-03): Deleted counts in storage (the cap holds albums and Deleted together, deleting frees nothing until an item leaves Deleted for good), Make room from Deleted (on by default, his yes 02:50Z), the chart used and deleted apart; the standby budget and the re-delete guard retire | MERGED at `38f88e12` (gate 197 green FULL: lint, test 10,547, build, lab:smoke 176, lab:demo all); its migration APPLIED (`deleted_counts`, 20261004032249, the drift read clean on all eleven bodies, md5 75c77cff, advisors 19 / 4 / 36); types and its four seams at `958b6ee7`; build 51 (`31b7c652`) on the alias, red-team 51 walking it; worktree pruned | Opus, 3131 | `ae451b0bbdbee9503` |
| `drive-export-r1` | Send to Google Drive, round 1: the design note for the Advisor (`../partyreel-wt/_scratch/drive-export/design.md`: OAuth with `drive.file` only, the encrypted token store, the Worker and Queue streaming R2 to Drive, every failure path, the guards, `/admin`, live sync, Will's Google Cloud step), then the board `drive-export` at desk 20 | RUNNING (cut at `738c72d0`): the note pushed at `8d3f605e` with four Questions; the Advisor's Q25 (04:20Z, `../partyreel-wt/_scratch/drive-export/q25-advisor.md`): NOT YET, F1 to F4 blocking (the app alone proves an item safe before a delete, from size and MD5 against R2; identity by `drive_file_id`, never the folder; a lane's lifecycle and the poison lane; one snapshot RPC), relayed 04:25Z; the lane amends the note, then Q26 re-reads it while the board finishes | Opus, 3132 | `af71a05c6c8bafbf7` |
| `pricing-wiring` | Will's Ladder A everywhere a price or a limit is said or enforced (Free 100 MB; the pass $29, 25 GB, 50 GB of uploads over its year, renewal $19; Pro 50 GB / 200 GB / 1 TB at $9 / $29 / $99 with 100 / 200 / 500 GB of uploads a month), the published rows with hover lines and the fair-use line, `tiers.ts` and `tier_limits()` by migration, the help's "frees at once" lines; the Stripe TEST prices the Orchestrator's | RUNNING (cut at `9d7475e7`): its migration `20261004100000_ladder_a.sql` whole at `b6bcfe59d` (eight bodies, the drift clean, its proof red 0/10 then green 10/10); the Advisor's Q26 reading it (sent 04:35Z); the pages, copy and docs next | Opus, 3131 | `a2dfaff7d147088f0` |
| `crumbs-63` | Will's reel note (2026-10-04): a tap anywhere on the reel shows or hides its controls like the always-visible bar (idle rest and a pointer's movement unchanged), never the photo viewer | MERGED at `3267bf52a` (gate 198 green, light: test 10,562; the lane's on its head: typecheck, lint, test, build, lab:smoke 139, real Chrome at 1440 and 375 with touch, reduced motion and the screen); rides the next build; pruned | Sonnet, 3133 | `abce758c33eeab02c` |
| `redteam-51` | build 51's red-team (`31b7c652`): Deleted counted on the ring and the chart, a full Free plan both ways (Make room from Deleted on makes exactly the room; off refuses in words), Delete for good and Empty Deleted, a guest's withdrawal purging that night, regressions near the change; brief `../partyreel-wt/_scratch/redteam-51/brief.md` | RUNNING (spawned 03:59Z) | Opus, Will's Chrome | `a027c3916afc6d859` |
| `docs-prune` | Will's ask (2026-10-04): the dead weight that impedes global problem-solving and future-facing creativity, audited then cut in place (history, one-off fixes written as ★ landmines, design written as law, restatement, a ROADMAP "Now" of 327 lines); the take-home board retired; unused kit scripts; the 26 policy tests classified GUARD or TASTE for him; ROADMAP, PROGRAM, ASSETS and the tracks README as ready files in `_scratch/docs-prune/` for the Orchestrator to copy in | RUNNING (cut at `a62356f0`); its audit pushed first for a sanity check | Opus, 3134 | `a2b0267d4162e3314` |
| `customize-r1` | Will's ask (2026-10-04): hosts shape their party their way, "rocket ship control potential, but it all makes sense for a brand new user": Linear's lessons (`_scratch/customize/linear.md`), every arbitrary assumption ranked (`_scratch/customize/audit.md`, the roll of 24 first), and the board `customize` at desk 15 (the roll's control, the pattern for options and account defaults, the top preferences in it) | RUNNING (cut at `adf5db32a`) | Opus, 3133 | `a1ba7927eb8a90754` |

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
This session's scratchpad holds the specs (`specs-r14/`, pricing-wiring's ready to cut) and gate logs (the next gate
is 198); nothing there is needed that these lines and the manifests do not carry. Everything a successor reads lives
in the repo or in `../partyreel-wt/_scratch/` (the calls lab, the red-team briefs and ledgers, the Drive research).

## Next, in order

1. **Red-team 51** walks build 51 (`31b7c652`): read its report, fix any MEDIUM before the next milestone (a crumbs
   lane), file the rest.
2. **pricing-wiring** runs: send its migration to the Advisor from its WIP push; create the Stripe TEST prices its
   Handoff writes (after `list_available_accounts_or_orgs` reads livemode false) and the env by the REST API;
   integrate; a checkout walk is Will's.
3. **Drive export:** when the lane pushes its design note, send it to the Advisor (architecture: OAuth, the token
   store, the transfer, the guards, `/admin`), relay its findings to the lane, and integrate the board for his desk.
   The wiring lane is cut after his pick and the Advisor's clear; his one step (a Google Cloud OAuth client) is
   relayed then.
4. **The calls lab's UI board** (his word 2026-10-04 on section A: a question about how something looks is drawn,
   never asked in text): once his pass through the calls lab ends, one lab lane draws every UI call he sends there:
   A1 to A4; B1 (adding a password asks whether to keep everyone already in or send everyone back through the door,
   their photos staying, beside a standalone "send everyone back to the door"); B2 (a quiet Declined list at the foot
   of Guests, collapsed, each with Let in); C7 (a first photo's glow); D3 (a confirm on every shot removal, saying it
   frees a shot, and a different warning once her extra shots are spent; re-shoots a flat 3); Q6 with B1's pattern (a
   develop time added to a running camera asks the host: everyone starts a fresh roll of 24 plus 3 re-shoots, the
   default, or what each guest added counts; the confirm says which); and Q3, how a batch of others' photos lands at
   375 (one push, a stagger recommended, or one fade), drawn live. Its wiring follows his pick.
5. **The small-fixes batch** once his pass ends (one Sonnet lane for every production answer it leaves): E6, a cancel
   and a dropped connection told apart for downloads and uploads (a cancel asks first, then offers Try again; a network
   failure is never hidden and says what to do, so she neither retries in vain nor blames the app); Q2, a spoken "to"
   in date ranges for screen readers (the dash unchanged on screen); Q5, the host's Reel card ready to play before the
   develop (her scope, sealed shots included, saying guests get it at the develop) while the guest page, hers
   included, shows no reel until the develop (no screen link: a screen not hers casts from her own device). **crumbs-63** (the
   reel's tap) integrates on its handoff. **D4, his yes (2026-10-04):** a `camera-clip` lane (Sonnet)
   cut the moment pricing-wiring's migration is APPLIED, since both replace `create_media`: the clip at 30 s and about
   5 Mbps (about 19 MB), `CAMERA_VIDEO_SECONDS` and `create_media`'s `c_camera_video_seconds` and `_bytes` (scaled from
   128 MB) restated from pricing-wiring's body under a later prefix, the ring's 0:30. **Re-shoots a flat 3** (his word:
   `c_roll_retakes` as roll + 3, never three rolls' worth) ship with D3's confirm, so the "only a deletion" warning
   exists from its first day; the UI board draws them together.
6. **docs-prune** (Will's ask on dead weight): read its audit when it pushes (the cuts' kinds and examples) and
   say so if its judgment strays; at its merge copy in its ready files (`_scratch/docs-prune/*.new.md`: ROADMAP,
   PROGRAM, ASSETS, the tracks README) after reading each diff (re-adding any line recorded after its snapshot), delete `docs/reviews/take-home.json`, apply its
   proposals for the docs running lanes own once they merge, and put its GUARD/TASTE list of the policy tests to Will.
   The old scratch (red-teams 10 to 45, merged lanes' captures) went to `~/.Trash/partyreel-scratch-2026-10-04`.
7. **The close of the day:** STATUS, this pickup, the calls lab (`../partyreel-wt/_scratch/calls/calls-lab.md`: new
   calls in its form, a section per batch, UI calls to the lab). Moltbook hourly only on his word.

## Waiting on Will

- **His desk** on the alias (six boards: identity r3, host-dashboard r3, the-wait r2, event-header r3, create-wizard
  r3, demo-framing r5; drive-export joins at desk 20 when it lands):
  `https://partyreel-git-launch-prep-partyreel.vercel.app/design/lab?key=fiesta`.
- **The calls lab** (`../partyreel-wt/_scratch/calls/calls-lab.md`), his pass under way: Q2 to Q6 open, sections F
  to P and R left (A to E answered and routed into the steps above and ROADMAP). It holds only what still needs him:
  an answer leaves it the moment it is routed, and it keeps no settled list or index (his word, 2026-10-04). Answer
  his direct questions in chat, never only in a file.
- **His walks:** the camera on his iPhone (a held-shutter video on a waiting sheet), Save into Photos, Record Video's
  size, a deletion and its Cancel deletion on hi@willgibs.com, the spend watch's uploads switch off and on.
