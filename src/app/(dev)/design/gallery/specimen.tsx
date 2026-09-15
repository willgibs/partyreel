"use client";

import { useState } from "react";
import { Check, Columns2, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

import type { SpecimenSkin } from "./entry";

/**
 * THE SPECIMEN FRAME: what every library specimen sits in, and the gallery's
 * one delight.
 *
 * Named `Specimen` since the Library x Lab round (2026-09-15); it was `Stage`,
 * which is the LAB KIT's word for a board's 1:1 canvas
 * (components/dev/board/stage.tsx). Two frames called Stage in one app was one
 * too many, and the library's word for the thing it frames is specimen.
 *
 * Three things live in its header, in the order a reader needs them: what the
 * specimen is (the label and its hint), how to read it (Preview or Code, when
 * the source collector could lift its JSX), and the split.
 *
 * THE SPLIT: a design system is judged in two themes, and the lab has always
 * made you toggle the whole page to see the second one, which loses the first.
 * The split button renders the SAME specimen twice, side by side, in both: the
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
export function Specimen({
  label,
  hint,
  bleed,
  skin = "lab",
  contentClassName,
  code,
  children,
}: {
  label?: string;
  hint?: string;
  bleed?: boolean;
  skin?: SpecimenSkin;
  contentClassName?: string;
  /** The specimen's JSX, from specimen-code.ts; omit it and there are no tabs. */
  code?: string;
  children: React.ReactNode;
}) {
  const [split, setSplit] = useState(false);
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const showing = code ? tab : "preview";

  const well = cn(
    bleed ? "p-0" : "p-5",
    skin === "gallery" && "bg-gallery text-gallery-foreground",
    contentClassName,
  );
  const inner =
    skin === "marketing" ? <div data-mkt="">{children}</div> : children;

  return (
    <div className="group/specimen overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border py-1.5 pr-3 pl-4">
        <p className="min-w-0 text-[13px] font-medium">
          {label}
          {!label && hint && <span className="sr-only">Specimen</span>}
        </p>
        <span className="flex shrink-0 items-center gap-2">
          {hint && showing === "preview" && (
            <span className="max-w-[24ch] truncate text-[11px] text-muted-foreground sm:max-w-none">
              {hint}
            </span>
          )}
          {code && (
            <span role="tablist" className="flex items-center">
              <Tab
                selected={showing === "preview"}
                onClick={() => setTab("preview")}
              >
                Preview
              </Tab>
              <Tab selected={showing === "code"} onClick={() => setTab("code")}>
                Code
              </Tab>
            </span>
          )}
          {showing === "code" && code ? (
            <CopyIconButton text={code} />
          ) : (
            <button
              type="button"
              onClick={() => setSplit((s) => !s)}
              aria-pressed={split}
              title={split ? "One theme" : "Light and dark, side by side"}
              className={cn(
                "flex size-6 items-center justify-center rounded-md transition-[color,opacity,transform] duration-150 ease-emphasis active:scale-90",
                split
                  ? "text-foreground"
                  : "text-muted-foreground/60 group-hover/specimen:text-muted-foreground hover:text-foreground",
              )}
            >
              <Columns2 className="size-3.5" />
              <span className="sr-only">
                {split ? "Show one theme" : "Show light and dark side by side"}
              </span>
            </button>
          )}
        </span>
      </div>

      {showing === "code" && code ? (
        <pre className="overflow-x-auto p-4 text-[12px] leading-relaxed">
          <code className="font-sans">{code}</code>
        </pre>
      ) : split ? (
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

function Tab({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      type="button"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        "rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors",
        selected
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
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

/** The Code tab's copy: the same icon swap the props line uses. */
function CopyIconButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      }}
      className="relative flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
    >
      <Copy
        className={cn(
          "absolute size-3.5 transition-[opacity,transform] duration-150 ease-emphasis",
          copied ? "scale-75 opacity-0" : "scale-100 opacity-100",
        )}
      />
      <Check
        className={cn(
          "absolute size-3.5 text-foreground transition-[opacity,transform] duration-150 ease-emphasis",
          copied ? "scale-100 opacity-100" : "scale-75 opacity-0",
        )}
      />
      <span className="sr-only">{copied ? "Copied" : "Copy the source"}</span>
    </button>
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
