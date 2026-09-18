import Link from "next/link";

import { FeatureHeroEyebrow } from "@/components/marketing/sections/features/shared/feature-hero-eyebrow";
import { PageHero } from "@/components/marketing/system/page-hero";
import { Button } from "@/components/ui/button";
import { featurePage } from "@/lib/constants/feature-pages";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

import { ArrivalsStage } from "./arrivals-stage";

/**
 * /features/album hero (rebuilt from the ground up, 2026-09-02): the shared
 * PageHero lockup over THE ALBUM FILLING FROM THE TOP (arrivals-stage.tsx), the
 * one demonstration on the site of what "live" means: a new photograph lands
 * at the head of the album and everything older moves down, the count line
 * ticks, the green check confirms it, exactly as the real guest album does.
 * The stage is the page's lamp.
 *
 * A server component: the lockup and its copy render on the server; only the
 * stage carries hooks. The H1 is static by PageHero's contract (the LCP rule).
 */
export function ArrivalsHero() {
  const page = featurePage("album");

  return (
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
            <Link href="/how-it-works">See how it works</Link>
          </Button>
        </>
      }
      /* overflow-x-clip, never overflow-hidden: the lamp's full-bleed field
         hangs BELOW this section (screen-lamp.tsx). */
      className="overflow-x-clip pt-14 pb-10 sm:pt-20 sm:pb-14"
    >
      <ArrivalsStage />
    </PageHero>
  );
}
