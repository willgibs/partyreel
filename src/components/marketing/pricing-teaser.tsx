import Link from "next/link";

import { Button } from "@/components/ui/button";
import { planById, plansForTier } from "@/lib/constants/tiers";
import { formatBytes } from "@/lib/utils";

import { Section } from "./section";

// Compact teaser only — the full comparison lives on /pricing. Names, prices,
// and caps come from tiers.ts (the single source of truth) so they can't drift.
export function PricingTeaser() {
  const free = planById("free");
  const eventPass = planById("event_pass");
  const proFrom = plansForTier("pro")[0];

  const items = [
    {
      name: free.name,
      price: free.priceLabel,
      note: `${formatBytes(free.storageBytes)} · 1 event`,
    },
    {
      name: "Pro",
      price: `from ${proFrom.priceLabel}`,
      note: "Unlimited events · more storage",
    },
    {
      name: eventPass.name,
      price: eventPass.priceLabel,
      note: `${formatBytes(eventPass.storageBytes)} · one big event`,
    },
  ];

  return (
    <Section
      className="bg-muted/30"
      eyebrow="Pricing"
      heading="Simple, storage-based pricing"
      subhead="Start free. Upgrade when you need more events or bigger galleries (no per-guest fees)."
    >
      <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.name}
            className="rounded-xl border bg-card p-5 text-center"
          >
            <div className="font-heading text-sm font-medium">{item.name}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">
              {item.price}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {item.note}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button asChild size="lg" className="h-11 px-6 text-base">
          <Link href="/login">Start free</Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="h-11 px-6 text-base"
        >
          <Link href="/pricing">See full pricing</Link>
        </Button>
      </div>
    </Section>
  );
}
