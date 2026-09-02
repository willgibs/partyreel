---
track: legal-billing-truth
status: open
cut: "efe8118"
preview: false
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

- `docs/systems/billing-caps.md`: the cutover runbook (the ten values, the eight prices, the six-price
  portal switch, the rollback line).

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff

- to be filled at handoff

## Record

- to be filled at integration
