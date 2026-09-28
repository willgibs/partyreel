"use client";

import { toast } from "sonner";

import { showActionError, showErrorToast } from "@/lib/errors/toast";

/**
 * THE PRODUCT'S UNDO (host-curation `undo=undo`, Will 2026-09-28: "An Undo on the toast, for the
 * seconds the product still knows which ones were meant"). An act that already happened, offered
 * back on the toast that reports it. Built once, for every surface whose act can be taken back:
 * Review's verdicts first, then a bulk Remove in the storage lists.
 *
 * ★ THE ACT COMMITS AT ONCE, AND UNDO IS A SECOND ACT. The server already holds the result when
 * the toast appears (its `hold` sibling, which delays the write until a clock runs out, lost): so
 * the caller's surface leads with the result, the toast names it, and Undo runs the reversal as
 * its own write. Pressing it puts the items back on screen first (`onUndo`), then asks the server
 * (`undo`); a refusal takes them away again (`onUndoFailed`) and says why, in the producer's words.
 *
 * ★ ONE TOAST PER SURFACE (`id`): a later act's toast replaces an earlier one, and the earlier
 * act's Undo goes with it. Undo only ever reverses the act its own toast names, never a pile.
 *
 * Sonner closes the toast on the press, so one toast is one Undo; it pauses its clock while a
 * pointer rests on it and while the tab is hidden, so the window is the host's to read, not to
 * race. The toast's trailing action slot is the Toaster's own (`ui/sonner.tsx`).
 */

/** How long a toast offers its Undo: long enough to read the sentence and reach the button. */
export const UNDO_WINDOW_MS = 6_000;

/** A reversal's answer: an action's own result shape. */
export type UndoOutcome =
  | { ok: true }
  | { ok: false; code: string; message?: string };

export type UndoToast = {
  /** The surface's one toast: a later act's replaces it, and with it this act's Undo. */
  id: string;
  /** What happened, in the act's own words ("Approved 5 photos"). */
  message: string;
  /** The act's state colour: success for an act that landed, warning for a hide or a reject. */
  tone: "success" | "warning";
  /** Put the items back where the host can see them, at once: lead with the result. */
  onUndo: () => void;
  /** The reversal, on the server. */
  undo: () => Promise<UndoOutcome>;
  /** The reversal was refused or failed: the act stands, so take the items away again. */
  onUndoFailed: () => void;
  /** The reversal landed (a store's catch-up goes here). */
  onUndone?: () => void;
};

export function showUndoToast(t: UndoToast): void {
  toast[t.tone](t.message, {
    id: t.id,
    duration: UNDO_WINDOW_MS,
    action: {
      label: "Undo",
      onClick: () => {
        t.onUndo();
        void t.undo().then(
          (result) => {
            if (result.ok) {
              t.onUndone?.();
              return;
            }
            t.onUndoFailed();
            showActionError(result);
          },
          () => {
            t.onUndoFailed();
            showErrorToast("unknown");
          },
        );
      },
    },
  });
}
