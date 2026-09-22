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
 * 2026-09-20). Four of `guest-verify`'s answers were recorded and HELD on his
 * own "May have to relitigate", so a question one of them reaches carries the
 * hold and the clause he wrote, and nothing the lane thinks: weighing an
 * option against a ruling that may not survive is precisely what the hold
 * refuses. These never concede, never append, and the badge says "held" in its
 * first word so the walk cannot read one as law. A hold ends three ways, and
 * all three have now happened: round two rules; he answers the question the
 * hold was badging, which retires the badge with the ask (`badge=mark` on
 * `seed-avatar.look`, spent by `look=mesh`; `gate=after` on
 * `first-event.first`, spent by `first=live`); or his own next shape
 * supersedes the held ruling outright, which is what `address=none` did to all
 * four of them on 2026-09-21 (overtaken.ts, the HELD note). The map carries no
 * hold today, so the grammar is proven below on the note the last one wrote
 * rather than on a live entry.
 *
 * ★ AND THE MECHANISM OUTLIVES THE ENTRIES (the overtaken audit and the
 * identity reshape, 2026-09-21). Will asked for every badged question to be
 * reshaped into a current one with its context folded in and the badge deleted;
 * five lanes empty this map between them, and the file, its type, this test and
 * the desk's badge stay as the mechanism for the next overlap (which the
 * stacking rule, PROGRAM.md, exists to avoid needing). So nothing below is a
 * CENSUS. Every assertion is either a per-entry invariant, exact while entries
 * remain and vacuous when they are gone, or a grammar proved on a constructed
 * note, which the HELD block already did before this was a general rule. A
 * floor like "thirty-one lines carry two clauses" was a true sentence about one
 * afternoon, not a fact about the mechanism, and it would fail the day the
 * audit landed while proving nothing on the day it passed.
 *
 * It IS a published contract now (the marker on line one): the collector
 * indexes every file a marker names, an indexed file owes a `for` line in
 * `rules/component-notes.ts`, and overtaken.ts has had one since the mechanism
 * landed. So a change here moves the Library, and `pnpm design:rules` belongs
 * in the same commit.
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
  // Not a board: Will's own project, ruled in chat ("the reel,
  // reconceived", 2026-09-22), the first chat ruling to badge standing asks
  // rather than reshape them, because the boards it reaches are his to walk next.
  "reel-round",
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
   * find the words without asking anybody.
   */
  it("appends a later ruling behind the first, named and dated", () => {
    // The grammar on a constructed note, so it outlives the entries: two
    // rulings landing on one judgment, the first left exactly as written.
    const twice: OvertakenNote = {
      by: "app-shape",
      since: "app-shape r1, 19 Sep",
      ruling: "the event page is one page with its own header, not a tab strip",
      line: `stands: the option still buys a way back to the list.${ALSO_REACHED}glass r2, 20 Sep: and the header it sits under is one material now.`,
    };
    expect(judgment(twice.line)).toMatch(/^(stands|concedes): .+\.$/);
    expect(clausesOf(twice.line)).toHaveLength(1);
    expect(clausesOf(twice.line)[0]).toMatch(
      /^[a-z-]+ r\d+, \d{1,2} \w{3}: .+\.$/,
    );

    const appended = Object.entries(OVERTAKEN).filter(([, n]) =>
      n.line.includes(ALSO_REACHED),
    );
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
    // The tallest stack the map actually carries is read off it, never
    // asserted at a number a pass happened to build: a line deeper than any
    // pass has built is a lane rewriting history in place, and an empty map
    // is a map the audit has finished with.
    const deepest = Math.max(
      0,
      ...appended.map(([, n]) => clausesOf(n.line).length),
    );
    expect(deepest, "no line is deeper than a pass has built").toBeLessThanOrEqual(
      MAX_CLAUSES,
    );
  });

  it("reads a concession off the line it is written on", () => {
    // Read off the line and nothing else, which is why it is proved on two
    // constructed ones as well as on whatever the map is carrying today.
    const base = { by: "glass", since: "glass r1, 19 Sep", ruling: "one material" };
    expect(concedes({ ...base, line: "concedes: the ruling covers it." })).toBe(
      true,
    );
    expect(concedes({ ...base, line: "stands: it may still beat it." })).toBe(
      false,
    );
    for (const note of Object.values(OVERTAKEN)) {
      expect(concedes(note)).toBe(note.line.startsWith("concedes:"));
    }
  });

  it("speaks the badge in plain words with the date", () => {
    // The example was guest-shape.dialogs until round two replaced that ask,
    // then first-event.hand, then media-viewer.opening, each retiring with the
    // board it was named on. It is DERIVED now for the same reason the desk's
    // queue test derives its board (overtaken-5): a badge the map still carries
    // if there is one, and the shape proved on a constructed note either way,
    // because the audit takes the last real one with it.
    const shaped = (note: OvertakenNote) => {
      const text = badgeText(note);
      expect(text).toMatch(/^Ruled since [a-z-]+ r\d, \d{1,2} [A-Z][a-z]{2}: /);
      // Plain words, never the paste clause.
      expect(text).not.toMatch(/[a-z-]+=[a-z-]+/);
    };
    shaped({
      by: "app-vocabulary",
      since: "app-vocabulary r2, 20 Sep",
      ruling: "one View menu holds the gallery's verbs behind a single button",
      line: "stands: the menu is where a size would live, not whether it has one.",
    });
    const live = Object.values(OVERTAKEN).find((n) => !isHeld(n));
    if (live) shaped(live);
  });

  /**
   * ★ COUNTED AGAINST THE MAP, NEVER AGAINST A MEMORY OF IT. This block used
   * to pin `admin-triage` at eight and `press-page` at two, with a row of
   * retired boards at zero. Every one of those numbers was a fact about one
   * afternoon: five of the zeros arrived because a board retired, and the audit
   * (2026-09-21) sends the rest of them to zero on Will's own cleanup. So the
   * counter is proved against the keys it counts, which is the only thing it
   * claims to do, and the zero cases stay because they are the interesting
   * ones: a board may go back to nothing, and asking about a board nobody drew
   * must never throw.
   */
  it("counts a board's overtaken asks for the desk", () => {
    for (const board of BOARDS) {
      const mine = KEYS.filter((k) => k.startsWith(`${board.id}.`));
      expect(overtakenOn(board.id), `${board.id}`).toBe(mine.length);
    }
    // Every key the map holds belongs to a board it counts, so no entry can
    // hide from the desk behind a spelling.
    expect(
      BOARDS.reduce((n, b) => n + overtakenOn(b.id), 0),
      "every key is counted on some standing board",
    ).toBe(KEYS.length);
    // A retired board counts none: its badges left with the asks they named
    // (app-vocabulary, toasts, seed-avatar, app-pricing, first-event,
    // guest-upload, and guest-verify with the identity reshape).
    expect(overtakenOn("guest-verify")).toBe(0);
    expect(overtakenOn("first-event")).toBe(0);
    expect(overtakenOn("guest-upload")).toBe(0);
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
    // The detector fires on the real ones while there are real ones to fire
    // on. The floor used to be forty, which held from the first pass until the
    // audit began deleting badges on Will's cleanup; what it was ever proving
    // is that the reading works on a live board's own options, and that is
    // true of one entry as of forty.
    if (KEYS.length > 0) expect(glossed.length).toBeGreaterThan(0);
    for (const key of glossed) expect(KEYS).toContain(key);
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
