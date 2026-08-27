import { QrCode } from "lucide-react";
import Image from "next/image";

import { BrowserFrame } from "@/components/marketing/frames";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { BadgeFan, SharedRoll } from "./event-artifacts";

/**
 * The /events/[slug] hero media. Each type keeps a DISTINCT composition (the
 * "no two pages alike" bar), but R4's finding A9 re-cut WHAT each one shows:
 * a hero photo is a promise, and two of the four were promising the wrong
 * event.
 *
 *  - weddings: the shared album mid-fill. The manifest's honest strength (six
 *    wedding subjects), so this one stays photo-led.
 *  - parties: three prints from the table. The nightclub DJ and the concert
 *    confetti are OUT (they promised a club against "baby showers,
 *    graduations"); balloons, the long table, and the toast read as the
 *    birthdays and anniversaries the page actually sells.
 *  - conferences: the attendee badge fan (see event-artifacts.tsx). The venue
 *    photo it replaces was a banquet tent.
 *  - trips: the group's shared roll, filling. The reel it replaces was a
 *    festival render that read as an EDM night.
 *
 * MANIFEST NOTE (grep-able): conferences and trips lead with product artifacts
 * BY DESIGN while the bootstrap set has no honest subject for them. If a batch
 * ever lands real conference/trip media, the artifact stays the hero and the
 * photos become supporting texture — never the other way around.
 *
 * A21: every composition has a phone-sized variant. Eight 70px stamps or three
 * smudged prints are not a hero; below `sm` each one shows fewer, larger
 * pieces. All decorative (aria-hidden at the root).
 */

// Wedding-read subjects only (the screenshot pass swapped festival-lights out:
// rainbow lasers read as a rave inside a wedding album). The first FOUR are the
// phone composition, so they lead with the strongest frames.
const WEDDING_ALBUM_TILES = [
  "wedding-golden",
  "wedding-arch",
  "wedding-petals",
  "wedding-toast",
  "reception-table",
  "wedding-rings",
  "reception-hall",
  "party-balloons",
];

const MOBILE_ALBUM_TILES = 4;

/** Varied tilt + drop, so the pile reads scattered on a table (A26: three
 *  prints leaning the same way read as a filmstrip, not a pile). The third
 *  print is the phone drop (A21). */
const PARTY_PRINTS: { id: string; className: string }[] = [
  { id: "party-balloons", className: "-rotate-[7deg] sm:translate-y-1" },
  { id: "reception-table", className: "rotate-[3deg] translate-y-3 z-10" },
  {
    id: "wedding-toast",
    className: "hidden sm:block -rotate-[2deg] -translate-y-1",
  },
];

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
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {WEDDING_ALBUM_TILES.map((id, i) => {
          const m = marketingImage(id);
          return (
            <div
              key={id}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg",
                i >= MOBILE_ALBUM_TILES && "hidden sm:block",
              )}
            >
              <Image
                src={m.src}
                alt=""
                fill
                sizes="(min-width: 768px) 180px, 45vw"
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
    <div className="flex items-center justify-center gap-3 sm:gap-6">
      {PARTY_PRINTS.map(({ id, className }) => {
        const m = marketingImage(id);
        return (
          <div
            key={id}
            className={cn(
              "w-[45%] max-w-[220px] rounded-xl border bg-card p-2 ring-1 ring-foreground/5 sm:w-1/3 sm:p-2.5",
              className,
            )}
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
              <Image
                src={m.src}
                alt=""
                fill
                sizes="(min-width: 768px) 220px, 45vw"
                className="object-cover"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Keyed off the SLUG, not a frame name: two of the four compositions changed
 *  shape in R4, and the old frame-literal map ("qr", "reel" — the since-deleted
 *  events-layout.ts) would now mislabel what renders. Adding a type here
 *  without a case is a visible hole, so the map is exhaustive on purpose. */
export function EventHeroMedia({ slug }: { slug: string }) {
  return (
    <div aria-hidden className="mx-auto mt-12 w-full max-w-3xl">
      {slug === "weddings" && <WeddingAlbum />}
      {slug === "parties" && <PartyPrints />}
      {slug === "conferences" && <BadgeFan />}
      {slug === "trips" && <SharedRoll />}
    </div>
  );
}
