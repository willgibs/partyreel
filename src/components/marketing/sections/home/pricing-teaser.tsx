import Link from "next/link";
import type { CSSProperties } from "react";

import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Button } from "@/components/ui/button";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { SECTION_HEADERS } from "@/lib/constants/marketing-voice";
import { planById, plansForTier } from "@/lib/constants/tiers";
import { formatBytes } from "@/lib/utils";

import { PricePop } from "./price-pop";

/**
 * QUIET (the loud/quiet map): three cards driven LIVE from tiers.ts (the
 * pricing single-source, so numbers can never drift), quiet reveals, and the
 * number-pop-in on the prices as the one flourish. The full comparison lives
 * on /pricing; this teaser adds the why-framing, not a feature table.
 */

export function PricingTeaser() {
  const free = planById("free");
  const proFrom = plansForTier("pro")[0];
  const eventPass = planById("event_pass");

  const cards = [
    {
      name: free.name,
      price: free.priceLabel,
      note: `${formatBytes(free.storageBytes)} · your whole first event`,
      popular: false,
    },
    {
      name: "Pro",
      price: `from ${proFrom.priceLabel}`,
      note: "Unlimited events · video · more storage",
      popular: true,
    },
    {
      name: eventPass.name,
      price: eventPass.priceLabel,
      note: `${formatBytes(eventPass.storageBytes)} · one big event`,
      popular: false,
    },
  ];

  return (
    <SectionShell
      eyebrow="Pricing"
      heading={SECTION_HEADERS.pricing.line}
      subhead="Free covers your whole first event, with no per-guest fees."
      /* TEMPO (R4/A32): the FAQ used to open ~190px below this CTA row. Part
         of the bottom padding goes back so the question block sits closer to
         the plans it answers questions about. */
      className="pb-10 sm:pb-12"
    >
      {/* ONE CHOREOGRAPHY (R4): cards continue the header's cascade (slots 0-2)
          and the CTA row closes it, under ONE observer. */}
      <Reveal className="mx-auto mt-12 max-w-3xl">
        <div className="grid gap-4 sm:grid-cols-3">
          {cards.map((card, i) => (
            <div
              key={card.name}
              data-mkt-reveal
              className={
                card.popular
                  ? "relative rounded-xl border bg-card p-6 text-center ring-1 ring-foreground/20"
                  : "rounded-xl border bg-card p-6 text-center"
              }
              style={{ "--i": i + 3 } as CSSProperties}
            >
              {card.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full border bg-background px-2.5 py-0.5 text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  Most popular
                </span>
              )}
              <div className="font-heading text-sm font-medium">
                {card.name}
              </div>
              <div className="mt-2 font-mono text-2xl font-medium tracking-tight tabular-nums">
                <PricePop label={card.price} />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {card.note}
              </div>
            </div>
          ))}
        </div>
        <div
          data-mkt-reveal
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ "--i": 6 } as CSSProperties}
        >
          <Button asChild size="lg" className="h-11 px-6 text-base">
            <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
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
      </Reveal>
    </SectionShell>
  );
}
