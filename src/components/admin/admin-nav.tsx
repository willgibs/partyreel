"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isNavActive, NAV, navGroups } from "@/lib/admin/nav";
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
      {/* TWELVE ROWS THAT NOW SAY WHAT THEY ARE FOR. This was the longest
          anonymous list in the product: Overview through Security in one
          unbroken column, with nothing telling an operator that Support and
          Applicants are inboxes while Jobs and Security are the machine. The
          groups come from nav.ts, which is where a surface's part of the portal
          belongs (Card, Will 2026-09-17). */}
      <DropdownMenuContent align="start" className="w-56">
        {navGroups().map(({ group, items }) => (
          <DropdownMenuGroup key={group}>
            <DropdownMenuLabel>{group}</DropdownMenuLabel>
            {items.map(({ href, label, icon: Icon }) => {
              const current = isNavActive(pathname, href);
              return (
                <DropdownMenuItem
                  key={href}
                  asChild
                  className={cn(current && "bg-accent")}
                >
                  {/* The icon's rail colour is the primitive's now. */}
                  <Link href={href}>
                    <Icon />
                    <span className="flex-1">{label}</span>
                    {current ? <Check className="size-4" /> : null}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
