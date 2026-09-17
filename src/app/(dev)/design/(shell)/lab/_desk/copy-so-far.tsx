"use client";

import { boardSpec } from "@/app/(dev)/design/sandbox/registry";
import { CopyButton } from "@/components/lab/paste";
import { cn } from "@/lib/utils";

import { composeSoFar, type Transcribed } from "./review-message";
import { useReviewStore } from "./review-store";

/**
 * COPY WHAT YOU HAVE SO FAR (Will, 2026-09-16). One button, on the review
 * step's spine and on the desk, that composes every held answer, verdict and
 * note across every board into the message the Orchestrator transcribes, so a
 * sitting can be pasted in batches at the reviewer's own pace. It never clears
 * anything: the same asks pasted again later simply overwrite in the ledger.
 *
 * ★ AND IT OMITS WHAT HAS ALREADY BEEN SENT (the stepped review, 2026-09-16).
 * The store holds the whole sitting for ever, so the second paste of a batched
 * review used to re-send the first. `transcribed` is what the ledger already
 * holds, read on the server from the desk's own rows, and an entry that matches
 * it choice-and-note is dropped; a changed one rides again. The same holds for
 * a note, and nothing rides for a step the board no longer asks (2026-09-17).
 */
export function CopySoFar({
  transcribed,
  build,
  className,
}: {
  transcribed?: Transcribed;
  /** The commit this page was built from; rides the paste as a `#` line. */
  build?: string | null;
  className?: string;
}) {
  const store = useReviewStore();
  const { message, answers, items, notes } = composeSoFar(
    store,
    // The open round as the spec declares it today: a step the board withdrew
    // is closed the moment it leaves the spec, whatever the store still holds.
    (board) => {
      const spec = boardSpec(board);
      return (
        spec && {
          round: spec.round.n,
          asks: spec.asks.map((a) => a.id),
          items: spec.catalog ? spec.candidates.map((c) => c.id) : [],
        }
      );
    },
    transcribed,
    build,
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
