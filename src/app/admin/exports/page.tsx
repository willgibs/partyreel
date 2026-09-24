import type { Metadata } from "next";

import { Power } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeading } from "@/components/shared/page-heading";
import { requireAdmin } from "@/lib/auth/admin-context";
import {
  countExportRejections24h,
  getExportEnabled,
  listRecentExports,
} from "@/lib/db/queries/exports";
import { formatAdminTimestamp } from "@/lib/format/admin-time";
import { formatCount } from "@/lib/format/count";
import { formatBytes } from "@/lib/utils";

import { ExportKillSwitch } from "./export-kill-switch";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Exports" };

// Human label for an export_log outcome (the mint route's vocabulary).
const OUTCOME_LABEL: Record<string, string> = {
  minted: "Downloaded",
  rejected_mode: "Paused",
  rejected_cap: "Too large",
  rejected_empty: "Empty",
  rate_limited: "Rate limited",
};

// Backend-job observability for "Download all" (P8): the recent-exports log + the platform kill-switch.
// The Worker can't reach the DB, so the mint routes are the choke point that writes export_log; Worker
// stream errors live in the Cloudflare dashboard.
export default async function ExportsPage() {
  const ctx = await requireAdmin();
  if (ctx.aal !== "aal2") return null;

  const [enabled, rejections, recent] = await Promise.all([
    getExportEnabled(),
    countExportRejections24h(),
    listRecentExports(50),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <PageHeading>Exports</PageHeading>
        <p className="text-sm text-muted-foreground">
          Recent album downloads and the platform kill-switch.
        </p>
      </div>

      {/* The palette jumps here rather than throwing the switch itself
          (lib/admin/palette.ts), so the id is part of that contract. */}
      <Card id="downloads" className="scroll-mt-20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Power className="size-5 text-foreground" />
            <CardTitle>Download all</CardTitle>
          </div>
          <CardDescription>
            Pause to block all new album downloads platform-wide. Existing
            in-progress downloads finish.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExportKillSwitch enabled={enabled} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Recent exports
            {rejections > 0 ? (
              <Badge variant="secondary">
                {formatCount(rejections)} rejected (24h)
              </Badge>
            ) : null}
          </CardTitle>
          <CardDescription>
            The last {recent.length || 0} download attempts. A request hashes
            the IP, so no raw addresses are stored.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {recent.length === 0 ? (
            <p className="px-6 text-working text-muted-foreground">No exports yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Who</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead>Outcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((r) => (
                  <TableRow
                    key={r.id}
                    // A refusal tints its row: the point of this log is to find
                    // the ones that did not work by scrolling, not by reading.
                    tone={r.outcome === "minted" ? undefined : "warning"}
                  >
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatAdminTimestamp(r.created_at)}
                    </TableCell>
                    <TableCell className="capitalize">{r.scope}</TableCell>
                    <TableCell>
                      {r.eventName ?? (
                        <span className="text-muted-foreground">
                          {r.eventId ? `${r.eventId.slice(0, 8)}\u2026` : "unknown"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.itemCount ? formatCount(r.itemCount) : ""}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.totalBytes ? formatBytes(r.totalBytes) : ""}
                    </TableCell>
                    <TableCell>
                      {r.outcome === "minted" ? (
                        <Badge variant="success">
                          {OUTCOME_LABEL[r.outcome]}
                        </Badge>
                      ) : (
                        <Badge variant="warning">
                          {OUTCOME_LABEL[r.outcome] ?? r.outcome}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
