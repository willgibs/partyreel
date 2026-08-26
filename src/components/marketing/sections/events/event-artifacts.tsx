import Image from "next/image";

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
 *  - AttendeeBadge / BadgeFan: the attendee badge (the reviewer-praised
 *    artifact on the site) promoted from a side panel to the conference hero.
 *    A fan of three badges says what the venue photo could not: every attendee
 *    in the room carries the code.
 *  - SharedRoll: the trip's album mid-fill, with four uploads landing from four
 *    different people. The story trips actually sells (everyone's camera in one
 *    place) told by the product, not by a borrowed subject.
 *
 * Both render at two scales: "hero" (the /events/[slug] hero) and "card" (the
 * /events hub directory tile), so the hub previews the same artifact its page
 * leads with. Decorative by contract: callers set aria-hidden.
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
  className,
}: {
  name?: string;
  role?: string;
  seed?: number;
  scale?: "hero" | "card";
  /** Ambient "scan me" ring on the QR plate (the front badge only). */
  pulse?: boolean;
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
      <div className="relative mx-auto rounded-lg bg-white p-2">
        {pulse && <ScanPulseRing />}
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

/** Three badges from the registration desk: the front one crisp and pulsing,
 *  two more fanned behind it. Below `sm` the fan collapses to the single front
 *  badge (A21: hero visuals must not shrink into stamps on a phone). */
export function BadgeFan() {
  return (
    <div className="flex items-center justify-center">
      <AttendeeBadge
        name="Priya Shah"
        role="Speaker"
        seed={4}
        className="hidden origin-bottom-right scale-[0.9] -rotate-[7deg] opacity-80 sm:-mr-12 sm:flex"
      />
      <AttendeeBadge pulse seed={0} className="z-10 shadow-lg" />
      <AttendeeBadge
        name="Marcus Lee"
        role="Crew"
        seed={9}
        className="hidden origin-bottom-left scale-[0.9] rotate-[7deg] opacity-80 sm:-ml-12 sm:flex"
      />
    </div>
  );
}

/* The roll's stills. Only frames that can honestly belong to a weekend away
   with a group (the manifest has no vacation subjects) and only TWO of them:
   the ARTIFACT leads here, and a wall of festival frames would put the page
   right back where A9 found it. */
const ROLL_STILLS = ["festival-crowd", "concert-confetti"];

/* The uploads in flight: initials + how far along, the same progress vocabulary
   the phone frame uses. This is what fills the roll's empty half — four people
   adding at once IS the trip pitch, where four blank plates were just a hole. */
const ROLL_ARRIVING: { initials: string; percent: number }[] = [
  { initials: "AR", percent: 70 },
  { initials: "BN", percent: 35 },
  { initials: "CD", percent: 55 },
  { initials: "MK", percent: 20 },
];

/**
 * The trip's shared roll: who is adding, and the album filling as they do.
 *
 * The grid is deliberately SMALL and never idle. A wide frame of empty plates
 * reads as a broken album, not a filling one (the first R4 cut of this artifact
 * did exactly that), so the six tiles are two landed photos and four uploads in
 * flight: every cell says something.
 */
export function SharedRoll({ scale = "hero" }: { scale?: "hero" | "card" }) {
  const hero = scale === "hero";
  return (
    <BrowserFrame
      className={cn("mx-auto", hero ? "max-w-md" : "rounded-xl p-2")}
      label={hero ? <>partyreel.com/a/desert-weekend</> : undefined}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-3",
          hero ? "mb-3 px-1" : "mb-2 px-0.5",
        )}
      >
        <span className={cn("font-medium", hero ? "text-sm" : "text-[11px]")}>
          Desert weekend
        </span>
        {/* No avatar comb up here: the tiles below already carry the initials,
            and two rows of the same four people read as a bug. */}
        <span
          className={cn(
            "text-muted-foreground",
            hero ? "text-[11px]" : "text-[9px]",
          )}
        >
          6 adding
        </span>
      </div>

      <div className={cn("grid grid-cols-3", hero ? "gap-2" : "gap-1")}>
        {ROLL_STILLS.map((id) => {
          const still = marketingImage(id);
          return (
            <div
              key={id}
              className={cn(
                "relative aspect-square overflow-hidden",
                hero ? "rounded-lg" : "rounded-md",
              )}
            >
              <Image
                src={still.src}
                alt=""
                fill
                sizes={hero ? "150px" : "70px"}
                className="object-cover"
              />
            </div>
          );
        })}
        {ROLL_ARRIVING.map(({ initials, percent }) => (
          <div
            key={initials}
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
              {initials}
            </span>
            <span
              className={cn(
                "relative h-1 overflow-hidden rounded-full bg-foreground/10",
                hero ? "w-12" : "w-6",
              )}
            >
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-foreground/40"
                style={{ width: `${percent}%` }}
              />
            </span>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}
