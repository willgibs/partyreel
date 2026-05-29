@AGENTS.md

# Partyreel — agent operating guide

> **Read [`docs/STATUS.md`](docs/STATUS.md) FIRST.** It names the current phase
> and the exact next action. This file is the standing reference; STATUS is the
> "you are here." The `@AGENTS.md` import above is also load-bearing: this is
> **Next.js 16**, which has breaking changes from older Next — heed it.

Partyreel is a guest-powered event media platform. A host creates an event and
shares a **QR code**; guests scan it and upload photos/videos from their phones
with **no app install and no account** (just a display name). The host curates;
the growth loop is that every QR exposes Partyreel to future hosts. Marketing
site + host app + guest links all live on **one domain**. Full product context:
[`docs/PRD.md`](docs/PRD.md). Why-decisions: [`docs/adr/`](docs/adr/).

---

## Commands

```bash
pnpm dev            # next dev (Turbopack) on :3000
pnpm build          # production build
pnpm lint           # eslint  (NOTE: `next lint` was removed in 16 — use this)
pnpm typecheck      # next typegen && tsc --noEmit  (run before every commit)
pnpm format         # prettier --write .
pnpm test           # vitest run — unit tests for the pure data-integrity layer
pnpm db:types       # supabase gen types → src/lib/db/types.ts  (needs CLI + link)
pnpm db:push        # supabase db push                          (needs CLI + link)
```

Node is pinned in `.nvmrc` (22.21.1); package manager is **pnpm** (9.14.4). Run
`pnpm typecheck && pnpm lint && pnpm test` before committing — all must be clean.

---

## Stack (pinned — verify against docs before upgrading)

| Area       | Choice                               | Version                |
| ---------- | ------------------------------------ | ---------------------- |
| Framework  | Next.js (App Router, `src/`, TS)     | `16.2.6`               |
| React      | react / react-dom                    | `19.2.4`               |
| Styling    | Tailwind CSS (CSS-first)             | `^4`                   |
| UI kit     | shadcn (radix-nova) + `radix-ui`     | `^4.8.2` / `^1.4.3`    |
| Icons      | lucide-react                         | `^1.17.0`              |
| Data       | Supabase (`@supabase/ssr` + `-js`)   | `^0.10.3` / `^2.106.2` |
| Validation | zod (v4)                             | `^4.4.3`               |
| Toasts     | sonner                               | `^2.0.7`               |
| Storage    | Cloudflare R2 (`@aws-sdk/client-s3`) | `3.1056.0` _(Phase 2)_ |
| Payments   | Stripe                               | _(wired Phase 4)_      |
| Tests      | Vitest                               | `^4.1.7`               |

---

## Tooling & per-phase doc checks

**Before building each phase, re-verify the libraries/services it touches against
_current_ docs — do not trust training data.** This stack (Next 16, Tailwind v4,
zod v4, Supabase SSR) drifts fast and breaks in ways that look like your code is
wrong (`AGENTS.md` warns this Next ≠ the Next you know). The workflow:

1. List the libraries/APIs the phase will use.
2. Pull their current docs via the **Context7 MCP** (`resolve-library-id` →
   `query-docs`). Prefer this over web search and over memory for any
   library/framework/SDK/CLI question.
3. _Then_ write code. (Phase 1 caught zod v4's `.default()` input/output split
   and `qrcode.react` v4's `marginSize` — replacing deprecated `includeMargin` —
   this way.)

**MCP servers available — reach for the right one:**

- **Context7** — up-to-date library/framework/CLI docs. First stop for any "how
  does X work in this version" question.
- **Supabase MCP** — schema + DB ops: `list_tables`, `apply_migration` (the CLI
  isn't installed locally — this is how migrations land), `execute_sql`,
  `get_advisors` (run after every schema change), `generate_typescript_types`,
  `get_logs`. Project ref `ddafaemglzmuekbtjwzn`.
- **Vercel MCP** (+ the `vercel/vercel-plugin`) — deploys and build/runtime logs
  for debugging the live site (`partyreel.com`). It does **not** manage env vars
  or domains — those stay manual in the Vercel dashboard.
- **Cloudflare R2 MCP** — bucket CRUD (`r2_bucket_get/list/create/delete`),
  `accounts_list`/`set_active_account`, `search_cloudflare_documentation`. Account
  `7982310e22cd9430e06c34942acf3b9a`; Phase 2 bucket `partyreel` (ENAM). It does
  **not** create R2 API tokens or set bucket CORS — do those in the R2 dashboard,
  or set CORS via the S3 API (`@aws-sdk/client-s3` `PutBucketCorsCommand`) once creds exist.
- **Stripe MCP** — Stripe catalog + API ops for Phase 4 billing. Account
  `acct_1TcStrPtjqmVkBwk` ("Partyreel"). Read: `get_stripe_account_info`,
  `retrieve_balance`, `search_stripe_resources`, `search_stripe_documentation`,
  `stripe_api_search` + `stripe_api_details`. Write: `create_product`, `create_price`
  (+ `create_coupon`, `create_payment_link`, `update_subscription`). The generic
  `stripe_api_execute` exposes a **LIMITED catalog** (products, prices, coupons, promotion
  codes, payment links, customers, subscriptions) — it does **NOT** include
  `webhook_endpoints` or `billing_portal/configurations`, so the **webhook endpoint + the
  Billing Portal config are created in the Stripe dashboard by the human**, not the MCP.
  **⚠️ The connector is bound to ONE mode by its key — there is NO per-call mode flag, and
  the test toggle on connect is easy to miss.** **ALWAYS verify the mode before creating
  anything** via `retrieve_balance` → `livemode` (or a created object's `livemode`). The
  first connector was LIVE (created 3 products by mistake → archived); now TEST. See the
  Stripe-billing workflow + gotchas below.
- **shadcn MCP** — component registry browse/add (but see the gotcha: the
  radix-nova style has **no `form` item**).
- **Claude Preview / Chrome MCP** — start the dev server and drive a browser to
  verify UI before calling a task done.

**Stripe billing workflow (Phase 4) — who does what:**

- **The agent (via Stripe MCP) creates products + prices** in **test mode** (verify mode
  first!). **The human creates the webhook endpoint + Billing Portal config in the Stripe
  dashboard** — the MCP can't (see above). **Re-create everything in live + swap keys
  before launch** (test and live data are separate).
- **The human pastes the env values** the agent can't set: `STRIPE_SECRET_KEY` (Stripe
  never exposes the secret key via API — copy it from the dashboard), `STRIPE_WEBHOOK_SECRET`
  (the `whsec_…` from the dashboard webhook endpoint), and `STRIPE_PRICE_PRO_100/_500/_2TB`
  (the price IDs the agent creates) — into **`.env.local` + Vercel**, then redeploy. (The
  Vercel MCP does **not** manage env vars; the agent cannot set them.)
- Checkout/webhook can't run on localhost (same as auth/upload) — **verify on
  partyreel.com** with Stripe's test card `4242 4242 4242 4242`.
- **Verification limits (learned 2026-05-29):** the Chrome MCP **blocks interaction on
  Stripe-hosted pages** (`checkout.stripe.com`, `billing.stripe.com`) — "Cannot access this
  page" — so the actual card entry / Subscribe click must be **human-driven**; the agent can
  drive everything up to the redirect, then verify the result via the **Supabase MCP**
  (read `profiles.tier`/`storage_cap_bytes`). To exercise the **downgrade** webhook
  (`customer.subscription.deleted` → Free) without waiting for period-end, use the Stripe
  MCP `cancel_subscription` (immediate cancel) — then re-check the profile. (Verified the
  full upgrade→Pro and cancel→downgrade loop this way.)

---

## Critical gotchas (these have bitten people — do NOT relearn them the hard way)

**Next.js 16**

- `params` and `searchParams` are **Promises** — `const { token } = await params`
  in every page/layout/route handler. (See `src/app/(guest)/e/[token]/page.tsx`.)
- `cookies()` / `headers()` are **async** — `await cookies()`.
- Middleware was renamed to **Proxy**: the file is `src/proxy.ts` and exports a
  function named `proxy`. The old `middleware`/`middleware.ts` name no longer
  runs. It runs on the Node runtime by default — **do not** add a `runtime`
  config (Next 16 rejects it here).
- `next lint` is gone — lint with `eslint` (the `pnpm lint` script).

**Supabase / auth**

- Use `@supabase/ssr` (NOT the deprecated `auth-helpers`).
- Cookie API is **`getAll`/`setAll`** — never the old get/set/remove.
- Supabase's **OAuth Server** (project-as-identity-provider; the beta toggle) stays
  **OFF** — Partyreel is a _client_ of Google OAuth, not an IdP; nothing needs it.
- **Authorize with `supabase.auth.getUser()`, NEVER `getSession()`.** `getUser()`
  re-validates the JWT with the auth server; `getSession()` only decodes the
  (spoofable) cookie. The proxy refreshes the cookie but is **not** a security
  boundary (see "Security guardrails").
- Clients live in `src/lib/supabase/`: `client` (browser), `server` (RSC/route
  handlers, async), `middleware` (proxy session refresh), `admin` (service-role,
  `server-only`, bypasses RLS).

**Tailwind v4**

- CSS-first: `@import "tailwindcss";` in `globals.css`, tokens in `@theme`, dark
  via `@custom-variant dark`. No `tailwind.config.js`. PostCSS uses only
  `@tailwindcss/postcss`.

**zod v4** — use top-level `z.url()` (not `z.string().url()`); `error.issues`
(not `.errors`). See `src/lib/env.ts`.

**Cloudflare R2** — the AWS SDK auto-injects CRC checksums R2 rejects → silent
0-byte / `SignatureDoesNotMatch`. The client sets
`requestChecksumCalculation: "WHEN_REQUIRED"` + `responseChecksumValidation:
"WHEN_REQUIRED"`; single-PUT presign sets `signableHeaders: new Set(["content-type"])`.
Bucket CORS must allow PUT/POST/GET/HEAD + `content-type` and **expose `ETag`**
(required for multipart completion); also set a lifecycle rule to abort incomplete
multipart uploads. **Wired** in `src/lib/r2/{client,presign}.ts` — that config is
load-bearing, don't remove it. R2 vars stay `.optional()` in `env.ts`; `assertR2Env()`
asserts them lazily at request time so the app still builds without creds.

**Phase 3 — purge cron / moderation / safety gotchas**

- **`CRON_SECRET` + `assertCronEnv()`** — the purge cron (`/api/cron/purge`) authorizes
  by timing-safe-comparing `Authorization` against `Bearer ${CRON_SECRET}`. The var is
  `.optional()` in `env.ts` (build works without it); `assertCronEnv()` asserts it lazily
  at request time, mirroring `assertR2Env()`. **Vercel Cron auto-sends the bearer** —
  `vercel.json` registers the schedule (`0 4 * * *`) and Vercel injects
  `Authorization: Bearer $CRON_SECRET` itself; you don't wire the header.
- **R2 bulk helpers (`src/lib/r2/delete.ts`)** — `deleteR2Objects()` chunks to **≤1000
  keys** per `DeleteObjectsCommand` (the S3 API hard cap), and **deleting an absent key
  is success** (so a re-run after a partial purge is idempotent). `listR2Objects()`
  paginates via `ContinuationToken`. The orphan sweep relies on `parseMediaIdFromKey()`
  in `keys.ts` (single-sourced with `mediaObjectKey`).
- **`media.removed_at` is the purge grace clock — never use `updated_at` for it.** The
  `set_updated_at` trigger bumps `updated_at` on every touch, so the 7-day removed-media
  grace must read the stable `removed_at` stamp. Individual remove is **soft**
  (`status='removed'` + `removed_at`); the cron reclaims R2 + row after the grace.
- **`profiles.is_admin` is service-role-write-only** (same class as `tier`/`storage_*`) —
  it's **not** in the `grant update(...)` allowlist, so the client can never set it. Flip
  it for the operator account once via the Supabase MCP. `/admin` re-checks it server-side.
- **Testing the orphan sweep: you CANNOT force-demonstrate it with a fresh object.** R2/S3
  `LastModified` is set on PUT and is immutable — a newly-injected orphan never clears the
  `ORPHAN_MIN_AGE_HOURS` (24 h) guard, so the sweep correctly skips it. To prove the sweep
  end-to-end you'd need a pre-existing >24 h orphan (or a temporary threshold change); the
  parse/match correctness is otherwise covered by the `parseMediaIdFromKey` unit tests.
- **The event-settings form is NOT auto-save** (`event-settings-form.tsx`) — toggles like
  moderation mode only persist after clicking **Save changes** (toast "Settings saved.").
  When scripting/verifying a settings change, click Save and confirm the DB, don't assume
  the toggle wrote on change.

**Phase 4 — payments / storage-cap model gotchas**

- **The cap is account-level bytes, not item counts (Cut 4a).** `create_media` enforces
  `storage_used_bytes + file > cap + cap/10` (a **10% overflow buffer**) where
  `cap = coalesce(profiles.storage_cap_bytes, tier default)`. **Free's 2 GB default comes
  from `tier_limits()`** (so there's NO backfill and NO `handle_new_user` change — null
  `storage_cap_bytes` is fine); the Stripe webhook (4b/4c) writes `storage_cap_bytes` for
  paid tiers. Per-event item caps are **gone**.
- **The monthly meter is INGRESS BYTES, not counts.** `create_media` blocks when
  `storage_ledger.cumulative_bytes (this period) + file > monthly_ingress_bytes`.
  `cumulative_bytes` **never decrements** — it is both the meter and the churn defense.
  (`photo_count`/`video_count` stay for analytics but are no longer enforced.)
- **`tier_limits()` now returns `(max_events, monthly_ingress_bytes,
  default_storage_cap_bytes)`** and MUST mirror `tiers.ts` (`MAX_EVENTS` /
  `MONTHLY_INGRESS_BYTES` / `DEFAULT_STORAGE_CAP_BYTES`) — a Vitest parity test guards it.
  Changing its return columns needs **DROP + CREATE** (create-or-replace can't change a
  function's return type); `enforce_event_limit` still reads `max_events` so it's unaffected.
- **`get_upload_context` now returns `at_storage_cap` / `at_monthly_cap`** (was
  `at_event_cap`). It keeps the `p_type` param for signature/grant stability (no per-type
  caps remain). It's a coarse pre-check — `create_media` stays authoritative.
- **The `tier_type` enum still carries a retired `max`.** App code uses the 3-value
  `Tier` (`free|pro|event_pass`); coerce a DB `profiles.tier` with **`toBillingTier()`**
  (`max`→`pro`, unknown→`free`) before indexing the `tiers.ts` records. Don't try to drop
  the enum value (risky).
- **`tiers.ts` is client-import-safe — keep it secret-free.** No env, no Stripe Price IDs.
  The Price-ID↔plan mapping (`planForPriceId`) lives in `lib/stripe/` (Cut 4b), which reads
  env via `assertStripeEnv()`. `profiles.tier` / `storage_cap_bytes` stay
  service-role/webhook-write-only (never client-writable).

**Local dev vs. live testing** — auth and uploads are wired for **partyreel.com
only**. `localhost:3000` is deliberately NOT in Supabase's redirect allow-list, the
R2 bucket CORS origins, or `NEXT_PUBLIC_SITE_URL` — so `pnpm dev` renders UI but
**cannot complete sign-in or an upload** (the OAuth/magic-link redirect is rejected
and the R2 PUT is CORS-blocked). Verify auth/upload/gallery flows on the deployed
site (partyreel.com), not locally — local is fine only for pure UI/render work. (We
standardized on live testing; localhost was removed from those allow-lists on purpose.)

**Stripe (Phase 4)**

- **Webhook raw body.** `/api/stripe/webhook` MUST read `await req.text()` for
  `getStripe().webhooks.constructEvent(body, sig, secret)`; `req.json()` mutates the bytes
  and the signature check fails. Bad/missing signature → 400. `runtime="nodejs"` +
  `dynamic="force-dynamic"`.
- **The webhook is the SOLE writer of `profiles.tier` / `storage_cap_bytes` /
  `stripe_subscription_id`** — always via the service-role admin client. Never set tier
  from the client or the checkout route. Checkout only creates/persists
  `stripe_customer_id` (so subscription events map back: `eq("stripe_customer_id", …)`,
  fallback `client_reference_id`/`metadata.userId`).
- **`assertStripeEnv()`** (lazy, request-time; mirrors `assertR2Env`/`assertCronEnv`)
  asserts all 5 Stripe vars together; `getStripe()` is a memoized lazy client so the app
  builds without keys. **Pin `apiVersion`** to the installed SDK's bundled version
  (`stripe@22.2.0` → `"2026-05-27.dahlia"`); bump deliberately on SDK upgrade.
- **Provisioning logic is a pure fn** (`src/lib/stripe/provision.ts`
  `resolveSubscriptionUpdate`) — unit-tested with fixtures; returns ABSOLUTE values so
  re-delivered events are idempotent. `customer.subscription.deleted`/non-active →
  downgrade (`tier=free`, `storage_cap_bytes=null` → 2 GB default). `plans.ts` is
  `server-only` (reads env), so don't import it in Vitest — test `provision.ts` instead.
- **Price IDs ↔ plans** live in `src/lib/stripe/plans.ts` (env-referenced via
  `PLANS[].stripePriceEnvKey`; `PRICE_ENV` map), NOT in `tiers.ts` (client-safe/secret-free).

**Transactional email + lifecycle cron (fast-follows)**

- **Resend** is the email provider (`resend` dep). `RESEND_API_KEY` + `EMAIL_FROM` (a
  verified sender, e.g. `Partyreel <noreply@partyreel.com>`) via lazy `assertResendEnv()`.
  **Not configured until the human sets the key + verifies a sending domain (DNS).**
- **Always send via `sendOnce({ kind, dedupeKey, to, subject, html })`**
  ([src/lib/email/send.ts](src/lib/email/send.ts)) — never `getResend().emails.send`
  directly. It CLAIMS a `sent_emails` row (unique `(kind, dedupe_key)`) before sending, so
  the daily cron can call it every run and Resend is hit **at most once per state** — the
  frugality guard for the 3,000/mo free tier. On send failure it releases the claim (retries
  next run; never double-sends). Templates: `src/lib/email/templates.ts` (plain HTML).
- **The purge cron is now a daily lifecycle job** ([api/cron/purge/route.ts](src/app/api/cron/purge/route.ts))
  with **6 sweeps**: expired_events, removed_media, orphans, expired_passes,
  **over_capacity**, **renewal_nudges** (each independently try/caught).
- **Over-capacity** targets only lapsed paid accounts (Free is upload-blocked before it can
  exceed cap). Decisions key off **ACTIVE bytes** (non-removed media in live events), NOT
  `storage_used_bytes` (which only drops at hard-delete) — so a just-reduced account doesn't
  re-trigger. over → set `storage_grace_until` (`OVER_CAP_GRACE_DAYS`=45) + email; near the
  deadline → reminder; past grace → **auto-reduce** (`selectForAutoReduce` largest-first →
  the Phase-3 removed path reclaims after 7 d) + email; back under cap → clear grace.
  `profiles.storage_grace_until` is service-role-write-only. **Cold storage was evaluated +
  rejected** (R2 IA only ~33% cheaper; Glacier = cross-cloud project) — revisit IA via an R2
  lifecycle rule only if tail cost grows.
- **Event Pass renewal** = a cheaper one-time price (`STRIPE_PRICE_EVENT_PASS_RENEWAL`) for
  the SAME `event_pass` plan (`planForPriceId` maps it there). Checkout `{ renewal: true }`
  is gated to current/recent pass holders; the dashboard "Renew Event Pass" button + the
  `renewal_nudges` email (14 d pre-expiry) point at it.
- **Event Pass (Cut 4c) is a ONE-TIME payment, not a subscription** — checkout uses
  `mode:"payment"` (chosen from `plan.billing === "one_time"`), so **no
  `customer.subscription.*` event fires**; it's provisioned from
  **`checkout.session.completed`** via `session.metadata.plan_id === "event_pass"`
  (`resolveEventPassCheckout`). `tier_expires_at` is derived from `session.created +
  termDays` (NOT `now()`) so re-delivered events are idempotent (don't extend the term).
  `profiles.tier_expires_at` is service-role-write-only (not in the `grant update`
  allowlist). The **purge cron's 4th sweep** (`sweepExpiredPasses`) downgrades lapsed
  passes to Free (cap reset → minimal over-capacity; media stays).

**Postgres / plpgsql** — integer literals are **int4**, so `2 * 1024 * 1024 * 1024`
(2 GB) overflows int4 (max ~2.15e9) and throws `integer out of range` — even when
assigned to a `bigint` constant, during DECLARE init _before the body runs_. Force
bigint: `2::bigint * 1024 * 1024 * 1024`. (This silently broke `create_media` for
every upload until the Phase 2 RPC-contract test caught it — migration
`…_fix_create_media_video_bytes_overflow`.)

**Dependencies / pnpm**

- **`shadcn` (the CLI) is a real _build_ dependency — do not remove it.**
  `globals.css` does `@import "shadcn/tailwind.css"` (the radix-nova preset), so
  the build fails (`Can't resolve 'shadcn/tailwind.css'`) without it. It stays in
  `devDependencies`.
- **One zod, pinned via a pnpm override.** The `shadcn` CLI transitively pulls in
  `zod@3.25.76` (via `@modelcontextprotocol/sdk`). Left alone, pnpm hoists that
  copy and `@hookform/resolvers` resolves `zod/v4/core` against it — so every
  `zodResolver(...)` fails to typecheck with `_zod.version.minor: Type '4' is not
assignable to type '0'`. Fixed by `pnpm.overrides: { "zod": "$zod" }` in
  `package.json`, which forces the single app `zod@^4.4.3`. Don't drop that
  override.
- **The radix-nova registry has no `form` item.** `src/components/ui/form.tsx` is
  hand-authored (still semicolon-free to match the other generated primitives);
  don't expect `shadcn add form` to produce it.

---

## Architecture & routing

One Next app, route groups on one domain (ADR-0002):

```
src/app/
  layout.tsx              # the ONLY root layout (html/body, fonts, Providers, Toaster)
  (marketing)/            # public: /, /pricing, /privacy, /terms   → MarketingHeader/Footer
  (auth)/                 # public: /login, /auth/callback          → no gate (see below)
  (app)/                  # GATED: /dashboard …  layout.tsx runs getUser() → redirect /login
  (guest)/                # token routes: /e/[token] (join+upload), /a/[token] (public album)
  api/                    # route handlers — most are 501 stubs until their phase
```

- **Login lives in `(auth)`, not `(app)`, on purpose.** The `(app)` layout
  redirects anon users to `/login`; if `/login` were under that gate it would
  redirect to itself forever.
- The **public album `/a/[token]` uses the always-dark `gallery` surface**
  (`bg-gallery text-gallery-foreground`) so media is the hero in any theme.

---

## DRY single-sources (do NOT duplicate these elsewhere)

| Concern                                                | Single source                                            |
| ------------------------------------------------------ | -------------------------------------------------------- |
| Pricing / tier limits (app side)                       | `src/lib/constants/tiers.ts`                             |
| Pricing / tier limits (DB enforcement)                 | `public.tier_limits()` SQL fn — **must mirror tiers.ts** |
| Universal per-file media limits (5 min / 2 GB / 50 MB) | `src/lib/media/limits.ts`                                |
| R2 object keys (+ `parseMediaIdFromKey`)               | `src/lib/r2/keys.ts`                                     |
| R2 bulk delete / list (purge cron)                     | `src/lib/r2/delete.ts`                                   |
| DB access (queries/mutations)                          | `src/lib/db/*` — never inline SQL in components          |
| Env vars (zod-validated)                               | `src/lib/env.ts` (`env` public, `serverEnv` server-only) |
| `cn()` class merge                                     | `src/lib/utils.ts`                                       |

> Tier limits unavoidably live in **two** places (TypeScript for UX, SQL for
> enforcement). They are kept in lockstep by hand — if you change one, change the
> other and re-verify. `lib/constants/tiers.ts` is the human-authored source;
> `tier_limits()` mirrors it.

---

## Database workflow

- Schema is **Supabase-native**: SQL migrations + RLS + generated types are the
  source of truth (ADR-0001). Migrations live in `supabase/migrations/`.
- **Phase 0 applied migrations via the Supabase MCP** (`apply_migration`) because
  the CLI isn't installed locally. The migration _files_ in the repo and the live
  DB are kept in sync by filename = applied version. To use the pnpm scripts
  (`db:types`, `db:push`) later, install the CLI and
  `supabase link --project-ref ddafaemglzmuekbtjwzn`.
- `src/lib/db/types.ts` is **generated — do not hand-edit.** It's in
  `.prettierignore` so regeneration stays churn-free (it must match `supabase gen
types` output byte-for-byte).
- After any schema change: run advisors (`get_advisors`) and regenerate types.

**`get_advisors` flags the 6 capability-token RPCs as ACCEPTED BY DESIGN — do not
"fix" them.** It reports `get_event_by_qr_token`, `get_public_album`,
`create_guest`, `create_media`, `get_upload_context` (Phase 2), and `create_report`
(Phase 3) as SECURITY DEFINER functions executable by `anon` (and `authenticated`).
That is intentional: the opaque token IS the authorization (ADR-0004). Revoking
their EXECUTE grant breaks the entire anonymous guest flow. (The trigger-only
functions were locked down in migration `…_lock_down_trigger_functions` — those are
_not_ meant to be callable.) The separate "Leaked Password Protection Disabled" WARN
is unrelated — Partyreel uses magic-link/OAuth, not passwords.

**`purge_media_rows` must stay REVOKED from `anon`/`authenticated` (service-role
only).** It's SECURITY DEFINER like the others but service-role-internal (the purge
cron calls it via the admin client), so it must **never** appear in the advisor list
above — if it ever shows up there, an over-broad grant slipped in. Same protection
class as the trigger-only functions.

---

## Security guardrails (non-negotiable)

- **RLS is the security boundary.** The proxy only refreshes cookies; it does not
  authorize. Re-verify authz with `getUser()` in every Server Function / route
  handler AND rely on RLS policies / security-definer RPCs at the DB.
- **Anonymous guests use capability tokens** validated inside security-definer
  RPCs (ADR-0004). Guests have no JWT; never give `anon` direct table access.
- **Never expose raw R2 object keys/URLs to the browser.** `get_public_album`
  returns keys for **server-side presigning only** — presign before render.
- **Never trust the client for tier/entitlements.** The Stripe webhook is the
  source of truth for `profiles.tier`; `tier` / `storage_cap_bytes` /
  `storage_used_bytes` are writable only by service-role / RPC, never the client.
- **The service-role / secret key is server-only.** It lives behind
  `src/lib/supabase/admin.ts` (`import "server-only"`) and must never be prefixed
  `NEXT_PUBLIC_` or reach a client bundle.
- **Events have no end date** — only deletion frees an event slot (this is the
  anti-abuse core; see tiers.ts and ADR/PRD). Don't add an "end event" path that
  keeps media accessible.

---

## Working conventions

- **Leave WHY comments for the next agent.** Explain non-obvious decisions,
  gotchas, and what NOT to do — the existing files model this density. Don't
  narrate the obvious; do capture hard-won findings.
- **Keep the knowledge docs current as you learn.** This file, `docs/STATUS.md`,
  `docs/ROADMAP.md`, `docs/PRICING.md`, and the ADRs are living — when you hit a new gotcha, finish
  a phase, or change an approach, update them in the same change. Advance STATUS
  to the new "you are here" and tick ROADMAP boxes as work lands; a future agent
  (or future you) should be able to trust them. (STATUS/ROADMAP upkeep applies
  while the phased roadmap is active; once it's done the project shifts to one-off
  tasks and those two can leave the rotation — this file stays the any-task guide.)
- **Test data integrity as you build.** Each phase ships tests for the data it
  touches: Vitest unit tests for pure logic (`pnpm test`) **plus** a rolled-back
  Supabase-MCP RPC contract check for the SQL the phase exercises (run the RPCs
  inside a `DO $$ … RAISE EXCEPTION $$` block so nothing persists — see
  [`docs/ROADMAP.md`](docs/ROADMAP.md) "Picking up a phase"). This net caught the
  `create_media` int4 overflow in Phase 2 before any real upload was attempted.
- Prefer editing existing files; reuse the design-system primitives in
  `src/components/ui` and shared composites in `src/components/shared`.
- shadcn UI components (`src/components/ui/*`) are authored **without
  semicolons** by the generator; app code uses semicolons. Don't reformat the
  generated UI files to "match."
- **Markdown is prettier-ignored** (`*.md` in `.prettierignore`) — prettier's
  prose-wrap mangles docs (a wrapped line starting with `+`/`-` becomes a list item).
  Author docs by hand; `pnpm format` / `format:check` cover code only.
- **Git:** never `git add -A` (stage files explicitly — avoids committing
  `.env.local` or stray files); never commit secrets; never skip hooks
  (`--no-verify`) or force-push without an explicit ask.
- This is the foundation phase output. **No working end-user features ship until
  their roadmap phase** — keep API routes honest 501 stubs until then.
