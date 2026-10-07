/**
 * A FRESH ROLL, SAID ONCE: her period against the one she last held shots on, on this device. Fresh only where she had
 * shots on a roll that has since started again; never her first roll, never twice.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  freshRollKey,
  isFreshRoll,
  keepPeriod,
  keepsPeriod,
  parseKeptPeriod,
  readKeptPeriod,
} from "./fresh-roll";

const A = 1_791_335_428_131;
const B = A + 3_600_000;

describe("isFreshRoll", () => {
  it.each([
    ["she held shots on another period", A, B, true],
    ["the same period", A, A, false],
    ["nothing kept: her first roll here", null, B, false],
    ["no period answered (a server before the migration)", A, undefined, false],
    ["no period answered, nothing kept", null, null, false],
  ])("%s", (_case, kept, period, fresh) => {
    expect(isFreshRoll(kept, period)).toBe(fresh);
  });
});

describe("keepsPeriod", () => {
  it("keeps a period she holds shots on, or one the panel has just said", () => {
    expect(keepsPeriod({ kept: null, period: A, held: 1, said: false })).toBe(
      true,
    );
    expect(keepsPeriod({ kept: A, period: B, held: 0, said: true })).toBe(true);
    expect(keepsPeriod({ kept: A, period: B, held: 2, said: false })).toBe(
      true,
    );
  });

  it("never a period she has not shot on, the one already kept, or none", () => {
    expect(keepsPeriod({ kept: null, period: A, held: 0, said: false })).toBe(
      false,
    );
    expect(keepsPeriod({ kept: A, period: A, held: 5, said: true })).toBe(
      false,
    );
    expect(
      keepsPeriod({ kept: A, period: undefined, held: 5, said: false }),
    ).toBe(false);
  });
});

describe("the device's memory", () => {
  /** A device's storage, stood in (this file runs in node). */
  function device(store = new Map<string, string>()) {
    const storage = {
      getItem: vi.fn((k: string) => store.get(k) ?? null),
      setItem: vi.fn((k: string, v: string) => void store.set(k, v)),
    };
    vi.stubGlobal("window", { localStorage: storage });
    return { store, storage };
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps one period an album, by its link, and reads it back", () => {
    const { store } = device();
    keepPeriod("qr-1", A);
    expect(store.get(freshRollKey("qr-1"))).toBe(String(A));
    expect(readKeptPeriod("qr-1")).toBe(A);
    expect(readKeptPeriod("qr-2")).toBeNull();
  });

  it("reads anything it cannot read as nothing kept, so the panel never shows from a guess", () => {
    for (const raw of [null, "", "soon", "-4", "1.5", "0"]) {
      expect(parseKeptPeriod(raw), String(raw)).toBeNull();
    }
    const { storage } = device();
    storage.getItem.mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readKeptPeriod("qr-1")).toBeNull();
  });

  it("a memory that cannot be written fails quietly", () => {
    const { storage } = device();
    storage.setItem.mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => keepPeriod("qr-1", A)).not.toThrow();
  });
});
