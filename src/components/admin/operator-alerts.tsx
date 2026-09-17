"use client";

import Link from "next/link";
import { Bell, Flag, LifeBuoy, Users } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuMeta,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type OperatorAlertCounts = {
  support: number;
  applicants: number;
  reports: number;
};

// Portal-wide "needs attention" bell for the operator (mirrors the host notification bell). Fed the
// EXISTING pending-work counts from the layout. Derived-on-read STATE: the badge reflects current
// pending work and clears as the operator triages (page-load + post-action revalidation refresh it;
// no real-time, matching the host bell). Lists only non-zero categories, each linking to its surface.
// THE ROW NAMES THE SURFACE AND THE COUNT RIDES THE RIGHT (Card, Will
// 2026-09-17: "state on the right"). It used to be one sentence per row ("3 new
// support submissions"), which put the number where the eye scans for a name
// and made every row a different length; the count is the thing you opened this
// for, so it gets the trailing column and the label stays a label. `state` is
// what the number means, since "new" and "open" are not the same claim.
const ALERTS = [
  {
    key: "support",
    href: "/admin/support",
    icon: LifeBuoy,
    label: "Support",
    state: "new",
  },
  {
    key: "applicants",
    href: "/admin/applicants",
    icon: Users,
    label: "Applicants",
    state: "new",
  },
  {
    key: "reports",
    href: "/admin/reports",
    icon: Flag,
    label: "Reports",
    state: "open",
  },
] as const;

export function OperatorAlerts({
  support,
  applicants,
  reports,
}: OperatorAlertCounts) {
  const counts = { support, applicants, reports };
  const total = support + applicants + reports;
  const active = ALERTS.filter((a) => counts[a.key] > 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={total > 0 ? `Alerts, ${total} pending` : "Alerts"}
        className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Bell className="size-5" />
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-foreground">
            {total > 9 ? "9+" : total}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuHeader meta={total > 0 ? String(total) : undefined}>
          Needs attention
        </DropdownMenuHeader>
        {active.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            Nothing pending.
          </p>
        ) : (
          <DropdownMenuGroup>
            {active.map(({ key, href, icon: Icon, label, state }) => (
              <DropdownMenuItem key={key} asChild>
                {/* The icon colour is the primitive's rail now, not a class
                    typed here (dropdown-menu.tsx). */}
                <Link href={href}>
                  <Icon />
                  <span>{label}</span>
                  <DropdownMenuMeta>
                    {counts[key]} {state}
                  </DropdownMenuMeta>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
