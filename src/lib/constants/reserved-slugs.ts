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
 * plus a migration that restates the function, and the test fails until both move. The brand
 * itself is not on the list: its whole FAMILY is refused below, the bare word included.
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

/**
 * ★ THE BRAND IS REFUSED AS A PART, NOT ONLY AS A WHOLE (crumbs-11, 2026-09-29). The words above
 * refuse whole slugs, so any account could hold `/e/partyreel-support`, `/e/official-partyreel`
 * or, the day the demo moves off it, `/e/partyreel-demo`: a page at a URL our own domain seems
 * to vouch for. So a slug that CONTAINS the name is refused, read through the two disguises a
 * slug can wear:
 *   - a hyphen anywhere (`party-reel`, `p-artyreel`), the only separator a slug has;
 *   - a digit for the letter it looks like (`p4rtyreel`, `partyr33l`, `partyree1`, `par7yreel`).
 * Deliberately NOT refused: a dropped or doubled letter (`partyrel`, `partyreeel`). Folding those
 * would refuse ordinary words (`party-relay`, `party-release`), and a typo is not a disguise.
 *
 * The fold is Postgres's `translate(slug, from, to)`, so `set_event_slug` states the same rule in
 * one line, `position('partyreel' in translate(v_slug, '4317-', 'aelt')) > 0`, and
 * tiers-sql.test.ts holds its literals and its sentence to these.
 *
 * ★ A link held before the rule keeps working: nothing re-reads a stored slug or handle against
 * it (the resolvers never validate), so the rule refuses only the next SET, and a control shows
 * the held value as current rather than as refused (lib/slug.ts, handle-field.tsx).
 */
export const BRAND_STEM = "partyreel";

/** Each character of `from` becomes the one at its index in `to`; one past `to`'s end is dropped. */
export const BRAND_FOLD = { from: "4317-", to: "aelt" } as const;

/** Postgres's `translate()`, character for character, so the two halves cannot read differently. */
function translate(value: string, from: string, to: string): string {
  let out = "";
  for (const ch of value) {
    const at = from.indexOf(ch);
    if (at < 0) out += ch;
    else if (at < to.length) out += to[at];
  }
  return out;
}

/** True for a slug that reads as the brand, through either disguise. */
export function isBrandSlug(slug: string): boolean {
  return translate(slug.toLowerCase(), BRAND_FOLD.from, BRAND_FOLD.to).includes(
    BRAND_STEM,
  );
}

/** Every refusal the reserved namespace makes: a whole reserved word, or the brand's family. */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase()) || isBrandSlug(slug);
}

/** The two refusals' sentences, which `set_event_slug` raises word for word. */
export const RESERVED_WORD_MESSAGE = "That word is reserved. Try another.";
export const BRAND_NAME_MESSAGE =
  "The Partyreel name is reserved. Try another.";
