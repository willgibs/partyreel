import Link from "next/link";

import {
  TRIAGE_STATUS_META,
  TRIAGE_STATUSES,
  type TriageStatus,
} from "@/lib/constants/triage";
import { cn } from "@/lib/utils";

// Server-rendered status filter for the Support + Applicants inboxes. Each tab is a link that
// sets `?status=` (the page re-fetches server-side); "All" clears the filter. No client JS.
export function TriageFilter({
  basePath,
  active,
}: {
  basePath: string;
  active?: TriageStatus;
}) {
  const tabs = [
    { key: "all", label: "All", href: basePath, isActive: !active },
    ...TRIAGE_STATUSES.map((s) => ({
      key: s as string,
      label: TRIAGE_STATUS_META[s].label,
      href: `${basePath}?status=${s}`,
      isActive: active === s,
    })),
  ];

  return (
    <nav className="flex flex-wrap gap-1">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors",
            tab.isActive
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
