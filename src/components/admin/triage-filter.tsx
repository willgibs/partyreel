import Link from "next/link";

import type { BadgeTone } from "@/lib/admin/tone";
import {
  TRIAGE_STATUS_META,
  TRIAGE_STATUSES,
  type TriageStatus,
} from "@/lib/constants/triage";
import { cn } from "@/lib/utils";

/**
 * ONE INBOX'S WORDS: its statuses in the order it says them, and what each is called and wears.
 * The filter bar and the status picker take them as one prop (admin-triage r1, `idiom=shape`, Will
 * 2026-09-28: one control and one filter bar on every inbox, each in its own words), so Reports says
 * Open, Dismissed and Actioned where Support and Applicants say New, In progress and Closed.
 *
 * ★ THIS FILE IS THE WORDS' HOME, NOT THE PICKER'S. The picker is a client component, and a value
 * a server component imports from a "use client" module arrives as a client reference, not an
 * object; the filter renders on the server, so the shared words live here, with no directive.
 */
export type InboxWords<S extends string> = {
  statuses: readonly S[];
  meta: Record<S, { label: string; badge: BadgeTone }>;
};

/** Support's and Applicants' words, the default for both controls. */
export const TRIAGE_WORDS: InboxWords<TriageStatus> = {
  statuses: TRIAGE_STATUSES,
  meta: TRIAGE_STATUS_META,
};

/**
 * The shared, server-rendered status filter. Each tab is a link that sets `?status=` (the page
 * re-fetches server-side), All first. `landing` is the tab the bare path shows: All for Support and
 * Applicants, the queue (Open) for Reports, whose All is then `?status=all`. No client JS.
 */
export function TriageFilter<S extends string = TriageStatus>({
  basePath,
  active,
  words = TRIAGE_WORDS as unknown as InboxWords<S>,
  landing = "all",
}: {
  basePath: string;
  /** The status the page shows; undefined reads as All. */
  active?: S | "all";
  words?: InboxWords<S>;
  landing?: S | "all";
}) {
  const shown = active ?? "all";
  const hrefOf = (key: S | "all") =>
    key === landing ? basePath : `${basePath}?status=${key}`;
  const tabs: { key: S | "all"; label: string }[] = [
    { key: "all", label: "All" },
    ...words.statuses.map((s) => ({ key: s, label: words.meta[s].label })),
  ];

  return (
    <nav aria-label="Filter by status" className="flex flex-wrap gap-1">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={hrefOf(tab.key)}
          prefetch={false}
          aria-current={shown === tab.key ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors",
            shown === tab.key
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
