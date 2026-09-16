"use client";

import { ArrowRight } from "lucide-react";

import { LabLink } from "@/app/(dev)/design/(shell)/_shell/shell-context";

import { useReviewStore } from "./review-store";

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
  /** The held key (`<board>.r<n>.<ask>`), so progress counts today's queue. */
  key: string;
  /** Where that step is answered: its board, with the card open on it. */
  href: string;
};

export function StartReview({ steps }: { steps: ReviewEntry[] }) {
  const { answers } = useReviewStore();
  const answered = steps.filter((s) => answers[s.key]?.choice).length;
  const resuming = answered > 0 && answered < steps.length;
  const next = steps.find((s) => !answers[s.key]?.choice) ?? steps[0];
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
