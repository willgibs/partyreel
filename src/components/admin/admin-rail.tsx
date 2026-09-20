"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

import { Kbd } from "@/components/shared/kbd";
import {
  isNavActive,
  navGroups,
  pendingForHref,
  type PendingCounts,
} from "@/lib/admin/nav";
import { cn } from "@/lib/utils";

/**
 * THE RAIL (`nav=rail-palette`, Will 2026-09-20).
 *
 * 232px of permanent structure: every surface, the part of the portal it
 * belongs to, and its pending count, all readable without a click. Twelve
 * surfaces behind a dropdown meant an operator had to remember what was in
 * there and open it to find out whether anything was waiting; the counts are
 * the half of this that pays for the pixels.
 *
 * ★ IT IS `lg` AND UP, AND THE DROPDOWN IS NOT ITS FALLBACK. 232px out of 1024
 * is a fifth of a narrow window, so below `lg` the rail is simply not the right
 * shape and the bar keeps the dropdown it always had. Both read `nav.ts`.
 *
 * ★ THE PORTAL GOES FULL BLEED BESIDE IT, and that is part of the same answer
 * rather than a second decision: the product's `Container` centres a 1280
 * column, which beside a fixed rail would start the content two hundred pixels
 * right of the header's first word. Every console in the reference set lets the
 * column go once a rail arrives, and `admin-shell.tsx` does the same.
 */
export function AdminRail({
  counts,
  onOpenPalette,
}: {
  counts: PendingCounts;
  onOpenPalette: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Operations"
      className="hidden w-[232px] shrink-0 flex-col gap-4 overflow-y-auto border-r bg-muted/25 px-3 py-4 lg:flex"
    >
      <button
        type="button"
        onClick={onOpenPalette}
        className="flex items-center gap-2 rounded-md border bg-background px-2.5 py-1.5 text-working text-muted-foreground transition-colors duration-150 outline-none hover:border-foreground/25 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Search aria-hidden className="size-3.5" />
        <span className="flex-1 text-left">Search or jump to</span>
        <Kbd>{"⌘K"}</Kbd>
      </button>

      {navGroups().map(({ group, items }) => (
        <div key={group} className="flex flex-col gap-0.5">
          <p className="px-2.5 pb-1 text-label font-medium text-muted-foreground/70 uppercase">
            {group}
          </p>
          {items.map((item) => {
            const Icon = item.icon;
            const current = isNavActive(pathname, item.href);
            const count = pendingForHref(counts, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-working transition-colors duration-150 outline-none",
                  "focus-visible:ring-3 focus-visible:ring-ring/50",
                  current
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <Icon aria-hidden className="size-4 shrink-0 opacity-80" />
                <span className="flex-1 truncate">{item.label}</span>
                {count > 0 ? (
                  // The number, never a dot: "3" and "30" are different days
                  // and a dot says the same thing about both.
                  <span className="text-caption tabular-nums opacity-70">
                    {count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
