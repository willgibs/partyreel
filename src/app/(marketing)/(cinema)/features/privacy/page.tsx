import type { Metadata } from "next";
import Link from "next/link";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { AccessSwitch } from "@/components/marketing/sections/features/privacy/access-switch";
import { MediaLives } from "@/components/marketing/sections/features/privacy/media-lives";
import { NeverRidesAlong } from "@/components/marketing/sections/features/privacy/never-rides-along";
import { ReportReview } from "@/components/marketing/sections/features/privacy/report-review";
import {
  PrivacyLens,
  PrivacyLensPools,
} from "@/components/marketing/sections/features/privacy/lens-stage";
import { lensVars } from "@/components/marketing/sections/features/privacy/privacy-lens";
import { PRIVACY_FAQ } from "@/components/marketing/sections/features/privacy/privacy-faq";
import { RelatedFeatures } from "@/components/marketing/sections/features/shared/related-features";
import { FeatureFaq } from "@/components/marketing/sections/features/shared/feature-faq";
import { FeatureHeroEyebrow } from "@/components/marketing/sections/features/shared/feature-hero-eyebrow";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { PageHero } from "@/components/marketing/system/page-hero";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Button } from "@/components/ui/button";
import { featurePage } from "@/lib/constants/feature-pages";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

const page = featurePage("privacy");

export const metadata: Metadata = {
  title: page.navLabel,
  description: page.heroSub,
  alternates: { canonical: "/features/privacy" },
};

/**
 * THE SOBER PAGE (Phase B, T3): the trust story a nervous wedding host reads
 * before handing us the album. Paper-dominant and document-grade by design,
 * the site's quietest page: a dark hero, then ONE paper chapter (the access
 * switch signature, the quiet protections, the durability document, the
 * human-moderation close), then a dark close. Restraint IS the design; every
 * claim stays inside the verified trust facts and nothing overclaims.
 *
 * ★ THE HERO IS THE ONE PLACE THE PAGE'S RESTRAINT GIVES WAY (his round-four
 * pick, `veil=lens`: "a far cleaner design"): a photograph that shows only what
 * it chooses to, behind the page's own words. It is the site's one hero whose
 * picture is a thing that decides, which is the page's claim made visible, and
 * it stays achromatic: no colour but the photograph's, no lamp.
 */
export default function PrivacyFeaturePage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Features", href: "/features" },
          { name: page.navLabel, href: "/features/privacy" },
        ]}
      />

      {/* THE LENS (privacy-hero r4): the shared lockup over a veiled photograph
          and one clear pane that settles on one thing at a time, never a face,
          never the words. The section's padding is the two bands the pane rests
          in (`pvl-hero`, the sizes from `lensVars`), so no rest can be under a
          word at any width; the pools behind the words are its children. The
          h1 is plain markup at paint, as on every hero (the LCP rule). */}
      <PageHero
        entrance="cut"
        eyebrow={<FeatureHeroEyebrow label={page.navLabel} />}
        heading={page.h1}
        subhead={page.heroSub}
        actions={
          <>
            <Button asChild size="cta">
              <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
            </Button>
            <Button asChild size="cta" variant="outline">
              <Link href="/features/curation">How curation works</Link>
            </Button>
          </>
        }
        backdrop={<PrivacyLens />}
        className="pvl-hero"
        style={lensVars()}
      >
        <PrivacyLensPools />
      </PageHero>

      {/* THE PAPER CHAPTER: trust is read at a desk, so the whole argument
          lives on one paper plane (the chapter doctrine's hard cut). */}
      <PaperChapter>
        <AccessSwitch />
        <NeverRidesAlong />
        <MediaLives />
        <ReportReview />
      </PaperChapter>

      {/* The dark close: sideways routes, the FAQ, then the one CTA. The
          chapter's bottom hairline owns the cut, so no border-t here. */}
      <RelatedFeatures slugs={["curation", "sharing", "guests"]} />

      {/* The shared FAQ band; the GoDeeper rows for this page live in the
          moderation close above, so none here. */}
      <FeatureFaq items={PRIVACY_FAQ} />

      <CtaBand
        heading="Start your first event free."
        subhead="Create the event, share one QR code, and the whole thing lands in one album."
        demoLink
      />
    </>
  );
}
