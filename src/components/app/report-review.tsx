"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  actionReportAction,
  dismissReportAction,
} from "@/app/admin/reports/actions";
import { DestructiveSheet } from "@/components/admin/destructive-sheet";
import { MediaTile } from "@/components/app/media-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ReportStatus, ReviewReport } from "@/lib/db/queries/reports";
import { formatAdminTimestamp } from "@/lib/format/admin-time";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";

// Operator review list. The page (server) does the gating + presigning and hands down
// serializable reports; this client layer wires the resolve actions (useTransition + toast).
// "Open" reports show Dismiss/Action; resolved reports render read-only (the "all" history view).
// "Action" soft-removes the reported item (if any) + marks the report actioned (cron reclaims later).

const REPORT_STATUS_META: Record<
  ReportStatus,
  { label: string; badge: "default" | "secondary" | "destructive" | "outline" }
> = {
  open: { label: "Open", badge: "default" },
  reviewed: { label: "Reviewed", badge: "secondary" },
  dismissed: { label: "Dismissed", badge: "outline" },
  actioned: { label: "Actioned", badge: "destructive" },
};

function ReportCard({ report }: { report: ReviewReport }) {
  const [isPending, startTransition] = useTransition();
  // admin-observability.md: "Every destructive act opens destructive-sheet.tsx" — Action was the
  // one holdout, firing at once on the click that opened it (crumbs-6). Reversible (the item is
  // soft-removed, same as Albums' own Remove), so no typed confirmation; whether the confirm
  // carries a note is admin-triage's `verdict`, still on the desk, so this asks for none.
  const [asking, setAsking] = useState(false);
  const meta = REPORT_STATUS_META[report.status];

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>{report.event?.name ?? "Unknown event"}</CardTitle>
          <Badge variant={meta.badge}>{meta.label}</Badge>
        </div>
        {/* clocks-and-counts (outside this file's own lane, one line): admin timestamps now render
            through the shared UTC-labelled formatter (admin-observability.md), which is deterministic
            across server and client, so the suppressHydrationWarning this needed is gone with it. */}
        <p className="text-xs text-muted-foreground">
          {formatAdminTimestamp(report.created_at)}
          {report.media ? " · item reported" : " · album reported"}
          {report.resolved_at
            ? ` · resolved ${formatAdminTimestamp(report.resolved_at)}`
            : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {report.media && (
          <div className="aspect-square w-40 overflow-hidden rounded-lg bg-black/10">
            <MediaTile item={report.media} />
          </div>
        )}
        <p className="text-sm">
          {report.reason ?? (
            <span className="text-muted-foreground">No reason provided.</span>
          )}
        </p>
      </CardContent>
      {report.status === "open" && (
        <CardFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={onDismiss}
          >
            Dismiss
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={() => setAsking(true)}
          >
            {report.media ? "Remove item & action" : "Action"}
          </Button>
        </CardFooter>
      )}
      <DestructiveSheet
        open={asking}
        onOpenChange={setAsking}
        title={
          report.media
            ? "Remove this item and action the report?"
            : "Action this report?"
        }
        lede={
          report.media
            ? "It leaves the guest album now, and you can restore it until the grace ends."
            : "The report moves to Actioned; nothing else changes."
        }
        verb={report.media ? "Remove & action" : "Action"}
        touches={
          report.media
            ? [
                `1 ${report.media.type} in ${report.event?.name ?? "this event"}`,
                `Restorable for ${RECENTLY_DELETED_WINDOW_DAYS} days, then the purge deletes the bytes`,
                "At an event that reviews uploads, her uploads list already says Not in the album",
              ]
            : ["This report moves to Actioned", "The album itself is unchanged"]
        }
        severity="reversible"
        successMessage={
          report.media
            ? "Item removed and report actioned."
            : "Report actioned."
        }
        onConfirm={() =>
          actionReportAction(report.id, report.media?.id ?? null)
        }
      />
    </Card>
  );
}

export function ReportReviewList({ reports }: { reports: ReviewReport[] }) {
  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}
