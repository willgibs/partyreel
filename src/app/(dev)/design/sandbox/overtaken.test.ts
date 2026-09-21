// @contract-for: src/app/(dev)/design/sandbox/overtaken.ts
import { describe, expect, it } from "vitest";

import { optionLabel, optionMeans } from "@/components/lab/board-spec";

import {
  ALSO_REACHED,
  AS_TODAY_GLOSS,
  badgeText,
  concedes,
  HELD,
  isHeld,
  OVERTAKEN,
  outcomeOf,
  overtakenFor,
  overtakenKey,
  overtakenOn,
  type OvertakenNote,
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
 * grew into a paragraph is a redraw wearing a badge's clothes. A LATER ruling
 * reaching the same question appends one clause behind `ALSO_REACHED` rather
 * than rewriting the earlier pass's judgment, so the cap is read on the
 * judgment and again on every clause behind it.
 *
 * ★ AND THE THIRD GRAMMAR IS NO JUDGMENT AT ALL (the closing sitting,
 * 2026-09-20). Four of `guest-verify`'s answers are recorded and HELD on his
 * own "May have to relitigate", so a question one of them reaches carries the
 * hold and the clause he wrote, and nothing the lane thinks: weighing an
 * option against a ruling that may not survive is precisely what the hold
 * refuses. These never concede, never append, and the badge says "held" in its
 * first word so the walk cannot read one as law. A hold ends one of two ways,
 * and the second arrived the same night: round two rules, or he answers the
 * question the hold was badging, which retires the badge with the ask
 * (`badge=mark` on `seed-avatar.look`, spent by `look=mesh`; then `gate=after`
 * on `first-event.first`, spent by `first=live` in the third batch). Both holds
 * ended the second way, so the map carries none today and the grammar is proven
 * below on the note the last one wrote rather than on a live entry.
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
  "guest-verify",
  "app-vocabulary",
  "seed-avatar",
  "admin",
  "app-door",
  "demo-event",
  "pricing-page",
  "app-pricing",
  "first-event",
  "guest-upload",
];
/** One line, readable at a glance on the way past a question. */
const LINE_CAP = 160;
/** Each appended clause, held to the same glance as the judgment it rides on. */
const CLAUSE_CAP = 150;
/**
 * ★ ONE CLAUSE PER PASS, so counting the clauses counts the rounds of rulings
 * that have landed on a judgment since it was written. Four passes have now
 * appended (the sixth batch's, and the closing sitting's three).
 *
 * ★ AND THE CAP IS A MEASUREMENT, NOT A COUNT OF PASSES. It read "three passes,
 * so three" until the fifth, which appended to thirty-one lines and raised
 * nothing: the only two lines that had ever carried three clauses were
 * `first-event`'s, and they retired with the board rather than taking a fourth.
 * The cap rises when a pass appends BEHIND three, never merely because it is
 * the next one to run, so it is read off the map here rather than assumed. A
 * line carrying more than the tallest a pass has actually built is a lane
 * rewriting history in place.
 */
const MAX_CLAUSES = 3;

const askOf = (board: string, ask: string) =>
  BOARDS.find((b) => b.id === board)?.asks.find((a) => a.id === ask);

/** The judgment the first pass wrote, with any appended clause taken off. */
const judgment = (line: string) => line.split(ALSO_REACHED)[0];
/** The clauses later passes appended, in the order the rulings landed. */
const clausesOf = (line: string) => line.split(ALSO_REACHED).slice(1);

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

  it("holds every judgment to one line, in the two words or the hold", () => {
    for (const [key, note] of Object.entries(OVERTAKEN)) {
      expect(
        note.line,
        `${key}: a line says "stands:", "concedes:" or the hold, nothing else`,
      ).toMatch(new RegExp(`^(stands: |concedes: |${HELD})`));
      expect(note.line, `${key}: a line is one line`).not.toContain("\n");
      const first = judgment(note.line);
      expect(
        first.length,
        `${key}: ${first.length} characters is a paragraph, not a line`,
      ).toBeLessThanOrEqual(LINE_CAP);
      for (const clause of clausesOf(note.line)) {
        expect(
          clause.length,
          `${key}: an appended clause of ${clause.length} characters`,
        ).toBeLessThanOrEqual(CLAUSE_CAP);
      }
      // No em-dashes anywhere a reviewer reads (the copy policy).
      expect(`${note.line} ${note.ruling} ${note.since}`).not.toContain("—");
    }
  });

  /**
   * ★ A HELD RULING IS RECORDED, NEVER WEIGHED (the closing sitting,
   * 2026-09-20). Will held four of `guest-verify` round one's answers on his
   * own "May have to relitigate", so a question one of them reaches gets the
   * fact and no judgment: the hold, and the clause he wrote, so round two can
   * relitigate it without a lane's opinion already leaning on the walk. A held
   * badge therefore never concedes (the dock's third button stays unprimed)
   * and never carries an appended clause, because a clause rides inside a
   * judgment and there is none.
   */
  it("weighs nothing against a ruling he may relitigate", () => {
    const held = Object.entries(OVERTAKEN).filter(([, n]) => isHeld(n));
    // Two the night they were written, then none: he answered both questions
    // his holds had badged (`seed-avatar.look=mesh` in the second batch,
    // `first-event.first=live` in the third), and each badge retired with the
    // ask it named. Round two never lifted either one.
    expect(held.length, "every hold was spent by an answer of his").toBe(0);
    // So the shape is proven on the last hold this file carried, verbatim: the
    // grammar has to outlive the entries, because `guest-verify`'s four
    // rulings are still held and the next question one of them reaches is
    // badged this way and no other.
    const spent: OvertakenNote = {
      by: "guest-verify",
      since: "guest-verify r1, 20 Sep",
      ruling:
        "a guest's photograph goes live at once, wearing an unconfirmed mark until the code is typed",
      line: `${HELD}gate=after`,
    };
    expect(isHeld(spent), "the hold is read off the line's first word").toBe(
      true,
    );
    // The clause he wrote, verbatim, and nothing after it.
    expect(spent.line, "the hold names his own clause").toMatch(
      new RegExp(`^${HELD}[a-z-]+=[a-z-]+$`),
    );
    expect(concedes(spent), "a hold never concedes").toBe(false);
    expect(
      spent.line.includes(ALSO_REACHED),
      "a hold carries no appended clause",
    ).toBe(false);
    expect(
      badgeText(spent),
      'the badge says "held" before anything else',
    ).toMatch(/^Ruled and held since guest-verify r1, /);
    // And no live entry may wear the words without being counted as one.
    for (const [key, note] of Object.entries(OVERTAKEN)) {
      expect(
        note.line.includes(HELD),
        `${key}: a hold is the whole line or nothing`,
      ).toBe(isHeld(note));
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
  it("appends a later ruling behind the first, named and dated", () => {
    const appended = Object.entries(OVERTAKEN).filter(([, n]) =>
      n.line.includes(ALSO_REACHED),
    );
    expect(
      appended.length,
      "later batches reached questions an earlier pass had badged",
    ).toBeGreaterThan(0);
    for (const [key, note] of appended) {
      const clauses = clausesOf(note.line);
      expect(
        clauses.length,
        `${key}: ${clauses.length} clauses, one per pass that appended`,
      ).toBeLessThanOrEqual(MAX_CLAUSES);
      for (const clause of clauses) {
        const [board] = clause.split(" ");
        expect(
          RULED.includes(board),
          `${key}: "${board}" is not a board whose ruling landed`,
        ).toBe(true);
        expect(
          board,
          `${key}: a board cannot overtake its own question, twice over`,
        ).not.toBe(key.split(".")[0]);
        expect(clause, `${key}: the clause names a round and a date`).toMatch(
          /^[a-z-]+ r\d+, \d{1,2} \w{3}: .+\.$/,
        );
      }
      // The earlier pass's judgment is left exactly as it was written.
      expect(judgment(note.line)).toMatch(/^(stands|concedes): .+\.$/);
    }
    // Each pass has appended behind the clauses the last one left.
    expect(
      appended.filter(([, n]) => clausesOf(n.line).length === 2).length,
      "a third ruling reached questions two had already reached",
    ).toBeGreaterThan(0);
    expect(
      appended.filter(([, n]) => clausesOf(n.line).length === 3).length,
      "a fourth ruling reached questions three had already reached",
    ).toBeGreaterThan(0);
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
    // ★ THE EXAMPLE IS DERIVED, NOT NAMED. It was guest-shape.dialogs until
    // round two replaced that ask, then first-event.hand until his answers
    // retired that board, then media-viewer.opening until the overtaken audit
    // folded that badge into its own question (2026-09-21). Three rewrites of
    // one line by three lanes that had no business in this file is enough: the
    // reading is taken off the first LIVE entry, and where the audit has
    // emptied the map it is proven on a literal, exactly as the hold above is.
    // The grammar has to outlive the entries.
    const live = Object.values(OVERTAKEN)[0];
    const note: OvertakenNote = live ?? {
      by: "glass",
      since: "glass r1, 19 Sep",
      ruling: "the album sits blurred at half brightness behind the lightbox",
      line: "stands: the ruling fixes the ground behind a photograph, never the way a photograph opens onto it.",
    };
    const text = badgeText(note);
    expect(text).toMatch(/^Ruled since [a-z-]+ r\d, \d{1,2} [A-Z][a-z]{2}: /);
    expect(text).not.toMatch(/[a-z-]+=[a-z-]+/); // plain words, never the paste clause
  });

  it("counts a board's overtaken asks for the desk", () => {
    // Seven until he answered all eight in one paste (the closing sitting's
    // third batch): six badges his own answers overrode, and the seventh the
    // last HELD one in the file, all gone with the asks they named. The board
    // retires at `first-event-wiring`, and the desk's queue test, which proved
    // its join on this board by name, now derives the board it proves on from
    // this map (overtaken-5's one exception line).
    expect(overtakenOn("first-event")).toBe(0);
    // The second board of the same paste, and the only one this map ever held
    // with no unreached ask at all: eight badges, eight answers, none left.
    expect(overtakenOn("guest-upload")).toBe(0);
    // Round one's five badges retired with the asks they named (album-controls,
    // 2026-09-20): the board's round two is too new for anything to overtake yet.
    expect(overtakenOn("app-vocabulary")).toBe(0);
    // Ruled whole and wired (toasts-wiring, 2026-09-20): its two badges
    // retired with the board itself, the same convention as app-vocabulary
    // above (a badge pointing at a question nobody is asking any more is
    // worse than an answer left orphaned).
    expect(overtakenOn("toasts")).toBe(0);
    // Its one badge retired with the ask when he answered `look` outright
    // (the closing sitting's second batch), and the board retires at its
    // wiring: the same convention as app-vocabulary and toasts above.
    expect(overtakenOn("seed-avatar")).toBe(0);
    // The board a batch answered whole: six badges, all six overridden by his
    // own answers, all six gone with the asks.
    expect(overtakenOn("app-pricing")).toBe(0);
    // The sixth batch ruled the portal's whole shell, one board over.
    expect(overtakenOn("admin-triage")).toBe(8);
    // The desk's last board, reached for the first time by the closing
    // sitting's second batch and again by its third; it was the example of a
    // board nothing had reached, which is why the zero case moved to a made-up
    // id. The retired boards above are the real zeros now, and they are the
    // stronger case: a board may go back to nothing.
    expect(overtakenOn("press-page")).toBe(2);
    // A board nothing reached counts none, and never throws for asking.
    expect(overtakenOn("a-board-nobody-drew")).toBe(0);
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
    // ★ A PROPORTION READ OFF THE MAP, NEVER A CENSUS OF A MAP THAT HAS GONE.
    // This was a floor of forty keys, measured when the map held seventy, and
    // it named two of them by id. The overtaken audit (2026-09-21) is emptying
    // the map a board at a time, folding each badge into the question it
    // annotated, so a fixed count and a named key both fail on whichever lane
    // happens to cross them, in a file no lane owns. What stays true is the
    // proportion: most of what a badge reaches was drawn against a baseline
    // that has since moved. Held to half, and skipped once the map is too
    // small to measure, which is where the audit is walking this file.
    if (KEYS.length >= 10) {
      expect(glossed.length * 2).toBeGreaterThanOrEqual(KEYS.length);
    }
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
