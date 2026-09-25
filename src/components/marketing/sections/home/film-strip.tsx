import Image from "next/image";

import { HowItWorksStepper } from "@/components/marketing/sections/shared/how-it-works-stepper";
import { Conveyor } from "@/components/marketing/system/conveyor";
import { FilmStripLamp } from "@/components/marketing/sections/home/film-strip-glow";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";
import { SECTION_HEADERS } from "@/lib/constants/marketing-voice";

/**
 * THE HOME'S HOW-IT-WORKS PASSAGE (anchored /#how-it-works: the footer and the
 * nav both link here, and section-ids.ts still calls the slot `film-strip`).
 *
 * MEDIUM on the loud/quiet map: the ratified Direction-B conveyor (sprockets
 * and a linear marquee; ambient motion stays linear) with its sampled
 * underlight, and beneath it the WHOLE loop as a numbered stepper.
 *
 * ★ THE THREE SCENE CARDS ARE GONE (the walkthrough's
 * shape changed): "I made a previous question note about using a simpler three steps
 * for 'How It Works' sections, such as on the homepage, to point into the more
 * comprehensive How It Works page. However, I think a numbered stepper would
 * work better, where we can present the full flow within a regular height
 * section without feeling crowded or long." Scene 01/02/03 told three steps of
 * a six-step loop and then linked to a page that told six, so the teaser was
 * shallower than its own door; the stepper tells all six in the same room.
 *
 * ★ THE STRIP AND ITS LAMP STAY. The change was about the three cards, and the
 * conveyor is this section's identity: the site's own photographs running edge
 * to edge over one of the four shipped lamps (design-system.md, "the
 * shipped light"), whose whole design is a strip of frames above and an object
 * below positioned to CATCH the light. The stepper is that object now.
 *
 * ★ AND THE POINTER MOVED INSIDE IT. The section used to end on its own
 * LearnMoreLink to /how-it-works; the stepper carries that door at its foot, so
 * keeping both would have put two identical links a hundred pixels apart.
 */

export function FilmStrip() {
  return (
    <SectionShell
      id="how-it-works"
      eyebrow="How it works"
      heading={SECTION_HEADERS.howItWorks.line}
      width="wide"
      /* TEMPO (R4/A32): a section that ends on a POINTER link is a bridge, not
         a full stop, so it gives back part of its bottom padding. The reviewer
         clocked ~190px of dead black under this link before the next eyebrow;
         the pointer now sits ~50px closer to what it points at. The stepper's
         own door is that pointer since the scenes retired. */
      className="pb-10 sm:pb-12"
    >
      {/* Negative margins bleed the strip through the Container gutter so the
          conveyor reads edge-to-edge, the cinema framing. */}
      <FilmStripLamp>
        <Conveyor copyClassName="gap-0 pr-0">
          <FilmStripRow />
        </Conveyor>
      </FilmStripLamp>

      <HowItWorksStepper className="mt-14 sm:mt-16" />
    </SectionShell>
  );
}

/* One copy of the strip; the Conveyor renders it twice back-to-back so the
   -50% wrap is seamless. Sprocket holes ride INSIDE the copy and travel with
   it. The frame set doubles the 12 manifest images so one copy outruns even
   very wide viewports (a copy narrower than the viewport would show a gap at
   the wrap point). */
function FilmStripRow() {
  const frames = [...MARKETING_IMAGES, ...MARKETING_IMAGES];
  return (
    <div className="flex shrink-0 flex-col gap-1.5 bg-black px-1 py-2">
      <Sprockets />
      <div className="flex gap-1.5 px-1">
        {frames.map((m, i) => (
          <div
            key={`${m.id}-${i}`}
            className="relative h-24 w-40 shrink-0 overflow-hidden rounded-tile sm:h-28 sm:w-44"
          >
            <Image
              src={m.src}
              alt=""
              fill
              sizes="176px"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <Sprockets />
    </div>
  );
}

function Sprockets() {
  return (
    <div
      aria-hidden
      className="h-2 w-full bg-[repeating-linear-gradient(90deg,transparent_0_18px,rgba(255,255,255,0.22)_18px_26px)]"
    />
  );
}
