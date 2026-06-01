"use client";

import { setApplicationStatus } from "@/app/admin/applicants/actions";
import { TriageStatusControl } from "@/components/admin/triage-status-control";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type TriageStatus } from "@/lib/constants/triage";
import type { JobApplication } from "@/lib/db/queries/applications";

function ApplicationCard({ application }: { application: JobApplication }) {
  const replyHref = `mailto:${application.email}?subject=${encodeURIComponent(
    `Re: your ${application.roleTitle} application`,
  )}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">{application.name}</CardTitle>
            <p
              className="text-xs text-muted-foreground"
              suppressHydrationWarning
            >
              {application.roleTitle} ·{" "}
              {new Date(application.created_at).toLocaleString()}
            </p>
          </div>
          <TriageStatusControl
            id={application.id}
            status={application.status as TriageStatus}
            action={setApplicationStatus}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm whitespace-pre-wrap">{application.message}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <a href={replyHref} className="font-medium text-foreground underline">
            Reply to {application.email}
          </a>
          {application.resume_url ? (
            <a
              href={application.resume_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Resume
            </a>
          ) : null}
          {application.links ? <span>Links: {application.links}</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function ApplicantsList({
  applications,
}: {
  applications: JobApplication[];
}) {
  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <ApplicationCard key={application.id} application={application} />
      ))}
    </div>
  );
}
