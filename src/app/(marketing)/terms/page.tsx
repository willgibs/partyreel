import type { Metadata } from "next";

import { Container } from "@/components/shared/container";

export const metadata: Metadata = { title: "Terms of Service" };

// Legal stub. Replace with real terms before public launch.
export default function TermsPage() {
  return (
    <Container className="max-w-2xl py-20">
      <h1 className="text-3xl font-semibold tracking-tight">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Placeholder — the full terms land before public launch.
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
      </div>
    </Container>
  );
}
