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
 * `?session=resume` is not a step id on purpose: the session resolves an
 * unknown value to the first unanswered ask, so one link does both jobs.
 */
export function StartReview({
  total,
  /** The held key of every step (`<board>.r<n>.<ask>`), so progress counts today's queue. */
  stepKeys,
  href = "/design/lab?session=resume",
}: {
  total: number;
  stepKeys: string[];
  href?: string;
}) {
  const { answers } = useReviewStore();
  const answered = stepKeys.filter((k) => answers[k]?.choice).length;
  const resuming = answered > 0 && answered < total;

  return (
    <LabLink
      href={href}
      data-dir-press
      className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity duration-150 hover:opacity-90"
    >
      {resuming ? `Carry on, ${answered} of ${total} answered` : "Start the review"}
      <ArrowRight className="size-3.5" />
    </LabLink>
  );
}
