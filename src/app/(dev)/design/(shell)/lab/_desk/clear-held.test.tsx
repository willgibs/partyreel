/**
 * A CLEAR ON THE DESK (Will, 2026-10-07): "Copy everything" carried a past batch's answers into his calls paste, since
 * the desk still served a build older than their transcription. One quiet press empties the sitting's held answers,
 * after a confirm that says plainly what it empties and how much of that nothing else holds. The store it empties is
 * the real one (the writers below are the desk's own), over a registry and a calls file reduced to what the counts read.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ClearHeld,
  clearWords,
  CopySoFar,
  tallyHeld,
  type HeldTally,
} from "./copy-so-far";
import {
  EMPTY_REVIEW,
  getReviewStore,
  markSent,
  setBoardNote,
  setProgramNote,
  setReviewStore,
  toggleAnswer,
  toggleCallAnswer,
  toggleItemVerdict,
} from "./review-store";
import { boardNoteHoldId, callHoldId, holdId, itemHoldId } from "./step-id";

// One board with two asks and a catalog of two cards, one call: the open round the counts are read against.
vi.mock("@/app/(dev)/design/sandbox/registry", () => ({
  boardSpec: (board: string) =>
    board === "light"
      ? {
          round: { n: 5 },
          asks: [{ id: "depth" }, { id: "edge" }],
          catalog: true,
          candidates: [{ id: "a" }, { id: "b" }],
        }
      : undefined,
}));
vi.mock("@/lib/calls/calls", () => ({
  openCall: (id: string) =>
    id === "X1"
      ? { kind: "call", answers: ["keep", "change"], at: 1 }
      : undefined,
  CALLS: { entries: [] },
}));

beforeEach(() => {
  localStorage.clear();
  act(() => setReviewStore(EMPTY_REVIEW));
});

/** A sitting of three answers (one of them already pasted), a verdict, a board note and a kept call. */
function seedSitting() {
  act(() => {
    toggleAnswer("light", 5, "depth", "family");
    toggleAnswer("light", 5, "edge", "lift");
    toggleItemVerdict("light", 5, "a", "keep");
    setBoardNote("light", "the footer is the one");
    toggleCallAnswer("X1", "keep");
    markSent([holdId("light", 5, "edge")]);
  });
}

const tally = (over: Partial<HeldTally> = {}): HeldTally => ({
  answers: 0,
  verdicts: 0,
  notes: 0,
  unsent: 0,
  ...over,
});

describe("what the Clear says it empties", () => {
  it("counts the sitting the way the Copy buttons do, and what no paste has taken", () => {
    seedSitting();
    // Two board answers and the call are answers; the verdict; the board note. The pasted one is held but not unsent.
    expect(tallyHeld(getReviewStore())).toEqual({
      answers: 3,
      verdicts: 1,
      notes: 1,
      unsent: 4,
    });
  });

  it("★ leaves out a closed round's leftovers and a call the file no longer asks (they never ride, so they are not 'held')", () => {
    act(() => {
      toggleAnswer("light", 4, "depth", "family"); // the board is on round 5
      toggleAnswer("retired", 1, "x", "y"); // a board that left the lab
      toggleCallAnswer("X9", "keep"); // a call the file retired
    });
    expect(tallyHeld(getReviewStore())).toEqual(tally());
  });

  it("counts the program's note as a note, and a pasted one as held but not unsent", () => {
    act(() => setProgramNote("everything about the lab"));
    expect(tallyHeld(getReviewStore())).toEqual(tally({ notes: 1, unsent: 1 }));
    act(() => markSent(["note:*"]));
    expect(tallyHeld(getReviewStore())).toEqual(tally({ notes: 1 }));
  });

  it("says the kinds held, the loss in the same breath, and 1 where it is 1", () => {
    expect(
      clearWords(tally({ answers: 14, verdicts: 2, notes: 1, unsent: 5 })),
    ).toBe(
      "Clear 14 answers, 2 verdicts and 1 note held in this browser? 5 of them are not copied yet and would be lost.",
    );
    expect(clearWords(tally({ answers: 2, notes: 3, unsent: 1 }))).toBe(
      "Clear 2 answers and 3 notes held in this browser? 1 of them is not copied yet and would be lost.",
    );
    expect(clearWords(tally({ verdicts: 1, unsent: 1 }))).toBe(
      "Clear 1 verdict held in this browser? It is not copied yet and would be lost.",
    );
    expect(clearWords(tally({ answers: 4, unsent: 0 }))).toBe(
      "Clear 4 answers held in this browser? All of it is already copied or recorded.",
    );
    expect(clearWords(tally({ notes: 1, unsent: 0 }))).toBe(
      "Clear 1 note held in this browser? It is already copied or recorded.",
    );
  });
});

describe("the Clear on the desk", () => {
  it("shows nothing while nothing is held, and appears with the sitting", () => {
    render(<CopySoFar />);
    expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
    seedSitting();
    expect(screen.getByRole("button", { name: "Clear" })).toBeTruthy();
  });

  it("★ asks first, in words, and one press alone empties nothing", () => {
    seedSitting();
    render(<CopySoFar />);
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByRole("status").textContent).toBe(
      "Clear 3 answers, 1 verdict and 1 note held in this browser? 4 of them are not copied yet and would be lost.",
    );
    // The press became the question; the store is whole.
    expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
    expect(Object.keys(getReviewStore().answers)).toHaveLength(2);
    expect(getReviewStore().notes).toEqual({ light: "the footer is the one" });
  });

  it("★ lands the focus on Keep, so Enter never clears, and Keep and Escape both put the press back", () => {
    seedSitting();
    render(<CopySoFar />);
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    const keep = screen.getByRole("button", { name: "Keep" });
    expect(document.activeElement).toBe(keep);

    fireEvent.click(keep);
    const back = screen.getByRole("button", { name: "Clear" });
    expect(document.activeElement).toBe(back);
    expect(screen.queryByRole("status")).toBeNull();

    fireEvent.click(back);
    fireEvent.keyDown(screen.getByRole("group"), { key: "Escape" });
    expect(screen.getByRole("button", { name: "Clear" })).toBeTruthy();
    expect(Object.keys(getReviewStore().answers)).toHaveLength(2);
  });

  it("★ confirming empties the whole store: answers, verdict, notes, the call, the program's note and every mark", () => {
    seedSitting();
    act(() => setProgramNote("about the lab"));
    render(<CopySoFar />);
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear them" }));

    const store = getReviewStore();
    expect(store.answers).toEqual({});
    expect(store.items).toEqual({});
    expect(store.notes).toEqual({});
    expect(store.calls).toEqual({});
    expect(store.sent).toEqual({});
    expect(store.program).toBe("");
    // And the Copy buttons and the Clear go with it, nothing being held; a reload finds the same.
    expect(screen.queryByRole("button", { name: /Copy/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
    expect(
      JSON.parse(localStorage.getItem("partyreel.lab.review.v2")!),
    ).toEqual({ ...EMPTY_REVIEW });
  });

  it("says it is all copied once every part has been pasted", () => {
    seedSitting();
    act(() =>
      markSent([
        holdId("light", 5, "depth"),
        itemHoldId("light", 5, "a"),
        boardNoteHoldId("light"),
        callHoldId("X1"),
      ]),
    );
    render(<CopySoFar />);
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByRole("status").textContent).toBe(
      "Clear 3 answers, 1 verdict and 1 note held in this browser? All of it is already copied or recorded.",
    );
  });

  it("★ a question left open when the store emptied elsewhere does not come back with the next answer", () => {
    seedSitting();
    render(
      <>
        <CopySoFar />
        <CopySoFar />
      </>,
    );
    const [first, second] = screen.getAllByRole("button", { name: "Clear" });
    fireEvent.click(first);
    // The second Clear (the desk shows one beside each Copy) answers the same question and empties the store.
    fireEvent.click(second);
    fireEvent.click(screen.getAllByRole("button", { name: "Clear them" })[0]);
    expect(screen.queryByRole("group")).toBeNull();

    act(() => {
      toggleAnswer("light", 5, "depth", "lift");
    });
    expect(screen.queryByRole("group")).toBeNull();
    expect(screen.getAllByRole("button", { name: "Clear" })).toHaveLength(2);
  });
});

describe("the walk's own Clear", () => {
  it("wears the walk's word, asks the same question, and goes back to the first step once emptied", () => {
    seedSitting();
    const onCleared = vi.fn();
    render(
      <ClearHeld
        tally={tallyHeld(getReviewStore())}
        label="Clear this session"
        onCleared={onCleared}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear this session" }));
    expect(onCleared).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Keep" }));
    expect(onCleared).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Clear this session" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear them" }));
    expect(onCleared).toHaveBeenCalledTimes(1);
    expect(getReviewStore().answers).toEqual({});
  });
});
