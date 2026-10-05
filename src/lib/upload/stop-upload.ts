/**
 * STOPPING ONE UPLOAD, SAID THE WAY THE DOWNLOADS SAY THEIR CANCEL (upload-cancel, E6 for uploads). Will's answer:
 * "a cancel is intentional: it asks to confirm, then offers Try again", and a dropped connection is never hidden
 * (`uploader.ts`: a cancel settles `cause: "cancelled"`, a drop `cause: "dropped"`, and the failure sheet draws only
 * the drop). The words are the downloads' and the take-home Save's (`WALK_COPY`, `SAVE_COPY`): Keep going first, the
 * ending neutral and never an error, "Try again" for as long as `DONE_MS.cancelled`.
 *
 * ★ THE QUESTION AND ITS ENDING ARE THE PRODUCT'S TOAST (`export-toast.tsx`, passed in as `port`: this module draws
 * nothing itself), where a tile is too small to ask on and a toast is where every other cancel in the product asks.
 * The host's batch row has room, so it asks in the row (`host-upload.tsx`) with these same words.
 *
 * ★ THE QUESTION IS STANDING OR IT IS GONE, NEVER STALE. The upload goes on while it is asked (nothing can be paused
 * under a PUT in the air), so the file may land or fail before she answers: whoever draws the file calls
 * `withdrawStopQuestion` when it leaves, and an answer that arrives after that is nothing. The press that answers is
 * taken before anything is awaited, so a second press (or the withdrawal that follows the file leaving) never reaches
 * the ending the first one is about to draw.
 */
import type { ToastPort } from "@/components/app/export/export-walk";
import { DONE_MS, WALK_COPY } from "@/lib/export/walk";

/** The words, in one place: the x's name and the question's second answer are one phrase, as the downloads' are. */
export const STOP_COPY = {
  /** The x's name, and what the question's second answer says. */
  stop: "Stop upload",
  ask: "Stop this upload?",
  keepGoing: WALK_COPY.keepGoing,
  cancelled: "Upload cancelled.",
  tryAgain: WALK_COPY.tryAgain,
  dismiss: WALK_COPY.dismiss,
} as const;

/**
 * What stopping one file came to: the way to send it again when it was stopped (the file left the queue and this
 * puts it back), or null when it was too late (its row may be recorded, so it landed or failed as it would have).
 */
export type StopResult = (() => void) | null;

/** The questions standing, by toast id: the one list that says whether a question is still hers to answer. */
const standing = new Set<string>();

/**
 * The x was pressed: ask first. Keep going withdraws the question (the upload never noticed); the other answer stops
 * the file (`stop`) and says it was cancelled, with Try again, or says nothing when it was too late.
 */
export function askToStop(args: {
  port: ToastPort;
  /** The toast's id: one question a file, and the ending replaces it in place. */
  id: string;
  stop: () => Promise<StopResult>;
}): void {
  const { port, id, stop } = args;
  // A second press while the question stands asks nothing twice.
  if (standing.has(id)) return;
  standing.add(id);
  port.show(id, {
    tone: "confirm",
    title: STOP_COPY.ask,
    actions: [
      { label: STOP_COPY.keepGoing, run: () => withdrawStopQuestion(port, id) },
      { label: STOP_COPY.stop, run: () => void stopIt(port, id, stop) },
    ],
  });
}

/** Take the question down if it is still standing (Keep going, or the file it asked about left): nothing else is said. */
export function withdrawStopQuestion(port: ToastPort, id: string): void {
  if (standing.delete(id)) port.dismiss(id);
}

async function stopIt(
  port: ToastPort,
  id: string,
  stop: () => Promise<StopResult>,
) {
  // Answered: from here the withdrawal is not hers to make, and a second press finds nothing standing.
  if (!standing.delete(id)) return;
  let tryAgain: StopResult;
  try {
    tryAgain = await stop();
  } catch (e) {
    console.error("stop upload: unexpected failure", e);
    tryAgain = null;
  }
  if (!tryAgain) {
    // Too late: it landed (or failed, and says so where failures are said). There is nothing to take back.
    port.dismiss(id);
    return;
  }
  // Hers, so neutral and never an error: said once, with the way back, and gone by itself where she was looking.
  port.show(id, {
    tone: "cancelled",
    title: STOP_COPY.cancelled,
    action: {
      label: STOP_COPY.tryAgain,
      run: () => {
        port.dismiss(id);
        tryAgain();
      },
    },
    close: { label: STOP_COPY.dismiss, run: () => port.dismiss(id) },
    duration: DONE_MS.cancelled,
  });
}
