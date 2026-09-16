import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  EMPTY_REVIEW,
  getReviewStore,
  setAnswerNote,
  setBoardNote,
  setItemNote,
  setReviewStore,
  toggleAnswer,
  toggleItemVerdict,
} from "./review-store";
import { holdId, itemHoldId } from "./step-id";

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
    const raw = JSON.parse(localStorage.getItem("partyreel.lab.review.v1")!);
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
    vi.resetModules();
    const fresh = await import("./review-store");
    expect(fresh.getReviewStore().items).toEqual({});
    expect(fresh.getReviewStore().answers["a.r1.b"]?.choice).toBe("x");
  });
});
