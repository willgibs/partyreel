import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useLiveUploadsWord } from "./event-experience-open";

/**
 * WHETHER THE ALBUM TAKES UPLOADS, AS THE PAGE HEARS IT (guest-requests): the server's reading at render, then each word
 * the album's sync carries, every one counted, the same word again included: an upload refused as closed is newer than
 * every word heard before it, so what lifts it is a word heard after it (the album's camera reads `heard`).
 */
describe("the page's word on uploads", () => {
  it("starts at the page's render, with nothing heard yet", () => {
    const { result } = renderHook(() => useLiveUploadsWord(true));
    expect(result.current.word).toEqual({ open: true, heard: 0 });
  });

  it("★ takes each word the album's sync carries, and counts each one, the same word again included", () => {
    const { result } = renderHook(() => useLiveUploadsWord(true));
    act(() => result.current.onWord(false));
    expect(result.current.word).toEqual({ open: false, heard: 1 });
    act(() => result.current.onWord(false));
    expect(result.current.word).toEqual({ open: false, heard: 2 });
    act(() => result.current.onWord(true));
    expect(result.current.word).toEqual({ open: true, heard: 3 });
  });

  it("a fresh server reading (the page rendered again) is a word too", () => {
    const { result, rerender } = renderHook(
      ({ accepting }) => useLiveUploadsWord(accepting),
      { initialProps: { accepting: true } },
    );
    rerender({ accepting: false });
    expect(result.current.word).toEqual({ open: false, heard: 1 });
    rerender({ accepting: false });
    expect(result.current.word).toEqual({ open: false, heard: 1 });
  });

  it("hands the album one stable listener, so its source never re-subscribes for it", () => {
    const { result } = renderHook(() => useLiveUploadsWord(true));
    const first = result.current.onWord;
    act(() => result.current.onWord(false));
    expect(result.current.onWord).toBe(first);
  });
});
