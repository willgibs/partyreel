/**
 * HOW THE OPERATOR READS A PASS-TO-PRO CREDIT (credit-watch): each claim's state and its sentence, which the account's
 * page draws and the list's stuck line shares. The states a person must act on (stuck: Retry; two grants: Stripe)
 * need a look, and only the stuck ones carry Retry; a released claim owes nothing; every sentence names its moment to
 * the minute and its credit in dollars.
 */
import { describe, expect, it } from "vitest";

import type { PassCreditRow } from "@/lib/db/queries/pass-credits";

import {
  creditBadge,
  creditDollars,
  creditNeedsALook,
  creditRetryable,
  creditSentence,
  creditState,
  stuckLine,
  type CreditState,
} from "./credits";

const NOW = Date.parse("2026-10-05T12:00:00.000Z");
const MIN = 60_000;
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const ahead = (ms: number) => new Date(NOW + ms).toISOString();

function row(over: Partial<PassCreditRow> = {}): PassCreditRow {
  return {
    stripe_session_id: "cs_test_1",
    profile_id: "44444444-4444-4444-8444-444444444444",
    credit_cents: 1850,
    pass_ids: [
      "00000000-0000-4000-8000-00000000000a",
      "00000000-0000-4000-8000-00000000000b",
    ],
    claimed_until: null,
    balance_transaction_id: null,
    granted_at: null,
    converted_at: null,
    converted_count: null,
    released_at: null,
    created_at: ago(30 * MIN),
    ...over,
  };
}

const granted = (at: string) => ({
  balance_transaction_id: "cbtxn_1",
  granted_at: at,
});

describe("creditState", () => {
  it("reads every state a claim can stand in", () => {
    const cases: [Partial<PassCreditRow>, CreditState][] = [
      [
        {
          ...granted(ago(9 * MIN)),
          converted_at: ago(9 * MIN),
          converted_count: 2,
        },
        "converted",
      ],
      [
        {
          ...granted(ago(9 * MIN)),
          converted_at: ago(9 * MIN),
          converted_count: 0,
        },
        "converted_none",
      ],
      [{ claimed_until: ahead(5 * MIN) }, "granting"],
      [{ ...granted(ago(MIN)) }, "converting"],
      [{ created_at: ago(20 * MIN), claimed_until: ago(10 * MIN) }, "waiting"],
      [
        { created_at: ago(90 * MIN), claimed_until: ago(80 * MIN) },
        "never_granted",
      ],
      [
        { created_at: ago(3 * 60 * MIN), ...granted(ago(2 * 60 * MIN)) },
        "never_converted",
      ],
      [
        { created_at: ago(5 * 60 * MIN), released_at: ago(4 * 60 * MIN) },
        "released",
      ],
      [
        {
          created_at: ago(5 * 60 * MIN),
          ...granted(ago(4 * 60 * MIN)),
          released_at: ago(4 * 60 * MIN),
        },
        "granted_twice",
      ],
    ];
    for (const [over, state] of cases) {
      expect(creditState(row(over), NOW), state).toBe(state);
    }
  });

  it("★ only a stuck credit carries Retry, and the two grants for one set of passes need a look too", () => {
    expect(creditRetryable("never_granted")).toBe(true);
    expect(creditRetryable("never_converted")).toBe(true);
    for (const state of [
      "converted",
      "converted_none",
      "granting",
      "converting",
      "waiting",
      "released",
      "granted_twice",
    ] as const) {
      expect(creditRetryable(state), state).toBe(false);
    }
    expect(creditNeedsALook("granted_twice")).toBe(true);
    expect(creditNeedsALook("converted_none")).toBe(true);
    expect(creditNeedsALook("released")).toBe(false);
    expect(creditNeedsALook("waiting")).toBe(false);
    expect(creditBadge("never_granted")).toBe("Stuck");
    expect(creditBadge("granted_twice")).toBe("Granted twice");
    expect(creditBadge("converted")).toBeNull();
  });
});

describe("the words", () => {
  it("says the credit in dollars, as Stripe's balance does", () => {
    expect(creditDollars(1850)).toBe("$18.50");
    expect(creditDollars(2900)).toBe("$29.00");
  });

  it("★ a stuck claim says why, since when, and that Retry runs it now", () => {
    expect(
      creditSentence(
        row({
          created_at: "2026-10-05T10:00:00.000Z",
          claimed_until: "2026-10-05T10:10:00.000Z",
        }),
        NOW,
      ),
    ).toBe(
      "Claimed Oct 5, 2026, 10:00 UTC for $18.50 over 2 passes, never granted: its delivery died and no retry has finished it. Retry runs it now.",
    );
    expect(
      creditSentence(
        row({
          created_at: "2026-10-05T09:59:00.000Z",
          ...granted("2026-10-05T10:00:00.000Z"),
        }),
        NOW,
      ),
    ).toBe(
      "$18.50 granted Oct 5, 2026, 10:00 UTC; its 2 passes never converted, so she holds both. Retry converts them now.",
    );
  });

  it("a credit done says what became credit; a released one owes nothing; two grants send the operator to Stripe", () => {
    expect(
      creditSentence(
        row({
          ...granted("2026-10-05T09:00:00.000Z"),
          converted_at: "2026-10-05T09:00:01.000Z",
          converted_count: 2,
        }),
        NOW,
      ),
    ).toBe(
      "$18.50 granted Oct 5, 2026, 09:00 UTC; 2 passes became credit Oct 5, 2026, 09:00 UTC.",
    );
    expect(
      creditSentence(
        row({
          pass_ids: ["00000000-0000-4000-8000-00000000000a"],
          created_at: ago(5 * 60 * MIN),
          released_at: "2026-10-05T08:00:00.000Z",
        }),
        NOW,
      ),
    ).toBe(
      "Not credited: another checkout of hers credited its 1 pass first (released Oct 5, 2026, 08:00 UTC). Nothing is owed.",
    );
    expect(
      creditSentence(
        row({
          created_at: ago(5 * 60 * MIN),
          ...granted("2026-10-05T08:00:00.000Z"),
          released_at: "2026-10-05T08:00:00.000Z",
        }),
        NOW,
      ),
    ).toMatch(
      /two credits for one set of passes\. Reverse one grant in Stripe\.$/,
    );
  });

  it("the list's stuck line says which half and since when", () => {
    expect(stuckLine("never_granted", "2026-10-05T10:00:00.000Z")).toBe(
      "Never granted, claimed Oct 5, 2026, 10:00 UTC",
    );
    expect(stuckLine("never_converted", "2026-10-05T10:00:00.000Z")).toBe(
      "Never converted, granted Oct 5, 2026, 10:00 UTC",
    );
  });
});
