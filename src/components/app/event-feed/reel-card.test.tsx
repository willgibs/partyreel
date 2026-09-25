/**
 * THE HIGHLIGHT REEL'S CARD COUNTS TO TWO, THEN OPENS THE VIEW (`reel-host`, Will 2026-09-25:
 * `progress=card`, `home=view`).
 *
 * Pinned by what each face DOES, never how it looks: before two a press opens guidance (what is
 * left, Add photos, and on a moderated event the approval rule), never an empty reel; from two
 * the card is a link into the view the guests watch; switched off it opens Settings, where the
 * switch lives. Copy is precedent, not contract, except the count, which is the point.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReelCard, type ReelCardData } from "./reel-card";

const openAdd = vi.fn();
const openSheet = vi.fn();

vi.mock("@/components/app/host-add-provider", () => ({
  useHostAdd: () => ({ openAdd }),
}));
vi.mock("@/components/app/share/event-share-provider", () => ({
  useEventShare: () => ({ openSheet }),
}));

// jsdom has no IntersectionObserver; the living card's clock asks one whether it is on screen.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

beforeEach(() => {
  openAdd.mockReset();
  openSheet.mockReset();
  vi.stubGlobal("IntersectionObserver", NoopObserver);
});

const base: ReelCardData = {
  state: "counting",
  have: 0,
  of: 2,
  stills: [],
  viewHref: "/e/token123?reel",
  moderated: false,
  pending: 0,
};

async function openGuidance() {
  const trigger = screen.getByRole("button", { name: /highlight reel/i });
  fireEvent.pointerDown(trigger, { ctrlKey: false, button: 0 });
  fireEvent.click(trigger);
  await waitFor(() =>
    expect(document.querySelector("[data-reel-guidance]")).not.toBeNull(),
  );
  return document.querySelector("[data-reel-guidance]") as HTMLElement;
}

describe("before two, the card is guidance", () => {
  it("says how far off the reel is, at none and at one", () => {
    const { unmount } = render(
      <ReelCard eventId="e1" reel={base} stuck={false} />,
    );
    expect(screen.getByRole("button")).toHaveTextContent("Starts at 2 photos");
    expect(document.querySelector("[data-reel-pips='0/2']")).not.toBeNull();
    unmount();

    render(
      <ReelCard
        eventId="e1"
        reel={{ ...base, have: 1, stills: ["preview-1"] }}
        stuck={false}
      />,
    );
    expect(screen.getByRole("button")).toHaveTextContent("1 more photo");
    // The one photo it has sits under the card's overlay.
    expect(document.querySelector("img")?.getAttribute("src")).toBe(
      "preview-1",
    );
    expect(document.querySelector("[data-reel-pips='1/2']")).not.toBeNull();
  });

  it("opens guidance with Add photos, which opens the album's upload panel", async () => {
    render(<ReelCard eventId="e1" reel={{ ...base, have: 1 }} stuck={false} />);
    const guidance = await openGuidance();
    expect(guidance).toHaveTextContent(
      "1 more photo starts your highlight reel",
    );
    // Not a moderated event: nothing about approval.
    expect(guidance).not.toHaveTextContent(/approve/i);
    fireEvent.click(screen.getByRole("button", { name: /add photos/i }));
    expect(openAdd).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(document.querySelector("[data-reel-guidance]")).toBeNull(),
    );
  });

  it("on a moderated event, says guests' photos count once approved, and points at the queue", async () => {
    render(
      <ReelCard
        eventId="e1"
        reel={{ ...base, moderated: true, pending: 3 }}
        stuck={false}
      />,
    );
    const guidance = await openGuidance();
    expect(guidance).toHaveTextContent(/count once you approve them/i);
    const review = screen.getByRole("link", { name: /3 waiting in review/i });
    expect(review).toHaveAttribute("href", "/dashboard/e1/review");
  });

  it("points at no queue that is not there", async () => {
    render(
      <ReelCard
        eventId="e1"
        reel={{ ...base, moderated: true, pending: 0 }}
        stuck={false}
      />,
    );
    await openGuidance();
    expect(screen.queryByRole("link", { name: /in review/i })).toBeNull();
  });
});

describe("from two, the card is the door to the view", () => {
  it("links into the view the guests watch, over the reel's own stills", () => {
    render(
      <ReelCard
        eventId="e1"
        reel={{
          ...base,
          state: "live",
          have: 2,
          stills: ["s1", "s2", "s3", "s4"],
        }}
        stuck={false}
      />,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/e/token123?reel");
    expect(link).toHaveTextContent("Highlight reel");
    expect(document.querySelector("[data-living='4']")).not.toBeNull();
  });

  it("condenses to a plain pill when stuck to the bar, the living stills set aside", () => {
    render(
      <ReelCard
        eventId="e1"
        reel={{ ...base, state: "live", have: 2, stills: ["s1", "s2"] }}
        stuck
      />,
    );
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/e/token123?reel",
    );
    expect(document.querySelector("[data-living]")).toBeNull();
  });
});

describe("switched off, the card opens Settings", () => {
  it("carries the real Settings URL and opens the sheet on a plain click", () => {
    render(
      <ReelCard eventId="e1" reel={{ ...base, state: "off" }} stuck={false} />,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/dashboard/e1?room=settings");
    expect(link).toHaveTextContent("Off");
    fireEvent.click(link, { button: 0 });
    expect(openSheet).toHaveBeenCalledWith("settings");
  });

  it("lets a modified click be a real navigation", () => {
    render(
      <ReelCard eventId="e1" reel={{ ...base, state: "off" }} stuck={false} />,
    );
    // The browser's own navigation is what a modified click leaves standing; jsdom has none.
    const stopNavigation = (e: Event) => e.preventDefault();
    document.addEventListener("click", stopNavigation);
    fireEvent.click(screen.getByRole("link"), { button: 0, metaKey: true });
    document.removeEventListener("click", stopNavigation);
    expect(openSheet).not.toHaveBeenCalled();
  });
});
