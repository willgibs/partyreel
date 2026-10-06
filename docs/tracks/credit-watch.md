---
track: credit-watch
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "0ff67f0a"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/api/stripe/webhook/
  - src/lib/db/mutations/event-passes.ts
  - src/lib/lifecycle/sweeps/passes
  - src/lib/billing/passes
  - src/app/admin/accounts/
  - supabase/migrations/20261005201000_credit_watch.sql
  - docs/systems/billing-caps.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - supabase/migrations/20261005181000_billing_integrity.sql
  - docs/systems/database-security.md
  - docs/systems/admin-observability.md
---

# lp/credit-watch

**Goal.** The pass-to-Pro credit's last holes closed and watched: a leased claim never refuses for good, a stuck credit shows in /admin, the recompute's seconds window and the sweep's cost, and a portal configuration missing a price caught.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3138 is yours; 3000 is Will's desk. Stripe is TEST mode: confirm `livemode` false before any Stripe MCP call; write nothing to Stripe but TEST fixtures you make and remove.

From the Advisor's review of billing-integrity (applied today, `20261005181000`) and that lane's Deferred lines. Each pinned by a test that fails on the old code:
1. **A leased claim never refuses for good:** `claim_pass_credit` answers `overlap` when another checkout's claim on the same passes merely holds its lease; if that holder dies and its retries run out (three in TEST), neither session grants. Answer `busy` while the other is only leased (overlap only against a granted claim or a converted pass). A migration, `supabase/migrations/20261005201000_credit_watch.sql`, restating the one body (a rolled-back check at its foot); the Advisor reads it before the apply.
2. **A stuck credit shows where the operator looks:** an `/admin/accounts` line read from `pass_credits` (claimed and never granted past an hour; granted and never converted), with its health on /admin/jobs' signals as the program's zero-silent-failures rule asks.
3. **The recompute's seconds:** a recompute landing between a credited checkout's conversion and its subscription event moves her to Free for those seconds; skip a non-Pro profile whose last live passes converted to Pro credit within the hour.
4. **The sweep's cost:** `expired_passes` takes every owner of an unconsumed pass, expired ones included, so long-expired passes are recomputed every night for good; read only owners of a pass live or ahead, plus the `event_pass` labels.
5. **A portal configuration missing a price:** TEST's change-plan configuration listed six retired prices today (every Switch a 500, fixed by the Orchestrator); an `/admin` check that the tagged configuration lists every price `tiers.ts` sells, read with the Stripe client, so the gap shows before a host meets it.

Wiring rigor: the whole gate; the webhook's tests replaying each case.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **A claim another checkout's credit overtook: settled, or left to read stuck?** Recommended and built: settled for
  good (`released_at`, `release_pass_credit`), its dead holder's lost grant looked for on Stripe's side first and put
  on record beside it when found ("granted twice", a duplicate that credits nothing and is reversed in Stripe). Beyond
  the five items: without it the watch's only false alarm reads stuck forever and hides a double grant. Overrule:
  drop the column and the function, and such claims read stuck.
- **★ The busy rule's own double grant (the red-team's HIGH): closed at its source, or undo the rule?** Answering
  another checkout's lease `busy` lets that checkout's retry claim past a lease that lapsed and grant, while the dead
  holder may have granted on Stripe with its record lost. Recommended and built: the claim names the `orphans` it is
  taken past and the route looks for every orphan's grant (each orphan's checkout read from Stripe for its customer and
  its time) before granting, adopting what it finds; and it never calls Stripe with under three minutes of lease
  left. Overrule (the red-team's other option): overlap again against a live lease, item 1 undone, the stuck first
  tab left to the operator's Retry.
- **How long before a credit reads stuck?** Recommended and built: an hour at either step (claimed with no grant and
  no live lease; granted and never converted). The manifest named the hour for the first; a grant converts
  milliseconds after it lands, so the same hour bounds the second.
- **The fix beside a stuck credit: an /admin control, or Stripe's event resend?** Recommended and built: Retry on her
  account's page (`retryPassCreditAsOperatorAction`, AAL2, audited in Sentry): the session read from Stripe and run
  through the webhook's own path, so the claim keeps it once ever whichever runs first (CLAUDE.md: every operator fix
  ships its control). Overrule: the page only says it, and the operator resends the event from Stripe.
- **Where the change-plan configuration check lives.** Recommended and built: on /admin/accounts, read live on each
  view and streamed (Stripe's half second never holds the list; it says "Asking Stripe…"), quiet when whole, naming
  each missing price, No reading when it could not run. It rings no bell (a daily run is Deferred). Overrule: a daily
  job instead.
- **Credits only Stripe can settle (two credits for one set of passes).** Recommended and built: listed on the
  Accounts check for 30 days after they happen, never counted as owed (nothing records the reversal), beside the
  existing Sentry warning.
- **The recompute's seconds.** Recommended and built: `skipped_pro_pending`, its own answer (the sweep tallies
  `pro_pending`), the hour in real time, never the sweep's instant; only with no live window and a pass converted to
  Pro credit while it still had time.
- **The `pass_credit` signal's three numbers.** Recommended and built: honoured = credits converted in the day that
  converted any pass; failed = failures while honouring a credit (`recordSignalFailure`, throttled, beside Sentry); owed
  = stuck credits (Needs a look).

## System-doc edits (in place, owned facts only)

- `docs/systems/billing-caps.md`: the credit bullet (the lease rule, the orphans, the settled overlap, a released
  grant no credit, the lease's end never granted past); a new bullet, a stuck credit with its fix beside it (the hour,
  the list, the 30 days of credits to settle in Stripe, Retry, the signal); the change-plan configuration check; in "The
  webhook", the recompute's Pro-pending skip and `expired_passes`' live-or-ahead candidates.
- `docs/systems/admin-observability.md` (an exception, below): one sentence in Accounts pointing at the billing checks
  and the credits card.

## Deferred (ROADMAP one-liners, bucket named)

- Now: Admin: the change-plan configuration check rings no bell; read it in the spend watch's daily run and raise at
  its source (it is read live on each /admin/accounts view today; credit-watch).
- Now: Pricing: harden the credit's orphan path: adopting an orphan's grant (record, convert, this claim's release) as
  one transaction, so a failure between them never leaves the orphan granted and unconverted until its own retry or the
  operator's Retry, and `record_pass_credit_grant` refusing a released claim (unreachable today); the stuck watch
  covers both (credit-watch's second red-team pass).
- Now: Library: draw the Accounts' billing checks and the account page's credits card on the compositions page, the
  portal's one automated eye (AAL2 keeps `lab:smoke` off /admin; credit-watch).

## Handoff (replaces the chat report)

- **Commits, pushed:** work `42f3ac00d` (the five items), `e13380c01` (the docs), `927db4ce3` (the configuration line
  streams; one request a stuck half), `a90f6f7fe` (the first red-team pass), `678eb2415` (the second), with
  `0c5d48527` the checkpoint for the 5-hour cut; sync `4eb161d88` (a merge of launch-prep: database-security.md, a
  read, gained one line on proving a changed signature, no fact this lane leans on; `git merge-tree` was clean). The
  head is the manifest's commit in the chat line.
- **Gates on the synced tree `4eb161d88`, each its own exit code:** `pnpm typecheck` 0; `pnpm lint` 0; `pnpm test` 0
  (1,027 files, 12,824 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3138`
  0 (165 checks, 0 failing). Logs: `../partyreel-wt/_scratch/credit-watch/{lint-sync,test-sync,build-sync,lab-smoke-sync}.log`.
- **The SQL, proved:** `supabase/migrations/20261005201000_credit_watch.sql`'s foot: the drift read clean (claim
  `afa5c7af…`, recompute `906c4891…`, the column and the function absent); the rolled-back proof RED 0/5 (the hole
  itself: tab 2 answered `overlap` against a live lease; the seconds: the pending host moved to Free) and GREEN 5/5 on
  the last revision (bodies `608bb620…`, `daf8070c…`, `9c55581c…`), nothing persisted; the pre-flight on a throwaway
  Postgres 17 cluster applies it verbatim, the two restated bodies' diffs exactly their blocks, ACLs the service role's,
  five two-session lock runs serialized with no deadlock (★ the conversion of her last live pass holding her row, the
  recompute waits and answers `skipped_pro_pending`).
- **Old-code proofs:** the new webhook and sweep cases on the pre-lane `route.ts`, `pass-credit.ts` and `passes.ts`:
  12 fail (the lease rule's 409, the settled overlap, the signal's failure, the live-or-ahead candidates);
  `passes-credit-migration.test.ts`' new facts fail on billing-integrity's bodies; the double-grant case fails on the
  pre-fix credit path (a second balance granted).
- **Live, local:** the configuration check through the real module against Stripe TEST (`livemode` false): whole (the
  tagged `bpc_1UIhoo…` lists all six), `missing` naming pro_50 when its env points at a retired price, `unread` naming
  pro_1tb_yr when its env is unset (`_scratch/credit-watch/portal-check-live.txt`), about 0.4 to 0.8 s a check; the
  stuck filters' and the page-and-count grammar against the real PostgREST: 200s, and `released_at`'s 400 before the
  apply (`postgrest-live.txt`); the admin pages compile (signed out, the portal's 404).
- **Red-team:** two fresh-eyes passes on the money path; the first's HIGH (the busy rule's double grant), MEDIUM
  (credits to settle unseen) and LOWs, and the second's LOWs (every orphan adopted, its customer and Stripe's clock,
  the lease's end, the warning on what was recorded) are built; the second's MEDIUM (a failure mid-adoption) and one
  unreachable LOW are Deferred.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the owned paths and this file, with these
  exceptions: the `pass_credit` signal's homes, which the goal names and no open lane owns
  (`src/app/admin/jobs/{catalog,catalog.test,owed-words,owed-words.test}.ts`, `src/app/admin/jobs/page.tsx`'s label,
  `src/lib/db/queries/jobs.ts` and `jobs.test.ts`'s fixtures); a new reads file for the claims, since `src/lib/db/*` is
  all DB access (`src/lib/db/queries/pass-credits.ts` and its test); the owned mutation's own test
  (`src/lib/db/mutations/event-passes.test.ts`); three mocks in `src/app/admin/record-not-found.test.tsx` for the account
  page's new server-only imports; one pointer sentence in `docs/systems/admin-observability.md`.
- **Items:** (1) a leased claim never refuses for good: another checkout's live lease is `busy` (409 in its own words),
  overlap only against a converted pass or an unreleased grant, the orphans looked for before any grant; (2) a stuck
  credit shows on /admin/accounts (with its account) and the account's page (with Retry), and as the `pass_credit`
  signal on /admin/jobs; credits only Stripe can settle are listed for 30 days; (3) the recompute answers
  `skipped_pro_pending` inside the hour after a credited conversion; (4) `expired_passes` reads only owners of a pass
  live or ahead, plus the labels; (5) /admin/accounts checks the tagged change-plan configuration against the six Pro
  prices, streamed.
- **Assets requested from Will:** none.
- **Board ideas:** the host's own words for Pro pending: today her Plan card reads a lapsed pass while her credited
  Pro plan lands (seconds, or longer when its event is delayed); a line that her Pro is on its way, and what to do if
  it never lands.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** apply `20261005201000_credit_watch.sql` with this
  lane's merge, before launch-prep's next build (its header's protocol; `get_advisors` unchanged, 26 / 4 / 36), since
  this build's operator reads select `released_at` and the route calls `release_pass_credit`; then regenerate
  `src/lib/db/types.ts`, which drops the two typed seams (`creditDb` in `src/lib/db/mutations/event-passes.ts` and in
  `src/lib/db/queries/pass-credits.ts`). database-security.md (a read of mine): its service-role-only list gains
  `release_pass_credit` beside the credit's three. No Worker, Vercel, Stripe or env change.
- **Calls his to overrule:** the settled overlap; the orphans over undoing the busy rule; the hour at both steps; Retry
  as the fix; the configuration check on Accounts with no bell; 30 days of credits to settle; `skipped_pro_pending` as
  its own answer; the signal's three numbers (each a Question above).
- **Look at first:** the Accounts list's two billing checks and an account's credits card at AAL2 on Will's desk (port
  3000) after the apply: no automated eye reaches /admin (`lab:smoke` stops at the portal; RTL renders each state).
