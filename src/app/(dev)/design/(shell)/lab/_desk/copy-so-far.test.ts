// @contract-for: src/app/(dev)/design/(shell)/lab/_desk/copy-so-far.tsx
import { describe, expect, it } from "vitest";

import { composeSoFar, type Transcribed } from "./review-message";
import { holdId, itemHoldId } from "./step-id";

/**
 * "COPY SO FAR" (Will, 2026-09-16: "it's really annoying that there's not an
 * option to copy and send you only the answers I've completed so far... being
 * able to batch this at my own pace would be much more efficient").
 *
 * ★ ONLY WHAT IS HELD, AND ONLY WHAT IS NEW. The browser's store is the whole
 * sitting for ever, so without the second half the second paste of a batched
 * review re-sent everything in the first and the fifth re-sent forty lines. The
 * ledger's own values ride in from the desk's rows, keyed exactly as the store
 * keys them, and an entry that matches choice AND note is dropped. Change
 * either and it rides again, because a changed answer is what a later paste is
 * for.
 *
 * ★ AND A CLEARED CHOICE'S NOTE SURVIVES AS A NOTE. Clearing is deliberate (the
 * one toggle rule), and the words that survive it are usually why; dropping
 * them threw away the expensive half of the answer.
 *
 * ★ AND ONLY THE BOARD'S OPEN ROUND RIDES (Will, 2026-09-17: "Once a question
 * has been handled through you and fully resolved, it should not continue to
 * copy for future batch answers"). A reshaped board drops asks and moves on a
 * round; the store still holds the old round's entries, the ledger's map is
 * built from the current spec and so never lists them, and they rode on every
 * paste wearing the old round number. Closed rounds are closed.
 */
describe("composeSoFar", () => {
  const ROUNDS: Record<string, number> = { light: 6, rounding: 6, palette: 6 };
  const roundOf = (b: string) => ROUNDS[b];
  const nothing: Transcribed = { answers: {}, items: {} };

  it("composes only the held answers, verdicts and notes, one line per board", () => {
    const out = composeSoFar(
      {
        answers: {
          "light.r6.cadence": { choice: "eleven", note: "" },
          "rounding.r6.gap": { choice: "pinned", note: "a bug" },
        },
        items: {
          "palette.r6.item.ember": { verdict: "kill", note: "warm" },
          "palette.r6.item.slate": { verdict: "", note: "less blue" },
        },
        notes: { light: "the footer keeps its seam", palette: "", type: "  " },
      },
      roundOf,
    );
    expect(out.answers).toBe(2);
    expect(out.items).toBe(1);
    expect(out.notes).toBe(1);
    expect(out.message.split("\n")).toEqual([
      'review light r6: cadence=eleven; note: "the footer keeps its seam"',
      'review rounding r6: gap=pinned "a bug"',
      'review palette r6: item:ember=kill "warm"',
    ]);
  });

  it("is empty when nothing is held", () => {
    const out = composeSoFar({ answers: {}, items: {}, notes: {} }, roundOf);
    expect(out.message).toBe("");
    expect(out.answers + out.items + out.notes).toBe(0);
  });

  it("drops a note on a board whose round it cannot know", () => {
    const out = composeSoFar(
      { answers: {}, items: {}, notes: { orphan: "words" } },
      () => undefined,
    );
    expect(out.notes).toBe(0);
  });

  it("omits an answer the ledger already holds with the same choice and note", () => {
    const key = holdId("light", 6, "cadence");
    const out = composeSoFar(
      {
        answers: { [key]: { choice: "eleven", note: "the wide one" } },
        items: {},
        notes: {},
      },
      roundOf,
      {
        answers: { [key]: { choice: "eleven", note: "the wide one" } },
        items: {},
      },
    );
    expect(out.answers).toBe(0);
    expect(out.message).toBe("");
  });

  it("re-includes it the moment the choice changes", () => {
    const key = holdId("light", 6, "cadence");
    const out = composeSoFar(
      {
        answers: { [key]: { choice: "nine", note: "" } },
        items: {},
        notes: {},
      },
      roundOf,
      { answers: { [key]: { choice: "eleven" } }, items: {} },
    );
    expect(out.message).toBe("review light r6: cadence=nine");
  });

  it("re-includes it when only the note changed", () => {
    const key = holdId("light", 6, "cadence");
    const out = composeSoFar(
      {
        answers: { [key]: { choice: "eleven", note: "on second thoughts" } },
        items: {},
        notes: {},
      },
      roundOf,
      { answers: { [key]: { choice: "eleven", note: "" } }, items: {} },
    );
    expect(out.message).toBe(
      'review light r6: cadence=eleven "on second thoughts"',
    );
  });

  it("omits a verdict the ledger already holds, and sends a changed one", () => {
    const key = itemHoldId("palette", 6, "ember");
    const same = composeSoFar(
      {
        answers: {},
        items: { [key]: { verdict: "kill", note: "" } },
        notes: {},
      },
      roundOf,
      { answers: {}, items: { [key]: { verdict: "kill" } } },
    );
    expect(same.items).toBe(0);
    const changed = composeSoFar(
      {
        answers: {},
        items: { [key]: { verdict: "keep", note: "" } },
        notes: {},
      },
      roundOf,
      { answers: {}, items: { [key]: { verdict: "kill" } } },
    );
    expect(changed.message).toBe("review palette r6: item:ember=keep");
  });

  it("sends a cleared choice's surviving note as a note on that ask", () => {
    const out = composeSoFar(
      {
        answers: { "light.r6.paper": { choice: "", note: "not yet" } },
        items: {},
        notes: {},
      },
      roundOf,
      nothing,
    );
    expect(out.answers).toBe(0);
    expect(out.notes).toBe(1);
    expect(out.message).toBe('review light r6: note: "on paper: not yet"');
  });

  it("never sends an entry from a round the board has left, whatever the ledger lists", () => {
    // The light board is in round 6 here; these are round-5 answers the store
    // kept from an earlier sitting, on asks the reshaped spec no longer has.
    const out = composeSoFar(
      {
        answers: {
          "light.r5.kit": { choice: "land", note: "" },
          "light.r5.register": { choice: "accent", note: "too weak" },
          "light.r5.aurora": { choice: "", note: "confused by the question" },
          "light.r6.cadence": { choice: "8s", note: "" },
        },
        items: { "light.r5.item.seam": { verdict: "keep", note: "" } },
        notes: {},
      },
      roundOf,
      nothing,
    );
    expect(out.answers).toBe(1);
    expect(out.items).toBe(0);
    expect(out.notes).toBe(0);
    expect(out.message).toBe("review light r6: cadence=8s");
  });

  it("omits a not-clear answer the ledger holds as null with the same note", () => {
    const key = holdId("light", 6, "paper");
    const out = composeSoFar(
      {
        answers: { [key]: { choice: "?", note: "what is Family here" } },
        items: {},
        notes: {},
      },
      roundOf,
      { answers: { [key]: { choice: null, note: "what is Family here" } }, items: {} },
    );
    expect(out.answers).toBe(0);
    expect(out.message).toBe("");
  });

  it("takes a board note along only on the board's open round", () => {
    const out = composeSoFar(
      { answers: {}, items: {}, notes: { light: "the footer keeps its seam" } },
      roundOf,
      nothing,
    );
    expect(out.message).toBe(
      'review light r6: note: "the footer keeps its seam"',
    );
  });
});
