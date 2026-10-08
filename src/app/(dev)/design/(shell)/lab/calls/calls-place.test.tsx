/**
 * THE CALLS PLACE, PRESSED (calls-desk, 2026-10-07): each entry read at a glance and answered in a press, every answer
 * held in the review's own store, the store the one paste is composed from. What it must never do is decide for him:
 * a call he leaves stays unanswered (only a press keeps it), "Keep the other N" never overwrites a change, and a
 * change held from an earlier visit never pulls the page to its field when the desk loads.
 */
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import type { BuiltCall, QuestionEntry } from "@/lib/calls/calls";

import {
  EMPTY_REVIEW,
  getReviewStore,
  setReviewStore,
} from "../_desk/review-store";
import { CallsPlace } from "./calls-place";

const QUESTION: QuestionEntry = {
  id: "X9",
  kind: "question",
  theme: "What Partyreel is",
  title: "Who can act for an event?",
  body: "Today one account owns and runs each event (`events.host_id`).",
  recommended: "co-hosts invited by email.",
  alternatives: ["one owner for good", "hand-over now"],
};
const call = (id: string, theme: string): BuiltCall => ({
  id,
  kind: "call",
  theme,
  title: `The call ${id}.`,
  body: "It does one thing on its own.",
  changeIf: "it should do another.",
  home: "docs/systems/billing-caps.md",
});
const THEMES = [
  { theme: "Plans and billing", calls: [call("L2", "Plans and billing")] },
  {
    theme: "An event's life and timing",
    calls: [
      call("K5", "An event's life and timing"),
      call("G3", "An event's life and timing"),
    ],
  },
];

const place = () =>
  render(<CallsPlace questions={[QUESTION]} themes={THEMES} />);
const callGroup = (id: string) =>
  screen.getByRole("group", { name: `Keep or change ${id}` });
const press = (id: string, word: "Keep" | "Change") =>
  fireEvent.click(within(callGroup(id)).getByRole("button", { name: word }));

beforeEach(() => {
  localStorage.clear();
  setReviewStore(EMPTY_REVIEW);
});

describe("the Calls place", () => {
  it("draws the questions first, then each theme's calls, every entry with its id", () => {
    place();
    expect(
      screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent),
    ).toEqual([
      "Open questions",
      "Plans and billing",
      "An event's life and timing",
    ]);
    for (const id of ["X9", "L2", "K5", "G3"])
      expect(screen.getByText(id)).toBeTruthy();
    // A name in backticks reads as a name, never with its ticks.
    expect(screen.getByText("events.host_id").tagName).toBe("CODE");
  });

  it("keeps a call only when he presses Keep, and a second press takes it back", () => {
    place();
    expect(getReviewStore().calls).toEqual({});
    press("L2", "Keep");
    expect(getReviewStore().calls.L2).toEqual({ answer: "keep", note: "" });
    expect(
      within(callGroup("L2"))
        .getByRole("button", { name: "Keep" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    press("L2", "Keep");
    expect(getReviewStore().calls.L2).toBeUndefined();
  });

  it("opens a change's field on the press, focused, and holds his words", () => {
    place();
    expect(screen.queryByRole("textbox", { name: /K5 should do/ })).toBeNull();
    press("K5", "Change");
    const field = screen.getByRole("textbox", {
      name: "What K5 should do instead",
    });
    expect(document.activeElement).toBe(field);
    expect(screen.getByText(/Say what it should do instead/)).toBeTruthy();
    fireEvent.change(field, { target: { value: "a longer clock" } });
    expect(getReviewStore().calls.K5).toEqual({
      answer: "change",
      note: "a longer clock",
    });
  });

  it("never pulls the desk to a change held from an earlier visit", () => {
    // The scar: an `autoFocus` on the field focused it, and scrolled to it,
    // every time the desk loaded with a change held.
    setReviewStore({
      ...EMPTY_REVIEW,
      calls: { G3: { answer: "change", note: "until done" } },
    });
    place();
    expect(
      screen.getByRole("textbox", { name: "What G3 should do instead" }),
    ).toBeTruthy();
    expect(document.activeElement).toBe(document.body);
  });

  it("keeps the rest in one press, never over a change he made", () => {
    place();
    press("K5", "Change");
    fireEvent.change(
      screen.getByRole("textbox", { name: "What K5 should do instead" }),
      { target: { value: "a longer clock" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Keep the other 2" }));
    const calls = getReviewStore().calls;
    expect(calls.L2?.answer).toBe("keep");
    expect(calls.G3?.answer).toBe("keep");
    expect(calls.K5).toEqual({ answer: "change", note: "a longer clock" });
    // Every call answered: nothing left to keep, so the press is gone.
    expect(
      screen.queryByRole("button", { name: /^Keep (all|the other)/ }),
    ).toBeNull();
  });

  it("takes a question's pick, or his own words with no pick", () => {
    place();
    const group = screen.getByRole("group", { name: "Your answer to X9" });
    fireEvent.click(within(group).getAllByRole("button")[2]);
    expect(getReviewStore().calls.X9).toEqual({ answer: "alt2", note: "" });
    fireEvent.click(within(group).getAllByRole("button")[2]);
    const own = screen.getByRole("textbox", { name: "Your own answer to X9" });
    fireEvent.change(own, { target: { value: "co-hosts, but later" } });
    expect(getReviewStore().calls.X9).toEqual({
      answer: "",
      note: "co-hosts, but later",
    });
    expect(screen.getByText("This rides as your own answer.")).toBeTruthy();
  });

  it("shows what a paste took, and reads a stored value of another shape as nothing held", () => {
    act(() =>
      setReviewStore({
        ...EMPTY_REVIEW,
        calls: {
          L2: { answer: "keep", note: "" },
          K5: "keep" as unknown as { answer: string; note: string },
        },
        sent: { "call:L2": { build: "abc1234", at: "2026-10-07T12:00:00Z" } },
      }),
    );
    place();
    expect(within(callGroup("L2")).getByText("sent on abc1234")).toBeTruthy();
    expect(
      within(callGroup("K5"))
        .getByRole("button", { name: "Keep" })
        .getAttribute("aria-pressed"),
    ).toBe("false");
  });
});
