import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";

import { HomeHead } from "@/components/app/dashboard/home-head";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";

/**
 * THE PAGE'S HEAD: production's own (`HomeHead`) as built, or with the storage
 * ring the other way at a phone (`details=ring`, H6): in the first row beside
 * New event, where production puts it on the line under the day so the day
 * and New event keep the first row whole at 375. Above a phone's width the two
 * are the same row.
 */
export function Head({
  day,
  line,
  storage,
  ringFirst,
}: {
  day: string;
  line: string;
  storage: ReactNode;
  /** H6's ring the other way: beside New event in a phone's first row. */
  ringFirst: boolean;
}) {
  if (!ringFirst) return <HomeHead day={day} line={line} storage={storage} />;
  // The first row holds the day, the ring and New event whole, so the day's
  // name is what gives way (the option's cost, drawn as it would ship).
  return (
    <div data-home-head="" data-hd-ring="first" className="space-y-0.5">
      <div className="flex items-center gap-x-3 sm:gap-x-4">
        <PageHeading className="min-w-0 flex-1 truncate text-subsection sm:flex-none sm:text-page">
          {day}
        </PageHeading>
        <p className="text-sm text-muted-foreground max-sm:hidden">{line}</p>
        <div className="shrink-0 sm:ml-auto">{storage}</div>
        <Button asChild className="shrink-0">
          <Link href="/dashboard/new">
            <CalendarPlus /> New event
          </Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground sm:hidden">{line}</p>
    </div>
  );
}
