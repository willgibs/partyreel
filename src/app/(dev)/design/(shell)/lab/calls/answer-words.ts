import { altIndex, CHANGE, KEEP, OWN, RECOMMENDED } from "@/lib/calls/answers";
import type { CallEntry } from "@/lib/calls/calls";

/**
 * AN ANSWER IN THE DESK'S WORDS (calls-desk): what a token on the `calls:` line means, said the way the Calls place
 * says it, for a summary that reads back what he picked. One home, so the place and the end of the walk never
 * disagree on a word.
 */
export function answerWords(entry: CallEntry, answer: string): string {
  if (entry.kind === "call") {
    if (answer === KEEP) return "Keep";
    if (answer === CHANGE) return "Change";
    return answer;
  }
  if (answer === RECOMMENDED) return "Recommended";
  if (answer === OWN) return "In your own words";
  const i = altIndex(answer);
  const alt = i === null ? undefined : entry.alternatives[i];
  return alt ? `Or: ${alt}` : answer;
}
