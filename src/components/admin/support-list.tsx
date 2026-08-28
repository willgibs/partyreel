"use client";

import { setContactStatus } from "@/app/admin/support/actions";
import { TriageStatusControl } from "@/components/admin/triage-status-control";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { contactTopicLabel } from "@/lib/constants/contact";
import { type TriageStatus } from "@/lib/constants/triage";
import type { ContactSubmission } from "@/lib/db/queries/support";

// Reply-from-inbox affordance: the email is a mailto link with the subject pre-filled, so the
// operator replies from their own inbox (the thread stays there). The portal just tracks status.
function replyHref(submission: ContactSubmission): string {
  const subject = submission.subject
    ? `Re: ${submission.subject}`
    : "Re: your message to Partyreel";
  return `mailto:${submission.email}?subject=${encodeURIComponent(subject)}`;
}

function SubmissionCard({ submission }: { submission: ContactSubmission }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">{submission.name}</CardTitle>
              {/* Topic chip (nullable: rows predate the picker). Falls back to
                  the raw value so an unknown/legacy topic is still visible. */}
              {submission.topic ? (
                <Badge variant="secondary">
                  {contactTopicLabel(submission.topic) ?? submission.topic}
                </Badge>
              ) : null}
            </div>
            {/* toLocaleString renders in the server tz on SSR + the browser tz on hydration
                (React #418) — suppress the mismatch; the viewer's local time wins. */}
            <p
              className="text-xs text-muted-foreground"
              suppressHydrationWarning
            >
              {new Date(submission.created_at).toLocaleString()}
              {submission.subject ? ` · ${submission.subject}` : ""}
            </p>
          </div>
          <TriageStatusControl
            id={submission.id}
            status={submission.status as TriageStatus}
            action={setContactStatus}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm whitespace-pre-wrap">{submission.message}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <a
            href={replyHref(submission)}
            className="font-medium text-foreground underline"
          >
            Reply to {submission.email}
          </a>
          {submission.source ? <span>via {submission.source}</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function SupportList({
  submissions,
}: {
  submissions: ContactSubmission[];
}) {
  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <SubmissionCard key={submission.id} submission={submission} />
      ))}
    </div>
  );
}
