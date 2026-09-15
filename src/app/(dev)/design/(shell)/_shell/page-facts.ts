"use client";

import { useEffect } from "react";

import type { PageFacts } from "./page-markdown";

/**
 * WHAT THE PAGE KNOWS ABOUT ITSELF (the Library x Lab round, 2026-09-15).
 * `PageHeader` is given the title, the line under it, the pills and the meta
 * pairs as PROPS; Copy page needs exactly those, and reading them back off the
 * pixels would be a worse copy of data we already hold. One module-level slot
 * rather than context: only the copy button reads it, and only at click time,
 * so a context here would re-render the whole page for nothing.
 *
 * A page that can hand over its real source (a doc page holds the markdown it
 * rendered) sets it with `useCopySource`, and that wins over everything.
 */
let facts: PageFacts | null = null;
let source: string | null = null;

export function getPageFacts(): PageFacts | null {
  return facts;
}

export function getCopySource(): string | null {
  return source;
}

/** Called by PageHeader on every render; cleared when the page unmounts. */
export function useReportPageFacts(next: PageFacts): void {
  useEffect(() => {
    facts = next;
    return () => {
      facts = null;
    };
  });
}

/** The exact markdown Copy page should hand over for this page. */
export function useCopySource(markdown: string | null): void {
  useEffect(() => {
    source = markdown;
    return () => {
      source = null;
    };
  }, [markdown]);
}
