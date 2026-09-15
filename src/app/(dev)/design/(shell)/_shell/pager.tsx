"use client";

import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { neighbours } from "@/app/(dev)/design/_data/catalog";
import { LabLink, useNav } from "./shell-context";

type Neighbour = { href: string; label: string };

/**
 * Prev and next at the foot of every page: the section's order by default
 * (the nav), or the pair the page passes (bible order on a rule, family order
 * on a component, registry order on a board).
 */
export function Pager({ prev, next }: { prev?: Neighbour; next?: Neighbour }) {
  const nav = useNav();
  const pathname = usePathname();
  const auto = neighbours(nav, pathname);
  const p = prev ?? auto.prev;
  const n = next ?? auto.next;
  if (!p && !n) return null;
  return (
    <nav
      aria-label="Previous and next"
      className="mt-16 flex items-stretch justify-between gap-3 border-t border-border pt-6"
    >
      {p ? (
        <LabLink
          href={p.href}
          className="group flex min-w-0 flex-col gap-0.5 rounded-lg border border-border px-3 py-2 text-left hover:bg-muted/40"
        >
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <ArrowLeft className="size-3" /> Previous
          </span>
          <span className="truncate text-sm font-medium">{p.label}</span>
        </LabLink>
      ) : (
        <span />
      )}
      {n ? (
        <LabLink
          href={n.href}
          className="group flex min-w-0 flex-col items-end gap-0.5 rounded-lg border border-border px-3 py-2 text-right hover:bg-muted/40"
        >
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            Next <ArrowRight className="size-3" />
          </span>
          <span className="truncate text-sm font-medium">{n.label}</span>
        </LabLink>
      ) : (
        <span />
      )}
    </nav>
  );
}
