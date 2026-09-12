"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

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
  unspecimened?: string;
};

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
    const out: [string, LibraryRow[]][] = [];
    for (const r of rows.filter(hit)) {
      const last = out.at(-1);
      if (last?.[0] === r.dir) last[1].push(r);
      else out.push([r.dir, [r]]);
    }
    return out;
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
        <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
          {shown} of {rows.length}
        </p>
      </div>

      {groups.length === 0 ? (
        <p role="status" className="py-16 text-center text-sm text-muted-foreground">
          Nothing matches &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {groups.map(([dir, items]) => (
            <div key={dir} className="overflow-hidden rounded-xl border border-border bg-card">
              <p className="border-b border-border px-4 py-2 font-mono text-[11px] text-muted-foreground">
                {dir}
              </p>
              <ul className="divide-y divide-border">
                {items.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={r.href}
                      className="group/row flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-4 py-2 transition-colors hover:bg-muted/50"
                    >
                      <span className="text-[13px] font-medium group-hover/row:underline">
                        {r.title}
                      </span>
                      {r.for && (
                        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                          {r.for}
                        </span>
                      )}
                      <span className="ml-auto flex shrink-0 items-baseline gap-1.5 font-mono text-[10px] text-muted-foreground">
                        {r.play && <Pill tone="strong">config</Pill>}
                        {r.variants > 0 && <Pill>{r.variants} variants</Pill>}
                        {r.specimens > 0 && <Pill>{r.specimens} specimens</Pill>}
                        {r.contracts > 0 && <Pill>{r.contracts} contracts</Pill>}
                        {r.specimens === 0 && r.unspecimened && <Pill>no specimen</Pill>}
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
