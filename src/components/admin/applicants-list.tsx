"use client";

import { setApplicationStatus } from "@/app/admin/applicants/actions";
import { InboxPane, type InboxPaneItem } from "@/components/admin/inbox-pane";
import { TriageStatusControl } from "@/components/admin/triage-status-control";
import { Badge } from "@/components/ui/badge";
import { TRIAGE_STATUS_META, type TriageStatus } from "@/lib/constants/triage";
import type { JobApplication } from "@/lib/db/queries/applications";
import { formatAdminTimestamp } from "@/lib/format/admin-time";

/**
 * THE APPLICANTS INBOX, on the same pane as Support (`density=hybrid`, Will
 * 2026-09-20). An application is prose with two attachments, so it is the other
 * half of the "a pane for prose" answer, and the two inboxes being one idiom is
 * the point admin-triage made about four inboxes speaking one language.
 */
function waited(createdAt: string, nowMs: number): string {
  const ms = Math.max(0, nowMs - new Date(createdAt).getTime());
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "now";
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function ApplicantsList({
  applications,
  selectedId,
  basePath,
  nowMs,
}: {
  applications: JobApplication[];
  selectedId: string | null;
  basePath: string;
  /** The server's clock, passed in so this component never reads one at render. */
  nowMs: number;
}) {
  const open =
    applications.find((a) => a.id === selectedId) ?? applications[0] ?? null;

  const items: InboxPaneItem[] = applications.map((application) => ({
    id: application.id,
    href: `${basePath}${basePath.includes("?") ? "&" : "?"}id=${application.id}`,
    who: application.name,
    subject: application.roleTitle,
    preview: application.message ?? "",
    waited: waited(application.created_at, nowMs),
    badge:
      application.status === "new" ? null : (
        <Badge variant="outline" className="h-4 px-1.5 text-micro">
          {TRIAGE_STATUS_META[application.status as TriageStatus].label}
        </Badge>
      ),
  }));

  return (
    <InboxPane
      items={items}
      selectedId={open?.id ?? null}
      emptyList="Nothing in this filter."
      emptyDetail="Choose an application to read it."
    >
      {open ? (
        <div className="flex h-full flex-col">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-heading text-card-title font-medium">
                {open.roleTitle}
              </p>
              <p className="text-caption text-muted-foreground">
                {open.name}, {open.email},{" "}
                {formatAdminTimestamp(open.created_at)}
              </p>
            </div>
            <TriageStatusControl
              id={open.id}
              status={open.status as TriageStatus}
              action={setApplicationStatus}
            />
          </div>

          <p className="max-w-[68ch] text-working whitespace-pre-wrap">
            {open.message}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-4 text-working">
            <a
              href={`mailto:${open.email}?subject=${encodeURIComponent(
                `Re: your ${open.roleTitle} application`,
              )}`}
              className="font-medium underline decoration-border underline-offset-4 transition-colors duration-150 hover:decoration-foreground"
            >
              Reply from your inbox
            </a>
            {open.resume_url ? (
              <a
                href={open.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Resume
              </a>
            ) : null}
            {open.links ? (
              <span className="text-caption text-muted-foreground">
                Links: {open.links}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </InboxPane>
  );
}
