"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import type { EntryBadge } from "@/app/(dev)/design/gallery/entry";
import { groupByKey } from "@/app/(dev)/design/gallery/group-by";

export type LibraryRow = {
  id: string;
  title: string;
  href: string;
  file: string;
  /** The family's label: the group the row sits in. */
  group: string;
  /** The entry's one line: what the component is for. */
  for?: string;
  specimens: number;
  variants: number;
  play: boolean;
  /** `new` or `updated`, declared on the catalog entry by the round that touched it. */
  badge?: EntryBadge;
};

/**
 * One group per family, in the order a family FIRST appears, holding every
 * row of that family wherever it sits in the input, so React's `key={group}`
 * stays unique however the rows arrive.
 */
export function groupRows(rows: LibraryRow[]): [string, LibraryRow[]][] {
  return groupByKey(rows, (r) => r.group);
}

/**
 * THE CATALOG'S INDEX, filtered in the browser: every entry, one row each,
 * searchable by name, by file and by what it is for. This is the list a
 * reader lands on when it does not yet know what the thing is called, which
 * is why the `for` line is in the haystack and not just on screen.
 */
export function LibraryIndex({ rows }: { rows: LibraryRow[] }) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hit = (r: LibraryRow) =>
      !q ||
      r.title.toLowerCase().includes(q) ||
      r.file.toLowerCase().includes(q) ||
      (r.for ?? "").toLowerCase().includes(q);
    return groupRows(rows.filter(hit));
  }, [rows, query]);

  const shown = groups.reduce((n, [, g]) => n + g.length, 0);

  return (
    <>
      <div role="search" className="mt-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, file, or what it is for"
            aria-label="Search the catalog"
            className="h-10 w-full rounded-lg border border-border bg-card pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground tabular-nums">
          {shown} of {rows.length}
        </p>
      </div>

      {groups.length === 0 ? (
        <p
          role="status"
          className="py-16 text-center text-sm text-muted-foreground"
        >
          Nothing matches &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {groups.map(([group, items]) => (
            <div
              key={group}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <p className="border-b border-border px-4 py-2 text-[11px] text-muted-foreground">
                {group}
              </p>
              <ul className="divide-y divide-border">
                {items.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={r.href}
                      className="group/row flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-4 py-2 transition-colors hover:bg-muted/50"
                    >
                      <span className="flex items-baseline gap-1.5">
                        <span className="text-[13px] font-medium group-hover/row:underline">
                          {r.title}
                        </span>
                        {r.badge && <Tag badge={r.badge} />}
                      </span>
                      {r.for && (
                        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                          {r.for}
                        </span>
                      )}
                      <span className="ml-auto flex shrink-0 items-baseline gap-1.5 text-[10px] text-muted-foreground">
                        {r.play && <Pill tone="strong">config</Pill>}
                        {r.variants > 0 && <Pill>{r.variants} variants</Pill>}
                        {r.specimens > 0 && (
                          <Pill>{plural(r.specimens, "specimen")}</Pill>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function Pill({
  children,
  tone = "quiet",
}: {
  children: React.ReactNode;
  tone?: "quiet" | "strong";
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-1.5 py-0.5",
        tone === "strong"
          ? "border-transparent bg-foreground text-background"
          : "border-border",
      )}
    >
      {children}
    </span>
  );
}
