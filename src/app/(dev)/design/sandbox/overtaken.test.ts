// @contract-for: src/app/(dev)/design/sandbox/overtaken.ts
import { describe, expect, it } from "vitest";

import { optionLabel, optionMeans } from "@/components/lab/board-spec";

import {
  ALSO_REACHED,
  AS_TODAY_GLOSS,
  badgeText,
  concedes,
  OVERTAKEN,
  outcomeOf,
  overtakenFor,
  overtakenKey,
  overtakenOn,
  saysAsToday,
  STANDS,
  STANDS_NOTE,
} from "./overtaken";
import { BOARDS } from "./registry";

/**
 * THE OVERTAKEN MAP, HELD TO THE BOARDS IT ANNOTATES.
 *
 * ★ THE ONE FAILURE THIS EXISTS TO CATCH is an annotation pointing at a
 * question that no longer exists: a board rewords an ask, opens a new round or
 * retires, and a badge goes on saying an earlier ruling reached something
 * nobody is being asked. `status.ts` guards the ledger's answers exactly this
 * way (an answer whose ask the spec no longer declares is `orphaned`); this is
 * the same join for the same reason, made at build time instead of at read
 * time, because a badge that lies is worse than an answer that is orphaned.
 *
 * ★ AND THE LINES ARE HELD TO THEIR SHAPE. Will asked for one line per
 * question, and the lane's whole judgment is in it: "stands: <why this option
 * may beat the ruling>" or "concedes: <what the ruling covers>". A line that
 * grew into a paragraph is a redraw wearing a badge's clothes. A SECOND ruling
 * reaching the same question appends one clause behind `ALSO_REACHED` rather
 * than rewriting the first pass's judgment, so the cap is read on the judgment
 * and again on the whole.
 *
 * It is deliberately NOT a published contract (`@contract-for:`): the collector
 * indexes every file a marker names and an indexed file owes a `for` line in
 * `rules/component-notes.ts`, which is not this lane's to edit. The exact line
 * is proposed in the Handoff; these tests run either way.
 */

const KEYS = Object.keys(OVERTAKEN);
/**
 * ★ THE BOARDS WHOSE RULINGS DO THE OVERTAKING, not a list of boards that are
 * safe from it. The fifth batch's four had every ask answered, so "a ruler is
 * never itself reached" held by accident; the sixth batch's boards are still on
 * the desk with open asks and round twos coming, and a later board's ruling may
 * perfectly well reach one of them. The invariant that actually matters is the
 * one below it: a board never overtakes its own question, because his note on
 * the board he is walking is an ANSWER, not a backdrop that moved.
 */
const RULED = [
  "voice",
  "body-type",
  "glass",
  "app-shape",
  "guest-shape",
  "app-vocabulary",
  "seed-avatar",
  "admin",
  "app-door",
  "demo-event",
  "pricing-page",
];
/** One line, readable at a glance on the way past a question. */
const LINE_CAP = 160;
/** The judgment, plus at most one appended clause naming a second ruling. */
const WHOLE_CAP = 260;

const askOf = (board: string, ask: string) =>
  BOARDS.find((b) => b.id === board)?.asks.find((a) => a.id === ask);

/** The judgment the first pass wrote, with any appended clause taken off. */
const judgment = (line: string) => line.split(ALSO_REACHED)[0];

describe("the overtaken map", () => {
  it("annotates only questions a standing board still asks", () => {
    for (const key of KEYS) {
      const [board, ...rest] = key.split(".");
      const ask = rest.join(".");
      expect(rest.length, `${key} is not <board>.<ask>`).toBe(1);
      expect(
        BOARDS.some((b) => b.id === board),
        `${key} names "${board}", which is not a standing board`,
      ).toBe(true);
      expect(
        askOf(board, ask),
        `${key}: ${board} declares no ask "${ask}" in round ${
          BOARDS.find((b) => b.id === board)?.round.n
        }`,
      ).toBeDefined();
    }
  });

  it("never lets a board overtake its own question", () => {
    for (const [key, note] of Object.entries(OVERTAKEN)) {
      expect(
        note.by,
        `${key}: a board cannot overtake its own question`,
      ).not.toBe(key.split(".")[0]);
    }
  });

  it("credits a ruled board with every ruling", () => {
    for (const [key, note] of Object.entries(OVERTAKEN)) {
      expect(
        RULED.includes(note.by),
        `${key}: "${note.by}" is not one of the boards whose rulings landed`,
      ).toBe(true);
      expect(note.since.length, `${key}: since is empty`).toBeGreaterThan(0);
      expect(note.since, `${key}: since names a round and a date`).toMatch(
        /^[a-z-]+ r\d+, \d{1,2} \w{3}$/,
      );
      expect(note.ruling.length, `${key}: ruling is empty`).toBeGreaterThan(0);
      // The badge is read by someone who has never seen the ledger grammar.
      expect(note.ruling, `${key}: the ruling reads as a clause`).not.toMatch(
        /[a-z-]+=[a-z-]+/,
      );
    }
  });

  it("holds every judgment to one line, in the two words", () => {
    for (const [key, note] of Object.entries(OVERTAKEN)) {
      expect(
        note.line,
        `${key}: a line says "stands:" or "concedes:" and nothing else`,
      ).toMatch(/^(stands|concedes): /);
      expect(note.line, `${key}: a line is one line`).not.toContain("\n");
      const first = judgment(note.line);
      expect(
        first.length,
        `${key}: ${first.length} characters is a paragraph, not a line`,
      ).toBeLessThanOrEqual(LINE_CAP);
      expect(
        note.line.length,
        `${key}: ${note.line.length} characters with its second clause`,
      ).toBeLessThanOrEqual(WHOLE_CAP);
      // No em-dashes anywhere a reviewer reads (the copy policy).
      expect(`${note.line} ${note.ruling} ${note.since}`).not.toContain("—");
    }
  });

  /**
   * ★ A SECOND RULING APPENDS; IT NEVER REWRITES. Will's contract is that an
   * earlier exploration is never killed by a later selection, and the same
   * holds one level up: the judgment a pass made is left standing and the
   * ruling that arrived after it rides behind. The clause has to name the board
   * and the date for the same reason the badge does, so a reader can go and
   * find the words in rulings.md without asking anybody.
   */
  it("appends a second ruling behind the first, named and dated", () => {
    const appended = Object.entries(OVERTAKEN).filter(([, n]) =>
      n.line.includes(ALSO_REACHED),
    );
    expect(
      appended.length,
      "the sixth batch reached questions the fifth had already badged",
    ).toBeGreaterThan(0);
    for (const [key, note] of appended) {
      const clauses = note.line.split(ALSO_REACHED);
      expect(clauses.length, `${key}: one appended clause, never two`).toBe(2);
      const [board] = clauses[1].split(" ");
      expect(
        RULED.includes(board),
        `${key}: "${board}" is not a board whose ruling landed`,
      ).toBe(true);
      expect(
        board,
        `${key}: a board cannot overtake its own question, twice over`,
      ).not.toBe(key.split(".")[0]);
      expect(clauses[1], `${key}: the clause names a round and a date`).toMatch(
        /^[a-z-]+ r\d+, \d{1,2} \w{3}: .+\.$/,
      );
      // The first pass's judgment is left exactly as it was written.
      expect(judgment(note.line)).toMatch(/^(stands|concedes): .+\.$/);
    }
  });

  it("reads a concession off the line it is written on", () => {
    const conceded = Object.values(OVERTAKEN).filter(concedes);
    expect(
      conceded.length,
      "his notes answered several outright",
    ).toBeGreaterThan(0);
    for (const note of Object.values(OVERTAKEN)) {
      expect(concedes(note)).toBe(note.line.startsWith("concedes:"));
    }
  });

  it("speaks the badge in plain words with the date", () => {
    const note = overtakenFor("guest-shape", "dialogs");
    expect(note).toBeDefined();
    expect(badgeText(note!)).toBe(
      "Ruled since app-shape r1, 19 Sep: one responsive sheet everywhere: a side panel at a desk, a bottom sheet in a hand",
    );
  });

  it("counts a board's overtaken asks for the desk", () => {
    expect(overtakenOn("first-event")).toBe(4);
    // Round one's five badges retired with the asks they named (album-controls,
    // 2026-09-20): the board's round two is too new for anything to overtake yet.
    expect(overtakenOn("app-vocabulary")).toBe(0);
    // The sixth batch ruled the portal's whole shell, one board over.
    expect(overtakenOn("admin-triage")).toBe(7);
    // A board nothing reached counts none, and never throws for asking.
    expect(overtakenOn("press-page")).toBe(0);
    expect(overtakenKey("a", "b")).toBe("a.b");
    expect(overtakenFor("press-page", "nothing")).toBeUndefined();
  });

  /**
   * ★ THE GLOSS IS DERIVED, NOT LISTED. A board's spec is never edited by this
   * lane, so an option still labelled "as today" keeps its words; the badge
   * corrects them. Listing which asks need it would rot the first time a board
   * reworded an option, so the step reads the options and this proves the
   * detector fires on the real ones.
   */
  it("finds the options whose 'as today' now means something else", () => {
    const glossed = KEYS.filter((key) => {
      const [board, ask] = key.split(".");
      const options = askOf(board, ask)?.options ?? [];
      return options.some(
        (o) => saysAsToday(optionLabel(o)) || saysAsToday(optionMeans(o)),
      );
    });
    // Two thirds of these questions were drawn with a baseline that has moved.
    expect(glossed.length).toBeGreaterThanOrEqual(15);
    expect(glossed).toContain("first-event.hand");
    expect(glossed).toContain("media-viewer.opening");
    // And the gloss says which way to read them.
    expect(AS_TODAY_GLOSS).toContain("before that ruling");
    expect(saysAsToday("The dark room, as today")).toBe(true);
    expect(saysAsToday("A sheet, the album still lit above it")).toBe(false);
    expect(saysAsToday(undefined)).toBe(false);
  });

  /**
   * ★ THE OUTCOME IS THE LEDGER'S, JOINED HERE, NEVER STORED. His contract:
   * answering an overtaken question IS the new ruling; the reserved word says
   * the earlier one holds. "Not clear to me" is neither, so it reads as open,
   * exactly as it does everywhere else on the desk.
   */
  it("derives what became of an overtaken ask from the ledger alone", () => {
    expect(outcomeOf(undefined)).toBe("open");
    expect(outcomeOf(null)).toBe("open");
    expect(outcomeOf("")).toBe("open");
    expect(outcomeOf("?")).toBe("open");
    expect(outcomeOf(STANDS)).toBe("stood");
    expect(outcomeOf("sheet")).toBe("overrode");
  });

  it("names the reserved word and the words that ride with it", () => {
    expect(STANDS).toBe("stands");
    expect(STANDS_NOTE).toBe("the earlier ruling stands");
    // The reserved word may never collide with a real option of a badged ask,
    // or a board could shadow the answer that stands by its own ruling.
    for (const key of KEYS) {
      const [board, ask] = key.split(".");
      const ids = (askOf(board, ask)?.options ?? []).map((o) =>
        typeof o === "string" ? o : o.id,
      );
      expect(ids, `${key} declares an option called "${STANDS}"`).not.toContain(
        STANDS,
      );
    }
  });
});
