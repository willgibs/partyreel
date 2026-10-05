/**
 * ★ WHEN A PASS-TO-PRO CREDIT IS STUCK (credit-watch): the one rule the Accounts pages, the jobs console and the reads
 * judge by, at its edges. An hour at one step: a claim with no grant and no live lease, or a grant never converted. A
 * delivery at work (a live lease), a claim under the hour (Stripe's retry on its way), a credit done and a released
 * claim are never stuck. Its PostgREST form is held to it in `queries/pass-credits.test.ts`.
 */
import { describe, expect, it } from "vitest";

import {
  PASS_CREDIT_STUCK_AFTER_MS,
  stuckKind,
  stuckSince,
  type CreditClaimState,
} from "@/lib/billing/passes-stuck";

const NOW = Date.parse("2026-10-05T12:00:00.000Z");
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const ahead = (ms: number) => new Date(NOW + ms).toISOString();
const MIN = 60_000;

function claim(over: Partial<CreditClaimState>): CreditClaimState {
  return {
    claimed_until: null,
    granted_at: null,
    converted_at: null,
    released_at: null,
    created_at: ago(30 * MIN),
    ...over,
  };
}

describe("stuckKind", () => {
  it("is an hour at one step", () => {
    expect(PASS_CREDIT_STUCK_AFTER_MS).toBe(60 * MIN);
  });

  it("★ a claim with no grant an hour after it was taken, no delivery holding it, is never granted", () => {
    expect(
      stuckKind(
        claim({ created_at: ago(61 * MIN), claimed_until: ago(51 * MIN) }),
        NOW,
      ),
    ).toBe("never_granted");
    // At the hour exactly it is not yet past it.
    expect(
      stuckKind(
        claim({ created_at: ago(60 * MIN), claimed_until: ago(50 * MIN) }),
        NOW,
      ),
    ).toBeNull();
    // Under the hour, its lease over: Stripe's retry is on its way.
    expect(
      stuckKind(
        claim({ created_at: ago(20 * MIN), claimed_until: ago(10 * MIN) }),
        NOW,
      ),
    ).toBeNull();
  });

  it("★ a live lease is a delivery at work on it, however old the claim (a retry that took it over)", () => {
    expect(
      stuckKind(
        claim({ created_at: ago(5 * 60 * MIN), claimed_until: ahead(MIN) }),
        NOW,
      ),
    ).toBeNull();
    // A lease ending at this very instant holds nothing (the claim's own `claimed_until > now()`).
    expect(
      stuckKind(
        claim({ created_at: ago(5 * 60 * MIN), claimed_until: ago(0) }),
        NOW,
      ),
    ).toBe("never_granted");
  });

  it("★ a grant whose passes have not converted an hour after it landed is never converted", () => {
    expect(
      stuckKind(
        claim({ created_at: ago(70 * MIN), granted_at: ago(61 * MIN) }),
        NOW,
      ),
    ).toBe("never_converted");
    // Granted moments ago: converting.
    expect(
      stuckKind(
        claim({ created_at: ago(90 * MIN), granted_at: ago(MIN) }),
        NOW,
      ),
    ).toBeNull();
  });

  it("a credit done, or a claim released because another checkout credited its passes, is never stuck", () => {
    expect(
      stuckKind(
        claim({
          created_at: ago(5 * 60 * MIN),
          granted_at: ago(5 * 60 * MIN),
          converted_at: ago(5 * 60 * MIN),
        }),
        NOW,
      ),
    ).toBeNull();
    expect(
      stuckKind(
        claim({
          created_at: ago(5 * 60 * MIN),
          released_at: ago(4 * 60 * MIN),
        }),
        NOW,
      ),
    ).toBeNull();
    // Released beside a grant its dead holder made: settled too (the operator reverses one in Stripe).
    expect(
      stuckKind(
        claim({
          created_at: ago(5 * 60 * MIN),
          granted_at: ago(4 * 60 * MIN),
          released_at: ago(4 * 60 * MIN),
        }),
        NOW,
      ),
    ).toBeNull();
  });
});

describe("stuckSince", () => {
  it("owes from its claim when never granted, from its grant when never converted", () => {
    const row = claim({ created_at: ago(90 * MIN), granted_at: ago(80 * MIN) });
    expect(stuckSince(row, "never_granted")).toBe(row.created_at);
    expect(stuckSince(row, "never_converted")).toBe(row.granted_at);
  });
});
