"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";

import {
  actionReportAction,
  dismissReportAction,
} from "@/app/admin/reports/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportStatus, ReviewProfileReport } from "@/lib/db/queries/reports";
import { formatAdminTimestamp } from "@/lib/format/admin-time";

/**
 * The operator's view of a REPORTED PERSON (Will, `block=report`, 2026-09-19).
 *
 * ★ ITS OWN SECTION, NOT A ROW INSIDE ReportReviewList. That list is built
 * around a presigned photograph and an event; a person report has neither, and
 * bending one card to carry both subjects would leave every media report paying
 * for branches it never takes. Same actions, same queue, same status machine:
 * only the subject differs, so only the card does.
 *
 * ★ AND THE HANDLE IS A LINK, deliberately: deciding about a person means
 * looking at what they published, and /u/<slug> is that page. A reported
 * account with no handle has no page to open, so the name renders plain.
 * Nothing here names the reporter, because nothing stores one.
 */
const STATUS_META: Record<
  ReportStatus,
  { label: string; badge: "default" | "secondary" | "destructive" | "outline" }
> = {
  open: { label: "Open", badge: "default" },
  reviewed: { label: "Reviewed", badge: "secondary" },
  dismissed: { label: "Dismissed", badge: "outline" },
  actioned: { label: "Actioned", badge: "destructive" },
};

function PersonReportCard({ report }: { report: ReviewProfileReport }) {
  const [isPending, startTransition] = useTransition();
  const meta = STATUS_META[report.status];
  const name = report.profile?.displayName ?? "A deleted account";

  function onDismiss() {
    startTransition(async () => {
      const result = await dismissReportAction(report.id);
      if (result.ok) {
        toast.success("Report dismissed.");
        return;
      }
      toast.error("Couldn't dismiss the report.", {
        description: result.message,
      });
    });
  }

  function onAction() {
    startTransition(async () => {
      // No media id: actioning a PERSON marks the report handled. The account
      // itself is dealt with out of band, exactly as an album-level report is.
      const result = await actionReportAction(report.id, null);
      if (result.ok) {
        toast.success("Report actioned.");
        return;
      }
      toast.error("Couldn't action the report.", {
        description: result.message,
      });
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="truncate">{name}</CardTitle>
          {report.profile?.slug ? (
            <Link
              href={`/u/${report.profile.slug}`}
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              @{report.profile.slug}
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">No public handle</p>
          )}
        </div>
        <Badge variant={meta.badge}>{meta.label}</Badge>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-sm text-pretty">
          {report.reason ?? "No reason given."}
        </p>
        <p className="text-xs text-muted-foreground">
          Reported {formatAdminTimestamp(report.created_at)}
        </p>
      </CardContent>
      {report.status === "open" && (
        <CardFooter className="justify-end gap-2">
          <Button variant="outline" onClick={onDismiss} disabled={isPending}>
            Dismiss
          </Button>
          <Button
            variant="destructive"
            onClick={onAction}
            disabled={isPending}
          >
            Mark actioned
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export function PersonReportList({
  reports,
}: {
  reports: ReviewProfileReport[];
}) {
  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <PersonReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}
