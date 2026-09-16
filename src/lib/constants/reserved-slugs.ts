/**
 * Reserved custom-event-slug words.
 *
 * WHY this exists (read before "simplifying" it away): a custom slug resolves ONLY
 * inside `/e/[slug]` (it is an alias to the one event link; guest-flow.md + host-app.md), so
 * this list does NOT prevent route collisions — a slug can never shadow a top-level
 * route like `/admin`, `/pricing`, or `/login` (those live at a different path prefix).
 * It is purely BRAND / CLARITY / FUTURE-PROOFING:
 *   - don't let a host grab `/e/admin`, `/e/support`, `/e/billing` and look official;
 *   - reserve `e`, `www`, `api`, `app` so the link never reads ambiguously;
 *   - keep the door open to a future top-level vanity URL without re-litigating names.
 *
 * Enforced in the app layer (eventSlugSchema in lib/validation/event.ts + the server
 * action's re-parse), NOT in SQL — it's policy, not a security boundary, and may grow.
 * All entries MUST be lowercase (slugs are normalized to lowercase before the check).
 */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  // Product / route words a host shouldn't impersonate.
  "admin",
  "api",
  "app",
  "auth",
  "account",
  "billing",
  "blog",
  "careers",
  "contact",
  "dashboard",
  "demo",
  "e",
  "events",
  "features",
  "help",
  "host",
  "login",
  "logout",
  "new",
  "partyreel",
  "pricing",
  "privacy",
  "settings",
  "signup",
  "support",
  "terms",
  "welcome",
  "www",
]);
