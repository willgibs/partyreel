"use client";

import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { applyLabState, type LabState } from "@/app/(dev)/design/_data/state";
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
        const opt = {
          origin: typeof location === "undefined" ? "" : location.origin,
        };
        const head = facts
          ? factsToMarkdown({ ...facts, url })
          : `# ${document.title}\n\n${url}`;
        // The header is skipped by the body pass (it carries `data-copy-skip`
        // so nothing is said twice), so it is translated here on its own.
        const intro = elementToMarkdown(
          document.querySelector("[data-toc-root] header[data-copy-skip]"),
          opt,
        );
        const body = elementToMarkdown(
          document.querySelector("[data-toc-root]"),
          opt,
        );
        return [head, intro, body].filter(Boolean).join("\n\n");
      }}
    />
  );
}

/**
 * THE LINK TO EXACTLY THIS VIEW: the path, the address bar's whole query and
 * the section, so "look at the shut door when Lena is turned away" is a link
 * rather than a sentence.
 *
 * ★ THE BAR'S OWN QUERY, NEVER THE LAB'S SIX PARAMS ALONE (lab-sitting, from
 * ROADMAP's line on `CopyLink`). A board writes each of its controls to the
 * address under the control's own id (`useBoardState`: "the URL is the share
 * format"), and a one-at-a-time catalog its card, so a copy rebuilt from the
 * lab's six params (`_data/state.ts`) dropped every one of them. The query is
 * read from `location` at the press, the same moment the bar shows, the key
 * is the page's own (the proxy's, never a stale one the bar was left holding),
 * and the lab's params lead in their order so two links to one view read
 * alike.
 */
export function viewLink(
  at: { origin: string; pathname: string; search: string; hash: string },
  state: LabState,
): string {
  const params = new URLSearchParams(at.search);
  if (state.key) params.set("key", state.key);
  const query = params.toString();
  return `${at.origin}${applyLabState(`${at.pathname}${query ? `?${query}` : ""}${at.hash}`, {})}`;
}

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
        typeof location === "undefined" ? "" : viewLink(location, state)
      }
    />
  );
}
