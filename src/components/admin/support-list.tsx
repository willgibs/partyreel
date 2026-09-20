"use client";

import { setContactStatus } from "@/app/admin/support/actions";
import { InboxPane, type InboxPaneItem } from "@/components/admin/inbox-pane";
import { TriageStatusControl } from "@/components/admin/triage-status-control";
import { Badge } from "@/components/ui/badge";
import { contactTopicLabel } from "@/lib/constants/contact";
import { TRIAGE_STATUS_META, type TriageStatus } from "@/lib/constants/triage";
import type { ContactSubmission } from "@/lib/db/queries/support";

/**
 * THE SUPPORT INBOX, AS A LIST BESIDE THE MESSAGE (`density=hybrid`, Will
 * 2026-09-20: "a table for data, a pane for prose").
 *
 * Nine cards cost about 1,400 pixels and you still could not see the ninth; the
 * same nine as a list beside the one you are reading cost one screen. A table
 * was the wrong answer for exactly this surface, because a support row is a
 * paragraph somebody wrote and truncating it to a line makes the table useless
 * for the one thing the inbox is opened for.
 *
 * Reply-from-inbox is unchanged: the email is a mailto link with the subject
 * pre-filled, so the operator replies from their own inbox and the thread stays
 * there. The portal just tracks status.
 */
function replyHref(submission: ContactSubmission): string {
  const subject = submission.subject
    ? `Re: ${submission.subject}`
    : "Re: your message to Partyreel";
  return `mailto:${submission.email}?subject=${encodeURIComponent(subject)}`;
}

/** How long ago, in the shortest true words. Server-safe: no clock read at render. */
function waited(createdAt: string, nowMs: number): string {
  const ms = Math.max(0, nowMs - new Date(createdAt).getTime());
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "now";
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function SupportList({
  submissions,
  selectedId,
  basePath,
  nowMs,
}: {
  submissions: ContactSubmission[];
  /** The `?id=` the page read, or null. */
  selectedId: string | null;
  /** The list's href base, already carrying the page's `?status=` filter. */
  basePath: string;
  /** The server's clock, passed in so this component never reads one at render. */
  nowMs: number;
}) {
  const open =
    submissions.find((s) => s.id === selectedId) ?? submissions[0] ?? null;

  const items: InboxPaneItem[] = submissions.map((submission) => ({
    id: submission.id,
    href: `${basePath}${basePath.includes("?") ? "&" : "?"}id=${submission.id}`,
    who: submission.name,
    subject: submission.subject ?? "No subject",
    preview: submission.message,
    waited: waited(submission.created_at, nowMs),
    badge:
      submission.status === "new" ? null : (
        <Badge variant="outline" className="h-4 px-1.5 text-micro">
          {TRIAGE_STATUS_META[submission.status as TriageStatus].label}
        </Badge>
      ),
  }));

  return (
    <InboxPane
      items={items}
      selectedId={open?.id ?? null}
      emptyList="Nothing in this filter."
      emptyDetail="Choose a message to read it."
    >
      {open ? (
        <div className="flex h-full flex-col">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-heading text-card-title font-medium">
                {open.subject ?? "No subject"}
              </p>
              {/* toLocaleString renders in the server tz on SSR + the browser tz on hydration
                  (React #418) - suppress the mismatch; the viewer's local time wins. */}
              <p
                className="text-caption text-muted-foreground"
                suppressHydrationWarning
              >
                {open.name}, {open.email},{" "}
                {new Date(open.created_at).toLocaleString()}
                {open.source ? `, via ${open.source}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {/* Topic chip (nullable: rows predate the picker). Falls back to
                  the raw value so an unknown/legacy topic is still visible. */}
              {open.topic ? (
                <Badge variant="secondary">
                  {contactTopicLabel(open.topic) ?? open.topic}
                </Badge>
              ) : null}
              <TriageStatusControl
                id={open.id}
                status={open.status as TriageStatus}
                action={setContactStatus}
              />
            </div>
          </div>

          <p className="max-w-[68ch] text-working whitespace-pre-wrap">
            {open.message}
          </p>

          <div className="mt-5 border-t pt-4">
            <a
              href={replyHref(open)}
              className="text-working font-medium underline decoration-border underline-offset-4 transition-colors duration-150 hover:decoration-foreground"
            >
              Reply from your inbox to {open.email}
            </a>
          </div>
        </div>
      ) : null}
    </InboxPane>
  );
}
