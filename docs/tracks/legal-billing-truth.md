---
track: legal-billing-truth
status: handed-off
cut: "efe8118"
preview: true
owns:
  - docs/PRICING.md
  - src/components/marketing/legal/legal-document.tsx
  - src/components/marketing/sections/home/privacy.tsx
  - src/lib/constants/features.ts
  - src/components/marketing/jsonld.tsx
  - content/blog/scanned-a-qr-code-where-your-photos-go.mdx
  - src/lib/env-example-parity.test.ts
  - src/app/legal-print.test.ts
reads:
  - src/lib/env.ts
  - src/lib/constants/legal.ts
  - src/lib/constants/legal-privacy.tsx
  - src/lib/stripe/plans.ts
---
# lp/legal-billing-truth

**Goal.** The launch runbook is true and the legal surface is launch-grade. (1) **The Stripe cutover
runbook right:** `env.ts` carries TEN Stripe values (the secret, the webhook secret, three monthly and
three annual Pro prices, the event pass and its renewal), three products, six recurring and two
one-time prices, and the Billing Portal must permit switching between all six Pro prices; `PRICING.md`
and `billing-caps.md` still say "5 env vars" and "three Pro prices". (2) **`.env.example` parity with
`env.ts`:** every key `env.ts` reads appears in `.env.example` with a placeholder and a one-line
comment, pinned by `src/lib/env-example-parity.test.ts`. (3) **The `LEGAL_PARTY` flip rehearsed:** on a
throwaway commit fill the placeholders in `src/lib/constants/legal.ts`, flip both documents to
`effective` with a date, run `legal.test.ts`, record the exact diff in Handoff, revert; the day-of flip
is then a known diff. (4) **Legal pages that print:** a `@media print` block (the spill engine's block
in `globals.css` is the pattern) so the cinema hero prints light, page breaks fall between sections and
links show their targets; pinned by a test on the block's presence. (5) **The EXIF claim on its four
sites here:** `sections/home/privacy.tsx`, `constants/features.ts` (twice), `jsonld.tsx` and the blog
post; the remaining two (`never-rides-along.tsx`, `feature-pages.ts`) belong to the marketing follow-ons
track; the help article is already right. Size S to M.

**Rulings in force.** **The EXIF wording** (Will, 2026-09-02, the "for the common formats" clause):
"Location data is stripped in the browser before a photo ever uploads, for the common formats." The
ratified long form is the privacy policy's own paragraph in `src/lib/constants/legal-privacy.tsx`
(HEIC/HEIF/AVIF/WebM pass through untouched); shorter sites keep the clause, never the unconditional
claim.

**Also touches, by ruling (explain in the lane check):** `.env.example` at the repo root; one `@media
print` block appended to `src/app/globals.css` (this wave only; a later track owning the marketing
sheet may move it).

**Verify on.** The branch preview: the home privacy section, the features page copy, a `curl` of the
JSON-LD, the blog post; `/privacy` and `/terms` printed to PDF is the one human step (ask Will; the CSS is
pinned by test meanwhile); `pnpm test` for the parity pin and `legal.test.ts` on the rehearsal commit.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/billing-caps.md` line 133-138 (the "Stripe MCP runbook" bullet on what the human
  pastes): the eight `STRIPE_PRICE_*` IDs instead of a vague "the IDs", plus the six-price portal
  requirement and why it is load-bearing.
- `docs/systems/billing-caps.md` line 143-146 (the last runbook bullet): "the 5 env vars" becomes the
  ten env values, the catalog shape (4 products / 8 prices) and the rollback line.

## Deferred (ROADMAP one-liners, bucket named)

- **Launch checkpoint** — the "Stripe test → live cutover" line says "the 3 products and 8 prices";
  the account carries **4** products (3 Pro + Partyreel Event Pass, which owns the two one-time
  prices), verified against the test-mode API 2026-09-02.
- **Launch checkpoint** — attach to the existing portal item: the default portal configuration
  (`bpc_1TcTxWPtjqmVkBwkcAldFEZA`) enables `subscription_update` with `default_allowed_updates:
  ["price"]` and `proration_behavior: always_invoice`, but the API returns NO `products` list, so
  what a host can actually switch to is unverified from the API side; it needs a dashboard look, or
  a portal session opened as a Pro host.
- **Launch checkpoint** — the three Pro products are named with an em-dash in Stripe ("Partyreel Pro
  — 100 GB") and those names render in Checkout and the portal: create the live catalog without one.
- **Launch checkpoint** — the `LEGAL_PARTY` flip also needs one line of `src/lib/constants/legal.test.ts`
  (the pending status-line assertion reads the LIVE meta, so flipping the status fails it); the
  rehearsal diff below carries the fix, or the test can be made flip-proof ahead of time by a track
  that owns that file.
- **Launch checkpoint** — the clean-launch-point paragraph says "the EXIF claim corrected on its six
  sites"; there is a SEVENTH nobody owns: `src/lib/content/llms.ts` line 108 still says "GPS location
  metadata is stripped from uploads" unconditionally, and it feeds the AI-crawler surface (llms.txt).
  Not in this track's `owns`, not in `marketing-followons`'s either.

## Handoff

- Head = this manifest commit, sitting on `6b2882a` (the rehearsal revert, the last code commit);
  pushed. Preview `partyreel-git-lp-legal-billing-truth-partyreel.vercel.app` (`preview: true` from
  this commit, so this is the first push that builds one).
- **Cut + sync.** Cut at `efe8118`. By boot time `origin/launch-prep` had moved two docs-only commits
  ahead (`aa5eaf6`, `cd8da95`), so the branch fast-forwarded onto `cd8da95` before its first commit,
  which is why `git merge-base --is-ancestor origin/launch-prep HEAD` holds. It moved again minutes
  after the handoff push (the `product-truth` integration, 10 commits), so the branch was merged
  (never rebased) onto **`82a6711`** and the full gate re-run on the merged tree. Zero conflicts and
  zero overlap: their 19 files touch the dashboard, guest and upload surfaces, `tiers.ts` and three
  docs, none of them this lane's.
- **Gates on the handoff tree** (each run to its own exit code, never piped): `pnpm typecheck` ok ·
  `pnpm lint` ok · `pnpm test` ok (1533 tests, 178 files) · `pnpm build` ok (244 static pages).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`), 12 files:
  - owned: `docs/PRICING.md`, `src/components/marketing/legal/legal-document.tsx`,
    `src/components/marketing/sections/home/privacy.tsx`, `src/lib/constants/features.ts`,
    `src/components/marketing/jsonld.tsx`,
    `content/blog/scanned-a-qr-code-where-your-photos-go.mdx`, `src/lib/env-example-parity.test.ts`,
    `src/app/legal-print.test.ts`, and this manifest.
  - `docs/systems/billing-caps.md`: the two System-doc edits listed above.
  - `.env.example` and `src/app/globals.css`: the two exceptions this manifest already rules.
  - **One `owns` line was ADDED at boot**: `src/app/legal-print.test.ts`, the print pin. The goal asks
    for a test on the print block and the stub named no home for it; it sits with the other CSS
    contract tests in `src/app/`, and no peer manifest claims that path.
  - `src/lib/constants/legal.ts` and `legal.test.ts` do NOT appear: the rehearsal commit and its
    revert cancel out. Both commits stay on the branch on purpose.
- **The LEGAL_PARTY rehearsal** (`bb1dcc0`, reverted by `6b2882a`). The whole day-of diff, run green:
  ```diff
  --- a/src/lib/constants/legal.ts
  +++ b/src/lib/constants/legal.ts
  @@ privacy + terms, both entries
  -    status: "pending-review",
  -    effectiveDate: null,
  +    status: "effective",
  +    effectiveDate: "2026-09-15",
  @@ LEGAL_PARTY
  -  entityName: "[ENTITY NAME]",
  -  state: "[STATE]",
  -  address: "[ADDRESS]",
  -  dmcaAgent: "[DMCA AGENT]",
  +  entityName: "Partyreel, Inc.",
  +  state: "Delaware",
  +  address: "1 Example Street, Suite 100, Wilmington, DE 19801",
  +  dmcaAgent: "Partyreel Legal",
  --- a/src/lib/constants/legal.test.ts
  +++ b/src/lib/constants/legal.test.ts
  @@ "status lines read as intended in both states"
  -    expect(legalStatusLine(LEGAL_DOCUMENTS.privacy)).toBe(
  -      "Version 1.0 · Pending counsel review · Effective on launch",
  -    );
  +    expect(
  +      legalStatusLine({
  +        ...LEGAL_DOCUMENTS.privacy,
  +        status: "pending-review",
  +        effectiveDate: null,
  +      }),
  +    ).toBe("Version 1.0 · Pending counsel review · Effective on launch");
  ```
  Values are illustrative and were never meant to ship. **The finding:** the flip is NOT one file.
  `legal.test.ts` pinned the pending line by reading the live privacy meta, so the flip failed a test
  about a function, not about the change. Everything else held: the placeholder scan passed on both
  documents (the two `[STATE]` tokens left in `legal-terms.tsx` are inside comments, invisible to
  `legalPlainText`), typecheck, lint, all 1533 tests and `pnpm build` were green with both documents
  effective, and `/privacy` and `/terms` still prerendered. `version` and `lastUpdated` were left
  alone: whether counsel's sign-off bumps them is a judgment call at flip time, and the sitemap reads
  `lastUpdated`.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** no migrations, no Worker, no code
  change. Three things only a human or the Orchestrator can do, all recorded under Deferred: confirm
  the Billing Portal's six-price switch in the dashboard, rename the em-dashed Stripe products, and
  confirm the Vercel project carries all ten `STRIPE_*` values (`.env.local` does: all eight price
  IDs match the live test catalog, checked read-only via the Stripe API 2026-09-02, no mutation).
- **Read-only Stripe verification** used the test key already in `.env.local` (`livemode:false`
  confirmed first); nothing was created, updated or archived, and no key was printed.
- **The one human step:** print `/privacy` and `/terms` to PDF and look. The CSS is pinned by
  `src/app/legal-print.test.ts` (block + hooks) and was verified in the browser by flipping the print
  media queries on: the cinema hero renders light, header/footer gone, the hero eyebrow and subhead
  visible (they are `[data-mkt-reveal]` slots, which print blank without the neutralizer), the
  address line shown, and `a[href="/terms"]::after` computed to `" (partyreel.com/terms)"`. What a
  human still has to judge: margins and where the breaks actually land across ~15 and ~22 sections.
- **Verified on the branch preview** (deploy READY at the synced head): the home privacy ledger, the
  `/features` privacy card, the blog post's three sites, `/privacy` carrying the three print hooks,
  and the `SoftwareApplication` JSON-LD parsed out of the home page, whose `featureList` now reads
  "Location data is stripped in the browser before a photo ever uploads, for the common formats."
- **Look at first:** `/privacy` printed to PDF (the human step); the home privacy ledger and the
  `/features` privacy card; `docs/PRICING.md` "Stripe setup", whose catalog table is the runbook the
  cutover will actually be read from.
- ADR-0023's line "must permit switching between the three Pro prices" predates the annual round and
  now reads as three; left alone as point-in-time rationale (the current truth is in billing-caps.md).

## Record

Merged into `launch-prep` at `<sha>` (2026-09-02). The launch runbook's billing half stopped lying:
the Stripe section of `PRICING.md` had described the 2026-05-29 catalog (three products, three
monthly prices, five env values), so it was rewritten around the catalog as it actually stands, 4
products and 8 prices with every test Price ID re-verified against the account, ten env values to
swap, and a portal that must offer all six Pro prices because it is the only route between monthly
and yearly; `billing-caps.md`'s runbook bullets were corrected in place. `.env.example` had drifted
from `env.ts` by thirteen keys (the whole Stripe price set included) and now carries all thirty with
a comment each, pinned both ways by `env-example-parity.test.ts`. The `LEGAL_PARTY` flip was
rehearsed on a throwaway commit and reverted: it is green, and it needs one line of `legal.test.ts`
nobody had noticed. `/privacy` and `/terms` gained a print stylesheet (light room, breaks between
sections, links printing their targets), pinned by `legal-print.test.ts`. The EXIF claim took its
ruled clause on this track's four sites, including the JSON-LD that feeds assistants.
