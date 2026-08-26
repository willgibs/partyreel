import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { BrowserFrame } from "@/components/marketing/frames";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { Reveal } from "@/components/marketing/system/reveal";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { featurePage } from "@/lib/constants/feature-pages";
import { marketingImage } from "@/lib/constants/marketing-media";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

/**
 * /features/guests hero: the stub grammar over THE ATTRIBUTION WALL — the
 * credited album made visible: a photo grid where the shots carry small name
 * chips (display names, plus "Anonymous" where the host allows it). All
 * server-rendered; the Reveal island staggers tiles first, chips after
 * (higher --i slots), so the names visibly land ON the photos. Fixtures are
 * manifest images + the Maya & Jay family's art-directed names, no real PII.
 */

const WALL: { id: string; by?: string }[] = [
  { id: "wedding-golden", by: "Maya" },
  { id: "reception-table" },
  { id: "party-balloons", by: "Priya" },
  { id: "wedding-toast", by: "Jay" },
  { id: "party-dj", by: "Anonymous" },
  { id: "festival-crowd" },
  { id: "wedding-rings", by: "Noor" },
  { id: "reception-hall", by: "Sam" },
];

export function AttributionHero() {
  const page = featurePage("guests");
  const cut = (i: number) => ({
    "data-mkt-cut": "",
    style: { "--i": i } as CSSProperties,
  });

  return (
    <section className="overflow-hidden pt-14 pb-10 sm:pt-20 sm:pb-14">
      <Container>
        <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
          <Link
            {...cut(0)}
            href="/features"
            className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase transition-colors duration-150 hover:text-foreground"
          >
            Features
          </Link>
          <Eyebrow {...cut(1)}>{page.navLabel}</Eyebrow>
          <h1
            {...cut(2)}
            className="font-heading text-4xl text-balance sm:text-5xl lg:text-6xl"
          >
            {page.h1}
          </h1>
          <p
            {...cut(3)}
            className="max-w-2xl text-lg text-pretty text-muted-foreground"
          >
            {page.heroSub}
          </p>
          <div {...cut(4)} className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-11 px-6 text-base">
              <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 px-6 text-base"
            >
              <Link href="/features/album">See the live album</Link>
            </Button>
          </div>
        </Reveal>

        {/* The wall: tiles take --i slots 0-7, chips 8-15 (names land after
            the shots; the reveal grammar's stagger does the sequencing). */}
        <Reveal className="mx-auto mt-12 max-w-3xl sm:mt-16">
          <BrowserFrame label="partyreel.com/a/maya-and-jay">
            <div className="grid grid-cols-4 gap-1.5">
              {WALL.map((tile, i) => {
                const m = marketingImage(tile.id);
                return (
                  <div
                    key={tile.id}
                    data-mkt-reveal
                    className="relative aspect-square overflow-hidden rounded-[4px]"
                    style={{ "--i": i } as CSSProperties}
                  >
                    <Image
                      src={m.src}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 174px, 25vw"
                      className="object-cover"
                    />
                    {tile.by && (
                      <span
                        data-mkt-reveal
                        className="absolute bottom-1 left-1 flex items-center gap-1 rounded-full bg-black/55 py-0.5 pr-2 pl-0.5 text-[10px] leading-4 font-medium text-white backdrop-blur-sm"
                        style={{ "--i": 8 + i } as CSSProperties}
                      >
                        <span className="grid size-3.5 place-items-center rounded-full bg-white/25 text-[8px]">
                          {tile.by[0]}
                        </span>
                        {tile.by}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </BrowserFrame>
        </Reveal>
      </Container>
    </section>
  );
}
