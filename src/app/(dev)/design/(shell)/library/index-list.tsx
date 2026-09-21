"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import type { EntryBadge } from "@/app/(dev)/design/gallery/entry";

export type LibraryRow = {
  id: string;
  title: string;
  href: string;
  file: string;
  dir: string;
  /** The one-line "what it is for" from COMPONENT_NOTES. */
  for?: string;
  family?: string;
  specimens: number;
  variants: number;
  contracts: number;
  play: boolean;
  /** `new` or `updated`, declared on the gallery entry by the round that touched it. */
  badge?: EntryBadge;
  unspecimened?: string;
};

/**
 * One group per directory, in the order a directory FIRST appears, holding
 * every row of that directory wherever it sits in the input. The rows come in
 * the rules artifact's order, which lists a directory's files in several runs
 * (`src/components/shared` five times on 2026-09-20); a consecutive-run scan
 * made one group per run and React refused the duplicate `key={dir}`. The
 * order is not sorted on purpose: the artifact's order is the page's order.
 */
export function groupRowsByDir(rows: LibraryRow[]): [string, LibraryRow[]][] {
  const byDir = new Map<string, LibraryRow[]>();
  for (const r of rows) {
    const group = byDir.get(r.dir);
    if (group) group.push(r);
    else byDir.set(r.dir, [r]);
  }
  return [...byDir.entries()];
}

/**
 * THE LIBRARY INDEX, filtered in the browser: every component the repo has,
 * one row each, searchable by name, by file and by what it is for. This is the
 * page an agent lands on when it does not yet know what the thing is called,
 * which is why the `for` line is in the haystack and not just on screen.
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
    return groupRowsByDir(rows.filter(hit));
  }, [rows, query]);

  const shown = groups.reduce((n, [, g]) => n + g.length, 0);

  return (
    <>
      <div role="search" className="mt-6">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, file, or what it is for"
            aria-label="Search the library"
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
          {groups.map(([dir, items]) => (
            <div
              key={dir}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <p className="border-b border-border px-4 py-2 text-[11px] text-muted-foreground">
                {dir}
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
                        {r.contracts > 0 && (
                          <Pill>{plural(r.contracts, "contract")}</Pill>
                        )}
                        {r.specimens === 0 && r.unspecimened && (
                          <Pill>no specimen</Pill>
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
