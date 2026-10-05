/**
 * THE FLAG CREATE LEAVES THE DASHBOARD (`just-made.ts`): the new event's id, in the tab, read by the lit stage's lamp
 * and spent there. The unit world has no DOM, so the tab's storage is a stand-in the test owns.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  forgetJustMade,
  isJustMade,
  rememberJustMade,
} from "@/components/app/create-event-wizard/just-made";

let store: Map<string, string>;
beforeEach(() => {
  store = new Map();
  vi.stubGlobal("window", {
    sessionStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("the event she just made", () => {
  it("is named by Create and found by that event alone", () => {
    expect(isJustMade("evt_1")).toBe(false);
    rememberJustMade("evt_1");
    expect(isJustMade("evt_1")).toBe(true);
    // Another event's lamp never takes it.
    expect(isJustMade("evt_2")).toBe(false);
  });

  it("is read without being spent, and spent once by the lamp that played", () => {
    rememberJustMade("evt_1");
    expect(isJustMade("evt_1")).toBe(true);
    expect(isJustMade("evt_1")).toBe(true);
    forgetJustMade("evt_1");
    expect(isJustMade("evt_1")).toBe(false);
  });

  it("keeps a newer event's flag when an older lamp spends its own", () => {
    rememberJustMade("evt_1");
    rememberJustMade("evt_2");
    forgetJustMade("evt_1");
    expect(isJustMade("evt_2")).toBe(true);
  });

  it("★ is no ignition, never a fault, where the tab's storage throws", () => {
    const throwing = () => {
      throw new DOMException("denied", "SecurityError");
    };
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: throwing,
        setItem: throwing,
        removeItem: throwing,
      },
    });
    expect(() => rememberJustMade("evt_1")).not.toThrow();
    expect(isJustMade("evt_1")).toBe(false);
    expect(() => forgetJustMade("evt_1")).not.toThrow();
  });
});
