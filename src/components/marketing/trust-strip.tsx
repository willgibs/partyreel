import { Check } from "lucide-react";

import { Container } from "@/components/shared/container";

// Honest social-proof stand-in. Partyreel is pre-launch, so there are no real
// testimonials or customer logos to show — a trust strip of true product
// promises fills the slot without fabricating proof. Swap in real quotes later.
const POINTS = [
  "No app, no account",
  "Private by default",
  "Yours until you delete it",
  "No watermarks",
];

export function TrustStrip() {
  return (
    <section className="border-y bg-muted/30">
      <Container className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-8 text-sm text-muted-foreground">
        {POINTS.map((point) => (
          <span key={point} className="inline-flex items-center gap-2">
            <Check className="size-4 text-brand" />
            {point}
          </span>
        ))}
      </Container>
    </section>
  );
}
