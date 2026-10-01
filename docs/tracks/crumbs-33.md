---
track: crumbs-33
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "65dbedb2"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/admin/reports/
  - src/lib/db/queries/reports.ts
  - src/lib/db/queries/reports.test.ts
  - src/lib/reports/migration.test.ts
  - src/lib/db/mutations/account.ts
  - src/lib/db/mutations/account.test.ts
  - src/lib/utils.ts
  - src/lib/utils.test.ts
  - src/app/(guest)/u/[slug]/page.tsx
  - src/lib/shared/album-rows.ts
  - src/lib/shared/album-rows.test.ts
  - src/lib/album/links.ts
  - src/lib/album/links.test.ts
  - src/components/ui/tooltip.tsx
  - src/components/ui/tooltip.test.tsx
  - src/components/shared/media-lightbox.tsx
  - src/components/admin/report-queue.tsx
  - src/components/admin/report-queue.test.tsx
  - src/lib/admin/reports.ts
  - src/lib/admin/reports.test.ts
  - src/lib/db/migration-guards.test.ts
  - src/app/(dev)/design/(shell)/library/compositions/composition-demos.tsx
  - supabase/migrations/20261001100000_report_strikes_one_home.sql
  - supabase/migrations/20261001110000_newsletter_follows_the_address.sql
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/admin-observability.md
  - docs/systems/trust-safety-forensics.md
  - docs/systems/database-security.md
  - docs/systems/auth-accounts.md
  - docs/systems/notifications-analytics-growth.md
  - docs/systems/guest-flow.md
  - docs/systems/design-system.md
---

# lp/crumbs-33

**Goal.** Six ROADMAP items: a child-abuse report's line telling the operator its address's live strikes, the newsletter row following an email change, one pinned date formatter, the rows engine's ties settled the same in every engine, the viewer's link asks coalesced over a burst, and a tooltip-wrapped control that takes a touch tap on Android.

## The brief

Six items the ROADMAP holds (each is its line there; find it by the words quoted), each fixed at its root with a test that fails on today's code:

- **The strikes on the queue** (from `hide-strikes`; Will's call B, 2026-09-30: three strikes that lapse 180 days after each dismissal, "I don't want to prevent a well-meaning reporter from a second report if I simply disagree with the first"). "Nothing in the portal shows a strike", so the operator cannot know when a Dismiss is an address's third and takes its instant hide away for 180 days.
  - A child-abuse report's line, and its sheet, say how many live strikes its address holds and what a Dismiss would make of it. The address itself is never shown: the count rides `reports.reporter_hash`.
  - The rule has one home. `create_report` holds it today (`c_strikes`, `c_strike_lapse` in `supabase/migrations/20260930120000_hide_strikes.sql`), and the portal's count must be the same rule, never a copy that can drift. A SQL function both read is one shape; a parity test is another.
  - Adding a confirm to the operator's Dismiss is a product question (a Question with your recommendation), not a default.
- **The newsletter row and an email change** (from `identity-email`): "an email change leaves `newsletter_signups` on the old address, so the `/account` marketing switch reads the new one and turning it off cannot remove the old row". The switch must remove what it reads, before any newsletter sender ships. Move the row with the change, or key the switch on the account: your call, recommended in a Question.
- **One pinned date formatter** (from `hardening`): `formatEventDate` (`src/lib/utils.ts`), the claim card's `formatUploadTimestamp` and the profile's joined date render in the runtime's locale, the SSR and hydration drift `formatCount` closed for counts. ★ The desk's boards import `formatEventDate` (`event-ready`'s `hub.tsx` and `readiness.ts`, `locked-door`'s `fixtures.ts` and `furniture.tsx`): its en-US output stays byte for byte what it is today.
- **The rows engine's near-ties** (from `album-guest-wiring`): it "settles near-ties on the last bit of `Math.log` and `**`, which Node and a browser round differently (5 to 10% of inputs)". Make `layoutRows`' cost comparisons tie-robust in `src/lib/shared/album-rows.ts`. The served first paint still hydrates without a re-lay.
- **The viewer's link asks** (from `album-guest-wiring`): "a held arrow key walking the 1,145-photo probe made 1,092 asks and a photograph 100 steps on waited 1 to 6 s for its link". Coalesce a burst's asks (`src/lib/album/links.ts` batches per tick only). Measure before and after on localhost: the probe is the Scale probe album.
- **A tooltip's touch tap on Android** (design system): "`ui/tooltip`'s arrow at `sideOffset` 0 plus radix's open-on-focus loses a touch tap on any tooltip-wrapped control on Android Chrome". The shared fix belongs to `ui/tooltip` or `ActionTooltip`; the viewer's own guard can then go, if it becomes redundant.

**SQL:** a change the database needs is a migration file in `supabase/migrations/` with its rolled-back proof at its foot, red first on today's schema (`database-security.md`, Workflow). Never applied by you: the Orchestrator applies it by protocol and regenerates the types. A file that replaces a function starts from its newest definition. Grants: `anon` and `authenticated` get nothing by default.

**Verify:**
- the gate;
- each item's test red on today's code;
- on localhost, drive what runs there.

The portal and the account's email change cannot run signed in on localhost, so name their steps for the next build's red-team in your Handoff.

**Will's desk is up:** `locked-door`, `event-ready` and `disposable-mode` describe the door, the hub and the guest page. Change no word or behaviour their asks describe. If the lab crawl's PREMISE line names a board, say in your Handoff why its asks still hold.

**Paths:** your owns are a start. Add each file to `owns` in your manifest before editing, or name a one-line exception. `crumbs-34` runs beside you on help, marketing and Sentry's init (`content/help/`, `src/components/marketing/`, `src/lib/constants/events.ts`, `src/lib/constants/marketing-nav.ts`, `src/lib/glass.ts`, `src/lib/observability/sentry.ts`): don't touch them.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
