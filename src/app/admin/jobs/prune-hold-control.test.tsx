import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const releasePruneHoldAction = vi.fn(async () => ({ ok: true as const }));

vi.mock("@/app/admin/jobs/actions", () => ({
  releasePruneHoldAction: () => releasePruneHoldAction(),
  runJobNowAction: vi.fn(),
  toggleJobAction: vi.fn(),
}));

const { PruneHoldControl } = await import("@/app/admin/jobs/job-controls");

/**
 * RELEASE THE HOLD, ON THE BACKUP PRUNE'S CARD (the Advisor's Q20): a hold never releases itself, so the card says
 * what the held run kept and offers the one press that lets the next run delete it, behind the portal's confirm,
 * which says that deleting from the backup is the part nothing brings back. Once pressed, the card says the next
 * run goes ahead and offers nothing more.
 */
describe("PruneHoldControl", () => {
  it("offers Release the hold for a run that held, saying what it held", () => {
    render(
      <PruneHoldControl
        view={{
          kind: "held",
          heldSinceMs: Date.parse("2026-10-12T06:00:00.000Z"),
          heldMedia: 2_001,
          heldKeys: 4_002,
          threshold: 2_000,
        }}
      />,
    );
    expect(screen.getByText(/2,001 items/)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Release the hold" }),
    ).toBeTruthy();
  });

  it("asks before it releases, naming what the next run deletes", async () => {
    render(
      <PruneHoldControl
        view={{
          kind: "held",
          heldSinceMs: Date.parse("2026-10-12T06:00:00.000Z"),
          heldMedia: 2_001,
          heldKeys: 4_002,
          threshold: 2_000,
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Release the hold" }));
    expect(
      await screen.findByText("Release the backup prune's hold?"),
    ).toBeTruthy();
    expect(screen.getByText(/cannot be brought back/i)).toBeTruthy();
    expect(releasePruneHoldAction).not.toHaveBeenCalled();
  });

  it("says the next run goes ahead once released, and offers no second press", () => {
    render(
      <PruneHoldControl
        view={{
          kind: "released",
          releasedAtMs: Date.parse("2026-10-13T09:30:00.000Z"),
        }}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Release the hold" }),
    ).toBeNull();
    expect(screen.getByText(/next run/i)).toBeTruthy();
  });
});
