import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  APP_BODY_PX,
  ASK_404,
  composePair,
  DEFAULT_PAIR,
  REAL_PAGES,
  REGISTER_CALL,
  SURFACE,
  type Pair,
  askOrdinal,
  ASKS,
  candidateCss,
  FIXES,
  fixes,
  fluid,
  HOOKS,
  LADDERS,
  ladderById,
  LAW_ONLY,
  moved,
  NO_ISLAND,
  optics,
  RECOMMENDED,
  RUNGS,
  STEPS,
  type Ladder,
  type StepId,
  type Surface,
  themeBlock,
  tokenTable,
  WALK,
} from "./ladders";

/**
 * The type-scale board's ladder laws, proven without a DOM.
 *
 * This is a BOARD's data contract, not a design rule: it exists so a candidate
 * cannot quietly stop being what its line on the board claims, and so today's
 * two documented faults stay documented while the board stands. It leaves with
 * the board when the ruling lands and the wiring round bakes the tokens.
 */

const CANDIDATES = LADDERS.filter((l) => l.id !== "today");
const surfaceOf = new Map<StepId, Surface>(STEPS.map((s) => [s.id, s.surface]));

/** A ladder's live steps on one surface at one end, smallest first. */
function rungsOf(ladder: Ladder, surface: Surface, end: "phone" | "desktop") {
  return STEPS.filter((s) => s.surface === surface)
    .filter((s) => ladder.steps[s.id] && ladder.aliases?.[s.id] === undefined)
    .map((s) => ({ id: s.id, ...ladder.steps[s.id]![end] }))
    .sort((a, b) => a.px - b.px);
}

describe("the step vocabulary", () => {
  it("gives every ladder an entry for every step", () => {
    for (const ladder of LADDERS) {
      for (const step of STEPS) {
        expect(ladder.steps).toHaveProperty(step.id);
      }
    }
  });

  it("names where each step lives in production", () => {
    for (const step of STEPS) {
      expect(step.where.length).toBeGreaterThan(10);
      expect(surfaceOf.get(step.id)).toBeDefined();
    }
  });
});

describe("the two faults the board is about", () => {
  // The whole reason this board exists: written out, today's phone end has
  // fewer distinct sizes than it has steps, and its tracking is one number for
  // a 160px masthead and a 16px card title alike. If a future edit "fixes"
  // TODAY, the board would be arguing against something the site no longer
  // does, so both faults are pinned rather than assumed.
  const today = ladderById("today");

  it("today's phone end collapses two marketing steps onto one size", () => {
    const sizes = rungsOf(today, "marketing", "phone").map((s) => s.px);
    expect(new Set(sizes).size).toBeLessThan(sizes.length);
    expect(today.steps.title!.phone.px).toBe(today.steps.chapter!.phone.px);
  });

  it("today tracks every step at the same -0.03em", () => {
    const tracking = new Set(
      STEPS.filter((s) => today.steps[s.id]).flatMap((s) => [
        today.steps[s.id]!.phone.ls,
        today.steps[s.id]!.desktop.ls,
      ]),
    );
    expect([...tracking]).toEqual([-0.03]);
  });

  it("today has no app step between the page title and the card title", () => {
    expect(today.steps.subsection).toBeNull();
  });
});

describe("every candidate separates its steps at both ends", () => {
  for (const ladder of CANDIDATES) {
    for (const surface of ["marketing", "app"] as const) {
      for (const end of ["phone", "desktop"] as const) {
        it(`${ladder.id}: ${surface} at ${end}`, () => {
          const sizes = rungsOf(ladder, surface, end).map((s) => s.px);
          expect(new Set(sizes).size).toBe(sizes.length);
        });
      }
    }
  }
});

describe("the tracking law: leading and tracking run inverse to size", () => {
  // design-system.md, "Icon + small-type rules": the system already states the
  // law; today's flat -0.03em is what does not implement it. Checked per
  // SURFACE, because two steps on different surfaces may swap order between
  // the two ends (a marketing prose head at 21 sits under an app page title at
  // 24 on a phone and over it on a desktop) without either ladder being wrong.
  for (const ladder of LADDERS) {
    for (const surface of ["marketing", "app"] as const) {
      for (const end of ["phone", "desktop"] as const) {
        it(`${ladder.id}: ${surface} at ${end}`, () => {
          const steps = rungsOf(ladder, surface, end);
          for (let i = 1; i < steps.length; i++) {
            expect(steps[i].lh).toBeLessThanOrEqual(steps[i - 1].lh);
            expect(steps[i].ls).toBeLessThanOrEqual(steps[i - 1].ls);
          }
        });
      }
    }
  }

  it("each candidate actually varies its tracking, today does not", () => {
    for (const ladder of CANDIDATES) {
      const tracking = new Set(
        STEPS.filter((s) => ladder.steps[s.id]).map(
          (s) => ladder.steps[s.id]!.desktop.ls,
        ),
      );
      expect(tracking.size).toBeGreaterThanOrEqual(5);
    }
  });
});

describe("B's law: marketing travels four rungs, the app travels one", () => {
  const b = ladderById("b");
  const index = (px: number) => RUNGS.indexOf(px as (typeof RUNGS)[number]);

  it("puts every step on a rung at both ends", () => {
    for (const step of STEPS) {
      const value = b.steps[step.id];
      if (!value) continue;
      expect(index(value.phone.px)).toBeGreaterThanOrEqual(0);
      expect(index(value.desktop.px)).toBeGreaterThanOrEqual(0);
    }
  });

  it("travels exactly four rungs on marketing and at most one on the app", () => {
    for (const step of STEPS) {
      const value = b.steps[step.id];
      if (!value) continue;
      const travel = index(value.desktop.px) - index(value.phone.px);
      if (step.surface === "marketing") expect(travel).toBe(4);
      else expect(travel).toBeLessThanOrEqual(1);
    }
  });

  it("widens the ratio as the rung set climbs", () => {
    const first = RUNGS[1] / RUNGS[0];
    const last = RUNGS[RUNGS.length - 1] / RUNGS[RUNGS.length - 2];
    expect(last).toBeGreaterThan(first);
  });
});

describe("C's law: two registers, marketing louder and the app quieter", () => {
  const today = ladderById("today");
  const c = ladderById("c");

  it("raises marketing's display step and lowers the app's page title", () => {
    expect(c.steps.display!.desktop.px).toBeGreaterThan(
      today.steps.display!.desktop.px,
    );
    expect(c.steps.page!.desktop.px).toBeLessThan(today.steps.page!.desktop.px);
  });

  it("folds the prose tier into the section step", () => {
    expect(c.aliases?.prose).toBe("section");
    expect(c.steps.prose).toEqual(c.steps.section);
  });
});

describe("the token table", () => {
  it("emits a fluid size whose ends are the step's two ends", () => {
    expect(fluid(64, 160)).toBe("clamp(4rem, 1.887rem + 9.01vw, 10rem)");
    expect(fluid(24, 24)).toBe("1.5rem");
  });

  it("gives every live step three properties", () => {
    for (const ladder of LADDERS) {
      const rows = tokenTable(ladder);
      const live = STEPS.filter((s) => ladder.steps[s.id]).length;
      expect(rows).toHaveLength(live);
      for (const row of rows) {
        expect(row.token).toMatch(/^--text-[a-z]+$/);
        expect(row.size).toMatch(/rem/);
        expect(row.lh).toMatch(/rem/);
        expect(row.ls).toMatch(/em$/);
      }
    }
  });
});

/* ─────────────────────────── Round two's laws ─────────────────────────── */

describe("the app's floor: no heading under the body it sits on", () => {
  // Round two's finding, from reconsidering C on a real dashboard: a Card sets
  // `text-sm` on its whole subtree and CardDescription is `text-sm`, so 14px is
  // the body an app heading sits above. A heading at or below it carries its
  // rank on weight and colour alone, which is what C's 14px card title did to
  // the event name, the one thing a host scans a dashboard for.
  for (const ladder of LADDERS) {
    it(`${ladder.id} keeps every app step above ${APP_BODY_PX}px`, () => {
      for (const step of STEPS.filter((s) => s.surface === "app")) {
        const value = ladder.steps[step.id];
        if (!value) continue;
        expect(value.phone.px).toBeGreaterThan(APP_BODY_PX);
        expect(value.desktop.px).toBeGreaterThan(APP_BODY_PX);
      }
    });
  }
});

describe("C's app register, as round two rebuilt it", () => {
  // Round three dropped the stage that showed the rejected 20 / 16 / 14 beside
  // it and the ask that went with it: the floor below is the law now, so there
  // was nothing left on that stage to rule on. This is what keeps the rebuild
  // honest once the picture of it is gone.
  const c = ladderById("c");
  const today = ladderById("today");

  it("is 20 / 18 / 16, quieter than today at the title and level at the card", () => {
    expect(c.steps.page!.desktop.px).toBe(20);
    expect(c.steps.subsection!.desktop.px).toBe(18);
    expect(c.steps.card!.desktop.px).toBe(16);
    expect(c.steps.page!.desktop.px).toBeLessThan(today.steps.page!.desktop.px);
    expect(c.steps.card!.desktop.px).toBe(today.steps.card!.desktop.px);
  });
});

describe("the tracking law, as a function of size", () => {
  it("returns the rung's own optics at a rung", () => {
    expect(optics(160)).toEqual({ lh: 0.86, ls: -0.045 });
    expect(optics(16)).toEqual({ lh: 1.4, ls: -0.006 });
  });

  it("reads between the rungs and never inverts", () => {
    const between = optics(30);
    expect(between.lh).toBeLessThan(optics(28).lh);
    expect(between.lh).toBeGreaterThan(optics(34).lh);
    expect(between.ls).toBeLessThan(optics(28).ls);
    expect(between.ls).toBeGreaterThan(optics(34).ls);
  });

  it("holds flat past both ends of the rung set", () => {
    expect(optics(4)).toEqual(optics(RUNGS[0]));
    expect(optics(400)).toEqual(optics(RUNGS[RUNGS.length - 1]));
  });
});

describe("the law alone: today's sizes, nothing moved but the optics", () => {
  const today = ladderById("today");

  it("moves no size at either end", () => {
    for (const step of STEPS) {
      const law = LAW_ONLY.steps[step.id];
      const now = today.steps[step.id];
      expect(Boolean(law)).toBe(Boolean(now));
      if (!law || !now) continue;
      expect(law.phone.px).toBe(now.phone.px);
      expect(law.desktop.px).toBe(now.desktop.px);
    }
  });

  it("replaces the flat constant with a value per size", () => {
    const tracking = new Set(
      STEPS.filter((s) => LAW_ONLY.steps[s.id]).map(
        (s) => LAW_ONLY.steps[s.id]!.desktop.ls,
      ),
    );
    expect(tracking.size).toBeGreaterThanOrEqual(5);
    expect(tracking.has(-0.03)).toBe(false);
  });

  it("is never in the candidate toggle", () => {
    expect(LADDERS.map((l) => l.id)).not.toContain("law");
  });
});

describe("the paste: a candidate against the real site", () => {
  // Round two's centre of gravity: a candidate is a block of CSS applied to the
  // whole site, so what it targets has to be REAL selectors that exist in
  // production, never a stage-local class, and every custom property it spends
  // has to be one it declares.
  const ALL = [...LADDERS, LAW_ONLY];

  it("targets the production hooks, not the board's own", () => {
    for (const ladder of ALL) {
      const css = candidateCss(ladder);
      expect(css).toContain(".mkt-name");
      expect(css).toContain('[data-slot="card-title"]');
      expect(css).toContain("[data-not-found] h1");
      expect(css).not.toContain("data-tsc");
      expect(css).not.toContain("!important");
    }
  });

  it("declares every token it spends", () => {
    for (const ladder of ALL) {
      const css = candidateCss(ladder);
      const declared = new Set(
        [...css.matchAll(/^\s*(--text-[a-z-]+):/gm)].map((m) => m[1]),
      );
      const spent = new Set(
        [...css.matchAll(/var\((--text-[a-z-]+)\)/g)].map((m) => m[1]),
      );
      for (const token of spent) expect(declared).toContain(token);
    }
  });

  it("moves no size in the law block, and every size in the others", () => {
    expect(candidateCss(LAW_ONLY)).not.toContain("font-size:");
    for (const ladder of LADDERS) {
      expect(candidateCss(ladder)).toContain("font-size:");
    }
  });

  it("closes the masthead's tracking in marketing.css's own two places", () => {
    const css = candidateCss(ladderById("b"));
    expect(css).toContain('[data-mkt] [data-inview="true"] .mkt-name');
    expect(css).toContain("prefers-reduced-motion: reduce");
  });

  it("names a hook for every step that has one, and none for the app's middle", () => {
    for (const step of STEPS) {
      const hook = HOOKS[step.id];
      if (step.id === "display" || step.id === "subsection") {
        expect(hook).toBeUndefined();
      } else {
        expect(hook?.selector.length).toBeGreaterThan(5);
      }
    }
  });
});

describe("the bake", () => {
  it("emits Tailwind v4's font-size shape, so a step is one class", () => {
    const block = themeBlock(ladderById("a"));
    expect(block.startsWith("@theme {")).toBe(true);
    expect(block).toContain("--text-title:");
    expect(block).toContain("--text-title--line-height:");
    expect(block).toContain("--text-title--letter-spacing:");
  });
});

describe("the hero board's hand-rolled ladder", () => {
  // The hero concepts resolve the xl step by hand (LADDER in
  // sandbox/home-hero/shared.tsx: text-8xl on desktop, text-5xl on a phone) and
  // the lockup stage copies those two class strings rather than importing
  // across boards.
  // This is what keeps the copy honest: if today's hero step ever stops being
  // 48/96, the copied strings are wrong and this fails.
  it("is today's hero step at both ends", () => {
    const hero = ladderById("today").steps.hero!;
    expect(hero.phone.px).toBe(48);
    expect(hero.desktop.px).toBe(96);
  });
});

/* ────────── The board's own sheet against the paste it hands out ────────── */

/**
 * ★ THE PASTE LANDS ON THE BOARD TOO, AND WINS EVERY TIE.
 *
 * A candidate is rendered as a <style> after every stylesheet on every page
 * with a key-gated island, and the board is a page on that site: an applied
 * candidate reaches the board's own stages and, at equal specificity, beats
 * board.css on source order. Every stage depends on the opposite, because a
 * stage shows the ladder its TOGGLE selects, not the one that happens to be
 * applied. The failure is silent and it is the whole argument of a stage: with
 * the page step tied, the dashboard and the event page both collapsed onto the
 * applied ladder's page size while the specimen above them still read today's.
 *
 * No reader can check this by eye. The page hook scores three attribute tokens
 * AND a type, which is exactly what a three-attribute chain ending in
 * `:is(h1, h2, h3)` scores, so the two were (0,3,1) against (0,3,1). This
 * computes both sides and fails the moment a hook grows a token, or the
 * doubled `[data-tsc][data-tsc]` in board.css is tidied away.
 */

type Spec3 = [number, number, number];

/** Split on a separator at bracket and paren depth zero. */
function splitTop(selector: string, sep: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of selector) {
    if (ch === "(" || ch === "[") depth += 1;
    else if (ch === ")" || ch === "]") depth -= 1;
    if (ch === sep && depth === 0) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

const cmp = (a: Spec3, b: Spec3) =>
  a[0] - b[0] || a[1] - b[1] || a[2] - b[2] || 0;

/** Selectors Level 4 counting, for the shapes these two sheets use: ids,
 *  classes, attributes, pseudo-classes and types, with `:is()`/`:not()`/
 *  `:has()` taking their most specific argument and `:where()` taking none. */
function specificity(selector: string): Spec3 {
  const s = selector.trim();
  const word = /[\w-]/;
  let [a, b, c] = [0, 0, 0];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === "#" || ch === ".") {
      if (ch === "#") a += 1;
      else b += 1;
      i += 1;
      while (i < s.length && word.test(s[i])) i += 1;
    } else if (ch === "[") {
      let depth = 1;
      i += 1;
      while (i < s.length && depth > 0) {
        if (s[i] === "[") depth += 1;
        else if (s[i] === "]") depth -= 1;
        i += 1;
      }
      b += 1;
    } else if (ch === ":") {
      const element = s[i + 1] === ":";
      i += element ? 2 : 1;
      let name = "";
      while (i < s.length && word.test(s[i])) {
        name += s[i];
        i += 1;
      }
      if (s[i] === "(") {
        let depth = 1;
        const start = (i += 1);
        while (i < s.length && depth > 0) {
          if (s[i] === "(") depth += 1;
          else if (s[i] === ")") depth -= 1;
          i += 1;
        }
        const inner = s.slice(start, i - 1);
        const fn = name.toLowerCase();
        if (fn === "where") continue;
        if (fn === "is" || fn === "not" || fn === "has" || fn === "matches") {
          let best: Spec3 = [0, 0, 0];
          for (const arg of splitTop(inner, ",")) {
            const got = specificity(arg);
            if (cmp(got, best) > 0) best = got;
          }
          a += best[0];
          b += best[1];
          c += best[2];
        } else b += 1;
      } else if (element) c += 1;
      else b += 1;
    } else if (word.test(ch)) {
      while (i < s.length && word.test(s[i])) i += 1;
      c += 1;
    } else i += 1;
  }
  return [a, b, c];
}

const BOARD_CSS = readFileSync(
  join(process.cwd(), "src/app/(dev)/design/sandbox/type-scale/board.css"),
  "utf8",
);

/** Every selector a sheet declares, flattened; at-rule preludes dropped. */
function selectorsOf(css: string): string[] {
  return [...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{/g)]
    .map((m) => m[1].trim())
    .filter((prelude) => prelude.length > 0 && !prelude.startsWith("@"))
    .flatMap((prelude) => splitTop(prelude, ",").map((one) => one.trim()))
    .filter(Boolean);
}

describe("the board's sheet outranks any paste", () => {
  /** The rules that spend a step's own properties on a stage. */
  const stepRules = selectorsOf(BOARD_CSS).filter((s) =>
    /\[data-tsc-(step|ships|face)/.test(s),
  );
  const pasteSelectors = [...LADDERS, LAW_ONLY].flatMap((ladder) =>
    selectorsOf(candidateCss(ladder)),
  );

  it("counts a selector the way the cascade does", () => {
    expect(specificity("h1")).toEqual([0, 0, 1]);
    expect(specificity('[data-mkt] [data-inview="true"] .mkt-name')).toEqual([
      0, 3, 0,
    ]);
    // The tie an applied candidate won over the board's own stages, both halves.
    expect(specificity(HOOKS.page!.selector)).toEqual([0, 3, 1]);
    expect(
      specificity(
        '[data-tsc] [data-tsc-page] [data-tsc-step="heading"] :is(h1, h2, h3)',
      ),
    ).toEqual([0, 3, 1]);
  });

  it("finds both sides to compare", () => {
    expect(stepRules.length).toBeGreaterThanOrEqual(4);
    expect(pasteSelectors.length).toBeGreaterThanOrEqual(20);
  });

  it("puts every stage rule above every selector a candidate emits", () => {
    const worst = pasteSelectors.reduce((most, one) =>
      cmp(specificity(one), specificity(most)) > 0 ? one : most,
    );
    for (const rule of stepRules) {
      // Reported as an object so a failure names the rule that lost.
      expect({
        rule,
        beats: worst,
        outranks: cmp(specificity(rule), specificity(worst)) > 0,
      }).toEqual({ rule, beats: worst, outranks: true });
    }
  });
});

/* ───────────────────────── Round three's laws ─────────────────────────── */

describe("the board answers before it asks", () => {
  it("recommends one of the candidates, and shows it first", () => {
    expect(LADDERS.map((l) => l.id)).toContain(RECOMMENDED);
    expect(RECOMMENDED).not.toBe("today");
    expect(LADDERS[0].id).toBe(RECOMMENDED);
    expect(LADDERS[LADDERS.length - 1].id).toBe("today");
  });

  it("asks four things, each with an answer and a way to overrule it", () => {
    expect(ASKS).toHaveLength(4);
    for (const ask of ASKS) {
      expect(ask.ask.length).toBeGreaterThan(20);
      // A one-word answer, or two where the phrase is the ruling itself.
      expect(ask.answer.split(" ").length).toBeLessThanOrEqual(3);
      expect(ask.because.length).toBeGreaterThan(40);
      expect(ask.overrule.length).toBeGreaterThan(20);
    }
  });

  // ★ Round three cut two asks and left "the fifth ask" inside the block Will
  // copies, so this counts the position here, off ASKS, with its own word list:
  // a cut, a reorder or a hand-typed ordinal in the paste fails it.
  it("names the 404 ask by the position it actually holds, everywhere it is named", () => {
    const words = ["first", "second", "third", "fourth", "fifth", "sixth"];
    const i = ASKS.findIndex((a) => /404/.test(a.ask));
    expect(i).toBeGreaterThanOrEqual(0);
    const ordinal = words[i];
    expect(askOrdinal(ASK_404)).toBe(ordinal);
    for (const ladder of [...LADDERS, LAW_ONLY]) {
      const css = candidateCss(ladder);
      expect(css).toContain(`${ordinal} ask`);
      for (const other of words.filter((w) => w !== ordinal)) {
        expect(css).not.toContain(`${other} ask`);
      }
    }
  });

  it("answers both ladder asks with the ladder it recommends", () => {
    const name = ladderById(RECOMMENDED).name;
    const ladderAsks = ASKS.filter((a) =>
      /^The (marketing|app) ladder/.test(a.ask),
    );
    expect(ladderAsks).toHaveLength(2);
    for (const ask of ladderAsks) {
      expect(name.startsWith(ask.answer)).toBe(true);
    }
  });
});

describe("what each ladder fixes, counted rather than claimed", () => {
  it("has today fixing none of its own four faults", () => {
    const today = fixes(ladderById("today"));
    for (const fix of FIXES) expect(today[fix.id]).toBe(false);
  });

  it("has every candidate fixing the phone end, the leading and the tracking", () => {
    for (const ladder of LADDERS.filter((l) => l.id !== "today")) {
      const got = fixes(ladder);
      expect(got.phone).toBe(true);
      expect(got.leading).toBe(true);
      expect(got.tracking).toBe(true);
    }
  });

  it("gives the app's middle only to the ladders that carry the step", () => {
    for (const ladder of LADDERS) {
      expect(fixes(ladder).middle).toBe(Boolean(ladder.steps.subsection));
    }
  });

  it("has the law alone fixing the optics and nothing else", () => {
    const law = fixes(LAW_ONLY);
    expect(law.leading).toBe(true);
    expect(law.tracking).toBe(true);
    expect(law.phone).toBe(false);
    expect(law.middle).toBe(false);
  });
});

describe("how much of the site a ladder moves at one canvas", () => {
  // Round three's cold walk: at 1440 A keeps every size the site ships, so
  // toggling to it moves only the leading and the tracking. The board says so
  // rather than letting a reviewer read a working control as a broken one.
  it("counts A as moving no desktop size, and several on a phone", () => {
    expect(moved(ladderById("a"), "desktop").moved).toBe(0);
    expect(moved(ladderById("a"), "phone").moved).toBeGreaterThan(3);
  });

  it("counts today as moving nothing at either end", () => {
    for (const end of ["phone", "desktop"] as const) {
      const count = moved(ladderById("today"), end);
      expect(count.moved).toBe(0);
      expect(count.added).toBe(0);
    }
  });

  it("counts the step a ladder adds separately from the ones it moves", () => {
    for (const id of ["b", "c"] as const) {
      expect(moved(ladderById(id), "desktop").added).toBe(1);
    }
  });
});

describe("the walk: only pages a paste can actually reach", () => {
  /**
   * ★ COMPUTED, NOT DECLARED (round four). Round three found two dead links in
   * round two's walk: /admin mounted no design island and /nothing-here
   * resolved to the ROOT app/not-found.tsx, so a candidate never reached
   * either and clicking them read as a broken paste. Round four's Orchestrator
   * landed the two one-line mounts, so /admin and the guest routes ARE
   * walkable now, and the board's list moved with them.
   *
   * A hard-coded list of what is walkable is exactly what went stale last
   * time, so this reads the real layouts instead: every walk link must resolve
   * to a layout that actually mounts an island. Remove a mount anywhere and
   * this fails, naming the link that went dead.
   */
  const ISLAND_OF: { prefix: string; layout: string; mount: string }[] = [
    {
      prefix: "/dashboard",
      layout: "src/app/(app)/layout.tsx",
      mount: "AppDesignIsland",
    },
    {
      prefix: "/admin",
      layout: "src/app/admin/layout.tsx",
      mount: "AppDesignIsland",
    },
    {
      prefix: "/e/",
      layout: "src/app/(guest)/layout.tsx",
      mount: "AppDesignIsland",
    },
    {
      prefix: "/contact",
      layout: "src/app/(marketing)/(paper)/layout.tsx",
      mount: "MarketingMotionTuner",
    },
    // Everything else under the marketing tree is the cinema group.
    {
      prefix: "/",
      layout: "src/app/(marketing)/(cinema)/layout.tsx",
      mount: "MarketingMotionTuner",
    },
  ];

  const layoutFor = (href: string) =>
    [...ISLAND_OF]
      .sort((a, b) => b.prefix.length - a.prefix.length)
      .find((entry) => href.startsWith(entry.prefix))!;

  it("walks only surfaces whose real layout mounts a design island", () => {
    expect(WALK.length).toBeGreaterThan(5);
    for (const page of WALK) {
      expect(page.href.startsWith("/")).toBe(true);
      const entry = layoutFor(page.href);
      const layout = readFileSync(join(process.cwd(), entry.layout), "utf8");
      expect(
        layout.includes(`<${entry.mount} />`),
        `${page.href} walks through ${entry.layout}, which no longer mounts ${entry.mount}`,
      ).toBe(true);
    }
  });

  it("walks a marketing 404 rather than an unrouted path", () => {
    const notFound = WALK.find((p) => p.label.includes("404"));
    expect(notFound?.href.startsWith("/events/")).toBe(true);
  });

  it("names the root 404, the one surface outside every island", () => {
    expect(NO_ISLAND.length).toBe(1);
    for (const gap of NO_ISLAND) expect(gap.why.length).toBeGreaterThan(30);
    const root = readFileSync(
      join(process.cwd(), "src/app/not-found.tsx"),
      "utf8",
    );
    // It is outside both trees by construction, so no island can be in it.
    expect(root.includes("AppDesignIsland")).toBe(false);
    expect(root.includes("MarketingMotionTuner")).toBe(false);
  });
});

/* ═══════════ ROUND FOUR: THE PAIR, AND THE REGISTERS IT COMPOSES ═════════ */

/**
 * Will's third note asked for the two registers to be selectable separately
 * and left the SHAPE to the board: two distinct token sets, or one set with
 * two registers. The board's call is one set (REGISTER_CALL), and that call is
 * only honest if a pair behaves like a ladder in every way the wiring round
 * cares about: one nine-step set, one @theme block, one paste. These prove it
 * for every one of the sixteen pairs rather than for the recommended one.
 */
describe("the pair: two registers, chosen separately, composed into one set", () => {
  const ALL: Pair[] = LADDERS.flatMap((m) =>
    LADDERS.map((a) => ({
      marketing: m.id as Pair["marketing"],
      app: a.id as Pair["app"],
    })),
  );

  it("agrees with STEPS about which register every step is in", () => {
    for (const step of STEPS) expect(SURFACE[step.id]).toBe(step.surface);
    expect(Object.keys(SURFACE).length).toBe(STEPS.length);
  });

  it("takes every marketing step from one ladder and every app step from the other", () => {
    for (const pair of ALL) {
      const composed = composePair(pair);
      for (const step of STEPS) {
        const from = ladderById(
          step.surface === "marketing" ? pair.marketing : pair.app,
        );
        expect(composed.steps[step.id]).toEqual(from.steps[step.id]);
      }
    }
  });

  it("is the ladder itself when both halves are the same one", () => {
    for (const l of LADDERS) {
      const composed = composePair({
        marketing: l.id as Pair["marketing"],
        app: l.id as Pair["app"],
      });
      expect(composed).toBe(l);
      // The paste must be byte-identical too, or "B" and the pair (B, B) would
      // be two different blocks with one name.
      expect(candidateCss(composed)).toBe(candidateCss(l));
    }
  });

  it("carries a folded step only from the register that folds it", () => {
    // C folds prose into section, and prose is marketing's: a pair with C on
    // the app side must NOT inherit the fold.
    const cApp = composePair({ marketing: "b", app: "c" });
    expect(cApp.aliases?.prose).toBeUndefined();
    const cMkt = composePair({ marketing: "c", app: "b" });
    expect(cMkt.aliases?.prose).toBe("section");
  });

  it("bakes as ONE @theme block whichever two ladders it is", () => {
    for (const pair of ALL) {
      const block = themeBlock(composePair(pair));
      expect(block.match(/@theme/g)?.length).toBe(1);
      // And every name in it is the shared set: no register prefix anywhere,
      // which is the whole of the board's call.
      expect(block).not.toMatch(/--text-(mkt|app|marketing)-/);
    }
  });

  it("spends the marketing hooks on the marketing half and the app hooks on the app half", () => {
    // B and C differ at every step, so a crossed pair is the strongest probe:
    // the section hook must carry B's value and the page hook C's.
    const css = candidateCss(composePair({ marketing: "b", app: "c" }));
    const b = ladderById("b");
    const c = ladderById("c");
    expect(css).toContain(`${HOOKS.section!.selector} {`);
    expect(css).toContain(
      `--text-section--letter-spacing: ${b.steps.section!.desktop.ls}em`,
    );
    expect(css).toContain(
      `--text-page--letter-spacing: ${c.steps.page!.desktop.ls}em`,
    );
    // And the reverse pair swaps exactly those two and nothing else.
    const flipped = candidateCss(composePair({ marketing: "c", app: "b" }));
    expect(flipped).toContain(
      `--text-section--letter-spacing: ${c.steps.section!.desktop.ls}em`,
    );
    expect(flipped).toContain(
      `--text-page--letter-spacing: ${b.steps.page!.desktop.ls}em`,
    );
  });

  it("opens both switches on the ladder the board recommends", () => {
    expect(DEFAULT_PAIR.marketing).toBe(RECOMMENDED);
    expect(DEFAULT_PAIR.app).toBe(RECOMMENDED);
  });

  it("states the register call in a form the board and the spec can both print", () => {
    expect(REGISTER_CALL.headline.length).toBeGreaterThan(10);
    expect(REGISTER_CALL.body.length).toBeGreaterThan(200);
    // The call is one set; the board must not claim the opposite anywhere.
    expect(REGISTER_CALL.headline.toLowerCase()).toContain("one token set");
  });
});

/**
 * Round four judges the marketing register on the ROUTES rather than on
 * reconstructions. A frame is only honest if it points at a real internal page
 * and carries no key: the key would mount the motion tuner over the page being
 * judged and put an APPLIED block under the pair being previewed.
 */
describe("the real pages the frames render", () => {
  it("points every frame at an internal route with no query of its own", () => {
    for (const page of REAL_PAGES) {
      if (page.demo) {
        // The guest album's href is completed from the demo token at render.
        expect(page.href).toBe("");
        continue;
      }
      expect(page.href.startsWith("/")).toBe(true);
      expect(page.href).not.toContain("?");
      expect(page.href).not.toContain("key=");
    }
  });

  it("gives every frame a unique id and a reason it is on the board", () => {
    const ids = REAL_PAGES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const page of REAL_PAGES) expect(page.why.length).toBeGreaterThan(40);
  });

  it("covers the surfaces the round asked for", () => {
    const hrefs = REAL_PAGES.map((p) => p.href);
    for (const href of ["/", "/pricing", "/help", "/about"]) {
      expect(hrefs).toContain(href);
    }
    expect(hrefs.some((h) => h.startsWith("/features/"))).toBe(true);
    expect(hrefs.some((h) => h.startsWith("/help/"))).toBe(true);
    expect(REAL_PAGES.some((p) => p.demo)).toBe(true);
  });

  it("frames a help article that the site actually routes", () => {
    const article = REAL_PAGES.find((p) => p.href.startsWith("/help/"))!;
    const help = readFileSync(
      join(process.cwd(), "src/lib/content/help.ts"),
      "utf8",
    );
    expect(help).toContain(article.href);
  });
});

/**
 * The glance table is two tables now, one per register, and each shows only
 * the faults that register can have. A fix row that can never be true of a
 * two-step register is a row a reviewer has to learn to ignore.
 */
describe("what each register fixes, counted per register", () => {
  it("scopes every fault to the register it belongs to", () => {
    const phone = FIXES.find((f) => f.id === "phone")!;
    const middle = FIXES.find((f) => f.id === "middle")!;
    expect(phone.surfaces).toEqual(["marketing"]);
    expect(middle.surfaces).toEqual(["app"]);
    for (const fix of FIXES) expect(fix.surfaces.length).toBeGreaterThan(0);
  });

  it("has today fixing nothing on either register", () => {
    const today = ladderById("today");
    for (const surface of ["marketing", "app"] as const) {
      for (const fix of FIXES.filter((f) => f.surfaces.includes(surface))) {
        expect(fixes(today, surface)[fix.id]).toBe(false);
      }
    }
  });

  it("has every candidate naming its leading and its tracking on both registers", () => {
    for (const ladder of CANDIDATES) {
      for (const surface of ["marketing", "app"] as const) {
        expect(fixes(ladder, surface).leading).toBe(true);
        expect(fixes(ladder, surface).tracking).toBe(true);
      }
    }
  });

  it("gives the app's middle only to the registers that carry the step", () => {
    for (const ladder of [...LADDERS, LAW_ONLY]) {
      expect(fixes(ladder, "app").middle).toBe(
        Boolean(ladder.steps.subsection),
      );
    }
  });

  it("counts a register's movement without the other register's steps", () => {
    // A keeps every desktop size on both registers, so both halves read zero.
    const a = ladderById("a");
    expect(moved(a, "desktop", "marketing").moved).toBe(0);
    expect(moved(a, "desktop", "app").moved).toBe(0);
    // C drops the app title and leaves marketing's own count untouched.
    const c = ladderById("c");
    expect(moved(c, "desktop", "app").moved).toBeGreaterThan(0);
    expect(moved(c, "desktop", "app").of).toBe(2);
  });
});
