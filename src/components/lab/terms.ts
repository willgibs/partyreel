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

/** A stretch of a line: plain words, or a coined term as the line spells it. */
export type Piece = { text: string; term?: Term };

/**
 * A LINE CUT AT THE TERMS IT USES, so the step can mark each one where it
 * appears (lab-focus, 2026-09-29: the terms are one press away in the About
 * panel, and a light hint on the words themselves). The same match as
 * `termsIn`, blind to case and to the apostrophe's shape and never inside
 * another word, and the line's own spelling is kept. Each term is marked the
 * first time the line says it; where two overlap, the longer wins.
 */
export function splitTerms(
  text: string,
  terms: readonly Term[] | undefined,
): Piece[] {
  if (!text || !terms?.length) return [{ text }];
  const found: { at: number; end: number; term: Term }[] = [];
  for (const term of terms) {
    const pattern = escape(term.term).replace(/['‘’]/g, "['‘’]");
    const m = new RegExp(
      `(?<![\\p{L}\\p{N}])${pattern}(?![\\p{L}\\p{N}])`,
      "iu",
    ).exec(text);
    if (m) found.push({ at: m.index, end: m.index + m[0].length, term });
  }
  found.sort((a, b) => a.at - b.at || b.end - a.end);
  const out: Piece[] = [];
  let from = 0;
  for (const f of found) {
    if (f.at < from) continue;
    if (f.at > from) out.push({ text: text.slice(from, f.at) });
    out.push({ text: text.slice(f.at, f.end), term: f.term });
    from = f.end;
  }
  if (from < text.length) out.push({ text: text.slice(from) });
  return out;
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
