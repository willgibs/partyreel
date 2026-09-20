// @contract-for: src/app/(app)/account/page.tsx
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

  it("keeps ?reset as this page's only search param", () => {
    // Widening the searchParams type is the change that would let a plan claim
    // in via the URL, so the type itself is the tripwire.
    expect(page).toMatch(/searchParams:\s*Promise<\{\s*reset\?:\s*string;?\s*\}>/);
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
