"use client";

import { boardSpec } from "@/app/(dev)/design/sandbox/registry";
import { CopyButton } from "@/components/lab/paste";
import { cn } from "@/lib/utils";

import { composeSoFar } from "./review-message";
import { useReviewStore } from "./review-store";

/**
 * COPY WHAT YOU HAVE SO FAR (Will, 2026-09-16). One button, on the review
 * card's spine and on the desk, that composes every held answer, verdict and
 * note across every board into the message the Orchestrator transcribes, so a
 * sitting can be pasted in batches at the reviewer's own pace. It never clears
 * anything: the same asks pasted again later simply overwrite in the ledger.
 */
export function CopySoFar({ className }: { className?: string }) {
  const store = useReviewStore();
  const { message, answers, items, notes } = composeSoFar(
    store,
    (board) => boardSpec(board)?.round.n,
  );
  const held = answers + items + notes;
  if (held === 0) return null;
  const parts = [
    answers ? `${answers} answer${answers === 1 ? "" : "s"}` : "",
    items ? `${items} verdict${items === 1 ? "" : "s"}` : "",
    notes ? `${notes} note${notes === 1 ? "" : "s"}` : "",
  ].filter(Boolean);
  return (
    <CopyButton
      text={message}
      label={`Copy so far (${parts.join(", ")})`}
      done="Copied: paste it in chat"
      className={cn("text-muted-foreground hover:text-foreground", className)}
    />
  );
}
