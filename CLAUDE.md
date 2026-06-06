@AGENTS.md

# Partyreel — agent operating guide

> **Orient first.** [`docs/STATUS.md`](docs/STATUS.md) is the "you are here" (what's live,
> what's blocked on a human); [`docs/SYSTEMS.md`](docs/SYSTEMS.md) is the **feature map** (every
> system, where it lives, its invariants — skim it when a goal lands);
> [`docs/ROADMAP.md`](docs/ROADMAP.md) is the backlog + the pick-up-a-task loop. This file is the
> standing operating guide. The phased build is **done** — the project is in one-off-task mode.
> The `@AGENTS.md` import above is load-bearing: this is **Next.js 16**, with breaking changes
> from older Next — heed it.

Partyreel is a guest-powered event media platform. A host creates an event and
shares a **QR code**; guests scan it and upload photos/videos from their phones
with **no app install and no account** (just a display name). The host curates;
the growth loop is that every QR exposes Partyreel to future hosts. Marketing
site + host app + guest links all live on **one domain**. Full product context:
[`docs/PRD.md`](docs/PRD.md). Why-decisions: [`docs/adr/`](docs/adr/).

---

## Infrastructure ownership (consolidated under partyr33l@gmail.com — 2026-06-06)

All app infrastructure was migrated off the founder's personal accounts (willg97@gmail.com /
hi@willgibs.com) onto a dedicated owner account **partyr33l@gmail.com ("P3")** — clean consolidation
and sale-readiness. Runbook: [`.claude/plans/we-ve-basically-been-setting-optimized-sutton.md`](.claude/plans/we-ve-basically-been-setting-optimized-sutton.md).

**Done — all P3-owned (verified live):**

- **Supabase** — project `ddafaemglzmuekbtjwzn` (ref + API keys UNCHANGED — the project was _transferred_,
  not recreated), now in P3's **"Partyreel Team"** org on **Pro** (daily backups ON; PITR off, pricey,
  revisit). ⚠️ P3's Supabase MCP may be connected **read-only** — the database tool group
  (`execute_sql` / `list_tables` / `apply_migration`) returns `MCP error -32600 … permission` if so;
  re-auth the connector with the database scope (or use the dashboard SQL editor) for writes.
- **Cloudflare R2** — NEW account **`8bd90d2f6a374d6cdff2f379e929b060`** (old `7982310e…` deleted),
  bucket `partyreel` (ENAM), new **Object R/W** token. The account-id (S3 endpoint) changed; CORS +
  abort-incomplete-multipart lifecycle re-applied. Setting CORS/lifecycle needs an **Admin** R2 token
  (the app's Object token can't); a temp Admin token was used then revoked.
- **Stripe** — same account `acct_1TcStrPtjqmVkBwk` (TEST mode), ownership transferred to P3 (keys /
  price IDs / webhook / portal all preserved → no env change).
- **Sentry** — same org `partyreel` / project `javascript-nextjs`, ownership transferred to P3 (DSN
  unchanged; rotated to a new Org Auth Token).
- **Resend** — new account under P3; `partyreel.com` re-verified; the Supabase custom-SMTP password
  updated to the new key.
- **Google OAuth** — new GCP project + Web client `401819547646-…apps.googleusercontent.com` under P3
  (old project shut down), set in the Supabase Google provider (callback unchanged since the ref held).
- **In-app operator** — `partyr33l@gmail.com` is `is_admin` + TOTP MFA (AAL2); `hi@willgibs.com` retired
  (`is_admin=false`). `CONTACT_NOTIFY_EMAIL` → P3 (until a partyreel.com mailbox exists).

**Deferred (still under willgibs / GoDaddy):**

- **Vercel hosting** — prod still on the **willgibs Hobby** project (free), already running on P3's
  backing services; move to a P3 **Pro** project at launch (so the 14-day Pro trial isn't burned during
  the build phase). A P3 Pro project is already validated (`partyreel-ten.vercel.app`) and deploys the
  willgibs repo via a cross-account Vercel GitHub-App grant. Domain cutover (remove from old project →
  add to new + verify; watch for a `_vercel` TXT) happens then.
- **Domain + DNS** — `partyreel.com` is registered AND DNS-hosted at **GoDaddy** (`ns05/06.domaincontrol.com`);
  → P3 **Cloudflare** (registrar + DNS) ~late July (GoDaddy transfer-locked until then). Cloudflare is
  R2-only today.
- **GitHub repo** — stays `github.com/willgibs/partyreel`; transfer to P3 **at sale** (redirects persist;
  re-point the Vercel Git connection then).

**Notes:** Supabase + Vercel go **paid Pro** deliberately (scale-early + ADR-0013 DB backups),
overriding the default cost-frugality lean. **"Allow new signups" is intentionally OFF** in Supabase
Auth (pre-launch lockdown) — it must be ON at launch, and toggled on briefly to register a new internal
account (e.g. P3's operator profile).

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
  `8bd90d2f6a374d6cdff2f379e929b060` (P3; old `7982310e…` deleted); bucket `partyreel` (ENAM). It does
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
- **Account email+password (ADR-0011) is an ADDITIONAL credential, not a replacement.** The password
  lives in `auth.users.encrypted_password` (Supabase-managed) — no app table stores it; the same account
  is reachable via password, code, magic-link, AND Google (identities auto-link by verified email).
  Flows: create = OTP-verify then `updateUser({password})`; a passwordless host adds one in `/account`
  while logged in; return = `signInWithPassword`; forgot = reuse OTP → `/account?reset=1`.
  **`updateUser({password})` runs on the BROWSER client** (it rotates the session; the browser cookie
  write is unconditional). The current-password re-check before a CHANGE is the `verify_current_password`
  RPC (READ-only → no session disruption); first-time SET needs only the session.
  **`signInWithPassword`'s error is GENERIC by design** (wrong pw / no pw set / unknown email are
  indistinguishable, anti-enumeration) — NEVER say "wrong password"; offer the code/Google/forgot
  affordances. The shared `<EmailSignIn>` stays UNCHANGED (guests use it; password UI is additive in
  `password-sign-in.tsx`). **Dashboard lockstep:** keep "Secure password change" **OFF** (ON forces a
  reauth nonce → breaks the RPC design); "Minimum password length" must equal `MIN_PASSWORD_LENGTH` (8)
  in [validation/auth.ts](src/lib/validation/auth.ts); enable leaked-password protection.
- **GOTCHA — `has_password()` must NOT read `auth.users.encrypted_password`.** GoTrue writes a NON-NULL
  bcrypt PLACEHOLDER for every email OTP/magic-link signup (`providers=['email']`; Google-origin stays
  NULL), so `encrypted_password IS NOT NULL` is true for OTP-origin hosts who never set a password —
  they'd see the `/account` CHANGE form asking for a current password they don't have (live-caught, fixed
  in `…210158_account_password_set_flag`). Fix: a service-role-only `profiles.password_set_at`, stamped
  by **`mark_password_set()`** which the client calls right after every successful `updateUser({password})`;
  `has_password()` reads the flag. The THREE account RPCs (`has_password` / `verify_current_password` /
  `mark_password_set`) are authenticated-only (0029), never anon (0028). See STATUS "Blocked on a human".

**Tailwind v4**

- CSS-first: `@import "tailwindcss";` in `globals.css`, tokens in `@theme`, dark
  via `@custom-variant dark`. No `tailwind.config.js`. PostCSS uses only
  `@tailwindcss/postcss`.
- **Theme is global via `next-themes`** (`attribute="class"`, `defaultTheme="system"`,
  `enableSystem`), mounted in `src/components/providers.tsx`; `<html>` carries
  `suppressHydrationWarning` (the pre-paint class set). The host account menu
  (`UserMenu`) is the ONLY toggle UI (Light / Dark / System) — the preference is
  global, so it styles the marketing site too. The always-dark gallery (`--gallery*`,
  never overridden in `.dark`) is theme-immune.

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

- **The cap is account-level bytes, not item counts (Cut 4a; cap meter reworked by Recovery
  Phase 1).** `create_media` enforces `host_active_bytes(host) + file > cap + cap/10` (a **10%
  overflow buffer**) where `cap = coalesce(profiles.storage_cap_bytes, tier default)`.
  **`host_active_bytes()`** (migration `…_active_bytes_cap_meter`) sums NON-removed media in
  NON-deleted events, so deleting frees cap room immediately (the Recovery "Recently deleted"
  model). It is SECURITY DEFINER, REVOKED from anon/authenticated (internal-only — must NEVER
  appear in the 0028/0029 advisor lists), and is the single source the 4 upload fns + the
  over-cap sweep share. **`profiles.storage_used_bytes` is now the PHYSICAL meter ONLY** (++ on
  create, −− only in `purge_media_rows`); it NO LONGER gates uploads. **Free's 2 GB default
  comes from `tier_limits()`** (so there's NO backfill and NO `handle_new_user` change — null
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
  caps remain). It's a coarse pre-check — `create_media` stays authoritative. (Both read
  `host_active_bytes` since Recovery Phase 1, so the pre-check and the authoritative check
  can't drift.)
- **The `tier_type` enum still carries a retired `max`.** App code uses the 3-value
  `Tier` (`free|pro|event_pass`); coerce a DB `profiles.tier` with **`toBillingTier()`**
  (`max`→`pro`, unknown→`free`) before indexing the `tiers.ts` records. Don't try to drop
  the enum value (risky).
- **`tiers.ts` is client-import-safe — keep it secret-free.** No env, no Stripe Price IDs.
  The Price-ID↔plan mapping (`planForPriceId`) lives in `lib/stripe/` (Cut 4b), which reads
  env via `assertStripeEnv()`. `profiles.tier` / `storage_cap_bytes` stay
  service-role/webhook-write-only (never client-writable).

**Local dev vs. live testing — TESTING ON partyreel.com IS ALWAYS PREFERRED.**
`localhost:3000` is deliberately NOT in the allow-list of **any** of our tooling —
Supabase's redirect allow-list, the R2 bucket CORS origins, `NEXT_PUBLIC_SITE_URL`,
the Stripe redirect/return URLs — so `pnpm dev` renders UI but **cannot complete
sign-in, an upload, or checkout** (the OAuth/magic-link redirect is rejected, the R2
PUT is CORS-blocked, Stripe bounces back wrong). This is on purpose; don't "fix" it by
adding localhost. **Default to verifying on the deployed site** (push to `main` → Vercel
deploys partyreel.com, then drive the **Chrome MCP**). `pnpm dev` + the **Preview MCP**
is fine ONLY for pure UI/render work (e.g. a public album whose media already exists —
`<img>`/`<video>` loads aren't CORS-bound). **Live/DB testing is authorized and
expected:** the project holds only disposable **test data** (nothing sensitive), and
Supabase/R2 will be purged of orphans before launch — so seed, mutate, and inspect prod
freely via the Supabase/R2 MCPs and the Chrome MCP (drive it logged in as the user; the
host test account is `willg97@gmail.com`, the operator/admin is `partyr33l@gmail.com`).
**One Chrome gotcha:** on prod, Vercel injects its dev **Toolbar** (a floating circle at
the right-middle edge) for logged-in Vercel team members only — it overlaps UI there
(e.g. a lightbox's next-chevron) and is invisible to real guests/hosts; navigate by
keyboard or Dismiss it.

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
  with **7 sweeps**: expired_events, removed_media, orphans, expired_passes,
  **over_capacity**, **renewal_nudges**, **inactive_free_events** (each independently
  try/caught).
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
- **Free-tier inactivity removal** (`sweepInactiveFreeEvents`) — free-account events with
  **no activity for 6 months** get warned (~14 d out) then **soft-deleted into the existing
  recoverable tail** (reuses `softDeleteEvent`'s `deleted_at`/`purge_at`; the `expired_events`
  sweep hard-deletes after 60 d — no new tail). The freshness clock is **`max(profiles.
  last_active_at, event.created_at/updated_at, newest media.created_at)`** so a recently-used
  or still-collecting event never trips it; decision logic is the pure, unit-tested
  `inactivityAction` ([src/lib/lifecycle/inactivity.ts](src/lib/lifecycle/inactivity.ts),
  `INACTIVE_DAYS`=180/`WARN_BEFORE_DAYS`=14). **`profiles.last_active_at` is the activity
  signal** — bumped (throttled ~12 h, best-effort, service-role) by `touchHostActive` in an
  `after()` callback in the `(app)` layout, so **sign-in or ANY host use counts** (it's
  service-role-write-only, like the other `profiles` billing/lifecycle columns). Pro/Event-Pass
  events are exempt (free-tier only). No new env var.
- **Event Pass (Cut 4c) is a ONE-TIME payment, not a subscription** — checkout uses
  `mode:"payment"` (chosen from `plan.billing === "one_time"`), so **no
  `customer.subscription.*` event fires**; it's provisioned from
  **`checkout.session.completed`** via `session.metadata.plan_id === "event_pass"`
  (`resolveEventPassCheckout`). `tier_expires_at` is derived from `session.created +
  termDays` (NOT `now()`) so re-delivered events are idempotent (don't extend the term).
  `profiles.tier_expires_at` is service-role-write-only (not in the `grant update`
  allowlist). The **purge cron's 4th sweep** (`sweepExpiredPasses`) downgrades lapsed
  passes to Free (cap reset → minimal over-capacity; media stays).

**Phase 6 — growth loop (SEO + share metadata + guest email capture)**

- **SEO/metadata infra** lives in `src/app/`: `metadataBase` is set in the root
  [layout.tsx](src/app/layout.tsx) (`env.NEXT_PUBLIC_SITE_URL ?? "https://partyreel.com"`) —
  WITHOUT it Next errors on relative OG URLs. OG images are **code-generated via `next/og`**
  (`opengraph-image.tsx` site-wide + `(guest)/e/[token]/opengraph-image.tsx` per-event with
  the event name) — no font loaded (the built-in font dodges the Next-16 satori font gotcha).
  `sitemap.ts`/`robots.ts` list/allow ONLY the marketing routes. **Local-dev gotcha:** in
  `pnpm dev` the emitted `og:image` URL shows the `localhost:3000` host (Next resolves
  metadata against the request origin in dev) while `sitemap.ts`/`robots.ts` show the
  `partyreel.com` fallback — NOT a bug; production (with `NEXT_PUBLIC_SITE_URL` set) resolves
  `og:image` to `https://partyreel.com/...`. The per-event OG URL also carries a Next hash
  suffix (`…/opengraph-image-<hash>?…`); read the real URL from the page's `<head>`, don't
  guess the path.
- **The event page emits OG tags but `robots: { index: false }`** — `/e/[token]`
  sets `generateMetadata` (event name/description + per-event OG) so links unfurl in chat, but
  the opaque qr_token must NEVER be indexed (OG-for-social ≠ search-indexing). `robots.ts`
  also disallows `/e/`,`/dashboard`,`/admin`,`/login`,`/auth`,`/api/`. The guest query
  `getEventByQrToken` is wrapped in React `cache()` so generateMetadata +
  the page + the OG image share one RPC per request.
- **Guest email capture** (post-upload growth prompt) — a soft, one-time, dismissible card in
  [upload-client.tsx](src/components/guest/upload-client.tsx) (shown when `doneCount>0` and the
  event didn't already require an email; localStorage gate `pr_email_prompt_${qrToken}` via the
  same `useSyncExternalStore` pattern as the session). Writes via the **`capture_guest_email`**
  SECURITY DEFINER RPC (7th anon capability-token RPC; session_token is the auth): sets
  `guests.email` only if null, and on opt-in upserts the **durable `newsletter_signups` table**
  (RLS deny-all, like `reports`/`sent_emails`). `newsletter_signups` is standalone (NOT a
  `guests` column) so the marketing list survives event/guest deletion (`event_id` is `on
  delete set null`). **Deferred:** the automatic "email the album link" send (would reuse
  `sendOnce`) — capture only for now.

**Phase 6 — QR designer (cut #1) gotchas**

- **`qr-code-styling` must be dynamically imported INSIDE a `useEffect`** — it touches
  `window`/`document` on construction, which crashes the client component's SSR pass in
  Next 16. `src/components/app/styled-qr.tsx` does this (dynamic `import()` + `.append()` on
  mount, `.update()` on prop change, imperative `.download()`); never import it at
  module/render scope. (It replaced `qrcode.react`, which can't render module/corner shapes.)
- **QR style presets are app-side, not a DB enum.** `events.qr_style` is a plain `text`
  column (default `'classic'`); the closed set + their qr-code-styling options live in
  `src/lib/constants/qr-presets.ts` (`QR_PRESETS` / `QR_STYLE_KEYS` / `resolveQrPreset`),
  validated by `z.enum(QR_STYLE_KEYS)` on write. Chosen so the set can grow without an
  enum-`ALTER`; an unknown/legacy value falls back to `classic`. It's cosmetic — **no
  security surface** (the `qr_token` capability is unchanged), so the column add introduced
  **no** new advisor finding.
- **Scannability is the real constraint, not looks**: every preset keeps DARK data modules
  on a WHITE background; brand color only tints the corner finder patterns. Prove a new
  preset by SCANNING it (host UI is behind the `(app)` auth gate → verify on partyreel.com).
- The `QrPresetPicker` (`src/components/app/qr-preset-picker.tsx`) is built reusable on
  purpose — the create wizard (cut #2 of the approved Phase-6 order) embeds it; `StyledQr`
  is the shared low-level renderer.

**Phase 6 — create wizard (cut #2) gotchas**

- **`/dashboard/new` is the SOLE create path** (`create-event-wizard.tsx`) — the old
  `CreateEventDialog` + the redirecting `createEventAction` were deleted. The wizard creates
  the event **once, at commit** (end of the design step) via `createEventInWizard`
  ([actions.ts](src/app/(app)/dashboard/actions.ts)), which **RETURNS** the event (id +
  qr_token) instead of redirecting — the Share step needs the real `qr_token` to
  render a scannable QR + the event link. Don't reintroduce redirect-on-create or a per-step
  create (would orphan events / break the share step).
- **The wizard route must NOT guard at-cap with a `redirect`** — a Server Action refreshes
  the route it was called from, so an at-cap `redirect` on `/dashboard/new` fires on the
  POST-CREATE refresh (the host is now at cap) and bounces them away **before** the client
  Share step renders (this shipped + was caught in live testing). The cap is guarded instead
  by the disabled dashboard "New event" button + `createEvent`'s `limit_reached`. General
  rule: don't put an eligibility `redirect` on a route whose post-Server-Action refresh must
  show a success state.
- **The design step previews with a placeholder token** (`previewJoinUrl` in
  `src/lib/events/share-urls.ts` — a 32-char stand-in) because the real `qr_token` doesn't
  exist pre-insert; it's the same length as a real token so the preview's module density
  matches what the host will get.
- Only `name` is required; everything else stays minimal + editable on the event page (the
  "lowest-friction" principle). `qr_style` rides the single insert (wired in cut #1). The
  **first-time host welcome is a separate, not-yet-built cut** — `/dashboard/new` + the
  dashboard empty state are its natural homes.

**Phase 6 — link analytics (cut #3) gotchas**

- **`link_stats` is AGGREGATE counts, NO PII** — per-event-per-day `(event_id, kind, day,
  count)`, `kind` ∈ `qr_scan | album_view`. No IP / user-agent / visitor identity is ever
  stored. Bots are filtered AT INGEST (`isLikelyBot`, [bots.ts](src/lib/analytics/bots.ts))
  because counters can't be cleaned retroactively. (Per-visit logs / unique visitors were
  considered + rejected for privacy + weight.)
- **`record_link_hit` is service-role-only** — REVOKED from anon/authenticated, same
  locked-down class as `purge_media_rows` (it must **NEVER** appear in the anon advisor
  list). Recording always happens server-side in the guest pages' `after()` via the admin
  client ([mutations/analytics.ts](src/lib/db/mutations/analytics.ts)) — best-effort, never
  blocks the guest. Hosts READ via the `link_stats_host_select` RLS policy (own events only),
  so the table has a policy and gets **no** `rls_enabled_no_policy` INFO.
- **Record ONLY in the page body success branch**, never `generateMetadata` (runs for
  unfurls/prefetch → double-count). "Scans" = join-link visits — the host's own "Open" /
  re-visits count too (honest label, accepted for v1).

**Phase 6 — notification center (cut #4) — DERIVE-ON-READ; the capstone future agents extend**

- **No feed table — it's computed on read.** `getNotificationData`
  ([queries/notifications.ts](src/lib/db/queries/notifications.ts)) gathers signals (pending-media
  count, profile flags, announcements) on every host page load in the `(app)` layout; the **pure**
  `buildNotifications` ([notifications/build.ts](src/lib/notifications/build.ts)) turns them into
  the badge + panel. The bell mounts in the layout `headerActions` before `UserMenu`.
- **To ADD a signal** (e.g. co-host invites when co-hosting ships — REQUIRED follow-up, see
  ROADMAP): add one read to `getNotificationData` + one case to `buildNotifications`. That's the
  whole extension point — keep it that small. **When building ANY new host surface, ask whether it
  should feed the bell** (capture the signal at the source, don't retrofit).
- **Two notification kinds, different semantics:** derived **alerts** (review / over-capacity /
  pass-expiry) are STATE — they persist in the badge until the condition resolves and are NOT
  dismissed by viewing. **Announcements** are operator broadcasts with per-host read state: unread
  until the host opens the panel, which advances `profiles.announcements_seen_at` (the bell also
  optimistically drops their badge contribution). Badge = active alerts + unread announcements.
- **`announcements` is operator-write-only** (RLS: a SELECT policy for `authenticated`, NO write
  policy → host inserts are RLS-denied, proven via a 42501 contract check; the operator publishes
  via SQL/MCP — an `/admin` compose UI is a deferred fast-follow). **`announcements_seen_at` is the
  ONE host-writable addition** to the `profiles` column-grant allowlist (`tier`/`storage_*`/
  `is_admin` stay off it); the host self-bumps it via the RLS `markAnnouncementsSeen` mutation.
- **Pass-expiry reuses `RENEWAL_NUDGE_DAYS`** ([lifecycle/renewal.ts](src/lib/lifecycle/renewal.ts))
  — the single source shared with the cron's `renewal_nudges` email; don't re-hardcode it.
- **No real-time push** — the badge refreshes on navigation/page-load (acceptable; cron signals
  are daily). Deferred to v2: link-activity + billing alerts, a durable per-item feed + push, the
  `/admin` compose UI, per-item announcement un-read toggling (all logged in the ROADMAP).

**Phase 6 — first-time host welcome gotchas**

- **`/welcome` is a full-page intro route, NOT an overlay** (Will dislikes coachmark/"click here"
  tours). It's gated to new accounts by **`profiles.welcomed_at`** (null = unwelcomed): the
  `/dashboard` page redirects there via `shouldShowWelcome` ([welcome.ts](src/lib/welcome.ts)).
  The migration **BACKFILLED existing profiles to `now()`** so only NEW signups see it.
- **Set the marker BEFORE navigating away** — every `/welcome` exit (Create / Look around /
  Skip) calls `markWelcomedAction` then `router.push`; if you navigated first, the `/dashboard`
  guard would bounce the host straight back (the cut-#2 at-cap-redirect lesson, inverted). The
  `/welcome` route itself must NOT gate on `welcomed_at` (only the dashboard does) — no loop.
- **`welcomed_at` joins the `profiles` host-writable column-grant allowlist** (like
  `announcements_seen_at`); `markWelcomed` is an RLS self-update via the regular client (NOT
  service-role, unlike `touchHostActive`). `tier`/`storage_*`/`is_admin` stay off the allowlist.
- **The "how it works" story is single-sourced** in [how-it-works.ts](src/lib/constants/how-it-works.ts)
  — the marketing section AND the welcome render the same 3 steps. Edit the story once.

**Phase 6 — album lightbox + media download gotchas**

- **Forcing a cross-origin download needs a SIGNED `ResponseContentDisposition`, not the `download`
  attr.** The `<a download>` attribute is IGNORED for cross-origin URLs (R2 is a different origin), so
  to make Save download the original (vs. navigate to it), `presignDownload({ key, downloadFilename })`
  bakes `response-content-disposition=attachment; filename="…"` INTO the signature
  ([presign.ts](src/lib/r2/presign.ts)). Because Save is a plain top-level `<a href>` navigation (not
  `fetch`), **no bucket-CORS change is needed** (verified: R2 returns `Content-Disposition: attachment`).
  The filename comes from [download-filename.ts](src/lib/media/download-filename.ts) — slugged to ASCII
  `[a-z0-9-.]`, so `filename="…"` is header-safe with no RFC-5987 `filename*` encoding.
- **Two presigns per item, up front** (the album + event pages presign an INLINE render url AND an
  `attachment` download url from the SAME key). Accepted for v1 — presign is local HMAC (no network).
  The lazy/route-based alternative for very large galleries is **deferred** (ROADMAP), alongside the
  existing large-gallery read-proxy deferral.
- **The lightbox composes the radix Dialog PRIMITIVES, NOT the wrapped `<DialogContent>`**
  ([media-lightbox.tsx](src/components/shared/media-lightbox.tsx)) — it needs a dark, edge-to-edge
  backdrop (`bg-black/90`) + object-contain media, whereas `ui/dialog.tsx`'s `DialogContent` hard-codes
  a light `bg-black/10` overlay + `max-w-sm`. Composing still gives radix's focus-trap / Esc /
  scroll-lock. Don't "fix" it to use `DialogContent`.
- **Mobile swipe is a peek-the-neighbor windowed track ([media-lightbox.tsx](src/components/shared/media-lightbox.tsx)),
  vanilla Pointer Events — no carousel lib.** The media area is a 3-slot track `[prev, current, next]`
  translated under the finger; release commits on distance OR flick velocity, else springs back, with
  diminishing-returns friction at the ends. Load-bearing, non-obvious bits: **(a)** finger-follow is
  gated to `pointerType === "touch"` so mouse/pen are untouched (chevrons + keyboard stay the desktop
  nav); **(b)** slots are **keyed by item id** so the slid-to neighbor's already-loaded `<img>` is
  REUSED (moved, not reloaded) when it becomes current — that's what makes the settle seamless; the
  commit then does an **animate-then-swap** recenter that holds `data-dragging` (`transition:none`)
  through the index-swap so the −2w→−1w jump is instant. **Do NOT re-enable the transition on the next
  frame (rAF):** React can flush the transition-off recenter and the transition-on re-enable in the
  SAME frame before paint, so the recenter animates as a visible SECOND slide (the mobile "reanimate"
  glitch). `dragging` is left true until the NEXT gesture's `settleTo` flips it false (many frames
  later); no transform changes in between, so nothing that should animate is suppressed; **(c)** videos are **CLICK-TO-PLAY, not autoplay** — the center video gets `controls`
  (native play button) + `preload="metadata"` (poster only, not the file), neighbor videos are muted
  controls-less `pointer-events-none` posters with a `<PlayBadge>` overlay (shared with the grid) so a
  video reads as a video the moment it peeks in mid-swipe (center uses the native button instead); an
  index-change effect keeps the new center paused and
  **pauses a played video when you swipe past it** (+ resets `isPlayingRef`, since a controls-less
  neighbor's onPause won't fire). Chosen so guests pick what to load (bandwidth) and swiping stays
  clean (no controls overlay popping in after an autoplay); **(d)** swipe-vs-scrub: a **playing** video
  (only after the guest taps play) reserves its bottom `CONTROLS_STRIP_PX` for the native scrubber, a
  **paused** one swipes everywhere (the fuzzy boundary is intentional, per Will); **(e)** `handleClose` is the single close funnel and
  **cancels the in-flight settle timer** — without that, a timer firing after close calls
  `onIndexChange(null! + dir)` and silently reopens; **(f)** a `suppressClick` ref (reset on
  pointerdown, set on horizontal lock) stops the post-drag synthetic click from closing via the
  backdrop tap. CSS lives in `globals.css` under `[data-lightbox-track]` (reduced-motion-guarded;
  `--lightbox-settle` set per gesture). The change is centralized: ALL FOUR surfaces (public album,
  guest `/e/`, host + admin moderation grids) inherit it from this one component.
- **Grid video tiles are controls-less thumbnails on purpose.** `MediaTile`
  ([media-grid.tsx](src/components/app/media-grid.tsx)) renders `<video>` WITHOUT `controls` so the
  non-interactive element can sit inside the tile's open-the-lightbox `<button>` (a `<video controls>`
  is interactive content → an illegal button descendant). Playback (with controls) happens in the
  lightbox. On the host grid the moderation buttons are SIBLINGS of that button (not children), so
  tapping a control never opens the lightbox — no `stopPropagation` needed. **All video `src`s go
  through `videoPosterSrc()` ([lib/media/poster.ts](src/lib/media/poster.ts)) — load-bearing, don't
  drop it.** It appends a `#t=0.1` media fragment: iOS Safari paints a `<video>` BLACK instead of its
  first frame unless the src tells it to seek+render one (`preload="metadata"` paints the frame on
  desktop but NOT iOS — and a *paused* iOS video is never decoded otherwise, so it shows black). The
  fragment is client-only (never sent to R2), so it doesn't touch the presigned signature. Single-
  sourced because it's used by **both** the grid `MediaTile` (all 3 grids) AND the lightbox (center +
  neighbor videos — same value so a video reused across slots doesn't reload when it becomes current).

**Phase 6 — unified guest event page (`/e/[qr_token]`) gotchas**

- **Access is a 3-state `events.visibility` enum (`open|password|private`), NOT a boolean** — the
  old `is_public` was dropped in the config rework (ADR-0007). **`private` is the master lock:** the
  `/e/` page renders a locked screen (no name/gallery/upload) and `generateMetadata` hides the name.
  **`password`** shows a `<PasswordGate>` (name shown — link-shared, not the secret) until a signed
  unlock cookie is present, then the full experience. **`open`** is the old public path.
  `accepting_uploads` stays the separate upload-only gate (open/unlocked + accepting-off = gallery +
  a disabled "Uploads disabled" control).
- **The anon media RPCs gate on `visibility = 'open'`, NOT `<> 'private'`** — a password event's
  media must NEVER stream through `get_event_media_by_qr_token` / `get_public_album`. Password media
  is served only via the SERVER admin-read (`getApprovedMediaForUnlock`, self-guarded by the unlock
  cookie) after `/api/guests/unlock` verifies the password. The bcrypt **hash never leaves the DB**
  (RPCs expose `has_password` only; `getEvent`/`listEvents` drop it → a hash-free `HostEvent`). The
  unlock cookie is a signed HMAC of `{eid,exp}` (`UNLOCK_COOKIE_SECRET`, ~12 h) — the cookie name
  isn't the boundary, the signed eid is. The password is set/cleared ONLY by `set_event_password` /
  `clear_event_password` (host-auth SECURITY DEFINER, the column is revoked from the host's UPDATE
  grant). **Human prereq:** set `UNLOCK_COOKIE_SECRET` in Vercel + `.env.local`. See ADR-0007 +
  `lib/events/unlock-token.ts`.
- **`get_event_media_by_qr_token`** — qr-keyed approved media, newest-first, gated `visibility='open'`.
  `get_event_by_qr_token` returns `visibility` + `has_password` (return-shape changes need
  DROP+CREATE+**re-grant**). The in-page share is the JOIN link and the gallery is qr-keyed — ONE token
  now (the `/a/[share_token]` album + the `events.share_token` column are gone; ADR-0010).
- **Video uploads are Pro-only (config rework Phase 2 — cut 2a).** A free host's event is photos-only
  for guests AND the host. The AUTHORITATIVE gate is `if p_type='video' and v_profile.tier='free' then
  raise` at the **TOP of the tier-caps block** (right after `v_profile`/`tier_limits()` load — NOT the
  universal-limits block above it, where `v_profile.tier` isn't loaded yet → a silent no-op) in BOTH
  `create_media` AND `create_media_as_host`. The universal 5-min/2-GB video limits (`limits.ts`) are
  ORTHOGONAL — they still apply to PAID video. `get_upload_context` / `get_host_upload_context` return
  an advisory `video_blocked` (`p_type='video' and tier='free'`) the presign routes fail fast on:
  EVENT-framed ("This event accepts photos only.") for the guest — a guest must NEVER learn the host's
  tier — tier-framed for the owner. The host upload picker hides video up front via
  `videosAllowedForTier` (`FileDropzone allowVideos`, default true so the guest dropzone still offers
  video, rejected at presign). All 4 RPCs were create-or-replace (jsonb returns / same signatures) so
  **advisors are UNCHANGED** — no new RPC/grant. Client mirror: `videosAllowedForTier(tier) = tier !==
  'free'` ([tiers.ts](src/lib/constants/tiers.ts), Vitest-guarded).
- **Guest display names were REMOVED (config rework Phase 2 — cut 2b).** Dropped `guests.display_name`
  + `events.require_display_name`; `create_guest` is now **2-arg** `(p_qr_token, p_email)` and
  `get_event_by_qr_token` no longer returns `require_display_name` (both DROP+CREATE+**re-grant** — a
  signature/return-shape change; advisors still UNCHANGED, both stay anon+authenticated). The HOST
  byline "Hosted by {name}" is `profiles.display_name` → `host_display_name` and is SEPARATE — do NOT
  conflate it with the dropped guest column (`handle_new_user` sets the host one, untouched). The
  just-in-time join is now **field-less + silent** for the common case (pick files → `POST /api/guests
  {qr_token}` via `joinSilently` → upload, NO dialog); the `<EmailPrompt>` (was `NamePrompt`) shows
  ONLY on `require_email` events and is still UNVERIFIED — **cut 2c** makes it a verified OTP, moves it
  to a page-level gate, and deletes this prompt. `create_guest`'s ONLY remaining check_violation is the
  require_email gate (the `email_required` mapping in [mutations/guest.ts](src/lib/db/mutations/guest.ts)).
  `validation/join.ts` (`buildJoinSchema`) was DELETED.
- **Verified-email gate via OTP (config rework Phase 2 — cut 2c).** "Require email" is now a VERIFIED
  email (Supabase native OTP: 6-digit code primary + magic-link fallback — both arrive in ONE
  `signInWithOtp` email). **`create_guest` derives identity (`user_id` + `email`) from `auth.uid()` →
  `auth.users`, NEVER the client** — `require_email` = "a confirmed session" (`auth.uid()` not null AND
  `email_confirmed_at` not null); the RPC is the trust boundary. It KEEPS its **2-arg signature**
  (`create-or-replace`, `p_email` now IGNORED) → NO re-grant, advisors UNCHANGED, and **NO
  deploy-window breakage** (the old build's `create_guest(qr, email)` kept working — strictly better
  than 2b's DROP+re-grant). **`guests.user_id`** (new; `on delete set null`; indexed; deliberately NO
  unique `(event_id,user_id)` — that would break anonymous multi-join, the `session_token` is the
  dedupe) is the account-from-guest link (a verifying guest becomes a free account via the existing
  `handle_new_user`). The require-email collection MOVED from a just-in-time prompt to a **PAGE-LEVEL
  gate**: `/e/[token]` calls `getUser()` **ONLY when `event.require_email`** (no auth round-trip on
  open/password events) and passes `needsEmailVerification` so `event-experience.tsx` swaps the upload
  slot for `<VerifyEmailPrompt>` (the gallery STAYS visible — viewing is allowed); verify →
  `router.refresh()` → the RSC re-runs `getUser()` → the dropzone renders → the silent `create_guest`
  stamps `user_id`. **Shared `<EmailSignIn>`** ([email-sign-in.tsx](src/components/auth/email-sign-in.tsx),
  code via `verifyOtp({type:'email'})` + the link) backs BOTH the host `/login` and the guest prompt;
  `input-otp` is **hand-authored** ([ui/input-otp.tsx](src/components/ui/input-otp.tsx) — radix-nova
  lacks the wrapper, like `form`). **"Switch guest" now also `signOut()`** (shared-device bleed) +
  `router.refresh()`. **Human prereqs (live only):** the **apex** Supabase allowlist must be
  `https://partyreel.com/auth/callback**` (the guest link carries `?next=/e/[token]`); the magic-link
  email template must contain `{{ .Token }}` (the code). ADR-0008.
- **Supabase auth rate limits are PER-IP, and an event concentrates guests behind ONE IP** (venue
  WiFi NAT / carrier CGNAT), so the OTP `require_email` path is the one that can 429 a *crowd*, not a
  lone abuser. Reviewed + tuned 2026-06-02 (Dashboard → Authentication → Rate Limits): **"Sign-ups and
  sign-ins" + "Token verifications" raised 30 → 150 per 5 min per IP** so a burst of guests verifying
  email on shared WiFi isn't blocked around the 31st. Low abuse risk here (OTP + Google only, no
  passwords to stuff; the code is 6-digit, single-use, ~1 h expiry, with a separate per-code attempt
  cap; the email-send cap independently governs spend). **The real email bottleneck is the
  project-wide "Sending emails: 2/hour" cap (Pro-locked) — raising the per-IP limits does NOT touch
  it;** custom SMTP (DONE 2026-06-02 — auth email now routes via Resend SMTP) lifts it (Supabase Pro is the alternative). SMS / anonymous /
  Web3 limits are unused (anon sign-ins stay OFF per ADR-0008). Related dashboard↔code lockstep: the
  **"Email OTP Length" setting MUST equal `OTP_LENGTH`** in
  [email-sign-in.tsx](src/components/auth/email-sign-in.tsx) (it was 8 vs a 6-slot input → verify would
  silently fail; both are 6 now, Supabase's email-OTP minimum).
- **ONE link per event (one-link consolidation; ADR-0010 — SUPERSEDES the two-token split).** Every
  event has a SINGLE link **`/e/[qr_token]`** (what the QR encodes). The `/a/[share_token]` album, the
  `events.share_token` column, and `get_public_album` are **GONE**; `create_report` /
  `verify_event_password` / `save_event` all key off `qr_token`, and `get_saved_events` returns
  `qr_token`. What a guest sees is driven by CONFIGS: `visibility` gates access (open/password/private),
  `accepting_uploads` gates contributing, `require_email` gates identity — "view-only album after the
  event" is just `accepting_uploads=false`, a STATE of the one page. **The ADR-0004 capability split is
  RETIRED** (one token; upload is config-gated, not token-gated) — any older gotcha below mentioning
  `/a/`, `share_token`, "the album page", or "share_token vs qr_token must not derive" is SUPERSEDED.
  Per-event OG now lives at `(guest)/e/[token]/opengraph-image.tsx`; the host dashboard + create-wizard
  show ONE link + config-aware copy; `share-urls.ts` exposes a single `eventUrl`.
- **The guest-page HEADER is an AUTH-AWARE client island** ([guest-header.tsx](src/components/guest/guest-header.tsx)),
  NOT a static server header. Logged-out → the quiet "Start for free" CTA (unchanged); logged-in → the
  visitor's account menu ([guest-account-menu.tsx](src/components/guest/guest-account-menu.tsx)) so they
  feel signed in + can jump back into the app. It mirrors `SaveEventButton`: resolve auth with a LOCAL
  `getSession()` (no network) — **do NOT add a server `getUser()` to the page RSC** (anonymous event
  crowds behind one venue-NAT IP would each pay it + risk auth rate limits; the page already gates its
  ONLY `getUser()` behind `require_email`). Default render = the CTA (matches SSR → zero flash for the
  anonymous majority); a session triggers a one-frame CTA→avatar swap (fixed-height `h-8` slot so it
  doesn't reflow). Display name + presigned avatar + event-ownership come from **`GET /api/me/menu?event=<id>`**,
  fetched ONLY when a session exists (so anon never hits it): the avatar is presigned SERVER-side (raw R2
  keys never reach the browser) and ownership is an **RLS-scoped `events` select** (`host_id` never leaks →
  drives the owner-only "Manage event" deep link to `/dashboard/[eventId]`). The menu's **client-side Sign
  out REPLACES the old "Not you? Switch guest" button**: it `setStoredSession(qrToken, null)` (clears the
  guest capability + notifies `EventExperience` via the shared module-singleton `emit()` in
  [use-stored-session.ts](src/lib/guest/use-stored-session.ts)), signs out, then `router.refresh()`s — so
  the visitor STAYS on the event page and a `require_email` event re-gates to `<VerifyEmailPrompt>` (the
  shared-device-bleed fix, relocated to a discoverable place + correctly gated on "is logged in" rather
  than "has a capability token"). **`router.refresh()` re-runs only the SERVER tree**, so the island clears
  its OWN `useState` (`setMenu(null)`) to collapse back to the CTA. `ThemeSubmenu`/`initial` are reused
  (exported) from the host `UserMenu` — share the hard wiring, don't duplicate; the host menu KEEPS its
  server-action sign-out (it redirects to `/login`, which is wrong for a guest page).
- **Event-page FLOW (one-link Part 2; ADR-0010).** [event-experience.tsx](src/components/guest/event-experience.tsx)
  renders header (name + "Hosted by") → a quiet **`[Save event] [Invite]` action row** → upload (only
  when accepting) → gallery, CONTIGUOUS (the share is no longer wedged between upload + gallery). Load-
  bearing, non-obvious bits: **(a)** `GuestShare` ([guest-share.tsx](src/components/guest/guest-share.tsx))
  is now an **Invite trigger + dialog** (one outline button → a modal holding the QR + Copy link + native
  Share + Download); it's NOT an inline-QR card anymore. **(b)** `SaveEventButton` stays its OWN auth-aware
  island in the row (it already renders `variant="outline" size="sm"`, so Save + Invite match for free);
  Save is hidden in the demo. **(c) Uploads-off = the view-only STATE of the one page:** when
  `!accepting_uploads`, EventExperience renders NO upload panel (the old in-panel "Uploads disabled"
  button is GONE) — just a quiet "uploads closed" line, then the gallery. **(d) `needsEmailVerification`
  is gated on `accepting_uploads` in the PAGE RSC** (`accepting_uploads && require_email && !isDemo`): a
  closed event NEVER shows `<VerifyEmailPrompt>` (uploads-off wins → view-only). Don't drop that
  `accepting_uploads &&` — without it a require_email + closed event wrongly asks guests to verify to
  upload to a closed event. **(e)** ALL the gallery poll / reconcile-by-id / optimistic / `sessionRef`
  machinery is unchanged — the redesign only moved JSX, it did not touch the live-gallery logic.
- **Saved events (config rework Phase 3 — accounts/growth; ADR-0009).** A signed-in visitor can SAVE
  an event to their dashboard ("Saved" tab). It is **FREE** (the account-creation growth driver), and
  it AUGMENTS the anonymous capability flow (ADR-0004) — the upload pipeline is untouched. Load-bearing:
  - **Save = the `save_event(p_qr_token)` capability RPC** (authenticated-only SECURITY
    DEFINER): resolves the event from the page's TOKEN (never a client `event_id`), **refuses `private`
    + your-own events** (owner → no-op), idempotent. Status-check + **unsave are plain per-user RLS**
    (`saved_events_owner_all`, `auth.uid() = user_id`) straight from the browser client — no API route.
  - **`get_saved_events()` (authenticated-only SECURITY DEFINER, `auth.uid()`-based, NO `p_user_id`)**
    reads the names/covers of events the saver does NOT own → it MUST be SECURITY DEFINER. It MASKS by
    visibility: `open` → cover; **`password` → cover NULL** (gated media must NEVER leak as a thumbnail);
    `private` → all NULL + `accessible=false`; deleted → excluded. It returns the event's **`qr_token`**
    (the single link; ADR-0010), masked to null for private. Saved cards link to **`/e/[qr_token]`**.
    Cover keys are **presigned server-side** (ADR-0003); raw R2 keys never reach the browser.
  - **Advisors:** `save_event` + `get_saved_events` are the only adds — both in the **authenticated
    (0029)** list, NEVER **anon (0028)**; `saved_events` has a policy (no `rls_enabled_no_policy` INFO).
    +2 authenticated, 0 anon (asserted).
  - **The generated `get_saved_events` return type understates nullability** (a `RETURNS TABLE` fn types
    every column non-null). `SavedEventRow` in [saved-events/card.ts](src/lib/saved-events/card.ts) models
    the TRUE nullability (the RPC masks to null); the query layer casts to it. Same quirk the guest-events
    DTO already normalizes — don't trust the generated nullability for RETURNS TABLE fns.
  - **The Save button is the always-visible growth lever** ([save-event-button.tsx](src/components/guest/save-event-button.tsx))
    — shown to **signed-out** visitors too; click → "create a free account to save" dialog (shared
    `<EmailSignIn>` code-first OTP + Google). A `pr_pending_save_${eventId}` localStorage flag completes
    the save after a REDIRECT sign-in (Google / magic-link) returns; the in-page code path saves directly
    in `onVerified`. Mounts in the `/e/` action row (next to Invite, hidden in demo) + inside the
    post-upload `<SaveAccountPrompt>`. (Part 2 moved it into the action row; the old `/a/` album-footer
    mount that used `tone="gallery"` is gone with the album.)
  - **The post-upload `<SaveAccountPrompt>` REPLACED the newsletter `EmailCapturePrompt`** (deleted) —
    account-first, with the newsletter opt-in folded into the save dialog as a checkbox (captured via the
    existing `capture_guest_email` RPC on the in-page code path only). The old `/api/guests/email` route
    + its `captureGuestEmail` server wrapper + `emailCaptureSchema` were REMOVED as dead code (the prompt
    swap orphaned them — `capture_guest_email` is reached ONLY via the in-page browser RPC now).
- **The live gallery polls `/api/guests/gallery` (~12 s) — reconcile by id, do NOT setState the raw
  poll result.** Each poll re-presigns, so the URLs change every call; replacing items wholesale
  re-downloads every `<img>` every 12 s. `event-experience.tsx` KEEPS existing items' URLs by id and
  only presigns genuinely-new items (caught in local verification via the network panel). Poll pauses
  on `document.hidden`. (Kept URLs can expire after the 1 h TTL on a >1 h-open session — acceptable.)
- **Optimistic uploads only for LIVE mode.** A completed upload prepends a local-`createObjectURL`
  tile (deduped against the poll by media id via `mergeGalleryItems`, then the blob is revoked) — but
  ONLY when `create_media` returned `approved`. Hold-for-approval items stay pending (the upload list
  shows their status); don't fake them into the public gallery.
- **Just-in-time join (no upfront gate).** The gallery is public, so a first-time guest picks files
  FIRST, then a lightweight name prompt appears ([guest-upload.tsx](src/components/guest/guest-upload.tsx)).
  The session can flip null→token while the panel is mounted, so the queue reads a `sessionRef`
  (synced in an effect — `react-hooks/refs` forbids writing refs in render).
- **Motion (emil-design-eng skill):** custom `--ease-emphasis` token in `globals.css` (the built-in
  CSS easings are too weak); gallery tiles fade+rise on ENTER via `@starting-style` + `[data-media-tile]`
  (transform/opacity only, `prefers-reduced-motion`-safe), so a guest's just-uploaded photo visibly
  lands at the top; `active:scale` press feedback on tiles/dropzone. Keep UI motion < 300 ms.

**Host upload (two-way media flow) gotchas**

- **Media flow is two-way: hosts upload too, NOT just guests.** A host adds media from the
  event page (e.g. a photographer's batch) via the **`create_media_as_host`** RPC (migration
  `…_host_uploads`). It is the AUTHENTICATED twin of `create_media`: same key-prefix check,
  same per-file limits, same monthly-ingress + storage-cap enforcement (host uploads **count
  against caps** — the anti-abuse invariant), but it auth's via `auth.uid()` + event ownership
  (not a capability token), sets `status='approved'` UNCONDITIONALLY (the host is the
  moderator — no `moderation_mode` branch), and inserts `guest_id = NULL`. **Host upload =
  `guest_id IS NULL`** (the `media` table comment already anticipated this).
- **A host CANNOT just RLS-insert into `media`** even though `media_host_all` would allow the
  row — that bypasses the ledger + `storage_used_bytes` accounting (RPC/service-role-write-only)
  and the cap check → unmetered free storage. The RPC is the ONLY host-write path that keeps the
  accounting honest. Don't add a direct-insert shortcut.
- **No `accepting_uploads` check for the host** — that toggle is the GUEST gate; the host owns
  the event and can add even with guest uploads paused. (Deleted events are still blocked.)
- **The host routes are `/api/host/r2/{presign,complete}-upload`** (authenticated; `getUser()`
  gate + `event_id` body), mirroring the guest `/api/r2/*` routes. `uploadFile()`
  ([uploader.ts](src/lib/upload/uploader.ts)) is now **shared**: the caller passes the endpoint
  pair + an `identity` object (`{ session_token }` guest / `{ event_id }` host) merged into both
  request bodies — presign/complete response shapes are identical, so don't fork it.
- **`HostUpload` is a SEPARATE component** ([host-upload.tsx](src/components/app/host-upload.tsx)),
  deliberately NOT a refactor of the delicate `GuestUpload` (no join/demo/email/`sessionRef`). It
  reuses `FileDropzone` + `uploadFile`. After the batch drains it calls **`router.refresh()`** (once,
  not per file) so the new auto-approved rows appear in the server-rendered host grid — route
  handlers don't `revalidatePath` like the moderation server actions do.
- The "Add photos" toggle lives in the **Uploads card header** via the
  [event-uploads.tsx](src/components/app/event-uploads.tsx) client wrapper (header button + inline
  panel share open-state). Host media is **visually indistinguishable** from guest media in the
  grid/album (one seamless album) — by design; the data keeps the distinction if a badge is wanted later.

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

**Admin / operations portal (subdomain + MFA)**

- **Served on `admin.partyreel.com` by THIS app, gated by ONE seam.** Every admin page/layout/action
  funnels through `requireAdmin()` / `requireAdminAction()`
  ([src/lib/auth/admin-context.ts](src/lib/auth/admin-context.ts)) — **never read `profiles.is_admin`
  directly** (this seam is the single swap point for a future `staff_members`+roles model — solo admin
  now, team later). `requireAdmin` redirects anon → `/login`, `notFound()`s non-admins (404,
  leak-proof), and exposes `ctx.aal`; `requireAdminAction` returns an `ActionResult` and **requires
  AAL2** (MFA) for writes.
- **MFA is a hard gate (free app-based TOTP / AAL2).** The `/admin` layout renders the enroll/step-up
  gate until the session is AAL2. The gate is **reachable at AAL1 on purpose** (never lock yourself out
  of first enrollment) — ship any AAL2 page-gate together with the AAL1 fallback. Break-glass = delete
  the factor in the Supabase dashboard (`auth.mfa_factors`). `getAuthenticatorAssuranceLevel()` →
  `currentLevel`/`nextLevel` (`nextLevel === 'aal2'` means a verified factor exists → show "step up",
  else "enroll").
- **Keep admin auth cookies HOST-ISOLATED.** `@supabase/ssr` cookies are host-only by default — do NOT
  set a `.partyreel.com` cookie `domain`, or the AAL2 admin session leaks to the apex. The admin signs
  in separately at the subdomain.
- **Auth callback is host-aware; the redirectTo must be the BARE `/auth/callback`.** On the admin host
  `callbackUrl()` ([login-form.tsx](src/components/auth/login-form.tsx)) uses `window.location.origin`
  (NOT the apex `NEXT_PUBLIC_SITE_URL`) so the session cookie lands on the subdomain; the
  [callback route](src/app/(auth)/auth/callback/route.ts) then picks the landing per host (admin host →
  `/admin`). **GOTCHA (cost a deploy in R1):** do NOT append a `?next=` query to the redirectTo. A
  non-wildcard Supabase redirect-allow-list entry (`https://admin.partyreel.com/auth/callback`) does
  NOT match a query-bearing URL, so Supabase silently falls back to the **Site URL** (apex) and the
  login lands on `partyreel.com/?code=…` (never exchanged → no session). Keep the redirectTo query-free
  (current approach), or widen the allow-list entry to `…/auth/callback**`.
- **Perimeter:** the proxy redirects the admin-subdomain root → `/admin`; the layout host-guards so the
  **apex 404s `/admin`** (when `NEXT_PUBLIC_ADMIN_HOST` is set). Unset (dev) → `/admin` is reachable
  directly on localhost, but **auth/MFA only complete on the live subdomain** (localhost isn't in the
  Supabase redirect allow-list). Canonical path is `/admin/*` on every host so `AdminShell` nav works
  in dev + prod.
- **Error tracking = Sentry** (free Developer tier), not an in-portal log table. The admin-action audit
  log is deferred (solo admin). See ROADMAP "Admin portal".
- **Locale/tz renders need `suppressHydrationWarning`.** `new Date(x).toLocaleString()` (or any
  `Intl`/locale/timezone formatting) renders in the server's tz/locale during SSR and the browser's on
  hydration → a React **#418** text mismatch. Wrap those spans in `suppressHydrationWarning` (the report
  timestamp in [report-review.tsx](src/components/app/report-review.tsx) does). Caught live on the admin
  reports queue, only fires when such a value actually renders (an empty list hid it).

**Sentry / observability (R2)**

- **DSN-gated no-op.** `NEXT_PUBLIC_SENTRY_DSN` unset → `commonInit.enabled = false`; Sentry sends
  nothing and the build stays green (dev + unconfigured). Don't add a hard assert.
- **One shared `commonInit`** ([lib/observability/sentry.ts](src/lib/observability/sentry.ts)) feeds all
  three runtimes (server/edge/client configs). Add capture sites via `captureError(area, …)` /
  `captureWarning(area, …)` — **never `import @sentry/nextjs` inside `src/lib/db/*`**; capture at the
  route/action layer (the data layer stays Sentry-free).
- **Capture only SWALLOWED errors.** Unhandled throws auto-capture via `onRequestError`
  ([instrumentation.ts](src/instrumentation.ts)). Manual captures are only for try/catch that returns
  instead of throwing (the upload finalizer, the webhook, the cron `runSweep`, admin actions). Skip
  routine user rejections (cap/limits/closed) — not bugs, capturing them is noise + quota burn.
- **Turbopack source maps** need `useRunAfterProductionCompileHook: true` in `withSentryConfig` +
  `@sentry/nextjs` ≥ 10.13 (post-build upload). **Don't use `excludeServerRoutes`** (unsupported under
  Turbopack); `disableLogger` is deprecated (removed).
- **Never let Sentry touch the Stripe webhook's raw body** — it reads `req.text()` once for the
  signature; capture only the already-parsed error/event.
- **PII** — `sendDefaultPii: false` + `scrubEvent` (strips presigned-URL query strings + emails). Session
  Replay is **on-error only** + `blockAllMedia` + `maskAllText` (guests' photos + typed text never
  recorded); note session recording in the privacy policy.

---

## Architecture & routing

One Next app, route groups on one domain (ADR-0002):

```
src/app/
  layout.tsx              # the ONLY root layout (html/body, fonts, Providers, Toaster)
  (marketing)/            # public: /, /pricing, /privacy, /terms   → MarketingHeader/Footer
  (auth)/                 # public: /login, /auth/callback          → no gate (see below)
  (app)/                  # GATED: /dashboard …  layout.tsx runs getUser() → redirect /login
  (guest)/                # token route: /e/[token] — the single event link (view+upload, config-driven)
  api/                    # route handlers — most are 501 stubs until their phase
```

- **Login lives in `(auth)`, not `(app)`, on purpose.** The `(app)` layout
  redirects anon users to `/login`; if `/login` were under that gate it would
  redirect to itself forever.
- The always-dark `gallery` surface (`bg-gallery text-gallery-foreground`, media-as-hero) is currently
  UNUSED as a full-page surface: the `/a/` album it powered is removed (ADR-0010), and the one-link Part 2
  view-only state shipped as a config-driven panel-removal on the normal themed event page (NOT a dark
  redesign). The tokens are kept in the design system (the lightbox backdrop + `SaveEventButton`'s
  `tone="gallery"` variant still reference them) and remain available if a future media-as-hero surface wants them.

---

## DRY single-sources (do NOT duplicate these elsewhere)

| Concern                                                | Single source                                            |
| ------------------------------------------------------ | -------------------------------------------------------- |
| Pricing / tier limits (app side)                       | `src/lib/constants/tiers.ts`                             |
| Pricing / tier limits (DB enforcement)                 | `public.tier_limits()` SQL fn — **must mirror tiers.ts** |
| Universal per-file media limits (5 min / 2 GB / 50 MB) | `src/lib/media/limits.ts`                                |
| R2 object keys (+ `parseMediaIdFromKey`/`parseExtFromKey`) | `src/lib/r2/keys.ts`                                  |
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

**`get_advisors` flags the 8 capability-token RPCs as ACCEPTED BY DESIGN — do not
"fix" them.** (`get_public_album` was REMOVED in the one-link consolidation — ADR-0010, dropping the
anon list from 9 to 8.) It reports `get_event_by_qr_token`,
`create_guest`, `create_media`, `get_upload_context` (Phase 2), `create_report`
(Phase 3), `capture_guest_email` (Phase 6 — guest email capture),
`get_event_media_by_qr_token` (Phase 6 — unified guest event page), and
`verify_event_password` (config rework Phase 1 — password unlock; ADR-0007) as SECURITY
DEFINER functions executable by `anon` (and `authenticated`). **`set_event_password` /
`clear_event_password`, plus `has_password` / `verify_current_password` (account
email+password, ADR-0011), are SECURITY DEFINER but REVOKED from `anon`/PUBLIC**
(authenticated-only, the same class as `create_media_as_host`) — they appear ONLY in the
authenticated advisor list (lint `0029`), never the anon one (`0028`). (`has_password` /
`verify_current_password` only READ `auth.users` and return booleans; the password hash never
leaves the DB, same invariant as `verify_event_password`.)
That is intentional: the opaque token IS the authorization (ADR-0004). Revoking
their EXECUTE grant breaks the entire anonymous guest flow. (The trigger-only
functions were locked down in migration `…_lock_down_trigger_functions` — those are
_not_ meant to be callable.) The "Leaked Password Protection Disabled" WARN is now
**ACTIONABLE** (it used to be "unrelated — magic-link/OAuth only"): account email+password
sign-in shipped (ADR-0011), so **enable HaveIBeenPwned leaked-password protection** in the
Supabase dashboard (a launch task — see STATUS).

**The two host-upload RPCs (`create_media_as_host`, `get_host_upload_context`) are
`authenticated`-ONLY and ACCEPTED BY DESIGN under lint `0029` — they are NOT on the
anon (`0028`) list above.** They're SECURITY DEFINER but `revoke ... from public, anon`
+ `grant ... to authenticated`, and each authorizes internally via `auth.uid()` + event
ownership (the FIRST `auth.uid()`-in-SECURITY-DEFINER functions here — it resolves fine
under `set search_path = ''`). So `get_advisors` lists them under
`authenticated_security_definer_function_executable` (0029) and NEVER under
`anon_security_definer_function_executable` (0028). That split IS the security property:
if either ever appears in the anon (0028) list, an over-broad grant slipped in. Don't
revoke the `authenticated` grant (breaks host upload).

**`purge_media_rows` must stay REVOKED from `anon`/`authenticated` (service-role
only).** It's SECURITY DEFINER like the others but service-role-internal (the purge
cron calls it via the admin client), so it must **never** appear in the advisor list
above — if it ever shows up there, an over-broad grant slipped in. Same protection
class as the trigger-only functions.

**`set_event_slug` / `clear_event_slug` (custom event slugs, ADR-0012) are the newest
`authenticated`-only host RPCs** (same class as the host-upload + password RPCs): SECURITY DEFINER,
`auth.uid()` + ownership + tier-gated, on the 0029 list and NEVER 0028. **GOTCHA learned here —
functions created via the Supabase MCP `apply_migration` inherit a default privilege that GRANTS
EXECUTE to `anon`.** So the bare `revoke ... from public` that sufficed for the older CLI-created
`set_event_password` did NOT remove anon's grant — `has_function_privilege('anon', …)` was still true
and both slug RPCs showed up in the anon (0028) advisor list. **Any host-only RPC created via the MCP
must explicitly `revoke execute ... from anon`** (not just `from public`); fixed in
`…_custom_event_slug_revoke_anon`. Always re-run `get_advisors` after adding an RPC to confirm anon vs
authenticated placement.

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
- **Host table writes are COLUMN-locked, not just row-locked.** RLS gates the ROW (ownership), NOT
  which columns change, and Supabase's default grant gives `authenticated` UPDATE/INSERT/DELETE on
  every column. So host-writable tables must `revoke insert,update,delete ... from authenticated` and
  re-grant ONLY the legit columns. **`profiles`** (display_name/email/announcements_seen_at/welcomed_at)
  and **`media`** (UPDATE `status`,`removed_at` only; no insert/delete — see
  `…_lock_down_media_write_grant`) are the locked models. **Recovery Phase 2 added `media.purge_at`
  but did NOT change the grant** — `purge_at` is set by a BEFORE trigger (`set_media_purge_at`), which
  writes `NEW.purge_at` WITHOUT the caller needing the column grant (the privilege check is only on the
  statement's SET-list), so it stays un-spoofable. Do NOT grant `update(purge_at)`. This is load-bearing: recovery Phase 1
  made the cap read `SUM(media.file_size_bytes)`, so the old broad grant let a host PATCH
  `file_size_bytes=0` to evade it (confirmed + fixed). **`events` is now column-locked too**
  (security Phase 1, `…163011_lock_down_events_write_grant`): re-granted only `name`/`description`/
  `event_date`/`visibility`/`accepting_uploads`/`require_email`/`moderation_mode`/`qr_style` (+
  `insert(host_id)` + `update(deleted_at)`); `event_password_hash`/`custom_slug`/`qr_token`/`purge_at`
  are revoked from the host (written ONLY by their RPCs / the `set_event_purge_at` trigger / the DB
  default), and `anon` is fully revoked. **LESSON (this CVE's root cause): a column-level
  `revoke update(col)` is a SILENT NO-OP while a table-level grant stands.** The earlier
  `set_event_password`/`set_event_slug` migrations ran `revoke update(event_password_hash/custom_slug)`
  but never revoked the TABLE grant, so live `has_column_privilege('authenticated', 'events', …)` was
  TRUE for every column — a free host could PATCH a hash / `custom_slug` / `require_email=true` to steal
  Pro features. You MUST `revoke insert,update,delete … from authenticated` at the TABLE level FIRST,
  then `grant (cols)`; re-run `get_advisors` + `has_column_privilege` to confirm. Value-gates a bare
  grant can't express are enforced by triggers/CHECK: `require_email`'s Pro gate = `enforce_event_pro_gates`
  (raises 42501 on Free; distinct from `enforce_event_limit`'s 23514), and the
  `events_password_requires_hash` CHECK forbids `visibility='password'` with a null hash. **Phase 2 — the broad
  white-hat sweep — is DONE (2026-06-04; ADR-0014):** the least-privilege grant sweep extended to ALL
  tables (`saved_events` keeps DELETE for the RLS unsave + INSERT only via `save_event`; `highlight_reels`,
  `media`-anon, `profiles`-insert/delete, and the 9 deny-all tables locked — migration `…175656`); the
  **upload size-spoof cap-evasion** (the insert-side twin of this CVE — `create_media`/`_as_host` trusted
  the CLIENT `file_size_bytes`, so a PUT-big-claim-tiny upload beat the cap) is closed by re-deriving the
  real size from an **R2 HEAD at complete** (`headObjectSize` in r2/presign.ts; the complete routes pass
  the HEAD size, never the client's). `duration_seconds`/`width`/`height` stay client-supplied + are
  NON-AUTHORITATIVE (the byte cap is the cost boundary). A **venue-NAT-aware unlock rate-limiter** shipped
  (count failures + clear-on-success → a venue crowd is never blocked; deny-all `unlock_attempts`, migration
  `…180225`). The audit confirmed the rest sound (every secdef RPC `search_path=''`, no dynamic SQL;
  profiles already locked; cross-tenant + escalation proven via rolled-back matrices). **Deferred** (a
  future edge pass): per-IP rate-limiting for `create_report` + the presign routes.
- **The service-role / secret key is server-only.** It lives behind
  `src/lib/supabase/admin.ts` (`import "server-only"`) and must never be prefixed
  `NEXT_PUBLIC_` or reach a client bundle.
- **Events have no end date** — only deletion frees an event slot (this is the
  anti-abuse core; see tiers.ts and ADR/PRD). Don't add an "end event" path that
  keeps media accessible.

---

## Working conventions

- **Site/app copy reads human — NO em-dashes (`—`).** In any user-facing copy (marketing, help,
  blog, app UI), never use the em-dash; it now reads as an "AI copy" tell. Recast with a comma,
  parentheses, a colon, or two sentences (whichever is most natural). Code comments and internal docs
  are exempt. This is a forward policy (write new/edited copy this way; fix opportunistically on pages
  you touch), not a blind retroactive find-replace. A **Vitest guard**
  ([`no-em-dash-policy.test.ts`](src/lib/no-em-dash-policy.test.ts)) enforces this across the **WHOLE
  app** (`app` + `components` + `lib`): it walks the TS AST, so it checks string/template/JSX copy and
  skips comments, and it flags both the literal `—` and the `&mdash;` HTML entity. So the entire
  user-facing surface (marketing, the host/guest/auth UI, API/DB/validation messages, and the email
  templates) is em-dash-free + regression-guarded: any new em-dash anywhere fails `pnpm test`. (When
  recasting, fit the spot — a colon for a list, parens for an aside, a comma or two sentences for prose;
  sharpen weak copy rather than mechanically dropping the dash.)
- **Leave WHY comments for the next agent.** Explain non-obvious decisions,
  gotchas, and what NOT to do — the existing files model this density. Don't
  narrate the obvious; do capture hard-won findings.
- **Keep the knowledge docs current as you learn.** This file, `docs/SYSTEMS.md`,
  `docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PRICING.md`, and the ADRs are living — when you hit
  a new gotcha, ship a feature, or change an approach, update them in the same change. The phased
  build is done (one-off-task mode), so: update the affected **SYSTEMS** entry (what exists),
  advance **STATUS** (you-are-here + human blockers), and tick/trim the **ROADMAP** backlog. A
  future agent (or future you) should be able to trust them.
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
