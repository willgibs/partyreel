import Image from "next/image";
import Link from "next/link";

import { TiltCard } from "@/components/marketing/system/tilt-card";
import { EVENT_TYPES } from "@/lib/constants/events";
import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * The /events hub type directory (B2 re-skin): four manifest-still cards, one
 * per landing page, RICHER than the home events teaser (this is the directory's
 * whole job): a wide still, the teaser line, and the type's long-tail themes as
 * quiet chips (the SEO umbrella made visible). Card-tilt is the one flourish
 * (hover feedback, not a mechanic); TiltCard wraps directly so the rounded clip
 * reaches the glare (the CardGrid className gap).
 *
 * MANIFEST GAP (grep-able, matches the batch-1 fill list): no conference or
 * trip subjects in the bootstrap set; those two borrow the closest reads. Fix
 * is a manifest swap, never a component change.
 */
const DIRECTORY_STILLS: Record<string, string> = {
  weddings: "wedding-arch",
  parties: "party-balloons",
  conferences: "reception-hall",
  trips: "festival-crowd",
};

const THEME_CHIP_COUNT = 3;

export function TypeDirectory() {
  return (
    <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-2">
      {EVENT_TYPES.map(({ slug, navLabel, teaser, nestedThemes }, i) => {
        const still = marketingImage(DIRECTORY_STILLS[slug] ?? "wedding-arch");
        return (
          <TiltCard key={slug} className="rounded-2xl">
            <Link
              href={`/events/${slug}`}
              className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card"
            >
              <div className="relative aspect-[16/10]">
                <Image
                  src={still.src}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 430px, 100vw"
                  className="object-cover"
                  // The top row peeks above the fold on desktop, where Next's
                  // LCP heuristic picks a card still as the LCP element; two
                  // eager stills (~tens of KB as served) keep LCP off a lazy
                  // load without touching the mobile budget meaningfully.
                  loading={i < 2 ? "eager" : undefined}
                />
              </div>
              <div className="flex flex-1 flex-col gap-2.5 p-6">
                <h3 className="font-heading text-xl">{navLabel}</h3>
                <p className="text-sm text-muted-foreground">{teaser}</p>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                  {nestedThemes.slice(0, THEME_CHIP_COUNT).map((theme) => (
                    <span
                      key={theme}
                      className="rounded-full border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                    >
                      {theme}
                    </span>
                  ))}
                  <span className="rounded-full px-1 py-0.5 text-[11px] font-medium text-muted-foreground/70">
                    and more
                  </span>
                </div>
              </div>
            </Link>
          </TiltCard>
        );
      })}
    </div>
  );
}
