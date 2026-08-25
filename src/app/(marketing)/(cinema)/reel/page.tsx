import type { Metadata } from "next";

import { GuestShareSection } from "@/components/marketing/sections/reel/guest-share-section";
import { HowRepriseSection } from "@/components/marketing/sections/reel/how-reprise-section";
import { ReelHero } from "@/components/marketing/sections/reel/reel-hero";
import { RenderSection } from "@/components/marketing/sections/reel/render-section";
import { STYLE_COUNT } from "@/components/marketing/sections/reel/style-facets";
import { StyleSwitcherSection } from "@/components/marketing/sections/reel/style-switcher-section";
import { TierSection } from "@/components/marketing/sections/reel/tier-section";
import { WysiwygSection } from "@/components/marketing/sections/reel/wysiwyg-section";
import { CtaBand } from "@/components/marketing/system/cta-band";

// The FLAGSHIP product page (Track B, B2; the T2.5 8-section sketch + the ruled live
// style switcher). Fully static: no params, no cookies — the only client cost above
// the fold is the hero loop, and the canvas engine arrives solely through the
// switcher's lazy island (the engine boundary).
export const metadata: Metadata = {
  title: "Reel",
  description: `Every event ends with a reel. Partyreel cuts your guests' photos into a cinematic highlight video, automatically: ${STYLE_COUNT} styles, rendered free on your phone, ready for every guest to keep.`,
  alternates: { canonical: "/reel" },
};

export default function ReelPage() {
  return (
    <>
      <ReelHero />
      <StyleSwitcherSection />
      <WysiwygSection />
      <RenderSection />
      <TierSection />
      <GuestShareSection />
      <HowRepriseSection />
      <CtaBand
        heading="Your next event ends with a reel."
        subhead="Start free. Guests join with one scan, and the reel builds itself."
        demoLink
      />
    </>
  );
}
