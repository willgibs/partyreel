import type { Metadata } from "next";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { ALBUM_FAQ } from "@/components/marketing/sections/features/album/album-faq";
import { ArrivalsHero } from "@/components/marketing/sections/features/album/arrivals-hero";
import { AttributionSection } from "@/components/marketing/sections/features/album/attribution-section";
import { EverywhereSection } from "@/components/marketing/sections/features/album/everywhere-section";
import { GettingInSection } from "@/components/marketing/sections/features/album/getting-in-section";
import { HowMuchFits } from "@/components/marketing/sections/features/album/how-much-fits";
import { QualitySection } from "@/components/marketing/sections/features/album/quality-section";
import { StaysSection } from "@/components/marketing/sections/features/album/stays-section";
import { TakeHomeSection } from "@/components/marketing/sections/features/album/take-home-section";
import { WhoCanOpenSection } from "@/components/marketing/sections/features/album/who-can-open-section";
import { YourCallSection } from "@/components/marketing/sections/features/album/your-call-section";
import { FeatureFaq } from "@/components/marketing/sections/features/shared/feature-faq";
import { GoDeeper } from "@/components/marketing/sections/features/shared/go-deeper";
import { RelatedFeatures } from "@/components/marketing/sections/features/shared/related-features";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { featurePage } from "@/lib/constants/feature-pages";

// THE LIVE ALBUM page, designed from the host's questions outward (its own
// round, 2026-09-02). Three attention arcs (design-system.md "Chapters"):
//   1 · cinema, while it happens: the hero (the album filling from the top,
//       the page's lamp) → getting in (the scan, the welcome, the first
//       upload; the QR page's story from the album's side) → land once, show
//       up everywhere (the doorbell as a benefit) → the quiet numbers;
//   2 · paper, the host's desk: your call (Live or Review, the opener, a tier
//       up on the cut) → names → who can open it → taking it home → how much
//       fits → it stays (the desk winds down on plans and keeping);
//   3 · cinema, the close: the doors, nine questions, the band.
// Every claim traces to the guest and host surfaces; every number derives
// from limits.ts, tiers.ts and the lifecycle constants inside the sections.
const page = featurePage("album");

export const metadata: Metadata = {
  title: page.navLabel,
  description: page.heroSub,
  alternates: { canonical: "/features/album" },
};

export default function AlbumFeaturePage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Features", href: "/features" },
          { name: page.navLabel, href: "/features/album" },
        ]}
      />
      <ArrivalsHero />
      <GettingInSection />
      <EverywhereSection />
      <QualitySection />
      <PaperChapter>
        <YourCallSection />
        <AttributionSection />
        <WhoCanOpenSection />
        <TakeHomeSection />
        <HowMuchFits />
        <StaysSection />
      </PaperChapter>
      <RelatedFeatures slugs={["qr", "curation", "sharing"]} />
      <FeatureFaq items={ALBUM_FAQ}>
        <GoDeeper
          links={[
            {
              href: "/help/how-guests-join-and-upload",
              label: "How guests join and upload",
            },
            {
              href: "/help/storage-plans-and-limits",
              label: "Storage, plans, and limits",
            },
            {
              href: "/help/who-can-see-your-event",
              label: "Who can see your event",
            },
          ]}
        />
      </FeatureFaq>
      <CtaBand
        className="border-t"
        heading="Give the next one an album."
        subhead="Start free. Share one code and the album fills itself."
        demoLink
      />
    </>
  );
}
