import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  EMPTY_REVIEW,
  getReviewStore,
  keepCalls,
  markSent,
  setAnswerNote,
  setBoardNote,
  setCallNote,
  setItemNote,
  setProgramNote,
  setReviewStore,
  toggleAnswer,
  toggleCallAnswer,
  toggleItemVerdict,
} from "./review-store";
import {
  boardNoteHoldId,
  callHoldId,
  holdId,
  itemHoldId,
  PROGRAM_NOTE_HOLD,
} from "./step-id";

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
    expect(
      getReviewStore().sent[itemHoldId("light", 5, "ember")],
    ).toBeDefined();
    expect(getReviewStore().sent[boardNoteHoldId("light")]).toBeDefined();
    setBoardNote("light", "on reflection, no");
    expect(getReviewStore().sent[boardNoteHoldId("light")]).toBeUndefined();
    expect(
      getReviewStore().sent[itemHoldId("light", 5, "ember")],
    ).toBeDefined();
  });
});

/**
 * THE NOTE FOR THE WHOLE PROGRAM (lab-sitting) is one more field of the same payload, under the same key:
 * a browser mid-sitting holds a payload without it, and that payload loads whole, with no note.
 */
describe("the note for the whole program", () => {
  it("loads a payload from before it existed, everything else intact", async () => {
    localStorage.setItem(
      "partyreel.lab.review.v2",
      JSON.stringify({
        answers: { "a.r1.b": { choice: "x", note: "why" } },
        notes: { a: "on the board" },
        items: { "a.r1.item.c": { verdict: "keep", note: "" } },
        sent: { "a.r1.b": { build: "abc", at: "2026-09-30T10:00:00Z" } },
      }),
    );
    vi.resetModules();
    const fresh = await import("./review-store");
    const store = fresh.getReviewStore();
    expect(store.program).toBe("");
    expect(store.answers["a.r1.b"]).toEqual({ choice: "x", note: "why" });
    expect(store.notes).toEqual({ a: "on the board" });
    expect(store.items["a.r1.item.c"]?.verdict).toBe("keep");
    expect(store.sent["a.r1.b"]?.build).toBe("abc");
  });

  it("holds it, persists it, and clears its sent mark on a change", () => {
    setProgramNote("every board, pictures first");
    expect(getReviewStore().program).toBe("every board, pictures first");
    expect(
      JSON.parse(localStorage.getItem("partyreel.lab.review.v2")!).program,
    ).toBe("every board, pictures first");
    markSent([PROGRAM_NOTE_HOLD], "abc1234");
    expect(getReviewStore().sent[PROGRAM_NOTE_HOLD]?.build).toBe("abc1234");
    setProgramNote("every board, pictures first, and quiet");
    expect(getReviewStore().sent[PROGRAM_NOTE_HOLD]).toBeUndefined();
  });
});

/**
 * THE CALLS (calls-desk, 2026-10-07): his answers at the desk's Calls place, one more field of the same payload under
 * the same key, picked and cleared by the same toggle rule, and a browser mid-sitting from before it loads whole.
 */
describe("the calls' answers", () => {
  it("toggles a call's answer by the one rule, its words surviving a clear", () => {
    expect(toggleCallAnswer("L2", "change")).toBe(true);
    setCallNote("L2", "a week of grace");
    expect(getReviewStore().calls.L2).toEqual({
      answer: "change",
      note: "a week of grace",
    });
    // Keep after Change keeps the words in the store: a Change pressed again
    // finds them, and the composer never sends them with a keep.
    expect(toggleCallAnswer("L2", "keep")).toBe(true);
    expect(getReviewStore().calls.L2).toEqual({
      answer: "keep",
      note: "a week of grace",
    });
    expect(toggleCallAnswer("L2", "keep")).toBe(false);
    expect(getReviewStore().calls.L2).toEqual({
      answer: "",
      note: "a week of grace",
    });
    setCallNote("L2", "");
    expect(getReviewStore().calls.L2).toBeUndefined();
  });

  it("clears a call's sent mark when its answer or its words change", () => {
    toggleCallAnswer("X2", "recommended");
    markSent([callHoldId("X2")], "abc1234");
    expect(getReviewStore().sent[callHoldId("X2")]?.build).toBe("abc1234");
    setCallNote("X2", "and soon");
    expect(getReviewStore().sent[callHoldId("X2")]).toBeUndefined();
    markSent([callHoldId("X2")], "abc1234");
    toggleCallAnswer("X2", "alt1");
    expect(getReviewStore().sent[callHoldId("X2")]).toBeUndefined();
  });

  it("keeps every call still unanswered in one press, and never one he answered", () => {
    toggleCallAnswer("R1", "change");
    setCallNote("R1", "forgive a small overage");
    toggleCallAnswer("AH1", "keep");
    markSent([callHoldId("AH1")], "abc1234");
    keepCalls(["L2", "R1", "AH1", "K5"]);
    const calls = getReviewStore().calls;
    expect(calls.L2?.answer).toBe("keep");
    expect(calls.K5?.answer).toBe("keep");
    expect(calls.R1).toEqual({
      answer: "change",
      note: "forgive a small overage",
    });
    // A call already answered is left as it was, its paste's mark with it.
    expect(getReviewStore().sent[callHoldId("AH1")]).toBeDefined();
  });

  it("loads a payload from before the Calls place, everything else intact", async () => {
    localStorage.setItem(
      "partyreel.lab.review.v2",
      JSON.stringify({
        answers: { "a.r1.b": { choice: "x", note: "" } },
        notes: {},
        items: {},
        sent: {},
        program: "on the whole",
      }),
    );
    vi.resetModules();
    const fresh = await import("./review-store");
    expect(fresh.getReviewStore().calls).toEqual({});
    expect(fresh.getReviewStore().program).toBe("on the whole");
    // And its first call answer writes into a fresh map.
    expect(fresh.toggleCallAnswer("L2", "keep")).toBe(true);
    expect(fresh.getReviewStore().calls).toEqual({
      L2: { answer: "keep", note: "" },
    });
  });
});
