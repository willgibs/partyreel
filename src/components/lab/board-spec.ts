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
      /**
       * The declared controls that show THIS option on the ask's specimen
       * (the stepped review, 2026-09-16), merged over `ask.state` and the
       * `control` mirror: the review draws every option as a tile on one
       * specimen, and a press shows it before anything is recorded.
       */
      state?: Partial<Record<string, string>>;
    };

export const optionId = (o: AskOption): string =>
  typeof o === "string" ? o : o.id;
export const optionLabel = (o: AskOption): string =>
  typeof o === "string" ? o : o.label;
export const optionMeans = (o: AskOption): string | undefined =>
  typeof o === "string" ? undefined : o.means;

/**
 * WHAT AN ASK WAITS ON (the stepped review, 2026-09-16). A question that only
 * exists once another is answered a certain way (the aurora's landing once the
 * aurora is kept; the accent's reach once `accent=own`) is STAGED: kept off the
 * desk and out of the walk until its prerequisite is held or ruled, and moot
 * when the prerequisite goes the other way. `option` or `verdict` left out
 * means "answered at all".
 */
export type AskAfter =
  | { ask: string; option?: string }
  | { item: string; verdict?: "keep" | "refine" };

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
  /** What the answer decides platform-wide: the token, component, route or rule, in words. */
  lands?: string;
  /** The earlier ask, or the catalog card, this question waits on. */
  after?: AskAfter;
  /** The declared controls the step's config strip shows beside the stage (default: none). */
  strip?: readonly string[];
  /**
   * The canvas an option's TILE draws in. Default "desktop" (1440), because
   * most evidence is a page. An ask whose options are a phone column says
   * "phone" (375) and its tiles stop being thumbnails in an empty 1440 room,
   * which is what a question about SIZE needs (found on the first
   * question-first exploration, 2026-09-18).
   */
  tile?: "desktop" | "phone";
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
  /** A bible principle by number (1..10), or a shipped decision the idea departs from ("ruling" or "precedent"). */
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

/**
 * THE VERDICTS (the revamp, 2026-09-16). A catalog is reviewed item by item:
 * the builder says what each item is for with `ship | refine | kill`, and Will
 * answers each card with `keep | refine | kill` and a note; a Library entry
 * takes `keep | redesign | retire`, which is how a scroll through the live
 * components turns into a redesign request. The ledger stores the word.
 */
export const ITEM_VERDICTS = ["keep", "refine", "kill"] as const;
export type ItemVerdict = (typeof ITEM_VERDICTS)[number];
export const LIBRARY_VERDICTS = ["keep", "redesign", "retire"] as const;
export type LibraryVerdict = (typeof LIBRARY_VERDICTS)[number];
export type BuilderVerdict = "ship" | "refine" | "kill";

export type Candidate<SectionId extends string = string> = {
  id: string;
  name: string;
  rationale: string;
  recommended?: boolean;
  /** The card's one line: what this is, in words a stranger knows. */
  one?: string;
  /** The builder's own call, drawn as the card's pill. */
  verdict?: BuilderVerdict;
  /** The Moment card's facts, generalised: label and value pairs under the preview. */
  facts?: readonly (readonly [string, string])[];
  /**
   * The catalog entry this card became, once it has one: the entry id, the last
   * segment of its /design/library URL. A kept idea is built into the catalog,
   * and the card then carries the link, so the board says where the idea went.
   */
  library?: string;
  /** What keeping this card lands as, platform-wide: the token, component or rule, in words. */
  lands?: string;
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
  /**
   * The default is the CLEARED state and picking the picked option returns to
   * it (Will, 2026-09-16: "I can't unpick a selection to return to a
   * non-selected state"). A catalog's pick control declares a `none` option
   * and makes it the default.
   */
  clearable?: boolean;
};

/**
 * A board whose candidates are a CATALOG: a grid of ideas Will rules on one by
 * one (keep, refine, kill, a note), the pick worn by the real pages below.
 * Declaring this is the opt-in; a board without it keeps its candidates as
 * the meta list.
 */
export type CatalogSpec<SectionId extends string = string> = {
  /** The section whose evidence is the catalog grid. */
  section: SectionId;
  /** The declared control a Pick sets; its option ids are the candidate ids (plus its cleared default). */
  control?: string;
  /** The two declared controls any-two-side-by-side reads; their option ids are the candidate ids. */
  compare?: readonly [string, string];
  /**
   * HOW THE CATALOG IS DECIDED (the stepped review, 2026-09-16). `pick-one`:
   * the cards are variants of one thing and ONE wins, asked by the `winner` ask
   * (its options are the card ids plus `none`, its `control` the pick control,
   * so "None of these" clears the board and lands in the ledger as an ordinary
   * answer carrying its note); the card verdicts are optional feedback.
   * `keep-any` (the default): every card is its own proposal and each takes a
   * verdict.
   */
  mode?: "pick-one" | "keep-any";
  /** pick-one: the ask that records the winner. */
  winner?: string;
  /** keep-any: how the review walks the cards (default gallery). */
  walk?: "gallery" | "one-at-a-time";
  /** The section drawn under the tiles in the pick's state: the real surface wearing the choice. */
  stage?: SectionId;
};

/**
 * A CALL THE LANE CARRIED, WHICH IS HIS TO OVERRULE (lab-tides, 2026-09-19).
 *
 * ★ THE FINDING THIS ANSWERS. Every lane carries the calls its goal left open
 * on its own recommendation (its manifest's Questions), and apart from this a
 * call reaches Will only through docs/STATUS.md's Waiting on Will note and the
 * merge commit that lands it, both a page away from the board he is answering.
 * A decision taken for him that he never sees is not
 * a decision he made. So a board may carry them and the template draws them
 * above its sections, in the one place he is already reading.
 *
 * Three strings and an id, because that is the whole of it: what was asked,
 * what the lane did, and what changes if he says otherwise. It is NOT an ask.
 * An ask is a question with drawn options and a step of its own; dressing a
 * carried call as one would put a question on the desk that the lane has
 * already built past, which is the opposite of what carrying it means.
 */
export type CarriedCall = {
  /** Stable kebab id; the review grammar names it (`call:<id>`). */
  id: string;
  /** What the goal left open, in plain words, ending in a question mark. */
  question: string;
  /** The answer the lane took and built on. */
  taken: string;
  /** What changes if he says otherwise. */
  overrule: string;
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
  /**
   * The calls the lane took without him, drawn above the sections. Empty or
   * absent on a board whose goal left nothing open, which is most of them.
   */
  carried?: readonly CarriedCall[];
  catalog?: CatalogSpec<S[number]["id"]>;
  /**
   * A board that truly needs more words than `LIMITS.readingWords` says WHY
   * here, and `pnpm lab:smoke` prints the reason instead of failing it. A
   * budget with no escape hatch gets gamed by moving prose into an image; one
   * that asks for a sentence gets thought about.
   */
  reading?: { words: number; why: string };
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
  askLands: 160,
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
  candidateOne: 120,
  candidateLands: 120,
  /**
   * A carried call is a ROW, not a card: the question, what the lane took and
   * what changes if he says otherwise, each short enough to read at a glance on
   * the way past. A call that needs more than this is an ask, and belongs on a
   * step with its options drawn.
   */
  carriedQuestion: 160,
  carriedTaken: 160,
  carriedOverrule: 160,
  /** The words a board may show outside its collapsed folds before it is a paper (the smoke measures it). */
  readingWords: 1200,
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
