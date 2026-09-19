"use client";

import Image from "next/image";

import {
  AttendeeBadge,
  SharedRoll,
} from "@/components/marketing/sections/events/event-artifacts";
import { PhoneShell } from "@/components/marketing/frames";
import { Reveal } from "@/components/marketing/system/reveal";
import { TiltCard } from "@/components/marketing/system/tilt-card";
import { EVENT_TYPES } from "@/lib/constants/events";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { BADGE_BY_TYPE, PHOTO_STAND_IN } from "./fixtures";
import type { HeroPictureShape } from "./hero-picture";

/**
 * DECISION 7: THE DIRECTORY, staged after THE HERO'S PICTURE. Card-scale art
 * per type, wearing whatever hero-picture answer the board carries, so a
 * reviewer never judges density against a picture this decision invented on
 * its own: `split` mirrors today's real `TypeDirectory` exactly (a real
 * still for weddings/parties, `AttendeeBadge`/`SharedRoll` at their own
 * `scale="card"` for conferences/trips); `artifacts` wears one badge, every
 * card; `photos` reuses THE HERO'S PICTURE's own stand-in stills; `phone` a
 * small bezel, every card.
 */
export type DirectoryShape = "tilt-two-up" | "four-across" | "list";

const DIRECTORY_STILLS: Record<string, string> = {
  weddings: "wedding-arch",
  parties: "party-balloons",
};

function PhoneGlyph() {
  return (
    <PhoneShell className="max-w-[86px]" screenClassName="p-2">
      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-sm bg-muted" />
        ))}
      </div>
    </PhoneShell>
  );
}

function Still({ id, stand }: { id: string; stand?: boolean }) {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden">
      <Image src={marketingImage(id).src} alt="" fill sizes="280px" className="object-cover" />
      {stand && (
        <span className="absolute right-1.5 bottom-1.5 rounded-full bg-background/90 px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
          stand-in
        </span>
      )}
    </div>
  );
}

function cardArt(heroShape: HeroPictureShape, slug: string): React.ReactNode {
  const badge = BADGE_BY_TYPE[slug];
  if (heroShape === "phone") return <PhoneGlyph />;
  if (heroShape === "artifacts")
    return (
      <div className="flex items-center justify-center py-3">
        <AttendeeBadge name={badge.name} role={badge.role} seed={slug.length} scale="card" />
      </div>
    );
  const still = DIRECTORY_STILLS[slug];
  if (still) return <Still id={still} />;
  if (heroShape === "photos" && PHOTO_STAND_IN[slug])
    return <Still id={PHOTO_STAND_IN[slug]} stand />;
  return slug === "trips" ? (
    <div className="flex items-center justify-center px-4 py-3">
      <SharedRoll scale="card" />
    </div>
  ) : (
    <div className="flex items-center justify-center py-3">
      <AttendeeBadge name={badge.name} role={badge.role} seed={slug.length} scale="card" />
    </div>
  );
}

export function DirectoryPreview({
  shape,
  heroShape,
}: {
  shape: DirectoryShape;
  heroShape: HeroPictureShape;
}) {
  if (shape === "list") {
    return (
      <div className="mx-auto max-w-2xl divide-y rounded-xl border bg-card/40 px-6 py-2">
        {EVENT_TYPES.map(({ slug, navLabel, teaser }) => (
          <div key={slug} className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="font-heading text-subsection">{navLabel}</p>
              <p className="text-sm text-muted-foreground">{teaser}</p>
            </div>
            <div className="w-16 shrink-0">{cardArt(heroShape, slug)}</div>
          </div>
        ))}
      </div>
    );
  }

  const cols = shape === "four-across" ? "sm:grid-cols-4" : "sm:grid-cols-2";
  return (
    <Reveal className={cn("mx-auto grid max-w-5xl gap-5 px-6 py-10", cols)}>
      {EVENT_TYPES.map(({ slug, navLabel, teaser, nestedThemes }) => (
        <TiltCard key={slug} className="rounded-2xl">
          <div className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card">
            <div className="flex items-center justify-center overflow-hidden bg-muted/40">
              {cardArt(heroShape, slug)}
            </div>
            <div
              className={cn(
                "flex flex-1 flex-col gap-2",
                shape === "four-across" ? "p-4" : "p-6",
              )}
            >
              <h3 className="font-heading text-subsection">{navLabel}</h3>
              {shape === "tilt-two-up" && (
                <>
                  <p className="text-sm text-muted-foreground">{teaser}</p>
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                    {nestedThemes.slice(0, 3).map((theme) => (
                      <span
                        key={theme}
                        className="rounded-full border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </TiltCard>
      ))}
    </Reveal>
  );
}
