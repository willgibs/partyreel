---
track: crumbs-92
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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
  # Claimed at boot (the brief: "claim any mirror's file"). K5's mirrors, each stating the old window in words or fixtures:
  - src/lib/email/templates.ts
  - src/lib/email/templates.test.ts
  - src/app/admin/jobs/catalog.ts
  - src/components/marketing/sections/pricing/pricing-faq-data.ts
  - src/lib/lifecycle/sweeps/inactivity.ts
  - src/lib/lifecycle/sweeps/inactivity.test.ts
  - src/lib/constants/events.ts
  - src/lib/constants/events.test.ts
  - src/components/marketing/faq-data.test.ts
  - src/lib/content/blog-keep-lines.test.ts
  - content/help/AUTHORING.md
  - content/blog/AUTHORING.md
  # X6's reads and writes of the credit (typed seams until the types regenerate) and the guards its SQL reshapes:
  - src/lib/db/queries/uploads-credits.ts
  - src/lib/db/queries/uploads-credits.test.ts
  - src/lib/db/mutations/uploads-credit.ts
  - src/lib/db/mutations/uploads-credit.test.ts
  - src/lib/db/uploads-credit-sql.test.ts
  - src/lib/constants/tiers-sql.test.ts
  - src/lib/db/queries/accounts-migration.test.ts
  - src/lib/upload/uploads-line-migration.test.ts
  - src/app/admin/record-not-found.test.tsx
  # The desk's Clear, its component test:
  - src/app/(dev)/design/(shell)/lab/_desk/clear-held.test.tsx
  # The Record (CLAUDE.md "Record subtractively"): the two system docs' lines for these items.
  - docs/systems/lifecycle-recovery.md
  - docs/systems/admin-observability.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/ROADMAP.md
  - docs/PRD.md
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

Each is built as recommended and is Will's to overrule.

1. **How the two-year window reads on pages.** Built: `INACTIVE_DAYS = 730` (two 365-day years), so the one derivation (`INACTIVE_MONTHS`) makes every page say "about 24 months"; the 14-day warning stays. "About 2 years" would read warmer but needs one phrase export and an edit in each of about a dozen consumers outside this lane (the FAQ, llms, the event constants and their tests): a Deferred line, not a blocker.
2. **The Terms and the Privacy Policy say no figure for the idle removal, nor the warning's lead time.** Built: "after a long period with no activity", "a length we may change", "we email you a warning first" (PRD's legal-text principle: never a number that would box out a later choice; the 14 days is the same tunable policy). Help, marketing and the warning mail keep stating the live figure, derived from the one home.
3. **What the uploads credit is.** Built: extra room in her current uploads window (the calendar month for Free and Pro, her live passes' year for a pass), ending with that window; one press is one credit with a required reason (at most 500 characters) and an amount from 1 MB (the control takes whole MB or GB); together her live credits never pass one more of her plan's own allowance and number at most 10 (so the page reads them whole); refused for a Pro with no cap on record (unmetered: nothing to lift) and for a lapsed pass (no credit lifts that; the nightly recompute does). Additive: `storage_ledger` and the passes' counts are never written, so the spend watch's meter does not move.
4. **A press is idempotent.** Built: the sheet mints a key as it opens and the RPC answers a replayed key with the credit it already made, so a double press or a retry after a dropped answer never credits twice.
5. **No Undo this round.** A mistaken credit is bounded by one allowance and ends with its window; an operator's Revoke (one more RPC, audit row and control) is a Deferred line.

## System-doc edits (in place, owned facts only)

- `docs/systems/lifecycle-recovery.md`, "Free-tier inactivity": the window is two years (`INACTIVE_DAYS`), `lib/lifecycle/inactivity.ts` is its one home with no SQL mirror, every surface derives `INACTIVE_MONTHS`, the Terms and the Privacy Policy state no figure, and `inactivity.test.ts` holds all of it.
- `docs/systems/admin-observability.md`, "Accounts": the page is read-only but for the audited uploads credit; the "Nothing here lifts a host's uploads count" bullet became the credit's one home (what it is, its bound and window, the operator checked in SQL, the key, `admin_actions`, why `uploads_used` and `uploads_refused` read it as they do, and how the card, the list and a failed read say it).

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- Upcoming, Marketing and content: the idle window reads "about 24 months" on every surface that derives `INACTIVE_MONTHS`; "about 2 years" reads warmer, and is one phrase export in `lib/lifecycle/inactivity.ts` plus an edit in each consumer (the home FAQ data, llms, the event constants, the comparison table, the album copy, the privacy feature section, the JSON-LD, help's `<InactivityMonths />` and their tests).
- Upcoming, Admin and operations: an Undo for an operator's uploads credit (a `revoke_uploads_credit` definer function that appends to `admin_actions`, and a control beside each live credit); today a mistaken credit is bounded by one allowance and ends with its window.

## Handoff (replaces the chat report)

- **Commits, all pushed to `origin/lp/crumbs-92`:** boot `cde53fc07` (the claims and the five Questions); K5 `8f0684981`; the desk's Clear `9cda28809`; X6 `c2a79d31e`; the walk's wording and the migration's foot `45c02bc3d`; this manifest's handoff commit is the head (in the chat line). launch-prep moved while I worked (`160bf96ed`) but nothing it holds touches this lane's paths: `git merge-tree` against it is clean, no file overlaps, and its one new migration (`20261008030000_crumbs_91`) replaces `restore_media`, `let_back_in` and `events_email_held`, none of the uploads line. No sync commit.
- **Gates**, each on its own exit code, on `45c02bc3d` (the handoff commit after it is this file alone): typecheck 0; lint 0, no warning; `pnpm test` 0 (1,115 files, 14,222 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3132` 0 (223 checks, 0 failing). Logs: `/Users/gibby/local/ai/partyreel-wt/_scratch/crumbs-92/gate-{typecheck,lint,test,build,smoke}.log`.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` is 44 files, every one an owned path (the claims made at boot, `cde53fc07`, and three added here with the guards they reshape: `accounts-migration.test.ts`, `uploads-line-migration.test.ts`, `record-not-found.test.tsx`) or this file; no exception.
- **The items:**
  1. **K5** (`8f0684981`): `INACTIVE_DAYS = 730` (`src/lib/lifecycle/inactivity.ts`); no SQL mirrors it (the sweep passes its cutoff, `warnCutoff`), so the migration holds none. The three mirrors that typed the old window now derive it: the warning and removal mails (`src/lib/email/templates.ts`), the pricing FAQ (`pricing-faq-data.ts`) and the operator's jobs line (`app/admin/jobs/catalog.ts`); help's `<InactivityMonths />` and every page already did, and now say "about 24 months". The Terms and the Privacy Policy say removal "after a long period with no activity, a period we may change", with no window and no warning lead. `inactivity.test.ts` holds both (a line pairing a figure of months or years with the idle words is refused, RED-checked on the pricing FAQ; the legal texts carry none); the sweep test's ages follow the window.
  2. **X6** (`c2a79d31e`, `45c02bc3d`): the operator's audited uploads credit on `/admin/accounts/<id>`: an amount (whole MB or GB), the portal's confirmation whose required note is the reason, `requireAdminAction()` (AAL2) first and the operator checked again in SQL, bounded, logged in `admin_actions` in the credit's own transaction, idempotent per press, additive (no write to `storage_ledger` or a pass's count, so the spend watch's meter does not move). Its health where the operator looks: the card draws each live credit with who, when and why, says in place of the control why it cannot work (unmetered, lapsed, the ten live credits, no room left, credits unread), the list wears a credited account's total, and a credits read that fails says No reading, and tells Sentry, never an empty list. The migration is below.
  3. **The Clear** (`9cda28809`, `45c02bc3d`): one quiet press beside the desk's Copy buttons (and in place of the walk's bare "Clear this session"), after an inline confirm that says plainly what it empties (the answers, verdicts and notes this browser holds, counted as the Copy buttons count them) and how much of that nothing else holds yet; Keep takes the focus, Escape keeps; it empties the whole store, sent marks included.
- **Verified**, the new paths antagonistically: the SQL on the live schema inside `begin; ... rollback;` in one `execute_sql` call each (the proof is the file's foot): RED 1/7, GREEN 7/7, read back clean (both tables and the three functions absent, `uploads_used` and `uploads_refused` at their old hashes, no fixture user, profile or event); and on a throwaway Postgres 17 (stand-in schema, the file applied verbatim): RED 0/11, GREEN 11/11, plus a two-session lock run (a second 200 MB credit waits 1.2 s on her row and is refused `over_bound`). Mutation checks turned red as intended: no lock, a ledger write in the grant, a client grant or a rewritable log, a refusal that drops the credit (the SQL guards); an immediate Clear (six desk tests); a hard-coded window (the figure scan). Walked on my own port 3132, in my own tab: the desk's Clear at 375 and the pane's desktop width (inline confirm fits at 375, no overflow; Enter opens it with focus on Keep, Escape keeps and returns focus, Tab then Enter empties; the store persisted empty), and the credit control with its sheet at 375 and 1440 on a bare scene that was deleted and never committed (`/admin` asks the operator's second factor, which no lane types): no overflow, the room and the refusals read, and the real Server Action refused the unsigned caller ("Not authorized.") with the sheet left open on its reason. The operator's pages themselves are covered by their component tests over the real pages; the first press on a live account is Will's desk check after the apply.
- **Reshaped on purpose, scar kept, expired reason said** (the credit changed what `uploads_used` and `uploads_refused` are): `src/lib/constants/tiers-sql.test.ts` (three guards), `src/lib/db/queries/accounts-migration.test.ts`, `src/lib/upload/uploads-line-migration.test.ts` (two); `src/app/admin/record-not-found.test.tsx` only gained two mocks.
- **Assets requested from Will:** none.
- **Board ideas:** (1) a health-console signal for paying hosts held at their uploads line, the false positive PRICING.md names, beside the credit that answers it (the list marks them; nothing pushes); (2) a page for `admin_actions` (the log exists and one act writes it) with an Undo where one exists, as the audit-log ROADMAP line asks.
- **Proposed migration (the only change of this kind; nothing for Worker, Vercel, Stripe or env):** `supabase/migrations/20261008060000_crumbs_92.sql`, md5 `d2ab734fa9c0da1736dd559c3175f003`, not applied. Through the Advisor and the protocol, **before this lane's build deploys** (its account page reads the new tables and its control calls the new function; until then the card says No reading and a press fails in words with nothing granted). It adds `admin_actions` (append-only for the service role), `uploads_credits`, `grant_uploads_credit`, `uploads_credit`, `uploads_gross` (the old `uploads_used` body verbatim, hash `a5c98a2f6218f34dac6c474fb920f358`), and replaces `uploads_used` (new body `b50fc557b440e48ac0a8f43834803a20`) and `uploads_refused` (`546174568a59692470623cfd0ca0fcf0`); `uploads_credit` is `1b22637b91b35c05e2169c5b15636c72` and `grant_uploads_credit` `abada562e41752b596c05d298ff9b495`. The header holds the drift read (each replaced or leaned-on body at its repo hash live on 2026-10-07, all equal) and the callers: `uploads_refused` <- `create_media`, `create_media_as_host`, `meter_upload`, `get_upload_context`, `get_upload_gate`, `get_host_upload_context` (none restated: their hashes are unchanged, held by the proof); `uploads_used` <- `uploads_refused`, `uploads_windows` and `readHostMonthUploads` (`src/lib/db/queries/month-uploads.ts`); `grant_uploads_credit` <- `creditUploadsAsOperatorAction` (`src/app/admin/accounts/actions.ts`). **What partyreel.com's milestone-39 build meets:** every signature stands and, until a credit exists (only this lane's control makes one), every figure and refusal is byte-for-byte what it was. Expect two new INFO lints (`rls_enabled_no_policy` on the two deny-all tables, as `pass_credits`). After the apply: regenerate `src/lib/db/types.ts` and drop the two typed seams (`creditDb` in `src/lib/db/queries/uploads-credits.ts` and `src/lib/db/mutations/uploads-credit.ts`).
- **Calls for Will** (built in; he cannot see them by using the product): (1) the credit's bound: a host's live credits together never pass one more of her plan's own allowance (Free 300 MB, a pass 50 GB a pass, Pro 100, 200 or 500 GB a month), at most ten at once, and a credit ends with the window it was made in (the month, or her soonest live pass), never carrying into the next; (2) the Terms and the Privacy Policy now state neither the idle window nor the warning's 14-day lead, the same tunable policy, which goes a step past the window he named.
- **Record, the Orchestrator's:** PRD's "Free-plan inactivity" line, in new words: "an event 730 days (two years) past its last activity (the host signing in or using the app, an edit to the event, a new upload) is removed, with a warning email 14 days before"; retire ROADMAP's three Immediate lines (the K5 line, "Admin: the operator's audited uploads credit", "The lab: a Clear on the desk") and the older Upcoming line "Admin: the operator's uploads credit (the calls lab's X6 ...)", and trim the audit-log line (`admin_actions` now exists; its page and Undo remain); `docs/PRICING.md` says "read-only" and the override as the calls lab's X6 (line 49) and "its 180-day rest" (line 335); `docs/systems/billing-caps.md` describes `uploads_used` as the window's count (it is now that less her credit; `uploads_gross`, `uploads_credit`, `uploads_refused`'s credit) and `docs/systems/database-security.md`'s RPC inventory takes the new function. Test data: none persisted (the live proofs rolled back and were read back clean; the throwaway cluster is scratch).
- **Look at first:** the migration's header and foot (`supabase/migrations/20261008060000_crumbs_92.sql`), then the Uploads card in `src/app/admin/accounts/[id]/page.tsx` and its control `uploads-credit-control.tsx`, then `/design/lab` with an answer held (the Clear).
