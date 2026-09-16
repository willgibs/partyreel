import { type Candidate, defineBoard } from "@/components/lab/board-spec";

/**
 * THE DRY RUN (the Library x Lab round, 2026-09-15). The board registry is
 * empty until the kit track lands the first specs, so without this the review
 * session could not be seen at all: no asks, no walk, nothing to judge. This
 * is one spec-shaped board, clearly marked, that the desk offers as a dry run
 * and the tests use as their fixture. ONE fixture, two uses, so the thing the
 * session is proven against is the thing a reader can walk.
 *
 * Its id is deliberately not a standing board, so the message it composes is
 * refused by `pnpm lab:review` ("sample" is not a standing board). That is the
 * refusal path, demonstrated rather than described.
 *
 * ★ IT DECLARES A CATALOG (the revamp, 2026-09-16), so the dry run walks an
 * items step and `lab-review.test.ts` holds the scanner to a real `const ITEMS`
 * on disk. The shape here IS the shape every catalog board takes: the items
 * written out as a `const`, `candidates: ITEMS`, a clearable pick control whose
 * options are the ids, and two compare controls over the same ids.
 *
 * Delete this the round the boards carry their own specs.
 */

/**
 * ★ THE ITEMS ARE WRITTEN OUT, NEVER MAPPED. `pnpm lab:review` reads a spec as
 * TEXT rather than importing it (so a board's asks can be read with no build
 * step), and it resolves `candidates: ITEMS` one hop to a `const` in the same
 * file. A `.map` over another module reads as no items at all, so the script
 * refuses it and says to write them out.
 */
const ITEMS: readonly Candidate<"walk" | "ledger">[] = [
  {
    id: "as-data",
    name: "The asks as data",
    one: "The board declares its asks; the desk, the session and the ledger read the one declaration.",
    verdict: "ship",
    facts: [
      ["Files a board is", "two"],
      ["Who reads the asks", "three surfaces"],
    ],
    rationale:
      "The board declares its asks; the desk, the session and the ledger all read the one declaration.",
    recommended: true,
  },
  {
    id: "as-prose",
    name: "The asks as prose",
    one: "The board writes its asks into its own page and a reviewer answers in chat.",
    verdict: "kill",
    facts: [["Who reads the asks", "whoever opens the board"]],
    rationale:
      "The board writes its asks into its own page, and a reviewer answers in chat. What every board does today.",
  },
  {
    id: "as-a-form",
    name: "The asks as a form",
    one: "Every decision on the board becomes a field, and the review is a questionnaire.",
    verdict: "refine",
    facts: [["Fields on a long board", "thirty or more"]],
    rationale:
      "Everything is captured and nothing is read: a form asks for agreement rather than for a judgement.",
  },
];
export const SAMPLE_BOARD = defineBoard({
  id: "sample",
  title: "A sample board",
  question: "How does a review read when a board carries its asks as data?",
  round: {
    n: 1,
    date: "2026-09-15",
    changed:
      "The first spec-shaped board, written so the session can be walked before the real boards carry specs.",
  },
  context:
    "Every standing board still argues in its own page. This one exists to show the shape a board takes once its asks, its verdict and its evidence are declared rather than drawn.",
  verdict: {
    recommendation:
      "Answer in one word per ask, and leave the reasons to the notes.",
    because:
      "A ruling that fits in a word can be recorded, counted and reversed; a paragraph cannot. The note beside it carries everything the word leaves out.",
    overrule:
      "An ask that cannot be answered in a word is the wrong ask, and splitting it is cheaper than widening the grammar.",
  },
  asks: [
    {
      id: "grain",
      question: "How many asks should one board carry?",
      context:
        "An ask is one decision a board hands you, answered by picking an option. A board with too many turns a review into a form; one with too few hides decisions inside its argument.",
      look: "The walk section: the three asks here, one at a time, are the sample.",
      options: [
        {
          id: "three",
          label: "Three",
          means: "The board keeps only its three biggest decisions.",
        },
        {
          id: "five",
          label: "Five",
          means:
            "Five fits one sitting and still covers a board's real decisions.",
        },
        {
          id: "as-many-as-it-takes",
          label: "As many as it takes",
          means: "Every decision gets an ask, however many that is.",
        },
      ],
      recommended: "five",
      because:
        "Five fits one sitting and still covers a board's real decisions; past that a review turns into a form.",
      overrule: "A board whose asks are all one-liners can carry more.",
      evidence: "walk",
    },
    {
      id: "default",
      question: "Should an ask carry a recommendation?",
      context:
        'The recommendation is the board\'s own pick, marked "the board says" on the option. Agreeing with it is the cheapest answer.',
      look: "This ask: one option carries the mark, the other does not.",
      options: [
        {
          id: "always",
          label: "Always",
          means: "Every ask names the option the board would pick.",
        },
        {
          id: "never",
          label: "Never",
          means: "The options are offered as a neutral menu.",
        },
      ],
      recommended: "always",
      because:
        "A board that has done the work has an opinion, and saying it is faster to disagree with than a neutral menu.",
      evidence: "walk",
    },
    {
      id: "notes",
      question: "Where do the reasons go?",
      context:
        "A ruling is one option; the reason you picked it has to live somewhere the next round can read.",
      look: "The ledger section: the note field under every ask, and the line the session composes.",
      options: [
        {
          id: "the-note",
          label: "The note under the ask",
          means: "It rides the answer into the ledger, beside the option.",
        },
        {
          id: "the-board",
          label: "A note on the whole board",
          means: "One note per board, at the end of the session.",
        },
        {
          id: "chat",
          label: "Chat",
          means: "Said in the conversation, and not recorded with the answer.",
        },
      ],
      recommended: "the-note",
      because:
        "The note rides the answer into the ledger, so the reason and the ruling stay together for ever.",
      evidence: "ledger",
    },
  ],
  candidates: ITEMS,
  departures: [],
  assets: [],
  sections: [
    {
      id: "walk",
      title: "The walk",
      lede: "One ask at a time, in board order, with the case for the recommendation beside it.",
    },
    {
      id: "ledger",
      title: "The ledger",
      lede: "What the session composes, and what the transcript writes.",
    },
  ],
  catalog: {
    section: "walk",
    control: "shape",
    compare: ["compareA", "compareB"],
  },

  controls: [
    {
      id: "shape",
      label: "Shape",
      // Nothing picked is a state of its own, and picking the picked option
      // returns here (Will, 2026-09-16).
      options: [
        { id: "none", label: "Nothing picked" },
        ...ITEMS.map((i) => ({ id: i.id, label: i.name })),
      ],
      default: "none",
      clearable: true,
    },
    {
      id: "compareA",
      label: "A",
      options: ITEMS.map((i) => ({ id: i.id, label: i.name })),
      default: ITEMS[0].id,
    },
    {
      id: "compareB",
      label: "B",
      options: ITEMS.map((i) => ({ id: i.id, label: i.name })),
      default: ITEMS[1].id,
    },
  ],

  lookFirst: [
    {
      section: "walk",
      note: "Rule on the three, answer the three asks, then read the message the session composes.",
    },
  ],
  links: { bible: [] },
});
