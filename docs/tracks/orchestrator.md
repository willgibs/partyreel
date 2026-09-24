---
track: orchestrator
status: open
cut: "1bab2537"          # the launch-prep SHA this state was written at
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
| `rowcap-sql` | every SQL shape the fixes need, in `20260924010000_row_cap_album.sql`, `..020000_row_cap_host.sql`, `..030000_row_cap_sweeps.sql`, backward compatible, each ending in a rolled-back check on the scale probe; `row-cap-sql.test.ts` | building (agent a82acf51bb5d1123f) | Opus, :3132 | apply the three files in order by the protocol; regenerate `types.ts`; then cut stage 2 |

## Next, in order

The plan: `~/.claude/plans/great-work-however-1-dapper-twilight.md`, its top section (the 1,000-row round, alias build
4 and milestone 28). Done today: the follow-on lanes (gates 134 to 139), milestone 27 (`546e2489`), the identity
contract and `20260923160000_withdrawn_out_of_standby.sql` applied, the Stripe TEST walk with Will's clicks (willg97 is
Pro 500 GB on `sub_1UIxUp…`, customer `cus_Ubm3ANAZmqMfDB`).

**Will's standing approvals (2026-09-23):** pushes to `launch-prep` and anything around branching; **milestone 28
"once you're fully ready"**; he tests by click whenever asked. His ruling on a guest's own delete: final, gone for the
host everywhere. His ask: no silent 1,000-row clipping anywhere ("Let's ensure we will not face any of those issues
here"); work inside this round is fixed near-term, larger work goes to the ROADMAP.

1. **The 1,000-row round.** The audit `$S/row-cap-audit.md`; every site re-verified with file:line and each lane's
   semantic items in `$S/rowcap-stage2-notes.md` (`$S` = this session's scratchpad).
   - **The scale probe** (disposable, on willg97): event "Scale probe" `14bb4318-80cd-4eed-b219-92c097ee16c7`, qr
     `d02631f1bfb3455188d224e41bf9510f`, 1,200 photos `p0001` (oldest) to `p1200` (host, Ana P., Ben K., Cal M. in turn),
     seeded through the real write path; by SQL the oldest 20 pending, the next 30 host-removed, five guest-owned
     withdrawn, the three oldest approved liked by willg97 and hi@willgibs (1,145 approved). **The live cap is 1,000**
     (an unbounded select answered `Content-Range: 0-999/*`); **write responses are not capped** (a PATCH over 1,040
     rows returned 1,040).
   - **Stage 1 in flight:** `rowcap-kit` and `rowcap-sql` (the In flight table). At the SQL merge: the three files in
     order by the protocol (a drift md5 of `get_event_media_by_qr_token`, `get_event_like_counts` and
     `list_guest_rows_by_email` against their newest files, apply verbatim, md5 and grants, `get_advisors` at 15 / 5 /
     32, the foot's check, nothing persisted, `types.ts` regenerated). At the kit merge: CLAUDE.md's ★ gotcha line.
   - **Stage 2 after both:** `rowcap-guest`, `rowcap-album`, `rowcap-host`, `rowcap-cron` (Opus, :3131 to :3134), owns
     from the kit's prefix map, items from the markers plus the notes file's semantic ones; each empties its markers. At
     the last stage-2 record the policy test's `TODO_IDS` empties.
2. **Alias build 4** after stage 2 (`[preview]` on the record; `alias-ensure.mjs`; the prune), then the red-team in
   Will's Chrome (the chooser only; clear the alias's `pr_session_*` first if a test needs a fresh door):
   - `upload-owner`, on ONE browser: account A uploads to a names-mode event (`guest-view-menu QA`,
     `13513a6555214314b6eeac64232b541a`); A signs out (once through the guest page's account menu, once through the
     app's); B signs in and uploads: B's own row, B's address under it in the host's viewer and Guests room; B signs
     out; a signed-out upload meets the door with an empty name field; as B, restoring A's `pr_session_<qr>` then adding
     a photo shows presign 403 `session_other_account`, the re-join, presign 200, the photo as B; a signed-out presign
     with a confirmed row's ticket on a verified-emails event answers 403.
   - `delete-final`: the guest's own delete confirm reads "deleted from the event right away and can't be recovered";
     the item appears on no host surface; the host's "in Recently deleted" figure moves only for a host removal.
   - The probe, as willg97: the hub's count, Review's 20 oldest, the Deleted bin's 30 (never the five withdrawn), the
     oldest photo reachable, the three old likes counted, Download all's summary whole (read from the response), the
     dashboard card's count and a cover on EVERY card, the pulse's today; as a guest: the header equals the approved
     total, the oldest photo reachable, the poll 200 then 304, the export's summary whole; as partyr33l: `/admin`
     metrics, the probe's moderation album whole, `/admin/jobs` showing the purge run's counts; no `db/row_cap_hit` in
     Sentry.
3. **Milestone 28** (approved): the full gate on `launch-prep` (`rm -rf .next/dev`; typecheck, lint, test, build,
   `lab:smoke`, `lab:demo`), `git checkout main && git merge --no-ff launch-prep` with the message in a file written by
   a QUOTED heredoc (`<<'EOF'`: an unquoted one ran a backticked word as a command in milestone 27's message), an
   annotated tag `milestone-28`, push `main` then the tag, both projects READY at the SHA
   (`scratchpad/wait-prod.mjs <sha>`), the partyreel.com pass (the dashboard, `/account`, a real upload, the demo, the
   probe album signed out, the lab 404, runtime errors, Sentry), `git checkout launch-prep && git merge --ff-only main`,
   push, STATUS and this pickup rewritten; the report to Will.
4. **The purge cron's 04:00 UTC run on 2026-09-24** (milestone 27's code; only production runs crons): read its
   heartbeat from `job_runs` after 04:05.
5. **The reel round's wiring**, after his desk review of the six reel boards: the plan's reel section (A to G).

## Waiting on Will

- **His desk review** on the alias (`/design/lab?key=`, the value in `.env.local`): 26 boards, the six reel boards
  first, the harnesses `/design/lab/tools/reel-live` and `/design/lab/tools/reel-video`, and the new `event-safety`.
