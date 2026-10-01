import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  HostAddProvider,
  useHostAdd,
} from "@/components/app/host-add-provider";
import { HostUpload } from "@/components/app/host-upload";

import { setReducedMotion } from "../../../vitest.setup";

/**
 * THE HOST'S ADD BRINGS THE PANEL IT OPENS INTO VIEW, never the top of the page (crumbs-36, from crumbs-34).
 * `openAdd` (the reel card's Add photos) used to scroll the window to 0, "the panel lives at the top, below the
 * command strip", though the command strip retired and the panel opens under the album's own header, wherever
 * that stands: a host scrolled down the page was thrown to the top, and a phone's panel can sit below the fold of
 * the top anyway. Now `HostUpload` hands the provider its own panel and `openAdd` scrolls to that, with the least
 * movement. The album header's own Add photos button is `toggleAdd`, which has never moved the page.
 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

/** The hub's two Add surfaces and the panel they open, as `event-gallery.tsx` and the reel card draw them. */
function Hub() {
  const add = useHostAdd();
  return (
    <>
      <button type="button" onClick={add?.toggleAdd}>
        Album Add photos
      </button>
      <button type="button" onClick={add?.openAdd}>
        Reel Add photos
      </button>
      {add?.adding && (
        <div data-testid="panel">
          <p>Add your own photos.</p>
          <HostUpload eventId="event-1" videosAllowed />
        </div>
      )}
    </>
  );
}

const scrollIntoView = vi.fn();
const scrollTo = vi.fn();

beforeEach(() => {
  // jsdom has no layout, so it has no scrollIntoView; the calls are what is read.
  Element.prototype.scrollIntoView =
    scrollIntoView as unknown as Element["scrollIntoView"];
  window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
  setReducedMotion(false);
});

afterEach(() => {
  scrollIntoView.mockReset();
  scrollTo.mockReset();
  setReducedMotion(false);
  delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
});

const press = (name: string) =>
  fireEvent.click(screen.getByRole("button", { name }));

function renderHub() {
  return render(
    <HostAddProvider>
      <Hub />
    </HostAddProvider>,
  );
}

describe("the reel card's Add photos (openAdd)", () => {
  it("★ opens the panel and brings that panel into view, not the top of the page", () => {
    renderHub();
    expect(screen.queryByTestId("panel")).toBeNull();

    press("Reel Add photos");

    const panel = screen.getByTestId("panel");
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    // What was scrolled is the upload panel's own box: it holds the dropzone the host is about to use.
    const scrolled = scrollIntoView.mock.contexts[0] as HTMLElement;
    expect(panel.contains(scrolled)).toBe(true);
    expect(scrolled.querySelector("input[type=file]")).not.toBeNull();
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("moves the page the least it can, smoothly", () => {
    renderHub();
    press("Reel Add photos");
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: "nearest",
      behavior: "smooth",
    });
  });

  it("moves it at once when the reader asked for reduced motion", () => {
    setReducedMotion(true);
    renderHub();
    press("Reel Add photos");
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: "nearest",
      behavior: "auto",
    });
  });

  it("★ brings an already open panel back into view, though nothing opens", () => {
    renderHub();
    press("Album Add photos");
    expect(screen.getByTestId("panel")).toBeTruthy();
    expect(scrollIntoView).not.toHaveBeenCalled();

    // The host scrolled down the album; the reel card is in the sticky band, and Add photos is one press away.
    press("Reel Add photos");
    expect(screen.getByTestId("panel")).toBeTruthy();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollTo).not.toHaveBeenCalled();
  });
});

describe("the album header's Add photos (toggleAdd)", () => {
  it("opens and closes the panel without moving the page", () => {
    renderHub();
    press("Album Add photos");
    expect(screen.getByTestId("panel")).toBeTruthy();
    press("Album Add photos");
    expect(screen.queryByTestId("panel")).toBeNull();
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("★ is not a scroll later, once the reel card's open has been answered", () => {
    renderHub();
    press("Reel Add photos");
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    press("Album Add photos"); // closes
    press("Album Add photos"); // opens again
    expect(screen.getByTestId("panel")).toBeTruthy();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });
});

describe("a surface with no provider", () => {
  it("draws the panel alone and never throws", () => {
    render(<HostUpload eventId="event-1" videosAllowed={false} />);
    expect(document.querySelector("input[type=file]")).not.toBeNull();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
