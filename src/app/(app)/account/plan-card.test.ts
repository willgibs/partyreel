import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * THE PLAN CARD NEVER TRUSTS THE CLIENT (home-wiring, 2026-09-20).
 *
 * Billing got its first door this round (`you=?`, Will: "plans, billing, etc
 * should live under an account page"), and a Plan card is precisely the
 * surface where reading an entitlement from somewhere cheap would be most
 * tempting and most wrong. billing-caps.md's standing landmine: the Stripe
 * webhook is the SOLE writer of `tier` / `storage_cap_bytes` / `event_slots`,
 * always through the service-role client, and nothing else may decide them.
 *
 * So this pins the READ PATH, not the card's looks: the tier comes from the
 * RLS-scoped profile row, and this page's only search param stays the
 * password-reset flag it already had. A future `?plan=pro` that quietly
 * dressed the card as Pro would turn this red.
 */

const page = readFileSync(
  join(process.cwd(), "src", "app", "(app)", "account", "page.tsx"),
  "utf8",
);

describe("the plan card's tier read", () => {
  it("derives the tier from the server-side profile row", () => {
    expect(page).toContain("getProfile()");
    expect(page).toMatch(/toBillingTier\(profile\.tier \?\? DEFAULT_TIER\)/);
  });

  it("takes every plan fact from that row, never from a param or a prop", () => {
    // The four webhook-written columns, each read off `profile` directly.
    for (const column of [
      "profile.tier",
      "profile.storage_cap_bytes",
      "profile.event_slots",
      "profile.tier_expires_at",
      "profile.stripe_customer_id",
    ]) {
      expect(page, `${column} must be read from the profile row`).toContain(
        column,
      );
    }
  });

  it("admits only ?reset, ?welcome and ?email_change, and none may carry a plan", () => {
    // Widening the searchParams type is the change that would let a plan claim
    // in via the URL, so the type itself is the tripwire. `welcome` was added by
    // app-pricing-wiring (`back=finish`): it opens the receipt modal and nothing
    // else, and the modal's own claim is `tier !== "free"` read from the profile
    // row below. `email_change` was added by identity-email: /auth/callback's
    // landing for a tapped email-change link, parsed to one of three words that
    // pick a line of copy in the email row, while the address and the pending
    // change are read from getUser(). EXTENDED, never loosened: a fourth param
    // needs a reason here.
    expect(page).toMatch(
      /searchParams:\s*Promise<\{\s*reset\?:\s*string;\s*welcome\?:\s*string;\s*email_change\?:\s*string;?\s*\}>/,
    );
    expect(page).toContain("parseEmailChangeHint(email_change)");
  });

  it("decides the receipt's claim from the tier, never from the marker", () => {
    // The Stripe webhook is the sole writer of profiles.tier and Stripe
    // redirects the instant payment succeeds, so `?welcome=pro` proves a
    // payment and never a plan. `applied={tier !== "free"}` is the whole of the
    // difference between an honest receipt and a lie that looks like a bug.
    expect(page).toContain('applied={tier !== "free"}');
    // And the marker itself is compared to the one value the route sends.
    expect(page).toContain("welcome === WELCOME_VALUE");
  });

  it("keeps billing on this card, which is the only home it has", () => {
    // `doors=menu` and his note: no dedicated Billing page unless it earns one,
    // so the user menu's Plan and storage row points at #plan HERE. Losing the
    // anchor turns that row into a scroll to the top of a five-card page.
    expect(page).toContain('id="plan"');
  });

  it("single-sources every limit from tiers.ts", () => {
    // The numbers are one source (tiers.ts, mirrored by the tier_limits() SQL
    // function under a parity test). A hand-written cap on this card would be
    // a second home for a number the webhook and the database already agree on.
    expect(page).toContain('from "@/lib/constants/tiers"');
    expect(page).toContain("effectiveStorageCap(");
    expect(page).toContain("MAX_EVENTS[tier]");
  });
});
