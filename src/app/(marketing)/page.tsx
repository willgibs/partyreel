import type { Metadata } from "next";

import { Faq } from "@/components/marketing/faq";
import { FaqJsonLd } from "@/components/marketing/faq-jsonld";
import { FeatureHighlights } from "@/components/marketing/feature-highlights";
import { FinalCta } from "@/components/marketing/final-cta";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { PricingTeaser } from "@/components/marketing/pricing-teaser";
import { ProblemSolution } from "@/components/marketing/problem-solution";
import { ReelTeaser } from "@/components/marketing/reel-teaser";
import { TrustStrip } from "@/components/marketing/trust-strip";
import { UseCases } from "@/components/marketing/use-cases";

// Home keeps the default "Partyreel" title (no template) but gets its own
// description + canonical for SEO; the share card inherits these via the root.
export const metadata: Metadata = {
  description:
    "Partyreel collects every photo and video from your event. Guests scan a QR code and upload from their phones — no app, no account. Create an event free.",
  alternates: { canonical: "/" },
};

// One long landing page, section by section (each is its own component so the
// order is easy to read and reshuffle). Arc: hook → why → how → what → who →
// vision → price → objections → convert.
export default function MarketingHome() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <ProblemSolution />
      <HowItWorks />
      <FeatureHighlights />
      <UseCases />
      <ReelTeaser />
      <PricingTeaser />
      <Faq />
      <FinalCta />
      <FaqJsonLd />
    </>
  );
}
