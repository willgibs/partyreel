import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  currentAlbum,
  markPendingOffer,
  pendingOfferKey,
} from "@/lib/guest/album-return";
import type { ClaimResult } from "@/lib/guest/claim-uploads";

/**
 * THE RETURN. Every confirm door on an album writes the album's marker when it opens; the album
 * hears every claim made on it and plays the follow moment when a door was opened here AND the
 * claim moved this album's own uploads, with no upload needed this visit (a Google or magic-link
 * return is exactly that). The toast is for other events' uploads alone. What is pinned is that
 * rule, never a card's look.
 */
const { listeners, claim, toastSuccess } = vi.hoisted(() => ({
  listeners: new Set<(r: ClaimResult) => void>(),
  claim: vi.fn(async () => null),
  toastSuccess: vi.fn(),
}));
vi.mock("@/lib/guest/claim-uploads", () => ({
  CLAIMED_TOAST: "We added your uploads to your account.",
  claimAnonymousUploads: claim,
  onClaimed: (listener: (r: ClaimResult) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
}));
vi.mock("sonner", () => ({ toast: { success: (m: string) => toastSuccess(m) } }));

const { useConfirmReturn } = await import("@/lib/guest/use-confirm-return");

function hear(result: ClaimResult) {
  act(() => {
    for (const listener of listeners) listener(result);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  listeners.clear();
  localStorage.clear();
});

describe("useConfirmReturn", () => {
  it("claims at mount and holds the album on screen while it is mounted", () => {
    const { unmount } = renderHook(() => useConfirmReturn("album-1", true));
    expect(claim).toHaveBeenCalledWith({ silent: true });
    expect(currentAlbum()).toBe("album-1");
    unmount();
    expect(currentAlbum()).toBeNull();
  });

  it("★ a door opened here, then a claim that moved this album's uploads: the moment plays, once", () => {
    markPendingOffer("album-1");
    const { result } = renderHook(() => useConfirmReturn("album-1", true));
    expect(result.current).toBe(false);
    hear({ album: "album-1", here: 1, elsewhere: 0 });
    expect(result.current).toBe(true);
    expect(localStorage.getItem(pendingOfferKey("album-1"))).toBeNull();
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("no door opened here (a sign-in from somewhere else): no moment", () => {
    const { result } = renderHook(() => useConfirmReturn("album-1", true));
    hear({ album: "album-1", here: 1, elsewhere: 0 });
    expect(result.current).toBe(false);
  });

  it("a claim that moved nothing here plays nothing, and spends the marker all the same", () => {
    markPendingOffer("album-1");
    const { result } = renderHook(() => useConfirmReturn("album-1", true));
    hear({ album: "album-1", here: 0, elsewhere: 0 });
    expect(result.current).toBe(false);
    expect(localStorage.getItem(pendingOfferKey("album-1"))).toBeNull();
  });

  it("says the toast only when the claim reached other events too", () => {
    renderHook(() => useConfirmReturn("album-1", true));
    hear({ album: "album-1", here: 1, elsewhere: 0 });
    expect(toastSuccess).not.toHaveBeenCalled();
    hear({ album: "album-1", here: 0, elsewhere: 2 });
    expect(toastSuccess).toHaveBeenCalledWith(
      "We added your uploads to your account.",
    );
  });

  it("ignores a claim made for another album", () => {
    markPendingOffer("album-1");
    const { result } = renderHook(() => useConfirmReturn("album-1", true));
    hear({ album: "album-2", here: 3, elsewhere: 3 });
    expect(result.current).toBe(false);
    expect(toastSuccess).not.toHaveBeenCalled();
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
