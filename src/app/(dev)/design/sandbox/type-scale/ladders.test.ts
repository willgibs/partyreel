import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  APP_BODY_PX,
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
  // ★ Round three found two dead links in round two's walk. The candidate's
  // <style> comes from a design island, and the island mounts in the lab
  // layout, the two marketing layouts and the app layout only: /admin mounts
  // none, and /nothing-here resolves to the ROOT app/not-found.tsx, outside
  // both. Either one looked like a broken paste rather than a missing island.
  it("lists no surface that carries no island", () => {
    expect(WALK.some((p) => p.href.startsWith("/admin"))).toBe(false);
    expect(WALK.some((p) => p.href.startsWith("/e/"))).toBe(false);
    for (const page of WALK) expect(page.href.startsWith("/")).toBe(true);
  });

  it("walks a marketing 404 rather than an unrouted path", () => {
    const notFound = WALK.find((p) => p.label.includes("404"));
    expect(notFound?.href.startsWith("/events/")).toBe(true);
  });

  it("names every surface a paste cannot reach, with the reason", () => {
    expect(NO_ISLAND.length).toBeGreaterThanOrEqual(3);
    for (const gap of NO_ISLAND) expect(gap.why.length).toBeGreaterThan(30);
  });
});
