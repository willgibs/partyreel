"use client";

import { useReviewStore } from "./review-store";
import { type SessionStep, stepHeld } from "./session-step";

/**
 * ANSWERED HERE, NOT SENT YET (the stepped review, 2026-09-16).
 *
 * ★ THE DESK IS SERVER-RENDERED AND THE ANSWERS ARE IN THE BROWSER, which is
 * the whole reason this is a component rather than a prop. A row the reviewer
 * answered ten minutes ago looks identical to one he has not touched until the
 * paste lands in the ledger, and "did I already do that one?" across forty rows
 * is exactly the friction this round exists to remove. So the row says so.
 *
 * A transcribed step is not here at all: it is answered in the ledger and the
 * desk queues only what is open. This badge is the state in between.
 */
export function HeldBadge({ step }: { step: SessionStep }) {
  const store = useReviewStore();
  const { held, of } = stepHeld(step, store);
  if (held === 0) return null;
  return (
    <span className="shrink-0 rounded-md border border-foreground/30 bg-card px-1.5 py-0.5 text-[10px] font-medium">
      {of > 1 ? `${held} of ${of} held` : "held, not sent"}
    </span>
  );
}
