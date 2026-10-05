import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const restoreNowAction = vi.fn(async () => ({ ok: true as const }));

vi.mock("@/app/admin/jobs/actions", () => ({
  restoreNowAction: () => restoreNowAction(),
}));

const { RestoreNowControl } = await import("@/app/admin/jobs/restore-control");

/**
 * RESTORE NOW, ON THE BACKUP RESTORE'S CARD (durability-restore): the operator's run-now, behind the portal's one
 * confirmation, which names what a pass touches (only keys a live row names, never over an object that is there)
 * before it asks the Worker. Unwired, the button waits disabled and no press can reach the action.
 */
describe("RestoreNowControl", () => {
  it("★ asks before it runs, naming what a pass touches, then asks the Worker once", async () => {
    render(<RestoreNowControl wired />);
    fireEvent.click(screen.getByRole("button", { name: "Restore now" }));
    expect(await screen.findByText("Run the backup restore now?")).toBeTruthy();
    expect(screen.getByText(/Only keys a live row still names/)).toBeTruthy();
    expect(screen.getByText(/Never over an object that is there/)).toBeTruthy();
    expect(restoreNowAction).not.toHaveBeenCalled();
    const confirm = screen
      .getAllByRole("button", { name: "Restore now" })
      .find((b) => b.closest("[data-severity]"));
    fireEvent.click(confirm!);
    await waitFor(() => expect(restoreNowAction).toHaveBeenCalledTimes(1));
  });

  it("waits disabled, with no confirmation to open, while it is not wired", () => {
    render(<RestoreNowControl wired={false} />);
    const button = screen.getByRole("button", { name: "Restore now" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(button);
    expect(screen.queryByText("Run the backup restore now?")).toBeNull();
  });
});
