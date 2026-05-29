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
