import {
  anchorFor,
  type BoardSpec,
  optionId,
  optionLabel,
  optionMeans,
} from "@/components/lab/board-spec";

import { withDesignKey } from "@/lib/design-gate/links";

import type { AskState } from "./queue";
import { SAMPLE_BOARD } from "./sample-spec";
import { stepId } from "./step-id";

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
 * ★ PURE AND ISOMORPHIC ON PURPOSE. Two SERVER pages build the steps and one
 * CLIENT component walks them, so nothing here may import React, the board's
 * sheet or `queue.ts`'s runtime (its `AskState` comes in as a TYPE, which
 * erases; `queue.ts` itself is `server-only` because it reads the ledger off
 * the disk).
 */

export type SessionOption = { id: string; label: string; means?: string };

export type SessionStep = {
  board: string;
  boardTitle: string;
  round: number;
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
  /** The section that argues it, and the route to it. */
  evidence: { title: string; href: string } | null;
  /** The evidence's section id, so the card can scroll to it on its own page. */
  section?: string;
  /** The dock state that shows this ask's evidence; applied on landing. */
  state?: Record<string, string>;
  /** A dock control whose option ids equal this ask's, so a pick IS the preview. */
  control?: string;
  boardHref: string;
};

/** The reviewer's own answer: "this question is not clear to me". */
export const UNCLEAR = "?";

/** The summary's own URL value; the dry run namespaces its own (`sample.end`). */
export const SESSION_END = "end";

/** The `?session=` value that resumes on this step. */
export const stepParam = (s: SessionStep): string => stepId(s.board, s.askId);

const DESK_HREF = "/design/lab";

/**
 * The steps a session walks, with each ask's evidence resolved against its
 * board's spec. `specOf` is injected so the dry run can answer for one fixture
 * board and the desk for the registry; `key` is the gate key, which every
 * evidence link has to carry or it lands on the lab's 404.
 */
export function toSteps(
  asks: AskState[],
  specOf: (board: string) => BoardSpec | undefined,
  key: string | null,
): SessionStep[] {
  return asks.map((a) => {
    const spec = specOf(a.board);
    const section = spec?.sections.find((s) => s.id === a.ask.evidence);
    const board = `/design/lab/${a.board}`;
    // A dry run has no board page, so it has no evidence to open.
    const sample = a.board === SAMPLE_BOARD.id;
    return {
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
      evidence:
        spec && section && !sample
          ? {
              title: section.title,
              href: withDesignKey(
                `${board}#${anchorFor(a.board, section.id)}`,
                key,
              ),
            }
          : null,
      section: section && !sample ? section.id : undefined,
      state: a.ask.state as Record<string, string> | undefined,
      control: a.ask.control,
      boardHref: sample ? DESK_HREF : board,
    };
  });
}
