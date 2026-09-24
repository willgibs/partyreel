---
track: orchestrator
status: open
cut: "b3172040"          # the launch-prep SHA this state was written at
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

## Next, in order

The plan: `~/.claude/plans/great-work-however-1-dapper-twilight.md`, its top section (the 1,000-row round, alias build
4 and milestone 28). Done today: the follow-on lanes (gates 134 to 139), milestone 27 (`546e2489`), the identity
contract and `20260923160000_withdrawn_out_of_standby.sql` applied, the Stripe TEST walk with Will's clicks (willg97 is
Pro 500 GB on `sub_1UIxUp…`, customer `cus_Ubm3ANAZmqMfDB`).

**Will's standing approvals (2026-09-23):** pushes to `launch-prep` and anything around branching; **milestone 28
"once you're fully ready"**; he tests by click whenever asked. His ruling on a guest's own delete: final, gone for the
host everywhere. His ask: no silent 1,000-row clipping anywhere ("Let's ensure we will not face any of those issues
here"); work inside this round is fixed near-term, larger work goes to the ROADMAP.

1. **Done: the 1,000-row round.** Stage 1 (`rowcap-kit` `060ece99`, `rowcap-sql` `b77d7879`, the three row-cap files
   applied, types regenerated) and stage 2 (`rowcap-guest` `04ef2e02`, `rowcap-host` `b95e5028`, `rowcap-cron`
   `745d77b5`, `rowcap-album` `76ce4492`; gates 142 to 145) are merged. No `row-cap-todo` marker is left, `TODO_IDS` is
   empty (a new todo fails), ten permanent `// row-cap:` whys stand, and `partyreel/no-swallowed-db-error` now reads
   array destructures. The live cap is 1,000 and write responses are not capped (both measured on the probe).
   - **The scale probe** (disposable, on willg97): event "Scale probe" `14bb4318-80cd-4eed-b219-92c097ee16c7`, qr
     `d02631f1bfb3455188d224e41bf9510f`, 1,200 photos `p0001` (oldest) to `p1200`; p0001-p0020 pending, p0021-p0050
     host-removed, five guest-owned withdrawn among p0051-p0056, the three oldest approved liked by willg97 and
     hi@willgibs (1,145 approved; the oldest approved is p0053). ★ Prod's orphan sub-sweep fails closed from
     2026-09-25 04:00 UTC (the probe's objects past 24 h meet the unchunked `.in()`) until milestone 28 ships.
2. **Done: alias build 4** (`6e67494b`) red-teamed 2026-09-24 in Will's Chrome (the probe whole for the host and a
   guest, upload-owner's tickets, delete-final's copy and host invisibility; results in STATUS). The Scale probe's Review
   was turned ON for the queue check (left on). Open: the admin portal's live look (`/admin`, `/admin/metrics`,
   `/admin/jobs`, `/admin/albums/<probe>`) needs Will's TOTP; the lanes pinned those pages in tests and the snapshot's
   figures equal a SQL hand count.
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
