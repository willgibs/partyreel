"use client";

import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { labSearchString } from "@/app/(dev)/design/_data/state";
import { getCopySource, getPageFacts } from "./page-facts";
import { elementToMarkdown, factsToMarkdown } from "./page-markdown";
import { useLabState } from "./shell-context";

/** Copies `text` (or what `getText` returns at click time) and says so for 1.5s. */
export function CopyButton({
  text,
  getText,
  label = "Copy",
  copied = "Copied",
  icon,
  title,
  className,
}: {
  text?: string;
  getText?: () => string;
  label?: string;
  copied?: string;
  /** Replaces the copy glyph; the tick still confirms. */
  icon?: React.ReactNode;
  title?: string;
  className?: string;
}) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      title={title}
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
        "inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors duration-90 hover:bg-muted/50 hover:text-foreground",
        className,
      )}
    >
      {done ? (
        <Check className="size-3 shrink-0 text-success" />
      ) : (
        (icon ?? <Copy className="size-3 shrink-0" />)
      )}
      {done ? copied : label}
    </button>
  );
}

/**
 * COPY PAGE, AS MARKDOWN (the Library x Lab round, 2026-09-15). Three sources,
 * in order: the markdown a page declared (`useCopySource`), then the page's own
 * data for the head (the PageHeader's props, never a reading of the pixels),
 * then the content column's STRUCTURE for the body, translated block by block
 * (page-markdown.ts). Phase 0 handed over `innerText`, which lost every link,
 * table and code block the moment it was pasted into a plan.
 */
export function CopyPage() {
  return (
    <CopyButton
      label="Copy page"
      title="The page as markdown, ready to paste into a plan"
      getText={() => {
        const declared = getCopySource();
        const url = typeof location === "undefined" ? "" : location.href;
        if (declared) return `${declared}\n\n${url}`.trim();
        const facts = getPageFacts();
        const origin = typeof location === "undefined" ? "" : location.origin;
        const head = facts
          ? factsToMarkdown({ ...facts, url })
          : `# ${document.title}\n\n${url}`;
        const body = elementToMarkdown(
          document.querySelector("[data-toc-root]"),
          { origin },
        );
        return [head, body].filter(Boolean).join("\n\n");
      }}
    />
  );
}

/**
 * The link to exactly this view: the path plus the whole URL state (the key,
 * the canvas, the ground, the candidate, the section, the review position), so
 * "look at candidate B on the phone" is a link rather than a sentence.
 */
export function CopyLink({
  label = "Copy link",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const state = useLabState();
  return (
    <CopyButton
      label={label}
      copied="Link copied"
      icon={<Link2 className="size-3 shrink-0" />}
      title="This exact view: the page, its switches and its position"
      className={className}
      getText={() =>
        typeof location === "undefined"
          ? ""
          : `${location.origin}${location.pathname}${labSearchString(state)}${location.hash}`
      }
    />
  );
}
