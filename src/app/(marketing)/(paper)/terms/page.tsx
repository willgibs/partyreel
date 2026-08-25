import type { Metadata } from "next";

import { Container } from "@/components/shared/container";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms for hosting events and collecting guest media on Partyreel, including plan limits and data retention.",
  alternates: { canonical: "/terms" },
};

// Legal stub. Replace with real terms before public launch.
export default function TermsPage() {
  return (
    <Container className="max-w-2xl py-20">
      <h1 className="text-3xl font-semibold tracking-tight">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Placeholder. The full terms land before public launch.
      </p>
      <div className="mt-8 space-y-4 text-sm leading-6 text-muted-foreground">
        <p>
          By creating an event you agree to use Partyreel for lawful purposes
          and to have the right to collect and share the media your guests
          upload.
        </p>
        <p>
          Plan limits, billing, and refund terms will be described here in full.
          Until then, see the pricing page for an overview of what each plan
          includes.
        </p>
        {/* Surfaced from launch so the inactivity policy is never a surprise (Will's
            ask). Plain-language summary of docs/PRD.md "Data retention & lifecycle" +
            the inactivity sweep in src/app/api/cron/purge — FLAG FOR LEGAL REVIEW
            before public launch (exact windows/wording to be confirmed by counsel). */}
        <p>
          <strong>Inactive free events.</strong> To keep free accounts tidy, an
          event on a free account may be removed after about{" "}
          <strong>6 months</strong> with no activity (signing in or opening the
          event both count as activity). We email you a warning before this
          happens, and a removed event stays recoverable for a short window
          afterward before it is permanently deleted. Keeping a plan, or simply
          using your event, prevents removal.
        </p>
      </div>
    </Container>
  );
}
