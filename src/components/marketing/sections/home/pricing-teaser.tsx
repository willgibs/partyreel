import Link from "next/link";
import type { CSSProperties } from "react";

import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Button } from "@/components/ui/button";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { SECTION_HEADERS } from "@/lib/constants/marketing-voice";
import { planById, plansForTier } from "@/lib/constants/tiers";
import { cn, formatBytes } from "@/lib/utils";

import { PricePop } from "./price-pop";
import { ProCardBeam } from "./pro-card-beam";

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
          {cards.map((card, i) => {
            const body = (
              <div
                className={cn(
                  "flex h-full flex-col rounded-xl border p-6 text-center",
                  // ★ LIGHTER IS CLOSER. The premium card is RAISED by surface,
                  // not by a shadow: the elevation contract forbids dark
                  // shadows on dark, so depth here is a lift in the plane. The
                  // beam then marks it; the surface makes it sit forward first,
                  // so the card still reads as premium with the beam paused.
                  card.popular ? "relative bg-foreground/[0.045]" : "bg-card",
                )}
              >
                {card.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full border bg-background px-2.5 py-0.5 text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                    Most popular
                  </span>
                )}
                {/* The plan NAME is an eyebrow, not a heading: on a card whose
                    whole job is the number, a same-weight name competes with
                    the price for first read. This is the register the lab's
                    ratified Pro card uses. */}
                <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                  {card.name}
                </p>
                {/* The ratified price register (/pricing, 2026-08-27): money in
                    the DISPLAY face with tabular numerals. It is the model the
                    kill-mono sweep took site-wide for every number that is the
                    subject of its block (2026-09-14), and that role is the
                    ladder's `section` step ("a stat numeral"), the one
                    /pricing's cards wear too. No tracking-tight beside it: it
                    resolves to 0em here and would cancel the step's own. */}
                <div className="mt-3 font-heading text-section font-medium tabular-nums">
                  <PricePop label={card.price} />
                </div>
                <p className="mt-auto pt-3 text-xs leading-relaxed text-muted-foreground">
                  {card.note}
                </p>
              </div>
            );
            return (
              <div
                key={card.name}
                data-mkt-reveal
                className="h-full"
                style={{ "--i": i + 3 } as CSSProperties}
              >
                {/* The beam marks the premium object at rest -- the doctrine's
                    one standing exception. See pro-card-beam.tsx. */}
                {card.popular ? <ProCardBeam>{body}</ProCardBeam> : body}
              </div>
            );
          })}
        </div>
        <div
          data-mkt-reveal
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ "--i": 6 } as CSSProperties}
        >
          <Button asChild size="cta">
            <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
          </Button>
          <Button asChild size="cta" variant="outline">
            <Link href="/pricing">See full pricing</Link>
          </Button>
        </div>
      </Reveal>
    </SectionShell>
  );
}
