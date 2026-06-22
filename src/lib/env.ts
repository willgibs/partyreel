/**
 * Centralized, validated environment access. EVERY env read in the app goes
 * through here — never touch `process.env` directly elsewhere, so a missing or
 * malformed var fails loudly in ONE place instead of as a confusing `undefined`
 * deep inside a request.
 *
 * ⚠️ Supabase key naming (the new API-key system, NOT the legacy JWT keys):
 *   • PUBLISHABLE key = the old "anon" key       → browser-safe, RLS applies.
 *   • SECRET key      = the old "service_role" key → server-only, BYPASSES RLS.
 * Never expose the secret key to the client (see lib/supabase/admin.ts).
 *
 * ⚠️ Next only inlines `process.env.NEXT_PUBLIC_*` by matching the literal text,
 * so each public var MUST be referenced explicitly below (no dynamic key access).
 *
 * Most server vars are `.optional()` THIS round on purpose: R2 (Phase 2) and
 * Stripe (Phase 4) aren't wired yet, and the skeleton must boot/deploy without
 * them. Promote each to required as the phase that needs it lands.
 */
import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  // Canonical site origin for absolute links (QR/share URLs, OAuth redirects).
  // Optional locally (code falls back to the request origin); set in prod.
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
  // The qr_token of a curated DEMO event. When set, marketing shows a real
  // scannable demo QR + a "Try the live demo" CTA, and that event's /e/[qr_token]
  // guest page runs in demo mode (uploads simulated client-side, never persisted —
  // see lib/demo.ts). Optional: unset → no demo surfaces anywhere.
  NEXT_PUBLIC_DEMO_QR_TOKEN: z.string().min(1).optional(),
  // Host that serves the internal admin/operations portal (e.g.
  // "admin.partyreel.com"). When set, the proxy + the /admin layout gate the portal
  // to this subdomain (the apex 404s /admin). Optional: unset in local dev, where
  // the portal is reachable directly at /admin and the proxy adds no host behavior.
  NEXT_PUBLIC_ADMIN_HOST: z.string().min(1).optional(),
  // Sentry DSN (public by design — safe in the client bundle). When unset, Sentry is a
  // no-op (commonInit sets enabled:false) so dev/unconfigured never sends and the build
  // stays green. The build-time SENTRY_AUTH_TOKEN / SENTRY_ORG / SENTRY_PROJECT (source-map
  // upload) are read directly in next.config.ts, not here (build tooling, not app runtime).
  NEXT_PUBLIC_SENTRY_DSN: z.string().min(1).optional(),
});

const serverSchema = z.object({
  // Supabase service-role ("secret") key — server-only, bypasses RLS.
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  // Cloudflare R2 (Phase 2).
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET: z.string().min(1).optional(),
  // Vercel Cron shared secret (Phase 3 purge sweeper). Vercel auto-sends it as
  // `Authorization: Bearer $CRON_SECRET` when invoking the cron; the route verifies it.
  CRON_SECRET: z.string().min(1).optional(),
  // Stripe (Phase 4). Keys + the Pro Price IDs (one per storage option). All
  // `.optional()` so the app builds without them; assertStripeEnv() asserts at request time.
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_PRICE_PRO_100: z.string().min(1).optional(),
  STRIPE_PRICE_PRO_500: z.string().min(1).optional(),
  STRIPE_PRICE_PRO_2TB: z.string().min(1).optional(),
  // Cut 4c — one-time Event Pass price. NOT in assertStripeEnv()'s hard assert (Pro
  // routes keep working if it's unset); validated lazily by priceIdForPlan.
  STRIPE_PRICE_EVENT_PASS: z.string().min(1).optional(),
  // Cheaper one-time renewal price for returning Event Pass holders (Cut FF-C).
  STRIPE_PRICE_EVENT_PASS_RENEWAL: z.string().min(1).optional(),
  // Resend (transactional email — fast-follows). EMAIL_FROM is the verified sender,
  // e.g. "Partyreel <noreply@partyreel.com>". Both `.optional()`; assertResendEnv()
  // asserts them lazily so the app builds/deploys before the key + domain are set.
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).optional(),
  // Where contact/careers notification emails are SENT (a real receiving inbox).
  // Optional — the action defaults to SUPPORT_EMAIL (help@partyreel.com). Set in
  // Vercel to an inbox you read; swap it later (no code change) once help@ receives.
  CONTACT_NOTIFY_EMAIL: z.email().optional(),
  // HMAC secret for the password-protected-album unlock cookie (Phase 1). A random
  // string; `.optional()` so the app builds without it. assertUnlockEnv() asserts it
  // at request time (the unlock route 500s if unset). Set in Vercel + .env.local.
  UNLOCK_COOKIE_SECRET: z.string().min(1).optional(),
  // Shared bearer secret for the backup-prune confirm endpoint (ADR-0013). The media-backup Worker
  // (workers/backup, the weekly `prune` branch) POSTs candidate mediaIds to /api/internal/backup-prune
  // with `Authorization: Bearer $PRUNE_API_SECRET`; the route verifies it (timing-safe) before any DB
  // confirm. `.optional()` so the app builds without it; assertPruneApiEnv() asserts at request time so
  // the route fails closed rather than confirm deletions for an unauthenticated caller.
  PRUNE_API_SECRET: z.string().min(1).optional(),
  // Gate key for the V1 identity-exploration playground at /design (the (dev) route group).
  // Production requires `?key=` to match (timing-safe, see app/(dev)/design/gate.ts); dev mode is
  // open. `.optional()`: unset in prod means the playground simply 404s everywhere. Not a classic
  // secret (it gates mockups, no data), but kept server-side so the URL can't be derived from the
  // bundle.
  DESIGN_PREVIEW_KEY: z.string().min(1).optional(),
  // "Download all" zip export (the streaming export Worker, workers/export). EXPORT_SIGNING_SECRET is
  // the HMAC secret the mint routes sign the manifest token with + the Worker verifies; it must match
  // the Worker's `wrangler secret put EXPORT_SIGNING_SECRET`. EXPORT_WORKER_URL is the deployed Worker
  // origin (the *.workers.dev URL for v1) the mint route returns so the browser form-POSTs the token
  // there. Both `.optional()` so the app builds before they're set; assertExportEnv() asserts at
  // request time so the mint route fails closed (never mints an unsigned/destinationless token).
  EXPORT_SIGNING_SECRET: z.string().min(1).optional(),
  EXPORT_WORKER_URL: z.url().optional(),
});

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  • ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}

function parsePublic() {
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_DEMO_QR_TOKEN: process.env.NEXT_PUBLIC_DEMO_QR_TOKEN,
    NEXT_PUBLIC_ADMIN_HOST: process.env.NEXT_PUBLIC_ADMIN_HOST,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  });
  if (!parsed.success) {
    throw new Error(
      `Invalid public environment variables:\n${formatIssues(parsed.error)}`,
    );
  }
  return parsed.data;
}

function parseServer() {
  const parsed = serverSchema.safeParse({
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET: process.env.R2_BUCKET,
    CRON_SECRET: process.env.CRON_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_PRO_100: process.env.STRIPE_PRICE_PRO_100,
    STRIPE_PRICE_PRO_500: process.env.STRIPE_PRICE_PRO_500,
    STRIPE_PRICE_PRO_2TB: process.env.STRIPE_PRICE_PRO_2TB,
    STRIPE_PRICE_EVENT_PASS: process.env.STRIPE_PRICE_EVENT_PASS,
    STRIPE_PRICE_EVENT_PASS_RENEWAL:
      process.env.STRIPE_PRICE_EVENT_PASS_RENEWAL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    CONTACT_NOTIFY_EMAIL: process.env.CONTACT_NOTIFY_EMAIL,
    UNLOCK_COOKIE_SECRET: process.env.UNLOCK_COOKIE_SECRET,
    PRUNE_API_SECRET: process.env.PRUNE_API_SECRET,
    DESIGN_PREVIEW_KEY: process.env.DESIGN_PREVIEW_KEY,
    EXPORT_SIGNING_SECRET: process.env.EXPORT_SIGNING_SECRET,
    EXPORT_WORKER_URL: process.env.EXPORT_WORKER_URL,
  });
  if (!parsed.success) {
    throw new Error(
      `Invalid server environment variables:\n${formatIssues(parsed.error)}`,
    );
  }
  return parsed.data;
}

/** Browser-safe, validated public env (validated eagerly at import). */
export const env = parsePublic();

/**
 * Server-only env. All vars are optional this round, so this won't throw yet;
 * any caller that REQUIRES a value (e.g. the admin client) must assert it.
 * Referencing these in client code is safe — Next replaces non-public
 * `process.env.*` with `undefined`, so secrets are never bundled.
 */
export const serverEnv = parseServer();

/**
 * Assert the four R2 vars are present and return them as required strings.
 * Call at REQUEST time (never at import/build) — the R2 vars stay `.optional()`
 * so the app still builds/deploys without creds; this is where an upload path
 * fails loudly with a clear message instead of a cryptic `undefined` in the SDK.
 */
export function assertR2Env(): {
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET: string;
} {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } =
    serverEnv;
  if (
    !R2_ACCOUNT_ID ||
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !R2_BUCKET
  ) {
    throw new Error(
      "R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, " +
        "R2_SECRET_ACCESS_KEY, and R2_BUCKET (see .env.example).",
    );
  }
  return { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET };
}

/**
 * Assert CRON_SECRET is present and return it. Call at REQUEST time in the cron
 * route — it stays `.optional()` so the app still builds/deploys before the secret
 * is set in Vercel. A missing secret means the route can't authenticate Vercel's
 * invocation, so it must fail closed (the caller returns 401/500) rather than run
 * an unauthenticated purge.
 */
export function assertCronEnv(): { CRON_SECRET: string } {
  const { CRON_SECRET } = serverEnv;
  if (!CRON_SECRET) {
    throw new Error(
      "CRON_SECRET is not configured. Set it in the Vercel project env so the " +
        "purge cron can authenticate Vercel's Authorization: Bearer invocation.",
    );
  }
  return { CRON_SECRET };
}

/**
 * Assert the Stripe vars are present and return them as required strings. Call at
 * REQUEST time (the Stripe routes) — they stay `.optional()` so the app builds/
 * deploys before the keys are set. Asserts all five together (key + webhook secret +
 * the 3 Pro Price IDs) so a partial config fails loudly rather than half-working;
 * they're set together (see PRICING.md "Stripe setup"). The webhook is the SOLE
 * writer of profiles.tier — a missing secret here means it can't verify Stripe's
 * signature, so failing closed is correct.
 */
export function assertStripeEnv(): {
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PRICE_PRO_100: string;
  STRIPE_PRICE_PRO_500: string;
  STRIPE_PRICE_PRO_2TB: string;
} {
  const {
    STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_PRO_100,
    STRIPE_PRICE_PRO_500,
    STRIPE_PRICE_PRO_2TB,
  } = serverEnv;
  if (
    !STRIPE_SECRET_KEY ||
    !STRIPE_WEBHOOK_SECRET ||
    !STRIPE_PRICE_PRO_100 ||
    !STRIPE_PRICE_PRO_500 ||
    !STRIPE_PRICE_PRO_2TB
  ) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and " +
        "STRIPE_PRICE_PRO_100 / _500 / _2TB (see docs/PRICING.md 'Stripe setup').",
    );
  }
  return {
    STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_PRO_100,
    STRIPE_PRICE_PRO_500,
    STRIPE_PRICE_PRO_2TB,
  };
}

/**
 * Assert the Resend vars are present and return them. Call at REQUEST time (the email
 * helper / the lifecycle cron) — they stay `.optional()` so the app builds before the
 * key + verified sending domain exist. A missing key means transactional email can't
 * send; callers should fail loudly rather than silently drop mail.
 */
export function assertResendEnv(): {
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
} {
  const { RESEND_API_KEY, EMAIL_FROM } = serverEnv;
  if (!RESEND_API_KEY || !EMAIL_FROM) {
    throw new Error(
      "Resend is not configured. Set RESEND_API_KEY and EMAIL_FROM (a verified " +
        "sender, e.g. 'Partyreel <noreply@partyreel.com>'). See docs/PRICING.md.",
    );
  }
  return { RESEND_API_KEY, EMAIL_FROM };
}

/**
 * Assert UNLOCK_COOKIE_SECRET is present and return it. Call at REQUEST time (the
 * password-unlock route) — it stays `.optional()` so the app builds/deploys before
 * the secret is set. A missing secret means we can't sign/verify the unlock cookie,
 * so the unlock route must fail closed (500) rather than mint an unsigned cookie.
 */
export function assertUnlockEnv(): { UNLOCK_COOKIE_SECRET: string } {
  const { UNLOCK_COOKIE_SECRET } = serverEnv;
  if (!UNLOCK_COOKIE_SECRET) {
    throw new Error(
      "UNLOCK_COOKIE_SECRET is not configured. Set it in Vercel + .env.local so " +
        "password-protected albums can sign the unlock cookie.",
    );
  }
  return { UNLOCK_COOKIE_SECRET };
}

/**
 * Assert PRUNE_API_SECRET is present and return it. Call at REQUEST time (the backup-prune confirm
 * endpoint) — it stays `.optional()` so the app builds/deploys before the secret is set. A missing
 * secret means we can't authenticate the backup Worker's invocation, so the route must fail closed
 * (500) rather than confirm backup deletions for an unauthenticated caller.
 */
export function assertPruneApiEnv(): { PRUNE_API_SECRET: string } {
  const { PRUNE_API_SECRET } = serverEnv;
  if (!PRUNE_API_SECRET) {
    throw new Error(
      "PRUNE_API_SECRET is not configured. Set it in Vercel + the backup Worker " +
        "(wrangler secret put PRUNE_API_SECRET) so the deletion-aware prune can authenticate.",
    );
  }
  return { PRUNE_API_SECRET };
}

/**
 * Assert the two export vars are present and return them. Call at REQUEST time (the export mint
 * routes) — they stay `.optional()` so the app builds/deploys before the Worker is deployed. A
 * missing secret means we can't sign the manifest token; a missing URL means there's nowhere to send
 * the browser. Either way the mint route must fail closed (500) rather than hand back a token nothing
 * can verify or a download that goes nowhere. EXPORT_SIGNING_SECRET must equal the Worker's secret.
 */
export function assertExportEnv(): {
  EXPORT_SIGNING_SECRET: string;
  EXPORT_WORKER_URL: string;
} {
  const { EXPORT_SIGNING_SECRET, EXPORT_WORKER_URL } = serverEnv;
  if (!EXPORT_SIGNING_SECRET || !EXPORT_WORKER_URL) {
    throw new Error(
      "Export is not configured. Set EXPORT_SIGNING_SECRET (matching the export Worker's " +
        "`wrangler secret put EXPORT_SIGNING_SECRET`) and EXPORT_WORKER_URL (the deployed " +
        "Worker origin) in Vercel + .env.local.",
    );
  }
  return { EXPORT_SIGNING_SECRET, EXPORT_WORKER_URL };
}
