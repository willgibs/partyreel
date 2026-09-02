import type { Metadata } from "next";

import type { FaqItem } from "@/components/marketing/faq-data";
import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { AlbumSpecChapter } from "@/components/marketing/sections/features/album/album-spec";
import { ArrivalsHero } from "@/components/marketing/sections/features/album/arrivals-hero";
import { EverywhereSection } from "@/components/marketing/sections/features/album/everywhere-section";
import {
  PHOTO_FORMATS_PROSE,
  QualitySection,
  VIDEO_FORMATS_PROSE,
} from "@/components/marketing/sections/features/album/quality-section";
import { FeatureFaq } from "@/components/marketing/sections/features/shared/feature-faq";
import { GoDeeper } from "@/components/marketing/sections/features/shared/go-deeper";
import { RelatedFeatures } from "@/components/marketing/sections/features/shared/related-features";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { featurePage } from "@/lib/constants/feature-pages";
import { MAX_UPLOAD_BYTES } from "@/lib/media/limits";
import { formatBytes } from "@/lib/utils";

// THE LIVE ALBUM page, rebuilt from the ground up (its own round, 2026-09-02).
// The page is the album through the event's own timeline, in three chapters,
// each an attention arc (design-system.md "Chapters"):
//   1 · cinema, while it is happening: the hero (the album filling from the
//       top, the page's lamp) → land once, show up everywhere (the doorbell as
//       a benefit) → the quiet numbers (full quality) before the cut;
//   2 · paper, the morning after: ONE document, what lands and what stays;
//   3 · cinema, the close: the doors, three questions, the band.
// One section per benefit, every section with a product-true visual and two
// rows of copy. Registry copy renders via featurePage; every number derives
// from lib/media/limits.ts and lib/lifecycle inside the sections.
const page = featurePage("album");

export const metadata: Metadata = {
  title: page.navLabel,
  description: page.heroSub,
  alternates: { canonical: "/features/album" },
};

const FAQ_ITEMS: FaqItem[] = [
  {
    q: "What can guests upload?",
    a: `Photos as ${PHOTO_FORMATS_PROSE} on every plan, and video as ${VIDEO_FORMATS_PROSE} on Pro and Event Pass. Each file can be up to ${formatBytes(MAX_UPLOAD_BYTES)}.`,
  },
  {
    q: "Is anything compressed?",
    a: "No. Uploads keep their full resolution on the way in, and downloads come back out at the same quality.",
  },
  {
    q: "Do guests need an app or an account?",
    a: "No app; the album runs in the phone's browser. When you require accounts, guests confirm their email with a one-time code, and that tap is the whole sign-up.",
  },
];

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
      <EverywhereSection />
      <QualitySection />
      <AlbumSpecChapter />
      <RelatedFeatures slugs={["qr", "curation", "sharing"]} />
      <FeatureFaq items={FAQ_ITEMS}>
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
