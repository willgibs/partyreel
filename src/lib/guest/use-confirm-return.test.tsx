import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  currentAlbum,
  markPendingOffer,
  pendingOfferKey,
} from "@/lib/guest/album-return";
import type { ClaimResult } from "@/lib/guest/claim-uploads";
import {
  lastClaimPlayedMoment,
  onConfirmBeat,
  type ConfirmBeat,
} from "@/lib/guest/confirm-beat";

/**
 * THE RETURN. Every confirm door on an album writes the album's marker when it opens; the album
 * hears every claim made on it and plays the follow moment when a door was opened here AND the
 * claim moved this album's own uploads, with no upload needed this visit (a Google or magic-link
 * return is exactly that).
 *
 * ★ ONE BEAT (`guest-capture` r1): the moment carries the other events itself (`elsewhere`), so
 * this hook toasts nothing; a door that awaited a claim reads whether it played the moment
 * (`lastClaimPlayedMoment`) and reports its own beat; the one claim nobody awaits, the mount's own
 * (a full-reload return), is reported here. What is pinned is that rule, never a card's look.
 */
const { listeners, claim } = vi.hoisted(() => ({
  listeners: new Set<(r: ClaimResult) => void>(),
  claim: vi.fn(async (): Promise<ClaimResult | null> => null),
}));
vi.mock("@/lib/guest/claim-uploads", () => ({
  CLAIMED_TOAST: "We added your uploads to your account.",
  claimAnonymousUploads: claim,
  onClaimed: (listener: (r: ClaimResult) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
}));

const { useConfirmReturn } = await import("@/lib/guest/use-confirm-return");

function hear(result: ClaimResult) {
  act(() => {
    for (const listener of listeners) listener(result);
  });
}

const beats: ConfirmBeat[] = [];
let stopBeats: () => void = () => {};

beforeEach(() => {
  vi.clearAllMocks();
  claim.mockImplementation(async () => null);
  listeners.clear();
  localStorage.clear();
  beats.length = 0;
  stopBeats();
  stopBeats = onConfirmBeat((beat) => beats.push(beat));
});

describe("useConfirmReturn", () => {
  it("claims at mount and holds the album on screen while it is mounted", () => {
    const { unmount } = renderHook(() => useConfirmReturn("album-1", true));
    expect(claim).toHaveBeenCalledWith({ silent: true });
    expect(currentAlbum()).toBe("album-1");
    unmount();
    expect(currentAlbum()).toBeNull();
  });

  it("★ a door opened here, then a claim that moved this album's uploads: the moment plays, once, with the other events in it", () => {
    markPendingOffer("album-1");
    const { result } = renderHook(() => useConfirmReturn("album-1", true));
    expect(result.current).toEqual({ moment: false, elsewhere: 0 });
    hear({ album: "album-1", here: 1, elsewhere: 2 });
    expect(result.current).toEqual({ moment: true, elsewhere: 2 });
    expect(lastClaimPlayedMoment("album-1")).toBe(true);
    expect(localStorage.getItem(pendingOfferKey("album-1"))).toBeNull();
    // The card says it; nothing else does.
    expect(beats).toEqual([]);
  });

  it("no door opened here (a sign-in from somewhere else): no moment, and the claim says so", () => {
    const { result } = renderHook(() => useConfirmReturn("album-1", true));
    hear({ album: "album-1", here: 1, elsewhere: 0 });
    expect(result.current.moment).toBe(false);
    expect(lastClaimPlayedMoment("album-1")).toBe(false);
  });

  it("a claim that moved nothing here plays nothing, and spends the marker all the same", () => {
    markPendingOffer("album-1");
    const { result } = renderHook(() => useConfirmReturn("album-1", true));
    hear({ album: "album-1", here: 0, elsewhere: 0 });
    expect(result.current.moment).toBe(false);
    expect(localStorage.getItem(pendingOfferKey("album-1"))).toBeNull();
  });

  it("a door's claim is the door's to report: the hook itself says nothing about it", () => {
    renderHook(() => useConfirmReturn("album-1", true));
    hear({ album: "album-1", here: 0, elsewhere: 2 });
    expect(beats).toEqual([]);
  });

  it("the mount's own claim (a full-reload return) reports what it carried elsewhere, once", async () => {
    claim.mockImplementation(async () => {
      const result = { album: "album-1", here: 0, elsewhere: 3 };
      for (const listener of listeners) listener(result);
      return result;
    });
    renderHook(() => useConfirmReturn("album-1", true));
    await waitFor(() =>
      expect(beats).toEqual([{ album: "album-1", name: null, elsewhere: 3 }]),
    );
  });

  it("the mount's own claim that plays the moment reports nothing: the card says it", async () => {
    markPendingOffer("album-1");
    claim.mockImplementation(async () => {
      const result = { album: "album-1", here: 2, elsewhere: 3 };
      for (const listener of listeners) listener(result);
      return result;
    });
    const { result } = renderHook(() => useConfirmReturn("album-1", true));
    await waitFor(() => expect(result.current.moment).toBe(true));
    expect(beats).toEqual([]);
  });

  it("★ her yes to the shared-phone ask that moved this album's own uploads plays the moment, with no door opened here", () => {
    // crumbs-24: the yes toasted "We added your uploads to your account." on the album whose own photos
    // it had just carried, where a door's claim plays the moment. Her answer is as true a confirmation.
    const { result } = renderHook(() => useConfirmReturn("album-1", true));
    hear({ album: "album-1", here: 2, elsewhere: 1, asked: true });
    expect(result.current).toEqual({ moment: true, elsewhere: 1 });
    expect(lastClaimPlayedMoment("album-1")).toBe(true);
    expect(beats).toEqual([]);
  });

  it("a yes that moved nothing here plays nothing (its other events are the toast's)", () => {
    const { result } = renderHook(() => useConfirmReturn("album-1", true));
    hear({ album: "album-1", here: 0, elsewhere: 2, asked: true });
    expect(result.current.moment).toBe(false);
    expect(lastClaimPlayedMoment("album-1")).toBe(false);
  });

  it("★ the mount's own claim after a door opened here, which moved nothing here, reports its beat so the page can say where the photos are", async () => {
    // crumbs-24: a Google return from the keep, confirmed with another address than the one typed here,
    // came back to silence. The page reads what the claim left for another address when it speaks.
    markPendingOffer("album-1");
    claim.mockImplementation(async () => {
      const result = { album: "album-1", here: 0, elsewhere: 0 };
      for (const listener of listeners) listener(result);
      return result;
    });
    renderHook(() => useConfirmReturn("album-1", true));
    await waitFor(() =>
      expect(beats).toEqual([{ album: "album-1", name: null, elsewhere: 0 }]),
    );
  });

  it("the mount's own claim with no door behind it and nothing elsewhere reports nothing (a signed-in visit)", async () => {
    claim.mockImplementation(async () => {
      const result = { album: "album-1", here: 0, elsewhere: 0 };
      for (const listener of listeners) listener(result);
      return result;
    });
    renderHook(() => useConfirmReturn("album-1", true));
    await act(async () => {
      await Promise.resolve();
    });
    expect(beats).toEqual([]);
  });

  it("ignores a claim made for another album", () => {
    markPendingOffer("album-1");
    const { result } = renderHook(() => useConfirmReturn("album-1", true));
    hear({ album: "album-2", here: 3, elsewhere: 3 });
    expect(result.current.moment).toBe(false);
    expect(localStorage.getItem(pendingOfferKey("album-1"))).toBe("1");
  });

  it("does nothing at all when disabled (the demo, the host)", () => {
    renderHook(() => useConfirmReturn("album-1", false));
    expect(claim).not.toHaveBeenCalled();
    expect(currentAlbum()).toBeNull();
    expect(listeners.size).toBe(0);
  });
});

describe("album-return: the marker", () => {
  it("a door outside any album writes nothing it cannot key", () => {
    markPendingOffer();
    expect(Object.keys(localStorage)).toEqual([]);
  });
});
