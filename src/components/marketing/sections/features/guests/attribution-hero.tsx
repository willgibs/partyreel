import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { BrowserFrame } from "@/components/marketing/frames";
import { FeatureHeroEyebrow } from "@/components/marketing/sections/features/shared/feature-hero-eyebrow";
import { PageHero } from "@/components/marketing/system/page-hero";
import { Reveal } from "@/components/marketing/system/reveal";
import { ScreenLamp } from "@/components/marketing/system/screen-lamp";
import { Button } from "@/components/ui/button";
import { featurePage } from "@/lib/constants/feature-pages";
import { marketingImage } from "@/lib/constants/marketing-media";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

/**
 * /features/guests hero: the shared PageHero lockup over THE ATTRIBUTION WALL,
 * the credited album made visible: a photo grid where the shots carry small
 * name chips (display names, one wearing the small unverified mark where the
 * host allows a name with no confirmed email behind it). All server-rendered;
 * the Reveal island staggers tiles first, chips after (higher --i slots), so
 * the names visibly land ON the photos. Fixtures are manifest images + the
 * Maya & Jay family's art-directed names, no real PII.
 *
 * THE PAGE'S LAMP (the feature-pages round): the wall is the lit thing, and it
 * throws its own light down off its bottom edge, coloured by SAMPLING the eight
 * photographs on it (system/screen-lamp.tsx). It is the only lamp between here
 * and the footer seam.
 */

/** R4 / review B3: two of the eight tiles carried NO chip, directly under a
 *  heading about every shot being credited, and a BARE tile means nothing at
 *  all. All eight are credited now (repeat names are the truth: guests add
 *  more than one shot each), and the cast matches the guest-list card further
 *  down the page. The identity reshape (2026-09-21) retired the "Anonymous"
 *  chip along with the concept: Theo's shot carries his typed name and the
 *  small unverified mark instead, since every upload carries a name now,
 *  verified or marked. */
const WALL: { id: string; by: string; unverified?: boolean }[] = [
  { id: "wedding-golden", by: "Maya" },
  { id: "reception-table", by: "Alex" },
  { id: "party-balloons", by: "Priya" },
  { id: "wedding-toast", by: "Jay" },
  { id: "party-dj", by: "Theo", unverified: true },
  { id: "festival-crowd", by: "Maya" },
  { id: "wedding-rings", by: "Noor" },
  { id: "reception-hall", by: "Sam" },
];

export function AttributionHero() {
  const page = featurePage("guests");

  return (
    <PageHero
      entrance="cut"
      eyebrow={<FeatureHeroEyebrow label={page.navLabel} />}
      heading={page.h1}
      subhead={page.heroSub}
      actions={
        <>
          <Button asChild size="cta">
            <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
          </Button>
          <Button asChild size="cta" variant="outline">
            <Link href="/features/album">See the live album</Link>
          </Button>
        </>
      }
      /* overflow-x-clip, never overflow-hidden: the lamp hangs below. */
      className="overflow-x-clip pt-14 pb-10 sm:pt-20 sm:pb-14"
    >
      {/* The wall: shots first, then the names landing ON them. R4 stagger
          fix: one slot PER ROW, not per tile. Sixteen individual slots ran
          16 x 90ms = 1.44s of stagger, five times the ~300ms ceiling, so the
          last chip arrived long after the reader had moved on. Grouped by row
          it lands in 270ms and keeps the same tiles-then-chips reading. */}
      <Reveal className="mx-auto mt-12 max-w-3xl sm:mt-16">
        <ScreenLamp>
          <BrowserFrame label="partyreel.com/a/maya-and-jay">
            {/* 2-up below sm: at 375px a 4-col tile is too narrow for the
                widest chip (Theo's, with the mark); the wall goes taller
                instead of clipping. */}
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {WALL.map((tile, i) => {
                const m = marketingImage(tile.id);
                const row = Math.floor(i / 4);
                return (
                  <div
                    key={tile.id}
                    data-mkt-reveal
                    className="relative aspect-square overflow-hidden rounded-tile"
                    style={{ "--i": row } as CSSProperties}
                  >
                    <Image
                      src={m.src}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 174px, 25vw"
                      className="object-cover"
                    />
                    <span
                      data-mkt-reveal
                      className="absolute bottom-1 left-1 flex items-center gap-1 rounded-full bg-black/55 py-0.5 pr-2 pl-0.5 text-[10px] leading-4 font-medium text-white backdrop-blur-sm"
                      style={{ "--i": 2 + row } as CSSProperties}
                    >
                      <span className="grid size-3.5 place-items-center rounded-full bg-white/25 text-[8px]">
                        {tile.by[0]}
                      </span>
                      {tile.by}
                      {tile.unverified && (
                        <span
                          aria-label="A name with no verified email behind it"
                          title="A name with no verified email behind it"
                          className="size-1.5 shrink-0 rounded-full bg-warning"
                        />
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </BrowserFrame>
        </ScreenLamp>
      </Reveal>
    </PageHero>
  );
}
