---
track: admin-triage
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "d909cb13"          # the launch-prep SHA the branch was cut from
board: admin-triage     # round one: the operator's act on a report, inside the admin board's shape
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/admin-triage/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/trust-safety-forensics.md
  - docs/systems/admin-observability.md
  - src/components/guest/report-dialog.tsx
  - src/app/api/reports/route.ts
  - src/lib/validation/report.ts
  - src/app/admin/reports/page.tsx
  - src/app/admin/reports/actions.ts
  - src/components/app/report-review.tsx
  - src/lib/db/queries/reports.ts
  - src/lib/moderation/operator-actions.ts
  - src/components/admin/moderation-grid.tsx
  - src/app/admin/albums/page.tsx
  - src/app/admin/albums/[eventId]/page.tsx
  - src/app/admin/support/page.tsx
  - src/components/admin/support-list.tsx
  - src/components/admin/applicants-list.tsx
  - src/components/admin/triage-filter.tsx
  - src/components/admin/triage-status-control.tsx
  - src/lib/constants/triage.ts
  - src/app/admin/accounts/[id]/page.tsx
  - src/app/admin/forensics/page.tsx
  - src/app/admin/forensics/forensics-controls.tsx
  - src/components/admin/operator-alerts.tsx
  - src/lib/admin/nav.ts
  - src/lib/constants/marketing-media.ts
  - src/app/(dev)/design/sandbox/admin/spec.ts
  - src/app/(dev)/design/sandbox/guest-shape/spec.ts
---

# lp/admin-triage

**Goal.** Round one of `admin-triage`: THE OPERATOR'S ACT ON A REPORT, from a guest's "Report this event" to the record
it leaves, reconceived from the ground up INSIDE the shape the `admin` board is asking Will about (use today's shell,
the state chip, the destructive chrome and the density as given; this board owns what happens after the home's "3 reports
are open" row is clicked). Will (2026-09-19, `docs/design/rulings.md`, "the overnight round"): explore every surface,
everything unprotected, "at worst, net neutral and fully deleted"; his standing ruling on the admin: an on-brand devtool.
Six to eight decisions with `defineExploration`, each drawn on presentational forks of the REAL admin pieces with fixtures
(a queue of reports open and resolved, with and without a picture and a reason; the same idiom's siblings in Support and
Applicants; one held-media and audit-log pair; one account row), at 1440 by 900 with 375 on a knob, a recommendation
each, every number measured; no preview imports a server action or the admin shell. **Not in this round:** any production
byte; the portal's home, nav, density, colour, destructive chrome, health and bar (`admin`, on the desk); the guest's
report dialog itself (`guest-shape`'s `dialogs`); the album seen from the guest's side.

**What is measured (the tree at the cut).** A guest reports through `ReportDialog` (anonymous, an optional reason of up
to 2,000 characters) to `/api/reports` (a per-IP-and-event limiter that fails open) and the `create_report` RPC, insert
only, never an automatic hide. The operator sees `/admin/reports`, filtered Open or All: one `Card` per report with the
event's name, a status badge (Open, Reviewed, Dismissed, Actioned), a timestamp, "item reported" or "album reported", a
presigned tile when a `media_id` exists, the reason or "No reason provided", and for an open one two buttons, Dismiss and
"Remove item & action" (the same `removalUpdate()` the Albums browser uses: `removed_by_admin`, a 7-day grace). A resolved
report is read-only with no undo here (the media can be restored only from `/admin/albums`, a second surface with a
second vocabulary). "Reviewed" exists in the enum and no code path writes it while the marketing copy promises "every
report is reviewed"; `resolution_note` exists since the founding migration and is never read or written; no id renders
on a card, so a legal hold means retyping a media id into forensics' free-text field; nobody is told an outcome (a host
learns when the photograph reappears, unrestorable, in Recently deleted with the same vague line a missing row gets, by
design). Support and Applicants share `TriageStatusControl` and `TriageFilter` (new, in progress, closed) and a `mailto:`
reply; Reports and Albums hand-roll their own filters and verbs; `ReportReviewList` and `ModerationGrid` import live
server actions at module scope while the one component built for reuse takes its action as a prop. Three status
vocabularies for one nav group ("Inboxes"). No counts beyond the list's length, no bulk, no phone layout. The pins:
`report.test.ts`, `triage.test.ts`, `operator-actions.test.ts`, `escalation-guards.test.ts`, `legal-hold.test.ts`, the
forensics migration guards, all function; nothing renders a card.

**The decisions (suggested; yours to recut, never forced apart).** FIRST LOOK (what the operator sees first on a report:
the event's name and a badge, as today; the picture, large, the reason beneath; the reason, the picture beside); NO
REASON (a report with nothing said: "No reason provided" in the same weight, as today; visually quieter, the picture
doing the talking; sorted last); THE VERDICT (two buttons, as today; a verdict with an optional reason kept in the unused
column; a verdict with a required reason, the note the record); ESCALATE (a hold means retyping an id, as today; a
"Hold for forensics" door pre-filled with the ids; the id shown, copyable); ONE IDIOM (four inboxes, three vocabularies, as
today; the shared triage control on every inbox; one inbox with a kind filter, Reports and Support and Applicants as
rows of one list); RESOLVED (the full card forever, as today; a compact read-only row; hidden under the filter with an
Undo for a day); THE PHONE (nothing today; a read-only queue with Escalate; the whole act at 375); THE NOTICE (silence
to everyone, as today and by doctrine; one plain line to the host; a line to the host and to the reporter). THE NOTICE
is a policy call: draw it, recommend keeping silence until Will rules, and say so under Questions. The dead "reviewed"
status, the unread note column and the live-action imports go under Deferred as ROADMAP lines.

**Binds.** The bible; the admin ruling (an on-brand devtool); the trust-and-safety doctrine (retention, the audit log,
what an operator may never do: state it, draw inside it); the `admin` board's decisions as the shell (fork its fixtures
and static panels, the way `sandbox/admin/destructive.tsx` forks the destructive panel; never mount the admin shell, the
MFA gate or a page behind `requireAdmin()`); the never-mutate rule (the two components that import live actions are
never mounted; the lightbox inside the moderation grid is lazy and portal-bound, drawn as a still); reduced motion
honoured; no em-dashes; the copy is open (bible 21). Pictures from `MARKETING_IMAGES`, as every board does. Mobbin is
encouraged, never required: moderation queues, report triage, admin inboxes, audit trails.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8
  known warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3134`,
  `pnpm lab:demo --board admin-triage` (0 failing), with `DESIGN_PREVIEW_KEY` in the environment, never on a command line.
- Every option at 1440 and 375 on presentational forks with fixtures, no server action from a preview; a capture of
  every option beside its words, the picture checked against the words; the reading budget.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board admin-triage` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The decisions, one line each: `<id>: the question; the options; the recommendation`
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
