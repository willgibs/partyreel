"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * COPY, one button, one behaviour, everywhere on a board.
 *
 * The shell has a CopyButton for a page's own markdown; this is the board's,
 * because a board copies a paste, a review message and a walk link, and three
 * copies of "what does a settled state look like" is how those stop agreeing.
 * The settled state lasts 1.6 seconds and then returns, so a second copy reads
 * as a second copy.
 *
 * ★ THE CLIPBOARD CAN REJECT. Without a user gesture, over plain http, or in a
 * locked-down profile, `writeText` rejects rather than throwing synchronously.
 * The rejection path must leave the label alone rather than lie.
 */
export function CopyButton({
  text,
  label = "Copy",
  done = "Copied",
  className,
  onCopy,
}: {
  text: string | (() => string);
  label?: string;
  done?: string;
  className?: string;
  onCopy?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        const value = typeof text === "function" ? text() : text;
        void navigator.clipboard?.writeText(value).then(
          () => {
            setCopied(true);
            onCopy?.();
            window.setTimeout(() => setCopied(false), 1600);
          },
          () => setCopied(false),
        );
      }}
      className={cn(
        "h-7 rounded-[var(--radius-action-sm)] border border-border px-2.5 text-[11px] font-medium transition-transform duration-150 ease-emphasis active:scale-[0.97] motion-reduce:transition-none",
        className,
      )}
    >
      {copied ? done : label}
    </button>
  );
}

/**
 * THE RULING AS A PASTE: the exact block a ruling would land, in the body face
 * (there is no mono face in the product, bible 8), with the copy button that
 * always takes the WHOLE block whether it is open or not.
 *
 * ★ COLLAPSED BY DEFAULT, AND THAT IS A JUDGEMENT ABOUT THE WALK. Nine of these
 * at full height were 6,300px of the light board, more than a third of it, and a
 * reviewer does not read CSS end to end on a walk: he checks that the block
 * exists, that it says what the stage above it said, and copies it. Collapsed,
 * the pastes are a list of landings he can scan in one screen and open one at a
 * time, and nothing is hidden that a click does not return.
 *
 * The clamp is a line count rather than a pixel height so a two-line paste does
 * not sit in a tall empty box, and `--lab-paste-lines` is read by design.css.
 *
 * ★ `min-w-0` ON BOTH THE PRE AND ITS WRAPPER, or `overflow-auto` does nothing.
 * A flex item's default `min-width: auto` is its CONTENT's width, so a long CSS
 * line makes the <pre> wider than its column instead of scrolling inside it, and
 * the board's document scrolls sideways at 375. The scroller has to be allowed
 * to be narrower than what it holds before it will scroll at all.
 */
export function Paste({
  code,
  label,
  lines = 6,
  className,
}: {
  code: string;
  label: string;
  /** How many lines the collapsed preview shows. */
  lines?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const total = code.split("\n").length;
  const clamped = total > lines;
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-1 text-[12px] font-medium">{label}</p>
        {clamped && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="h-7 rounded-[var(--radius-action-sm)] border border-border px-2.5 text-[11px] font-medium transition-transform duration-150 ease-emphasis active:scale-[0.97] motion-reduce:transition-none"
          >
            {open ? "Collapse" : `Read all ${total} lines`}
          </button>
        )}
        <CopyButton text={code} />
      </div>
      <pre
        data-lab-paste={open || !clamped ? undefined : ""}
        style={{ "--lab-paste-lines": lines } as React.CSSProperties}
        className="min-w-0 overflow-auto rounded-lg border border-border bg-muted/40 p-4 font-sans text-[11px] leading-relaxed tabular-nums whitespace-pre"
      >
        {code}
      </pre>
    </div>
  );
}
