// @contract-for: src/app/(dev)/design/(shell)/lab/_desk/copy-so-far.tsx
import { describe, expect, it } from "vitest";

import {
  composeSoFar,
  type OpenRound,
  type Transcribed,
} from "./review-message";
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
 *
 * ★ AND SO IS A STEP WITHDRAWN INSIDE A ROUND, AND A NOTE ALREADY SENT (Will,
 * 2026-09-17, worried his notes were landing on the wrong questions). The light
 * board's `paper` step was withdrawn after he ruled on it; his browser kept its
 * text, and every later line ended in `note: "on paper: ..."`, which reads as a
 * note on the last thing answered. Nothing rides for an ask or a card the open
 * round no longer declares, and the ledger's own notes are compared like
 * answers are.
 */
describe("composeSoFar", () => {
  // Each board's open round as its spec would declare it: the number, and the
  // asks and cards the transcriber would accept under it.
  const OPEN: Record<string, OpenRound> = {
    light: { round: 6, asks: ["cadence", "paper"], items: ["seam"] },
    rounding: { round: 6, asks: ["gap"], items: [] },
    palette: { round: 6, asks: [], items: ["ember", "slate"] },
  };
  const roundOf = (b: string) => OPEN[b];
  const nothing: Transcribed = { answers: {}, items: {}, notes: {} };

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
        notes: {},
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
      { answers: { [key]: { choice: "eleven" } }, items: {}, notes: {} },
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
      { answers: { [key]: { choice: "eleven", note: "" } }, items: {}, notes: {} },
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
      { answers: {}, items: { [key]: { verdict: "kill" } }, notes: {} },
    );
    expect(same.items).toBe(0);
    const changed = composeSoFar(
      {
        answers: {},
        items: { [key]: { verdict: "keep", note: "" } },
        notes: {},
      },
      roundOf,
      { answers: {}, items: { [key]: { verdict: "kill" } }, notes: {} },
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
      {
        answers: { [key]: { choice: null, note: "what is Family here" } },
        items: {},
        notes: {},
      },
    );
    expect(out.answers).toBe(0);
    expect(out.message).toBe("");
  });

  it("never sends a note the ledger's open round already holds", () => {
    // The paste that worried him: the paper step's words, held by the browser
    // and already in the ledger from the batch before.
    const paper = "After experimenting,\n  no light ground usage for now.";
    const out = composeSoFar(
      {
        answers: { "light.r6.paper": { choice: "", note: paper } },
        items: {},
        notes: { light: "the footer keeps its seam" },
      },
      roundOf,
      {
        answers: {},
        items: {},
        notes: {
          light: [
            "on paper: After experimenting, no light ground usage for now.",
            "the footer keeps its seam",
          ],
        },
      },
    );
    expect(out.notes).toBe(0);
    expect(out.message).toBe("");
  });

  it("sends a note again the moment its words change", () => {
    const out = composeSoFar(
      { answers: {}, items: {}, notes: { light: "the footer keeps its seam, slower" } },
      roundOf,
      { answers: {}, items: {}, notes: { light: ["the footer keeps its seam"] } },
    );
    expect(out.message).toBe(
      'review light r6: note: "the footer keeps its seam, slower"',
    );
  });

  it("sends nothing for a step the open round no longer asks", () => {
    // `hues` was withdrawn inside round six and `halo` left the catalog: the
    // store still holds all three, and the transcriber would refuse the line.
    const out = composeSoFar(
      {
        answers: {
          "light.r6.hues": { choice: "flat", note: "" },
          "light.r6.landing": { choice: "", note: "neither reads on paper" },
          "light.r6.cadence": { choice: "8s", note: "" },
        },
        items: { "light.r6.item.halo": { verdict: "kill", note: "" } },
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

  /**
   * THE SENT MARK (lab-tides, 2026-09-19). `transcribed` is only as fresh as
   * the build he is reading, so on a stale alias it says nothing about the
   * batch he pasted an hour ago and the next paste carries it again (his
   * question, 2026-09-19). The browser's own mark is what closes that, and the
   * message says exactly which keys it took so the Copy button can set it.
   */
  const sat = { build: "abc1234", at: "2026-09-19T10:00:00Z" };

  it("names every hold id the message carries, and nothing else", () => {
    const out = composeSoFar(
      {
        answers: {
          "light.r6.cadence": { choice: "eleven", note: "" },
          "light.r5.gone": { choice: "old", note: "" },
        },
        items: { "palette.r6.item.ember": { verdict: "keep", note: "" } },
        notes: { light: "one remark" },
      },
      roundOf,
      nothing,
    );
    expect(out.included.sort()).toEqual(
      [
        holdId("light", 6, "cadence"),
        itemHoldId("palette", 6, "ember"),
        "note:light",
      ].sort(),
    );
  });

  it("leaves out what a previous paste already took", () => {
    const store = {
      answers: { "light.r6.cadence": { choice: "eleven", note: "" } },
      items: { "palette.r6.item.ember": { verdict: "keep", note: "" } },
      notes: { light: "one remark" },
      sent: {
        [holdId("light", 6, "cadence")]: sat,
        [itemHoldId("palette", 6, "ember")]: sat,
        "note:light": sat,
      },
    };
    expect(composeSoFar(store, roundOf, nothing).message).toBe("");
    // And "Copy everything" is the way back for a paste that went missing.
    const all = composeSoFar(store, roundOf, nothing, null, {
      ignoreSent: true,
    });
    expect(all.answers).toBe(1);
    expect(all.items).toBe(1);
    expect(all.notes).toBe(1);
  });

  it("carries a marked entry again once it changes", () => {
    // The store clears the mark on the write; this is the composer's half.
    const out = composeSoFar(
      {
        answers: {
          "light.r6.cadence": { choice: "twelve", note: "" },
          "light.r6.paper": { choice: "warm", note: "" },
        },
        items: {},
        notes: {},
        sent: { [holdId("light", 6, "paper")]: sat },
      },
      roundOf,
      nothing,
    );
    expect(out.message).toBe("review light r6: cadence=twelve");
    expect(out.included).toEqual([holdId("light", 6, "cadence")]);
  });

  it("marks a cleared choice's surviving note under the answer's own key", () => {
    const store = {
      answers: { "light.r6.paper": { choice: "", note: "it never worked" } },
      items: {},
      notes: {},
    };
    const out = composeSoFar(store, roundOf, nothing);
    expect(out.included).toEqual([holdId("light", 6, "paper")]);
    // Marked, the words stop riding: the note has no key of its own.
    expect(
      composeSoFar(
        { ...store, sent: { [holdId("light", 6, "paper")]: sat } },
        roundOf,
        nothing,
      ).message,
    ).toBe("");
  });
});
