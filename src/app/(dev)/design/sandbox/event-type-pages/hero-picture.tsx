"use client";

import { Cell } from "@/components/lab";
import { AlbumFrame, PhoneShell } from "@/components/marketing/frames";
import { AttendeeBadge } from "@/components/marketing/sections/events/event-artifacts";
import { EventHeroMedia } from "@/components/marketing/sections/events/event-hero-media";
import { EVENT_TYPES } from "@/lib/constants/events";

import { BADGE_BY_TYPE, PHOTO_STAND_IN } from "./fixtures";

/**
 * DECISION 2: THE HERO'S PICTURE. All four `EventHeroMedia` slots, real
 * component wherever the option keeps it real, one 2x2 grid per option so the
 * four types are judged together (the whole point of "split" vs "for all
 * four"). Each cell keeps the production 4:5-ish column width `EventHeroMedia`
 * already clamps to, so no cell is a smaller copy of the real thing. `Cell`
 * is the kit's own (name, then the thing), never re-declared.
 */
export type HeroPictureShape = "split" | "artifacts" | "photos" | "phone";

function ArtifactCell({ type }: { type: string }) {
  const badge = BADGE_BY_TYPE[type];
  return (
    <div className="flex justify-center py-4">
      <AttendeeBadge name={badge.name} role={badge.role} seed={type.length} />
    </div>
  );
}

function PhoneCell({ type }: { type: string }) {
  const label = EVENT_TYPES.find((t) => t.slug === type)?.navLabel ?? type;
  return (
    <PhoneShell className="mx-auto max-w-[200px]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-foreground">
          Add your photos
        </span>
        <span className="text-[9px] text-muted-foreground">{label}</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} data-media-tile className="aspect-square rounded-md bg-muted" />
        ))}
      </div>
    </PhoneShell>
  );
}

/** One type's art under one hero-picture shape — exported so THE DIRECTORY
 *  (staged after this decision) draws its cards wearing the same answer,
 *  rather than a second, independent guess at what "artifacts for all four"
 *  looks like on a card. */
export function heroArt(shape: HeroPictureShape, slug: string): React.ReactNode {
  if (shape === "split") return <EventHeroMedia slug={slug} />;
  if (shape === "artifacts") return <ArtifactCell type={slug} />;
  if (shape === "phone") return <PhoneCell type={slug} />;
  // photos
  if (!PHOTO_STAND_IN[slug]) return <EventHeroMedia slug={slug} />;
  return (
    <div className="flex flex-col gap-1.5">
      <AlbumFrame label={`partyreel.com/a/your-${slug.slice(0, -1)}`} />
      <p className="text-[11px] text-muted-foreground">
        Stand-in: no honest {slug} still in the manifest yet (asked in Handoff).
      </p>
    </div>
  );
}

export function HeroPicturePreview({ shape }: { shape: HeroPictureShape }) {
  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-6 py-10 sm:grid-cols-2">
      {EVENT_TYPES.map(({ slug, navLabel }) => (
        <Cell key={slug} name={navLabel}>
          {heroArt(shape, slug)}
        </Cell>
      ))}
    </div>
  );
}
