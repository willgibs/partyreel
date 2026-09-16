#!/usr/bin/env node
/**
 * SCAFFOLD A BOARD (the Library x Lab round, 2026-09-15).
 *
 *   node scripts/new-board.mjs <id> "<title>"
 *
 * Writes the two files a board IS (`spec.ts` and `board.tsx`) and prints the
 * registrations the tests demand, because a board is not a board until four
 * separate lists agree about it and a human will forget at least one:
 * `sandbox/registry.ts`, `(shell)/lab/boards.ts`, `touchpoints.ts`, and (while
 * the wave runs) the legacy exemption list it must NOT be on.
 *
 * ★ IT PRINTS RATHER THAN EDITS, AND THAT IS DELIBERATE. `touchpoints.ts` is
 * not this track's file and `registry.ts` is imported by a server page; a
 * scaffold that rewrote either from a template would be an agent editing a
 * shared list from a script, which is exactly the class of change the program
 * asks a human to read. Copying four printed lines is cheap; an unreviewed
 * automated edit to a contended file is not.
 *
 * No package.json script: that file is nobody's lane in a parallel round and a
 * one-line convenience is not worth a contended edit. Node builtins only, and
 * it refuses to overwrite: a board that already exists
 * is a mistake in the command, never an invitation.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [id, title] = process.argv.slice(2);
const die = (m) => {
  console.error(m);
  process.exit(1);
};

if (!id || !title)
  die('usage: node scripts/new-board.mjs <id> "<title>"   (id is kebab-case)');
if (!/^[a-z][a-z0-9-]*$/.test(id))
  die(`"${id}" is not a kebab-case id: lower case, digits and hyphens.`);

const dir = join(process.cwd(), "src/app/(dev)/design/sandbox", id);
if (existsSync(dir)) die(`${dir} already exists. Pick another id.`);

const pascal = id
  .split("-")
  .map((w) => w[0].toUpperCase() + w.slice(1))
  .join("");
const CONST = id.replace(/-/g, "_").toUpperCase();
const today = new Date().toISOString().slice(0, 10);

const spec = `import { defineBoard } from "@/components/lab/board-spec";

/**
 * ${title.toUpperCase()}, AS DATA.
 *
 * Pure: no React, no CSS, no import of the board (registry.test.ts enforces it),
 * because the board route is a server page and reads this for its header.
 * Every string is capped by LIMITS; a board that wants more room says less.
 */
export const ${CONST} = defineBoard({
  id: "${id}",
  title: "${title}",

  question: "TODO: the one question, in a sentence a reviewer reads once.",

  round: {
    n: 1,
    date: "${today}",
    changed: "TODO: one line of what this round changed. It sits above the fold.",
  },

  verdict: {
    recommendation: "TODO: the answer in one breath.",
    because: "TODO: the case, in one or two sentences.",
    overrule: "TODO: the one thing that would change the board's mind.",
  },

  asks: [
    {
      id: "TODO",
      question: "TODO: a real question, in plain words, ending in a question mark?",
      context: "TODO: what the thing is and where it lives on the site, for someone who has not read the board. Gloss any nickname the first time.",
      look: "TODO: which section, which switch, what to compare; the specimens are labelled with the options' names.",
      options: [
        { id: "yes", label: "TODO: the option in words", means: "TODO: what choosing it does." },
        { id: "no", label: "TODO: the other option in words", means: "TODO: what choosing it does." },
      ],
      recommended: "yes",
      because: "TODO: why the board recommends it, in plain words.",
      evidence: "TODO",
    },
  ],

  candidates: [
    {
      id: "TODO",
      name: "TODO",
      recommended: true,
      rationale: "TODO: what it is and why it might win.",
    },
  ],

  departures: [],
  assets: [],

  sections: [
    {
      id: "TODO",
      title: "TODO",
      lede: "TODO: what the evidence shows, in one line.",
      argument: ["TODO: the paragraph for the reader who disagrees. Collapsed."],
    },
  ],

  controls: [
    {
      id: "canvas",
      label: "Canvas",
      options: [
        { id: "desktop", label: "1440" },
        { id: "phone", label: "375" },
      ],
      default: "desktop",
    },
  ],

  lookFirst: [
    { section: "TODO", note: "TODO: where to look first, and why." },
  ],

  links: { bible: [] },
});
`;

const board = `"use client";

import { BoardPage, type Mode } from "@/components/lab";

import { ${CONST} } from "./spec";

/**
 * ${title.toUpperCase()}.
 *
 * What the board ARGUES is in spec.ts. What is here is the evidence for each
 * declared section, as a function of the declared state, and nothing else: no
 * header, no index, no asks, no meta panel. The template owns the order.
 */
export function ${pascal}Board() {
  return (
    <BoardPage
      spec={${CONST}}
      evidence={(id, state) => {
        const mode = state.canvas as Mode;
        switch (id) {
          case "TODO":
            return <p className="text-sm text-muted-foreground">The evidence, at {mode}.</p>;
          default:
            return null;
        }
      }}
    />
  );
}
`;

mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "spec.ts"), spec);
writeFileSync(join(dir, "board.tsx"), board);

console.log(`Wrote src/app/(dev)/design/sandbox/${id}/{spec.ts,board.tsx}

Now three edits the tests will ask for:

1. src/app/(dev)/design/sandbox/registry.ts
     import { ${CONST} } from "./${id}/spec";
     export const BOARDS: readonly BoardSpec[] = [..., ${CONST}];

2. src/app/(dev)/design/(shell)/lab/boards.ts
     import { ${pascal}Board } from "@/app/(dev)/design/sandbox/${id}/board";
     "${id}": { Component: ${pascal}Board },      // no legacy flag: it has a spec

3. src/app/(dev)/design/touchpoints.ts  (the Orchestrator's file: ask, do not edit)
     add "${id}" to SandboxId and a RULINGS entry with board: { note: "..." }

Then: pnpm typecheck && pnpm lint && pnpm test, and fill in every TODO.
Every string is capped by LIMITS in src/components/lab/board-spec.ts; the test
names the one that is over and by how much.`);
