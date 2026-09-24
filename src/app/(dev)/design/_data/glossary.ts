/**
 * THE WORDS THIS APP USES, and the ones it retired: each with the one sentence
 * that tells it from its neighbours. Rendered at /design/library/glossary and
 * searched by the palette.
 *
 * A term leads with the word a STRANGER would use and names the code's word
 * after it: the ids in board-spec.ts stay `candidates`, `asks` and
 * `departures` whatever the surface calls them, and a reader who meets either
 * word here finds the other.
 */
export type Term = {
  term: string;
  meaning: string;
  /** Where the thing lives. */
  href?: string;
};

export const GLOSSARY: Term[] = [
  {
    term: "Library",
    meaning:
      "What exists, and what design starts from: the brand kit, the component catalog and the bible's ten principles.",
    href: "/design/library",
  },
  {
    term: "Lab",
    meaning:
      "Everything exploratory: the desk, the boards, the proposals, the tracks, the kit, the tools.",
    href: "/design/lab",
  },
  {
    term: "Brand kit",
    meaning:
      "The live tokens (colour, type, radius, motion, elevation and light), each rendered from the variable every surface reads.",
    href: "/design/library/foundations",
  },
  {
    term: "Catalog",
    meaning:
      "Every component with a specimen: its file, what it is for, its variants and config panel, and the test that pins its behavior.",
    href: "/design/library",
  },
  {
    term: "Principle",
    meaning:
      "One of the bible's ten: a statement and its reason, the guidance every design starts from. Will owns the wording, so an idea that would change one is raised with him.",
    href: "/design/library/rules",
  },
  {
    term: "Test",
    meaning:
      "What has to keep working: data, privacy, accessibility, performance, security, the CSS and the build, content links, the lab boundary, copy without em-dashes. A failing test names what broke; a look is shown by the Library and production, never pinned by a test.",
  },
  {
    term: "Proposal",
    meaning:
      "A standing board's argument: its asks and the answer it recommends for each.",
    href: "/design/lab",
  },
  {
    term: "Component, family, specimen, variant",
    meaning:
      "A component is a production file the catalog shows; a family is the gallery it sits in; a specimen is one rendered instance; a variant is an axis the component exposes.",
    href: "/design/library",
  },
  {
    term: "Board",
    meaning:
      "One open question and the ideas answering it, on the real tokens. A board is two files: its spec (the question, the answer so far, the questions for Will, the ideas, the sections) and its evidence.",
    href: "/design/lab",
  },
  {
    term: "Idea, question, departure, asset",
    meaning:
      "An idea (the code calls it a candidate) is one answer the board argues; a question (an ask) is one Will answers in a word; a departure is a principle or a shipped decision the idea departs from, and what that costs; an asset is what the design needs Will to make.",
  },
  {
    term: "The desk",
    meaning:
      "Every standing board, what it asks, and what waits on Will; the review session starts here.",
    href: "/design/lab",
  },
  {
    term: "Track",
    meaning:
      "An lp/<track> branch with a manifest under docs/tracks: what it claims, what it hands off, what it records.",
    href: "/design/lab/tracks",
  },
  {
    term: "Kit",
    meaning:
      "The pieces every board composes: the dock, the stage, the frame, the compare, the specimen.",
    href: "/design/lab/kit",
  },
  {
    term: "Tool",
    meaning:
      "A permanent diagnostic: the motion tuner, the reel style browser, the stream probe, the error boundary.",
    href: "/design/lab/tools/motion",
  },
  {
    term: "Stage",
    meaning:
      "The kit's viewport: a real viewport's pixels on a real ground, 1:1 by default. Only the kit's; the catalog's frame is a specimen.",
  },
];

/** Words that left the Library; older comments may still use them. */
export const RETIRED: { term: string; now: string }[] = [
  {
    term: "Reference",
    now: "the Library (the catalog and the brand kit)",
  },
  {
    term: "Workbench",
    now: "the shell (the top bar, the sidebar, the content column)",
  },
  { term: "Sandbox", now: "the Lab; the directory keeps its name" },
  {
    term: "Touchpoint",
    now: "a board (in the UI); the registry file keeps its name",
  },
  { term: "Variants (of a board)", now: "ideas (the spec's `candidates`)" },
  {
    term: "The mono sheet",
    now: "the real tokens; there is one design language",
  },
  { term: "Foundations", now: "the brand kit (the route keeps its name)" },
  {
    term: "Contract, policy",
    now: "a test: the tests say what has to keep working, and a catalog entry names the one that pins its behavior",
  },
  {
    term: "Ruling",
    now: "a pick: the best of what one round drew, built into production as a working version",
  },
  {
    term: "Guidance, doctrine, landmine",
    now: "the design recipe on the Library's home, the system docs under docs/systems, and a note beside the code it guards",
  },
];
