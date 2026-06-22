import type { Metadata } from "next";

import { Power } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Power className="size-5 text-foreground" />
            <CardTitle className="text-base">Download all</CardTitle>
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
          <CardTitle className="flex items-center gap-2 text-base">
            Recent exports
            {rejections > 0 ? (
              <Badge variant="secondary">{rejections} rejected (24h)</Badge>
            ) : null}
          </CardTitle>
          <CardDescription>
            The last {recent.length || 0} download attempts. A request hashes the
            IP, so no raw addresses are stored.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No exports yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">When</th>
                    <th className="py-2 pr-3 font-medium">Who</th>
                    <th className="py-2 pr-3 font-medium">Event</th>
                    <th className="py-2 pr-3 text-right font-medium">Items</th>
                    <th className="py-2 pr-3 text-right font-medium">Size</th>
                    <th className="py-2 font-medium">Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.id} className="border-b border-border/50">
                      <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="py-2 pr-3 capitalize">{r.scope}</td>
                      <td className="py-2 pr-3">
                        {r.eventName ?? (
                          <span className="text-muted-foreground">
                            {r.eventId ? `${r.eventId.slice(0, 8)}…` : "unknown"}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {r.itemCount || ""}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {r.totalBytes ? formatBytes(r.totalBytes) : ""}
                      </td>
                      <td className="py-2">
                        <span
                          className={
                            r.outcome === "minted"
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }
                        >
                          {OUTCOME_LABEL[r.outcome] ?? r.outcome}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
