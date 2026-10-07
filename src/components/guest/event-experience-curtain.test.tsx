import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createHeadBridge,
  createOpeningPin,
  type HeadBridge,
  type HeadBridgeState,
} from "@/components/guest/event-experience-head";
import type { GallerySeed } from "@/lib/events/gallery-seed";

import {
  REEL_CURTAIN_CEILING_MS,
  REEL_CURTAIN_WORDS,
  ReelCurtain,
} from "./event-experience-curtain";

/**
 * THE REEL'S CURTAIN, ITSELF (guest-moments r1, Will's `opening=still`): the reel's first photograph with Close, from
 * the first byte until the view stands over it; Close that works before the album has arrived; and a ceiling, so a
 * reel that never comes is a state with a way on, never a stranding (the ROADMAP's two curtain lines). The page's
 * own pins (`event-experience.curtain.test.tsx`) hold where it stands and how long.
 */

/** A seed that never arrives: the album's controller never mounts, and only the curtain answers. */
const never = () => new Promise<GallerySeed>(() => {});

/**
 * A seed already in hand that names no photograph (a locked page's answer): the curtain then stands the live album's
 * word, as it does wherever the seed carried no link for its pick.
 */
function arrived(): Promise<GallerySeed> {
  const seed = Promise.resolve({ kind: "locked" }) as Promise<GallerySeed> & {
    status?: string;
    value?: unknown;
  };
  seed.status = "fulfilled";
  seed.value = { kind: "locked" };
  return seed;
}

const STILLS = [
  { id: "m2", tile: "https://r2.test/p/m2.webp" },
  { id: "m1", tile: "https://r2.test/p/m1.webp" },
];

function bridgeWith(over: Partial<HeadBridgeState["reel"]> = {}) {
  const bridge = createHeadBridge();
  bridge.set({
    stills: STILLS,
    reportExpiry: () => {},
    reel: {
      available: true,
      open: () => {},
      preload: () => {},
      viewAsked: true,
      close: vi.fn(),
      ...over,
    },
  });
  return bridge;
}

/**
 * Mounted inside an awaited act: a curtain whose photograph is still on its way suspends its still's boundary, and
 * React commits a suspended tree in a test only once an act is awaited (a page commits it at once).
 */
async function mount(
  bridge: HeadBridge,
  onClosed = vi.fn(),
  seed: Promise<GallerySeed> = bridge.get() ? arrived() : never(),
) {
  const pin = createOpeningPin();
  await act(async () => {
    render(
      <ReelCurtain
        seed={seed}
        bridge={bridge}
        pin={pin}
        eventId="11111111-2222-4333-8444-555555555555"
        albumHref="/e/token"
        onClosed={onClosed}
      />,
    );
  });
  return { onClosed, pin };
}

const curtain = () =>
  screen.getByRole("dialog", { name: REEL_CURTAIN_WORDS.name });
const close = () =>
  screen.getByRole("link", { name: REEL_CURTAIN_WORDS.close });
const still = () =>
  document.querySelector<HTMLImageElement>("[data-reel-curtain-still]");

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("the curtain is the reel's first photograph", () => {
  it("★ stands the cover's first still edge to edge, with Close beside it, as a dialog she starts inside", async () => {
    await mount(bridgeWith());
    expect(curtain()).toBeTruthy();
    // The cover's slot 0, the reel's own opening.
    expect(still()?.getAttribute("src")).toBe("https://r2.test/p/m2.webp");
    expect(still()?.dataset.reelCurtainStill).toBe("m2");
    expect(close().getAttribute("href")).toBe("/e/token");
    // She starts inside it, on the curtain itself (as the view puts her on its picture), not on Close.
    expect(document.activeElement).toBe(curtain());
  });

  it("★ pins the photograph it stands, and keeps it while the album's first still changes (her own newest leading)", async () => {
    const bridge = bridgeWith();
    const { pin } = await mount(bridge);
    expect(pin.get()).toEqual(STILLS[0]);
    // The live album learns her own uploads: the cover now leads with her newest.
    act(() => {
      bridge.set({
        ...bridge.get()!,
        stills: [{ id: "mine", tile: "https://r2.test/p/mine.webp" }, ...STILLS],
      });
    });
    expect(still()?.dataset.reelCurtainStill).toBe("m2");
    expect(pin.get()?.id).toBe("m2");
  });

  it("keeps a quiet dark, with Close, where the album has no photograph to show (sealed, or the seed on its way)", async () => {
    const bridge = createHeadBridge();
    await mount(bridge);
    expect(still()).toBeNull();
    expect(close()).toBeTruthy();
  });
});

describe("Close", () => {
  it("★ closes the reel as the view's own Close does, once the album's controller stands, and lets the curtain go", async () => {
    const bridge = bridgeWith();
    const { onClosed } = await mount(bridge);
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    act(() => {
      close().dispatchEvent(event);
    });
    expect(onClosed).toHaveBeenCalledTimes(1);
    expect(bridge.get()!.reel.close).toHaveBeenCalledTimes(1);
    // The controller closed it: the link's own navigation never ran.
    expect(event.defaultPrevented).toBe(true);
  });

  it("★ works before the album has arrived: the curtain goes and the link takes her to the album", async () => {
    const { onClosed } = await mount(createHeadBridge());
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    act(() => {
      close().dispatchEvent(event);
    });
    expect(onClosed).toHaveBeenCalledTimes(1);
    // No controller to close it: the link is left to navigate (to the album's own address).
    expect(event.defaultPrevented).toBe(false);
  });

  it("is Escape too", async () => {
    const bridge = bridgeWith();
    const { onClosed } = await mount(bridge);
    fireEvent.keyDown(curtain(), { key: "Escape" });
    expect(onClosed).toHaveBeenCalledTimes(1);
    expect(bridge.get()!.reel.close).toHaveBeenCalledTimes(1);
  });
});

describe("the ceiling", () => {
  it("★ says the reel has not come, with Try again, past the ceiling and not before", async () => {
    await mount(createHeadBridge());
    act(() => {
      vi.advanceTimersByTime(REEL_CURTAIN_CEILING_MS - 1);
    });
    expect(screen.queryByRole("status")).toBeNull();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole("status").textContent).toContain(
      REEL_CURTAIN_WORDS.late,
    );
    expect(
      screen.getByRole("button", { name: REEL_CURTAIN_WORDS.again }),
    ).toBeTruthy();
    // Close still stands beside it.
    expect(close()).toBeTruthy();
  });

  it("keeps Tab inside the curtain's own keys, as a dialog does", async () => {
    await mount(createHeadBridge());
    act(() => {
      vi.advanceTimersByTime(REEL_CURTAIN_CEILING_MS);
    });
    const again = screen.getByRole("button", {
      name: REEL_CURTAIN_WORDS.again,
    });
    expect(document.activeElement).toBe(curtain());
    fireEvent.keyDown(curtain(), { key: "Tab" });
    expect(document.activeElement).toBe(close());
    fireEvent.keyDown(curtain(), { key: "Tab" });
    expect(document.activeElement).toBe(again);
    fireEvent.keyDown(curtain(), { key: "Tab" });
    expect(document.activeElement).toBe(close());
    fireEvent.keyDown(curtain(), { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(again);
  });
});
