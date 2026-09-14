import type { Metadata } from "next";

import { Fingerprint, ShieldAlert } from "lucide-react";

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
  getForensicsHealth,
  listForensicAudit,
  listHeldMedia,
} from "@/lib/db/queries/forensics";

import { PreserveForm, ReleaseHoldButton } from "./forensics-controls";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Forensics" };

const ACTION_LABEL: Record<string, string> = {
  preserve: "Preserved",
  export_evidence: "Evidence downloaded",
  export_record: "Record downloaded",
  hold_released: "Hold released",
};

// The forensic capture + legal hold surface (ADR-0020, P8 operable + observable): the capture
// coverage health signal, the active-holds list with per-item preserve/export/release, and the
// full audit trail. The incident procedure lives in docs/systems/trust-safety-forensics.md.
export default async function ForensicsPage() {
  const ctx = await requireAdmin();
  if (ctx.aal !== "aal2") return null;

  const [health, holds, audit] = await Promise.all([
    getForensicsHealth(),
    listHeldMedia(),
    listForensicAudit(50),
  ]);
  const captureGap = Math.max(0, health.uploads24h - health.captured24h);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <PageHeading>Forensics</PageHeading>
        <p className="text-sm text-muted-foreground">
          Upload capture coverage, legal holds, and evidence preservation.
          Runbook: docs/systems/trust-safety-forensics.md.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Fingerprint className="size-5 text-foreground" />
            <CardTitle className="text-base">Capture coverage (24h)</CardTitle>
            {captureGap > 0 ? (
              <Badge variant="destructive">
                {captureGap} uploads missing a record
              </Badge>
            ) : (
              <Badge variant="secondary">healthy</Badge>
            )}
            {health.auditErrors24h > 0 ? (
              <Badge variant="destructive">
                {health.auditErrors24h} failed actions (24h)
              </Badge>
            ) : null}
          </div>
          <CardDescription>
            Every completed upload should write one forensic record (IP, agent,
            geo, device). A gap means the capture seam is failing; check Sentry
            for forensic_capture_failed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {health.uploads24h}
              </p>
              <p className="text-muted-foreground">uploads</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {health.captured24h}
              </p>
              <p className="text-muted-foreground">records captured</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {health.activeHolds}
              </p>
              <p className="text-muted-foreground">active holds</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-foreground" />
            <CardTitle className="text-base">
              Set a hold and preserve evidence
            </CardTitle>
          </div>
          <CardDescription>
            Copies the original into the segregated preservation store and
            excludes the item from every purge path. Remove it from the live
            gallery first (Albums), then preserve.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PreserveForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active legal holds</CardTitle>
          <CardDescription>
            Held items are never hard-deleted. Releasing a hold puts the item
            back on its normal purge clock; preserved copies stay until deleted
            by hand (the 1-year clock).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {holds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active holds.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Media</th>
                    <th className="py-2 pr-3 font-medium">Event</th>
                    <th className="py-2 pr-3 font-medium">Held since</th>
                    <th className="py-2 pr-3 font-medium">Preserved</th>
                    <th className="py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {holds.map((h) => (
                    <tr key={h.id} className="border-b border-border/50">
                      <td
                        className="py-2 pr-3 text-xs whitespace-nowrap tabular-nums"
                        title={h.holdReason ?? ""}
                      >
                        {h.id.slice(0, 8)}…
                      </td>
                      <td className="py-2 pr-3">
                        {h.eventName ?? `${h.eventId.slice(0, 8)}…`}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                        {new Date(h.heldAt).toLocaleString()}
                      </td>
                      <td className="py-2 pr-3">
                        {h.preservedAt ? (
                          <Badge variant="secondary">yes</Badge>
                        ) : (
                          <span className="text-muted-foreground">
                            hold only
                          </span>
                        )}
                      </td>
                      <td className="py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {h.preservedAt ? (
                            <>
                              {/* Server-mediated, audit-logged downloads (the export route). */}
                              <a
                                className="text-xs underline underline-offset-2 hover:text-foreground"
                                href={`/admin/forensics/export?media=${h.id}&what=evidence`}
                              >
                                Evidence
                              </a>
                              <a
                                className="text-xs underline underline-offset-2 hover:text-foreground"
                                href={`/admin/forensics/export?media=${h.id}&what=record`}
                              >
                                Record
                              </a>
                            </>
                          ) : null}
                          <ReleaseHoldButton mediaId={h.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit log</CardTitle>
          <CardDescription>
            Every preserve, export, and release, including failures. This log
            outlives the media it concerns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {audit.length === 0 ? (
            <p className="text-sm text-muted-foreground">No actions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">When</th>
                    <th className="py-2 pr-3 font-medium">Action</th>
                    <th className="py-2 pr-3 font-medium">Media</th>
                    <th className="py-2 font-medium">Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.map((a) => (
                    <tr key={a.id} className="border-b border-border/50">
                      <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                        {new Date(a.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2 pr-3">
                        {ACTION_LABEL[a.action] ?? a.action}
                      </td>
                      <td className="py-2 pr-3 text-xs whitespace-nowrap tabular-nums">
                        {a.mediaId ? `${a.mediaId.slice(0, 8)}…` : ""}
                      </td>
                      <td className="py-2">
                        {a.outcome === "ok" ? (
                          <span className="text-foreground">ok</span>
                        ) : (
                          <span
                            className="text-destructive"
                            title={a.error ?? ""}
                          >
                            error
                          </span>
                        )}
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
