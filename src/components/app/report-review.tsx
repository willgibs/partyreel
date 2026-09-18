"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import {
  actionReportAction,
  dismissReportAction,
} from "@/app/admin/reports/actions";
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

  function onAction() {
    startTransition(async () => {
      const result = await actionReportAction(
        report.id,
        report.media?.id ?? null,
      );
      if (result.ok) {
        toast.success(
          report.media
            ? "Item removed and report actioned."
            : "Report actioned.",
        );
        return;
      }
      toast.error("Couldn't action the report.", {
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
        {/* toLocaleString() renders in the server's tz/locale during SSR and the browser's on
            hydration -> a text mismatch (React #418). Suppress it; the client value wins. */}
        <p className="text-xs text-muted-foreground" suppressHydrationWarning>
          {new Date(report.created_at).toLocaleString()}
          {report.media ? " · item reported" : " · album reported"}
          {report.resolved_at
            ? ` · resolved ${new Date(report.resolved_at).toLocaleString()}`
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
            onClick={onAction}
          >
            {report.media ? "Remove item & action" : "Action"}
          </Button>
        </CardFooter>
      )}
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
