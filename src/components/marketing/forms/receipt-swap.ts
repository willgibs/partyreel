"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/** The form's exit before the receipt: exits are faster than entrances. */
export const FORM_EXIT_MS = 150;

/**
 * THE CARD THAT BECOMES ITS RECEIPT: the three states of one public form's card (the form standing, the
 * form leaving, the receipt), never three components. Each form keeps its own fields and its own receipt
 * (`NoteReceipt` with its words); the choreography between them is this, once:
 *
 * - the frame: the form's height is measured as the send starts (a ref read belongs in a handler, never a
 *   render), and the receipt keeps it from lg and condenses from it in a hand (`NoteReceipt`'s `--frame`);
 * - the exit: an accepted note's form leaves in `FORM_EXIT_MS`, inert, before the receipt arrives on its
 *   own beats; a reader who asked for less motion gets the swap at once;
 * - Send another: the form returns on its baseline (`reset` lands on whatever the form was opened with,
 *   such as the help handoff's article), with the keyboard on its first field, the way the receipt took
 *   it from the button that sent.
 */
export function useReceiptSwap<Receipt>(firstField: string) {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [returning, setReturning] = useState(false);
  const [frame, setFrame] = useState(0);
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!returning) return;
    body.current
      ?.querySelector<HTMLElement>(firstField)
      ?.focus({ preventScroll: true });
  }, [returning, firstField]);

  return {
    /** The wrapper the frame is measured off and the first field is found in. */
    body,
    receipt,
    leaving,
    /** The wrapper's style while the receipt stands: the height the form held. */
    frameStyle:
      receipt && frame
        ? ({ "--frame": `${frame}px` } as CSSProperties)
        : undefined,
    /** Called as the send starts, while the form still stands. */
    measure: () => setFrame(body.current?.offsetHeight ?? 0),
    /**
     * The note was accepted: the form leaves (awaited, so its button stays disabled and the form inert
     * until the swap), `reset` lands it on its baseline after the swap so no field blanks mid-exit, and
     * the receipt arrives.
     */
    land: async (next: Receipt, reset: () => void) => {
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setLeaving(true);
        await new Promise((resolve) => setTimeout(resolve, FORM_EXIT_MS));
      }
      reset();
      setLeaving(false);
      setReturning(false);
      setReceipt(next);
    },
    another: () => {
      setReceipt(null);
      setReturning(true);
    },
    /** The form's exit and its return, each motion-safe by construction. */
    formMotion: cn(
      "blur-[0px] transition-[opacity,filter,scale] duration-150 ease-emphasis motion-reduce:transition-none",
      leaving && "pointer-events-none scale-[0.985] opacity-0 blur-[2px]",
      returning && "animate-in duration-200 fade-in motion-reduce:animate-none",
    ),
  };
}
