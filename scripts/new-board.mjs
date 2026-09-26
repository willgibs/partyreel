#!/usr/bin/env node
/**
 * SCAFFOLD A BOARD (the Library x Lab round, 2026-09-15; a catalog by default
 * since the revamp, 2026-09-16).
 *
 *   node scripts/new-board.mjs <id> "<title>"            a catalog board
 *   node scripts/new-board.mjs <id> "<title>" --spots    one idea, many real places
 *   node scripts/new-board.mjs <id> "<title>" --plain    asks and sections only
 *
 * ★ A CATALOG IS THE DEFAULT SHAPE: a track "should return design catalogs of ideas to
 * ship in the lab" that he can "kill, refine, or promote the best to the
 * Library", in a "gallery view by default, notes per item". A board that is
 * genuinely one question with no candidates passes `--plain` and says so; every
 * other board starts here.
 *
 * `--spots` is the second shape, for an exploration where ONE thing is applied
 * in many real places (the brand voice is the type case: a voice is not a
 * picture, it is seven headers, a guest screen and an email preview). The cards
 * are still the catalog; the evidence is the same places under two of them.
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
 * Node builtins only, and it refuses to overwrite: a board that already exists
 * is a mistake in the command, never an invitation.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const argv = process.argv.slice(2);
const [id, title] = argv.filter((a) => !a.startsWith("--"));
const shape = argv.includes("--plain")
  ? "plain"
  : argv.includes("--spots")
    ? "spots"
    : "catalog";
const die = (m) => {
  console.error(m);
  process.exit(1);
};

if (!id || !title)
  die(
    'usage: node scripts/new-board.mjs <id> "<title>" [--spots | --plain]   (id is kebab-case)',
  );
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

const catalog = shape !== "plain";

// ★ THE UNION IS WRITTEN INLINE, NOT BEHIND A NAMED TYPE. registry.test.ts
// keeps JSX out of a spec with the heuristic /<[A-Z][A-Za-z]*[\s/>]/, and
// `Candidate<SectionId>` reads to it exactly like an opening tag. A union of
// string literals opens with `<"`, which it cannot mistake for one.
const SECTION_IDS = catalog
  ? `"catalog" | ${shape === "spots" ? '"spots"' : '"compare"'} | "pages"`
  : "";

/* ── The catalog's own blocks ─────────────────────────────────────────────── */

const ITEMS_BLOCK = `/**
 * THE CATALOG, WRITTEN OUT.
 *
 * ★ NEVER A \`.map\` OVER ANOTHER MODULE. \`pnpm lab:review\` reads a spec as TEXT
 * (so a board's asks can be read with no build step) and resolves
 * \`candidates: ITEMS\` one hop to this const; a mapped list reads as no items at
 * all and every ruling on a card is refused. Write them out.
 *
 * Each card is a finished idea somebody could prefer for a reason they could
 * say out loud, not a knob setting. Two that differ only in a number are one.
 */
const ITEMS: readonly Candidate<${SECTION_IDS}>[] = [
  {
    id: "TODO-a",
    name: "TODO: its name, one or two words",
    one: "TODO: what it is, in words a stranger knows. One line, under 120 characters.",
    verdict: "ship",
    facts: [
      ["TODO", "the number that decides it"],
      ["TODO", "what it costs"],
    ],
    recommended: true,
    rationale: "TODO: why it might win. Folded on the card, so it may be long.",
  },
  {
    id: "TODO-b",
    name: "TODO: the second",
    one: "TODO: what choosing this one would do instead.",
    verdict: "refine",
    facts: [["TODO", "the same fact, so the cards are comparable"]],
    rationale: "TODO: what it is good at, and what it is not.",
  },
  {
    id: "TODO-c",
    name: "TODO: the third",
    one: "TODO: the one that is here to be turned down, built anyway.",
    verdict: "kill",
    facts: [["TODO", "the same fact again"]],
    rationale:
      "TODO: an idea you have seen and turned down stays turned down; one you only read about comes back next quarter.",
  },
];

const CARDS = ITEMS.map((i) => ({ id: i.id, label: i.name }));
`;

const CATALOG_CONTROLS = `  controls: [
    {
      id: "canvas",
      label: "Canvas",
      options: [
        { id: "desktop", label: "1440" },
        { id: "phone", label: "375" },
      ],
      default: "desktop",
    },
    {
      id: "pick",
      label: "Pick",
      // Nothing picked is a state of its own, and pressing the picked card
      // returns here (Will, 2026-09-16).
      options: [{ id: "none", label: "Nothing picked" }, ...CARDS],
      default: "none",
      clearable: true,
    },
    { id: "compare-a", label: "A", options: CARDS, default: ITEMS[0].id },
    { id: "compare-b", label: "B", options: CARDS, default: ITEMS[1].id },
  ],
`;

const PLAIN_CONTROLS = `  controls: [
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
`;

const CATALOG_SECTIONS = `  sections: [
    {
      id: "catalog",
      title: "The catalog",
      lede: "TODO: one line saying what each card carries, so nothing has to be switched to compare them.",
    },
    {
      id: "compare",
      title: "Any two, side by side",
      lede: "Press A on one card and B on another. The seam is the difference.",
    },
    {
      id: "pages",
      title: "The real pages",
      lede: "The production routes wearing the picked card, so the choice is judged where it ships.",
      argument: [
        "TODO: the paragraph for the reader who disagrees. Collapsed, and it does not count against the reading budget.",
      ],
    },
  ],
`;

const SPOT_SECTIONS = `  sections: [
    {
      id: "catalog",
      title: "The catalog",
      lede: "TODO: one line saying what each card is, in words a stranger knows.",
    },
    {
      id: "spots",
      title: "The same places, under two of them",
      lede: "Press A on one card and B on another. Every real place below is drawn twice.",
    },
    {
      id: "pages",
      title: "The real pages",
      lede: "The production routes wearing the picked card, so the choice is judged where it ships.",
      argument: [
        "TODO: the paragraph for the reader who disagrees. Collapsed, and it does not count against the reading budget.",
      ],
    },
  ],
`;

const PLAIN_SECTIONS = `  sections: [
    {
      id: "TODO",
      title: "TODO",
      lede: "TODO: what the evidence shows, in one line.",
      argument: ["TODO: the paragraph for the reader who disagrees. Collapsed."],
    },
  ],
`;

const CATALOG_ASK = `  /**
   * ★ THE WINNER IS AN ORDINARY ASK (the stepped review, 2026-09-16), and it is
   * the first one. "Explore N variants of X" ends in ONE of them winning, so
   * the ask mirrors the pick control, offers every card plus "none", and the
   * ledger line is \`${id}=<card>\` or \`${id}=none "new directions: ..."\`.
   * The review draws the cards themselves as its tiles; a card verdict stays as
   * optional feedback, which is the refine exit.
   *
   * ★ AND EVERY OTHER ASK IS FOR WHAT SURVIVES THE CHOICE, the way the palette's
   * accent reach survives its twelve palettes. An ask that only exists once the
   * winner went a certain way declares \`after\` and is not asked until it does.
   */
  asks: [
    {
      id: "${id}",
      question: "TODO: which of these should the site wear?",
      context:
        "TODO: what the thing is and where it lives on the site, for someone who has not read the board.",
      // ★ WRITTEN OUT, like ITEMS and for the same reason: \`pnpm lab:review\`
      // reads a spec as TEXT, and a \`.map\` over the cards reads as no options
      // at all, so every answer to this question would be refused.
      options: [
        { id: "TODO-a", label: "TODO: its name", means: "TODO: what it is." },
        { id: "TODO-b", label: "TODO: the second", means: "TODO: what it is." },
        { id: "TODO-c", label: "TODO: the third", means: "TODO: what it is." },
        {
          id: "none",
          label: "None of these: new directions",
          means: "TODO: what a new round would explore instead.",
        },
      ],
      recommended: "TODO-a",
      because: "TODO: why the board recommends it, in plain words.",
      lands: "TODO: what the answer decides platform-wide, in words.",
      evidence: "catalog",
      control: "pick",
    },
    {
      id: "TODO",
      question: "TODO: what is still open once a card has won?",
      context:
        "TODO: what the thing is and where it lives on the site, for someone who has not read the board.",
      look: "TODO: which section, which switch, what to compare.",
      options: [
        { id: "yes", label: "TODO: the option in words", means: "TODO: what choosing it does." },
        { id: "no", label: "TODO: the other option", means: "TODO: what choosing it does." },
      ],
      recommended: "yes",
      because: "TODO: why the board recommends it, in plain words.",
      evidence: "pages",
      // Delete this line if the question stands whichever card wins.
      after: { ask: "${id}", option: "TODO-a" },
    },
  ],
`;

const PLAIN_ASK = `  asks: [
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
`;

const specImports = catalog
  ? `import { type Candidate, defineBoard } from "@/components/lab/board-spec";`
  : `import { defineBoard } from "@/components/lab/board-spec";`;

const spec = `${specImports}
${catalog ? `\n${ITEMS_BLOCK}` : ""}
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

${catalog ? CATALOG_ASK : PLAIN_ASK}
${
  catalog
    ? `  candidates: ITEMS,

  catalog: {
    section: "catalog",
    control: "pick",
    compare: ["compare-a", "compare-b"],
    // pick-one: the cards are variants of one thing and ONE wins, decided by
    // the winner ask above. A catalog whose cards are each their own proposal
    // is "keep-any" instead, and then every card takes a verdict; add
    // walk: "one-at-a-time" when a card needs looking AT rather than across.
    mode: "pick-one",
    winner: "${id}",
    // The real surface drawn under the tiles, wearing whatever is being shown.
    stage: "pages",
  },
`
    : `  candidates: [
    {
      id: "TODO",
      name: "TODO",
      recommended: true,
      rationale: "TODO: what it is and why it might win.",
    },
  ],
`
}
  departures: [],
  assets: [],

${shape === "spots" ? SPOT_SECTIONS : catalog ? CATALOG_SECTIONS : PLAIN_SECTIONS}
${catalog ? CATALOG_CONTROLS : PLAIN_CONTROLS}
  lookFirst: [
    { section: "${catalog ? "catalog" : "TODO"}", note: "TODO: where to look first, and why." },
  ],

  links: {},
});
`;

const CATALOG_BOARD = `"use client";

import {
  BoardPage,
  Catalog,
  CellLabel,
  CompareTwo,
  type Mode,
} from "@/components/lab";

import { ${CONST} } from "./spec";

/**
 * ${title.toUpperCase()}.
 *
 * What the board ARGUES is in spec.ts. What is here is the evidence for each
 * declared section, as a function of the declared state, and nothing else: no
 * header, no index, no asks, no meta panel. The template owns the order.
 *
 * ★ EVERY PREVIEW IS THE REAL THING, never a picture of one, and every switch
 * on a card is page-wide: Pick sets the board, A and B set the comparison
 * below, and the reviewer's row rules the card where it stands.
 */
export function ${pascal}Board() {
  return (
    <BoardPage
      spec={${CONST}}
      evidence={(id, state, api) => {
        const mode = (state.canvas ?? "desktop") as Mode;
        switch (id) {
          case "catalog":
            return (
              <Catalog
                spec={${CONST}}
                state={state}
                setState={api.setState}
                ground="cinema"
                render={(candidate) => (
                  <div className="p-3 text-sm">
                    TODO: {candidate.name}, built from the real components.
                  </div>
                )}
              />
            );
          case "compare":
            return (
              <CompareTwo
                spec={${CONST}}
                state={state}
                cols={mode === "desktop" ? 2 : 1}
                render={(candidate) => (
                  <div className="rounded-lg border border-border p-4 text-sm">
                    TODO: {candidate.name}, bigger than the card shows it.
                  </div>
                )}
              />
            );
          case "pages":
            return (
              <CellLabel className="max-w-2xl">
                TODO: the production routes at true pixels, wearing the picked
                card. Frame or FrameRow from the kit; /design/lab/kit has both.
              </CellLabel>
            );
          default:
            return null;
        }
      }}
    />
  );
}
`;

const SPOTS_BOARD = `"use client";

import {
  BoardPage,
  Catalog,
  CellLabel,
  type Mode,
  type Spot,
  SpotCompare,
} from "@/components/lab";

import { ${CONST} } from "./spec";

/**
 * ${title.toUpperCase()}.
 *
 * ★ THE SPOT SHAPE: one idea, applied in many real places. The cards are still
 * the catalog and are ruled card by card; the evidence is the SAME places drawn
 * twice, under A and under B, because a thing that lives in seven places is
 * judged by reading one place at a time rather than by reading a card.
 */
const SPOTS: readonly Spot[] = [
  {
    id: "TODO-one",
    name: "TODO: the place, in words a stranger knows",
    note: "TODO: what to read HERE rather than anywhere else.",
  },
  { id: "TODO-two", name: "TODO: the second place" },
];

export function ${pascal}Board() {
  return (
    <BoardPage
      spec={${CONST}}
      evidence={(id, state, api) => {
        const mode = (state.canvas ?? "desktop") as Mode;
        switch (id) {
          case "catalog":
            return (
              <Catalog
                spec={${CONST}}
                state={state}
                setState={api.setState}
                render={(candidate) => (
                  <div className="p-3 text-sm">TODO: {candidate.name}</div>
                )}
              />
            );
          case "spots":
            return (
              <SpotCompare
                spec={${CONST}}
                state={state}
                spots={SPOTS}
                cols={mode === "desktop" ? 2 : 1}
                render={(spot, candidate) => (
                  <div className="rounded-lg border border-border p-4 text-sm">
                    TODO: {spot.name}, under {candidate.name}.
                  </div>
                )}
              />
            );
          case "pages":
            return (
              <CellLabel className="max-w-2xl">
                TODO: the production routes at true pixels, wearing the picked
                card. Frame or FrameRow from the kit; /design/lab/kit has both.
              </CellLabel>
            );
          default:
            return null;
        }
      }}
    />
  );
}
`;

const PLAIN_BOARD = `"use client";

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

const board =
  shape === "spots"
    ? SPOTS_BOARD
    : shape === "catalog"
      ? CATALOG_BOARD
      : PLAIN_BOARD;

mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "spec.ts"), spec);
writeFileSync(join(dir, "board.tsx"), board);

const SHAPE_NOTE = {
  catalog:
    "a CATALOG: cards ruled keep / refine / kill, a Pick that drives the page, A and B for any two.",
  spots:
    "a SPOT board: the cards are the catalog, the evidence is the same real places under two of them.",
  plain:
    "PLAIN: asks and sections, no catalog. Say in the board why it has none.",
};

console.log(`Wrote src/app/(dev)/design/sandbox/${id}/{spec.ts,board.tsx}
Shape: ${SHAPE_NOTE[shape]}

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
names the one that is over and by how much. Build the tools your evidence needs
in the kit (/design/lab/kit), never a local copy in this directory, and keep the
page under LIMITS.readingWords: pnpm lab:smoke weighs it.`);
