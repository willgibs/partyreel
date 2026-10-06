---
track: billing-orphans
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "b5042226"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/20261006120000_billing_orphans.sql
  - src/lib/billing/
  - src/lib/stripe/
  - src/app/api/stripe/
  - src/app/admin/accounts/
  - src/app/admin/jobs/
  - src/lib/jobs/
  - src/app/api/cron/spend-watch/
  - src/components/app/pricing/
  - src/lib/db/queries/pass-credits.ts
  - src/lib/db/queries/pass-credits.test.ts
  - src/lib/db/queries/event-passes.ts
  - src/lib/db/queries/accounts.ts
  - src/lib/db/queries/accounts-migration.test.ts
  - src/lib/db/mutations/event-passes.ts
  - src/lib/db/mutations/event-passes.test.ts
  - src/lib/db/mutations/event-passes-migration.test.ts
  - src/lib/db/billing-orphans.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/billing-caps.md
  - docs/systems/database-security.md
  - src/lib/constants/tiers.ts
---

# lp/billing-orphans

**Goal.** Milestone 38's billing line closed: an orphan's pass-credit grant adopted as one SQL function under her profiles lock (two orphans flagged, a released claim refused), the change-plan configuration watched at its source (the spend watch's daily run and /admin's health line name a missing price), and the Plan card saying her credited Pro is on its way. One migration, written here and applied by the Orchestrator through the Advisor.

## The brief

**The round's direction (Will, standing since round 13):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity; nothing depends on a timeline; immediate, or a clear state and a way to stop it; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control and its health signal, zero silent failures); cost designed like the architecture; production is the working version.

**Why now.** Money and the meter must tell one truth before milestone 38 ships (billing-integrity and credit-watch landed the pass-to-Pro credit once ever, a leased claim answering busy, a stuck credit on `/admin/accounts` with Retry). The Advisor's Q38 and credit-watch's second red-team pass left one hole tagged for milestone 38, and the change-plan path two blind spots. Read `docs/systems/billing-caps.md` (its ★ lines) and `docs/systems/database-security.md` first; the newest definition of each function you replace is in `supabase/migrations/` (`20261005181000_billing_integrity.sql`, `20261005201000_credit_watch.sql`).

**The work (each line retired from the ROADMAP in your Handoff):**
1. **The orphan's grant as one transaction (milestone 38's line):** adopt an orphan's grant (record, convert, this claim's release) as one SQL function under her `profiles` lock, so a failure between them never leaves the orphan granted and unconverted until a retry or the operator's Retry; flag two orphans both holding grants; and have `record_pass_credit_grant` refuse a released claim. A migration: `supabase/migrations/20261006120000_billing_orphans.sql`, starting from each function's newest definition, its grants exact (CLAUDE.md's ★ lines: revoke from `public` first, then grant exactly), with rolled-back proofs through the Supabase MCP (`begin; … rollback;`: the old code's failure shown, the new one's refusal and its success) in your Handoff. You never apply it: the Orchestrator does, after the Advisor reads it.
2. **The change-plan configuration watched at its source:** today it is read live on each `/admin/accounts` view (`portal-check.ts`) and rings no bell, and a portal configuration missing a current price shows only as a Sentry error and a generic toast at the change-plan route. Read it in the spend watch's daily run and raise it as that run's other checks raise (the bell, the ops mail), and make `/admin`'s health line say which price `tiers.ts` sells that the tagged configuration lacks. Name the configuration's TEST id from the code, never a secret.
3. **Her own words while a credited Pro lands:** the Plan card (`components/app/pricing/plan-card.tsx`) reads a lapsed pass while her credited Pro lands (seconds, or longer when its webhook is delayed): a line that her Pro is on its way, and what to do if it never lands.

Not now: dropping `consume_passes_for_pro_credit(uuid)` is a contract migration after milestone 38 (its ROADMAP line stays). Stripe stays in TEST: confirm `livemode` is false (`list_available_accounts_or_orgs`) before any Stripe MCP call; never a live key.

**Starts from.** CLAUDE.md's working loop and security guardrails (the Stripe webhook is the sole writer of `profiles.tier` and `storage_cap_bytes`; never trust the client for tier or entitlements), and production as it is; the tests say what has to keep working.

**Verify on.** The whole gate on the synced tree, each step on its own exit code, and `pnpm lab:smoke`; the SQL proofs above; the spend watch's run read against a TEST configuration with a price missing and with none missing (no write to the live configuration: a stub at the reader, or a TEST configuration of your own, deleted after); the Plan card's line at 375 and 1440 on both grounds.

Model: Opus. Cut 2026-10-06 by the cloud-seated Orchestrator; you run in a cloud session of your own (the spawn prompt's boot).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Two orphans both holding grants for one pass: which is the credit?** Built: the OLDER orphan (by claim time)
  converts; a younger one whose passes are credited by then is released WITH its grant on record (the Accounts list's
  "granted twice", reversed in Stripe), never a "converted none" left reading as a credit. Two orphans on disjoint passes
  each convert (no double). Will's to overrule.
- **A holder that outlived its lease and granted after its claim was released:** Built: `record_pass_credit_grant`
  refuses it (the Advisor's ask), and the route puts that grant on record beside the release through
  `release_pass_credit`, whose replay now takes a late grant on a claim released with none (`released_granted`). Without
  that second half the refused grant would be on Stripe and on no record (a silent failure). Will's to overrule.
- **"/admin's health line":** the band under the bar (`components/admin/health-band.tsx`, outside this lane) names jobs,
  not reasons, so it reads "Spend watch needs a look." (the run is held at attention); the line that names the missing
  price is the spend watch's Note on `/admin/jobs` and a new line under its readings (`ChangePlanLine`). Recommended:
  keep the band naming the job (one grammar for every job); if Will wants the price on the band itself, it is a small
  change to `health-band.tsx` reading the run's note.
- **The Plan card the brief named is not the Plan card:** `components/app/pricing/plan-card.tsx` is the pricing sheet's
  card grammar; the account page's Plan card (`#plan`) is inline in `src/app/(app)/account/page.tsx`. Built: the line is
  an owned component (`pricing/pro-on-its-way.tsx`) mounted with a minimal edit to the page (one read, one element) and
  one mock and one test in its `page.test.tsx`: the lane's only paths outside `owns`.
- **The line's window and its words:** Built: shown while she is not Pro, a checkout of hers converted at least one pass
  into credit (unreleased) within Stripe's three days of retries, and no subscription event has written her profile since
  (`stripe_event_created_at` older than the conversion). Words: "Your Pro plan is on its way. Your Event Pass is now
  credit toward it, so this card may still show your old plan for a moment. Pro usually lands within a minute: refresh
  to see it. If it still isn't here in an hour, email help@partyreel.com from this account and we'll finish it for you."
  (The hour matches the recompute's own Pro-pending hour; the operator's fix is Retry on `/admin/accounts`.) Will's to
  overrule the words.
- **The change-plan mail's cadence:** Built: once a day per broken set while it holds (`sendOnce`, keyed by the missing
  prices and the day), like a trip's mail; the run is daily, so a configuration left broken mails each morning.

## System-doc edits (in place, owned facts only)

`docs/systems/billing-caps.md` is a `reads` file here, so these are proposed for the Orchestrator to fold in:
- "The prorated pass-to-Pro credit" bullet, its orphan sentence: "every grant found is its own checkout's (put on record
  on its claim, converted) and this claim is released, granting nothing" becomes "every grant found is adopted in ONE
  transaction, `adopt_pass_credit_orphans` (20261006120000): her profiles row first, each orphan's grant on record and
  converted oldest first, a younger orphan whose passes are credited by then released beside its grant (granted twice),
  then this claim released; an orphan whose own delivery holds its lease again answers busy, nothing written".
- Same bullet, after the release sentence: "★ `record_pass_credit_grant` refuses a released claim; a holder that outlived
  its lease and granted after its release has that grant put on record beside the release (`release_pass_credit`'s
  replay takes a late grant on a claim released with none: granted twice)."
- "The change-plan configuration is found by its tag" bullet, its last sentence: "`/admin/accounts` checks on each view
  ..." gains: "and the spend watch's daily run reads the same check (`jobs/change-plan-watch-run.ts`): a price missing or
  no configuration tagged holds the run at attention (the bell, the band), mails the ops inbox once a day while it holds
  and names each price in the run's note and the card's line; a check that could not run fails the run. The TEST
  configuration is `bpc_1UIhooPtjqmVkBwkcLe9YgYN`."
- "The account page's Plan card" bullet gains: "While her credited Pro lands (her passes converted to credit, no
  subscription event since, within Stripe's three days of retries: `billing/pro-pending.ts`), the card says her Pro is
  on its way and to email help@ if it is not there in an hour (`pricing/pro-on-its-way.tsx`)."
- `docs/systems/database-security.md`'s list of service-role functions gains `adopt_pass_credit_orphans`.

## Deferred (ROADMAP one-liners, bucket named)

- none (the contract drop of `consume_passes_for_pro_credit(uuid)` keeps its line, as the brief said)

## Handoff (replaces the chat report)

- **Commits:** work `ca578163` (the orphans' SQL and route), `e1327355` (the change-plan watch), `38c21350` (the Plan
  card's line); sync `28652944` (launch-prep `e4c2d7c3` merged in, no conflict); this manifest on top.
- **Gates on the synced tree `28652944`, each on its own exit code:** `pnpm typecheck` 0; `pnpm lint` 0; `pnpm test` 0
  (1,056 files, 13,206 passed, 2 skipped); `zsh scripts/build-lock.sh pnpm build` 0;
  `pnpm lab:smoke --base http://localhost:3131` 0 (138 checks, 0 failing; the first try timed out on a cold dev compile
  of `/design/library`, passed once warmed). No board, so no `lab:demo`.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file, except
  `src/app/(app)/account/page.tsx` and `src/app/(app)/account/page.test.tsx` (the Plan card lives there, not in the
  `plan-card.tsx` the brief named; see Questions).
- **1. The orphan's grant as one transaction** (`supabase/migrations/20261006120000_billing_orphans.sql`):
  `adopt_pass_credit_orphans(session, host, orphan sessions, their grants)` composes the three existing calls (record,
  convert, release) under her profiles lock, all or nothing; two orphans granted for one pass: the older converts, the
  younger is released beside its grant (`granted_twice`, raised as `stripe_pass_credit_overlap_granted`);
  `record_pass_credit_grant` refuses a released claim (55000); `release_pass_credit`'s replay puts a late grant beside a
  release. Grants exact (revoke from public, anon, authenticated; execute to service_role), INVOKER, empty search_path.
  The route (`webhook/pass-credit.ts`) adopts through the one call (`adoptPassCreditOrphans`, behind the `orphansDb`
  seam until the types regenerate) and settles a refused record beside the release. Tests: `route.test.ts` (a failure
  mid-adoption writes nothing and the retry adopts whole; two granted orphans; busy; the woken holder),
  `passes-credit-migration.test.ts` section 9 and section 8 reshaped on purpose (the release's replay and its second
  write, scars in place), `event-passes.test.ts` (the parse and the refusal's error).
- **The SQL proofs are NOT YET RUN** (the Orchestrator's instruction: no Supabase SQL from this lane after the drift
  read). The drift read did run live once on 2026-10-06 (`record_pass_credit_grant` `8605ffe454f7e3ab41cdeaf8384edc6e`,
  `release_pass_credit` `daf8070ceefe570939df3dd5965ecb5d`, `convert_pass_credit` `17dd8a3c42b8a3301206eb3de5462a9a`,
  `claim_pass_credit` `608bb620d856a71389345ce194ddb6d4`; `adopt_pass_credit_orphans` absent; ACLs postgres +
  service_role). The ready-to-run proof is the commented block at the migration's foot: RED = `begin;` + that block +
  `rollback;`; GREEN = `begin;` + the file's statements + that block + `rollback;`, one `execute_sql` each. The result
  each must show is written above the block (RED: 1a true, the old path's hole, orphan granted and unconverted; 1b to 4
  false, the function absent and the record writing onto a released claim; GREEN: 0 to 5 true, step 5 printing the three
  new hashes to record). It was not pre-flighted on a throwaway cluster (no Postgres in this container).
- **2. The change-plan configuration watched at its source:** `jobs/change-plan-watch.ts` (pure: the record, words, mail)
  and `jobs/change-plan-watch-run.ts` (the step) ride `spend-watch-run.ts`: missing price or no tag = `breaker_tripped`
  (bell, band), ops mail once a day, the note naming each price; unread = the run fails. Record at
  `job_runs.counts.change_plan`; the card's line `ChangePlanLine` under the readings (`spend-watch-card.tsx`).
  Verified: `change-plan-watch-run.test.ts` runs the real check against a stubbed TEST configuration with a price
  missing (named, mailed, attention) and with none missing (quiet), no tag, and Stripe failing; live read-only through
  the app's TEST key (`sk_test_` checked first, ids only printed): the tagged configuration is
  `bpc_1UIhooPtjqmVkBwkcLe9YgYN` (livemode false), subscription updates on, listing all six Pro prices, so tonight's run
  reads whole. No Stripe write.
- **3. Her own words while a credited Pro lands:** `billing/pro-pending.ts` (pure rule), `pro-pending-read.ts` (never
  throws; Sentry `pro_pending_read_failed`), `queries/pass-credits.ts`' `readNewestCreditConversion` (admin client, the
  page's own profile id), `pricing/pro-on-its-way.tsx`, mounted at the top of the Plan card. Tests: `pro-pending.test.ts`,
  the account `page.test.tsx` case.
- **Not walked (for Will's desk or the Orchestrator):** the Plan card's line at 375 and 1440 on both grounds. This
  container's auto mode refused the `--no-sandbox` Chrome wrapper, so no browser ran here; and the line needs a host
  mid-credit. Smallest walk: on a local build at 3000, as a test host with `tier='event_pass'` and a `pass_credits` row of
  hers with `converted_count >= 1`, `converted_at` now and `released_at` null (her `stripe_event_created_at` older or
  null), open `/account#plan` at 375 and 1440, light and dark.
- **Also refused by auto mode at boot:** writing `.env.local` (the app read its variables from the environment instead).
- **ROADMAP lines retired:** "Pricing (milestone 38): adopt an orphan's grant ..." (line 54), "Admin: the change-plan
  configuration check rings no bell ..." (line 53), "Billing: the host's own words for Pro pending ..." (line 56).
- Assets requested from Will: none.
- Board ideas: the band under the bar could carry the first line of a job's note beside its name ("Spend watch needs a
  look: Change plan in Stripe lacks ..."), so every job's reason reaches every admin page, not only this one.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** the migration above (apply after the Advisor reads it
  and the proofs run GREEN, then regenerate `src/lib/db/types.ts` and drop the `orphansDb` seam in
  `src/lib/db/mutations/event-passes.ts`). Apply it BEFORE this lane's build deploys (the adoption path would meet
  PGRST202 as a 500 that Stripe retries). No Worker, Vercel, Stripe or env change.
- **Calls his to overrule:** the older orphan is the credit; the woken holder's grant goes beside the release; the band
  names the job, the Note and card name the price; the line's words and its three-day window; the change-plan mail daily
  while broken.
- **Test data left:** none (the proof is rolled back by construction; the live Stripe read was read-only).
- **Look at first:** the migration's `adopt_pass_credit_orphans` and the route's adopted branch
  (`src/app/api/stripe/webhook/pass-credit.ts`), then run the two proof legs.
