import {
  anchorFor,
  type BoardSpec,
  type BuilderVerdict,
  ITEM_VERDICTS,
  optionId,
  optionLabel,
  optionMeans,
} from "@/components/lab/board-spec";

import { withDesignKey } from "@/lib/design-gate/links";

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

export type SessionOption = { id: string; label: string; means?: string };

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
};

/** One catalog card, as a step's list renders it. */
export type SessionItem = {
  id: string;
  name: string;
  /** The card's one line: what this is, in words a stranger knows. */
  one?: string;
  /** The builder's own call, drawn as the card's pill. */
  verdict?: BuilderVerdict;
};

export type ItemsStep = StepBase & {
  kind: "items";
  /** The section holding the catalog, for "Rule on the 12 items in The catalog". */
  sectionTitle: string;
  items: readonly SessionItem[];
  /** The words a verdict may be, in the order they are offered. */
  vocabulary: readonly string[];
};

export type SessionStep = AskStep | ItemsStep;

/** The reviewer's own answer: "this question is not clear to me". */
export const UNCLEAR = "?";

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

const DESK_HREF = "/design/lab";

/** A board's open work, in the order a session walks it: the catalog, then the asks. */
export type BoardWork = {
  asks: readonly AskState[];
  /** The catalog cards with no ruling yet; empty for a board with no catalog. */
  items: readonly ItemState[];
};

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
      ...w.asks.map((a) => toAskStep(a, specOf, key)),
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

function toAskStep(
  a: AskState,
  specOf: (board: string) => BoardSpec | undefined,
  key: string | null,
): AskStep {
  const { section, evidence, boardHref } = evidenceOf(
    a.board,
    a.ask.evidence,
    specOf,
    key,
  );
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
    })),
    recommended: a.ask.recommended,
    because: a.ask.because,
    overrule: a.ask.overrule,
    evidence,
    section: section?.id,
    state: a.ask.state as Record<string, string> | undefined,
    control: a.ask.control,
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
    })),
    vocabulary: ITEM_VERDICTS,
    evidence,
    section: section?.id,
    boardHref: href,
  };
}
