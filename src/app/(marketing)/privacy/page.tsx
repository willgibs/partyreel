import type { Metadata } from "next";

import { Container } from "@/components/shared/container";

export const metadata: Metadata = { title: "Privacy Policy" };

// Legal stub. Replace with the real policy before public launch — flag any
// open data-handling questions (NSFW scanning, retention) in docs/STATUS.md.
export default function PrivacyPage() {
  return (
    <Container className="max-w-2xl py-20">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Placeholder — the full policy lands before public launch.
      </p>
      <div className="mt-8 space-y-4 text-sm leading-6 text-muted-foreground">
        <p>
          Partyreel stores the photos and videos guests upload to an event so
          the host can view, curate, and share them. Media is served through
          short-lived signed links and is never exposed at a public storage URL.
        </p>
        <p>
          Guests upload without an account; we keep only the display name (and
          optional email, if the host requires it) needed to attribute uploads.
          When a host deletes an event, its media is scheduled for permanent
          deletion.
        </p>
      </div>
    </Container>
  );
}
