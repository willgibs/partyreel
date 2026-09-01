import type { Metadata } from "next";

import type { FaqItem } from "@/components/marketing/faq-data";
import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { FeatureFaq } from "@/components/marketing/sections/features/album/feature-faq";
import { GoDeeper } from "@/components/marketing/sections/features/album/go-deeper";
import { RelatedFeatures } from "@/components/marketing/sections/features/shared/related-features";
import { EntryFlow } from "@/components/marketing/sections/features/qr/entry-flow";
import { PresetSwitcher } from "@/components/marketing/sections/features/qr/preset-switcher";
import { PrintShop } from "@/components/marketing/sections/features/qr/print-shop";
import { QrHero } from "@/components/marketing/sections/features/qr/qr-hero";
import { ShareModes } from "@/components/marketing/sections/features/qr/share-modes";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { featurePage } from "@/lib/constants/feature-pages";

// THE QR CODE page (expansion Phase B, T1): the most graphic page; the QR as a
// designed physical artifact. Arc (re-paced at the feature-pages round on the
// attention-arc principle): chapter 1 opens on the plate switching on, its
// light the page's one lamp, and supports through the live preset switcher;
// chapter 2 (ONE paper chapter) opens on the print stock STRADDLING the cut
// and winds down on the three share modes; chapter 3 opens on the guest's
// phone (the entry flow, a tier up on the cut) and ramps down through the
// doors (body register here, since the flow already opened the chapter), the
// FAQ and the CTA. The switcher rides the REAL app preset constants +
// renderer, so nothing here can drift from the shipped designer.
const page = featurePage("qr");

export const metadata: Metadata = {
  title: page.navLabel,
  description: page.heroSub,
  alternates: { canonical: "/features/qr" },
};

const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Do guests need an app?",
    a: "No. Scanning opens the event straight in the phone's browser, and uploads happen right there. The only extra step is a one-time email code, when the host requires accounts.",
  },
  {
    q: "What if someone can't scan the code?",
    a: "The QR is just a link wearing a pattern. Copy the join link and text or email it; tapping works exactly like scanning, so share it any way you like.",
  },
  {
    q: "Can I customize the QR?",
    a: "Yes. Pick from four presets (Classic, Bold, Rounded, and Dots) in the event designer. Every one keeps dark modules on a white background so it stays easy to scan, and you can download the result as SVG or PNG.",
  },
];

export default function QrFeaturePage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Features", href: "/features" },
          { name: page.navLabel, href: "/features/qr" },
        ]}
      />
      <QrHero />
      <PresetSwitcher />
      <PaperChapter>
        <PrintShop />
        <ShareModes />
      </PaperChapter>
      <EntryFlow />
      <RelatedFeatures slugs={["album", "guests", "privacy"]} opener={false} />
      <FeatureFaq items={FAQ_ITEMS}>
        <GoDeeper
          links={[
            {
              href: "/help/customize-and-share-your-qr",
              label: "Customize and share your QR code",
            },
          ]}
        />
      </FeatureFaq>
      <CtaBand
        className="border-t"
        heading="Put one code where people look."
        subhead="Create the event, style the QR, and the uploads start with the first scan."
        demoLink
      />
    </>
  );
}
