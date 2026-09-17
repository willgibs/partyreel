import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { Reveal } from "@/components/marketing/system/reveal";
import { TiltCard } from "@/components/marketing/system/tilt-card";
import { EVENT_TYPES } from "@/lib/constants/events";
import { marketingImage } from "@/lib/constants/marketing-media";

import { AttendeeBadge, SharedRoll } from "./event-artifacts";

/**
 * The /events hub type directory: four cards, one per landing page, RICHER than
 * the home events teaser (this is the directory's whole job): a wide preview,
 * the teaser line, and the type's long-tail themes as quiet chips (the SEO
 * umbrella made visible).
 *
 * PREVIEWS FOLLOW THE PAGES (R4, A9): weddings and parties preview with the
 * manifest stills their heroes lead with; conferences and trips preview with
 * the PRODUCT ARTIFACT theirs lead with, because the bootstrap set has no
 * honest conference or trip subject and the old stand-ins (a banquet tent, a
 * festival crowd) promised the wrong event. Two photo cards and two artifact
 * cards read as one grid because the artifacts sit in the same 16:10 window on
 * a quiet plate.
 */
const DIRECTORY_STILLS: Record<string, string> = {
  weddings: "wedding-arch",
  parties: "party-balloons",
};

const THEME_CHIP_COUNT = 3;

function Preview({ slug }: { slug: string }) {
  const stillId = DIRECTORY_STILLS[slug];
  if (!stillId) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center overflow-hidden bg-muted/40 px-4">
        {slug === "conferences" ? (
          <AttendeeBadge scale="card" />
        ) : (
          <div className="w-full max-w-[230px]">
            <SharedRoll scale="card" />
          </div>
        )}
      </div>
    );
  }
  const still = marketingImage(stillId);
  return (
    <div className="relative aspect-[16/10]">
      <Image
        src={still.src}
        alt=""
        fill
        sizes="(min-width: 640px) 430px, 100vw"
        className="object-cover"
        // The top row peeks above the fold on desktop, where Next's LCP
        // heuristic picks a card still as the LCP element; two eager stills
        // (~tens of KB as served) keep LCP off a lazy load without touching the
        // mobile budget meaningfully.
        loading="eager"
      />
    </div>
  );
}

export function TypeDirectory() {
  return (
    // The grid's own reveal continues the section header's stagger slots
    // (SectionShell spends 0 and 1 on heading + subhead), so header and cards
    // read as one arrival. Four cards at the 90ms step = 270ms of spread, under
    // the 300ms stagger ceiling.
    <Reveal className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-2">
      {EVENT_TYPES.map(({ slug, navLabel, teaser, nestedThemes }, i) => (
        <TiltCard key={slug} className="rounded-2xl">
          <Link
            href={`/events/${slug}`}
            data-mkt-reveal
            style={{ "--i": i + 2 } as CSSProperties}
            className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-[border-color,transform] duration-150 hover:border-foreground/25 active:scale-[0.99]"
          >
            <Preview slug={slug} />
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
                <span className="rounded-full px-1 py-0.5 text-[11px] font-medium text-faint">
                  and more
                </span>
              </div>
            </div>
          </Link>
        </TiltCard>
      ))}
    </Reveal>
  );
}
