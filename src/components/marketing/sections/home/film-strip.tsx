import Image from "next/image";
import type { CSSProperties } from "react";

import { Conveyor } from "@/components/marketing/system/conveyor";
import { FilmStripLamp } from "@/components/marketing/sections/home/film-strip-glow";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";
import { SECTION_HEADERS } from "@/lib/constants/marketing-voice";

/**
 * MEDIUM (the loud/quiet map): the ratified Direction-B film-strip conveyor
 * (sprockets + a linear marquee; ambient motion stays linear) with the three
 * scene cards landing as HARD FILM CUTS ([data-mkt-cut], deliberately not a
 * fade). The scene beats mirror the ruled header's verbs: Scan / Upload /
 * Done. Anchored as /#how-it-works (footer + nav link target).
 */

const SCENES = [
  {
    scene: "Scene 01",
    title: "Scan",
    body: "Guests point their camera at one QR code and they're in. No app, no account.",
  },
  {
    scene: "Scene 02",
    title: "Upload",
    body: "Photos and videos land in your album live, from every phone in the room.",
  },
  {
    scene: "Scene 03",
    title: "Done",
    body: "The whole event in one place, ready to curate and share.",
  },
];

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
         the pointer now sits ~50px closer to what it points at. */
      className="pb-10 sm:pb-12"
    >
      {/* Negative margins bleed the strip through the Container gutter so the
          conveyor reads edge-to-edge, the cinema framing. */}
      <FilmStripLamp>
        <Conveyor copyClassName="gap-0 pr-0">
          <FilmStripRow />
        </Conveyor>
      </FilmStripLamp>

      <Reveal className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-3">
        {SCENES.map((s, i) => (
          <div
            key={s.scene}
            data-mkt-cut
            className="rounded-xl border bg-card/60 p-6"
            style={{ "--i": i } as CSSProperties}
          >
            <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              {s.scene}
            </p>
            <h3 className="mt-2 font-heading text-2xl">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {s.body}
            </p>
          </div>
        ))}
      </Reveal>
      {/* The ladder pointer (expansion round): the teaser routes into the full
          two-sided walkthrough page. The Reveal used to wrap a link that
          carried no [data-mkt-reveal], so it observed nothing and the pointer
          popped in flat under three cut-in cards (R4 choreography pass). --i 0
          because a lone trailing element has nothing to queue behind. */}
      <Reveal className="mt-8 flex justify-center">
        <div data-mkt-reveal style={{ "--i": 0 } as CSSProperties}>
          <LearnMoreLink href="/how-it-works">
            The full walkthrough, both sides
          </LearnMoreLink>
        </div>
      </Reveal>
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
            className="relative h-24 w-40 shrink-0 overflow-hidden rounded-[2px] sm:h-28 sm:w-44"
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
