import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Account-deletion invariants, pinned against the SOURCE TEXT.
 *
 * Why text and not behavior: both modules are `server-only` (R2 + the
 * service-role client), so importing them from the node project is impossible,
 * and every property below is an ORDERING or a WRITE SCOPE - a calling
 * convention rather than a value a unit test can observe without a live
 * database. Same tool, same reason, as request-auth-policy.test.ts. The runtime
 * behavior is verified against the real Supabase/R2/Stripe TEST instead.
 *
 * Each pin below is a mistake that would be silent in review and expensive in
 * production:
 *   - anonymising through an entitlement column would break "the Stripe webhook
 *     is the SOLE writer of tier / storage_cap_bytes" (billing-caps.md);
 *   - building an R2 key list before the legal-hold filter would destroy held
 *     evidence, because every delete is R2-FIRST and the SQL guard saves only
 *     the row (ADR-0020);
 *   - deleting the auth user before the media would FK-cascade the key rows away
 *     and orphan the objects forever;
 *   - stamping the request before the Stripe cancellation would delete an
 *     account that keeps getting billed.
 */

const ROOT = process.cwd();
const SWEEP = join(ROOT, "src/lib/lifecycle/account-deletion.ts");
const REQUEST = join(ROOT, "src/lib/db/mutations/account.ts");

const sweepSrc = readFileSync(SWEEP, "utf8");
const requestSrc = readFileSync(REQUEST, "utf8");

/** The columns only the Stripe webhook / the service layer may ever write. */
const ENTITLEMENT_COLUMNS = [
  "tier",
  "storage_cap_bytes",
  "storage_used_bytes",
  "storage_grace_until",
  "stripe_customer_id",
  "stripe_subscription_id",
  "stripe_event_created_at",
  "event_slots",
  "tier_expires_at",
  "is_admin",
];

function anonymisePatchLiteral(): string {
  const match = sweepSrc.match(
    /export const ANONYMISED_PROFILE_PATCH = \{([\s\S]*?)\} as const;/,
  );
  expect(match, "ANONYMISED_PROFILE_PATCH literal not found").toBeTruthy();
  return match![1];
}

describe("the anonymisation patch", () => {
  it("clears exactly the identity columns", () => {
    const keys = [...anonymisePatchLiteral().matchAll(/^\s*(\w+):/gm)].map(
      (m) => m[1],
    );
    expect(keys.sort()).toEqual(
      ["avatar_updated_at", "display_name", "email", "slug"].sort(),
    );
  });

  it("sets every one of them to null (an anonymisation, not a rename)", () => {
    const values = [...anonymisePatchLiteral().matchAll(/^\s*\w+:\s*(\w+),/gm)];
    expect(values.length).toBeGreaterThan(0);
    for (const [, value] of values) expect(value).toBe("null");
  });

  it("never touches an entitlement column", () => {
    const literal = anonymisePatchLiteral();
    for (const column of ENTITLEMENT_COLUMNS) {
      expect(literal, `${column} must stay the webhook's to write`).not.toMatch(
        new RegExp(`\\b${column}\\b`),
      );
    }
  });

  it("is the single source both halves write", () => {
    // The request path imports it rather than restating the columns, so the two
    // can never drift into anonymising different things.
    expect(requestSrc).toContain("ANONYMISED_PROFILE_PATCH");
    expect(requestSrc).not.toMatch(/display_name:\s*null/);
  });
});

/**
 * The sweep's own body, so an ordering pin can never accidentally match a
 * helper defined above it (the `purgeRows` wrapper is the obvious trap: its
 * definition sits before the function that calls it).
 */
function sweepBody(): string {
  const start = sweepSrc.indexOf("export async function purgeAccount");
  const end = sweepSrc.indexOf("export type AccountDeletionState");
  expect(start, "purgeAccount not found").toBeGreaterThan(-1);
  expect(end, "the sweep body has no end marker").toBeGreaterThan(start);
  return sweepSrc.slice(start, end);
}

describe("the sweep's destruction order", () => {
  const body = sweepBody();
  const holdFilter = body.indexOf('.filter("legal_hold_at"');
  const partition = body.indexOf("partitionEventsByHold(");
  const r2Delete = body.indexOf("deleteR2Objects(");
  const purge = body.indexOf("purgeRows(admin, mediaIds)");
  const eventDelete = body.search(/\.from\("events"\)\s*\.delete\(\)/);
  const authDelete = body.indexOf("auth.admin.deleteUser(");

  it("finds every step it means to order", () => {
    for (const [name, at] of Object.entries({
      holdFilter,
      partition,
      r2Delete,
      purge,
      eventDelete,
      authDelete,
    })) {
      expect(at, `${name} not found in the sweep`).toBeGreaterThan(-1);
    }
  });

  it("filters legal holds before it builds any R2 key list", () => {
    expect(holdFilter).toBeLessThan(r2Delete);
    expect(partition).toBeLessThan(r2Delete);
  });

  it("deletes R2 objects before the rows that name them", () => {
    expect(r2Delete).toBeLessThan(purge);
    expect(r2Delete).toBeLessThan(eventDelete);
  });

  it("deletes the auth user last of all", () => {
    expect(eventDelete).toBeLessThan(authDelete);
    expect(purge).toBeLessThan(authDelete);
  });

  it("counts the remaining events honestly before deleting the auth user", () => {
    // A bare count reads a FAILED query as a confident zero, which here would
    // delete the auth user (cascading its events and media rows) with the
    // objects still in R2.
    const remaining = body.indexOf("mustCount(");
    expect(remaining).toBeGreaterThan(-1);
    expect(remaining).toBeLessThan(authDelete);
    expect(body).toMatch(/if \(remaining > 0\)/);
  });

  it("keeps the account whole when a hold blocks an event", () => {
    // partitionEventsByHold blocks the EVENT, not the item: the FK cascade is
    // all-or-nothing, so a held item must keep its whole event out of the purge.
    expect(body).toContain("const { purgeable, blocked }");
    expect(body).toMatch(/\.in\("id", purgeable\)/);
  });
});

describe("the request path's order", () => {
  const cancel = requestSrc.indexOf("cancelSubscriptionForDeletion(");
  const abort = requestSrc.indexOf('subscription.status === "failed"');
  const stamp = requestSrc.indexOf("deletion_requested_at: new Date()");
  const bin = requestSrc.indexOf("binHostedEvents(");
  const newsletter = requestSrc.indexOf("deleteNewsletterSignups(profile.email)");
  const anonymise = requestSrc.indexOf(".update(ANONYMISED_PROFILE_PATCH)");
  const ban = requestSrc.indexOf("banAuthUser(");

  it("finds every step it means to order", () => {
    for (const [name, at] of Object.entries({
      cancel,
      abort,
      stamp,
      bin,
      newsletter,
      anonymise,
      ban,
    })) {
      expect(at, `${name} not found in the request path`).toBeGreaterThan(-1);
    }
  });

  it("cancels the plan, and refuses the deletion, before anything is destroyed", () => {
    expect(cancel).toBeLessThan(stamp);
    expect(abort).toBeLessThan(stamp);
    expect(requestSrc).toMatch(/code: "subscription"/);
  });

  it("stamps the request before the destructive steps, so the sweep can finish it", () => {
    expect(stamp).toBeLessThan(bin);
    expect(stamp).toBeLessThan(anonymise);
  });

  it("removes the newsletter address before the anonymisation nulls it", () => {
    expect(newsletter).toBeLessThan(anonymise);
  });

  it("locks the auth user out between the request and the sweep", () => {
    expect(requestSrc).toContain("ban_duration");
    expect(ban).toBeGreaterThan(stamp);
  });

  it("never takes an email address from the caller", () => {
    // Both newsletter paths read the address from the caller's own profile row,
    // so the removal can only ever unsubscribe the caller themselves.
    expect(requestSrc).not.toMatch(/deleteNewsletterSignups\(\s*email\s*\)/);
    expect(requestSrc).toContain("deleteNewsletterSignups(profile?.email)");
  });
});
