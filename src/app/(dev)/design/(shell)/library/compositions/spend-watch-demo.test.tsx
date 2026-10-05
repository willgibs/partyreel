import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SpendWatchDemo, type SpendWatchState } from "./spend-watch-demo";

/**
 * THE SPEND WATCH'S SPECIMEN DRAWS EVERY STATE THE CARD CAN BE IN AND WRITES NOTHING (`spend-watch-demo.tsx`): the real card
 * over runs written by hand, each state saying what its entry says, and the two switches pressed through their whole flow
 * over a stand-in write, so the platform-wide Server Function behind them is never reached.
 */
const action = vi.hoisted(() => ({
  toggleWatchSwitchAction: vi.fn(async () => ({ ok: true as const })),
}));
vi.mock("@/app/admin/jobs/actions", () => action);
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  action.toggleWatchSwitchAction.mockClear();
});
afterEach(() => {
  vi.useRealTimers();
});

const draw = (state: SpendWatchState) =>
  render(<SpendWatchDemo state={state} />);

describe("every state says what it is", () => {
  it("★ a quiet night: numbers under their ceilings, nothing tripped, every switch on", () => {
    draw("healthy");
    expect(screen.queryByText("Tripped")).toBeNull();
    expect(screen.queryByText("No reading")).toBeNull();
    expect(screen.getByText("29 an hour")).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: "Toggle Guest uploads" }),
    ).toBeChecked();
    expect(
      screen.getByRole("switch", { name: "Toggle Lifecycle mail" }),
    ).toBeChecked();
  });

  it("★ a runaway night: three readings tripped, the uploads switch offered, a pause the watch made itself", () => {
    draw("tripped");
    expect(screen.getAllByText("Tripped")).toHaveLength(3);
    for (const row of document.querySelectorAll('tr[data-tone="warning"]')) {
      expect(
        within(row as HTMLElement).getByText("Tripped"),
      ).toBeInTheDocument();
    }
    expect(
      screen.getByText(/Uploads and Bytes uploaded went past the ceiling/),
    ).toBeInTheDocument();
    // Download all is the watch's own pause: it says so, and that it stays off until a person turns it back on.
    expect(screen.getByText(/Paused by the spend watch/)).toBeInTheDocument();
    expect(screen.getByText("Paused")).toBeInTheDocument();
  });

  it("★ a reading missing is No reading and why, in the failure tone, and one warming says so", () => {
    draw("missing");
    const row = screen.getByText("Accounts signed in").closest("tr")!;
    expect(row).toHaveAttribute("data-tone", "destructive");
    expect(within(row).getByText("No reading")).toBeInTheDocument();
    expect(
      within(row).getByText("permission denied for table users"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByText("Uploads").closest("tr")!).getByText(
        "Warming up",
      ),
    ).toBeInTheDocument();
  });

  it("★ no run yet, and an unreadable run, say so in words and draw no table; no switch is shown as on when it cannot be read", () => {
    const none = draw("none");
    expect(
      screen.getByText(/No readings yet: the watch has not run/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
    none.unmount();
    draw("unreadable");
    expect(
      screen.getByText(/The readings could not be read: spend watch/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The switches could not be read/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("switch")).toBeNull();
  });
});

describe("the switches write nothing", () => {
  it("★ the OFF edge asks through the sheet, the verb plays a round trip, and the switch goes off: the Server Function is never called", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    draw("healthy");
    await user.click(
      screen.getByRole("switch", { name: "Toggle Guest uploads" }),
    );
    const sheet = await screen.findByRole("alertdialog");
    expect(sheet).toHaveTextContent(/pause guest uploads/i);
    await user.click(
      within(sheet).getByRole("button", { name: "Pause uploads" }),
    );
    // Not yet: a round trip's wait, as the real write takes.
    expect(screen.queryByText("Paused for every guest")).toBeNull();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    expect(
      await screen.findByText("Paused for every guest"),
    ).toBeInTheDocument();
    // And the way back is immediate, through the same stand-in.
    await user.click(
      screen.getByRole("switch", { name: "Toggle Guest uploads" }),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    expect(await screen.findByText("Guests can add")).toBeInTheDocument();
    expect(action.toggleWatchSwitchAction).not.toHaveBeenCalled();
  });
});
