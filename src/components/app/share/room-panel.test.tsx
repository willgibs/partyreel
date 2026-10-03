/**
 * A ROOM OPENS OVER THE HUB AND CLOSES BACK TO IT, ONE WAY (Will, event-header r2 `rooms=over`): the address, the
 * focus and Back, through a door, the hub's island and the one panel.
 *
 * Opening from its door writes the hub's own address with the room on it (an entry of ours, never a navigation),
 * stands the panel with focus inside it (the panel itself, a place read before it is touched, the settings kind's
 * rule at a desk), and the X closes it by going Back over that entry, focus handed back to the door that opened it;
 * the browser's own Back does the same. A room handed over to another (Review's Guests link, Settings' door page)
 * stays one entry deep, so its close still lands on the hub.
 */
import Link from "next/link";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  installNextHistory,
  NextRouterStandIn,
  type NextHistory,
} from "@/lib/test-utils/next-history";

vi.mock("next/navigation", async () => {
  const { nextNavigation } = await import("@/lib/test-utils/next-history");
  return nextNavigation;
});
vi.mock("@/lib/shared/use-prefers-reduced-motion", () => ({
  usePrefersReducedMotion: () => true,
}));

const { EventShareProvider, useEventShare } =
  await import("./event-share-provider");
const { RoomPanel } = await import("./room-panel");

let next: NextHistory;
beforeEach(() => {
  next = installNextHistory();
});
afterEach(() => {
  next.uninstall();
  vi.restoreAllMocks();
  window.history.replaceState(null, "", "/");
});

/** The hub, cut to what a room's way in and out touches: its doors, its island and its panels. */
function Rooms() {
  const { sheet, openSheet, closeSheet } = useEventShare();
  const panel = (room: "review" | "guests", title: string) => (
    <RoomPanel
      room={room}
      open={sheet === room}
      onOpenChange={(open) => (open ? openSheet(room) : closeSheet())}
      title={title}
      eventName="Maya & Jay"
    >
      <p>{`${title}'s body`}</p>
      {room === "review" ? (
        <Link href="/dashboard/e1/guests#at-the-door">2 at the door</Link>
      ) : null}
    </RoomPanel>
  );
  return (
    <>
      <Link href="/dashboard/e1?room=review">Review door</Link>
      <Link href="/dashboard/e1?room=guests">Guests door</Link>
      {panel("review", "Review")}
      {panel("guests", "Guests")}
    </>
  );
}

function hub() {
  return render(
    <NextRouterStandIn>
      <EventShareProvider initialSheet={null} eventId="e1">
        <Rooms />
      </EventShareProvider>
    </NextRouterStandIn>,
  );
}

const room = () => new URLSearchParams(window.location.search).get("room");

/** A close that goes Back: its popstate lands after the click. Bounded, so a close that never goes Back fails. */
async function closeAndWait(button: HTMLElement) {
  await act(async () => {
    const popped = new Promise<void>((resolve) =>
      window.addEventListener("popstate", () => resolve(), { once: true }),
    );
    fireEvent.click(button);
    await Promise.race([popped, new Promise((r) => setTimeout(r, 2000))]);
  });
}

describe.each([
  ["Review door", "review", "Review"],
  ["Guests door", "guests", "Guests"],
])("%s", (doorName, id, title) => {
  it("★ opens its room over the hub: the address, the panel, focus inside it", async () => {
    next.land("/dashboard/e1");
    hub();
    const door = screen.getByRole("link", { name: doorName });
    door.focus();
    act(() => {
      fireEvent.click(door);
    });
    expect(room()).toBe(id);
    expect(window.location.pathname).toBe("/dashboard/e1");
    const dialog = await screen.findByRole("dialog", { name: title });
    expect(dialog).toHaveAttribute("data-room-panel", id);
    await waitFor(() =>
      expect(dialog.contains(document.activeElement)).toBe(true),
    );
    expect(next.reloads).toBe(0);
  });

  it("★ its X goes Back to the hub as she left it, focus on the door that opened it", async () => {
    next.land("/dashboard/e1");
    hub();
    const door = screen.getByRole("link", { name: doorName });
    door.focus();
    act(() => {
      fireEvent.click(door);
    });
    const dialog = await screen.findByRole("dialog", { name: title });
    const back = vi.spyOn(window.history, "back");
    await closeAndWait(screen.getByRole("button", { name: "Close" }));
    expect(back).toHaveBeenCalledTimes(1);
    expect(room()).toBeNull();
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await waitFor(() => expect(document.activeElement).toBe(door));
    expect(next.reloads).toBe(0);
  });

  it("the browser's own Back closes it", async () => {
    next.land("/dashboard/e1");
    hub();
    act(() => {
      fireEvent.click(screen.getByRole("link", { name: doorName }));
    });
    await screen.findByRole("dialog", { name: title });
    await act(async () => {
      const popped = new Promise<void>((resolve) =>
        window.addEventListener("popstate", () => resolve(), { once: true }),
      );
      window.history.back();
      await popped;
    });
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: title })).toBeNull(),
    );
    expect(room()).toBeNull();
  });
});

describe("a room handed over to another", () => {
  it("★ stays one entry deep: Review's link into Guests replaces it, and the X lands on the hub", async () => {
    next.land("/dashboard/e1");
    hub();
    act(() => {
      fireEvent.click(screen.getByRole("link", { name: "Review door" }));
    });
    await screen.findByRole("dialog", { name: "Review" });
    const push = vi.spyOn(window.history, "pushState");
    act(() => {
      fireEvent.click(screen.getByRole("link", { name: "2 at the door" }));
    });
    expect(push).not.toHaveBeenCalled();
    expect(room()).toBe("guests");
    await screen.findByRole("dialog", { name: "Guests" });
    const back = vi.spyOn(window.history, "back");
    await closeAndWait(screen.getByRole("button", { name: "Close" }));
    expect(back).toHaveBeenCalledTimes(1);
    expect(room()).toBeNull();
    expect(window.location.pathname).toBe("/dashboard/e1");
  });
});
