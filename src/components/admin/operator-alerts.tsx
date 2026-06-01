"use client";

import Link from "next/link";
import { Bell, Flag, LifeBuoy, Users } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
const ALERTS = [
  {
    key: "support",
    href: "/admin/support",
    icon: LifeBuoy,
    text: (n: number) =>
      `${n} new support ${n === 1 ? "submission" : "submissions"}`,
  },
  {
    key: "applicants",
    href: "/admin/applicants",
    icon: Users,
    text: (n: number) => `${n} new ${n === 1 ? "applicant" : "applicants"}`,
  },
  {
    key: "reports",
    href: "/admin/reports",
    icon: Flag,
    text: (n: number) => `${n} open ${n === 1 ? "report" : "reports"}`,
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
        <DropdownMenuLabel>Needs attention</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {active.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            Nothing pending.
          </p>
        ) : (
          active.map(({ key, href, icon: Icon, text }) => (
            <DropdownMenuItem key={key} asChild>
              <Link href={href} className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground" />
                <span>{text(counts[key])}</span>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
