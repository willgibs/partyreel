"use client";

import { useId, useState } from "react";

import { cn } from "@/lib/utils";

import { CopyButton } from "./copy";

/**
 * A SPECIMEN AND ITS SOURCE (the Library x Lab round, 2026-09-15). Preview and
 * Code are two tabs and Code is the SECOND one everywhere a specimen shows: an
 * agent reading the library is usually one keystroke from writing the same
 * component, and the fastest honest answer to "how do I use this" is the lines
 * that made the thing above it.
 *
 * `name` prints the file the code came from, so a pasted snippet keeps its
 * origin. Long code scrolls inside the block rather than pushing the page: a
 * gallery of forty specimens whose code panels each ran twenty lines would be
 * unreadable as a page.
 *
 * Motion: the tab label changes instantly (a tab strip is high-frequency), and
 * only the underline travels, 140ms on the emphasis curve, which is what tells
 * the eye the two panels are the same object seen two ways.
 */
export function PreviewCode({
  preview,
  code,
  language = "tsx",
  name,
  defaultTab = "preview",
  className,
  previewClassName,
}: {
  preview: React.ReactNode;
  code: string;
  language?: string;
  /** The file the code came from, printed beside the tabs. */
  name?: string;
  defaultTab?: "preview" | "code";
  className?: string;
  /** The preview pane's own padding or ground, when the default 1rem is wrong. */
  previewClassName?: string;
}) {
  const [tab, setTab] = useState<"preview" | "code">(defaultTab);
  const id = useId();
  const tabClass = (t: typeof tab) =>
    cn(
      "relative px-2.5 py-1.5 text-[12px] font-medium",
      tab === t
        ? "text-foreground"
        : "text-muted-foreground hover:text-foreground",
    );

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border pr-2 pl-1">
        <div role="tablist" aria-label="Preview or code" className="flex">
          {(["preview", "code"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              type="button"
              id={`${id}-${t}`}
              aria-selected={tab === t}
              aria-controls={`${id}-panel`}
              onClick={() => setTab(t)}
              className={tabClass(t)}
            >
              {t === "preview" ? "Preview" : "Code"}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-1.5 -bottom-px h-px origin-center bg-foreground transition-transform duration-140 ease-emphasis motion-reduce:transition-none",
                  tab === t ? "scale-x-100" : "scale-x-0",
                )}
              />
            </button>
          ))}
        </div>
        <div className="flex min-w-0 items-center gap-2">
          {name && (
            <span className="min-w-0 truncate text-[10px] text-muted-foreground">
              {name}
            </span>
          )}
          {tab === "code" && (
            <CopyButton text={code} label="Copy" className="border-0 px-1" />
          )}
        </div>
      </div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${tab}`}>
        {tab === "preview" ? (
          <div className={cn("p-4", previewClassName)}>{preview}</div>
        ) : (
          <pre
            className="max-h-96 overflow-auto p-4 text-[12px] leading-relaxed"
            data-language={language}
          >
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
