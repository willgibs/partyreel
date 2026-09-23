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
import { PhotoSection } from "@/components/shared/backdrop/photo-section";
import { featurePage } from "@/lib/constants/feature-pages";

// THE LIVE ALBUM page, designed from the host's questions outward (its own
// round, 2026-09-02). Three attention arcs (design-system.md "Chapters"):
//   1 · cinema, while it happens: the hero (the live album under the words,
//       with photographs falling into it) → getting in (the scan, the welcome,
//       the first upload; the QR page's story from the album's side) → land
//       once, show up everywhere (the doorbell as a benefit) → the quiet
//       numbers, lit from their floor → a room, full-bleed, that carries the
//       chapter across;
//   2 · paper, the host's desk: your call (Live or Review, the opener, a tier
//       up on the cut) → names → who can open it → taking it home → how much
//       fits → it stays (the desk winds down on plans and keeping);
//   3 · cinema, the close: the doors, nine questions, the band.
// Every claim traces to the guest and host surfaces; every number derives
// from limits.ts, tiers.ts and the lifecycle constants inside the sections.
//
// ★ THE CHAPTER TURNS THROUGH A PHOTOGRAPH (Will, 2026-09-18: "full image
// backgrounds sections should commonly serve as chapter transitions, so we go
// straight from dark to light or vice versa less often... They can close a
// chapter, open a chapter, or exist individually to separate two chapters", and
// 2026-09-19 on this page's floor light: "Would work much better with a full
// image background section beneath so it feels like it's glowing from that,
// with a less harsh contrast at the transition"). So a bare `PhotoSection`
// stands BETWEEN the two chapters here: no copy, no plate, the instance of the
// device that exists to separate two chapters. The quality section's Aurora
// rises off its floor into the photograph rather than into the paper chapter's
// white, and the reader crosses the cut through a room instead of over a
// hairline. It is the album page's own device, not a copy of the home's: there
// the same section CLOSES chapter one with the copy on its plate.
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
      {/* THREE STEPS, NOT FIVE, and the last one is the point. A band this
          short passes under a thumb in about one screen, so the pool's default
          five would flicker through it; three lands a reader on frames 0, 3 and
          5, and `room-frames.ts` keeps the last one the BRIGHTEST on purpose,
          so the photograph they leave on is the one nearest the paper they are
          about to meet. */}
      <PhotoSection steps={3} className="min-h-72 sm:min-h-[26rem]" />
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
