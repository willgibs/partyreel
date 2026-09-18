---
track: admin
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- **The chart ramp's cast is asked twice, by two boards, on two different premises.** `loose-ends`
  decisions 1 and 2 ask which five colours `--chart-N` takes, with four near-achromatic casts, and
  they were cut BEFORE the ruling that says the admin wants real colour. Rather than compete for one
  answer, this board's colour decision is scoped to STATE and says so in its context.
  **Recommended:** let `loose-ends` rule the PRODUCT's ramp as asked, and give the admin its own
  ramp in the wiring round under the portal's own scope, so a marketing chart and an ops chart never
  have to share five colours. Carried on that basis.
- **`Surface` in `touchpoints.ts` has no "admin" member,** so the board's RULINGS row sits under
  `shared`, which is the closest the union offers. **Recommended:** the Orchestrator widens the union
  to `"admin"` with its `SURFACE_LABEL` row, one line each, now that the portal is its own
  deployment. Carried as `shared`.
- **Nothing is drawn at 375, and nothing is asked about light against dark.** An operator is on a
  laptop, and the shape of a home or a rail is the same shape on either ground. **Recommended:** keep
  both out of round one; the phone is a question for the round that knows what the shape is, and the
  two grounds are checked in the wiring. Carried.
- **The palette is drawn open on its own step only.** It is the nav's recommended answer, so it is
  also that control's default, and every other decision's tile came back with a palette over the
  page. **Recommended:** if the palette wins, it ships closed behind a key, which is what the other
  tiles now show. Carried.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none

## Deferred (ROADMAP one-liners, bucket named)

- Admin: the portal at a phone, for an operator glancing at health away from a desk (bucket: admin portal).
- Admin: an operator audit log, what was done and by whom, with an Undo where one exists; only if the
  arm-in-place grammar wins decision 5 (bucket: admin portal).

## Handoff (replaces the chat report)

- The work landed at `ca3a7f31` and this manifest commit is the head, pushed; synced with `launch-prep` at `9e2a573b` (it had moved: the `image-trail`
  and `cursor-backdrop` lanes were cut). Merged, never rebased; no conflict, the two lanes touched
  docs only.
- Gates on the synced tree, each step its own exit code: `design:rules` 0 · specimens 0 (120 on 90
  entries) · `typecheck` 0 · `lint` 0 (0 errors, the 8 known warnings) · `test` **1 FAILING, and it
  is not this lane's** (below) · `build` 0 (254 pages) · `lab:smoke` 0 (271 checks, the board reads
  493 words of a 1,200 budget) · `lab:demo --board admin` 0 (7 steps, 0 failing, every step draws
  its options; the stage moves 13 to 90 percent between options).
- ★ **`pnpm test` is RED ON `launch-prep` ITSELF, from the cut commit.**
  `src/lib/env-example-parity.test.ts` fails because `NEXT_PUBLIC_SURFACE` is declared in
  `src/lib/env.ts` (40a26a55, "the surface flag in env.ts") and never added to `.env.example`.
  Neither file is in this lane and neither was touched here, so every lane cut from this base has a
  red gate until one line lands in `.env.example`. Everything else passes.
- Lane check, `git diff --name-only origin/launch-prep...HEAD`:
  `docs/design/library.md` (generated) · `src/app/(dev)/design/(shell)/lab/boards.ts` (registration) ·
  `src/app/(dev)/design/sandbox/admin/{admin.css,board.tsx,chrome.tsx,destructive.tsx,fixtures.ts,home.tsx,jobs.tsx,lists.tsx,spec.ts,state-ui.tsx}` (owned) ·
  `src/app/(dev)/design/sandbox/registry.ts` (registration) · `src/app/(dev)/design/touchpoints.ts`
  (registration, purely additive: prettier's reformat of the `loose-ends` row was reverted by hand).
  Plus this file.
- **The seven decisions, one line each:**
  1. `home` The card grid (today) / a ranked list of what is waiting / the numbers first with the
     queue beneath. **Recommends the ranked list:** the nav already answers "where do I click" twice
     over, and only a ranked list can say a failed purge outranks a press enquiry. Drawn on one
     Tuesday: two backend runs down, one account over cap, three reports, nine messages, two applications.
  2. `nav` (after `home`) The dropdown (today) / a 232 px rail in the four groups / the rail plus a
     command palette. **Recommends the rail plus palette:** the palette reaches rows a nav cannot
     hold (an account, a job, an action) and is one component on top of the rail; the overrule ships
     the rail alone.
  3. `density` (after `home`) Cards (today) / one dense table everywhere / a table for data and a
     reading pane for prose. **Recommends the hybrid:** a support message truncated to one line makes
     the table useless for the one thing the inbox is opened for, and an account card wastes the
     screen its storage meter needs. Drawn on nine messages and six accounts.
  4. `colour` Grey with red for a failure (today) / four states in the chip / the same four reaching
     the row. **Recommends the chip:** four states want four voices and the chip is where an operator
     looks; a tinted row is the first thing that makes a dense table read like a spreadsheet. Drawn
     on the jobs console; the chart ramp is left to `loose-ends` and says so.
  5. `destructive` As today, each surface deciding / one sheet sized to the damage / arm in place
     with an audit line. **Recommends the sheet:** only a panel can say what an act touches before it
     happens (18 events, 40 GB a day, two events under legal hold). Drawn on three acts at three
     blast radii.
  6. `health` (after `home`) Only on the jobs page (today) / a band under the bar on every page / a
     panel on the home. **Recommends the band:** a signal you have to navigate to is one you check
     when you already suspect, and on a good day the band is not there.
  7. `chrome` (after `nav`) The wordmark and an Ops chip (today) / the wordmark alone / a 44 px tool
     bar. **Recommends the tool bar:** it is the one option that says which surface, which
     environment and whether anything is wrong without spending a row.
- **What Mobbin gave it.** Searched internal tools, ops consoles and devtools; four screens shaped
  real decisions and were then designed from the ground up, never traced.
  [Better Stack](https://mobbin.com/screens/5a17a91b-e40a-46bc-b93f-57e720abd6dc) (a rail of grouped
  ops surfaces with a command palette over it) is behind decision 2;
  [Front](https://mobbin.com/screens/2447f03a-a38e-42f5-a6b9-ffc1d4bdd6b8) (three figures then the
  oldest-conversations table) and
  [incident.io](https://mobbin.com/screens/beb49f89-6e5a-47e0-a02b-70665a3fe7bf) (the home IS the
  open work) are the two poles of decision 1;
  [Neon](https://mobbin.com/screens/53d1a659-3ca1-4aba-9f7b-8353f71040dd) (an "All OK" chip in the
  bar over a dense monitoring table with green status pills) is behind decisions 4 and 6; and
  [n8n](https://mobbin.com/screens/6947469e-9c8c-4644-8cae-56a1250195da) (failed executions tinting
  their own rows) is what decision 4's third option draws.
  [Cloudflare](https://mobbin.com/screens/aa928ac1-4a1d-4b8c-9ccb-be35211cdca8) and
  [Resend](https://mobbin.com/screens/778f011b-60b4-4584-b317-1e2353024e0c) set the typed-confirm
  shape decision 5 already ships for one act out of four.
- **Captures** (21 options plus 7 question heads, every option at 1:1 with the stage head naming it):
  `/private/tmp/partyreel-captures/admin/<decision>-<option>.png`, and `<decision>-0-question.png`.
  Read against the option's own words before handoff, which caught four real defects and fixed them:
  the palette drawing over every other decision's tile; the dense table losing its Waiting and Status
  columns off the right edge (no `table-fixed`); three captions claiming a fold that was not there;
  and "the wordmark alone" being today minus a chip, which `lab:demo` called the same picture.
- **What the board found in production, for the Orchestrator rather than this lane:**
  (a) `DistributionChart` hard-codes `YAxis width={28}`, so a four-digit tick renders as its last
  three characters ("1000" reads "000"); `/admin/metrics` hits this the day any count reaches 1,000.
  (b) The home's card grid and the nav list two different portals: `src/app/admin/page.tsx` shows
  nine cards including Exports, which has no nav entry, while the nav shows Reels, Forensics and Jobs,
  which have no card, so three of twelve surfaces are reachable only from a menu.
  (c) The portal has four destructive grammars and the friction does not track the damage: pausing
  the purge sweep, which stops storage being reclaimed platform-wide, is a bare switch with no
  confirmation, while deleting one account makes you retype an email address.
- **Components copied rather than imported, and why.** `AdminShell` is a SERVER component that renders
  `<form action={signOutAction}>` under a layout that has already called `requireAdmin()`, so a client
  board cannot mount it: `chrome.tsx` reproduces its markup on the same primitives and the sign-out is
  a look-alike. `AdminNav`'s rows are reproduced because the trigger reads `usePathname()`, which in a
  lab frame is the board's path. The accounts list and the jobs console are server pages, reproduced
  the same way. `SupportList`, `OperatorAlerts`, `MetricCard`, `TrendChart`, `DistributionChart`,
  `Logo`, `Container`, `PageHeading`, `Badge`, `Button`, `Switch`, `Input`, `Label` and the
  `floatingPanel` contract are the REAL components; the nav's order, labels, groups and icons are
  joined from the real `src/lib/admin/nav.ts` rather than copied into a second list. No preview calls
  `requireAdmin`, and nothing reads with the service role.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none (one `.env.example` line is
  owed by whoever owns `NEXT_PUBLIC_SURFACE`, see the red gate above).
- **Look at first:** `/design/lab/admin`, step 1. The three homes on the same Tuesday are the whole
  round in one screen, and every later decision is drawn in the world that answer creates.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-18). Round one of the admin portal came back as seven
decisions rather than a plan: the operator's home, the nav for twelve surfaces, the density of a list,
how far a state's colour travels, one grammar for three destructive acts, where the backend's health is
said, and how much of the product's bar the portal keeps. Every option is the real admin components fed
one Tuesday of fixtures (two backend runs down, one account over cap, three reports, nine messages) at
1440 by 900, a laptop screen, so what is below the fold is below the fold; four decisions wear each
other's answers through one shell. Reading the 21 captures against their own words caught a palette
drawn over every tile, a table losing two columns off the screen and three captions claiming a fold that
was not there, and it found three defects in the shipped portal that are written into the Handoff.
