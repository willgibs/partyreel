/**
 * WHAT A SEND THAT WAITS FOR THE LINE SAYS (no-signal r1). The words are copy a guest reads in a dead zone, so each is
 * pinned whole: the state's word, the wait's, and a promise that says only what the keep holds.
 */
import { describe, expect, it } from "vitest";

import {
  NO_CONNECTION,
  paneNote,
  SEE_WHAT_WAITS,
  WAITING_FOR_CONNECTION,
  waitingCount,
  waitPromise,
} from "./words";

describe("the line's words", () => {
  it("says the state in the house's one word, never a fault's or 'No signal'", () => {
    expect(NO_CONNECTION).toBe("No connection");
    expect(WAITING_FOR_CONNECTION).toBe("Waiting for your connection");
    expect(SEE_WHAT_WAITS).toBe("See what waits for your connection");
    for (const w of [NO_CONNECTION, WAITING_FOR_CONNECTION]) {
      expect(w).not.toMatch(/fail|signal|error/i);
    }
  });

  it("★ the pane's note promises only what holds them: her phone, or the open page", () => {
    expect(paneNote("kept")).toBe("Kept on this phone");
    expect(paneNote("page")).toBe("Keep this page open");
  });

  it("★ the whole promise follows the keep, file by file, and never says safe", () => {
    expect(waitPromise({ n: 1, kept: 1 })).toBe(
      "Your photo is kept on this phone and goes by itself once your connection is back.",
    );
    expect(waitPromise({ n: 3, kept: 3 })).toBe(
      "Your 3 photos are kept on this phone and go by themselves once your connection is back.",
    );
    // One her phone could not hold: the page must stay open, and the promise says so of them all.
    expect(waitPromise({ n: 3, kept: 2 })).toBe(
      "Your 3 photos go by themselves once your connection is back. Keep this page open until then.",
    );
    expect(waitPromise({ n: 2, kept: 0, noun: "shot" })).toBe(
      "Your 2 shots go by themselves once your connection is back. Keep this page open until then.",
    );
    for (const line of [
      waitPromise({ n: 1, kept: 1 }),
      waitPromise({ n: 4, kept: 0 }),
    ]) {
      expect(line).not.toMatch(/safe|forever|always/i);
    }
  });

  it("counts what waits after its noun", () => {
    expect(waitingCount(1)).toBe("1 waiting");
    expect(waitingCount(4)).toBe("4 waiting");
  });
});
