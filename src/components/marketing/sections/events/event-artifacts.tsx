import Image from "next/image";
import type { ReactNode } from "react";

import { BrowserFrame } from "@/components/marketing/frames";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { ScanPulseRing } from "./scan-pulse-ring";

/**
 * THE EVENT PRODUCT ARTIFACTS (R4 finding A9): two verticals have no honest
 * photo in the manifest — conferences (the bootstrap set's only "venue" is a
 * blue-and-white banquet tent, which read as a wedding) and trips (the only
 * "away" frames are festival crowds, which read as an EDM rave against
 * "family reunions, retreats"). The ruling: NEVER download new media to paper
 * over that, and never let a photo make a promise the vertical can't keep —
 * lead with the PRODUCT instead.
 *
 *  - AttendeeBadge: the attendee badge (the reviewer-praised artifact on the
 *    site), the cell every conference object is built from. Its `code` slot
 *    takes the demo's REAL plate, which is what makes the conference hero a
 *    door rather than a picture of one (`event-object.tsx`).
 *  - SharedRoll: an album mid-fill, with uploads landing from four different
 *    people. The story the product actually tells (everyone's camera in one
 *    place) told by the product, not by a borrowed subject.
 *
 * ★ WHAT THE WIRING ROUND CHANGED (2026-09-19). Will ruled the CARDS onto
 * photographs for all four types ("all events should have a photograph
 * (weddings, parties) rather than an artifact (conferences, trips)"), so
 * neither artifact stands in a card any more: the directory and the home row
 * both take a still from `events.ts`, a named stand-in until ASSETS rows 24 and
 * 25 land. The artifacts stayed for the two jobs a photograph cannot do: the
 * badge is the conference's lit object, and the filling pane is what the
 * statement stands beside on the two types whose visual is the product.
 * `BadgeFan` went with the hand-rolled hero it was built for, and the roll
 * stopped naming its own stills: it takes them like every other component here.
 *
 * Both render at two scales: "hero" and "card". Decorative except the code:
 * callers set aria-hidden on the drawn parts, never over a real link.
 */

/* The badge's decorative QR, drawn locally: the shared QrFrame's decorative
   block tokens its cells (bg-foreground data + bg-brand finders), which INVERTS
   on the cinema skin (white data, invisible ink finders — no longer reads as a
   QR). A real QR is ink-on-white for scanners, so the badge draws exactly that
   on a white plate (the LiveQr precedent), deterministic per seed so SSR and
   client never drift and no two badges in the fan repeat a pattern. Decorative
   only: live scannable QRs belong to the home demo ticket and /features/qr. */
const BADGE_QR_SIZE = 11;

function badgeQrCells(seed: number): boolean[] {
  return Array.from({ length: BADGE_QR_SIZE * BADGE_QR_SIZE }, (_, i) => {
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
    return (x * 73 + y * 151 + x * y * 13 + seed * 29) % 5 < 2;
  });
}

export function AttendeeBadge({
  name = "Alex Rivera",
  role = "Attendee",
  seed = 0,
  scale = "hero",
  pulse = false,
  code,
  className,
}: {
  name?: string;
  role?: string;
  seed?: number;
  scale?: "hero" | "card";
  /** Ambient "scan me" ring on the QR plate (the front badge only). */
  pulse?: boolean;
  /**
   * A REAL code, in place of the drawn cells (the events wiring, 2026-09-19).
   * Will ruled the object hero because it "conveys more about how we actually
   * help that event (such as incorporating the QR)", so the conference object's
   * FRONT badge carries the demo's own scannable plate while the four leaning
   * behind it keep their decorative ones. The slot brings its own white plate
   * (the scanner-contrast rule), so the badge stops drawing one under it.
   */
  code?: ReactNode;
  className?: string;
}) {
  const hero = scale === "hero";
  return (
    <div
      className={cn(
        "flex w-full flex-col rounded-2xl border bg-card ring-1 ring-foreground/5",
        hero ? "max-w-[230px] gap-3 p-5" : "max-w-[150px] gap-2 p-3.5",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto rounded-full bg-muted-foreground/25",
          hero ? "h-1.5 w-10" : "h-1 w-7",
        )}
      />
      <div className="flex flex-col gap-0.5 text-center">
        <span className={cn("font-medium", hero ? "text-sm" : "text-xs")}>
          {name}
        </span>
        <span
          className={cn(
            "tracking-[0.14em] text-muted-foreground uppercase",
            hero ? "text-[10px]" : "text-[8px]",
          )}
        >
          {role}
        </span>
      </div>
      <div
        className={cn(
          "relative mx-auto",
          // A real code arrives on its own plate; the drawn cells need one.
          !code && "rounded-lg bg-white p-2",
        )}
      >
        {pulse && <ScanPulseRing />}
        {code ?? (
          <div
            className={cn("grid gap-px", hero ? "w-28" : "w-16")}
            style={{
              gridTemplateColumns: `repeat(${BADGE_QR_SIZE}, minmax(0, 1fr))`,
            }}
          >
            {badgeQrCells(seed).map((dark, index) => (
              <span
                key={index}
                className={cn(
                  "aspect-square rounded-[1px]",
                  dark ? "bg-black" : "bg-white",
                )}
              />
            ))}
          </div>
        )}
      </div>
      <span
        className={cn(
          "text-center text-muted-foreground",
          hero ? "text-xs" : "text-[9px]",
        )}
      >
        Scan to add photos
      </span>
    </div>
  );
}

/**
 * THE ALBUM FILLING, AS THE PRODUCT ITSELF.
 *
 * ★ IT IS NEVER IDLE, and that is the whole design. A wide frame of empty
 * plates reads as a BROKEN album rather than a filling one (the first R4 cut of
 * this artifact did exactly that), so a pane is always six tiles: whatever
 * honest stills the type owns, INTERLEAVED with uploads in flight, never
 * blocked together. Interleaving is not decoration either: the manifest's only
 * "away" frames are festival ones, and two of those side by side rebuild the
 * "this is a concert" read A9 came here to kill.
 *
 * ★ AND IT TAKES ITS PHOTOGRAPHS RATHER THAN NAMING THEM (the events wiring,
 * 2026-09-19). It used to hard-code two trip stills and one album name, which
 * made it the trip page's artifact and nothing else; `events.ts` now owns every
 * still per type, so the SAME pane is the conference statement's visual, the
 * trip statement's visual, and whatever the next type needs.
 */
type RollTile =
  | { kind: "still"; id: string }
  | { kind: "arriving"; initials: string; percent: number };

/** The people adding while a reader looks at it. Four, with their own progress,
 *  because four people uploading at once IS the pitch these panes make. */
const ARRIVING: { initials: string; percent: number }[] = [
  { initials: "AR", percent: 70 },
  { initials: "BN", percent: 35 },
  { initials: "CD", percent: 55 },
  { initials: "MK", percent: 20 },
];

const ROLL_TILE_COUNT = 6;

/** Stills first into the odd slots, uploads into the rest, so no two
 *  photographs ever land beside each other whatever the type owns. */
function rollTiles(stills: readonly string[]): RollTile[] {
  const tiles: RollTile[] = [];
  let next = 0;
  for (let i = 0; i < ROLL_TILE_COUNT; i++) {
    const still = i % 2 === 0 ? stills[i / 2] : undefined;
    if (still) tiles.push({ kind: "still", id: still });
    else if (next < ARRIVING.length)
      tiles.push({ kind: "arriving", ...ARRIVING[next++] });
    else tiles.push({ kind: "still", id: stills[stills.length - 1] });
  }
  return tiles;
}

export function SharedRoll({
  scale = "hero",
  title = "Desert weekend",
  slug = "desert-weekend",
  stills = ["festival-crowd", "concert-confetti"],
}: {
  scale?: "hero" | "card";
  /** The album's name in its own header row. */
  title?: string;
  /** What the frame's address bar reads. */
  slug?: string;
  /** The type's honest stills, strongest first. */
  stills?: readonly string[];
}) {
  const hero = scale === "hero";
  const tiles = rollTiles(stills);
  return (
    <BrowserFrame
      className={cn("mx-auto", hero ? "max-w-lg" : "rounded-xl p-2")}
      label={hero ? <>partyreel.com/a/{slug}</> : undefined}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-3",
          hero ? "mb-3 px-1" : "mb-2 px-0.5",
        )}
      >
        <span className={cn("font-medium", hero ? "text-sm" : "text-[11px]")}>
          {title}
        </span>
        {/* No avatar comb up here: the tiles below already carry the initials,
            and two rows of the same four people read as a bug. */}
        <span
          className={cn(
            "text-muted-foreground",
            hero ? "text-[11px]" : "text-[9px]",
          )}
        >
          {ARRIVING.length} adding
        </span>
      </div>

      <div className={cn("grid grid-cols-3", hero ? "gap-2" : "gap-1")}>
        {tiles.map((tile, i) =>
          tile.kind === "still" ? (
            <div
              key={`${tile.id}-${i}`}
              className={cn(
                "relative aspect-square overflow-hidden",
                hero ? "rounded-lg" : "rounded-md",
              )}
            >
              <Image
                src={marketingImage(tile.id).src}
                alt=""
                fill
                sizes={hero ? "170px" : "70px"}
                className="object-cover"
              />
            </div>
          ) : (
            <div
              key={tile.initials}
              className={cn(
                "flex aspect-square flex-col items-center justify-center bg-muted/50",
                hero ? "gap-2 rounded-lg" : "gap-1 rounded-md",
              )}
            >
              <span
                className={cn(
                  "flex items-center justify-center rounded-full border bg-card font-medium text-muted-foreground",
                  hero ? "size-7 text-[10px]" : "size-4 text-[7px]",
                )}
              >
                {tile.initials}
              </span>
              <span
                className={cn(
                  "relative h-1 overflow-hidden rounded-full bg-foreground/10",
                  hero ? "w-12" : "w-6",
                )}
              >
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-foreground/40"
                  style={{ width: `${tile.percent}%` }}
                />
              </span>
            </div>
          ),
        )}
      </div>
    </BrowserFrame>
  );
}
