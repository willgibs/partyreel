import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DeleteAccountControl } from "./delete-account-control";

vi.mock("@/app/admin/accounts/actions", () => ({
  deleteAccountAsOperatorAction: vi.fn(),
}));

/**
 * THE CONFIRMATION'S COUNTS, GROUPED (the 1,000-row round's follow-on): the sheet says how many
 * events the deletion bins and how many a legal hold skips, and an account past 999 read "1249
 * events" raw here while every other count in the portal grouped it. Both lines go through
 * `formatCount`; the one-event wording stays its own sentence.
 */
async function openFor(eventCount: number, heldEventCount: number) {
  render(
    <DeleteAccountControl
      userId="u-1"
      identifier="host@example.com"
      eventCount={eventCount}
      heldEventCount={heldEventCount}
    />,
  );
  await userEvent.click(
    screen.getByRole("button", { name: /delete account/i }),
  );
}

describe("the deletion's counts", () => {
  it("groups an event count past 999, binned and held alike", async () => {
    await openFor(1249, 1001);
    expect(
      screen.getByText(/^1,249 events are binned now/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/^1,001 events are under a legal hold/),
    ).toBeInTheDocument();
  });

  it("keeps the singular sentence for one event, and names no hold when there is none", async () => {
    await openFor(1, 0);
    expect(screen.getByText(/^1 event is binned now/)).toBeInTheDocument();
    expect(screen.queryByText(/legal hold/)).not.toBeInTheDocument();
  });
});
