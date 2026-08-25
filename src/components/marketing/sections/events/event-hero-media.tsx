import { QrCode } from "lucide-react";
import Image from "next/image";

import { BrowserFrame, QrFrame, ReelFrame } from "@/components/marketing/frames";
import { AmbientReelVideo } from "@/components/marketing/sections/reel/ambient-reel-video";
import { marketingImage, MARKETING_REELS } from "@/lib/constants/marketing-media";
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
 *    here; the one real scannable QR lives on the /features hero only).
 *  - trips ("reel"): a real engine render looping in the player frame (the
 *    reel-angle payoff made visible).
 *
 * MANIFEST GAP (grep-able, matches the batch-1 fill list): the bootstrap set
 * has no conference or trip subjects, so conferences borrow the venue hall and
 * trips borrow the festival-arc render; the fix is a manifest swap at batch-1
 * intake, never a component change. All decorative (aria-hidden).
 */

const WEDDING_ALBUM_TILES = [
  "wedding-golden",
  "wedding-arch",
  "wedding-toast",
  "wedding-petals",
  "reception-table",
  "wedding-rings",
  "reception-hall",
  "festival-lights",
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

function ConferenceSplit() {
  const venue = marketingImage(CONFERENCE_VENUE);
  return (
    <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-5 sm:gap-6">
      <div className="flex justify-center sm:col-span-2">
        <QrFrame caption="On every badge" />
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
