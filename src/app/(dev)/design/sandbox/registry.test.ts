import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  anchorFor,
  type Ask,
  type BoardSpec,
  LIMITS,
  optionCosts,
  optionGains,
  optionId,
  optionLabel,
  optionMeans,
} from "@/components/lab/board-spec";
import { RESERVED_PARAMS } from "@/components/lab/board-state";
import { askTexts, openingTexts, termsIn } from "@/components/lab/terms";

import { ITEMS_STEP } from "@/app/(dev)/design/(shell)/lab/_desk/step-id";

import {
  BOARD_FOLDERS,
  BOARDS,
  boardSpec,
  SPEC_EXPORTS,
  SPECS,
} from "./registry";

// The catalog's entry ids, read the way lab:review reads them (gallery.test.ts
// holds that reader to the TypeScript parse of the same files).
const { readLibraryEntries } =
  (await import("../../../../../scripts/lab-review.mjs")) as {
    readLibraryEntries: (root: string) => Set<string> | null;
  };

/**
 * THE BOARD REGISTRY'S CONTRACT.
 *
 * Two jobs, and both are about keeping a board reviewable rather than about how
 * one looks:
 *
 * 1. A SPEC IS PURE DATA. `registry.ts` is imported by a SERVER page (the board
 *    route reads the question for its header) and by node tests, so a spec that
 *    reaches for React, a stylesheet or its own board would drag a client tree
 *    into a server render and a stylesheet into a node process. The board's
 *    components live in `board.tsx` and the registry never touches that file.
 * 2. THE DENSITY DISCIPLINE IS ENFORCED, NOT REQUESTED. Every long board's
 *    failure mode is the same: the author knows too much and the reviewer reads
 *    none of it. `LIMITS` caps each string the template renders above the fold,
 *    and a board that wants more room has to say less, which is the point.
 */
const ROOT = process.cwd();
const SANDBOX = "src/app/(dev)/design/sandbox";

describe("the board registry", () => {
  it("holds a unique, directory-backed id for every spec", () => {
    const ids = BOARDS.map((b) => b.id);
    expect(new Set(ids).size, "duplicate board id").toBe(ids.length);
    for (const id of ids) {
      const dir = join(ROOT, SANDBOX, id);
      expect(
        statSync(dir).isDirectory(),
        `${id} has no sandbox directory`,
      ).toBe(true);
    }
  });

  it("finds a board by id and nothing by a missing one", () => {
    for (const b of BOARDS) expect(boardSpec(b.id)?.id).toBe(b.id);
    expect(boardSpec("not-a-board")).toBeUndefined();
  });

  it("keeps every spec free of React, CSS and its own board", () => {
    for (const b of BOARDS) {
      const src = readFileSync(join(ROOT, SANDBOX, b.id, "spec.ts"), "utf8");
      const imports = [...src.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]);
      for (const i of imports) {
        expect(i, `${b.id}/spec.ts imports React`).not.toMatch(/^react/);
        expect(i, `${b.id}/spec.ts imports a stylesheet`).not.toMatch(/\.css$/);
        expect(i, `${b.id}/spec.ts imports its board`).not.toMatch(/board$/);
      }
      // A named type argument (`Candidate<SectionId>`) reads to this
      // heuristic exactly like an opening tag, so a spec writes its section
      // union inline (`Candidate<"catalog" | "pages">`), which opens with `<"`.
      expect(
        src,
        `${b.id}/spec.ts has JSX (or a named type argument: write the union inline)`,
      ).not.toMatch(/<[A-Z][A-Za-z]*[\s/>]/);
    }
  });

  it("holds every string inside its limit", () => {
    const under = (what: string, value: string | undefined, cap: number) => {
      if (value === undefined) return;
      expect(
        value.length,
        `${what} is ${value.length}, over ${cap}`,
      ).toBeLessThanOrEqual(cap);
    };
    for (const b of BOARDS) {
      under(`${b.id}.question`, b.question, LIMITS.question);
      under(`${b.id}.context`, b.context, LIMITS.context);
      under(`${b.id}.round.changed`, b.round.changed, LIMITS.roundChanged);
      under(
        `${b.id}.verdict.recommendation`,
        b.verdict.recommendation,
        LIMITS.recommendation,
      );
      under(`${b.id}.verdict.because`, b.verdict.because, LIMITS.because);
      under(`${b.id}.verdict.overrule`, b.verdict.overrule, LIMITS.overrule);
      for (const a of b.asks) {
        under(`${b.id}.ask ${a.id}`, a.question, LIMITS.askQuestion);
        under(`${b.id}.ask ${a.id}.context`, a.context, LIMITS.askContext);
        under(`${b.id}.ask ${a.id}.look`, a.look, LIMITS.askLook);
        under(`${b.id}.ask ${a.id}.because`, a.because, LIMITS.askBecause);
        under(`${b.id}.ask ${a.id}.overrule`, a.overrule, LIMITS.askOverrule);
        under(`${b.id}.ask ${a.id}.lands`, a.lands, LIMITS.askLands);
        for (const o of a.options) {
          under(
            `${b.id}.ask ${a.id}.option ${optionId(o)}.label`,
            optionLabel(o),
            LIMITS.optionLabel,
          );
          under(
            `${b.id}.ask ${a.id}.option ${optionId(o)}.means`,
            optionMeans(o),
            LIMITS.optionMeans,
          );
        }
      }
      for (const c of b.candidates) {
        under(`${b.id}.candidate ${c.id}`, c.rationale, LIMITS.rationale);
        // The card's one line is the whole reading on a catalog grid: past
        // this it wraps to four lines and twelve cards become a wall.
        under(`${b.id}.candidate ${c.id}.one`, c.one, LIMITS.candidateOne);
        under(
          `${b.id}.candidate ${c.id}.lands`,
          c.lands,
          LIMITS.candidateLands,
        );
      }
      for (const c of b.carried ?? []) {
        under(`${b.id}.call ${c.id}`, c.question, LIMITS.carriedQuestion);
        under(`${b.id}.call ${c.id}.taken`, c.taken, LIMITS.carriedTaken);
        under(
          `${b.id}.call ${c.id}.overrule`,
          c.overrule,
          LIMITS.carriedOverrule,
        );
        expect(c.id).toMatch(/^[a-z][a-z0-9-]*$/);
      }
      for (const d of [
        ...b.departures,
        ...b.candidates.flatMap((c) => c.departures ?? []),
      ]) {
        under(`${b.id}.departure ${d.id}`, d.text, LIMITS.departure);
      }
      for (const s of b.sections) {
        under(`${b.id}.section ${s.id}.title`, s.title, LIMITS.title);
        under(`${b.id}.section ${s.id}.lede`, s.lede, LIMITS.lede);
        for (const p of s.argument ?? [])
          under(`${b.id}.${s.id}.argument`, p, LIMITS.argument);
        for (const p of s.wiring ?? [])
          under(`${b.id}.${s.id}.wiring`, p, LIMITS.argument);
      }
      for (const n of b.notes ?? []) under(`${b.id}.note`, n.text, LIMITS.note);
      for (const l of b.lookFirst ?? [])
        under(`${b.id}.walk`, l.note, LIMITS.note);
    }
  });

  it("links a kept card only to a catalog entry that exists", () => {
    // The card's "now in the Library" link renders whenever `library` is set,
    // so a stale or mistyped id would be a link into a 404.
    const ids = readLibraryEntries(process.cwd()) ?? new Set<string>();
    for (const b of BOARDS)
      for (const c of b.candidates)
        if (c.library)
          expect(ids.has(c.library), `${b.id}.${c.id}: ${c.library}`).toBe(
            true,
          );
  });

  it("points every ask, note and walk step at a section that exists", () => {
    for (const b of BOARDS) {
      const ids = new Set(b.sections.map((s) => s.id));
      expect(b.sections.length, `${b.id} has no sections`).toBeGreaterThan(0);
      for (const a of b.asks) {
        expect(
          ids.has(a.evidence),
          `${b.id}: ask ${a.id} points at ${a.evidence}`,
        ).toBe(true);
        const optionIds = a.options.map(optionId);
        expect(
          optionIds,
          `${b.id}: ask ${a.id} does not offer its recommendation`,
        ).toContain(a.recommended);
        expect(
          new Set(optionIds).size,
          `${b.id}: ask ${a.id} repeats an option id`,
        ).toBe(optionIds.length);
        for (const o of optionIds) {
          expect(o, `${b.id}: option "${o}" is not one token`).toMatch(
            /^[a-z0-9][a-z0-9-]*$/i,
          );
          // "?" is the reviewer's own answer ("not clear to me"); an option
          // can never be spelled that way, or the ledger could not tell them apart.
          expect(o).not.toBe("?");
        }
      }
      const askIds = b.asks.map((a) => a.id);
      expect(new Set(askIds).size, `${b.id} has a duplicate ask id`).toBe(
        askIds.length,
      );
      // A catalog's step is `<board>.items`, so an ask spelled that way would
      // resolve to the wrong step and lose a reader's place silently.
      expect(
        askIds,
        `${b.id}: "${ITEMS_STEP}" is the catalog's own step id, so no ask may use it`,
      ).not.toContain(ITEMS_STEP);
      for (const n of b.notes ?? []) {
        expect(
          ids.has(n.section),
          `${b.id}: a note points at ${n.section}`,
        ).toBe(true);
      }
      for (const l of b.lookFirst ?? []) {
        expect(
          ids.has(l.section),
          `${b.id}: a walk step points at ${l.section}`,
        ).toBe(true);
      }
    }
  });

  it("declares every state a note or a walk step asks for", () => {
    for (const b of BOARDS) {
      const controls = new Map((b.controls ?? []).map((c) => [c.id, c]));
      const check = (
        state: Partial<Record<string, string>> | undefined,
        where: string,
      ) => {
        for (const [k, v] of Object.entries(state ?? {})) {
          const c = controls.get(k);
          expect(
            c,
            `${b.id}: ${where} sets undeclared control "${k}"`,
          ).toBeTruthy();
          expect(
            c!.options.map((o) => o.id),
            `${b.id}: ${where} sets ${k}=${v}`,
          ).toContain(v);
        }
      };
      for (const n of b.notes ?? []) check(n.state, `the note on ${n.section}`);
      for (const l of b.lookFirst ?? [])
        check(l.state, `the walk step at ${l.section}`);
      for (const a of b.asks) {
        check(a.state, `the ask ${a.id}`);
        for (const o of a.options) {
          if (typeof o === "object" && o.state)
            check(o.state, `option ${o.id} of ask ${a.id}`);
        }
        for (const id of a.strip ?? []) {
          expect(
            controls.get(id),
            `${b.id}: ask ${a.id} puts undeclared control "${id}" on its strip`,
          ).toBeTruthy();
        }
        if (a.control !== undefined) {
          const c = controls.get(a.control);
          expect(
            c,
            `${b.id}: ask ${a.id} mirrors undeclared control "${a.control}"`,
          ).toBeTruthy();
          // The pick IS the preview: the card sets the control to the option
          // picked, which only works when the two id sets are the same set.
          // A clearable control's default is "nothing picked", never a choice.
          // A pick-one catalog's winner ask may offer the cleared default too,
          // as "None of these" (the stepped review, 2026-09-16): choosing it
          // clears the board, which is the right preview of "none".
          const all = c!.options.map((o) => o.id).sort();
          const mirrored = all.filter(
            (id) => !(c!.clearable && id === c!.default),
          );
          const offered = [...a.options.map(optionId)].sort();
          expect(
            offered.join() === mirrored.join() || offered.join() === all.join(),
            `${b.id}: ask ${a.id} mirrors ${a.control} but their option ids differ`,
          ).toBe(true);
        }
      }
      for (const c of b.controls ?? []) {
        expect(
          c.options.map((o) => o.id),
          `${b.id}: ${c.id} defaults outside its options`,
        ).toContain(c.default);
        expect(
          RESERVED_PARAMS as readonly string[],
          `${b.id}: control "${c.id}" claims a reserved URL param`,
        ).not.toContain(c.id);
        // ★ A CONTROL ID BECOMES `data-<id>` ON THE BOARD ROOT (board-page.tsx),
        // and React refuses a camelCase custom attribute with a console error on
        // every render: `compareA` shipped one until it was caught live. Lower
        // case and hyphens, which is also what a URL param should look like.
        expect(
          c.id,
          `${b.id}: control "${c.id}" is not a lower-case data attribute name`,
        ).toMatch(/^[a-z][a-z0-9-]*$/);
      }
    }
  });

  it("registers every board that has a spec, and only those", () => {
    const onDisk = readdirSync(join(ROOT, SANDBOX))
      .filter((n) => {
        const p = join(ROOT, SANDBOX, n);
        return statSync(p).isDirectory() && readdirSync(p).includes("spec.ts");
      })
      .sort();
    expect(
      BOARDS.map((b) => b.id).sort(),
      "a spec.ts the registry does not find, or a board with no folder",
    ).toEqual(onDisk);
  });

  /**
   * ★ A BOARD PAST ROUND 1 HAS A REVIEW ON THE RECORD, because the round is a
   * loop: a board's next round is shaped by his answers to the last
   * (docs/PROGRAM.md "The round"), and a lane that deepens a board without them
   * does the cheapest work there is and the least useful. The scar: this was
   * prose until `brand-voice` reached round seven with no review recorded, six
   * voices deep and not one verdict, and was killed for it.
   *
   * Deliberately the weakest check that catches that: past round 1, SOME round
   * is on the record, not the previous one, because a board reviewed at r7
   * after a rebuild at r6 is fine. (The grandfather list that excused the four
   * boards already past round 1 when this landed went with its last entry,
   * reviewed 2026-09-18.)
   */
  it("has a review on the record before a board opens a second round", () => {
    for (const b of BOARDS) {
      if (b.round.n <= 1) continue;
      let rounds = 0;
      try {
        const led = JSON.parse(
          readFileSync(join(ROOT, "docs/reviews", `${b.id}.json`), "utf8"),
        ) as { rounds?: unknown[] };
        rounds = led.rounds?.length ?? 0;
      } catch {
        rounds = 0;
      }
      expect(
        rounds,
        `${b.id} is at round ${b.round.n} with no review in docs/reviews/${b.id}.json: a board's next round is shaped by his review of one before it`,
      ).toBeGreaterThan(0);
    }
  });

  /**
   * ★ AN ASK THAT DRAWS NOTHING SAYS SO (2026-09-17).
   *
   * A step's tiles are only PICTURES when the option carries a `state` of its
   * own or the ask mirrors a `control` (`drawable()` in `step.tsx`). Everything
   * else degrades to a text tile, which is legitimate - plenty of questions are
   * about a rule, a price or a plan rather than a look - but it is the format
   * Will has objected to since the beginning, and it must be a decision rather
   * than an oversight. Measured 2026-09-17: nine of twenty open steps had
   * nothing to press, and every one of them happened to carry a `look`. This
   * keeps that true.
   *
   * `look` is the author's sentence naming what separates the options and where
   * to find it, and the step renders it above the evidence. An ask that draws
   * nothing and explains nothing leaves a reviewer with a question and a wall.
   */
  it("makes an ask that cannot be drawn say what to look at instead", () => {
    let examined = 0;
    for (const b of BOARDS) {
      for (const a of b.asks) {
        examined++;
        const drawable = a.options.some(
          (o) => typeof o !== "string" && o.state !== undefined,
        );
        if (drawable || a.control) continue;
        expect(
          a.look?.trim(),
          `${b.id}.${a.id} draws no option (no option state, no mirrored control) and has no \`look\` saying what to compare`,
        ).toBeTruthy();
      }
    }
    // Not vacuous, and the count is of asks LOOKED AT rather than asks caught.
    // Counting the caught ones would fail on the day every board draws its
    // options, which is the day `defineExploration` has finished its job: an
    // exploration built question-first cannot produce an undrawable ask at all.
    expect(examined, "no ask reached the rule").toBeGreaterThan(0);
  });

  /**
   * A CATALOG'S OWN CONTRACT (the revamp, 2026-09-16). Declaring `catalog` is a
   * board asking for "a verdict on each card", and four things have to line up
   * for that to work at all: the grid has a section to live in, the Pick button
   * sets a control whose options ARE the cards, and the two compare controls
   * exist and start on different cards (or A and B open identical and the first
   * thing a reader sees is a comparison of a thing with itself).
   */
  it("wires every catalog to a section, a pick and two compare controls", () => {
    for (const b of BOARDS) {
      if (!b.catalog) continue;
      const ids = b.candidates.map((c) => c.id);
      expect(
        b.sections.map((s) => s.id),
        `${b.id}: the catalog points at section "${b.catalog.section}"`,
      ).toContain(b.catalog.section);
      expect(new Set(ids).size, `${b.id} repeats a candidate id`).toBe(
        ids.length,
      );
      for (const id of ids) {
        expect(id, `${b.id}: candidate "${id}" is not one token`).toMatch(
          /^[a-z0-9][a-z0-9-]*$/i,
        );
      }

      const controls = new Map((b.controls ?? []).map((c) => [c.id, c]));
      if (b.catalog.control !== undefined) {
        const pick = controls.get(b.catalog.control);
        expect(
          pick,
          `${b.id}: the catalog picks undeclared control "${b.catalog.control}"`,
        ).toBeTruthy();
        // A clearable control's default is "nothing picked", which is not a
        // card; every other option is one.
        const offered = pick!.options
          .map((o) => o.id)
          .filter((id) => !(pick!.clearable && id === pick!.default));
        expect(
          offered.sort(),
          `${b.id}: ${b.catalog.control}'s options are not the catalog's cards`,
        ).toEqual([...ids].sort());
      }

      if (b.catalog.compare !== undefined) {
        const [a, c] = b.catalog.compare;
        expect(a, `${b.id}: the two compare controls are the same`).not.toBe(c);
        for (const id of [a, c]) {
          const control = controls.get(id);
          expect(
            control,
            `${b.id}: the catalog compares undeclared control "${id}"`,
          ).toBeTruthy();
          expect(
            ids,
            `${b.id}: ${id} defaults to "${control!.default}", which is not a card`,
          ).toContain(control!.default);
        }
        expect(
          controls.get(a)!.default,
          `${b.id}: A and B open on the same card`,
        ).not.toBe(controls.get(c)!.default);
      }

      // The stepped review (2026-09-16): a pick-one catalog is decided by ONE
      // ask, which mirrors the pick control; a walk is a keep-any's choice; a
      // stage is a section. The winner ask usually offers "none" as well ("None
      // of these: new directions"), so a reviewer who wants none of the cards
      // can say so rather than crown the least wrong one. This test required it
      // of every pick-one catalog until 2026-09-29; that caught no bug (the
      // step draws the cards alone just as well, and draws "none" when it is
      // offered), so offering it is the board's call.
      const cat = b.catalog;
      if (cat.mode === "pick-one") {
        expect(
          cat.winner,
          `${b.id}: a pick-one catalog names no winner ask`,
        ).toBeTruthy();
        expect(
          cat.walk,
          `${b.id}: walk is for keep-any; pick-one is one gallery step`,
        ).toBeUndefined();
      }
      if (cat.winner !== undefined) {
        const w = b.asks.find((a) => a.id === cat.winner);
        expect(
          w,
          `${b.id}: the winner ask "${cat.winner}" is not declared`,
        ).toBeTruthy();
        expect(
          w!.control,
          `${b.id}: the winner ask ${cat.winner} must mirror the pick control`,
        ).toBe(cat.control);
      }
      if (cat.stage !== undefined) {
        expect(
          b.sections.map((s) => s.id),
          `${b.id}: the catalog's stage points at section "${cat.stage}"`,
        ).toContain(cat.stage);
      }
    }
  });

  /**
   * A STAGED ASK WAITS ON SOMETHING REAL (the stepped review, 2026-09-16): an
   * earlier ask of the same board (never itself, never a later one: the walk
   * is in spec order) and an option it offers, or a card of the board's own
   * catalog. Anything else would hide a question for ever.
   */
  it("stages an ask only after an earlier ask or a card of its own catalog", () => {
    for (const b of BOARDS) {
      b.asks.forEach((a, i) => {
        const after = a.after;
        if (!after) return;
        if ("ask" in after) {
          const j = b.asks.findIndex((x) => x.id === after.ask);
          expect(
            j,
            `${b.id}: ask ${a.id} waits on unknown ask "${after.ask}"`,
          ).toBeGreaterThanOrEqual(0);
          expect(
            j,
            `${b.id}: ask ${a.id} waits on itself or on a later ask`,
          ).toBeLessThan(i);
          if (after.option !== undefined)
            expect(
              b.asks[j].options.map(optionId),
              `${b.id}: ask ${a.id} waits on an option ${after.ask} does not offer`,
            ).toContain(after.option);
        } else {
          expect(
            b.catalog,
            `${b.id}: ask ${a.id} waits on a card but the board has no catalog`,
          ).toBeTruthy();
          expect(
            b.candidates.map((c) => c.id),
            `${b.id}: ask ${a.id} waits on unknown card "${after.item}"`,
          ).toContain(after.item);
        }
      });
    }
  });

  it("computes one anchor everywhere", () => {
    // A made-up id on purpose: anchorFor is pure, and a standing board's id
    // (light, then rounding) had to be re-pointed at every retirement.
    expect(anchorFor("some-board", "composer")).toBe("some-board-composer");
  });
});

/**
 * THE CLARITY RATCHET (Will, 2026-09-15: "it was tough to understand what I
 * was being asked for most of those questions... the more clearly you can ask
 * me questions, the more easily it is for me to respond"). A board on the
 * string form asks in tokens ("seam", "family", "lift") that a reviewer
 * cannot read away from the board's argument. A board off this list asks in
 * plain words: a real question, an option labelled in words with what it
 * means, and the context and the look that let a stranger answer.
 *
 * ★ THE LIST ONLY SHRINKS. The clarity wave deletes a board's line when its
 * asks are rewritten; a new board is written in plain words from the start.
 */
const PLAIN: readonly string[] = [];

describe("the asks, in plain words", () => {
  it("lists only standing boards as still on the string form", () => {
    const ids = new Set(BOARDS.map((b) => b.id));
    for (const id of PLAIN) {
      expect(ids.has(id), `PLAIN names "${id}", which is not a board`).toBe(
        true,
      );
    }
  });

  for (const b of BOARDS.filter((x) => !PLAIN.includes(x.id))) {
    it(`${b.id} asks every question in plain words`, () => {
      for (const a of b.asks) {
        expect(
          a.question.trim().endsWith("?"),
          `${b.id}: ask ${a.id} is a label, not a question: "${a.question}"`,
        ).toBe(true);
        expect(
          a.context && a.context.trim().length > 0,
          `${b.id}: ask ${a.id} carries no context`,
        ).toBeTruthy();
        // Where to look is the tiles themselves once every option is drawn
        // (a control mirror, or a state on every option), and then `look` is
        // optional (the stepped review, 2026-09-16).
        const drawn =
          a.control !== undefined ||
          a.options.every((o) => typeof o === "object" && o.state);
        if (!drawn)
          expect(
            a.look && a.look.trim().length > 0,
            `${b.id}: ask ${a.id} does not say where to look`,
          ).toBeTruthy();
        for (const o of a.options) {
          expect(
            typeof o,
            `${b.id}: ask ${a.id} still offers the bare token "${optionId(o)}"`,
          ).toBe("object");
          expect(
            optionLabel(o).trim().length,
            `${b.id}: option ${optionId(o)} has no label`,
          ).toBeGreaterThan(0);
          expect(
            optionLabel(o),
            `${b.id}: option ${optionId(o)} is labelled with its own token`,
          ).not.toBe(optionId(o));
        }
      }
    });
  }
});

/**
 * ★ A BOARD IS ONE FOLDER (the lab revamp, 2026-09-29). What three shared
 * lists held (touchpoints.ts's rows and `DESK_ORDER`, this registry's imports,
 * boards.ts's map), each board now says in its own `sandbox/<id>/`: the
 * registry finds its spec, the board route finds its board, and retiring it is
 * deleting the folder. These hold what those lists' tests held, each with its
 * reason, where a folder can break them.
 */
describe("a board is one folder", () => {
  it("names itself by its folder", () => {
    // The folder is how it is found and the id is what every ledger line and
    // URL names, so the two can never disagree.
    for (const folder of BOARD_FOLDERS)
      expect(
        BOARDS.filter((b) => b.id === folder).length,
        `sandbox/${folder}/spec.ts does not define the board "${folder}" (one spec per folder, its id the folder's name)`,
      ).toBe(1);
  });

  it("exports its spec and nothing else from spec.ts", () => {
    // The registry takes the folder's one export as the board, so a second
    // would be a board nobody meant, or a helper mistaken for one.
    for (const [folder, names] of Object.entries(SPEC_EXPORTS))
      expect(names, `sandbox/${folder}/spec.ts`).toHaveLength(1);
  });

  it("exports its board and nothing else from board.tsx", () => {
    // The route draws a folder's one export; with two it cannot tell which is
    // the board and answers 404.
    for (const b of BOARDS) {
      const file = join(ROOT, SANDBOX, b.id, "board.tsx");
      const src = readFileSync(file, "utf8");
      const exported = [
        ...src.matchAll(
          /^export\s+(?:default\s+)?(?:async\s+)?(?:function|const|class|let)\s+(\w+)|^export\s+default\s|^export\s*\{/gm,
        ),
      ];
      expect(exported.length, `sandbox/${b.id}/board.tsx`).toBe(1);
    }
  });

  it("carries nothing the scaffold left to write", () => {
    // `pnpm new-board` writes every line a board owes as a TODO, so a folder
    // is a board only once each is written; the failure is the list of what
    // is left, in the scaffold's own words.
    const left: string[] = [];
    for (const folder of BOARD_FOLDERS)
      for (const file of ["spec.ts", "board.tsx"]) {
        const lines = readFileSync(
          join(ROOT, SANDBOX, folder, file),
          "utf8",
        ).split("\n");
        lines.forEach((line, i) => {
          if (/\bTODO\b/.test(line))
            left.push(`${folder}/${file}:${i + 1} ${line.trim()}`);
        });
      }
    expect(left, "write what the scaffold left").toEqual([]);
  });

  it("carries its surface, its place on the desk and what it redraws", () => {
    // What a touchpoints.ts row said, in the board's own spec: the sidebar
    // groups by surface, the desk orders by place, and `lives` is where a
    // wiring lane's owns start (and what flags a board's open asks when a merge
    // changes it). `defineExploration` requires them; this holds the rest.
    for (const spec of SPECS) {
      expect(
        spec.surface,
        `${spec.id}/spec.ts declares no surface`,
      ).toBeTruthy();
      expect(
        Number.isFinite(spec.desk),
        `${spec.id}/spec.ts declares no desk place`,
      ).toBe(true);
      const lives = spec.lives ?? [];
      expect(
        lives.length,
        `${spec.id}/spec.ts: lives is empty`,
      ).toBeGreaterThan(0);
      expect(new Set(lives).size, `${spec.id}: lives repeats a path`).toBe(
        lives.length,
      );
    }
  });
});

/**
 * THE DESK'S ORDER IS BY LEVERAGE (Will, 2026-09-19: the earlier influence
 * first), and its one home is each board's own `desk` place: a board whose
 * answers change another's questions takes the smaller number. This holds that
 * the desk, the paging and every walk read that order and no other.
 */
describe("the desk's order", () => {
  it("is each board's own place, lower first, a tie in id order", () => {
    const sorted = [...BOARDS].sort(
      (a, b) => a.desk - b.desk || a.id.localeCompare(b.id),
    );
    expect(BOARDS.map((b) => b.id)).toEqual(sorted.map((b) => b.id));
  });
});

/**
 * ★ CONTEXT COMES BEFORE THE OPTIONS (Will, 2026-09-29, his biggest friction
 * in the lab: "sometimes a question hits me with such a specific question and
 * targeted terminology within a spot example without really introducing more
 * of the context around what's happening (or more pros and cons of the
 * different options) ... for some questions I'm just getting dropped off in
 * the middle of nowhere with no resources to help"; docs/PROGRAM.md "A round
 * returns DECISIONS").
 *
 * So an OPEN ask says where it happens (a breadcrumb), the state that brings
 * someone there, what it decides and why that matters; each option what it
 * gains and what it costs; the recommendation its reason; and a board with an
 * open ask opens with what it is about, what is settled and, past round one,
 * what he picked and said before. The caps keep each a line: the layer is the
 * ground a question stands on, never a second argument.
 *
 * ★ OPEN MEANS HIS WALK CAN REACH IT, the desk's own reading (`_desk/queue.ts`,
 * `stepBlocked`): an ask the ledger holds anything for in the board's current
 * round is not asked again this round (a "not clear to me" waits for the round
 * that rewrites it, and that round is written in this layer); one whose
 * prerequisite went the other way is moot; and one staged behind a "not clear
 * to me" waits with it. A staged ask whose prerequisite is simply unanswered
 * is open: its answer can land in the very sitting that reaches it.
 */
function heldNow(b: BoardSpec): Map<string, string | null> {
  try {
    const led = JSON.parse(
      readFileSync(join(ROOT, "docs/reviews", `${b.id}.json`), "utf8"),
    ) as {
      rounds?: {
        n: number;
        answers?: { ask: string; choice: string | null }[];
      }[];
    };
    const round = led.rounds?.find((r) => r.n === b.round.n);
    return new Map((round?.answers ?? []).map((a) => [a.ask, a.choice]));
  } catch {
    return new Map();
  }
}

const openAsks = (b: BoardSpec): Ask[] => {
  const held = heldNow(b);
  return b.asks.filter((a) => {
    if (held.has(a.id)) return false;
    const after = a.after;
    if (after && "ask" in after && held.has(after.ask)) {
      const decided = held.get(after.ask);
      if (decided === null) return false;
      if (after.option !== undefined && decided !== after.option) return false;
    }
    return true;
  });
};

/** One line, inside its cap, and not a paragraph wearing a line's length. */
const aLine = (what: string, value: string | undefined, cap: number) => {
  expect(value?.trim(), `${what} is missing`).toBeTruthy();
  expect(value!, `${what} is more than a line`).not.toMatch(/\n/);
  expect(
    value!.length,
    `${what} is ${value!.length} characters, over its ${cap}`,
  ).toBeLessThanOrEqual(cap);
};

describe("an open ask carries its context", () => {
  const open = BOARDS.map((b) => ({ b, asks: openAsks(b) })).filter(
    (x) => x.asks.length > 0,
  );

  for (const { b, asks } of open) {
    it(`${b.id} opens with what it is about, what is settled and what came before`, () => {
      aLine(`${b.id}.opening.about`, b.opening?.about, LIMITS.openingAbout);
      for (const line of [
        ...(b.opening?.settled ?? []),
        ...(b.opening?.earlier ?? []),
      ])
        aLine(
          `${b.id}.opening line "${line.slice(0, 40)}"`,
          line,
          LIMITS.openingLine,
        );
      // A board past round one answers what he said: the picks and notes
      // that shaped this round are part of the ground he stands on.
      if (b.round.n > 1)
        expect(
          b.opening?.earlier?.length ?? 0,
          `${b.id} is at round ${b.round.n}: its opening says what you picked and said before (opening.earlier)`,
        ).toBeGreaterThan(0);
    });

    for (const a of asks) {
      it(`${b.id}.${a.id} says where, when, what and why before its options`, () => {
        const where = a.where ?? [];
        expect(
          where.length,
          `${b.id}.${a.id}: where is a breadcrumb of two to four crumbs, the surface first`,
        ).toBeGreaterThanOrEqual(2);
        expect(where.length).toBeLessThanOrEqual(4);
        for (const crumb of where)
          aLine(`${b.id}.${a.id}.where "${crumb}"`, crumb, LIMITS.askWhere);
        aLine(`${b.id}.${a.id}.when`, a.when, LIMITS.askWhen);
        aLine(`${b.id}.${a.id}.lands`, a.lands, LIMITS.askLands);
        aLine(`${b.id}.${a.id}.matters`, a.matters, LIMITS.askMatters);
        aLine(`${b.id}.${a.id}.because`, a.because, LIMITS.askReason);
        for (const o of a.options) {
          const id = `${b.id}.${a.id}.${optionId(o)}`;
          aLine(`${id}.gains`, optionGains(o), LIMITS.optionGains);
          aLine(`${id}.costs`, optionCosts(o), LIMITS.optionCosts);
        }
      });
    }
  }

  /**
   * ★ A TERM THE BOARD COINS GETS ITS PLAIN MEANING WHERE IT APPEARS. The step
   * glosses every declared term its own words use and the opening the ones it
   * uses (`terms.ts`), so the rule a test can hold is that the list is real:
   * every term has a plain meaning a line long, and every term is said
   * somewhere on its board (a gloss for a word nobody uses is a word to read
   * for nothing). Naming a coinage is the author's part.
   */
  it("gives every term a plain meaning, and declares none its board never says", () => {
    for (const b of BOARDS) {
      const texts = [
        ...openingTexts(b.opening),
        ...b.asks.flatMap((a) =>
          askTexts({
            ...a,
            options: a.options.map((o) => ({
              label: optionLabel(o),
              means: optionMeans(o),
              gains: optionGains(o),
              costs: optionCosts(o),
            })),
          }),
        ),
      ];
      const said = termsIn(texts, b.terms);
      for (const t of b.terms ?? []) {
        aLine(`${b.id} term "${t.term}"`, t.term, LIMITS.term);
        aLine(`${b.id} term "${t.term}".means`, t.means, LIMITS.termMeans);
        expect(
          said.includes(t),
          `${b.id}: "${t.term}" is declared but neither an ask nor the opening says it`,
        ).toBe(true);
      }
      const names = (b.terms ?? []).map((t) => t.term.toLowerCase());
      expect(new Set(names).size, `${b.id} declares a term twice`).toBe(
        names.length,
      );
    }
  });
});
