import type { CSSProperties } from "react";

import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";

import { type DoorSlug, FeatureDoor } from "./feature-door";

/**
 * THE OTHER DOORS: the sibling-features band, and since the feature-pages
 * round the OPENER of every feature page's closing chapter.
 *
 * Every feature page ends cinema: paper chapter -> this band -> FAQ -> the
 * CtaBand. The pacing principle (design-system.md, "Chapters") wants a
 * chapter to open strong and wind down, and this used to be three text tiles
 * on `bg-card/40`, so the close opened on its quietest section and the FAQ had
 * nothing to ramp down FROM. It is now three photographic doors (the ruled
 * media-forward card, feature-door.tsx) landing on the hard film cut with
 * real air above, then the FAQ and the CTA close quiet, which is the arc.
 *
 * Labels and lines read from the FEATURE_PAGES registry through doorFor so
 * copy can never drift from the nav.
 */
export function RelatedFeatures({
  slugs,
  opener = true,
}: {
  slugs: DoorSlug[];
  /**
   * false on a page whose close chapter already opens on its own beat (the
   * QR page's entry flow): two openers back to back are noise, so the doors
   * drop to the body register there (the standard rise, body air).
   */
  opener?: boolean;
}) {
  const entrance = opener
    ? { "data-mkt-cut": "" as const }
    : { "data-mkt-reveal": "" as const };
  return (
    <SectionShell
      eyebrow="Related features"
      /* A chapter opener's air: materially more above than a body section, so
         the doors arrive in a room of their own after the paper cut. */
      className={opener ? "pt-24 pb-14 sm:pt-32 sm:pb-16" : "py-14 sm:py-16"}
      reveal={opener ? "cinema" : "standard"}
    >
      {/* The eyebrow is SectionShell's (slot 0); the doors take the next three
          slots, one per door, left to right. */}
      <Reveal className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-3">
        {slugs.map((slug, i) => (
          <FeatureDoor
            key={slug}
            slug={slug}
            aspect="landscape"
            {...entrance}
            style={{ "--i": i + 1 } as CSSProperties}
          />
        ))}
      </Reveal>
    </SectionShell>
  );
}
