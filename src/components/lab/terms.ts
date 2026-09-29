import type { Opening, Term } from "./board-spec";

/**
 * WHICH OF A BOARD'S COINED TERMS A STRETCH OF ITS WORDS USES (the context
 * layer, 2026-09-29: "targeted terminology within a spot example without
 * really introducing more of the context"). The step glosses exactly these,
 * so a nickname is explained on the screen that says it.
 *
 * ★ A WHOLE-WORD MATCH, BLIND TO CASE AND TO THE APOSTROPHE'S SHAPE. "Lit
 * column" at the head of a sentence is the lit column, a board that writes
 * the typographic ’ in one line and the plain ' in another still means one
 * word, and "roll" must not light up inside "enrolled". A term is the bare
 * phrase where it can be ("roll", so "the roll" and "her roll" both find it),
 * with its article only where the bare word also means something else ("the
 * look", since "look" is also a verb on the same board).
 */
const fold = (s: string) => s.replace(/[‘’]/g, "'").toLowerCase();

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function termsIn(
  texts: readonly (string | undefined)[],
  terms: readonly Term[] | undefined,
): Term[] {
  if (!terms?.length) return [];
  const body = fold(texts.filter(Boolean).join("\n"));
  return terms.filter((t) =>
    new RegExp(
      `(^|[^\\p{L}\\p{N}])${escape(fold(t.term))}(?=$|[^\\p{L}\\p{N}])`,
      "u",
    ).test(body),
  );
}

/** What an ask shows in words, whichever side reads it (the spec's ask, or the step built from it). */
export type AskWords = {
  where?: readonly string[];
  when?: string;
  question: string;
  context?: string;
  lands?: string;
  matters?: string;
  because?: string;
  look?: string;
  options: readonly {
    label: string;
    means?: string;
    gains?: string;
    costs?: string;
  }[];
};

/** Every word an ask's step shows before and around its options. */
export function askTexts(ask: AskWords): string[] {
  return [
    ...(ask.where ?? []),
    ask.when,
    ask.question,
    ask.context,
    ask.lands,
    ask.matters,
    ask.because,
    ask.look,
    ...ask.options.flatMap((o) => [o.label, o.means, o.gains, o.costs]),
  ].filter((t): t is string => Boolean(t));
}

/** Every word a board's opening shows. */
export function openingTexts(opening: Opening | undefined): string[] {
  if (!opening) return [];
  return [
    opening.about,
    ...(opening.settled ?? []),
    ...(opening.earlier ?? []),
  ];
}
