import type { CSSProperties } from "react";

import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { SECTION_HEADERS } from "@/lib/constants/marketing-voice";

import { LearnMoreLink } from "../shared/learn-more-link";
import { ReelPlayScreen } from "../shared/reel-player";
import { ReelScreenLamp } from "./reel-screen-lamp";

/**
 * THE PAYOFF CHAPTER OPENS HERE -- treatment A, "lights down".
 *
 * This section is the first of the home page's closing cinema chapter, so it
 * carries the chapter's opening weight (design-system.md, "Chapters"): the
 * page's own comment says "lights down for the reel". The device here is a
 * room going dark and a screen coming up. Much more air above, the heading a
 * tier up, and the screen presented as the subject, throwing its own poster's
 * colours down onto the floor beneath it (reel-screen-lamp.tsx), where the
 * pointer to /reel sits in the pool.
 *
 * Bespoke on purpose. The pacing principle says a chapter's first section
 * should feel bolder than a body section but must NOT share a template with
 * the other openers. The devices shared with any other opener are only the
 * vocabulary ones: the heading a tier up (SectionShell scale="lg") and the
 * hard film-cut entrance.
 *
 * ★ THE SCREEN IS A TEASER, AND ITS PLAY MARK OPENS THE FILM (`reel-story` r1
 * `teaser=poster`, r2 `play=modal`). A short muted loop plays on its own; the
 * press opens the section's film in the contained player over the dimmed page
 * (`../shared/reel-player.tsx`), with a caption and Start free, and closing it
 * returns here. The film is this section's own, made to sell the reel, never
 * the demo album's reel (his note on `play`: "an exciting intro/feature/reel
 * video made for its own purpose in a section will always beat using a generic
 * reel from a fake demo").
 *
 * ★ NO STYLE STRIP. The live reel plays moods a viewer switches for
 * themselves, so this section sells the reel, never "pick a style"; the
 * pointer goes to /reel, where the switcher shows the looks live.
 */

/**
 * The section's film: its first seconds loop muted on the screen and the whole
 * film plays in the player. `hero-candidate-02` is a stand-in render (stock
 * stills, not an event), kept until the film made for this section lands
 * (docs/ASSETS.md).
 */
const TEASER_REEL_ID = "hero-candidate-02";

/**
 * The subhead, in the site's ruled shape (marketing-voice.ts, `SITE_SUBHEAD`):
 * the reader's opportunity, what the album does in one clause, then the payoff.
 */
const SUBHEAD =
  "Every guest catches a moment you missed. The album plays them all back as one highlight reel while everyone is still there.";

export function ReelTeaser() {
  return (
    <SectionShell
      eyebrow="The reel"
      heading={SECTION_HEADERS.reel.line}
      subhead={SUBHEAD}
      /* The chapter opener's two vocabulary items: the heading a tier up, and
         the hard cut instead of the rise. The extra air above is the third --
         a chapter needs room to arrive in, where a body section does not. */
      scale="lg"
      reveal="cinema"
      /* TEMPO (R4/A32): the pointer at the end of this section is a bridge to
         /reel, so the section gives back part of its bottom padding. */
      className="pt-32 pb-10 sm:pt-44 sm:pb-12"
    >
      {/* ONE CHOREOGRAPHY (R4): the screen and the pointer continue the
          header's cascade (slots 0-2) under ONE observer at a tightened 70ms
          step. */}
      <Reveal style={{ "--mkt-stagger-ms": "70ms" } as CSSProperties}>
        <div
          data-mkt-reveal
          className="mx-auto mt-14 max-w-3xl"
          style={{ "--i": 3 } as CSSProperties}
        >
          {/* The screen, throwing its poster's light onto the floor below it.
              The lamp wraps the screen as a sibling of it, never inside it:
              the screen is overflow-hidden, and a lamp inside a clipping
              ancestor is the hard-edged rectangle that got a round reverted. */}
          <ReelScreenLamp>
            <ReelPlayScreen reelId={TEASER_REEL_ID} source="home-teaser" />
          </ReelScreenLamp>
        </div>

        <div
          data-mkt-reveal
          className="mt-10 text-center"
          style={{ "--i": 4 } as CSSProperties}
        >
          <LearnMoreLink href="/reel">See how the reel works</LearnMoreLink>
        </div>
      </Reveal>
    </SectionShell>
  );
}
