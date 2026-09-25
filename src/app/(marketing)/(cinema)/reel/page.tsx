import type { Metadata } from "next";

import { ClipSection } from "@/components/marketing/sections/reel/clip-section";
import { LiveSection } from "@/components/marketing/sections/reel/live-section";
import { ReelHero } from "@/components/marketing/sections/reel/reel-hero";
import { ScreenSection } from "@/components/marketing/sections/reel/screen-section";
import { StyleSwitcherSection } from "@/components/marketing/sections/reel/style-switcher-section";
import { CtaBand } from "@/components/marketing/system/cta-band";

// The FLAGSHIP product page. Fully static: no params, no cookies. The only client cost
// above the fold is the hero loop, and the canvas engine arrives solely through the
// switcher's lazy island (the engine boundary).
//
// THE ARC (`reel-story` r1 `arc=live-first`, with the screen second and clips third, the
// order his call handed over): the hero, the live style switcher as the engine's proof, then
// the reel's three chapters in the order a reader meets them. The live reel needs nothing
// from anyone; the screen is a key way it is used (the party); the clip is the one personal
// step (the morning after). The close is the page's own line: no two pages end on one beat.
export const metadata: Metadata = {
  title: "Reel",
  description:
    "Every album plays as its own highlight reel from the second photo, on phones and on the room's screen. Anyone can make a clip of it, free, on their own device.",
  alternates: { canonical: "/reel" },
};

export default function ReelPage() {
  return (
    <>
      <ReelHero />
      <StyleSwitcherSection />
      <LiveSection />
      <ScreenSection />
      <ClipSection />
      <CtaBand
        heading="Your reel starts at the second photo."
        subhead="Start free. Guests join with one scan, and there is nothing to make."
        demoLink
      />
    </>
  );
}
