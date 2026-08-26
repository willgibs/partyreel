import { QrCode } from "lucide-react";
import Image from "next/image";

import { BrowserFrame, ReelFrame } from "@/components/marketing/frames";
import { AmbientReelVideo } from "@/components/marketing/sections/reel/ambient-reel-video";
import {
  marketingImage,
  MARKETING_REELS,
} from "@/lib/constants/marketing-media";
import type { EventFrame } from "@/lib/constants/events-layout";

/**
 * The /events/[slug] hero media (B2 re-skin): each type keeps its DISTINCT
 * presentation slot (EVENT_PRESENTATION.frame, the "no two pages alike" bar)
 * but the placeholder frames give way to REAL manifest media, per the ruled
 * media-forward direction (the per-type pages let their media carry the color).
 *
 *  - weddings ("album"): the shared album mid-fill, a browser grid of the day.
 *  - parties ("phone"): three tilted prints, the tactile candid pile.
 *  - conferences ("qr"): the decorative QR beside the venue (NEVER liveQrUrl
 *    here; live scannable QRs live where they're the point: the home hero's
 *    demo ticket, the nav's Features panel, and /features/qr).
 *  - trips ("reel"): a real engine render looping in the player frame (the
 *    reel-angle payoff made visible).
 *
 * MANIFEST GAP (grep-able, matches the batch-1 fill list): the bootstrap set
 * has no conference or trip subjects, so conferences borrow the venue hall and
 * trips borrow the festival-arc render; the fix is a manifest swap at batch-1
 * intake, never a component change. All decorative (aria-hidden).
 */

// All wedding-read subjects (the screenshot pass swapped festival-lights out:
// rainbow lasers read as a rave inside a wedding album).
const WEDDING_ALBUM_TILES = [
  "wedding-golden",
  "wedding-arch",
  "wedding-toast",
  "wedding-petals",
  "reception-table",
  "wedding-rings",
  "reception-hall",
  "party-balloons",
];

const PARTY_PRINTS: { id: string; className: string }[] = [
  { id: "party-balloons", className: "rotate-[-4deg]" },
  { id: "party-dj", className: "rotate-[2deg] translate-y-2" },
  { id: "concert-confetti", className: "rotate-[5deg]" },
];

/** Venue stand-in for the conference composition (see MANIFEST GAP above). */
const CONFERENCE_VENUE = "reception-hall";
/** Trip stand-in render (see MANIFEST GAP above). */
const TRIP_REEL_ID = "hero-candidate-02";

function WeddingAlbum() {
  return (
    <BrowserFrame
      label={
        <>
          <QrCode className="size-3" />
          partyreel.com/a/maya-and-jay
        </>
      }
    >
      <div className="grid grid-cols-4 gap-2">
        {WEDDING_ALBUM_TILES.map((id) => {
          const m = marketingImage(id);
          return (
            <div
              key={id}
              className="relative aspect-square overflow-hidden rounded-lg"
            >
              <Image
                src={m.src}
                alt=""
                fill
                sizes="(min-width: 768px) 180px, 25vw"
                className="object-cover"
              />
            </div>
          );
        })}
      </div>
    </BrowserFrame>
  );
}

function PartyPrints() {
  return (
    <div className="flex items-center justify-center gap-4 sm:gap-6">
      {PARTY_PRINTS.map(({ id, className }) => {
        const m = marketingImage(id);
        return (
          <div
            key={id}
            className={`w-1/3 max-w-[220px] rounded-xl border bg-card p-2 ring-1 ring-foreground/5 sm:p-2.5 ${className}`}
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
              <Image
                src={m.src}
                alt=""
                fill
                sizes="(min-width: 768px) 220px, 33vw"
                className="object-cover"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* The conference badge's decorative QR, drawn locally: the shared QrFrame's
   decorative block tokens its cells (bg-foreground data + bg-brand finders),
   which INVERTS on the cinema skin (white data, invisible ink finders — no
   longer reads as a QR). A real QR is ink-on-white for scanners, so the badge
   draws exactly that on a white plate (the LiveQr precedent), deterministic so
   SSR/client never drift. Decorative only — live QRs belong to the demo ticket + /features/qr. */
const BADGE_QR_SIZE = 11;
const BADGE_QR_CELLS: boolean[] = Array.from(
  { length: BADGE_QR_SIZE * BADGE_QR_SIZE },
  (_, i) => {
    const x = i % BADGE_QR_SIZE;
    const y = Math.floor(i / BADGE_QR_SIZE);
    const inFinder =
      (x < 3 && y < 3) ||
      (x >= BADGE_QR_SIZE - 3 && y < 3) ||
      (x < 3 && y >= BADGE_QR_SIZE - 3);
    if (inFinder) {
      const fx = x < 3 ? x : x - (BADGE_QR_SIZE - 3);
      const fy = y < 3 ? y : y - (BADGE_QR_SIZE - 3);
      return !(fx === 1 && fy === 1);
    }
    return (x * 73 + y * 151 + x * y * 13) % 5 < 2;
  },
);

function ConferenceBadge() {
  return (
    <div className="mx-auto flex w-full max-w-[230px] flex-col gap-3 rounded-2xl border bg-card p-5 ring-1 ring-foreground/5">
      <div className="mx-auto h-1.5 w-10 rounded-full bg-muted-foreground/25" />
      <div className="flex flex-col gap-0.5 text-center">
        <span className="text-sm font-medium">Alex Rivera</span>
        <span className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          Attendee
        </span>
      </div>
      <div className="mx-auto rounded-lg bg-white p-2">
        <div
          className="grid w-28 gap-px"
          style={{
            gridTemplateColumns: `repeat(${BADGE_QR_SIZE}, minmax(0, 1fr))`,
          }}
        >
          {BADGE_QR_CELLS.map((dark, index) => (
            <span
              key={index}
              className={`aspect-square rounded-[1px] ${dark ? "bg-black" : "bg-white"}`}
            />
          ))}
        </div>
      </div>
      <span className="text-center text-xs text-muted-foreground">
        Scan to add photos
      </span>
    </div>
  );
}

function ConferenceSplit() {
  const venue = marketingImage(CONFERENCE_VENUE);
  return (
    <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-5 sm:gap-6">
      <div className="flex justify-center sm:col-span-2">
        <ConferenceBadge />
      </div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border ring-1 ring-foreground/5 sm:col-span-3">
        <Image
          src={venue.src}
          alt=""
          fill
          sizes="(min-width: 768px) 460px, 100vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}

function TripReel() {
  const reel = MARKETING_REELS.find((r) => r.id === TRIP_REEL_ID);
  if (!reel) throw new Error(`Unknown marketing reel id: ${TRIP_REEL_ID}`);
  return (
    <ReelFrame
      media={
        <AmbientReelVideo
          reel={reel}
          sizes="(min-width: 768px) 720px, 100vw"
          className="h-full w-full"
        />
      }
    />
  );
}

export function EventHeroMedia({ frame }: { frame: EventFrame }) {
  return (
    <div aria-hidden className="mx-auto mt-12 w-full max-w-3xl">
      {frame === "album" && <WeddingAlbum />}
      {frame === "phone" && <PartyPrints />}
      {frame === "qr" && <ConferenceSplit />}
      {frame === "reel" && <TripReel />}
    </div>
  );
}
