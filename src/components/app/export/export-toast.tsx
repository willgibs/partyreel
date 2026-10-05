"use client";

import { Ban, Download, EyeOff, X } from "lucide-react";
import { toast } from "sonner";

import type {
  ToastAction,
  ToastPort,
  ToastView,
} from "@/components/app/export/export-walk";
import { WALK_COPY } from "@/lib/export/walk";

/**
 * THE DOWNLOAD'S TOAST, ON THE PRODUCT'S TOASTER (`ui/sonner.tsx`: top centre, the state tones,
 * errors that stay). One toast a download, updated in place by its id through every state the walk
 * passes (`export-walk.ts`), so she is kept in the loop where she is (`export-flow` r1, `wait=toast`).
 *
 * ★ THE X SITS ON THE RIGHT, IN EVERY STATE (Will, `stuck`: "a subtle x icon on the right side to
 * cancel"). Sonner's own close sits at the top-left corner and is off on these (`closeButton: false`,
 * which also beats the patched `toast.error`'s default). The x is the toast's own control, quiet at
 * rest and full at a hover or a focus, and it inherits the tone's ink, so it reads on the red and the
 * amber too. While something is still in flight (preparing, a question, between parts, or a zip on its
 * way whose Worker has not yet said it is saved) the toast cannot be swiped away: the x is the one way
 * out, so a stray swipe never silently drops a walk.
 *
 * ★ EVERY FIELD IS SET ON EVERY UPDATE. Sonner merges an update into the toast it replaces, so an
 * unset `duration` or `action` would carry over from the state before (a spinner's endless life
 * onto a success, a Try again onto a done).
 */
function Controls({
  action,
  close,
}: {
  action?: ToastAction;
  close?: ToastAction;
}) {
  return (
    <div
      data-export-toast-controls=""
      className="ml-auto flex shrink-0 items-center gap-1.5 self-center"
    >
      {action ? (
        // `data-button` takes sonner's own action styling, so this reads like every toast's Undo.
        <button
          type="button"
          data-button=""
          data-action=""
          onClick={action.run}
        >
          {action.label}
        </button>
      ) : null}
      {close ? (
        <button
          type="button"
          aria-label={close.label}
          title={close.label}
          onClick={close.run}
          className="-my-1.5 -mr-2 flex size-8 shrink-0 items-center justify-center rounded-md opacity-55 transition-opacity duration-150 outline-none hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-current/40 active:scale-95 motion-reduce:active:scale-100"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

/**
 * WHAT TO DO ABOUT IT, UNDER THE LINE (E6: "your connection dropped" and what to do). Balanced, so a sentence that must
 * wrap beside a Try again and the x at 375 breaks in the middle ("Check your signal, / then try again.") and never
 * leaves one word on a line of its own.
 */
function Detail({ text }: { text: string }) {
  return <span className="block text-balance">{text}</span>;
}

/**
 * A QUESTION'S ANSWERS, UNDER ITS LINE (`ask`, `confirm`). Two answers beside the line squeezed "3 of these 12 are
 * hidden." into four rows at 375 (the toaster's width is fixed, so a desk's too), so they sit in the
 * description's place, left-aligned, and the x keeps its place on the right. Sonner's own action styling,
 * with its push to the right undone. A `detail` (what stopping leaves behind) stands over them.
 */
function Answers({
  actions,
  detail,
}: {
  actions: ToastAction[];
  detail?: string;
}) {
  return (
    <>
      {detail ? <span className="block">{detail}</span> : null}
      <span
        data-export-toast-answers=""
        className="mt-2 flex flex-wrap items-center gap-1.5"
      >
        {actions.map((answer) => (
          <button
            key={answer.label}
            type="button"
            data-button=""
            data-action=""
            style={{ marginInlineStart: 0 }}
            onClick={answer.run}
          >
            {answer.label}
          </button>
        ))}
      </span>
    </>
  );
}

/**
 * ★ A TRY AGAIN WAITS FOR THE LINE (crumbs-71). While the browser says it is offline a press on one can only fail the
 * same way (the mint is refused at once and the toast says the connection dropped again), so a toast whose way back is a
 * Try again (a refusal, a short zip) is drawn WITHOUT it, says what it waits for ("Waiting for your connection…") in its
 * detail's place, keeps its x, and is drawn again as it was when `online` fires: its own words and its button, nothing
 * pressed.
 *
 * ★ IT IS HELD HERE, ON THE PORT, NOT IN AN ENGINE: the walk's Try again and the take-home Save's both draw through
 * `exportToasts`, so one rule serves both, and the toast's own life ends the wait. A replacement, `dismiss` and sonner's
 * own dismissal (a swipe) each stop the listening, so a toast that is gone is never drawn back by the line.
 *
 * "Offline" is the browser's certain word (`navigator.onLine === false`); "online" says only that a network is attached,
 * so a line that merely stalls keeps its Try again (a press there is a real try) and nothing listens unless the browser
 * says offline. A phone's browser freezes a tab it is left for another app and can miss the event, so looking at the tab
 * again asks too. A cancel's Try again is hers and "Get part N" is a next step, so both are left as they are: a press on
 * either that meets a dead line lands on this toast, which then waits.
 */
type Again = Extract<ToastView, { tone: "refused" | "short" }> & {
  action: ToastAction;
};

const wantsTheLine = (view: ToastView): view is Again =>
  (view.tone === "refused" || view.tone === "short") &&
  view.action !== undefined;

const lineIsDown = () =>
  typeof navigator !== "undefined" && navigator.onLine === false;

/** The toasts waiting for the line, by id: how each stops listening. */
const waiting = new Map<string, () => void>();

function stopWaiting(id: string) {
  waiting.get(id)?.();
}

function waitForTheLine(id: string, view: Again): () => void {
  const lineBack = () => {
    if (lineIsDown()) return;
    // The toast as it was before the wait, its Try again with it (`show` ends this wait first).
    exportToasts.show(id, view);
  };
  window.addEventListener("online", lineBack);
  document.addEventListener("visibilitychange", lineBack);
  const stop = () => {
    window.removeEventListener("online", lineBack);
    document.removeEventListener("visibilitychange", lineBack);
    if (waiting.get(id) === stop) waiting.delete(id);
  };
  waiting.set(id, stop);
  return stop;
}

/** One state, drawn. `onDismiss` is what sonner calls when the toast goes (a swipe, the x, `dismiss`). */
function draw(id: string, view: ToastView, onDismiss?: () => void) {
  const base = {
    id,
    closeButton: false,
    description: undefined,
    cancel: undefined,
    // Set on every draw like the rest: a held toast's hook must not outlive the state it was set for.
    onDismiss,
  };
  switch (view.tone) {
    case "wait":
      toast.loading(view.title, {
        ...base,
        icon: undefined,
        duration: Infinity,
        dismissible: false,
        action: <Controls close={view.close} />,
      });
      return;
    case "ask":
      // A question about her own selection: neutral, held until she answers or takes the x.
      toast.info(view.title, {
        ...base,
        description: <Answers actions={view.actions} />,
        icon: <EyeOff className="size-4" aria-hidden />,
        duration: Infinity,
        dismissible: false,
        action: <Controls close={view.close} />,
      });
      return;
    case "confirm":
      // The x, asked before it is believed (E6): neutral, held until she answers, and no x of its own (the
      // answers are the way out). Keep going is first, since it is what an unintended press means.
      toast.info(view.title, {
        ...base,
        description: <Answers actions={view.actions} detail={view.detail} />,
        icon: <Ban className="size-4" aria-hidden />,
        duration: Infinity,
        dismissible: false,
        action: undefined,
      });
      return;
    case "between":
      // Neutral, not green: the walk is half done, and green says finished.
      toast.info(view.title, {
        ...base,
        description: view.detail ? <Detail text={view.detail} /> : undefined,
        icon: <Download className="size-4" aria-hidden />,
        duration: Infinity,
        dismissible: false,
        action: <Controls action={view.action} close={view.close} />,
      });
      return;
    case "downloading":
      // Handed over and on its way; the Worker's word turns it to saved (`export-ends`). Neutral, as
      // between parts, and held: the x only lets the toast go, the browser keeps the download. A line that
      // has stopped answering is said under it.
      toast.info(view.title, {
        ...base,
        description: view.detail ? <Detail text={view.detail} /> : undefined,
        icon: <Download className="size-4" aria-hidden />,
        duration: Infinity,
        dismissible: false,
        action: <Controls close={view.close} />,
      });
      return;
    case "done":
      toast.success(view.title, {
        ...base,
        icon: undefined,
        duration: view.duration,
        dismissible: true,
        action: undefined,
      });
      return;
    case "short":
      toast.warning(view.title, {
        ...base,
        description: view.detail ? <Detail text={view.detail} /> : undefined,
        icon: undefined,
        duration: Infinity,
        dismissible: true,
        action: <Controls action={view.action} close={view.close} />,
      });
      return;
    case "cancelled":
      // Hers, so neutral and never an error: said once, with the way back, and gone by itself where she was
      // looking (her own press), held where the Worker reported it after the fact.
      toast.info(view.title, {
        ...base,
        icon: undefined,
        duration: view.duration,
        dismissible: true,
        action: <Controls action={view.action} close={view.close} />,
      });
      return;
    case "refused":
      toast.error(view.title, {
        ...base,
        description: view.detail ? <Detail text={view.detail} /> : undefined,
        icon: undefined,
        duration: Infinity,
        dismissible: true,
        action: <Controls action={view.action} close={view.close} />,
      });
      return;
  }
}

export const exportToasts: ToastPort = {
  show(id: string, view: ToastView) {
    // Whatever this toast was waiting for is over: it is being drawn again, or it is gone.
    stopWaiting(id);
    if (wantsTheLine(view) && lineIsDown()) {
      const stop = waitForTheLine(id, view);
      draw(id, { ...view, detail: WALK_COPY.waiting, action: undefined }, stop);
      return;
    }
    draw(id, view);
  },
  dismiss(id: string) {
    stopWaiting(id);
    toast.dismiss(id);
  },
};
