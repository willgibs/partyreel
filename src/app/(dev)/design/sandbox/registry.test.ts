// ★ PENDING, NOT ABANDONED: strip "-pending" to publish these contracts on the
// library page. The collector indexes every file a @contract-for names, and an
// indexed file owes a `for` line in rules/component-notes.ts (gallery.test.ts
// fails without one). That file and the collector's COMPONENT_DIRS are the
// lab-library and lab-rules lanes, so the nine lines are asked for in this
// track's Handoff with the exact patch. The tests below RUN either way: the
// marker publishes a contract, it does not create one.
// @contract-for-pending: src/app/(dev)/design/sandbox/registry.ts
// @contract-for-pending: src/components/lab/board-spec.ts
// @contract-for-pending: src/components/lab/board-page.tsx
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { anchorFor, LIMITS } from "@/components/lab/board-spec";
import { RESERVED_PARAMS } from "@/components/lab/board-state";

import { BOARDS, boardSpec } from "./registry";

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
      expect(src, `${b.id}/spec.ts has JSX`).not.toMatch(
        /<[A-Z][A-Za-z]*[\s/>]/,
      );
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
        under(`${b.id}.ask ${a.id}.because`, a.because, LIMITS.askBecause);
        under(`${b.id}.ask ${a.id}.overrule`, a.overrule, LIMITS.askOverrule);
      }
      for (const c of b.candidates) {
        under(`${b.id}.candidate ${c.id}`, c.rationale, LIMITS.rationale);
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

  it("points every ask, note and walk step at a section that exists", () => {
    for (const b of BOARDS) {
      const ids = new Set(b.sections.map((s) => s.id));
      expect(b.sections.length, `${b.id} has no sections`).toBeGreaterThan(0);
      for (const a of b.asks) {
        expect(
          ids.has(a.evidence),
          `${b.id}: ask ${a.id} points at ${a.evidence}`,
        ).toBe(true);
        expect(
          a.options,
          `${b.id}: ask ${a.id} does not offer its recommendation`,
        ).toContain(a.recommended);
        for (const o of a.options) {
          expect(o, `${b.id}: option "${o}" is not one token`).toMatch(
            /^[a-z0-9][a-z0-9-]*$/i,
          );
        }
      }
      const askIds = b.asks.map((a) => a.id);
      expect(new Set(askIds).size, `${b.id} has a duplicate ask id`).toBe(
        askIds.length,
      );
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
      for (const c of b.controls ?? []) {
        expect(
          c.options.map((o) => o.id),
          `${b.id}: ${c.id} defaults outside its options`,
        ).toContain(c.default);
        expect(
          RESERVED_PARAMS as readonly string[],
          `${b.id}: control "${c.id}" claims a reserved URL param`,
        ).not.toContain(c.id);
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
      "a spec.ts the registry does not import",
    ).toEqual(onDisk);
  });

  it("computes one anchor everywhere", () => {
    expect(anchorFor("light", "composer")).toBe("light-composer");
  });
});
