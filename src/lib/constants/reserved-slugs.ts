/**
 * Reserved custom-event-slug words.
 *
 * WHY this exists (read before "simplifying" it away): a custom slug resolves ONLY
 * inside `/e/[slug]` (it is an alias to the one event link; guest-flow.md + host-app.md), so
 * this list does NOT prevent route collisions — a slug can never shadow a top-level
 * route like `/admin`, `/pricing`, or `/login` (those live at a different path prefix).
 * It is BRAND / CLARITY / FUTURE-PROOFING, and since custom links came to Free, A GUARD:
 *   - don't let a host grab `/e/admin`, `/e/support`, `/e/billing` and look official;
 *   - reserve `e`, `www`, `api`, `app` so the link never reads ambiguously;
 *   - keep the door open to a future top-level vanity URL without re-litigating names.
 *
 * ★ ENFORCED TWICE, AND THE SECOND IS THE BOUNDARY (the free/pro shift, 2026-09-28). The app
 * layer (eventSlugSchema in lib/validation/event.ts + the server action's re-parse) gives the
 * friendly refusal; `set_event_slug` refuses the same words in SQL, because an authenticated
 * host can call that RPC straight through PostgREST, past the action, and once a free account
 * can hold a custom link, a throwaway one can hold `/e/support`. The SQL array is this set,
 * which tiers-sql.test.ts holds to the newest `set_event_slug`: growing the list is this file
 * plus a migration that restates the function, and the test fails until both move.
 *
 * All entries MUST be lowercase (slugs are normalized to lowercase before the check). A word
 * under the three-character floor ("e") is refused by the length rule already; it stays here
 * so the list reads as the namespace it protects.
 */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  // Product / route words a host shouldn't impersonate.
  "about",
  "account",
  "admin",
  "api",
  "app",
  "auth",
  "billing",
  "blog",
  "careers",
  "contact",
  "dashboard",
  "demo",
  "design",
  "e",
  "events",
  "features",
  "help",
  "host",
  "how-it-works",
  "login",
  "logout",
  "new",
  "partyreel",
  "press",
  "pricing",
  "privacy",
  "reel",
  "settings",
  "signup",
  "support",
  "terms",
  "welcome",
  "www",
  // Words a throwaway account could wear to look like the platform speaking (the shift's
  // guard): an official-looking link is the first step of a phishing page.
  "abuse",
  "legal",
  "official",
  "payment",
  "payments",
  "refund",
  "refunds",
  "safety",
  "security",
  "staff",
  "status",
  "verify",
]);
