import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  EMPTY_REVIEW,
  getReviewStore,
  markSent,
  setAnswerNote,
  setBoardNote,
  setItemNote,
  setReviewStore,
  toggleAnswer,
  toggleItemVerdict,
} from "./review-store";
import { boardNoteHoldId, holdId, itemHoldId } from "./step-id";

/**
 * THE ONE TOGGLE RULE (Will, 2026-09-16: "I can't unpick a selection to return
 * to a non-selected state"): every surface picks through these writers, so a
 * second click clears everywhere, a note survives a clear, and an item's
 * verdict behaves exactly like an ask's answer.
 */
beforeEach(() => {
  localStorage.clear();
  setReviewStore(EMPTY_REVIEW);
});

describe("the review store's writers", () => {
  it("sets a choice, and a second click on it clears", () => {
    expect(toggleAnswer("light", 5, "aurora", "seam")).toBe(true);
    expect(getReviewStore().answers[holdId("light", 5, "aurora")]?.choice).toBe(
      "seam",
    );
    expect(toggleAnswer("light", 5, "aurora", "seam")).toBe(false);
    expect(
      getReviewStore().answers[holdId("light", 5, "aurora")],
    ).toBeUndefined();
  });

  it("switches to another option without a clear in between", () => {
    toggleAnswer("light", 5, "aurora", "seam");
    expect(toggleAnswer("light", 5, "aurora", "both")).toBe(true);
    expect(getReviewStore().answers[holdId("light", 5, "aurora")]?.choice).toBe(
      "both",
    );
  });

  it("keeps the note when the choice is cleared", () => {
    toggleAnswer("light", 5, "aurora", "seam");
    setAnswerNote("light", 5, "aurora", "the footer is the one");
    toggleAnswer("light", 5, "aurora", "seam");
    expect(getReviewStore().answers[holdId("light", 5, "aurora")]).toEqual({
      choice: "",
      note: "the footer is the one",
    });
    setAnswerNote("light", 5, "aurora", "");
    expect(
      getReviewStore().answers[holdId("light", 5, "aurora")],
    ).toBeUndefined();
  });

  it("holds a board note and drops it when emptied", () => {
    setBoardNote("light", "read it all");
    expect(getReviewStore().notes.light).toBe("read it all");
    setBoardNote("light", "");
    expect(getReviewStore().notes.light).toBeUndefined();
  });

  it("toggles an item's verdict the same way, with its note", () => {
    expect(toggleItemVerdict("palette", 6, "ember", "keep")).toBe(true);
    setItemNote("palette", 6, "ember", "warm");
    expect(getReviewStore().items[itemHoldId("palette", 6, "ember")]).toEqual({
      verdict: "keep",
      note: "warm",
    });
    expect(toggleItemVerdict("palette", 6, "ember", "keep")).toBe(false);
    expect(getReviewStore().items[itemHoldId("palette", 6, "ember")]).toEqual({
      verdict: "",
      note: "warm",
    });
    expect(toggleItemVerdict("library", 0, "button", "redesign")).toBe(true);
  });

  it("persists to localStorage under the one key", () => {
    toggleAnswer("light", 5, "aurora", "seam");
    const raw = JSON.parse(localStorage.getItem("partyreel.lab.review.v2")!);
    expect(raw.answers[holdId("light", 5, "aurora")].choice).toBe("seam");
    expect(raw.items).toEqual({});
  });

  it("loads a payload from before items existed", async () => {
    localStorage.setItem(
      "partyreel.lab.review.v1",
      JSON.stringify({
        answers: { "a.r1.b": { choice: "x", note: "" } },
        notes: {},
      }),
    );
    // The harness writes an empty v2 in beforeEach; a browser that has never
    // run this shape has no v2 at all, which is what the fallback is for.
    localStorage.removeItem("partyreel.lab.review.v2");
    vi.resetModules();
    const fresh = await import("./review-store");
    expect(fresh.getReviewStore().items).toEqual({});
    expect(fresh.getReviewStore().answers["a.r1.b"]?.choice).toBe("x");
  });

  /**
   * THE SENT MARK (lab-tides, 2026-09-19): what a paste took, so the next one
   * leaves it alone, and what a change of mind does to that.
   */
  it("migrates a v1 payload with nothing marked sent", async () => {
    localStorage.setItem(
      "partyreel.lab.review.v1",
      JSON.stringify({
        answers: { "a.r1.b": { choice: "x", note: "" } },
        notes: {},
        items: {},
      }),
    );
    localStorage.removeItem("partyreel.lab.review.v2");
    vi.resetModules();
    const fresh = await import("./review-store");
    expect(fresh.getReviewStore().answers["a.r1.b"]?.choice).toBe("x");
    // Never a guess: an answer whose paste cannot be proven rides once more.
    expect(fresh.getReviewStore().sent).toEqual({});
  });

  it("marks what a paste took, with the build it was composed on", () => {
    toggleAnswer("light", 5, "aurora", "seam");
    markSent([holdId("light", 5, "aurora")], "abc1234");
    const mark = getReviewStore().sent[holdId("light", 5, "aurora")];
    expect(mark?.build).toBe("abc1234");
    expect(mark?.at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("clears the mark for the one entry that changed, and no other", () => {
    toggleAnswer("light", 5, "aurora", "seam");
    toggleAnswer("light", 5, "accent", "own");
    markSent(
      [holdId("light", 5, "aurora"), holdId("light", 5, "accent")],
      "abc1234",
    );
    toggleAnswer("light", 5, "aurora", "field");
    expect(getReviewStore().sent[holdId("light", 5, "aurora")]).toBeUndefined();
    expect(getReviewStore().sent[holdId("light", 5, "accent")]).toBeDefined();
  });

  it("clears the mark when only the note changes", () => {
    toggleAnswer("light", 5, "aurora", "seam");
    markSent([holdId("light", 5, "aurora")], null);
    setAnswerNote("light", 5, "aurora", "on second thoughts");
    expect(getReviewStore().sent[holdId("light", 5, "aurora")]).toBeUndefined();
  });

  it("keeps his picks when an entry is marked: a mark is not a clear", () => {
    toggleAnswer("light", 5, "aurora", "seam");
    markSent([holdId("light", 5, "aurora")], "abc1234");
    expect(getReviewStore().answers[holdId("light", 5, "aurora")].choice).toBe(
      "seam",
    );
  });

  it("marks an item's verdict and a board note under their own keys", () => {
    toggleItemVerdict("light", 5, "ember", "keep");
    setBoardNote("light", "the whole board reads well");
    markSent(
      [itemHoldId("light", 5, "ember"), boardNoteHoldId("light")],
      "abc1234",
    );
    expect(getReviewStore().sent[itemHoldId("light", 5, "ember")]).toBeDefined();
    expect(getReviewStore().sent[boardNoteHoldId("light")]).toBeDefined();
    setBoardNote("light", "on reflection, no");
    expect(getReviewStore().sent[boardNoteHoldId("light")]).toBeUndefined();
    expect(getReviewStore().sent[itemHoldId("light", 5, "ember")]).toBeDefined();
  });
});
