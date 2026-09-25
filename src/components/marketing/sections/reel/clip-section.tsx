import { ArrowLeft, Download, Plus, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { EVENT_NAME } from "@/components/marketing/sections/how-it-works/picture-parts";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MediaSplit } from "@/components/marketing/system/media-split";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { marketingImage } from "@/lib/constants/marketing-media";
import { MAX_REEL_SECONDS, TIER_NAMES, type Tier } from "@/lib/constants/tiers";
import { STYLE_CATALOG } from "@/lib/reel/engine/style-registry";

/**
 * /reel chapter three, THE CLIP: the one personal step, last (the morning
 * after). A clip is the viewer's own: made on their device from the reel with
 * Make your own, saved or shared as a file, never stored, and on a paid event
 * added to the album as an ordinary video the reel never plays.
 *
 * The picture is the creator's finish as it sits at a laptop (the room's head,
 * the clip at full height, the panel beside it holding the finish's words and
 * its doors, Share leading, under the way back to editing), so a portrait clip
 * never stands alone in a wide column. Its words are the creator's
 * (clip-room.tsx, clip-finish.tsx), pinned by mock-parity.
 *
 * The plan table is `reel-story` r1 `pricing=renamed`: the rows describe the
 * CLIP, never the live reel, which plays with no cap and no mark on any plan.
 * Lengths come from MAX_REEL_SECONDS and names from TIER_NAMES (tiers.ts is the
 * single source; a typed 30 or 60 here is the drift the table exists to stop).
 */

const ROWS: { tier: Tier; mark: string }[] = [
  { tier: "free", mark: "Small mark" },
  { tier: "event_pass", mark: "None" },
  { tier: "pro", mark: "None" },
];

/** The column name repeated inside a cell for the stacked phone layout only
 *  (display:none from sm up, so the desktop table is byte-identical). */
function RowLabel({ children }: { children: string }) {
  return (
    <span className="text-label font-medium text-muted-foreground uppercase sm:hidden">
      {children}
    </span>
  );
}

function FinishMock() {
  const look = STYLE_CATALOG[0];
  const clip = marketingImage("wedding-toast");
  return (
    <div
      aria-hidden
      className="rounded-2xl border bg-card p-2 ring-1 ring-foreground/5 sm:p-2.5"
    >
      {/* The room is always dark whatever the theme (clip-room.tsx's own
          near-black and its one raised surface), so its fills are literal. */}
      <div className="flex flex-col gap-3 rounded-xl bg-[oklch(0.11_0_0)] p-3 text-white sm:gap-4 sm:p-4">
        {/* The room's head: the event, the object, the clip's own line. */}
        <div className="text-center">
          <p className="truncate text-[9px] font-medium tracking-[0.08em] text-white/45 uppercase sm:text-label">
            {EVENT_NAME}
          </p>
          <p className="text-xs font-medium text-white/90 sm:text-sm">
            Your clip
          </p>
          <p className="text-[10px] text-white/40 tabular-nums sm:text-micro">
            {`0:30 \u00b7 ${look.label} \u00b7 8 moments`}
          </p>
        </div>
        <div className="grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-3 sm:gap-4">
          <span
            data-lit=""
            className="relative block aspect-[9/16] overflow-hidden rounded-lg"
          >
            <Image
              src={clip.src}
              alt=""
              fill
              sizes="(min-width: 1024px) 220px, 38vw"
              className="object-cover"
            />
          </span>
          {/* The finish, sitting in the bench's panel (clip-finish.tsx's
              FinishPanel): the way back, the words, the doors. */}
          <div className="flex min-w-0 flex-col rounded-lg bg-[oklch(0.14_0_0)] p-3 ring-1 ring-white/[0.07] sm:p-4">
            <span className="flex items-center gap-1.5 text-[10px] text-white/55 sm:text-caption">
              <ArrowLeft className="size-3 shrink-0" />
              <span className="truncate">Back to editing, your picks kept</span>
            </span>
            <div className="flex flex-1 flex-col justify-center gap-3 sm:gap-4">
              <div className="flex flex-col gap-0.5">
                <p className="text-[9px] font-semibold tracking-[0.08em] text-white/45 uppercase sm:text-label">
                  Your clip is ready
                </p>
                <p className="font-heading text-sm font-semibold sm:text-xl">
                  It&rsquo;s on this device.
                </p>
                <p className="text-xs text-white/55 max-sm:hidden">
                  Nothing leaves it until you share it or add it.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <span className="flex h-8 items-center justify-center gap-1.5 rounded-[var(--radius-action)] bg-reel text-[11px] font-medium text-white sm:h-10 sm:text-sm">
                  <Share2 className="size-3.5" />
                  Share
                </span>
                <span className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <span className="flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-[var(--radius-action)] border border-white/20 text-[11px] font-medium text-white/90 sm:h-10 sm:text-sm">
                    <Download className="size-3.5 shrink-0" />
                    Save
                  </span>
                  <span className="flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-[var(--radius-action)] border border-white/20 text-[11px] font-medium whitespace-nowrap text-white/90 sm:h-10 sm:text-sm">
                    <Plus className="size-3.5 shrink-0" />
                    Add to event
                  </span>
                </span>
                <span className="pt-0.5 text-center text-[10px] text-white/60 underline decoration-white/25 underline-offset-4 sm:text-caption">
                  Make another
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ClipSection() {
  const rise = (i: number) => ({
    "data-mkt-reveal": "",
    style: { "--i": i } as CSSProperties,
  });

  return (
    <SectionShell id="clip">
      <MediaSplit mediaSide="end" media={<FinishMock />}>
        <Reveal className="flex flex-col gap-4">
          <Eyebrow {...rise(0)}>The clip</Eyebrow>
          <h2 {...rise(1)} className="font-heading text-section text-balance">
            Everyone leaves with a clip of their own.
          </h2>
          <p {...rise(2)} className="text-pretty text-muted-foreground">
            Anyone with the album taps Make your own on the reel, picks the
            moments, a look, a layout and a length, and their own phone draws
            the clip. Share it, save it, or on a paid event add it to the album.
            It is made on the device, so it is never stored anywhere.
          </p>

          {/* PER-PLAN ROWS ON A PHONE: below sm each plan becomes its own block
              with the column name carried inline (the head row is hidden
              there, so nothing is left unlabelled); from sm up it is a table. */}
          <div {...rise(3)} className="mt-2 overflow-x-auto rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="max-sm:hidden">
                <tr className="border-b text-left text-label font-medium text-muted-foreground uppercase">
                  <th scope="col" className="px-4 py-3 font-medium">
                    Plan
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Clip length
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Clip watermark
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr
                    key={row.tier}
                    className="border-b last:border-0 max-sm:block max-sm:py-2"
                  >
                    <th
                      scope="row"
                      className="px-4 py-3 text-left font-medium whitespace-nowrap max-sm:block max-sm:pt-2 max-sm:pb-1"
                    >
                      {TIER_NAMES[row.tier]}
                    </th>
                    <td className="px-4 py-3 tabular-nums max-sm:flex max-sm:items-baseline max-sm:justify-between max-sm:gap-4 max-sm:py-1">
                      {/* ONE span on purpose: as bare text nodes the number and
                          "seconds" became separate flex items below sm and
                          justify-between blew them apart. */}
                      <RowLabel>Clip length</RowLabel>
                      <span>{MAX_REEL_SECONDS[row.tier]} seconds</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-sm:flex max-sm:items-baseline max-sm:justify-between max-sm:gap-4 max-sm:py-1">
                      <RowLabel>Clip watermark</RowLabel>
                      <span className="max-sm:text-right">{row.mark}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p {...rise(4)} className="text-sm text-pretty text-muted-foreground">
            The reel and the screen carry no mark on any plan, and photos and
            the album are never marked. Only a free event’s clips carry the
            small mark, and a paid plan takes it off.{" "}
            <Link
              href="/pricing"
              className="font-medium text-foreground underline underline-offset-4"
            >
              See full pricing
            </Link>
          </p>
        </Reveal>
      </MediaSplit>
    </SectionShell>
  );
}
