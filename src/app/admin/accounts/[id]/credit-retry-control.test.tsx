import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * THE OPERATOR'S RETRY OF A STUCK CREDIT SAYS WHAT IT REACHES BEFORE IT RUNS (credit-watch): the webhook's own path,
 * so each line is the claim's own rule (granted once ever, Stripe asked first; exactly the passes the checkout named;
 * settled instead when another checkout credited them; nothing while a delivery holds it). Reversible, so it asks for
 * no typing; nothing is sent until its verb is pressed, and then for this account's checkout alone.
 */

const action = vi.hoisted(() => vi.fn(async () => ({ ok: true })));
vi.mock("@/app/admin/accounts/actions", () => ({
  retryPassCreditAsOperatorAction: action,
}));

const { CreditRetryControl, retryTouches } =
  await import("./credit-retry-control");

describe("Retry the credit", () => {
  it("★ lists what it reaches, asks for no typing, and runs for this account's checkout alone", () => {
    render(
      <CreditRetryControl userId="u-1" sessionId="cs_test_1" passCount={2} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /retry the credit/i }));
    const dialog = screen.getByRole("alertdialog");
    const touches = [
      ...dialog.querySelectorAll("[data-slot='destructive-touches'] li"),
    ].map((li) => li.textContent?.replace(/^-/, "").trim());
    expect(touches).toEqual([
      "Grants the credit as Stripe customer balance only if no grant is on record, looking on Stripe's side first, so it is granted once ever",
      "Converts exactly the 2 passes this checkout named into Pro credit, never a pass bought since",
      "If another checkout of hers credited these passes first, settles this one instead and grants nothing",
      "If a delivery holds the claim right now, does nothing and says so",
    ]);
    expect(within(dialog).queryByRole("textbox")).toBeNull();
    expect(action).not.toHaveBeenCalled();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Retry the credit" }),
    );
    expect(action).toHaveBeenCalledWith("u-1", "cs_test_1");
  });

  it("names one pass as one", () => {
    expect(retryTouches(1)[1]).toBe(
      "Converts exactly the 1 pass this checkout named into Pro credit, never a pass bought since",
    );
  });
});
