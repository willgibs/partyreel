import type { Metadata } from "next";

import { Container } from "@/components/shared/container";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Partyreel handles the photos, videos, and account data you and your guests share.",
  alternates: { canonical: "/privacy" },
};

// Legal stub. Replace with the real policy before public launch — flag any
// open data-handling questions (NSFW scanning, retention) in docs/STATUS.md.
// Presentation only rides the paper ladder (heading face, 4xl/5xl H1, mono
// status line); the copy is launch-gated and stays untouched.
export default function PrivacyPage() {
  return (
    <Container className="max-w-2xl py-16 sm:py-20">
      <h1 className="font-heading text-4xl text-balance sm:text-5xl">
        Privacy Policy
      </h1>
      <p className="mt-4 font-mono text-xs tracking-wide text-muted-foreground">
        Placeholder. The full policy lands before public launch.
      </p>
      <div className="mt-10 space-y-4 border-t pt-8 text-sm leading-6 text-muted-foreground">
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
