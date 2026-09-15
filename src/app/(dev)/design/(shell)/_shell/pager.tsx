"use client";

import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { neighbours } from "@/app/(dev)/design/_data/catalog";
import { Kbd } from "./kbd";
import { LabLink, useNav } from "./shell-context";

type Neighbour = { href: string; label: string };

/**
 * Prev and next at the foot of every page: the section's order by default
 * (the nav), or the pair the page passes (bible order on a rule, family order
 * on a component, registry order on a board). `[` and `]` do the same thing
 * from anywhere on the page (_shell/keys.tsx), and the caps are printed here
 * because a shortcut nobody sees is a shortcut nobody uses.
 *
 * Motion: a border and a tint on hover, 90ms, no movement. The arrow is the
 * only thing that travels (2px toward its edge), which reads as intent
 * without shifting the row.
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
      data-copy-skip
      className="mt-16 flex items-stretch justify-between gap-3 border-t border-border pt-6"
    >
      {p ? <Side item={p} side="prev" /> : <span />}
      {n ? <Side item={n} side="next" /> : <span />}
    </nav>
  );
}

function Side({ item, side }: { item: Neighbour; side: "prev" | "next" }) {
  const isPrev = side === "prev";
  const Arrow = isPrev ? ArrowLeft : ArrowRight;
  return (
    <LabLink
      href={item.href}
      className={cn(
        "group flex max-w-[48%] min-w-0 flex-col gap-0.5 rounded-lg border border-border px-3 py-2 transition-colors duration-90 hover:border-foreground/25 hover:bg-muted/40",
        isPrev ? "items-start text-left" : "items-end text-right",
      )}
    >
      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {isPrev && (
          <Arrow className="size-3 transition-transform duration-140 ease-emphasis group-hover:-translate-x-0.5 motion-reduce:transition-none" />
        )}
        {isPrev ? "Previous" : "Next"}
        <Kbd className="hidden sm:inline-flex">{isPrev ? "[" : "]"}</Kbd>
        {!isPrev && (
          <Arrow className="size-3 transition-transform duration-140 ease-emphasis group-hover:translate-x-0.5 motion-reduce:transition-none" />
        )}
      </span>
      <span className="w-full truncate text-sm font-medium">{item.label}</span>
    </LabLink>
  );
}
