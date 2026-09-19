"use client";

import { CtaBand } from "@/components/marketing/system/cta-band";
import { PricingPointer } from "@/components/marketing/sections/how-it-works/pricing-pointer";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { DEMO_EVENT_URL } from "@/lib/demo";
import { planById } from "@/lib/constants/tiers";
import { formatBytes } from "@/lib/utils";

import { Widths } from "./scene";

/**
 * THE CLOSE (optional; asked only because it fit the reading budget,
 * docs/tracks/how-it-works.md): how the page ends. "band" quotes today's two
 * real components in sequence; "folded" is a new close (the free-plan line
 * moves inside the band, one seam instead of two, so it is not a reuse of
 * either production component); "demo" is today's real `CtaBand` with its
 * second button re-pointed.
 */
export type CloseShape = "band" | "folded" | "demo";

/** The one new composition this decision proposes: PricingPointer's fact
 *  folded into the band's own subhead, so the two strips become one. */
function FoldedClose() {
  const free = planById("free");
  return (
    <SectionShell
      heading="Start your first event free."
      subhead={`${formatBytes(free.storageBytes)} covers a whole first event, plans sized by storage, not guest counts. Create the event, share one QR code, and the whole thing lands in one album.`}
    >
      <div className="mt-8 flex flex-col items-center gap-3">
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <span className="flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground">
            Start free
          </span>
          <span className="flex h-11 items-center justify-center rounded-md border px-6 text-sm font-medium">
            Browse the features
          </span>
        </div>
        <LearnMoreLink href="/pricing">See full pricing</LearnMoreLink>
      </div>
    </SectionShell>
  );
}

function ClosePage({ shape }: { shape: CloseShape }) {
  if (shape === "folded") {
    return (
      <div className="dark bg-background text-foreground">
        <div data-hiw-picture>
          <FoldedClose />
        </div>
      </div>
    );
  }
  if (shape === "demo") {
    return (
      <div className="dark bg-background text-foreground">
        <PricingPointer />
        <div data-hiw-picture>
          <CtaBand
            heading="Start your first event free."
            subhead="Create the event, share one QR code, and the whole thing lands in one album."
            secondary={{
              label: "Try the live demo",
              href: DEMO_EVENT_URL ?? "/demo-event",
            }}
          />
        </div>
      </div>
    );
  }
  return (
    <div className="dark bg-background text-foreground">
      <PricingPointer />
      <div data-hiw-picture>
        <CtaBand
          heading="Start your first event free."
          subhead="Create the event, share one QR code, and the whole thing lands in one album."
          demoLink
        />
      </div>
    </div>
  );
}

// Measured against the real rendered frames: "folded" ran 462 px at 375
// against a first guess of 420 (PROGRAM.md, "measure every tile before it
// ships").
const CLOSE_H: Record<CloseShape, { d: number; p: number }> = {
  band: { d: 480, p: 560 },
  folded: { d: 420, p: 560 },
  demo: { d: 480, p: 580 },
};

const NOTE: Record<CloseShape, string> = {
  band: "As today: the pointer strip, then the band, two hairline seams.",
  folded: "The free-plan line moves inside the band: one seam instead of two.",
  demo: "The band's second button becomes the live demo, not Browse the features.",
};

export function closePreview(shape: CloseShape) {
  return (
    <Widths
      id={`close-${shape}`}
      ground="cinema"
      desktopH={CLOSE_H[shape].d}
      phoneH={CLOSE_H[shape].p}
      note={NOTE[shape]}
      render={() => <ClosePage shape={shape} />}
    />
  );
}
