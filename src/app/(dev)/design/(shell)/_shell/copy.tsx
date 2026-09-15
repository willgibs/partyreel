"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

/** Copies `text` (or what `getText` returns at click time) and says so for 1.5s. */
export function CopyButton({
  text,
  getText,
  label = "Copy",
  copied = "Copied",
  className,
}: {
  text?: string;
  getText?: () => string;
  label?: string;
  copied?: string;
  className?: string;
}) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const value = getText ? getText() : (text ?? "");
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          // A blocked clipboard (an insecure origin) leaves the label as is.
        }
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      {done ? <Check className="size-3" /> : <Copy className="size-3" />}
      {done ? copied : label}
    </button>
  );
}

/**
 * Copies the page as text: the title, then the content column as the browser
 * reads it (headings, lists and tables keep their lines). Phase 0's rendition;
 * the lab-shell track replaces it with markdown built from the page's data.
 */
export function CopyPage() {
  return (
    <CopyButton
      label="Copy page"
      getText={() => {
        const root = document.querySelector<HTMLElement>("[data-toc-root]");
        const title = document.title;
        const body = root?.innerText ?? "";
        return `${title}\n${location.href}\n\n${body}`;
      }}
    />
  );
}
