/**
 * THE WORDS THIS APP USES (the Library x Lab round, 2026-09-15), and the ones
 * it retired. Six words used to name three things (library, reference,
 * sandbox, lab, desk, board/touchpoint/ruling); these are the ones that stay,
 * each with the one sentence that tells it from its neighbours. Rendered at
 * /design/library/glossary and searched by the sidebar.
 *
 * A term leads with the word a STRANGER would use and names the code's word
 * after it (the sweep, 2026-09-16): the ids in board-spec.ts stay `candidates`,
 * `asks` and `departures` whatever the surface calls them, and a reader who
 * meets either word here finds the other.
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
      "Everything that binds or informs design work: the rules, the policies and landmines, the guidance, Will's rulings, the doctrine, the components with their contracts, the record.",
    href: "/design/library",
  },
  {
    term: "Lab",
    meaning:
      "Everything exploratory: the desk, the boards, the proposals, the tracks, the kit, the tools. Nothing here binds anyone.",
    href: "/design/lab",
  },
  {
    term: "Rule",
    meaning:
      "One of the bible's rules, Will's, global: it always binds. The bible changes only by his ruling.",
    href: "/design/library/rules",
  },
  {
    term: "Contract",
    meaning:
      "A component's functional guard (a test that opens with @contract-for): structure, accessibility, single sources, its engine; never its look. Component-exclusive: it binds you for the components under a path you own.",
    href: "/design/library",
  },
  {
    term: "Policy",
    meaning:
      "An agent-written test that holds a line across the tree (no em-dashes, one source of truth, the CSS layers). The gate is red without it; provisional, so a policy no bible rule cites is a finding.",
    href: "/design/library/policies",
  },
  {
    term: "Landmine",
    meaning:
      "A ★ in a doc: a silent breakage if reverted. Know it before you touch its surface; it is never a design rule.",
    href: "/design/library/policies#landmines",
  },
  {
    term: "Guidance",
    meaning:
      "The craft stack and the skills: the default you leave on purpose, never a wall.",
    href: "/design/library/guidance",
  },
  {
    term: "Ruling",
    meaning:
      "What Will said, verbatim and dated. A ruling becomes a bible rule, a program line or guidance; until it does, it is still his word.",
    href: "/design/library/rulings",
  },
  {
    term: "Doctrine",
    meaning:
      "The system docs' chapters, rendered: what exists and why. Precedent, which a better exploration may rebuild.",
    href: "/design/library/doctrine/design-system",
  },
  {
    term: "Proposal",
    meaning:
      "A board's settled argument, a docs/specs document. Not law until Will rules on it.",
    href: "/design/lab/proposals",
  },
  {
    term: "Component, family, specimen, variant",
    meaning:
      "A component is a production file the library indexes; a family is the gallery it belongs to; a specimen is one rendered instance; a variant is an axis the component exposes.",
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
      "An idea (the code calls it a candidate) is one answer the board argues; a question (an ask) is one Will answers in a word; a departure is a rule or a ruling the idea breaks, and what that costs; an asset is what the design needs Will to make.",
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
      "The kit's viewport: a real viewport's pixels on a real ground, 1:1 by default. Only the kit's; the gallery's frame is a specimen.",
  },
];

/** Words retired with the round; a page or a doc that uses one is stale. */
export const RETIRED: { term: string; now: string }[] = [
  {
    term: "Reference",
    now: "the Library (the live components and the tokens)",
  },
  {
    term: "Workbench",
    now: "the shell (the top bar, the sidebar, the content column)",
  },
  { term: "Sandbox", now: "the Lab; the directory keeps its name this round" },
  {
    term: "Touchpoint",
    now: "a board (in the UI); the registry file keeps its name",
  },
  { term: "Variants (of a board)", now: "ideas (the spec's `candidates`)" },
  {
    term: "The mono sheet",
    now: "the real tokens; there is one design language",
  },
];
