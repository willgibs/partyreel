import type { CSSProperties } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { TextsReveal } from "@/components/marketing/sections/shared/texts-reveal";
import { Container } from "@/components/shared/container";
import { planById } from "@/lib/constants/tiers";
import { formatBytes } from "@/lib/utils";

/**
 * The quiet pricing pointer (dark): one strip, trust-strip volume, between the
 * reel payoff and the close. The walkthrough answers "how does it work"; this
 * answers "what does it cost" in one breath and points at /pricing for the
 * rest. The free capacity derives from tiers.ts so the number can't drift.
 */
export function PricingPointer() {
  const free = planById("free");
  return (
    <section className="border-y">
      <Container>
        <TextsReveal className="flex flex-col items-center justify-between gap-x-10 gap-y-3 py-10 text-center sm:flex-row sm:text-left">
          <p
            className="mkt-line text-sm text-muted-foreground"
            style={{ "--i": 0 } as CSSProperties}
          >
            Start free: {formatBytes(free.storageBytes)} covers a whole first
            event, and plans are sized by storage, not guest counts.
          </p>
          <span className="mkt-line" style={{ "--i": 1 } as CSSProperties}>
            <LearnMoreLink href="/pricing">See full pricing</LearnMoreLink>
          </span>
        </TextsReveal>
      </Container>
    </section>
  );
}
