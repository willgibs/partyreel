/**
 * THE BOARD SPEC (the Library x Lab round, 2026-09-15): what an exploration
 * board IS, as data. A board is two files: `sandbox/<id>/spec.ts` (this shape:
 * the question, the verdict, the asks Will answers in one word, the candidates,
 * the departures, the assets, the sections and their ledes, the controls the
 * dock renders, the walk) and `sandbox/<id>/board.tsx` (the evidence per
 * section, a function of the declared state). The kit's `BoardPage` renders a
 * spec answer-first; the desk, the record and the review ledger read the same
 * spec; nothing about a board is scraped from its JSX any more.
 *
 * Pure on purpose: no React, no CSS, no aliases beyond this file, so
 * `sandbox/registry.ts` can import every spec from a server page and from a
 * node test. The limits are the density discipline the template enforces
 * (registry.test.ts pins them): a review reads the answer in a screen.
 *
 * This file is the stub the `lab-kit` track completes (the kit lane); its shape
 * is fixed up front so the rules layer, the desk and the kit build on one type.
 */

/**
 * ONE OPTION OF AN ASK (the clarity round, 2026-09-15). The ledger stores the
 * `id`, one token, so a board may reword the label for ever without orphaning
 * an answer; the reviewer reads the `label` and the `means` line.
 *
 * ★ A BARE STRING IS THE TRANSITIONAL FORM, NOT A SECOND SHAPE. Will's first
 * review stopped at tokens nobody could read ("seam", "family", "lift"), so
 * every option is now labelled in words a stranger knows and says what
 * choosing it does. `registry.test.ts` lists the boards still on the string
 * form (`PLAIN`) and that list only shrinks; a board off it may not use a
 * bare string. Read an option through `optionId`, `optionLabel` and
 * `optionMeans`, never by its shape.
 */
export type AskOption =
  | string
  | {
      /** The token the ledger stores: one word, hyphens allowed. */
      id: string;
      /** The name a reviewer reads: "The footer seam only". */
      label: string;
      /** One sentence: what picking this does, and what it costs. */
      means?: string;
    };

export const optionId = (o: AskOption): string =>
  typeof o === "string" ? o : o.id;
export const optionLabel = (o: AskOption): string =>
  typeof o === "string" ? o : o.label;
export const optionMeans = (o: AskOption): string | undefined =>
  typeof o === "string" ? undefined : o.means;

/**
 * AN ASK CARRIES ITS OWN CONTEXT (Will, 2026-09-15: "the more clearly you can
 * ask me questions, the more easily it is for me to respond... framing the
 * context more with the question would help a ton"). A reviewer meets an ask
 * on the desk or on the review card, away from the board's argument, so the
 * ask itself has to say what the thing is, where it lives on the site, how to
 * look at it and what each option would do. A nickname from the board is
 * glossed the first time it appears or left out.
 */
export type Ask<SectionId extends string = string> = {
  /** Stable kebab id; the ledger stores it, never the question text. */
  id: string;
  /** A real question in plain words, ending in a question mark. */
  question: string;
  /** What the thing is and where it lives on the site, for someone who has not read the board. */
  context?: string;
  /** Where to look and what to compare: the section, the switch, the labelled specimens. */
  look?: string;
  /** Two or more options; the ledger stores their ids. */
  options: readonly [AskOption, AskOption, ...AskOption[]];
  /** The id of one of `options`. */
  recommended: string;
  /** Why the board recommends it, in one or two plain sentences. */
  because?: string;
  /** The one thing that would change the board's mind. */
  overrule?: string;
  /** The section that argues it; the pill links there. */
  evidence: SectionId;
  /** The dock state that shows this ask's evidence; applied when the review card lands on it. */
  state?: Partial<Record<string, string>>;
  /** A dock control whose option ids equal this ask's, so picking an option previews it. */
  control?: string;
};

export type Verdict = {
  /** The answer in one breath. */
  recommendation: string;
  because: string;
  /** What a "no" costs, or what would change the call. */
  overrule?: string;
};

export type Departure<SectionId extends string = string> = {
  id: string;
  /** A bible rule number (1..22), a standing ruling, or precedent. */
  from: number | "ruling" | "precedent";
  /** The departure and its cost, not the argument. */
  text: string;
  evidence?: SectionId;
};

/** The fixed shape docs/ASSETS.md folds: what · spec · replaces; `row` when already logged. */
export type Asset = {
  what: string;
  spec: string;
  replaces: string;
  row?: number;
};

export type Candidate<SectionId extends string = string> = {
  id: string;
  name: string;
  rationale: string;
  recommended?: boolean;
  /** The hero concept contract, folded in: a candidate can carry its own copy proposal. */
  proposed?: {
    eyebrow?: string;
    h1?: string;
    subhead?: string;
    secondary?: string;
  };
  departures?: readonly Departure<SectionId>[];
  assets?: readonly Asset[];
};

export type Section<Id extends string = string> = {
  /** Kebab; the anchor is `${board}-${id}`. */
  id: Id;
  title: string;
  /** What the evidence shows, in one line. */
  lede: string;
  /** Collapsed by default; one paragraph per entry. */
  argument?: readonly string[];
  /** Collapsed "For the wiring round"; never in the reviewer's eye. */
  wiring?: readonly string[];
  /** Frames mount at once (default: on approach). */
  eager?: boolean;
};

/** A page-wide switch the template renders in the dock and mirrors to the URL. */
export type Control = {
  id: string;
  label: string;
  options: readonly { id: string; label: string }[];
  default: string;
};

/** The board's state: every declared control's current option id. */
export type BoardState = Readonly<Record<string, string>>;

/** One step of the guided walk: where to look, in which state, and why. */
export type LookFirst<SectionId extends string = string> = {
  section: SectionId;
  state?: Partial<Record<string, string>>;
  note: string;
};

/** The builder's note on a section's evidence (an AI note; Will's live in the ledger). */
export type Note<SectionId extends string = string> = {
  section: SectionId;
  text: string;
  state?: Partial<Record<string, string>>;
};

export type Round = { n: number; date: string; changed: string };
export type WalkPage = { label: string; path: string; note?: string };

export type BoardLinks = {
  /** The bible rules in play, by number. */
  bible: readonly number[];
  /** Defaults to docs/decisions/design-record.md#<id>. */
  record?: string;
  /** Defaults to docs/tracks/<id>.md. */
  track?: string;
  /** docs/specs/<id>.md when one exists. */
  spec?: string;
  /** The walk an applied block reaches. */
  pages?: readonly WalkPage[];
};

export type BoardSpec<S extends readonly Section[] = readonly Section[]> = {
  /** The sandbox directory and the SandboxId in touchpoints.ts. */
  id: string;
  title: string;
  question: string;
  /** This round, and one line of what changed (above the fold). */
  round: Round;
  history?: readonly Round[];
  /** How the board got here (collapsed). */
  context?: string;
  verdict: Verdict;
  asks: readonly Ask<S[number]["id"]>[];
  candidates: readonly Candidate<S[number]["id"]>[];
  departures: readonly Departure<S[number]["id"]>[];
  /** Empty allowed; the panel prints "none requested". */
  assets: readonly Asset[];
  sections: S;
  controls?: readonly Control[];
  lookFirst?: readonly LookFirst<S[number]["id"]>[];
  notes?: readonly Note<S[number]["id"]>[];
  links: BoardLinks;
};

/** The density discipline, pinned by the registry test. */
export const LIMITS = {
  question: 200,
  recommendation: 240,
  because: 400,
  overrule: 200,
  askQuestion: 160,
  askContext: 400,
  askLook: 240,
  askBecause: 300,
  askOverrule: 160,
  optionLabel: 48,
  optionMeans: 160,
  title: 60,
  lede: 240,
  argument: 600,
  departure: 400,
  rationale: 300,
  note: 300,
  roundChanged: 300,
  context: 600,
} as const;

/**
 * `const` generic: the section ids are inferred as literals, so an ask's
 * `evidence`, a note's `section` and a walk step are checked against them in
 * the same call.
 */
export function defineBoard<const S extends readonly Section[]>(
  spec: BoardSpec<S>,
): BoardSpec<S> {
  return spec;
}

export type SectionIdOf<B> =
  B extends BoardSpec<infer S> ? S[number]["id"] : never;

/** The anchor every reader computes the same way. */
export function anchorFor(boardId: string, sectionId: string): string {
  return `${boardId}-${sectionId}`;
}
