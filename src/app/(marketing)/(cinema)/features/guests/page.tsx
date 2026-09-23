import type { Metadata } from "next";

import type { FaqItem } from "@/components/marketing/faq-data";
import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { FeatureFaq } from "@/components/marketing/sections/features/shared/feature-faq";
import { GoDeeper } from "@/components/marketing/sections/features/shared/go-deeper";
import { RelatedFeatures } from "@/components/marketing/sections/features/shared/related-features";
import { AttributionHero } from "@/components/marketing/sections/features/guests/attribution-hero";
import { CreditedAlbum } from "@/components/marketing/sections/features/guests/credited-album";
import { GuestListSection } from "@/components/marketing/sections/features/guests/guest-list-section";
import { ProfilesSection } from "@/components/marketing/sections/features/guests/profiles-section";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { featurePage } from "@/lib/constants/feature-pages";

// GUESTS & PROFILES page (expansion Phase B, T1): the people page, warm. Arc:
// the attribution wall + the credited album (dark) -> the guest list + opt-in
// profiles (ONE paper chapter) -> related, FAQ, CTA back in the dark. The
// GoDeeper arrived with its article in R5 (profiles-guest-lists-and-following
// closed the one gap in the ladder).
const page = featurePage("guests");

export const metadata: Metadata = {
  title: page.navLabel,
  description: page.heroSub,
  alternates: { canonical: "/features/guests" },
};

const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Do guests have to make a profile?",
    a: "No. Profiles are optional and opt-in. A guest can upload with just a display name, verified or not, and never have a public page at all.",
  },
  {
    q: "Who sees the guest list?",
    a: "You do, on your event page. It appears on the shared album only if you switch that on; otherwise guests just see the names on the photos. A name with no verified email behind it wears a small mark, on the list and on the photo alike.",
  },
  {
    q: "Do guests have to verify their email?",
    a: "Only if you turn on Require verified emails, which is the default. Off, guests type a display name instead, and their photos carry a small unverified mark until they confirm one.",
  },
];

export default function GuestsFeaturePage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Features", href: "/features" },
          { name: page.navLabel, href: "/features/guests" },
        ]}
      />
      <AttributionHero />
      <CreditedAlbum />
      <PaperChapter>
        <GuestListSection />
        <ProfilesSection />
      </PaperChapter>
      <RelatedFeatures slugs={["album", "qr", "privacy"]} />
      <FeatureFaq items={FAQ_ITEMS}>
        <GoDeeper
          links={[
            {
              href: "/help/profiles-guest-lists-and-following",
              label: "Profiles, guest lists, and following",
            },
          ]}
        />
      </FeatureFaq>
      <CtaBand
        className="border-t"
        heading="Fill the room, then keep it."
        subhead="Start free. Every guest with a phone becomes part of the album, by name."
        demoLink
      />
    </>
  );
}
