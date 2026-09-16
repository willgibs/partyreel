import { describe, expect, it } from "vitest";

import { LIMITS } from "@/components/lab/board-spec";

import {
  APP_BODY_PX,
  candidateCss,
  COMPARED,
  fluid,
  HOOKS,
  LADDERS,
  ladderById,
  LAW_ONLY,
  optics,
  RECOMMENDED,
  rung,
  RUNGS,
  STEPS,
  themeBlock,
  tokenNames,
  WORN,
  type Ladder,
  type LadderId,
  type StepId,
} from "./ladders";
import { TYPE_SCALE } from "./spec";

/**
 * THE LADDERS' OWN LAWS (round six, the catalog rebuild).
 *
 * What is pinned here is what a reader of the board is entitled to believe:
 * the five cards on the board ARE the five ladders in the data, every ladder
 * is a real ladder (monotonic, floored, complete at both ends), the generated
 * block says what the card says, and the two lists of words (the spec's cards
 * and the ladders' names) cannot drift apart.
 *
 * Round five's tests for the glance table's computed ticks, the pair
 * composition and the board sheet's specificity score went with the sections
 * that needed them: the cards set their sizes inline, so no stylesheet can beat
 * them and there is no specificity to guard.
 */

const idsOf = (l: Ladder) => STEPS.map((s) => s.id).filter((id) => l.steps[id]);
const ends = ["phone", "desktop"] as const;

describe("the five ladders", () => {
  it("are the five cards the spec writes out, in the same order", () => {
    expect(TYPE_SCALE.candidates.map((c) => c.id)).toEqual(
      LADDERS.map((l) => l.id),
    );
    for (const card of TYPE_SCALE.candidates) {
      expect(
        ladderById(card.id as LadderId).name,
        `${card.id}: the card's name and the ladder's name`,
      ).toBe(card.name);
    }
  });

  it("recommends the one the spec's verdict recommends", () => {
    const recommended = TYPE_SCALE.candidates.filter((c) => c.recommended);
    expect(recommended).toHaveLength(1);
    expect(recommended[0].id).toBe(RECOMMENDED);
  });

  it("gives every card four facts and a line inside the limit", () => {
    for (const card of TYPE_SCALE.candidates) {
      expect(card.facts, `${card.id} has facts`).toBeTruthy();
      expect(card.facts!.length, `${card.id}: four facts`).toBe(4);
      expect(card.one, `${card.id} has a line`).toBeTruthy();
      expect(card.one!.length).toBeLessThanOrEqual(LIMITS.candidateOne);
      expect(
        card.verdict,
        `${card.id} carries the builder's call`,
      ).toBeTruthy();
    }
  });

  it("separates every marketing step at both ends, in every card that moves a size", () => {
    // ★ TODAY AND THE LAW-ONLY CARD ARE EXEMPT ON PURPOSE, and it is the same
    // exemption: the law card IS today's sizes with nothing but its optics
    // changed, so its phone end collapses in exactly the way today's does
    // (title and chapter both 36). That collapse is the fault the other three
    // cards answer, so a test that let it through anywhere else would let the
    // board claim a fix it does not make.
    for (const ladder of LADDERS.filter(
      (l) => l.id !== "today" && l.id !== "law",
    )) {
      for (const end of ends) {
        const sizes = STEPS.filter(
          (s) =>
            s.surface === "marketing" &&
            ladder.steps[s.id] &&
            ladder.aliases?.[s.id] === undefined,
        ).map((s) => ladder.steps[s.id]![end].px);
        for (let i = 1; i < sizes.length; i++) {
          expect(
            sizes[i],
            `${ladder.id} at ${end}: ${sizes[i - 1]} then ${sizes[i]}`,
          ).toBeLessThan(sizes[i - 1]);
        }
      }
    }
    // And today really does tie at the phone end, which is the board's premise.
    const today = ladderById("today");
    expect(today.steps.title!.phone.px).toBe(today.steps.chapter!.phone.px);
  });

  it("never sets an app heading below the body text it sits above", () => {
    for (const ladder of LADDERS) {
      for (const step of STEPS.filter((s) => s.surface === "app")) {
        const value = ladder.steps[step.id];
        if (!value) continue;
        for (const end of ends) {
          expect(
            value[end].px,
            `${ladder.id}.${step.id} at ${end} is below the ${APP_BODY_PX}px body`,
          ).toBeGreaterThanOrEqual(APP_BODY_PX);
        }
      }
    }
  });

  it("never grows a step as the screen narrows", () => {
    for (const ladder of LADDERS) {
      for (const step of STEPS) {
        const value = ladder.steps[step.id];
        if (!value) continue;
        expect(
          value.phone.px,
          `${ladder.id}.${step.id} is larger on a phone`,
        ).toBeLessThanOrEqual(value.desktop.px);
      }
    }
  });

  it("runs leading and tracking inverse to size in every card but today", () => {
    // ★ READ ONE END AT A TIME. The claim a reader can check on the board is
    // that at a given screen width a bigger heading is tighter, and that is
    // what is pinned. Across the two ends it is NOT true of a hand-tuned
    // ladder and should not be: C's 52px phone hero is tighter than its 56px
    // desktop chapter, because a phone hero is doing a hero's job in a narrow
    // column. B and the law card read their optics off the size, so they pass
    // either way.
    for (const ladder of LADDERS.filter((l) => l.id !== "today")) {
      for (const end of ends) {
        const specs = STEPS.flatMap((s) => {
          const v = ladder.steps[s.id];
          return v ? [v[end]] : [];
        }).sort((a, b) => a.px - b.px);
        for (let i = 1; i < specs.length; i++) {
          if (specs[i].px === specs[i - 1].px) continue;
          expect(
            specs[i].lh,
            `${ladder.id} at ${end}: leading at ${specs[i].px} against ${specs[i - 1].px}`,
          ).toBeLessThanOrEqual(specs[i - 1].lh);
          expect(
            specs[i].ls,
            `${ladder.id} at ${end}: tracking at ${specs[i].px} against ${specs[i - 1].px}`,
          ).toBeLessThanOrEqual(specs[i - 1].ls);
        }
      }
    }
  });

  it("holds every one of B's steps on a rung", () => {
    const b = ladderById("b");
    for (const step of STEPS) {
      const value = b.steps[step.id];
      if (!value) continue;
      for (const end of ends) {
        expect(RUNGS as readonly number[], `b.${step.id} at ${end}`).toContain(
          value[end].px,
        );
      }
    }
  });

  it("travels four rungs across marketing and one across the app, in B", () => {
    const b = ladderById("b");
    const at = (px: number) => (RUNGS as readonly number[]).indexOf(px);
    for (const step of STEPS) {
      const value = b.steps[step.id];
      if (!value) continue;
      const travel = at(value.desktop.px) - at(value.phone.px);
      const expected =
        step.surface === "marketing" ? 4 : step.id === "card" ? 0 : 1;
      expect(travel, `b.${step.id} travels ${travel} rungs`).toBe(expected);
    }
  });

  it("reads a rung's optics off the table and between the samples", () => {
    expect(rung(52)).toEqual({ px: 52, lh: 1.04, ls: -0.032 });
    expect(() => rung(53)).toThrow();
    const between = optics(58);
    expect(between.lh).toBeLessThan(optics(52).lh);
    expect(between.lh).toBeGreaterThan(optics(64).lh);
    // Off the ends the table clamps rather than extrapolating.
    expect(optics(8)).toEqual(optics(RUNGS[0]));
    expect(optics(400)).toEqual(optics(RUNGS[RUNGS.length - 1]));
  });

  it("moves no size in the law-only card", () => {
    const today = ladderById("today");
    for (const step of STEPS) {
      const mine = LAW_ONLY.steps[step.id];
      const now = today.steps[step.id];
      expect(Boolean(mine)).toBe(Boolean(now));
      if (!mine || !now) continue;
      for (const end of ends) {
        expect(mine[end].px, `law.${step.id} at ${end}`).toBe(now[end].px);
      }
    }
    expect(LAW_ONLY.id).toBe("law");
    expect(idsOf(LAW_ONLY)).toEqual(idsOf(today));
  });
});

describe("the block a ruling would land", () => {
  it("sets no font-size at all for the law-only card", () => {
    const css = candidateCss(LAW_ONLY);
    // The declaration, not the word: the block's own comment explains that the
    // token names are Tailwind's font-size shape.
    expect(css).not.toContain("font-size:");
    expect(css).toContain("letter-spacing");
    expect(css).toContain("line-height");
  });

  it("declares a size for every live step of every other card", () => {
    for (const ladder of LADDERS.filter((l) => l.id !== "law")) {
      const css = candidateCss(ladder);
      for (const step of STEPS) {
        const value = ladder.steps[step.id];
        const folded = ladder.aliases?.[step.id];
        if (!value || folded) continue;
        expect(
          css,
          `${ladder.id} declares ${tokenNames(step.id).size}`,
        ).toContain(`${tokenNames(step.id).size}:`);
      }
    }
  });

  it("spends a folded step's token rather than declaring a second one", () => {
    const c = ladderById("c");
    const css = candidateCss(c);
    expect(c.aliases?.prose).toBe("section");
    expect(css).not.toContain(`${tokenNames("prose").size}:`);
    expect(css).toContain(`var(${tokenNames("section").size})`);
  });

  it("puts the dead-link heading on the heading face in every card", () => {
    for (const ladder of LADDERS) {
      const css = candidateCss(ladder);
      expect(css, `${ladder.id} reaches the 404`).toContain(
        "[data-not-found] h1",
      );
      expect(css).toContain("--font-display");
    }
  });

  it("names the open question by position rather than by a typed ordinal", () => {
    const at = TYPE_SCALE.asks.findIndex((a) => a.id === "not-found");
    const word = ["first", "second", "third", "fourth"][at];
    expect(candidateCss(ladderById("b"))).toContain(`${word} ask`);
  });

  it("bakes every live token in the theme block", () => {
    const block = themeBlock(ladderById("b"));
    expect(block.startsWith("@theme {")).toBe(true);
    for (const step of STEPS) {
      expect(block).toContain(`${tokenNames(step.id).size}:`);
      expect(block).toContain(`${tokenNames(step.id).lh}:`);
      expect(block).toContain(`${tokenNames(step.id).ls}:`);
    }
  });

  it("writes a clamp that passes through both ends", () => {
    expect(fluid(16, 16)).toBe("1rem");
    const clamp = fluid(64, 160);
    expect(clamp.startsWith("clamp(4rem,")).toBe(true);
    expect(clamp.endsWith("10rem)")).toBe(true);
  });

  it("hooks only steps that exist, with the card hook production really ships", () => {
    const hooked = Object.keys(HOOKS) as StepId[];
    for (const id of hooked) {
      expect(
        STEPS.map((s) => s.id),
        `${id} is a real step`,
      ).toContain(id);
    }
    expect(HOOKS.card!.selector).toBe('[data-slot="card-title"]');
    // The app's section heading is a label inside an h2 and has no hook: the
    // paste says so in words rather than aiming at a class that would move the
    // real site under the Today card.
    expect(HOOKS.subsection).toBeUndefined();
    expect(candidateCss(ladderById("b"))).toContain(
      "The app's section heading has no hook today",
    );
  });
});

describe("the pages a frame loads", () => {
  it("names a route, a scene or the demo album for every one", () => {
    for (const page of [...COMPARED, ...WORN]) {
      const kind = page.scene ? "scene" : page.demo ? "demo" : "route";
      if (kind === "route") {
        expect(page.href.startsWith("/"), `${page.id} is a route`).toBe(true);
      }
      if (kind === "demo") expect(page.href).toBe("");
      if (kind === "scene") expect(page.href).toBe("dashboard");
      expect(page.why.length, `${page.id} says why it is here`).toBeGreaterThan(
        0,
      );
    }
  });

  it("keeps every frame id unique, because a lock group joins on it", () => {
    const ids = [...COMPARED, ...WORN].map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("puts the dead link among the pages the pick is worn by", () => {
    // The 404 ask's evidence is the `pages` section, so the screen it is asked
    // about has to be in it.
    expect(TYPE_SCALE.asks.find((a) => a.id === "not-found")!.evidence).toBe(
      "pages",
    );
    expect(WORN.some((p) => p.href.startsWith("/events/"))).toBe(true);
  });
});
