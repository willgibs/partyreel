import type { Metadata } from "next";
import type { CSSProperties } from "react";

import { FaqPageJsonLd, PricingJsonLd } from "@/components/marketing/jsonld";
import { HomeFaqAccordion } from "@/components/marketing/sections/home/faq-accordion";
import { Calculator } from "@/components/marketing/sections/pricing/calculator";
import { ComparisonTable } from "@/components/marketing/sections/pricing/comparison-table";
import { PassCard } from "@/components/marketing/sections/pricing/pass-card";
import { PlanPair } from "@/components/marketing/sections/pricing/plan-cards";
import { PRICING_FAQ_ITEMS } from "@/components/marketing/sections/pricing/pricing-faq-data";
import { UnlockGrid } from "@/components/marketing/sections/pricing/unlock-grid";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { GOLDEN_LINES } from "@/lib/constants/marketing-voice";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple storage-based pricing. Start free with one event, upgrade to Pro for every event you host, or buy a one-time Event Pass. No per-guest fees, no guest limit.",
  alternates: { canonical: "/pricing" },
};

/**
 * THE PRICING PAGE (the money page, re-cut from `pricing-page` r1's six
 * answers, 2026-09-20):
 *
 *   PAPER (the words, the pair, the pass) -> dark unlock tiles -> dark
 *   calculator -> dark matrix -> dark FAQ -> CtaBand.
 *
 * ★ THE PLANS ARE THE OPENING (`opening=plans`, Will overruling `fork`): the
 * dark hero above the cards is gone and the page opens ON paper, the same
 * words one step quieter (the chapter step, not the page step) sitting
 * directly over the pair. His reason is the one to protect: "The chapter
 * switch from header into the plan was far too harsh, and a paper hero makes
 * the pro card feel more premium without the dark header just above it."
 *
 * ★ THE PAGE STAYS IN THE (cinema) GROUP, and that is bible 16 rather than
 * inertia: a page cannot flip its header from inside, the group's layout picks
 * the skin, and the four chapters BELOW the plans are dark by his own answer
 * on `sheet`. Paper is a chapter here, not the ground. The one visible
 * consequence is the bar: the header keeps the cinema skin, so a reader meets
 * a dark bar over the paper chapter rather than the white one the board drew
 * (the lab renders its own header and could choose). Moving the route to
 * (paper) would buy that white bar and cost every dark chapter, because
 * globals.css refuses `.dark` inside `.surface-paper` outright. Named in the
 * handoff as his to overrule.
 *
 * ★ THE BAND IS DEAD AND THE TABLE IS DARK (`sheet`, his own answer, verbatim:
 * "keep the tiles and the table, kill the band... Let's make the table dark so
 * there's not a harsh back-to-back chapter transition"). The tiles now open the
 * dark chapter that Find your size sits inside, and the matrix lost its
 * PaperChapter so the run from the tiles to the band is one unbroken room.
 * SharedBand stays on disk for the board that still draws it.
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

      {/* The opening chapter. The h1 carries no entrance at all (bible 13,
          "nothing gates an h1"): it is this page's LCP element and it now sits
          in the first screen of the document, so a reveal would delay the
          largest paint for theater. The cards below keep their stagger, which
          is what a paper opening wants: the words instant, the plans arriving. */}
      <PaperChapter>
        <SectionShell
          id="plans"
          as="h1"
          scale="lg"
          reveal="none"
          eyebrow="Pricing"
          heading={<>{GOLDEN_LINES.pricing}.</>}
          subhead="No per-guest fees. Plans are sized by storage, so pick the room your event actually needs."
        >
          <div className="mt-12">
            <PlanPair />
            <PassCard />
          </div>
        </SectionShell>
      </PaperChapter>

      {/* The dark chapter, opened by the tiles (his ruling: the tiles are the
          "dark chapter intro section" above Find your size) and closed by the
          band. Nothing between them turns the page back to paper. */}
      <UnlockGrid />

      <Calculator />

      <ComparisonTable />

      <SectionShell
        id="faq"
        width="narrow"
        eyebrow="Questions"
        heading="The fine print, in plain words."
      >
        {/* One block at slot 3: a calm list never spends six stagger slots. */}
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
