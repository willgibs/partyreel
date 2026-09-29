#!/usr/bin/env node
/**
 * SCAFFOLD A BOARD: one folder, and nothing else touched.
 *
 *   pnpm new-board <id> "<title>" --surface <surface> --desk <n>
 *
 * Writes `src/app/(dev)/design/sandbox/<id>/spec.ts` (`defineExploration`: the
 * board's desk facts, its opening and one decision with two options, each
 * with its context layer) and `board.tsx` (`ExplorationBoard` with a preview
 * per option). The registry finds the folder and the route finds its board,
 * so no other file changes: two boards scaffolded at once never touch one
 * file, and retiring a board is deleting its folder (the lab revamp,
 * 2026-09-29; the catalog shapes this used to scaffold left with the
 * page-shaped board).
 *
 * ★ EVERY LINE THE AUTHOR OWES IS A `TODO`, and `registry.test.ts` refuses a
 * board that still carries one, listing each by file and line. So the gate is
 * the checklist: a scaffolded board cannot reach the desk half written.
 *
 * `--surface` is the surface the board redraws (the sidebar groups the desk
 * by it) and `--desk` its place on the desk, by leverage, lower first (the
 * brief names it; the Orchestrator moves it by editing that one line).
 *
 * Node builtins only, and it refuses to overwrite: a board that already
 * exists is a mistake in the command, never an invitation.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SURFACES = ["guest", "host", "marketing", "shared", "admin"];

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const positional = argv.filter(
  (a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"),
);
const [id, title] = positional;
const surface = flag("surface");
const desk = flag("desk");
const die = (m) => {
  console.error(m);
  process.exit(1);
};

if (!id || !title || !surface || desk === undefined)
  die(
    `usage: pnpm new-board <id> "<title>" --surface <${SURFACES.join("|")}> --desk <n>`,
  );
if (!/^[a-z][a-z0-9-]*$/.test(id))
  die(`"${id}" is not a kebab-case id: lower case, digits and hyphens.`);
if (!SURFACES.includes(surface))
  die(`"${surface}" is not a surface: one of ${SURFACES.join(", ")}.`);
if (!/^\d+$/.test(desk))
  die(
    `--desk takes the board's place on the desk, a whole number (the brief names it).`,
  );
if (title.length > 60)
  die(`the title is ${title.length} characters; 60 at most.`);

const dir = join(process.cwd(), "src/app/(dev)/design/sandbox", id);
if (existsSync(dir)) die(`${dir} already exists. Pick another id.`);

const pascal = id
  .split("-")
  .map((w) => w[0].toUpperCase() + w.slice(1))
  .join("");
const CONST = id.replace(/-/g, "_").toUpperCase();
const today = new Date().toISOString().slice(0, 10);
const crumb = surface[0].toUpperCase() + surface.slice(1);
const q = (s) => JSON.stringify(s);

const spec = `import { defineExploration } from "@/components/lab/exploration";

/**
 * ${title.toUpperCase()} (the ${id} track, cut ${today}).
 *
 * TODO: what this board explores and why now, for the next agent: the
 * surface as production draws it, what the round is for, and anything a
 * reader of the drawings would otherwise get wrong. Will reads the fields
 * below, never this comment.
 */
export const ${CONST} = defineExploration({
  id: ${q(id)},
  title: ${q(title)},
  surface: ${q(surface)},
  desk: ${desk},
  // The system doc and the production paths the board redraws: a wiring
  // lane's owns start here, and a merge that touches one flags the open asks.
  lives: ["TODO: docs/systems/<system>.md", "TODO: src/<the component it redraws>"],
  round: {
    n: 1,
    date: ${q(today)},
    changed: "TODO: what this round is, in a line.",
  },
  opening: {
    about: "TODO: what the board is about, in a line.",
    // What is already settled and not asked, a line each; delete if nothing is.
    settled: ["TODO: a settled line."],
  },
  asks: [
    {
      id: "first",
      label: "TODO: two to four words",
      question: "TODO: one question in plain words, asking for one winner?",
      where: [${q(crumb)}, "TODO: the screen", "TODO: the moment"],
      when: "TODO: the combination of state that brings someone there.",
      matters: "TODO: why the answer matters, in a line.",
      lands: "TODO: what the answer decides, platform-wide.",
      context: "TODO: what the previews draw: the frames, the moment and who is in them.",
      options: [
        {
          id: "today",
          label: "As today",
          means: "TODO: what production draws now.",
          gains: "TODO: what keeping it gains.",
          costs: "TODO: what keeping it costs.",
        },
        {
          id: "candidate",
          label: "TODO: the candidate, in words a stranger knows",
          means: "TODO: what picking it does.",
          gains: "TODO: what it gains.",
          costs: "TODO: what it costs.",
        },
      ],
      recommended: "candidate",
      // Every other decision is drawn at today while this one is asked.
      today: "today",
      because: "TODO: the recommendation's reason, in a line.",
    },
  ],
});
`;

const board = `"use client";

import { ExplorationBoard, Frame, type PreviewsFor } from "@/components/lab";

import { ${CONST} } from "./spec";

/**
 * THE PREVIEWS, one per option, keyed \`<decision>.<option>\` (a missing or
 * orphaned one is a type error). Each draws the real production components
 * inside a Frame, the lab's only real viewport, at the width it is judged at.
 *
 * TODO: what each preview draws, and anything its drawing is not (a stand-in
 * photograph, a fixture instead of live data).
 */
const PREVIEWS: PreviewsFor<typeof ${CONST}> = {
  "first.today": (
    <Frame id="${id}-first-today" w={375} h={760} title="As today">
      <p className="p-4 text-sm">TODO: draw production as it is.</p>
    </Frame>
  ),
  "first.candidate": (
    <Frame id="${id}-first-candidate" w={375} h={760} title="The candidate">
      <p className="p-4 text-sm">TODO: draw the candidate.</p>
    </Frame>
  ),
};

export function ${pascal}Board() {
  return <ExplorationBoard spec={${CONST}} previews={PREVIEWS} />;
}
`;

mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "spec.ts"), spec);
writeFileSync(join(dir, "board.tsx"), board);

const rel = `src/app/(dev)/design/sandbox/${id}/`;
console.log(`Wrote ${rel}spec.ts and ${rel}board.tsx; no other file changed.

Next:
  1. Write every TODO: pnpm vitest run "src/app/(dev)/design/sandbox/registry.test.ts" lists what is left.
  2. Draw each preview on the real components; add a decision per question, each drawn.
  3. pnpm dev, then /design/lab/${id}, and pnpm lab:smoke --board ${id} --base <server>.`);
