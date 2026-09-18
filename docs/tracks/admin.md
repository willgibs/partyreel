---
track: admin
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "0681652c"         # the launch-prep SHA the branch was cut from
board: admin            # round one: the admin portal's SHAPE, rethought from the ground up
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/admin/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/systems/admin-observability.md
  - src/lib/admin/nav.ts
  - src/components/admin/admin-shell.tsx
  - src/components/admin/admin-nav.tsx
  - src/components/admin/operator-alerts.tsx
  - src/components/admin/metrics-charts.tsx
  - src/components/admin/moderation-grid.tsx
  - src/components/admin/support-list.tsx
  - src/app/admin/page.tsx
  - src/app/admin/jobs/page.tsx
  - src/app/admin/jobs/catalog.ts
  - src/lib/brand/wordmark.ts
  - src/components/shared/logo.tsx
  - src/app/(dev)/design/sandbox/gallery-width/spec.ts
---

# lp/admin

**Goal.** Round one of `admin`: the admin portal rethought from the ground up, its SHAPE first. Will
(2026-09-18): "we've barely touched the admin portal since we threw up the first version... nothing is
unprotected and the full portal could likely be rethought from the ground up", and "plenty of thought
should go into this prior to diving straight in." Six to eight decisions with `defineExploration`, each
drawn on the real admin's components with FIXTURE data at 1440 (an operator is on a laptop or a desktop;
one step at 375 only if the shape you propose has a phone answer). Surfaces (the inboxes, the account
detail, the moderation feed, the jobs console) follow in later rounds from his picks. **Not in this
round:** any production byte, any real admin session or service-role read from the lab (fixtures only),
the deployment split (`admin-split`) and the jobs' backend truth (`admin-jobs`), both running beside you.

**Binds.** Will's ruling of 2026-09-18 (`docs/design/rulings.md`, the admin section): the admin carries
the platform's FOUNDATIONAL identity (the wordmark, the faces with their weights and spacing, the
achromatic base) and is otherwise free to be its own thing, "an on-brand devtool, not a separate brand
identity"; real colours are wanted for the admin (charts, state) and are yours to propose. Bible 19 (no
em-dashes) and 21 (copy is open) still bind; bible 1 and 2 bind the product, not the portal beyond that
foundation. The security seam is untouchable and out of frame: `requireAdmin`, the host guard and the MFA
level (`src/lib/auth/admin-context.ts`) stay exactly as they are, and a design never weakens them.
`docs/PROGRAM.md` "A round returns DECISIONS": options are never forced apart.

## What is measured (the tree at the cut)

- Sixteen routes under `src/app/admin/` behind one dropdown (`admin-nav.tsx`, twelve entries in four
  groups from `src/lib/admin/nav.ts`: Watching, Inboxes, Accounts and content, Operations); the home is a
  card grid badged with pending counts; every page is one `space-y-6` column of `Card`s; no tables, no
  density control, no saved views, no bulk actions; destructive actions are inline forms.
- The shell (`admin-shell.tsx`): a sticky header with `Logo`, an "Ops" chip, the dropdown, the
  `OperatorAlerts` bell, the email and sign-out; `main` in the product's `Container`.
- The jobs console (`jobs/page.tsx`, `catalog.ts`) is the newest and best piece: per-job health, last
  runs, kill switches, Run now, and a loud banner when the heartbeat cannot be read. Four jobs report;
  four do not (`admin-jobs` wires them while you draw).
- The charts are Recharts on the product's grey ramp (the cast is a `loose-ends` question; real colour is
  now on the table by the ruling above); the MFA enrolment prints its secret in a bare `code`.
- No component under `src/components/admin` has a contract test; nothing renders under test.

## The decisions (six to eight; every option drawn with the same fixtures, one recommended)

1. **The operator's home**: the card grid of surfaces (today) / a "what needs me now" console that ranks
   jobs, inbox items and alerts as one list / KPIs first with the queue beneath. Drawn with a realistic
   day's fixtures (two failed runs, nine open support items, three reports, one over-cap account).
2. **The navigation** for twelve-plus surfaces: the dropdown (today) / a persistent left rail in the four
   groups / a rail plus a command palette. Drawn on the same page, so the home's shape is judged with its
   nav.
3. **Density and the list**: cards in one column (today) / tables with columns, sort and bulk actions /
   a hybrid (tables in the inboxes and feeds, cards on the home). Drawn on the support inbox and the
   accounts list with the same rows.
4. **Colour for state**: achromatic with the product's action colours only (today) / a small semantic set
   (ok, warn, fail, info) on the Graphite base / real colour for charts as well, a ramp with hue. Drawn on
   the jobs console's health badges and the metrics charts.
5. **Destructive actions**: inline forms (today) / a confirm sheet with a typed confirmation / a two-step
   with a written audit line the operator sees afterwards. Drawn on the account deletion and a media
   removal.
6. **The health strip**: none, per page (today) / a portal-wide strip on every page (jobs, alerts, the
   kill switches' state) / the home only. Drawn on the same page as decision 1 wearing its answer.
7. (Optional.) **The chrome's identity**: how much of the product's header the portal keeps (the
   wordmark alone, the wordmark with an "Ops" mark, a devtool-style compact bar). Only if two answers are
   genuinely different in kind.

Stage a later decision `after` an earlier one where it depends on it (density after the home; the strip
after the home). Prefer more rounds of narrower questions to one wide one.

## The lab you are building for

The step is the page with a dock: every option mounted once at true size, flipped or side by side, a sticky
head naming what is shown and at what scale, the answer in a sticky dock. `pnpm lab:smoke` refuses a board
over 1,200 words; `pnpm lab:demo` fails a step that is CLIPPED, UNLABELLED, NO DOCK, frozen, or whose stage
starts lower than 0.6 of a screen. The worked example is `src/app/(dev)/design/sandbox/gallery-width/spec.ts`.
Render the admin's COMPONENTS with fixtures (`loose-ends` drew `MetricsCharts` that way); where a component
takes a real session or a server read, copy it into your directory and feed it fixtures; never call
`requireAdmin` or a service-role query from the lab. **Mobbin is made for this board**: internal tools, ops
consoles and admin dashboards are its strongest shelf; search it for how the best devtools shape a home, a
rail, a dense table and a destructive confirm, cite what you leaned on, and then design from the ground up.
Encouraged, never required (`docs/design/guidance.md`).

**Register your board under the exception** (the only lines you add outside your `owns`):
- `sandbox/registry.ts`: the import, and the member at the HEAD of `BOARDS`;
- `(shell)/lab/boards.ts`: the import, and the entry at the HEAD of `BOARD_COMPONENTS`;
- `touchpoints.ts`: the id at the HEAD of the `SandboxId` union, into `RulingId` directly after
  `"river-visual"`, and one RULINGS row at the END of `RULINGS` (copy the last row's shape, `board` block
  included; `surface: "admin"` if the union allows it, else the closest);
- `touchpoints.test.ts` takes NO line.
Never reorder or reformat the lists. `pnpm design:rules` regenerates the artifacts (allowed in the lane check).

## Verify, and the gate

The board at 1440 (and 375 where a step has a phone answer), reduced motion honoured. Dev server on port
3132, stopped by port (`lsof -ti tcp:3132 | xargs -I{} kill {}`), never an unscoped kill. The gate, each
step on its own exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`,
`pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3132`,
`pnpm lab:demo --board admin --base http://localhost:3132` (0 failing).

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree, each step's own exit code: design:rules, specimens, typecheck, lint, test (N), build (M pages), lab:smoke, lab:demo
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file + the registration lines + the generated files
- Each decision, one line: the options, the recommendation and why; what Mobbin gave you, if anything
- Captures (paths): every option at its true size beside its words
- Assets requested from Will: none
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
