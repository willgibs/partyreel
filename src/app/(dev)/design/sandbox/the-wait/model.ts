import { DEVELOP } from "./fixtures";

/**
 * THE FOUR MODELS, AS THE WORDS EACH ONE PUTS IN FRONT OF A GUEST. The first
 * decision is the model; every later one is drawn wearing it (`exploration.ts`'s
 * function previews), so a model is data the drawings read: what the album
 * calls the wait, the clock it names, the word on her own waiting photos, and
 * what an arrival says.
 *
 *  - `questions`, as built: two answers, and the wait says its reason
 *    (approval's words, the develop's words).
 *  - `styles`: one named album; the cover says the style.
 *  - `time`: one question of time; every wait is "developing".
 *  - `apart`: approval is the host's filter, never a wait: a held album runs
 *    live with hers in place, only a develop waits.
 */
export type ModelId = "questions" | "styles" | "time" | "apart";

export const MODELS: readonly ModelId[] = [
  "questions",
  "styles",
  "time",
  "apart",
];

/** One wait as a model says it: its name, its clock, and the word on her own. */
export type WaitWords = {
  title: string;
  clock: string;
  /** The word her own waiting photo wears. */
  mine: string;
};

export type ModelWords = {
  /** The held album's wait; null where approval is never a wait (`apart`). */
  held: WaitWords | null;
  developing: WaitWords;
  /** The style's name on the cover, where the model names albums. */
  chip?: { held: string; developing: string };
  /** What her own held photo says where it stands in a live album (`apart`). */
  inline?: string;
  /** The line an approval batch arrives with. */
  trickle: (n: number) => string;
};

export const MODEL_WORDS: Record<ModelId, ModelWords> = {
  questions: {
    held: {
      title: "Waiting for approval",
      clock: "Shows once Maya approves",
      mine: "Waiting for approval",
    },
    // Production's own words for the two waits (`TRACKER_WORDS`, `TRACKER_SEALED_WORDS`).
    developing: {
      title: "Waiting to develop",
      clock: `Develops at ${DEVELOP.at}`,
      mine: "Waiting to develop",
    },
    trickle: (n) => `Maya approved ${n}`,
  },
  styles: {
    held: {
      title: "Reviewed by Maya",
      clock: "Each shows as she lets it in",
      mine: "Waiting for Maya",
    },
    developing: {
      title: "Disposable",
      clock: `Develops at ${DEVELOP.at}`,
      mine: "Developing",
    },
    chip: { held: "Reviewed", developing: "Disposable" },
    trickle: (n) => `${n} let in`,
  },
  time: {
    held: {
      title: "Developing",
      clock: "As Maya lets them in",
      mine: "Developing",
    },
    developing: {
      title: "Developing",
      clock: `All at once at ${DEVELOP.at}`,
      mine: "Developing",
    },
    trickle: (n) => `${n} just developed`,
  },
  apart: {
    held: null,
    developing: {
      title: "Developing",
      clock: `Develops at ${DEVELOP.at}`,
      mine: "Developing",
    },
    inline: "Only you · waiting for Maya",
    trickle: (n) => `${n} new`,
  },
};

export const modelOf = (v: unknown, fallback: ModelId): ModelId =>
  MODELS.includes(v as ModelId) ? (v as ModelId) : fallback;
