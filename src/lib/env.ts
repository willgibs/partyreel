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
  // Stripe (Phase 4).
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
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
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
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
