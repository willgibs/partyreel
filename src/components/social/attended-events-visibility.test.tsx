import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import {
  hideEventFromProfileAction,
  showEventOnProfileAction,
} from "@/app/(app)/account/social-actions";
import type { AttendedEventPick } from "@/lib/db/queries/social";

import { AttendedEventsVisibility } from "./attended-events-visibility";

vi.mock("@/app/(app)/account/social-actions", () => ({
  showEventOnProfileAction: vi.fn(),
  hideEventFromProfileAction: vi.fn(),
}));

/**
 * THE DEFAULT FLIPPED (the guest identity round, 2026-09-22): a guest's attended event publishes on
 * her page only once SHE turns it on. `shownOnProfile: false` renders off, and turning it on is what
 * calls the PUBLISH action (`showEventOnProfileAction`), never the reverse.
 *
 * ★ RESHAPED ON PURPOSE (`identity-profile` r1, `attended=picker`): the switch list became a grid of
 * covers she taps, the chosen ones lifted. The contract under it is unchanged and every case below
 * still holds it; only the control's shape moved, from `role="switch"` + `aria-checked` to a toggle
 * button + `aria-pressed`. The one new case is the album's own masking on a tile.
 */

const shownEvent: AttendedEventPick = {
  id: "e-shown",
  name: "Maya & Theo's Wedding",
  shownOnProfile: true,
  coverUrl: "https://r2.example/cover-a.webp",
  locked: false,
};

const hiddenEvent: AttendedEventPick = {
  id: "e-hidden",
  name: "Summer BBQ",
  shownOnProfile: false,
  coverUrl: null,
  locked: false,
};

const lockedEvent: AttendedEventPick = {
  id: "e-locked",
  name: "Private event",
  shownOnProfile: true,
  coverUrl: null,
  locked: true,
};

function tile(name: RegExp) {
  return screen.getByRole("button", { name });
}

beforeEach(() => {
  vi.mocked(showEventOnProfileAction).mockReset();
  vi.mocked(hideEventFromProfileAction).mockReset();
});

describe("no attended events", () => {
  it("renders the empty state, not a bare grid", () => {
    render(<AttendedEventsVisibility events={[]} />);
    expect(screen.getByText(/None yet/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("default OFF", () => {
  it("an event nobody has shown renders unpressed", () => {
    render(<AttendedEventsVisibility events={[hiddenEvent]} />);
    expect(tile(/Show Summer BBQ/)).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Private")).toBeInTheDocument();
  });

  it("an event already shown renders pressed", () => {
    render(<AttendedEventsVisibility events={[shownEvent]} />);
    expect(tile(/Show Maya & Theo's Wedding/)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Showing on your page")).toBeInTheDocument();
  });
});

describe("turning one on", () => {
  it("calls the publish action, never the release one", async () => {
    vi.mocked(showEventOnProfileAction).mockResolvedValue({ ok: true });
    render(<AttendedEventsVisibility events={[hiddenEvent]} />);

    const toggle = tile(/Show Summer BBQ/);
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "true"); // optimistic
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

    const toggle = tile(/Show Summer BBQ/);
    fireEvent.click(toggle);

    await waitFor(() =>
      expect(toggle).toHaveAttribute("aria-pressed", "false"),
    );
    expect(toast.error).toHaveBeenCalledWith("Couldn't save that.");
  });
});

describe("turning one off", () => {
  it("calls the release action, and never removes the event from the grid", async () => {
    vi.mocked(hideEventFromProfileAction).mockResolvedValue({ ok: true });
    render(<AttendedEventsVisibility events={[shownEvent]} />);

    const toggle = tile(/Show Maya & Theo's Wedding/);
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await waitFor(() =>
      expect(hideEventFromProfileAction).toHaveBeenCalledWith("e-shown"),
    );
    expect(showEventOnProfileAction).not.toHaveBeenCalled();
    // The tile itself is never conditioned on its own state.
    expect(screen.getByText("Maya & Theo's Wedding")).toBeInTheDocument();
  });
});

describe("a tile is the album's own window", () => {
  it("draws a cover only where the album gave one", () => {
    const { container } = render(
      <AttendedEventsVisibility events={[shownEvent, hiddenEvent]} />,
    );
    const covers = container.querySelectorAll("img");
    expect(covers).toHaveLength(1);
    expect(covers[0]).toHaveAttribute("src", shownEvent.coverUrl);
  });

  it("a private album's tile still toggles, so a choice she can see is one she can take back", async () => {
    vi.mocked(hideEventFromProfileAction).mockResolvedValue({ ok: true });
    const { container } = render(
      <AttendedEventsVisibility events={[lockedEvent]} />,
    );
    expect(container.querySelector("img")).toBeNull();

    fireEvent.click(tile(/Show Private event/));
    await waitFor(() =>
      expect(hideEventFromProfileAction).toHaveBeenCalledWith("e-locked"),
    );
  });
});
