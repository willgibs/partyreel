"use client";

import { boardSpec } from "@/app/(dev)/design/sandbox/registry";
import { CopyButton } from "@/components/lab/paste";
import { cn } from "@/lib/utils";

import { composeSoFar, type Transcribed } from "./review-message";
import { markSent, useReviewStore } from "./review-store";

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
 *
 * ★ AND THE LEDGER IS ONLY AS FRESH AS THE BUILD HE IS READING (Will,
 * 2026-09-19: his answers stay in the store after he pastes, and the next paste
 * carries them again until the alias rebuilds). So the paste marks what it took
 * (`markSent`, review-store.ts) and the next one leaves it out: the picks stay
 * on screen, greyed and dated, and only stop travelling. "Copy everything" is
 * the one way back, for the rare paste that went missing between here and the
 * chat window.
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
  // The open round as the spec declares it today: a step the board withdrew
  // is closed the moment it leaves the spec, whatever the store still holds.
  const openOf = (board: string) => {
    const spec = boardSpec(board);
    return (
      spec && {
        round: spec.round.n,
        asks: spec.asks.map((a) => a.id),
        items: spec.catalog ? spec.candidates.map((c) => c.id) : [],
      }
    );
  };
  const fresh = composeSoFar(store, openOf, transcribed, build);
  const all = composeSoFar(store, openOf, transcribed, build, {
    ignoreSent: true,
  });
  const held = fresh.answers + fresh.items + fresh.notes;
  const everything = all.answers + all.items + all.notes;
  if (everything === 0) return null;
  const parts = [
    fresh.answers ? `${fresh.answers} answer${fresh.answers === 1 ? "" : "s"}` : "",
    fresh.items ? `${fresh.items} verdict${fresh.items === 1 ? "" : "s"}` : "",
    fresh.notes ? `${fresh.notes} note${fresh.notes === 1 ? "" : "s"}` : "",
  ].filter(Boolean);
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {held > 0 && (
        <CopyButton
          text={fresh.message}
          label={`Copy so far (${parts.join(", ")})`}
          done="Copied: paste it in chat"
          onCopy={() => markSent(fresh.included, build)}
          className={cn(
            "text-muted-foreground hover:text-foreground",
            className,
          )}
        />
      )}
      {/* The quiet way back: everything held, sent or not, for the paste that
          never arrived. It marks the lot again, so the next one is clean. */}
      {everything > held && (
        <CopyButton
          text={all.message}
          label={held > 0 ? "Copy everything" : `Copy everything (${everything})`}
          done="Copied: paste it in chat"
          onCopy={() => markSent(all.included, build)}
          className={cn(
            "border-dashed text-faint hover:text-foreground",
            className,
          )}
        />
      )}
    </span>
  );
}
