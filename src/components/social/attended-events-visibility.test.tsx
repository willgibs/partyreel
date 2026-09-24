import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import {
  hideEventFromProfileAction,
  showEventOnProfileAction,
} from "@/app/(app)/account/social-actions";
import type { AttendedEventSetting } from "@/lib/db/queries/social";

import { AttendedEventsVisibility } from "./attended-events-visibility";

vi.mock("@/app/(app)/account/social-actions", () => ({
  showEventOnProfileAction: vi.fn(),
  hideEventFromProfileAction: vi.fn(),
}));

/**
 * THE DEFAULT FLIPPED (the guest identity round, 2026-09-22): a guest's
 * attended event publishes on their profile only once THEY turn it on —
 * `shownOnProfile: false` renders unchecked, and checking the switch is what
 * calls the PUBLISH action (`showEventOnProfileAction`), never the reverse.
 */

const shownEvent: AttendedEventSetting = {
  id: "e-shown",
  name: "Maya & Theo's Wedding",
  event_date: "2026-10-01",
  shownOnProfile: true,
};

const hiddenEvent: AttendedEventSetting = {
  id: "e-hidden",
  name: "Summer BBQ",
  event_date: null,
  shownOnProfile: false,
};

beforeEach(() => {
  vi.mocked(showEventOnProfileAction).mockReset();
  vi.mocked(hideEventFromProfileAction).mockReset();
});

describe("no attended events", () => {
  it("renders the empty state, not a bare list", () => {
    render(<AttendedEventsVisibility events={[]} />);
    expect(screen.getByText(/None yet/)).toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });
});

describe("default OFF", () => {
  it("an event nobody has shown renders unchecked", () => {
    render(<AttendedEventsVisibility events={[hiddenEvent]} />);
    expect(
      screen.getByRole("switch", { name: /Show Summer BBQ/ }),
    ).toHaveAttribute("aria-checked", "false");
  });

  it("an event already shown renders checked", () => {
    render(<AttendedEventsVisibility events={[shownEvent]} />);
    expect(
      screen.getByRole("switch", { name: /Show Maya & Theo's Wedding/ }),
    ).toHaveAttribute("aria-checked", "true");
  });
});

describe("turning one on", () => {
  it("calls the publish action, never the release one", async () => {
    vi.mocked(showEventOnProfileAction).mockResolvedValue({ ok: true });
    render(<AttendedEventsVisibility events={[hiddenEvent]} />);

    const toggle = screen.getByRole("switch", { name: /Show Summer BBQ/ });
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-checked", "true"); // optimistic
    await waitFor(() =>
      expect(showEventOnProfileAction).toHaveBeenCalledWith("e-hidden"),
    );
    expect(hideEventFromProfileAction).not.toHaveBeenCalled();
  });

  it("reverts and toasts on failure", async () => {
    vi.mocked(showEventOnProfileAction).mockResolvedValue({
      ok: false,
      message: "Couldn't save that.",
    });
    render(<AttendedEventsVisibility events={[hiddenEvent]} />);

    const toggle = screen.getByRole("switch", { name: /Show Summer BBQ/ });
    fireEvent.click(toggle);

    await waitFor(() =>
      expect(toggle).toHaveAttribute("aria-checked", "false"),
    );
    expect(toast.error).toHaveBeenCalledWith("Couldn't save that.");
  });
});

describe("turning one off", () => {
  it("calls the release action, and never removes the event from the list", async () => {
    vi.mocked(hideEventFromProfileAction).mockResolvedValue({ ok: true });
    render(<AttendedEventsVisibility events={[shownEvent]} />);

    const toggle = screen.getByRole("switch", {
      name: /Show Maya & Theo's Wedding/,
    });
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-checked", "false");
    await waitFor(() =>
      expect(hideEventFromProfileAction).toHaveBeenCalledWith("e-shown"),
    );
    expect(showEventOnProfileAction).not.toHaveBeenCalled();
    // The row itself is never conditioned on the switch's own state.
    expect(screen.getByText("Maya & Theo's Wedding")).toBeInTheDocument();
  });
});
