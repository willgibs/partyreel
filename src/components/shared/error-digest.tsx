"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * THE CRASH'S CORRELATION HANDLE (Will, `code=always`, 2026-09-19).
 *
 * Every render-crash boundary receives a `digest` from Next: an opaque hash of
 * the thrown error that matches the server log and the Sentry issue. It used to
 * print as a muted, uncopyable chip, so the one handle support has was a string
 * somebody retyped by hand into an email. His verdict gave it a Copy control and
 * one sentence saying what it is for.
 *
 * ★ A 404 NEVER CARRIES ONE, and that is not a styling choice: a not-found
 * throws nothing, so there is nothing to correlate and no Sentry issue to find.
 * `NotFoundScreen` renders this only when a `digest` prop arrives, which only
 * the crash boundaries pass.
 *
 * Three details are load-bearing rather than stylistic, and the precedent for
 * all three is `marketing/press/copy-button.tsx` (which stays its own component:
 * it is a press-page affordance, and a failure screen on the guest, app and
 * admin surfaces should not import marketing):
 *
 *  1. `navigator.clipboard` is undefined outside a secure context and REJECTS
 *     under a locked-down profile or an iframe with no `clipboard-write`
 *     permission, so the call is optional and the promise is caught. A failed
 *     copy must never throw inside a screen whose whole job is to survive a
 *     crash; it simply does not confirm, and the code is still `select-all`.
 *  2. Both labels stack in ONE grid cell, so Copy -> Copied shifts nothing. The
 *     code sits beside the label inside the button; a width change on press
 *     would nudge the digest a reader is mid-way through reading aloud.
 *  3. The live region renders UNCONDITIONALLY. A region inserted into the DOM
 *     at the same moment as its text usually fails to announce.
 */
export function ErrorDigest({
  digest,
  className,
}: {
  digest: string;
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
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 text-xs text-muted-foreground",
        className,
      )}
    >
      {/* `muted-foreground`, not `faint`, and that is measured rather than
          taste: `faint` at 12px came out at 3.21:1 on paper, and this is a
          sentence somebody is meant to READ before deciding whether to send
          the code. The rank below it is carried by the SIZE (12 against the
          help line's 14), not by fading the words out. */}
      <p>This helps us find what happened if you tell us about it.</p>
      <button
        type="button"
        aria-label={copied ? `Error code ${digest}, copied` : "Copy error code"}
        onClick={() => {
          void navigator.clipboard
            ?.writeText(digest)
            .then(() => {
              setCopied(true);
              // The code is `select-all`, so the press that copied it also
              // highlighted it. That selection is the FALLBACK affordance for
              // a refused clipboard, so it stays on failure and goes on
              // success: the receipt says it worked, the highlight would only
              // say it is still waiting to be dragged over.
              window.getSelection()?.removeAllRanges();
              if (timer.current) clearTimeout(timer.current);
              timer.current = setTimeout(() => setCopied(false), 1600);
            })
            .catch(() => {});
        }}
        className={cn(
          "flex items-center gap-1.5 rounded bg-muted px-1.5 py-0.5 text-foreground/80",
          // 150ms and the site's emphasis curve: this is an occasional control
          // on a screen nobody plans to see, so it gets standard feedback, not
          // a flourish (bible 12). The press scale is the one movement, and it
          // is gone under reduced motion (bible 14).
          "transition-[background-color,color,transform] duration-150 ease-emphasis",
          "hover:bg-muted/70 hover:text-foreground active:scale-[0.97] motion-reduce:active:scale-100",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        )}
      >
        <span className="tabular-nums select-all">{digest}</span>
        {/* One cell, two labels: both are laid out (opacity, never display), so
            the wider word sizes the slot and the receipt costs no reflow.
            Opacity alone, which reads the same with motion turned down. */}
        <span className="grid text-[10px] font-medium text-muted-foreground uppercase [&>*]:col-start-1 [&>*]:row-start-1">
          <span
            aria-hidden
            className={cn(
              "transition-opacity duration-150 ease-emphasis",
              copied ? "opacity-0" : "opacity-100",
            )}
          >
            Copy
          </span>
          <span
            aria-hidden
            className={cn(
              "transition-opacity duration-150 ease-emphasis",
              copied ? "opacity-100" : "opacity-0",
            )}
          >
            Copied
          </span>
        </span>
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? `Error code ${digest}, copied` : ""}
      </span>
    </div>
  );
}
