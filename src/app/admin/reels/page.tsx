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
  countReelRenderFailures24h,
  getReelRenderEnabled,
  listRecentReelRenders,
} from "@/lib/db/queries/reel-renders";

import { ReelRenderKillSwitch } from "./reel-render-kill-switch";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reels" };

// Human label for a reel_render_log outcome (the render service's vocabulary).
const OUTCOME_LABEL: Record<string, string> = {
  minted: "Started",
  cached: "Cached",
  completed: "Rendered",
  failed: "Failed",
  rejected_empty: "Empty",
  rejected_mode: "Paused",
  rejected_size: "Over size cap",
  rate_limited: "Rate limited",
  // The client-encode path (Plan A Phase C): the host's device rendered the mp4 (cost 0).
  client_minted: "Upload started",
  client_encoded: "Encoded on device",
  rejected_hash: "Config changed",
};

// Backend-job observability for the reel .mp4 export (P8): the recent-renders log + the platform
// kill-switch. The Lambda render writes nothing here directly; the render service (the trigger choke
// point) + the completion webhook log every event.
export default async function ReelsPage() {
  const ctx = await requireAdmin();
  if (ctx.aal !== "aal2") return null;

  const [enabled, failures, recent] = await Promise.all([
    getReelRenderEnabled(),
    countReelRenderFailures24h(),
    listRecentReelRenders(50),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <PageHeading>Reels</PageHeading>
        <p className="text-sm text-muted-foreground">
          Recent reel video renders and the platform kill-switch.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Power className="size-5 text-foreground" />
            <CardTitle>Reel videos</CardTitle>
          </div>
          <CardDescription>
            Pause to block all new reel video renders platform-wide. In-progress
            renders finish.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReelRenderKillSwitch enabled={enabled} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Recent renders
            {failures > 0 ? (
              <Badge variant="destructive">{failures} failed (24h)</Badge>
            ) : null}
          </CardTitle>
          <CardDescription>
            The last {recent.length || 0} render events. A request hashes the
            IP, so no raw addresses are stored.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No renders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">When</th>
                    <th className="py-2 pr-3 font-medium">Event</th>
                    <th className="py-2 pr-3 font-medium">Outcome</th>
                    <th className="py-2 pr-3 text-right font-medium">Time</th>
                    <th className="py-2 text-right font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.id} className="border-b border-border/50">
                      <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="py-2 pr-3">
                        {r.eventName ?? (
                          <span className="text-muted-foreground">
                            {r.eventId
                              ? `${r.eventId.slice(0, 8)}…`
                              : "unknown"}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={
                            r.outcome === "failed"
                              ? "text-destructive"
                              : r.outcome === "completed" ||
                                  r.outcome === "cached" ||
                                  r.outcome === "client_encoded"
                                ? "text-foreground"
                                : "text-muted-foreground"
                          }
                        >
                          {OUTCOME_LABEL[r.outcome] ?? r.outcome}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {r.durationSec != null
                          ? `${r.durationSec.toFixed(0)}s`
                          : ""}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {r.costUsd != null ? `$${r.costUsd.toFixed(3)}` : ""}
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
