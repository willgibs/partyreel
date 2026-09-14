"use client";

import { useState } from "react";
import { Check, Columns2, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

import type { SpecimenSkin } from "./entry";

/**
 * THE STAGE: the frame every specimen sits in, and the gallery's one delight.
 *
 * A design system is judged in two themes, and the lab has always made you
 * toggle the whole page to see the second one, which loses the first. The
 * split button renders the SAME specimen twice, side by side, in both: the
 * left pane forces the light palette with `.surface-paper` (globals.css's
 * sanctioned subtree-scoped light block, which also switches `dark:` variants
 * off through the `:not(.surface-paper *)` guard) and the right pane turns
 * `.dark` on for its subtree. They are SIBLINGS: never nest one inside the
 * other, which is the standing rule in globals.css.
 *
 * The one honest limit: a component that reads the theme in JavaScript rather
 * than in CSS (next-themes' useTheme, so the Toaster and anything that picks an
 * asset by theme) renders the PAGE's theme in both panes. Everything token-
 * driven, which is nearly all of it, is true in both.
 */
export function Stage({
  label,
  hint,
  bleed,
  skin = "lab",
  contentClassName,
  children,
}: {
  label?: string;
  hint?: string;
  bleed?: boolean;
  skin?: SpecimenSkin;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  const [split, setSplit] = useState(false);

  const well = cn(
    bleed ? "p-0" : "p-5",
    skin === "gallery" && "bg-gallery text-gallery-foreground",
    contentClassName,
  );
  const inner =
    skin === "marketing" ? <div data-mkt="">{children}</div> : children;

  return (
    <div className="group/stage overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-2.5">
        <p className="min-w-0 text-[13px] font-medium">
          {label}
          {!label && hint && <span className="sr-only">Specimen</span>}
        </p>
        <span className="flex shrink-0 items-baseline gap-3">
          {hint && (
            <span className="truncate text-[11px] text-muted-foreground">
              {hint}
            </span>
          )}
          <button
            type="button"
            onClick={() => setSplit((s) => !s)}
            aria-pressed={split}
            title={split ? "One theme" : "Light and dark, side by side"}
            className={cn(
              "-mb-0.5 flex size-5 items-center justify-center rounded-md transition-[color,opacity,transform] duration-150 ease-emphasis active:scale-90",
              split
                ? "text-foreground"
                : "text-muted-foreground/60 group-hover/stage:text-muted-foreground hover:text-foreground",
            )}
          >
            <Columns2 className="size-3.5" />
            <span className="sr-only">
              {split ? "Show one theme" : "Show light and dark side by side"}
            </span>
          </button>
        </span>
      </div>

      {split ? (
        <div className="grid sm:grid-cols-2">
          <ThemePane tone="light" className={well}>
            {inner}
          </ThemePane>
          <ThemePane tone="dark" className={well}>
            {inner}
          </ThemePane>
        </div>
      ) : (
        <div className={well}>{inner}</div>
      )}
    </div>
  );
}

/** One half of the split: its own palette, its own ground, its own label. */
function ThemePane({
  tone,
  className,
  children,
}: {
  tone: "light" | "dark";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative bg-background text-foreground",
        tone === "light" ? "surface-paper" : "dark",
        tone === "dark" && "border-t border-border sm:border-t-0 sm:border-l",
      )}
    >
      <span className="pointer-events-none absolute top-1 right-2 text-[10px] tracking-wider text-muted-foreground/70 uppercase">
        {tone}
      </span>
      <div className={className}>{children}</div>
    </div>
  );
}

/** The props line under a config panel: one tap to take it into a file. */
export function CopyLine({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(code);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      }}
      className="group/copy flex w-full items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-left transition-colors hover:border-foreground/25"
    >
      <code className="min-w-0 flex-1 font-sans text-[11px] leading-relaxed break-words whitespace-pre-wrap text-muted-foreground group-hover/copy:text-foreground">
        {code}
      </code>
      <span className="relative mt-0.5 size-3.5 shrink-0 text-muted-foreground">
        <Copy
          className={cn(
            "absolute inset-0 size-3.5 transition-[opacity,transform] duration-150 ease-emphasis",
            copied ? "scale-75 opacity-0" : "scale-100 opacity-100",
          )}
        />
        <Check
          className={cn(
            "absolute inset-0 size-3.5 text-foreground transition-[opacity,transform] duration-150 ease-emphasis",
            copied ? "scale-100 opacity-100" : "scale-75 opacity-0",
          )}
        />
      </span>
      <span className="sr-only">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
