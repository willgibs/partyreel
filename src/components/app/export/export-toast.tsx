"use client";

import { Download, EyeOff, X } from "lucide-react";
import { toast } from "sonner";

import type {
  ToastAction,
  ToastPort,
  ToastView,
} from "@/components/app/export/export-walk";

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
  actions,
  close,
}: {
  action?: ToastAction;
  /** A question's answers (`ask`), side by side, before the x. */
  actions?: ToastAction[];
  close?: ToastAction;
}) {
  const buttons = actions ?? (action ? [action] : []);
  return (
    <div
      data-export-toast-controls=""
      className="ml-auto flex shrink-0 items-center gap-1.5 self-center"
    >
      {buttons.map((button) => (
        // `data-button` takes sonner's own action styling, so this reads like every toast's Undo.
        <button
          key={button.label}
          type="button"
          data-button=""
          data-action=""
          onClick={button.run}
        >
          {button.label}
        </button>
      ))}
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

export const exportToasts: ToastPort = {
  show(id: string, view: ToastView) {
    const base = {
      id,
      closeButton: false,
      description: undefined,
      cancel: undefined,
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
          icon: <EyeOff className="size-4" aria-hidden />,
          duration: Infinity,
          dismissible: false,
          action: <Controls actions={view.actions} close={view.close} />,
        });
        return;
      case "between":
        // Neutral, not green: the walk is half done, and green says finished.
        toast.info(view.title, {
          ...base,
          icon: <Download className="size-4" aria-hidden />,
          duration: Infinity,
          dismissible: false,
          action: <Controls action={view.action} close={view.close} />,
        });
        return;
      case "downloading":
        // Handed over and on its way; the Worker's word turns it to saved (`export-ends`). Neutral, as
        // between parts, and held: the x only lets the toast go, the browser keeps the download.
        toast.info(view.title, {
          ...base,
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
          icon: undefined,
          duration: Infinity,
          dismissible: true,
          action: <Controls action={view.action} close={view.close} />,
        });
        return;
      case "refused":
        toast.error(view.title, {
          ...base,
          icon: undefined,
          duration: Infinity,
          dismissible: true,
          action: <Controls action={view.action} close={view.close} />,
        });
        return;
    }
  },
  dismiss(id: string) {
    toast.dismiss(id);
  },
};
