import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";

import { HomeHead } from "@/components/app/dashboard/home-head";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  return (
    <div
      data-home-head=""
      data-hd-ring="first"
      className="flex flex-wrap items-center gap-x-3 gap-y-0.5 sm:gap-x-4"
    >
      <PageHeading className="order-1 min-w-0 flex-auto truncate text-subsection sm:flex-none sm:text-page">
        {day}
      </PageHeading>
      <p className="order-4 w-full text-sm text-muted-foreground sm:order-2 sm:w-auto">
        {line}
      </p>
      <div className={cn("order-2 sm:order-3 sm:ml-auto")}>{storage}</div>
      <Button asChild className="order-3 sm:order-4">
        <Link href="/dashboard/new">
          <CalendarPlus /> New event
        </Link>
      </Button>
    </div>
  );
}
