---
track: billing-integrity
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "4c11a0ad"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/api/stripe/webhook/
  - src/lib/db/mutations/event-passes.ts
  - src/lib/lifecycle/sweeps/passes
  - src/lib/billing/passes
  - src/lib/db/mutations/host-media.ts
  - src/lib/db/mutations/guest.ts
  - src/app/api/r2/presign-upload/
  - src/app/api/host/r2/presign-upload/
  - src/lib/upload/
  - supabase/migrations/20261005181000_billing_integrity.sql
  - docs/systems/billing-caps.md
  - docs/systems/uploads-and-r2.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/database-security.md
  - supabase/migrations/20261005130000_billing_locks.sql
  - src/lib/constants/tiers.ts
---

# lp/billing-integrity

**Goal.** Money and the meter tell one truth: the pass-to-Pro credit granted once ever, a replay never consuming a later pass, the pass recompute one SQL under the profiles lock, the upload advisories reading the completes' own predicate, and each allowance refusal in its true words.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3132 is yours; 3000 is Will's desk. Stripe is TEST mode: confirm `livemode` false before any Stripe MCP call, and write nothing to Stripe but TEST fixtures you make and remove.

**What this is.** Five holes in money and the meter, from ROADMAP "Now" (their provenance in git; `billing-caps.md` and `uploads-and-r2.md` are the system docs). Each fix pinned by a test that fails on the old code:
1. **The pass-to-Pro credit can be granted twice.** The webhook grants the prorated pass credit as Stripe customer balance under the idempotency key `pass-credit-<session>` (`src/app/api/stripe/webhook/route.ts`, near line 267), which Stripe honors for at least 24 hours, while Stripe retries a failing delivery for three days: a conversion failing past a day grants the balance again. Make the grant once ever per checkout session (recommended: our own durable claim keyed by the session, taken before the grant and read on every retry, with the balance transaction carrying the session in its metadata, so a claim lost mid-call is found on Stripe's side before granting again).
2. **A replayed credit delivery consumes a pass bought after the conversion** (a pass checkout paid a day after going Pro is consumed with no credit for it): the conversion takes only the passes its checkout credited (the session names them).
3. **`recomputePassEntitlement` reads the ledger and writes the profile in two requests**, so a recompute racing a conversion can put back the chain fields the conversion cleared until the subscription event lands: one SQL recompute under the profiles lock (billing-locks' order: profiles first).
4. **The three upload advisories (`get_upload_context`, `get_upload_gate`, `get_host_upload_context`) read a lapsed pass as not full**, so her album's upload door opens and the presign refuses: they read the completes' own predicate (one home for "may this account still add"), so the door, the presign and the complete agree.
5. **The allowance refusal's words:** a host gets "Storage is full for your plan" for every refusal containing "limit" (`mapHostCheckViolation`, `src/lib/db/mutations/host-media.ts`), a guest the SQL's own "Upload limit reached for this ..." text: each refusal says which line was met (the uploads line or storage) in the product's voice, for both.

The SQL in one migration, `supabase/migrations/20261005181000_billing_integrity.sql`, per `database-security.md` (owner-only grants; a rolled-back Supabase MCP check of each transition, kept commented at the file's foot); the Orchestrator has the Advisor read it against the live schema before applying it. Wiring rigor: the whole gate; the webhook's tests replaying each delivery (a retry inside and past 24 hours, a replay after a later pass, a recompute racing a conversion); the advisories against the completes on a lapsed pass in the rolled-back check.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each built as recommended, Will's (or the Orchestrator's) to overrule:

- **"One home" for "may this account still add": a function, or a parity-held copy?** Recommended and built: two SQL
  functions, `uploads_refused` (her plan's own number over its window, or a lapsed pass) and `pass_lapsed`, which both
  completes, the meter, the three advisories and `uploads_windows` ask; the cost is seven bodies restated verbatim but
  for their one block (the pre-flight's `pg_get_functiondef` diff shows exactly that) and three unowned guard tests
  reshaped onto the home. The other answer, the meter's way, was a fourth and fifth copy of the predicate in the
  advisories held by a parity pin.
- **Two Checkout tabs crediting the same passes: grant the second nothing?** Recommended and built: a pass is credited
  once ever; the second session's claim answers overlap, grants and converts nothing, and raises
  `stripe_pass_credit_overlap` (its subscription is a double billing the operator settles anyway; a pass it named and
  nobody converted stays live behind Pro and comes back when Pro ends, so nothing is lost). The other answer re-prices
  the passes the first did not take at the second session's instant.
- **The checkout names every credited pass (outside the owns).** Recommended and built: `passCreditMetadata` stamps
  every unconsumed pass the credit counted across `credited_pass_ids`, `_2`... with a count, the credit computed over
  exactly the passes named (a cap of 520 never met); the ids were an audit trail cut at ten, which would have left a
  credited pass past the tenth unconverted.
- **The host's storage words at the complete.** Recommended and built: keep "Storage is full for your plan. Free up
  space or upgrade." (two help articles quote it) for storage, and give her uploads line its own sentence; the presign
  says storage with the room the file needs (`roomRefusalWords`). One sentence for both is a copy pass (Board ideas).
- **A credited checkout whose host's profile is gone** answers `no_host` and grants nothing (the old route granted the
  balance on the Stripe customer anyway). Recommended: nothing to credit.
- **A delivery while another holds the claim answers 409 and Stripe retries it.** With two TEST endpoints receiving
  every event, one of each credited checkout's two deliveries reads as failed in Stripe's dashboard until its retry
  finds the grant on record. Recommended: accept; a 200 would claim work it did not do.

## System-doc edits (in place, owned facts only)

- `docs/systems/billing-caps.md`: the uploads line's one home (a bullet replacing "the three upload advisories still
  read her as not full"); the meter's clause reads it; each refusal names its line in its identity's voice
  (`cap-words.ts`, a bullet); a pass write never flattens Pro (the recompute's lock, not a WHERE); the credit's bullet
  rewritten (claim, grant with its session, record, convert only what it credited, once ever); the webhook's
  sole-writer bullet (the recompute one SQL, `convert_pass_credit`).
- `docs/systems/uploads-and-r2.md`: refusals framed per identity include the cap lines (one clause, pointing at
  billing-caps.md).
- Proposed for `docs/systems/database-security.md` (a `reads`, the Orchestrator's to write when it applies the
  migration): `get_advisors` reads 26 `rls_enabled_no_policy` (`pass_credits`, deny-all like `event_passes`); the
  deny-all list gains `pass_credits`; the service-role-only list gains `claim_pass_credit`, `record_pass_credit_grant`,
  `convert_pass_credit`, `recompute_pass_entitlement` (INVOKER) and `pass_lapsed` (INVOKER, the operator's read asks
  it); the owner's-alone list gains `uploads_refused` (INVOKER, read only by the definer bodies that judge an upload);
  the ★ on every writer of a pass's row names `convert_pass_credit` (and `consume_passes_for_pro_credit` until it is
  dropped).

## Deferred (ROADMAP one-liners, bucket named)

- Pricing: drop `consume_passes_for_pro_credit(uuid)` once no deployed build calls it (partyreel.com's build after
  milestone 37 runs the claim), with `event-passes-migration.test.ts`'s pins on it; a contract migration.
- Pricing: a recompute landing between a credited checkout's conversion and its subscription event moves her to Free
  for those seconds, and the nightly order runs over-capacity right after `expired_passes`; skip a non-Pro profile whose
  last live passes converted to Pro credit within the hour.
- Cost: `expired_passes` takes every owner of an unconsumed pass as a candidate, expired ones included, so a host's
  long-expired passes are recomputed every night for good (one call each); read only owners of a pass live or ahead,
  plus the `event_pass` labels.
- Admin: a pass credit stuck past Stripe's three days (claimed and never granted, or granted and never converted) shows
  only in Sentry's history; an `/admin/accounts` line read from `pass_credits` would show it where the operator looks.

## Handoff (replaces the chat report)

- **Commits.** Work `2778adc39` (pushed); this manifest's commit is the head. Sync: launch-prep moved since the base
  (`938693389..origin/launch-prep`: crumbs-81's merge and kit records), touching none of this lane's files or reads
  (`git diff --name-only 938693389 origin/launch-prep`), so no sync (PROGRAM.md "Sync").
- **Gates on `2778adc39`, each its own exit code.** `pnpm typecheck` 0; `pnpm lint` 0, no warning; `pnpm test` 1:
  12,311 passed, the one failure `track-manifests.test.ts > drive-fixes.md is well-formed`, known and pre-existing
  (drive-fixes' manifest reads two scratch paths; the Orchestrator's note); `zsh scripts/build-lock.sh pnpm build` 0;
  `pnpm lab:smoke --base http://localhost:3132` 0, 156 checks, 0 failing. Logs: `_scratch/billing-integrity/*.log`.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): owned, the migration, the webhook's three files,
  `src/lib/billing/passes{,.test,-credit-migration.test}.ts`, `event-passes.ts`, `guest.ts`, `host-media.ts`, the two
  presign routes, `src/lib/upload/{cap-words,cap-words.test,uploads-line-migration.test,server-pipeline-meter-migration.test}.ts`,
  the two system docs, this file. Exceptions and why: `src/app/api/stripe/checkout/route.ts` (no lane owns it; the
  writer half of the credit's names, a four-line change through `passCreditMetadata`);
  `src/lib/db/mutations/{event-passes,guest,host-media}.test.ts` (the owned modules' own tests; host-media's is new);
  `src/lib/constants/tiers-sql.test.ts`, `src/lib/db/migration-guards.test.ts`, `src/lib/db/queries/accounts-migration.test.ts`
  (pins on bodies this migration restates, reshaped onto the one home, each keeping its scar and saying so);
  `src/components/marketing/mock-parity.test.ts` (one line: the guest's words' pin follows them to `cap-words.ts`).
- **1. The credit granted once ever.** `pass_credits` + `claim_pass_credit` / `record_pass_credit_grant`
  (20261005181000) and `webhook/pass-credit.ts`: a claim keyed by the session, read on every retry; a 10-minute lease
  (the webhook's `maxDuration` 120 s under it, pinned) answers a second delivery 409; the grant carries
  `pass_credit_session` in its metadata and a lapsed claim finds it on Stripe's side first. Tests: `route.test.ts`'s
  "a conversion failing past the key's day never grants again" and "a grant whose record was lost is found on Stripe's
  side" against a model of Stripe's key window.
- **2. A replay converts only what its checkout credited.** `convert_pass_credit` takes the claim's passes, never one
  bought since, and clears the chain only when it converted; `passCreditMetadata` / `creditedPassIds` name every pass,
  whole; a pass is credited once ever (overlap). Tests: "a replay after a later pass", "two Checkout tabs",
  `passes.test.ts`'s "the credit's names".
- **3. The recompute is one SQL under her profiles lock** (`recompute_pass_entitlement`; `recomputePassEntitlement` one
  call; the TS derivation removed). Tests: `event-passes.test.ts` "is ONE call" (fails on the old three requests);
  the two-session run (a1 old shape puts the chain back; a2/a3 serialize).
- **4. One home for the uploads line** (`uploads_refused`, `pass_lapsed`): both completes, the meter, the three
  advisories (of one byte) and `uploads_windows` ask it. Tests: `uploads-line-migration.test.ts` (no copy outside the
  homes) and the rolled-back proof's steps 5 and 5b (a lapsed pass: every door full, the meter and both writers refuse).
- **5. Each refusal in its line's words** (`upload/cap-words.ts`, `capLineOf`): a guest's album words, the owner's
  plan words; a host's uploads line no longer reads "Storage is full", a guest no longer gets "...for this plan".
  Tests: `guest.test.ts`, `host-media.test.ts`, `cap-words.test.ts`.
- **Proofs.** The rolled-back proof (the migration's foot) on the LIVE schema: RED 0/9, GREEN 9/9, nothing persisted
  (read back after: no fixture user, profile or event; no `pass_credits`; the old hashes). The pre-flight on a throwaway
  Postgres 17 cluster: the file applies verbatim, the restated bodies' diff is their one block, ACLs unchanged, RED 0/9
  and GREEN 9/9, the lock runs with no deadlock (`_scratch/billing-integrity/pg/locks.log`, `functiondef.diff`). The
  new credit tests run against the OLD route: 9 fail, among them a second grant past the key's day, the later pass
  consumed and both tabs granted (`oldcheck-webhook.txt`). A Stripe TEST probe (a customer made and deleted): metadata
  on the grant, the same key answers the first grant, the same key with other parameters is refused
  (`StripeIdempotencyError`), `created.gte` honoured (`stripe-probe.log`).
- Assets requested from Will: none.
- **Board ideas.** The host's storage refusal says two sentences (the presign's room words, the complete's "Storage is
  full for your plan..."), and two help articles tell hosts the second is what their uploads get: one sentence, the
  articles retold from it.
- **Proposed migrations / Worker / Vercel / Stripe / env changes.** `supabase/migrations/20261005181000_billing_integrity.sql`:
  apply BEFORE this lane's build deploys (the route calls the four new functions by name; ahead of the file every
  credited checkout and pass purchase is a 500 that Stripe retries); its header holds the drift read (seven hashes) and
  what partyreel.com's build meets; then `get_advisors` (26 `rls_enabled_no_policy`, 0028/0029 unchanged); then
  regenerate `src/lib/db/types.ts`, which drops `creditDb` in `event-passes.ts`; then the database-security.md lines
  above. Live check after deploy (the alias): a TEST Pro checkout by a pass holder (Will's card), then `pass_credits`
  granted and converted, the balance transaction's `metadata.pass_credit_session`, and a resent delivery answering 200
  with no second transaction. No Worker, Vercel, Stripe-config or env change.
- **Calls his to overrule:** the six Questions above.
- **Look at first:** `claim_pass_credit` and `convert_pass_credit` in the migration (the once-ever rule and the lease),
  `webhook/pass-credit.ts`, and the checkout exception.
