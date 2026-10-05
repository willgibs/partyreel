import { act, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { StuckCredit } from "@/lib/db/queries/pass-credits";

import { BillingChecks } from "./billing-checks";
import type { PortalCheck } from "./portal-check";

/**
 * ★ THE ACCOUNTS LIST'S TWO BILLING CHECKS (credit-watch), in each state they can stand in: quiet when whole; the
 * band's warning, with each account linked to its Retry or each missing price named, when something waits on the
 * operator; and No reading, with why, when a check could not run, never a calm line over a reading not taken. The
 * configuration's line streams (its check is handed over as a promise), saying it is asking until Stripe answers.
 */

const WHOLE: Promise<PortalCheck> = Promise.resolve({
  state: "whole",
  configurationId: "bpc_tagged",
  sold: 6,
});
/** A check whose answer has come back. */
const answered = (check: PortalCheck) => Promise.resolve(check);

function stuck(over: Partial<StuckCredit>): StuckCredit {
  return {
    stripe_session_id: "cs_test_1",
    profile_id: "44444444-4444-4444-8444-444444444444",
    credit_cents: 1850,
    pass_ids: ["00000000-0000-4000-8000-00000000000a"],
    claimed_until: "2026-10-05T08:10:00.000Z",
    balance_transaction_id: null,
    granted_at: null,
    converted_at: null,
    converted_count: null,
    released_at: null,
    created_at: "2026-10-05T08:00:00.000Z",
    kind: "never_granted",
    since: "2026-10-05T08:00:00.000Z",
    email: "hosta@example.com",
    displayName: "Hosta",
    ...over,
  };
}

const section = (name: string) => screen.getByRole("region", { name });

describe("the stuck credits", () => {
  it("say none stuck, quietly, when the reading found none", () => {
    render(
      <BillingChecks
        stuck={{ ok: true, value: { total: 0, rows: [] } }}
        portal={WHOLE}
      />,
    );
    expect(
      within(section("Pass-to-Pro credits")).getByText("None stuck"),
    ).toBeTruthy();
  });

  it("★ list each stuck credit with its account linked to her page's credits, why and since when, and count the rest", () => {
    render(
      <BillingChecks
        stuck={{
          ok: true,
          value: {
            total: 3,
            rows: [
              stuck({}),
              stuck({
                stripe_session_id: "cs_test_2",
                profile_id: "55555555-5555-4555-8555-555555555555",
                kind: "never_converted",
                since: "2026-10-05T09:30:00.000Z",
                displayName: null,
                email: "nameless@example.com",
                credit_cents: 2900,
              }),
            ],
          },
        }}
        portal={WHOLE}
      />,
    );
    const credits = section("Pass-to-Pro credits");
    expect(within(credits).getByText("3 stuck")).toBeTruthy();
    const hosta = within(credits).getByRole("link", { name: "Hosta" });
    expect(hosta.getAttribute("href")).toBe(
      "/admin/accounts/44444444-4444-4444-8444-444444444444#credits",
    );
    expect(
      within(credits).getByText(
        "$18.50 · Never granted, claimed Oct 5, 2026, 08:00 UTC",
      ),
    ).toBeTruthy();
    // No name: the address stands in.
    expect(
      within(credits).getByRole("link", { name: "nameless@example.com" }),
    ).toBeTruthy();
    expect(
      within(credits).getByText(
        "$29.00 · Never converted, granted Oct 5, 2026, 09:30 UTC",
      ),
    ).toBeTruthy();
    expect(
      within(credits).getByText(/And 1 more, the oldest shown first\./),
    ).toBeTruthy();
  });

  it("★ say No reading, with why, when the read failed: never none stuck", () => {
    render(
      <BillingChecks
        stuck={{
          ok: false,
          message: "admin/accounts: stuck credits (never_granted): boom",
        }}
        portal={WHOLE}
      />,
    );
    const credits = section("Pass-to-Pro credits");
    expect(within(credits).getByText("No reading")).toBeTruthy();
    expect(within(credits).getByText(/boom/)).toBeTruthy();
    expect(within(credits).queryByText("None stuck")).toBeNull();
  });
});

describe("the change-plan configuration", () => {
  const OK = { ok: true as const, value: { total: 0, rows: [] } };

  /** Draw the checks and let the configuration's answer stream in (React settles a suspended `use` inside `act`). */
  async function drawAnswered(portal: Promise<PortalCheck>) {
    await act(async () => {
      render(<BillingChecks stuck={OK} portal={portal} />);
    });
    return section("Change plan in Stripe");
  }

  it("★ says it is asking Stripe until Stripe answers, and the stuck credits draw meanwhile", () => {
    render(
      <BillingChecks stuck={OK} portal={new Promise<PortalCheck>(() => {})} />,
    );
    expect(
      within(section("Change plan in Stripe")).getByRole("status").textContent,
    ).toBe("Asking Stripe…");
    expect(
      within(section("Pass-to-Pro credits")).getByText("None stuck"),
    ).toBeTruthy();
  });

  it("says it lists all six, quietly, when whole", async () => {
    const change = await drawAnswered(WHOLE);
    expect(within(change).getByText("Lists all 6 Pro prices")).toBeTruthy();
    expect(within(change).queryByRole("status")).toBeNull();
  });

  it("★ names each price missing, by its size, its price and its id, and what a host meets", async () => {
    const change = await drawAnswered(
      answered({
        state: "missing",
        configurationId: "bpc_tagged",
        sold: 6,
        missing: [
          {
            planId: "pro_50_yr",
            label: "Pro 50 GB, $90/yr",
            priceId: "price_a",
          },
          {
            planId: "pro_1tb_yr",
            label: "Pro 1 TB, $990/yr",
            priceId: "price_b",
          },
        ],
      }),
    );
    expect(within(change).getByText("2 of 6 missing")).toBeTruthy();
    expect(
      within(change).getByText(
        "The tagged configuration (bpc_tagged) does not list Pro 50 GB, $90/yr (price_a), Pro 1 TB, $990/yr (price_b). Stripe refuses a switch to each, a failure the host meets, until the configuration lists them (PRICING.md, Stripe setup).",
      ),
    ).toBeTruthy();
  });

  it("says none tagged", async () => {
    const change = await drawAnswered(answered({ state: "no_configuration" }));
    expect(within(change).getByText("None tagged")).toBeTruthy();
  });

  it("★ says No reading with why when the check could not run, never a calm line", async () => {
    const change = await drawAnswered(
      answered({ state: "unread", message: "Stripe is unreachable" }),
    );
    expect(within(change).getByText("No reading")).toBeTruthy();
    expect(within(change).getByText("Stripe is unreachable")).toBeTruthy();
    expect(within(change).queryByText(/Lists all/)).toBeNull();
  });
});
