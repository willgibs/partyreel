"use client";

import { ArrowRight } from "lucide-react";

import { LabLink } from "@/app/(dev)/design/(shell)/_shell/shell-context";

import { useReviewStore } from "./review-store";
import { type SessionStep, stepDone } from "./session-step";

/**
 * START OR RESUME (the Library x Lab round, 2026-09-15). The desk is rendered
 * on the server and cannot see how far a review got: the answers live in the
 * reader's own browser. This reads them after mount and says so, which is the
 * difference between "start the review" and "you are four in, carry on".
 *
 * ★ AND IT RESOLVES THE STEP ITSELF (the clarity round, 2026-09-15), where it
 * used to hand the session a `?session=resume` and let it work the step out.
 * Now that an ask is answered on its own BOARD, "carry on" has to name a page
 * as well as a step, and only this component can: the step is the first one
 * with nothing held, which is a fact about the reader's own browser. The
 * server renders the href of step one and this corrects it on mount, so the
 * button is never dead and never a round trip to the wrong board.
 */
export type ReviewEntry = {
  /** The step itself, so progress is `stepDone` and nothing else. */
  step: SessionStep;
  /** Where that step is answered: its board, with the card open on it. */
  href: string;
};

export function StartReview({ steps }: { steps: ReviewEntry[] }) {
  const store = useReviewStore();
  // A catalog step counts as done only once EVERY card has a verdict, which is
  // `stepDone`'s whole job: the desk, the card and the session share it, so
  // "carry on" can never point at a step the card considers finished.
  const answered = steps.filter((s) => stepDone(s.step, store)).length;
  const resuming = answered > 0 && answered < steps.length;
  const next = steps.find((s) => !stepDone(s.step, store)) ?? steps[0];
  if (!next) return null;

  return (
    <LabLink
      href={next.href}
      data-dir-press
      className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity duration-150 hover:opacity-90"
    >
      {resuming
        ? `Carry on, ${answered} of ${steps.length} answered`
        : "Start the review"}
      <ArrowRight className="size-3.5" />
    </LabLink>
  );
}
