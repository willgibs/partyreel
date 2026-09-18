"use client";

import { cn } from "@/lib/utils";

import {
  setItemNote,
  toggleItemVerdict,
  useReviewStore,
} from "@/app/(dev)/design/(shell)/lab/_desk/review-store";
import { itemHoldId } from "@/app/(dev)/design/(shell)/lab/_desk/step-id";

import { ITEM_VERDICTS } from "./board-spec";

/**
 * THE REVIEWER'S ROW ON ONE ITEM (the revamp, 2026-09-16): a verdict and a
 * note, on a catalog card, a Library entry or a step's list.
 *
 * ★ ONE COMPONENT, MOUNTED IN FOUR PLACES, and that is the whole point. The
 * catalog card carries it under the preview, the board's review panel lists it
 * per item, the desk's session shows it away from the board, and the kit demos
 * it; four copies of a row of pills would be four disagreements about what a
 * second click does the first time someone changes their mind.
 *
 * ★ A SECOND CLICK ON THE PICKED VERDICT CLEARS IT (Will, 2026-09-16: "I can't
 * unpick a selection to return to a non-selected state"), which is the store's
 * one toggle rule; the note survives the clear, because the words are the
 * expensive half. Nothing here writes the repo: `toggleItemVerdict` holds the
 * verdict in this browser and the session composes a line to paste.
 *
 * The VOCABULARY is a prop rather than a constant, because a catalog card takes
 * `keep | refine | kill` and a Library entry takes `keep | redesign | retire`:
 * the same gesture, two ladders, and the ledger stores the word either way.
 */
export function ItemVerdictRow({
  scope,
  round,
  id,
  name,
  vocabulary = ITEM_VERDICTS,
  className,
}: {
  /** A board id for a catalog card, or `library` for an entry. */
  scope: string;
  /** The board's round; the Library has none, so it passes 0. */
  round: number;
  /** The candidate id or the Library entry id: what the ledger stores. */
  id: string;
  /** What is being ruled on, for the labels a screen reader reads. */
  name: string;
  vocabulary?: readonly string[];
  className?: string;
}) {
  const store = useReviewStore();
  const held = store.items[itemHoldId(scope, round, id)];
  const verdict = held?.verdict ?? "";

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {vocabulary.map((word) => {
        const on = verdict === word;
        return (
          <button
            key={word}
            type="button"
            data-dir-press
            aria-pressed={on}
            aria-label={`${word}: ${name}`}
            onClick={() => toggleItemVerdict(scope, round, id, word)}
            className={cn(
              "rounded-md px-2 py-0.5 text-[11px] font-medium transition-[transform,background-color,color,border-color] duration-150 ease-emphasis active:scale-[0.97] motion-reduce:transition-none",
              on
                ? "border border-transparent bg-foreground text-background"
                : "border border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {word}
          </button>
        );
      })}
      <input
        type="text"
        value={held?.note ?? ""}
        onChange={(e) => setItemNote(scope, round, id, e.target.value)}
        aria-label={`Your note on ${name}`}
        placeholder="Why, in a few words (optional)"
        className="h-7 min-w-0 flex-1 basis-[10rem] rounded-[var(--radius-action-sm)] border border-border bg-background px-2 text-[11px] transition-colors duration-150 outline-none placeholder:text-faint focus:border-foreground/40 motion-reduce:transition-none"
      />
    </div>
  );
}
