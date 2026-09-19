---
track: admin-triage
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- **Who is told an outcome?** (`notice`, drawn as a decision, and a policy call before it is a design.)
  Recommendation, carried on: **silence, as today and by doctrine**. A notice that fires on an ordinary
  takedown and stays quiet on a held one is itself a way to learn a hold exists, which is what the
  `media_guard_privileged_transitions` trigger and the vague `invalid_media` copy exist to prevent; and a
  reporter is anonymous by construction (`create_report` stores no identity), so telling them anything
  means asking for an address the dialog deliberately does not ask for. Drawn all three ways so the cost
  of each is visible; the board recommends keeping silence until Will rules.
- **Does a required verdict note apply to a dismissal too?** (`verdict`.) Recommendation, carried on and
  drawn: **yes, both verbs**. The marketing site, the Terms and the privacy policy all promise "every
  report is reviewed before anything comes down", and a dismissal is the half of that promise with no
  evidence at all today. If it reads as a tax on obvious griefing, the optional note is one option down.
- **Is a day the right undo window?** (`closed`.) Recommendation, carried on: **24 hours**, which is well
  inside the 7-day grace the removal already sits in, and a held item has no Undo at all by law.
- **Can an operator remove from a phone without writing the record?** (`phone`.) Recommendation, carried
  on and drawn: **yes, and the report stays open until the record is written at a desk.** It is the one
  place the board lets an act and its record come apart, because the harm cannot wait and a courtroom
  sentence should not be typed with a thumb.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none. Nothing outside the board's own directory and the three registration lists was touched.

## Deferred (ROADMAP one-liners, bucket named)

- **Admin portal:** the `reviewed` value of the `report_status` enum is written by no code path, while the
  Terms, the privacy policy, `features.ts` and `events.ts` all promise "every report is reviewed": either
  a verdict writes it or it leaves the enum.
- **Admin portal:** `reports.resolution_note` has existed since the founding migration
  (`20260529102500_phase3_moderation_lifecycle_safety.sql`) and is never read or written; the `verdict`
  decision is what would finally fill it.
- **Admin portal:** `ReportReviewList` and `ModerationGrid` import live server actions at module scope, so
  neither can be mounted anywhere but its own page; `TriageStatusControl` takes its action as a prop and
  is the shape the other two should take.
- **Admin portal:** `/admin/reports` shows no count anywhere (the Open/All tabs are bare), no bulk act and
  no phone layout; the rail's own count comes from a separate `countOpenReports()`.
- **Design system:** a responsive Tailwind variant does not reach a lab board's frame (`sm:w-[200px]` and
  `hidden lg:inline` both rendered unapplied inside a 1440 frame while plain arbitrary values were fine).
  A board that needs a breakpoint writes a media query in its own sheet; worth a root cause before the
  wiring round promotes anything from a board that used one.

## Handoff (replaces the chat report)

- Head `e83aed43`, pushed. Code commits: `0240235f` (the board) and `84948bea` (the row's sheet fix).
  Synced with `launch-prep` twice: at `ba30b46c` and again at `0bd12595`, both merges keeping both sides'
  registration lines, the second splicing `],` `},` `},` `{` back between the two RULINGS rows added at
  the same anchor.
- Gates on the synced tree, each on its own exit code: `pnpm design:rules` ok · the specimen collector ok
  (123 components, 18 policies) · `pnpm typecheck` ok · `pnpm lint` ok (the 8 known warnings) ·
  `pnpm test` ok (2,541) · `pnpm build` ok (254 static pages, 125 routes) ·
  `pnpm lab:smoke --base http://localhost:3134` ok (412 checks, 0 failing; the board reads 640 words of
  1,200) · `pnpm lab:demo --board admin-triage` ok (8 steps, 0 failing; every step draws its options).
- Lane check, pasted: `git diff --name-only origin/launch-prep...HEAD` =
  `docs/design/library.md` (generated by `pnpm design:rules`, committed as written) ·
  `src/app/(dev)/design/(shell)/lab/boards.ts` · `src/app/(dev)/design/sandbox/registry.ts` ·
  `src/app/(dev)/design/touchpoints.ts` (the three registration exceptions, one line each plus the
  RULINGS row after `river-visual`'s) · the nine files of
  `src/app/(dev)/design/sandbox/admin-triage/`. No other path.
- The decisions, one line each:
  - `look`: what a report looks like when the queue is opened; the event's name and a badge as today, the
    picture full width, or the picture beside the reason a row each. **The row** (the frame goes from a
    measured 160 px to 200 px and one report from 341 px to 272 px).
  - `reason` (after `look`): what a report with no reason at all does; "No reason provided" as today,
    nothing drawn, or ranked under every report with words. **Nothing drawn.**
  - `verdict`: what pressing a verdict costs and records; two buttons as today, a verdict with an optional
    note, or a verdict whose note IS the record. **The required line**, written into the column that has
    been empty since the founding migration.
  - `closed` (after `verdict`): what a closed report leaves; the same full card forever as today, one line
    each, or a line with a day's way back. **The line with the Undo** (three answered reports fall from a
    measured 844 px to 158 px, and the held one has no Undo).
  - `escalate` (after `look`): how a legal hold is reached; the ids live elsewhere as today, the ids on the
    card copyable, or a Hold for forensics door pre-filled. **The door**, listing what the hold touches.
  - `phone` (after `look`): what a phone is trusted with; nothing as today (the rail takes 62 percent of a
    375 screen and the reports 13), see it and stop it, or the whole act. **See it and stop it.**
  - `idiom`: whether four inboxes speak one language; three vocabularies as today (measured: 3 filter bars
    and 2 shapes of control), one control taking each surface's words, or one inbox filtered by kind.
    **One control, each surface's own words.**
  - `notice`: whether anyone outside the portal is told; silence as today and by doctrine, one line to the
    host, or a line to the host and the reporter. **Silence**, until Will rules (see Questions).
- Mobbin citations (inspiration, none required): Reddit's mod queue (a row per item with the report reason
  as a chip and a horizontal verb bar) informed `look`'s row; X's moderation log (each hidden post with the
  rule it broke and an Unhide) informed `closed`'s Undo; Aboard's anonymous report detail (a message field
  to an anonymous reporter, plus team notes) informed `notice` and `verdict`; Circle's moderation tabs
  (Inbox / Approved / Rejected with counts) informed `idiom`.
- Captures: all 24 options at 1440 by 900 and again at 375 by 812, with the capture script, at
  `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/924675e3-0148-4e81-9dca-d9c2f1952d0a/scratchpad/admin-triage/`
  (`shots/`, `capture.mjs`, `cap-1440.log`, `cap-375.log`). Reading each picture against its own words
  caught six defects that the gate could not see: a FROZEN `closed` step whose three options were the same
  screen (the All view now opens where the history is), an accent edge that silently replaced the Card's
  ring on every card, an id strip showing the first report's UUID on every row, a rail highlighting
  Forensics on a page headed Reports, a status chip landing on top of the first word at 375, and a phone
  option that said "3 open" over two reports.
- Assets requested from Will: none. Every picture is a `MARKETING_IMAGES` still, and a reported frame is
  a stand-in whose SIZE and PLACE are what is being judged, never its content.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: `escalate`, because it is the one decision with a legal duty on the other end of it and
  the only one where today's answer is "retype 36 characters on a third surface at midnight"; then
  `notice`, which is the ruling rather than the design.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-19). Round one of `admin-triage` put the operator's act on
a report on the desk as eight decisions, drawn on presentational forks of the real admin pieces with one
Saturday night's fixtures, inside the shape the `admin` board is asking about. Two roots stage it: what a
report IS on screen unlocks the wordless one, the legal-hold door and the phone; what a verdict COSTS
unlocks what a closed one leaves. Every option is a real 1440 by 900 viewport with 375 on a knob, captioned
off the laid-out document, and reading each picture against its own words caught six defects the gate could
not see. Nothing reached a server action, the admin shell or a page behind `requireAdmin()`. The dead
`reviewed` status, the never-written `resolution_note` and a Tailwind variant that does not reach a frame
went to Deferred.
