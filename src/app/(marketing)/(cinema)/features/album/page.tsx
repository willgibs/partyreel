import type { Metadata } from "next";

import type { FaqItem } from "@/components/marketing/faq-data";
import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { AlbumSpecChapter } from "@/components/marketing/sections/features/album/album-spec";
import { ArrivalsHero } from "@/components/marketing/sections/features/album/arrivals-hero";
import { FeatureFaq } from "@/components/marketing/sections/features/album/feature-faq";
import { GoDeeper } from "@/components/marketing/sections/features/album/go-deeper";
import { LiveSection } from "@/components/marketing/sections/features/album/live-section";
import { QualitySection } from "@/components/marketing/sections/features/album/quality-section";
import { RelatedFeatures } from "@/components/marketing/sections/features/shared/related-features";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { featurePage } from "@/lib/constants/feature-pages";

// THE LIVE ALBUM page (expansion Phase B, T1): the media-maximal cinema page.
// Chapter arc (re-paced at the feature-pages round, 2026-09-01, on the
// attention-arc principle in design-system.md "Chapters"): chapter 1 opens on
// the arrivals stream throwing its own sampled light, supports through
// live-during (a media split) and winds down on the quiet numbers of the
// FactBand before the paper cut; chapter 2 (ONE paper chapter) opens on the
// spec sheet a tier up on the hard cut and closes quiet on keeping; chapter 3
// opens on the photographic doors and winds down through the FAQ to the CTA.
// Registry copy renders via featurePage; hard numbers derive from
// lib/media/limits.ts inside the sections.
const page = featurePage("album");

export const metadata: Metadata = {
  title: page.navLabel,
  description: page.heroSub,
  alternates: { canonical: "/features/album" },
};

const FAQ_ITEMS: FaqItem[] = [
  {
    q: "What file types can guests upload?",
    // B26 ruling: name BOTH paid plans rather than saying "a paid plan".
    a: "Photos as JPEG, PNG, WebP, HEIC, HEIF, or AVIF on every plan, and videos as MP4, MOV, or WebM on events hosted with Pro or Event Pass. Each file can be up to 10 GB.",
  },
  {
    q: "Does Partyreel compress photos or videos?",
    a: "No. Uploads keep their full resolution on the way in, and downloads come back out at the same quality. There is no messaging-app squeeze anywhere in between.",
  },
  {
    q: "Do guests need the app or an account?",
    a: "There is no app at all; the album runs in the phone's browser. Guests only confirm their email with a one-time code when the host requires accounts, and that single tap doubles as the whole sign-up.",
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
      <LiveSection />
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
        heading="Give the next event one album."
        subhead="Create the event, share one QR code, and every phone in the room starts filling it."
        demoLink
      />
    </>
  );
}
