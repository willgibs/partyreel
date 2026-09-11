import type { Metadata } from "next";
import type { CSSProperties } from "react";

import { FaqPageJsonLd, PricingJsonLd } from "@/components/marketing/jsonld";
import { HomeFaqAccordion } from "@/components/marketing/sections/home/faq-accordion";
import { Calculator } from "@/components/marketing/sections/pricing/calculator";
import { ComparisonTable } from "@/components/marketing/sections/pricing/comparison-table";
import { PassCard } from "@/components/marketing/sections/pricing/pass-card";
import { PlanPair } from "@/components/marketing/sections/pricing/plan-cards";
import { PRICING_FAQ_ITEMS } from "@/components/marketing/sections/pricing/pricing-faq-data";
import { SharedBand } from "@/components/marketing/sections/pricing/shared-band";
import { UnlockGrid } from "@/components/marketing/sections/pricing/unlock-grid";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Container } from "@/components/shared/container";
import { GOLDEN_LINES } from "@/lib/constants/marketing-voice";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple storage-based pricing. Start free with one event, upgrade to Pro for every event you host, or buy a one-time Event Pass. No per-guest fees, no guest limit.",
  alternates: { canonical: "/pricing" },
};

/**
 * THE PRICING PAGE (rebuilt from zero, 2026-08-27; the Biograph-informed IA):
 *
 *   dark hero → PAPER (the pair + the pass: the honest sheet) → dark unlock
 *   grid → dark calculator → PAPER (the full matrix) → dark shared floor →
 *   dark FAQ → CtaBand.
 *
 * The chapter alternation is brand rhythm (Will's note 4); light/dark INSIDE
 * the pair is tier identity. Progressive disclosure runs price-forward (cards
 * carry prices, per Will) but commitment-backward: identity pair → one-time
 * option → what upgrading unlocks → find-your-size → the full sheet → the
 * floor every plan shares → questions → the door.
 *
 * Every number on this page renders from tiers.ts / limits.ts (the DRY single
 * sources that server-side enforcement also reads). Copy rules: no em-dashes,
 * no ingress numbers (test-banned), no invented proof.
 */
export default function PricingPage() {
  return (
    <>
      <PricingJsonLd />
      <FaqPageJsonLd items={PRICING_FAQ_ITEMS} />

      {/* Hero: the golden pricing line at the route-H1 scale. QUIET-confident:
          standard reveals, no cinema cut, no media. */}
      <section className="pt-14 pb-4 sm:pt-20 sm:pb-6">
        <Container>
          <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
            <Eyebrow data-mkt-reveal style={{ "--i": 0 } as CSSProperties}>
              Pricing
            </Eyebrow>
            {/* The H1 never carries a reveal-hidden state (the LCP rule,
                pinned by marketing-h1-policy.test.ts); the slots around it
                do the arriving. */}
            <h1 className="font-heading text-4xl text-balance sm:text-5xl md:text-6xl lg:text-7xl">
              {GOLDEN_LINES.pricing}.
            </h1>
            <p
              data-mkt-reveal
              className="max-w-2xl text-lg text-pretty text-muted-foreground"
              style={{ "--i": 2 } as CSSProperties}
            >
              No per-guest fees. Plans are sized by storage, so pick the room
              your event actually needs.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* THE PAPER DOCUMENT IN A DARK ROOM (the chapter ruling): the money
          turns the page to paper. The pair reads tier identity (Free = the
          sheet, Pro = the sheet in ink); the pass stretches beneath as the
          one-time ticket. */}
      <PaperChapter>
        <SectionShell id="plans">
          <PlanPair />
          <PassCard />
        </SectionShell>
      </PaperChapter>

      <UnlockGrid />

      <Calculator />

      {/* Paper again for the full sheet: a matrix wants the receipt register. */}
      <PaperChapter>
        <ComparisonTable />
      </PaperChapter>

      <SharedBand />

      <SectionShell
        id="faq"
        width="narrow"
        eyebrow="Questions"
        heading="The fine print, in plain words."
      >
        {/* One block at slot 3: a calm list never spends eight stagger slots. */}
        <Reveal className="mt-10">
          <div data-mkt-reveal style={{ "--i": 3 } as CSSProperties}>
            <HomeFaqAccordion items={PRICING_FAQ_ITEMS} />
          </div>
        </Reveal>
      </SectionShell>

      {/* No border-t: the FAQ's quiet close hands straight to the band. */}
      <CtaBand
        heading="Ready when you are."
        subhead="Start your first event free, and upgrade only when you host again."
        demoLink
      />
    </>
  );
}
