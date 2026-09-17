import { describe, expect, it } from "vitest";

import {
  composeBoardLine,
  composeLibraryLine,
  composeMessage,
  quoteNote,
} from "./review-message";

/**
 * THE GRAMMAR, from the composing side (the Library x Lab round, 2026-09-15).
 * The parsing side is `lab-review.test.ts`, which runs the round trip; this
 * file pins the shape the README states, so a change to one is a change to a
 * test rather than a silent drift.
 */

describe("the review message", () => {
  it("writes one line per board in the README's grammar", () => {
    expect(
      composeMessage([
        { board: "light", round: 4, ask: "aurora", choice: "yes" },
        { board: "light", round: 4, ask: "cadence", choice: "8s" },
        { board: "palette", round: 4, ask: "model", choice: "registers" },
      ]),
    ).toBe(
      "review light r4: aurora=yes; cadence=8s\nreview palette r4: model=registers",
    );
  });

  it("quotes a note beside its answer, and a board note at the end", () => {
    expect(
      composeBoardLine(
        "light",
        4,
        [
          {
            board: "light",
            round: 4,
            ask: "aurora",
            choice: "yes",
            note: "on paper too",
          },
        ],
        [{ board: "light", round: 4, text: "read the whole board first" }],
      ),
    ).toBe(
      'review light r4: aurora=yes "on paper too"; note: "read the whole board first"',
    );
  });

  it("flattens and escapes a note so a line stays one line", () => {
    expect(quoteNote('he said "no"\nand meant it')).toBe(
      '"he said \\"no\\" and meant it"',
    );
    expect(quoteNote("  spaced   out  ")).toBe('"spaced out"');
    expect(quoteNote("a back\\slash")).toBe('"a back\\\\slash"');
  });

  it("drops an empty note rather than writing empty quotes", () => {
    expect(
      composeBoardLine(
        "light",
        4,
        [
          {
            board: "light",
            round: 4,
            ask: "aurora",
            choice: "yes",
            note: "   ",
          },
        ],
        [{ board: "light", round: 4, text: "" }],
      ),
    ).toBe("review light r4: aurora=yes");
  });

  it("is empty when nothing was answered", () => {
    expect(composeMessage([], [])).toBe("");
    expect(composeBoardLine("light", 4, [], [])).toBe("");
  });

  it("carries a board that has only a note", () => {
    expect(
      composeMessage([], [{ board: "light", round: 4, text: "not yet" }]),
    ).toBe('review light r4: note: "not yet"');
  });
});

describe("a catalog's rulings", () => {
  it("writes the asks, then the items, then the board note", () => {
    expect(
      composeBoardLine(
        "palette",
        6,
        [{ board: "palette", round: 6, ask: "reach", choice: "all" }],
        [{ board: "palette", round: 6, text: "read the twelve first" }],
        [
          { board: "palette", round: 6, item: "ember", verdict: "keep" },
          {
            board: "palette",
            round: 6,
            item: "dusk",
            verdict: "kill",
            note: "the page stays white",
          },
        ],
      ),
    ).toBe(
      'review palette r6: reach=all; item:ember=keep; item:dusk=kill "the page stays white"; note: "read the twelve first"',
    );
  });

  it("prefixes every item, so an ask and a card may share a word", () => {
    // `palette` is an ask id AND could be a candidate id; without the prefix
    // the ledger could never tell the two apart.
    expect(
      composeBoardLine(
        "palette",
        6,
        [{ board: "palette", round: 6, ask: "palette", choice: "ember" }],
        [],
        [{ board: "palette", round: 6, item: "palette", verdict: "keep" }],
      ),
    ).toBe("review palette r6: palette=ember; item:palette=keep");
  });

  it("carries a board that was only ruled on, never answered", () => {
    expect(
      composeMessage(
        [],
        [],
        [{ board: "palette", round: 6, item: "ember", verdict: "refine" }],
      ),
    ).toBe("review palette r6: item:ember=refine");
  });
});

describe("the Library's line", () => {
  it("names the entries and their verdicts, with no round", () => {
    expect(
      composeLibraryLine([
        { entry: "masonry", verdict: "redesign", note: "the columns fight" },
        { entry: "button", verdict: "keep" },
      ]),
    ).toBe('review library: masonry=redesign "the columns fight"; button=keep');
  });

  it("is empty when nothing was ruled, and drops an entry with no verdict", () => {
    expect(composeLibraryLine([])).toBe("");
    expect(composeLibraryLine([{ entry: "button", verdict: "" }])).toBe("");
  });

  it("comes last in a session, after every board", () => {
    expect(
      composeMessage(
        [{ board: "light", round: 4, ask: "aurora", choice: "yes" }],
        [],
        [],
        [{ entry: "masonry", verdict: "retire" }],
      ),
    ).toBe("review light r4: aurora=yes\nreview library: masonry=retire");
  });
});

/**
 * THE BUILD STAMP (2026-09-17).
 *
 * Will's third batch arrived as `r7` against a tree already on `r8`, because
 * the alias had not been rebuilt since the board changed, and nothing on the
 * page could have told him: the round, the ledger and the spec all come from
 * one build, so a stale deployment shows an old round agreeing with an old
 * ledger. The paste carries the build it was composed on so `lab:review` can
 * compare the two, which is the one moment both numbers are in the same room.
 */
describe("the build the message was composed on", () => {
  it("rides as a comment line, above the first board", () => {
    expect(
      composeMessage(
        [{ board: "light", round: 4, ask: "aurora", choice: "yes" }],
        [],
        [],
        [],
        "6f25638",
      ),
    ).toBe("# build 6f25638\nreview light r4: aurora=yes");
  });

  it("is a `#` line, which the grammar has always skipped", () => {
    // The point of the shape: an older transcriber, and every paste already in
    // flight, reads a stamped message exactly as it read an unstamped one.
    const stamped = composeMessage(
      [{ board: "light", round: 4, ask: "aurora", choice: "yes" }],
      [],
      [],
      [],
      "6f25638",
    );
    expect(stamped.split("\n")[0].startsWith("#")).toBe(true);
    expect(stamped.split("\n").slice(1).join("\n")).toBe(
      composeMessage([
        { board: "light", round: 4, ask: "aurora", choice: "yes" },
      ]),
    );
  });

  it("says nothing when there is nothing to say", () => {
    // A bare "# build ..." would read as a message with a review in it.
    expect(composeMessage([], [], [], [], "6f25638")).toBe("");
    expect(
      composeMessage([
        { board: "light", round: 4, ask: "aurora", choice: "yes" },
      ]),
    ).toBe("review light r4: aurora=yes");
  });
});
