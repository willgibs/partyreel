import {
  anchorFor,
  type AskAfter,
  type AskOption,
  type BoardSpec,
  type BuilderVerdict,
  ITEM_VERDICTS,
  optionId,
  optionLabel,
  optionMeans,
} from "@/components/lab/board-spec";

import { withDesignKey } from "@/lib/design-gate/links";

import {
  AS_TODAY_GLOSS,
  badgeText,
  concedes,
  overtakenFor,
  saysAsToday,
  STANDS,
  STANDS_NOTE,
} from "@/app/(dev)/design/sandbox/overtaken";

import type { AskState, ItemState } from "./queue";
import type { ReviewStore } from "./review-store";
import { SAMPLE_BOARD } from "./sample-spec";
import { holdId, itemHoldId, itemsStepId, stepId } from "./step-id";

/**
 * ONE STEP OF A REVIEW, AND THE ONE PLACE IT IS BUILT (the clarity round,
 * 2026-09-15).
 *
 * The desk's step view and the board's review card render the SAME step: the
 * question, what the thing is, where to look, the options in words, the note,
 * and "not clear to me". They differ only in where the evidence is (a tab away
 * on the desk, under the card on the board), so the derivation lives here and
 * neither owns it. It used to be a local function in `lab/page.tsx`; the board
 * route now builds the same queue, and two copies of this would drift the day
 * an ask grew a field.
 *
 * ★ A STEP IS AN ASK OR A CATALOG (the revamp, 2026-09-16), and there is ONE
 * items step per board, never one per item. Twelve palettes as twelve steps
 * would be twelve screens of sticky card asking the same question, with the
 * catalog they are about scrolled off the page; one step says "rule on the
 * twelve below" and lets the cards themselves carry the controls, which is
 * what makes the catalog the evidence rather than a picture beside a form.
 * Its param is `<board>.items`, so no ask may be called `items`
 * (registry.test.ts refuses one).
 *
 * ★ THE CATALOG COMES FIRST IN ITS BOARD'S RUN. A catalog board's asks are
 * what is left open ONCE a card is picked (the palette's accent reach, its card
 * opacity, its third text step), so asking them before the cards have been
 * ruled on asks them in the wrong order.
 *
 * ★ PURE AND ISOMORPHIC ON PURPOSE. Two SERVER pages build the steps and one
 * CLIENT component walks them, so nothing here may import React, the board's
 * sheet or `queue.ts`'s runtime (its `AskState` comes in as a TYPE, which
 * erases; `queue.ts` itself is `server-only` because it reads the ledger off
 * the disk). `ReviewStore` is a type import for the same reason: `stepDone`
 * takes the store's SHAPE, so a server page can count a queue without pulling
 * a "use client" module into its render.
 */

export type SessionOption = {
  id: string;
  label: string;
  means?: string;
  /**
   * The declared controls that DRAW this option on the ask's specimen, merged
   * over the ask's own state. An option with neither this nor a control mirror
   * cannot be drawn, and the step renders it as a text tile (the stepped
   * review, 2026-09-16).
   */
  state?: Record<string, string>;
};

/** What every step carries, whichever kind it is. */
type StepBase = {
  board: string;
  boardTitle: string;
  round: number;
  /** The section that argues it, and the route to it. */
  evidence: { title: string; href: string } | null;
  /** The evidence's section id, so the card can scroll to it on its own page. */
  section?: string;
  /** The dock state that shows this step's evidence; applied on landing. */
  state?: Record<string, string>;
  boardHref: string;
  /** The earlier ask or card this step waits on; undefined when it waits on nothing. */
  after?: AskAfter;
  /**
   * ★ THE LEDGER SIDE OF `after`, RESOLVED ON THE SERVER. Staging asks "has the
   * prerequisite been decided?", and the answer can live in two places: the
   * session's own store (this browser, this sitting) or the ledger on disk from
   * an earlier sitting. Only the server can read the second, so it resolves it
   * here once and the client combines the two in `stepBlocked`. The value is
   * the option or verdict the ledger holds, or null when it holds none.
   */
  afterRuled?: string | null;
};

export type AskStep = StepBase & {
  kind: "ask";
  askId: string;
  question: string;
  /** What the thing is and where it lives, for a reader who has not read the board. */
  context?: string;
  /** Where to look and what to compare. */
  look?: string;
  options: readonly SessionOption[];
  recommended: string;
  because?: string;
  overrule?: string;
  /** A dock control whose option ids equal this ask's, so a pick IS the preview. */
  control?: string;
  /** What the answer decides platform-wide, in words. */
  lands?: string;
  /** The declared controls the step's config strip shows beside the stage. */
  strip?: readonly string[];
  /** The canvas an option's tile draws in (`Ask.tile`). */
  tile?: "desktop" | "phone";
  /**
   * This ask IS its board's catalog winner: the tiles are the catalog's own
   * cards rather than generic option tiles, and "none" is the new-directions
   * exit. Set from `catalog.winner`.
   */
  winner?: boolean;
  /** The catalog's grid section, for a winner ask: what the tiles are drawn from. */
  catalogSection?: string;
  /** The section drawn under the tiles in the shown state (`catalog.stage`). */
  stageSection?: string;
  /**
   * ★ WHAT THE LEDGER HOLDS FOR THIS BOARD'S OTHER ASKS, this round, by ask id
   * (the dock round, 2026-09-18). A step is drawn WEARING the board's decided
   * answers, so a decision staged behind another is judged in the world the
   * first one made: the gap at the pace he picked. This sitting's answers live
   * in the browser's store and win over these; only the server can read the
   * ledger, so it rides here. "Not clear to me" is not a decision and is left out.
   */
  ruled?: Readonly<Record<string, string>>;
  /**
   * ★ AN EARLIER RULING REACHED THIS QUESTION (Will, 2026-09-19). The question
   * is NOT removed and nothing is answered by precedent: it stays in the walk,
   * badged, and he either answers it (an override, recorded as the new ruling)
   * or presses "The ruling stands". `sandbox/overtaken.ts` is the one home.
   *
   * ★ RESOLVED TO STRINGS HERE, and that is not laziness. The kit
   * (`src/components/lab/`) may never import a board or anything beside one
   * (`boundary.test.ts`: the dependency runs the other way), and the step is
   * kit. So the desk's side reads the map and hands the step words to draw; the
   * step renders them and derives nothing.
   */
  overtaken?: OvertakenBadge;
};

/** What a step draws when an earlier ruling reached its question. */
export type OvertakenBadge = {
  /** The board whose ruling reached it; the desk words its own count with it. */
  by: string;
  /** Plain words with the date: "Ruled since app-shape r1, 19 Sep: ...". */
  badge: string;
  /** The lane's one line: "stands: ..." or "concedes: ...". */
  line: string;
  /** The lane conceded, so the dock's third button is primed. */
  conceded: boolean;
  /** An option still says "as today" and today moved: the gloss, or nothing. */
  gloss?: string;
};

/** One catalog card, as a step's list renders it. */
export type SessionItem = {
  id: string;
  name: string;
  /** The card's one line: what this is, in words a stranger knows. */
  one?: string;
  /** The builder's own call, drawn as the card's pill. */
  verdict?: BuilderVerdict;
  /** What keeping this card lands as, platform-wide, in words. */
  lands?: string;
};

export type ItemsStep = StepBase & {
  kind: "items";
  /** The section holding the catalog, for "Rule on the 12 items in The catalog". */
  sectionTitle: string;
  items: readonly SessionItem[];
  /** The words a verdict may be, in the order they are offered. */
  vocabulary: readonly string[];
  /** How the catalog is decided; a pick-one catalog queues no cards at all. */
  mode: "pick-one" | "keep-any";
  /** How the review walks the cards: all at once, or one large card at a time. */
  walk: "gallery" | "one-at-a-time";
  /** The section drawn under the cards in the shown state (`catalog.stage`). */
  stageSection?: string;
};

export type SessionStep = AskStep | ItemsStep;

/** The reviewer's own answer: "this question is not clear to me". */
export const UNCLEAR = "?";

/**
 * The other reserved answer, beside it so a reader of the walk meets both in
 * one place: "the earlier ruling stands". Defined in `sandbox/overtaken.ts`
 * with the mechanism it belongs to and re-exported here, never re-declared.
 */
export { STANDS, STANDS_NOTE };

/** The summary's own URL value; the dry run namespaces its own (`sample.end`). */
export const SESSION_END = "end";

/** The `?session=` value that resumes on this step. */
export const stepParam = (s: SessionStep): string =>
  s.kind === "items" ? itemsStepId(s.board) : stepId(s.board, s.askId);

/**
 * HOW MANY OF A STEP'S UNITS ARE ANSWERED, and how many there are: one for an
 * ask, one per card for a catalog. Shared by the card's "k of N ruled", the
 * desk's progress and "carry on", so the three can never count differently.
 */
export function stepHeld(
  step: SessionStep,
  store: ReviewStore,
): { held: number; of: number } {
  if (step.kind === "items") {
    const held = step.items.filter(
      (i) => store.items[itemHoldId(step.board, step.round, i.id)]?.verdict,
    ).length;
    return { held, of: step.items.length };
  }
  const answer = store.answers[holdId(step.board, step.round, step.askId)];
  return { held: answer?.choice ? 1 : 0, of: 1 };
}

/** True once a step needs nothing more: an ask picked, or every card ruled. */
export function stepDone(step: SessionStep, store: ReviewStore): boolean {
  const { held, of } = stepHeld(step, store);
  return of > 0 && held === of;
}

/**
 * WHETHER A STEP MAY BE ASKED YET (the stepped review, 2026-09-16).
 *
 * ★ A QUESTION THAT ONLY EXISTS ONCE ANOTHER IS ANSWERED IS NOT A QUESTION YET.
 * The aurora's landing is meaningless until the aurora is kept; the accent's
 * reach is meaningless until an accent is chosen. Asking those anyway is what
 * made a review feel like a form: half the questions were about a world the
 * reviewer had not agreed to. So an ask declares `after`, and until its
 * prerequisite is decided the step is STAGED (skipped by Back, Next and Start
 * the review, dim on the desk); once the prerequisite goes the OTHER way the
 * step is MOOT and never comes back this round.
 *
 * ★ AND BOTH HALVES OF "DECIDED" COUNT. The prerequisite may have been ruled in
 * an earlier sitting (the ledger, resolved into `afterRuled` on the server) or
 * answered a moment ago in this one (the store). The store wins where both
 * speak, because it is the newer answer and the one the reviewer can see.
 *
 * "Not clear to me" is not a decision: it leaves the follow-up staged, which is
 * exactly right, because the question it waits on has not been answered.
 *
 * ★ "THE RULING STANDS" IS A DECISION, AND IT MOOTS WHAT WAITED ON AN OPTION.
 * `stands` is deliberately not one of the ask's options, so a follow-up that
 * declares `after: { ask, option }` goes MOOT rather than staged: the earlier
 * ruling is what the wiring follows now, and a question that only existed if
 * this one went a particular way did not happen. A follow-up that waits on the
 * ask being answered AT ALL (no `option`) opens, which is also right.
 */
export function stepBlocked(
  step: SessionStep,
  store: ReviewStore,
): "staged" | "moot" | null {
  const after = step.after;
  if (!after) return null;
  const held =
    "ask" in after
      ? store.answers[holdId(step.board, step.round, after.ask)]?.choice
      : store.items[itemHoldId(step.board, step.round, after.item)]?.verdict;
  const decided = held || step.afterRuled || null;
  if (!decided || decided === UNCLEAR) return "staged";
  const wanted = "ask" in after ? after.option : after.verdict;
  if (wanted === undefined) return null;
  return decided === wanted ? null : "moot";
}

/** The steps a walk may land on: everything not staged behind something else. */
export function walkable(
  steps: readonly SessionStep[],
  store: ReviewStore,
): SessionStep[] {
  return steps.filter((s) => stepBlocked(s, store) === null);
}

const DESK_HREF = "/design/lab";

/** A board's open work, in the order a session walks it: the catalog, then the asks. */
export type BoardWork = {
  asks: readonly AskState[];
  /** The catalog cards with no ruling yet; empty for a board with no catalog. */
  items: readonly ItemState[];
  /**
   * WHAT THE LEDGER ALREADY HOLDS FOR THIS BOARD, by ask id and card id. The
   * open work is by definition what the ledger does NOT hold, so a staged
   * step's prerequisite is never in `asks` or `items`: the ruling that unstages
   * it has to ride along separately (`afterRuled`).
   */
  ruled?: {
    answers: Readonly<Record<string, string | null>>;
    items: Readonly<Record<string, string>>;
  };
};

const NOTHING_RULED: NonNullable<BoardWork["ruled"]> = {
  answers: {},
  items: {},
};

/** What the ledger says about one step's prerequisite, or null when it says nothing. */
function ruledFor(
  after: AskAfter | undefined,
  ruled: BoardWork["ruled"],
): string | null | undefined {
  if (!after) return undefined;
  const r = ruled ?? NOTHING_RULED;
  return ("ask" in after ? r.answers[after.ask] : r.items[after.item]) ?? null;
}

/**
 * The steps a session walks, with each step's evidence resolved against its
 * board's spec. `specOf` is injected so the dry run can answer for one fixture
 * board and the desk for the registry; `key` is the gate key, which every
 * evidence link has to carry or it lands on the lab's 404.
 */
export function toSteps(
  work: readonly BoardWork[],
  specOf: (board: string) => BoardSpec | undefined,
  key: string | null,
): SessionStep[] {
  return work.flatMap((w) => {
    const items = toItemsStep(w.items, specOf, key);
    return [
      ...(items ? [items] : []),
      ...w.asks.map((a) => toAskStep(a, specOf, key, w.ruled)),
    ];
  });
}

/** Where a step's evidence section lives, once. A dry run has no board page. */
function evidenceOf(
  board: string,
  sectionId: string | undefined,
  specOf: (board: string) => BoardSpec | undefined,
  key: string | null,
) {
  const spec = specOf(board);
  const section = spec?.sections.find((s) => s.id === sectionId);
  const sample = board === SAMPLE_BOARD.id;
  const href = `/design/lab/${board}`;
  return {
    section: section && !sample ? section : undefined,
    evidence:
      section && !sample
        ? {
            title: section.title,
            href: withDesignKey(`${href}#${anchorFor(board, section.id)}`, key),
          }
        : null,
    boardHref: sample ? DESK_HREF : href,
  };
}

/** The board's decided answers from the ledger, less the ask being asked. */
function decidedIn(
  ruled: BoardWork["ruled"],
  own: string,
): Readonly<Record<string, string>> | undefined {
  const out: Record<string, string> = {};
  for (const [ask, choice] of Object.entries(ruled?.answers ?? {}))
    if (ask !== own && choice) out[ask] = choice;
  return Object.keys(out).length > 0 ? out : undefined;
}

/** The option's own drawing state, when it declares one. */
const optionState = (o: AskOption): Record<string, string> | undefined =>
  typeof o === "string" ? undefined : (o.state as Record<string, string>);

function toAskStep(
  a: AskState,
  specOf: (board: string) => BoardSpec | undefined,
  key: string | null,
  ruled?: BoardWork["ruled"],
): AskStep {
  const { section, evidence, boardHref } = evidenceOf(
    a.board,
    a.ask.evidence,
    specOf,
    key,
  );
  const catalog = specOf(a.board)?.catalog;
  const winner = catalog?.winner === a.ask.id;
  // The note an earlier ruling left on this question, and whether any of its
  // options still says "as today" (the words the badge has to gloss, since the
  // board's spec is never edited by the lane that made them stale).
  const note = overtakenFor(a.board, a.ask.id);
  const overtaken: OvertakenBadge | undefined = note && {
    by: note.by,
    badge: badgeText(note),
    line: note.line,
    conceded: concedes(note),
    gloss: a.ask.options.some(
      (o) => saysAsToday(optionLabel(o)) || saysAsToday(optionMeans(o)),
    )
      ? AS_TODAY_GLOSS
      : undefined,
  };
  return {
    kind: "ask",
    board: a.board,
    boardTitle: a.boardTitle,
    round: a.round,
    askId: a.ask.id,
    question: a.ask.question,
    context: a.ask.context,
    look: a.ask.look,
    options: a.ask.options.map((o) => ({
      id: optionId(o),
      label: optionLabel(o),
      means: optionMeans(o),
      state: optionState(o),
    })),
    recommended: a.ask.recommended,
    because: a.ask.because,
    overrule: a.ask.overrule,
    evidence,
    section: section?.id,
    state: a.ask.state as Record<string, string> | undefined,
    control: a.ask.control,
    lands: a.ask.lands,
    strip: a.ask.strip,
    tile: a.ask.tile,
    after: a.ask.after,
    afterRuled: ruledFor(a.ask.after, ruled),
    ruled: decidedIn(ruled, a.ask.id),
    winner: winner || undefined,
    catalogSection: winner ? catalog?.section : undefined,
    stageSection: winner ? catalog?.stage : undefined,
    overtaken,
    boardHref,
  };
}

/** One board's catalog as a single step, or null when it has nothing open. */
export function toItemsStep(
  items: readonly ItemState[],
  specOf: (board: string) => BoardSpec | undefined,
  key: string | null,
): ItemsStep | null {
  const first = items[0];
  if (!first) return null;
  const spec = specOf(first.board);
  const sectionId = spec?.catalog?.section;
  const {
    section,
    evidence,
    boardHref: href,
  } = evidenceOf(first.board, sectionId, specOf, key);
  return {
    kind: "items",
    board: first.board,
    boardTitle: first.boardTitle,
    round: first.round,
    sectionTitle:
      section?.title ??
      spec?.sections.find((s) => s.id === sectionId)?.title ??
      "the catalog",
    items: items.map((i) => ({
      id: i.item.id,
      name: i.item.name,
      one: i.item.one,
      verdict: i.item.verdict,
      lands: i.item.lands,
    })),
    vocabulary: ITEM_VERDICTS,
    // A board that declares neither is a keep-any catalog walked as a gallery:
    // exactly what every catalog did before the shapes were named, so an
    // unreshaped board keeps working (the stepped review, 2026-09-16).
    mode: spec?.catalog?.mode ?? "keep-any",
    walk: spec?.catalog?.walk ?? "gallery",
    stageSection: spec?.catalog?.stage,
    evidence,
    section: section?.id,
    boardHref: href,
  };
}
