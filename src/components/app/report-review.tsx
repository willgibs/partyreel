"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import {
  actionReportAction,
  dismissReportAction,
} from "@/app/(app)/admin/actions";
import { MediaTile } from "@/components/app/media-grid";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { OpenReport } from "@/lib/db/queries/reports";

// Operator review list. The page (server) does the gating + presigning and hands
// down serializable reports; this client layer wires the resolve actions
// (useTransition + toast). "Action" soft-removes the reported item (if any) and
// marks the report actioned; the purge cron reclaims storage later.

function ReportCard({ report }: { report: OpenReport }) {
  const [isPending, startTransition] = useTransition();

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
        <CardTitle className="text-base">
          {report.event?.name ?? "Unknown event"}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {new Date(report.created_at).toLocaleString()}
          {report.media ? " · item reported" : " · album reported"}
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
    </Card>
  );
}

export function ReportReviewList({ reports }: { reports: OpenReport[] }) {
  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}
