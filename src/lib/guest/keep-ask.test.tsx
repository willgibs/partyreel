import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  keepAskKey,
  putDownKeepAsk,
  resetKeepAskForTests,
  useKeepAskPutDown,
} from "@/lib/guest/keep-ask";

/**
 * THE KEEP ASK, PUT DOWN (`guest-capture` r1): "Maybe later" at the door's last screen is final for
 * this event on this device, under the offer card's own key so a card put down before the keep
 * shipped is not asked again; and blocked storage asks once per page, never on every upload.
 */
beforeEach(() => {
  localStorage.clear();
  resetKeepAskForTests();
  vi.restoreAllMocks();
});

describe("useKeepAskPutDown", () => {
  it("reads the offer card's own key, so an old Maybe later still counts", () => {
    localStorage.setItem("pr_save_prompt_tok-1", "1");
    const { result } = renderHook(() => useKeepAskPutDown("tok-1"));
    expect(result.current).toBe(true);
    expect(keepAskKey("tok-1")).toBe("pr_save_prompt_tok-1");
  });

  it("is due until put down, and put down for good, per event", () => {
    const { result } = renderHook(() => useKeepAskPutDown("tok-1"));
    const other = renderHook(() => useKeepAskPutDown("tok-2"));
    expect(result.current).toBe(false);
    act(() => putDownKeepAsk("tok-1"));
    expect(result.current).toBe(true);
    expect(other.result.current).toBe(false);
    expect(localStorage.getItem("pr_save_prompt_tok-1")).toBe("1");
  });

  it("★ with storage blocked, a Maybe later still holds for the page (never a sheet straight back up)", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { result } = renderHook(() => useKeepAskPutDown("tok-1"));
    expect(result.current).toBe(false);
    act(() => putDownKeepAsk("tok-1"));
    expect(result.current).toBe(true);
  });
});
