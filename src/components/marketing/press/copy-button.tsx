"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Copy-to-clipboard with a receipt, for the two things a reporter actually lifts off
 * /press: the boilerplate and the one-liner.
 *
 * The confirm is information, not decoration. A copy is fire-and-forget with no system
 * feedback of its own (the browser has no "copied" affordance), so without this the
 * reader cannot tell it worked and presses again.
 *
 * Three details that are load-bearing rather than stylistic:
 *  - Both icons stack in ONE grid cell, so the swap causes zero layout shift. The button
 *    sits inline beside a heading; a width change on click would nudge the row.
 *  - The live region renders UNCONDITIONALLY. A region inserted into the DOM at the same
 *    moment as its text usually fails to announce, and a flipped aria-label alone is
 *    unreliable across screen readers.
 *  - navigator.clipboard is undefined outside a secure context, hence the optional call
 *    plus the catch: a failed copy must not throw, it just does not confirm.
 */
export function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  /** The accessible action name. Two copy buttons on one page need distinct names. */
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <>
      <button
        type="button"
        aria-label={copied ? `${label}, copied` : label}
        onClick={() => {
          void navigator.clipboard
            ?.writeText(value)
            .then(() => {
              setCopied(true);
              if (timer.current) clearTimeout(timer.current);
              timer.current = setTimeout(() => setCopied(false), 1600);
            })
            .catch(() => {});
        }}
        className={cn(
          "inline-flex shrink-0 items-center gap-2 rounded-action-sm border px-3 py-1.5",
          "text-xs font-medium text-muted-foreground",
          "transition-[color,border-color,transform] duration-150 ease-[var(--ease-emphasis)]",
          "hover:border-foreground/25 hover:text-foreground active:scale-[0.97]",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          className,
        )}
      >
        <span className="grid size-3.5 place-items-center [&>*]:col-start-1 [&>*]:row-start-1">
          <Copy
            aria-hidden
            className={cn(
              "size-3.5 transition-[opacity,transform] duration-200 ease-[var(--ease-emphasis)]",
              copied ? "scale-50 opacity-0" : "scale-100 opacity-100",
            )}
          />
          <Check
            aria-hidden
            className={cn(
              "size-3.5 transition-[opacity,transform] duration-200 ease-[var(--ease-emphasis)]",
              copied ? "scale-100 opacity-100" : "scale-50 opacity-0",
            )}
          />
        </span>
        {copied ? "Copied" : "Copy"}
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? `${label}, copied` : ""}
      </span>
    </>
  );
}
