import type { Metadata } from "next";

import { Fingerprint, ShieldAlert } from "lucide-react";

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
  getForensicsHealth,
  listForensicAudit,
  listHeldMedia,
} from "@/lib/db/queries/forensics";
import { formatAdminTimestamp } from "@/lib/format/admin-time";
import { formatCount } from "@/lib/format/count";

import { PreserveForm, ReleaseHoldButton } from "./forensics-controls";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Forensics" };

const ACTION_LABEL: Record<string, string> = {
  preserve: "Preserved",
  export_evidence: "Evidence downloaded",
  export_record: "Record downloaded",
  hold_released: "Hold released",
};

// The forensic capture + legal hold surface (trust-safety-forensics.md, P8 operable + observable): the capture
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
            <CardTitle>Capture coverage (24h)</CardTitle>
            {captureGap > 0 ? (
              <Badge variant="destructive">
                {formatCount(captureGap)} uploads missing a record
              </Badge>
            ) : (
              <Badge variant="secondary">healthy</Badge>
            )}
            {health.auditErrors24h > 0 ? (
              <Badge variant="destructive">
                {formatCount(health.auditErrors24h)} failed actions (24h)
              </Badge>
            ) : null}
          </div>
          <CardDescription>
            Every completed upload should write one forensic record (IP, agent,
            geo, device, and the uploader identity as it stood: a confirmed
            account and its address, or the name a guest typed at the door plus
            any address they typed beside it, unconfirmed). Download Record on a
            held item to read the whole row. A gap means the capture seam is
            failing; check Sentry for forensic_capture_failed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {formatCount(health.uploads24h)}
              </p>
              <p className="text-muted-foreground">uploads</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {formatCount(health.captured24h)}
              </p>
              <p className="text-muted-foreground">records captured</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {formatCount(health.activeHolds)}
              </p>
              <p className="text-muted-foreground">active holds</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* The palette jumps here rather than preserving anything itself
          (lib/admin/palette.ts), so the id is part of that contract. */}
      <Card id="preserve" className="scroll-mt-20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-foreground" />
            <CardTitle>Set a hold and preserve evidence</CardTitle>
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
          <CardTitle>Active legal holds</CardTitle>
          <CardDescription>
            Held items are never hard-deleted. Releasing a hold puts the item
            back on its normal purge clock; preserved copies stay until deleted
            by hand (the 1-year clock).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {holds.length === 0 ? (
            <p className="text-working text-muted-foreground">
              No active holds.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Media</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Held since</TableHead>
                  <TableHead>Preserved</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holds.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell
                      className="text-caption whitespace-nowrap tabular-nums"
                      title={h.holdReason ?? ""}
                    >
                      {h.id.slice(0, 8)}\u2026
                    </TableCell>
                    <TableCell>
                      {h.eventName ?? `${h.eventId.slice(0, 8)}\u2026`}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatAdminTimestamp(h.heldAt)}
                    </TableCell>
                    <TableCell>
                      {h.preservedAt ? (
                        <Badge variant="success">yes</Badge>
                      ) : (
                        <span className="text-muted-foreground">hold only</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        {h.preservedAt ? (
                          <>
                            {/* Server-mediated, audit-logged downloads (the export route). */}
                            <a
                              className="text-caption underline underline-offset-2 hover:text-foreground"
                              href={`/admin/forensics/export?media=${h.id}&what=evidence`}
                            >
                              Evidence
                            </a>
                            <a
                              className="text-caption underline underline-offset-2 hover:text-foreground"
                              href={`/admin/forensics/export?media=${h.id}&what=record`}
                            >
                              Record
                            </a>
                          </>
                        ) : null}
                        <ReleaseHoldButton
                          mediaId={h.id}
                          eventName={h.eventName ?? h.eventId.slice(0, 8)}
                          preserved={Boolean(h.preservedAt)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit log</CardTitle>
          <CardDescription>
            Every preserve, export, and release, including failures. This log
            outlives the media it concerns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {audit.length === 0 ? (
            <p className="text-working text-muted-foreground">
              No actions yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Media</TableHead>
                  <TableHead>Outcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audit.map((a) => (
                  <TableRow
                    key={a.id}
                    tone={a.outcome === "ok" ? undefined : "destructive"}
                  >
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatAdminTimestamp(a.createdAt)}
                    </TableCell>
                    <TableCell>{ACTION_LABEL[a.action] ?? a.action}</TableCell>
                    <TableCell className="text-caption whitespace-nowrap tabular-nums">
                      {a.mediaId ? `${a.mediaId.slice(0, 8)}\u2026` : ""}
                    </TableCell>
                    <TableCell>
                      {a.outcome === "ok" ? (
                        <Badge variant="success">ok</Badge>
                      ) : (
                        <Badge variant="destructive" title={a.error ?? ""}>
                          error
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
