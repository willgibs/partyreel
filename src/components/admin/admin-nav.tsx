"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isNavActive, NAV } from "@/lib/admin/nav";
import { cn } from "@/lib/utils";

// The operator nav, collapsed into a single dropdown selector (the flat 8+ -item bar grew too long).
// Trigger shows the CURRENT section (icon + label + chevron); the menu lists every surface with the
// active one checked. Reuses the marketing-nav dropdown pattern; keyboard-accessible via radix.
export function AdminNav() {
  const pathname = usePathname();
  const active = NAV.find((item) => isNavActive(pathname, item.href)) ?? NAV[0];
  const ActiveIcon = active.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm font-medium transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-muted">
        <ActiveIcon className="size-4 text-muted-foreground" />
        {active.label}
        <ChevronDown className="size-3.5 text-muted-foreground transition-transform duration-150 group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {NAV.map(({ href, label, icon: Icon }) => {
          const current = isNavActive(pathname, href);
          return (
            <DropdownMenuItem
              key={href}
              asChild
              className={cn(current && "bg-accent")}
            >
              <Link href={href} className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground" />
                <span className="flex-1">{label}</span>
                {current ? <Check className="size-4" /> : null}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
