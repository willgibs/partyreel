"use client";

import "./cursor-backdrop.css";

import Image from "next/image";

import {
  HOME_SECTION_IDS,
  HOME_SECTION_SURFACE,
  type HomeSectionId,
} from "@/components/marketing/sections/home/section-ids";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { POOL } from "./backdrop";

/**
 * THE HOME PAGE'S RHYTHM, AS A STRIP.
 *
 * The rhythm question is about the PAGE, so its evidence is the page's chapters
 * rather than one section: fifteen bands in the pinned order
 * (`section-ids.ts`), each at its real share of the page's height, cinema dark
 * and paper light, with the photograph section drawn as a photograph.
 *
 * ★ A DIAGRAM, DELIBERATELY, NOT A SHRUNKEN PAGE. "Previews are 1:1" is a rule
 * about SIZE (`docs/design/guidance.md`), and nothing here reviews a size: what
 * is being read is where a dark run ends and a light one begins over a whole
 * page, which a screenshot at 12 percent makes less legible rather than more.
 * The section itself is drawn at 1:1 directly underneath, in the same frame.
 *
 * ★ THE SHARES ARE MEASURED, NOT GUESSED. Each number below is the section's
 * own height as a share of the home page at 1440, read off the rendered page
 * (`docs/tracks/cursor-backdrop.md` records the measurement). A band that is
 * wrong here would argue for a rhythm the page does not have.
 */

/** Section → the words on the band, and its share of the page at 1440. */
const BANDS: Record<HomeSectionId, { name: string; share: number }> = {
  "cinema-hero": { name: "The hero", share: 0.109 },
  "trust-strip": { name: "Trust", share: 0.018 },
  decomposition: { name: "Made from", share: 0.097 },
  "film-strip": { name: "Film strip", share: 0.096 },
  "no-app": { name: "No app, no account", share: 0.067 },
  "full-quality": { name: "Full quality", share: 0.052 },
  "live-demo": { name: "Live demo", share: 0.102 },
  album: { name: "The album", share: 0.088 },
  curation: { name: "Curation", share: 0.07 },
  privacy: { name: "Privacy", share: 0.065 },
  "reel-teaser": { name: "The reel", share: 0.085 },
  "events-teaser": { name: "Events", share: 0.055 },
  "pricing-teaser": { name: "Pricing", share: 0.052 },
  faq: { name: "Questions", share: 0.068 },
  "cinema-close": { name: "Roll credits", share: 0.043 },
};

/** Where a photograph section lands in the page's alternation. */
export type RhythmId = "swap-dark" | "swap-paper" | "insert";

export const rhythmOf = (v: string | undefined): RhythmId =>
  v === "swap-paper" ? "swap-paper" : v === "insert" ? "insert" : "swap-dark";

/** The section each option turns into a photograph, and where an insert goes. */
const TAKES: Record<RhythmId, HomeSectionId> = {
  "swap-dark": "full-quality",
  "swap-paper": "privacy",
  // `insert` adds a band rather than replacing one; this is the band it lands
  // BEFORE, which is the chapter cut from the event into the morning after.
  insert: "album",
};

type Row = {
  id: string;
  name: string;
  share: number;
  kind: "cinema" | "paper" | "photo";
};

export function rowsFor(rhythm: RhythmId): Row[] {
  const takes = TAKES[rhythm];
  const rows: Row[] = [];
  for (const id of HOME_SECTION_IDS) {
    const band = BANDS[id];
    if (rhythm === "insert" && id === takes) {
      rows.push({
        id: "inserted",
        name: "A photograph band, at the cut",
        share: 0.055,
        kind: "photo",
      });
    }
    rows.push({
      id,
      name: band.name,
      share: band.share,
      kind:
        rhythm !== "insert" && id === takes
          ? "photo"
          : HOME_SECTION_SURFACE[id],
    });
  }
  return rows;
}

export function ChapterStrip({
  rhythm,
  height = 420,
}: {
  rhythm: RhythmId;
  height?: number;
}) {
  const rows = rowsFor(rhythm);
  const total = rows.reduce((a, r) => a + r.share, 0);
  const photo = marketingImage(POOL[0]);
  return (
    <div className="cb-strip dark" style={{ height }}>
      {rows.map((r) => (
        <div
          key={r.id}
          className={cn(
            "cb-band",
            r.kind === "paper" && "surface-paper",
            r.kind !== "photo" && "bg-background text-muted-foreground",
            r.kind === "photo" && "text-white",
            r.kind !== "photo" &&
              "border-b border-[color-mix(in_oklab,var(--foreground)_12%,transparent)]",
          )}
          style={{ height: `${(r.share / total) * 100}%` }}
        >
          {r.kind === "photo" ? (
            <Image
              src={photo.src}
              alt=""
              fill
              sizes="640px"
              className="object-cover"
            />
          ) : null}
          <span
            className={cn(
              "relative truncate",
              r.kind === "photo" &&
                "font-medium drop-shadow-[0_1px_2px_rgb(0_0_0/0.8)]",
            )}
          >
            {r.name}
          </span>
        </div>
      ))}
    </div>
  );
}
