/**
 * THE WORDS A CALL IS ANSWERED IN (calls-desk, 2026-10-07): the tokens of the desk message's `calls:` line, which
 * `review-message.ts` composes and `scripts/lab-review.mjs` reads (it mirrors these, and `lab-review.test.ts` holds the
 * round trip). Pure, with no data, so the composer can take them without the calls file.
 *
 *   calls: X2=recommended; X9=alt2 "only for weddings"; X12=own "a guestbook later"; L2=change "a week of grace"; R1=keep
 *
 * A question takes its recommendation, one of its alternatives (`alt1` is the first) or his own words; a call is kept
 * or changed. ★ A CHANGE AND HIS OWN ANSWER ARE THEIR WORDS: either without a note says nothing anyone can act on, so
 * the desk never sends one and the transcript refuses one.
 */

export const KEEP = "keep";
export const CHANGE = "change";
export const RECOMMENDED = "recommended";
export const OWN = "own";

export type CallKind = "question" | "call";

/** The answer that picks a question's alternative at `index` (0-based): `alt1` is the first. */
export const altAnswer = (index: number) => `alt${index + 1}`;

/** The 0-based alternative an `altN` answer picks, or null when it is not one. */
export function altIndex(answer: string): number | null {
  const m = /^alt([1-9][0-9]*)$/.exec(answer);
  return m ? Number(m[1]) - 1 : null;
}

/** Every answer an entry takes, in the order the desk offers them. */
export function answersFor(entry: {
  kind: CallKind;
  alternatives?: readonly string[];
}): string[] {
  return entry.kind === "call"
    ? [KEEP, CHANGE]
    : [
        RECOMMENDED,
        ...(entry.alternatives ?? []).map((_, i) => altAnswer(i)),
        OWN,
      ];
}

/** Whether an answer is nothing without its words. */
export const needsWords = (answer: string) =>
  answer === CHANGE || answer === OWN;
