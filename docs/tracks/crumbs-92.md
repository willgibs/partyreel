---
track: crumbs-92
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "5ed23311"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/lifecycle/inactivity.ts
  - src/lib/lifecycle/inactivity.test.ts
  - src/components/marketing/mdx/spec-shared.tsx
  - src/components/marketing/mdx/spec-shared.test.ts
  - src/lib/constants/legal-terms.tsx
  - src/lib/constants/legal-privacy.tsx
  - src/app/admin/accounts/
  - supabase/migrations/20261008060000_crumbs_92.sql
  - src/app/(dev)/design/(shell)/lab/_desk/copy-so-far.tsx
  - src/app/(dev)/design/(shell)/lab/_desk/copy-so-far.test.ts
  - src/app/(dev)/design/(shell)/lab/_desk/review-session.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/ROADMAP.md
  - docs/PRD.md
  - docs/systems/lifecycle-recovery.md
  - docs/systems/admin-observability.md
  - docs/systems/database-security.md
  - docs/systems/billing-caps.md
---

# lp/crumbs-92

**Goal.** Three of Will's calls answers wired: a Free event idle for two years before it is removed (K5), the operator's audited uploads credit (X6), and a Clear on the desk (his note).

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3132 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**The items, each an Immediate line in `docs/ROADMAP.md` quoted by its opening words (the Orchestrator retires each at your record):**
1. **"Lifecycle: a Free event idle for two years, not six months, is removed"** (Will changed K5: "6 months feels like too short a span"): the window's one home (`lib/lifecycle/inactivity.ts`) and every mirror of it (its SQL, the warning mail's words in `lib/email/templates.ts`, help's `<InactivityMonths />` in `spec-shared.tsx`); the Terms and the Privacy Policy state no number (his: "Legal terms should not bind us to this"; PRD's legal-text principle): say it as removal after a long idle period we may change. Claim any mirror's file at boot.
2. **"Admin: the operator's audited uploads credit"** (Will's yes to X6): on `/admin/accounts/<id>`, a credit with a reason, the operator's second factor (AAL2, as the admin's other writes ask), a bounded amount, logged in `admin_actions`; never a reset of the ledger the spend watch reads; its health shown where the operator looks (zero silent failures). The migration, `supabase/migrations/20261008060000_crumbs_92.sql`: start from the uploads allowance's ledger (`upload_allowance()` and its meter)'s newest definition in `supabase/migrations/` (never from memory) and follow `docs/systems/database-security.md`'s Workflow and checklist (grants revoked from public before they are granted exactly; the migration guards; its pre-flight on a throwaway local cluster). Prove it on the live schema inside `begin; ... rollback;` in one `execute_sql` call (that doc's recipe: the proof commented at the file's foot, RED then GREEN), and never apply it: the Orchestrator applies it through the Advisor and the protocol after your handoff, so your Handoff names the file's md5 and every caller. partyreel.com's live build (milestone 39) shares this database, so the change must leave that build working (an expand where a signature or behaviour changes; the header names what that build sees meanwhile: PROGRAM's "Before launch there are no real users").
3. **"The lab: a Clear on the desk"** (Will: "Copy everything" carried a past batch's answers into his calls paste): one quiet press that empties the sitting's held answers, after a confirm, with what it clears said plainly.

**Record:** lifecycle-recovery.md's inactivity lines and admin-observability.md's accounts lines refined in place; PRD's "Free-plan inactivity" line is the Orchestrator's to change at your record (say the new words in your Handoff).

**Lanes running beside you (never edit their paths; a line you need there is an exception in your Handoff, with why):** no-signal-wiring (the upload queue, `components/guest/upload/`, the roll's counting files), crumbs-91 (the album's order, the guest page `e/[token]/page.tsx`, `event-experience.tsx`, `as-guest*`, `settings-state*`, `lib/db/mutations/events.ts`), and the boards event-page-r1 and brand-marks-r2 (their folders).

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`. Verify what your change adds antagonistically (its error cases, malformed input, and the cross-tenant and abuse paths of anything that reaches data), walking your own new paths once at 375 and 1440 and reading the page's text and state before a screenshot; the wide walk across surfaces, themes and assistive settings is the milestone red-team's. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired. A Handoff states what the Orchestrator needs to integrate and record, never an essay.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, each naming its bucket and area)

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
- Calls for Will: only a decision built in that he cannot see by using the product (plans, billing and renewals; lifecycle and timing; deletion, retention and privacy; safety and moderation; what the product does on its own), one line each, or none. A design, wording or flow choice is never one: production and the lab show it
- Look at first: ...
