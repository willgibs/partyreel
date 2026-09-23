---
track: orchestrator
status: open
cut: "5b4c9ce5"          # the launch-prep SHA this state was written at
owns:                    # the standing claims no lane touches (a new board adds only its own lines to the two board lists)
  - src/app/(dev)/design/rules/bible.ts
  - src/app/(dev)/design/rules/bible.test.ts
  - src/app/globals.css
  - src/app/theme.css
  - src/app/(marketing)/marketing.css
  - src/lib/design-gate/
  - src/app/api/design-gate/
  - scripts/vercel-ignore-build.mjs
  - .github/workflows/ci.yml
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/(shell)/lab/boards.ts
reads:
  - CLAUDE.md
  - docs/PROGRAM.md
announces:
  - "lab-scene-kit merged at bff618d4 (2026-09-23): `Fit` and `Measured` live in `@/components/lab` (`scene.tsx`); `kit-discipline.test.ts` refuses a registered board that declares either. `event-safety` syncs past it and imports the two."
  - "The reshape (Will, 2026-09-22): the docs carry rules, never history. `docs/CHANGELOG.md` is gone (the merge commit carries a lane's summary), `usher/kit/cut-lane.py` cuts manifests from a spec, and four lanes run on disjoint files: `docs-rules` retires `docs/design/rulings.md` and the Library's rulings page, `systems-trim` trims `docs/systems/`, `roadmap-lean` rewrites `docs/ROADMAP.md` and `docs/ASSETS.md`, `pointer-sweep` rewrites code comments that point at the retired docs. None changes behavior."
---

# The Orchestrator's state

The pickup: read this first at every session start, compaction or restart, then `docs/STATUS.md`. It holds only what
is true now: what runs, what comes next, what waits on Will. How to cut, integrate, deploy and recover is the runbook,
[`usher/kit/README.md`](../../usher/kit/README.md). Rewritten in place, never a log. The Orchestrator is whichever
model Will seats (Fable or Opus); nothing here depends on which.

## In flight

| lane | what | state | model, port | at its handoff |
| --- | --- | --- | --- | --- |
| `delete-final` | a guest's own delete is final and says so ("deleted from the event right away and can't be recovered"); no host surface shows it; the host's Recently deleted figure counts only what the host can restore | building (agent a202582d56c89a266) | Opus, :3132 | apply `20260923160000_withdrawn_out_of_standby.sql` at the merge |

## Next, in order

The plan: `~/.claude/plans/great-work-however-1-dapper-twilight.md`, its top section (Will's message of 2026-09-23).
Done today: the four follow-on lanes (gates 134 to 137), alias build 3 red-teamed, milestone 27 (`546e2489`, the
partyreel.com pass green), the identity contract applied (Will's approval; the foot's check held; `types.ts`
regenerated), the Stripe TEST walk with Will's clicks (willg97 is now Pro 500 GB on a real TEST subscription
`sub_1UIxUp…`, customer `cus_Ubm3ANAZmqMfDB`), and `upload-owner` merged at `908cacf9` (gate 138).

**Will's standing approvals (2026-09-23):** pushes to `launch-prep` and anything around branching; the identity
contract (done); **milestone 28 "once you're fully ready"**; he tests by click whenever asked. His ruling on a guest's
own delete: final, gone for the host everywhere, the guest copy "deleted immediately from event and cannot be
recovered" (backups may keep their copy). His ask: no silent 1,000-row clipping anywhere ("Let's ensure we will not
face any of those issues here"); work inside this round is fixed near-term, larger work goes to the ROADMAP.

1. **`delete-final` hands off** (agent `a202582d56c89a266`): integrate; then apply
   `supabase/migrations/20260923160000_withdrawn_out_of_standby.sql` by the protocol: the drift md5 of the live
   `host_storage_summary` must read `69da923b75dc57e3b7720e2eb25e5af8` first; apply verbatim; after-md5 against the
   file's body; grants service-role only (anon and authenticated none); advisors still 15 / 5 / 32; its foot's
   rolled-back check; nothing persisted; no `types.ts` change (same signature). ★ `guest-flow.md`: `upload-owner`'s new
   invariant bullet ("UPLOADS ARE HELD TO THE SAME OWNER") sits directly under the guest-removal invariant that
   `delete-final` refines, so that doc may need a hand merge.
2. **The 1,000-row audit** (an Explore agent, `a9e94f7ba6bac6df4`, read-only; its report arrives as a notification):
   read it, then cut the fix lane or lanes (Opus) from it: one shared keyset helper under `src/lib/db/`, a policy test
   that refuses a new unbounded read, and every CRITICAL and HIGH site fixed; MEDIUM ones fixed or filed. Known sites
   before the report: `get_event_media_by_qr_token` and `getApprovedMediaForUnlock` read an album unpaged (past 1,000
   approved items the guest album holds only the newest 1,000); the purge cron's over-cap sweep and
   `sweepStandbyBudget`'s `removedHosts` read unpaged; `adminCoverUrls` one capped read; `.in()` id lists past about
   150 ids (QA #39). ★ The purge-cron lane also carries `delete-final`'s rule for the BIN BUDGET: a guest-withdrawn row
   (`removed_by_uploader`) never counts in the host's Recently deleted budget and purges on its own 30-day schedule.
3. **Alias build 4** once 1 and 2 are merged (`[preview]` on the record; `alias-ensure.mjs`; the prune), then the
   red-team in Will's Chrome (the chooser only; clear the alias's `pr_session_*` first if a test needs a fresh door):
   - `upload-owner`, on ONE browser: account A uploads to a names-mode event (`guest-view-menu QA`,
     `13513a6555214314b6eeac64232b541a`); A signs out (once through the guest page's account menu, once through the
     app's); B signs in and uploads: B's own row, B's address under it in the host's viewer and Guests room; B signs
     out; a signed-out upload meets the door with an empty name field; as B, restoring A's `pr_session_<qr>` then adding
     a photo shows presign 403 `session_other_account`, the re-join, presign 200, the photo as B; a signed-out presign
     with a confirmed row's ticket on a verified-emails event answers 403.
   - `delete-final`: the guest's own delete confirm reads "deleted from the event right away and can't be recovered";
     the item appears on no host surface; the host's "in Recently deleted" figure moves only for a host removal.
   - The 1,000-row lane: its own Look at first (large-album behaviour is pinned by tests; read-backs by SQL).
4. **Milestone 28** (approved): the full gate on `launch-prep` (`rm -rf .next/dev`; typecheck, lint, test, build,
   `lab:smoke`, `lab:demo`), `git checkout main && git merge --no-ff launch-prep` with the message in a file written by
   a QUOTED heredoc (`<<'EOF'`: an unquoted one ran a backticked word as a command in milestone 27's message), an
   annotated tag `milestone-28`, push `main` then the tag, both projects READY at the SHA
   (`scratchpad/wait-prod.mjs <sha>`), the partyreel.com pass (the dashboard, `/account`, a real upload, the demo, the
   lab 404, runtime errors, Sentry), `git checkout launch-prep && git merge --ff-only main`, push, STATUS and this
   pickup rewritten; the report to Will.
5. **The purge cron's first scheduled run on the new code** (04:00 UTC 2026-09-24, only production runs crons): read
   its heartbeat from the jobs console or `job_runs`.
6. **The reel round's wiring**, after his desk review of the six reel boards: the plan's reel section (A to G).

## Waiting on Will

- **His desk review** on the alias (`/design/lab?key=`, the value in `.env.local`): 26 boards, the six reel boards
  first, the harnesses `/design/lab/tools/reel-live` and `/design/lab/tools/reel-video`, and the new `event-safety`.
