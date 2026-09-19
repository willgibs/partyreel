"use client";

import Image from "next/image";

import { Frame } from "@/components/lab";
import { DemoCtaLink } from "@/components/marketing/system/demo-cta-link";
import { Button } from "@/components/ui/button";
import { EVENT_TYPES } from "@/lib/constants/events";
import { marketingImage } from "@/lib/constants/marketing-media";

import { Scene } from "./scene";

/**
 * DECISION 8: THE PHONE. `tile: "phone"` on the spec (the previews ARE the
 * 375 column), so this decision draws only one width, never an empty 1440
 * room beside it.
 *
 * `measured` and `tightened` are the REAL `/events/weddings` route, loaded
 * through `Frame`'s own `src`, never a fixture copy: a real iframe at a real
 * viewport is the only surface honest enough to measure. `tightened` is the
 * same route wearing one candidate stylesheet — the exact paste a ruling
 * would land — that halves the FAQ section's bottom padding and the CTA
 * band's top padding below `sm`, closing the 183px of nothing this board
 * measured between the FAQ list and the CTA heading (`document.
 * documentElement.scrollHeight` and each section's own `getBoundingClientRect`,
 * read live against localhost:3131). `one-screen` is not that route: it is
 * everything a wedding's page says, cut down to what survives one 812px
 * screen, so the cost of "one type, one screen" is legible rather than
 * asserted.
 */
export type ThePhoneShape = "measured" | "tightened" | "one-screen";

// Halves the FAQ section's bottom padding and the very next section's (the
// CtaBand) top padding below `sm`, via the adjacent-sibling combinator so
// only the band immediately after the FAQ list is touched — never an earlier
// `border-t` section on the same page.
const TIGHTEN_CSS = `
@media (max-width: 639px) {
  section:has(details) { padding-bottom: 2.5rem !important; }
  section:has(details) + section { padding-top: 2.5rem !important; }
}
`;

const WEDDING = EVENT_TYPES[0];

function OneScreen() {
  return (
    <div
      className="flex flex-col justify-between px-6 py-6 text-center"
      style={{ minHeight: 812 }}
    >
      <div className="flex flex-col items-center gap-2.5">
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Weddings
        </p>
        <h1 className="font-heading text-title text-balance">
          {WEDDING.headline}
        </h1>
        <p className="text-sm text-pretty text-muted-foreground">
          {WEDDING.subhead}
        </p>
      </div>
      {/* A single still, not the full EventHeroMedia: that component's own
          mt-12 and eight-tile grid are sized for the spacious hero context
          decisions 2 and 3 already judge, and fighting that with a CSS
          `scale-*` transform would reserve its UNSCALED layout height while
          only shrinking its paint — the exact bug that overflowed this
          option's first cut. One real photograph is the honest, compact
          stand-in for "the hero's picture" this option is not asking about. */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
        <Image
          src={marketingImage("wedding-arch").src}
          alt=""
          fill
          sizes="330px"
          className="object-cover"
        />
      </div>
      <div className="flex flex-col items-center gap-2">
        <Button size="cta" className="w-full max-w-[240px]">
          Create your event
        </Button>
        <DemoCtaLink className="text-xs" />
      </div>
    </div>
  );
}

export function PhonePreview({ shape }: { shape: ThePhoneShape }) {
  if (shape === "measured")
    return (
      <Frame id="etp-phone-measured" src="/events/weddings" w={375} h={5950} title="375" />
    );
  if (shape === "tightened")
    return (
      <Frame
        id="etp-phone-tightened"
        src="/events/weddings"
        w={375}
        h={5870}
        css={TIGHTEN_CSS}
        title="375"
      />
    );
  return (
    <Scene id="phone-one-screen" w={375} h={900} ground="cinema" title="375">
      <OneScreen />
    </Scene>
  );
}
