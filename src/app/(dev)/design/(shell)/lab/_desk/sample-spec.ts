import { defineBoard } from "@/components/lab/board-spec";

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
 * Delete this the round the boards carry their own specs.
 */
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
  candidates: [
    {
      id: "as-data",
      name: "The asks as data",
      rationale:
        "The board declares its asks; the desk, the session and the ledger all read the one declaration.",
      recommended: true,
    },
    {
      id: "as-prose",
      name: "The asks as prose",
      rationale:
        "The board writes its asks into its own page, and a reviewer answers in chat. What every board does today.",
    },
  ],
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
  lookFirst: [
    {
      section: "walk",
      note: "Answer the three, then read the message the session composes.",
    },
  ],
  links: { bible: [] },
});
