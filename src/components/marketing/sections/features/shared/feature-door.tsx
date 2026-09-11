import { Check, Link2, Lock, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { StyledQr } from "@/components/app/styled-qr";
import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { featurePage } from "@/lib/constants/feature-pages";
import {
  marketingImage,
  MARKETING_REELS,
} from "@/lib/constants/marketing-media";
import { GOLDEN_LINES } from "@/lib/constants/marketing-voice";
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import { cn } from "@/lib/utils";

/**
 * A FEATURE DOOR, MEDIA-FORWARD: the photograph IS the card.
 *
 * The ruled card anatomy (Will, round 2, on the home event cards: "the image
 * being the full background, the copy keeping its position bottom left, and
 * using a dark gradient overlay to ensure the text is distinct"), adopted here
 * rather than re-invented, so the hub directory and every page's sibling band
 * share one shape with the blog library and the events teaser. Rising tides:
 * the ruling spreads instead of staying on two pages.
 *
 * Each door carries a SIGNATURE: the feature's own photograph plus the small
 * chip its surface actually draws (the live dot, the approved check, the name
 * chip, the lock, the play badge), so the six doors read as six different
 * rooms rather than six crops of the same album. The QR door is the one
 * non-photograph on purpose: a code is a made object, not a moment, and it
 * renders through the real app renderer on its own white plate, the way the
 * events hub leads conferences with a badge fan instead of a borrowed venue.
 * The old hub used hand-drawn motifs on bare cards for the same "seven
 * identical rectangles" problem; photographs solve it at the size a door
 * deserves, and the motif code went with them.
 *
 * ★ NO LAMP HERE, BY RULING (the event cards' lesson): a row of lit doors is
 * the every-section-gets-a-version failure. The photograph is the colour.
 * ★ NO TILT, NO GLARE (Will). The press affordance stays.
 *
 * Presentational and server-safe (no hooks); StyledQr is the one client leaf.
 */

type Aspect = "portrait" | "landscape" | "wide";

const ASPECT: Record<Aspect, string> = {
  /** 4/5, the app's UNIFORM_TILE_ASPECT (the hub directory, the blog library). */
  portrait: "aspect-4/5",
  /** 3/2: the sibling band, where three doors share one row above a FAQ. */
  landscape: "aspect-3/2",
  /** 21/9: the hub's full-width lead. */
  wide: "aspect-[16/9] sm:aspect-[21/9]",
};

/** One small chip in the app's own tile-chip register (white on a dark wash). */
function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-black/55 px-2 text-[11px] leading-none font-medium text-white backdrop-blur-sm">
      {children}
    </span>
  );
}

/** The doors' photographs + the chip each surface draws. */
const SIGNATURE: Record<string, { image: string; chip: ReactNode }> = {
  album: {
    image: "wedding-golden",
    chip: (
      <Chip>
        <span className="relative flex size-1.5">
          <span className="absolute inset-0 rounded-full bg-success/70" />
          <span className="relative size-1.5 rounded-full bg-success" />
        </span>
        Filling live
      </Chip>
    ),
  },
  curation: {
    image: "wedding-rings",
    chip: (
      <Chip>
        <span className="flex size-3.5 items-center justify-center rounded-full bg-success text-success-foreground">
          <Check className="size-2.5" strokeWidth={3} />
        </span>
        Approved
      </Chip>
    ),
  },
  sharing: {
    image: "wedding-arch",
    chip: (
      <Chip>
        <Link2 className="size-3" />
        One link
      </Chip>
    ),
  },
  guests: {
    image: "festival-crowd",
    chip: (
      <Chip>
        <span className="grid size-3.5 place-items-center rounded-full bg-white/25 text-[8px]">
          M
        </span>
        Maya
      </Chip>
    ),
  },
  privacy: {
    image: "party-dj",
    chip: (
      <Chip>
        <Lock className="size-3" />
        Private
      </Chip>
    ),
  },
};

/** The reel poster the door shows; the LANDSCAPE render, whose frame is full. */
const REEL_POSTER_ID = "hero-candidate-02";

function reelPoster() {
  const reel = MARKETING_REELS.find((r) => r.id === REEL_POSTER_ID);
  if (!reel) throw new Error(`Unknown marketing reel id: ${REEL_POSTER_ID}`);
  return reel;
}

function formatDuration(seconds: number): string {
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/** The QR door's art: the real renderer on a white plate, on ink. A short
 *  value on purpose (the preset switcher's lesson): a full event URL packs
 *  ~33 modules into ~100px and reads as a grey square. Rendered ABOVE the
 *  scrims (it is white on ink, and a scrim over a white plate greys it into
 *  exactly the square the short value avoids), in the upper part of the card
 *  so the copy block below never overlaps it. */
function QrPlateArt() {
  return (
    <span className="absolute inset-x-0 top-0 bottom-[34%] z-10 flex items-center justify-center">
      <span className="w-fit rounded-lg bg-white p-2.5 shadow-[0_0_0_1px_oklch(1_0_0/0.08)] transition-transform duration-500 ease-emphasis group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100 sm:p-3">
        <StyledQr
          value="https://partyreel.com"
          size={132}
          style={resolveQrPreset("classic")}
          className="w-[clamp(84px,34%,132px)] [&>svg]:h-auto [&>svg]:w-full"
        />
      </span>
    </span>
  );
}

/** The QR door's ground: ink, under the shared scrims. */
function InkGround() {
  return <span className="absolute inset-0 bg-[oklch(0.13_0_0)]" />;
}

export type DoorSlug =
  | "album"
  | "qr"
  | "curation"
  | "sharing"
  | "guests"
  | "privacy"
  | "reel";

/** The door's identity, read off the registry (never hand-copied). "reel" is
 *  the one non-registry slug, special-cased exactly as the nav and the hub
 *  hand-append it: /reel sits outside the registry by design. */
export function doorFor(slug: DoorSlug): {
  href: string;
  title: string;
  line: string;
  long: string;
} {
  if (slug === "reel") {
    return {
      href: "/reel",
      title: "The highlight reel",
      line: `${GOLDEN_LINES.reelThesis}.`,
      long: "The whole event, cut into a minute. Restyle it in a tap, send it tonight.",
    };
  }
  const page = featurePage(slug);
  return {
    href: `/features/${page.slug}`,
    title: page.navLabel,
    line: page.navDescription,
    long: page.directoryLine,
  };
}

export function FeatureDoor({
  slug,
  aspect = "landscape",
  copy = "short",
  priority,
  className,
  ...props
}: {
  slug: DoorSlug;
  aspect?: Aspect;
  /** "short" = the panel one-liner; "long" = the directory line (the hub). */
  copy?: "short" | "long";
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
  "data-mkt-cut"?: string;
  "data-mkt-reveal"?: string;
}) {
  const door = doorFor(slug);
  const signature = SIGNATURE[slug];
  const reel = slug === "reel" ? reelPoster() : null;
  const art = reel
    ? { src: reel.poster, alt: "" }
    : signature
      ? { src: marketingImage(signature.image).src, alt: "" }
      : null;

  return (
    <div className={cn("h-full", className)} {...props}>
      <Link
        href={door.href}
        className={cn(
          "mkt-learn group relative block overflow-hidden rounded-xl bg-muted",
          ASPECT[aspect],
          // The focus ring is WHITE and offset inward, not the token ring:
          // `outline-ring` lands ~1.4:1 on a dark photograph (the footer
          // round's token-redeclaration trap, in its keyboard form).
          "focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white",
          // The house press idiom: explicit transition properties, never `all`.
          "transition-[transform] duration-200 ease-emphasis active:scale-[0.99] motion-reduce:transition-none",
        )}
      >
        {art ? (
          <Image
            src={art.src}
            alt=""
            fill
            priority={priority}
            sizes={
              aspect === "wide"
                ? "(min-width: 1024px) 1024px, 100vw"
                : "(min-width: 1024px) 340px, (min-width: 640px) 50vw, 100vw"
            }
            className="object-cover transition-transform duration-500 ease-emphasis group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <InkGround />
        )}

        {/* Rest scrim -> hover scrim. 180ms out is the ratified hover
            asymmetry: a card is skimmed, not studied. Bottom-weighted so the
            copy's ground is the darkest part of the frame. */}
        <span
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/10 transition-opacity duration-[180ms] ease-emphasis group-hover:opacity-70 motion-reduce:transition-none"
        />
        {/* The copy scrim, measured on the event cards (85% / 60%): ink
            behind the copy block only, so the photograph above stays bright.
            This one does not lift. */}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[60%] bg-linear-to-t from-black/85 to-transparent"
        />

        {!art && <QrPlateArt />}

        {/* The signature chip, where the app draws its tile chips. Decorative:
            hidden from the link's accessible name, which stays the door's
            title + line. */}
        {(signature || reel) && (
          <span aria-hidden className="absolute top-3 left-3">
            {reel ? (
              <Chip>
                <Play className="size-3 fill-white" />
                {formatDuration(reel.durationSeconds)}
              </Chip>
            ) : (
              signature?.chip
            )}
          </span>
        )}

        <span
          className={cn(
            "absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-5",
            aspect === "wide" && "sm:max-w-xl sm:p-7",
          )}
        >
          <span
            className={cn(
              "flex items-center gap-1.5 font-heading leading-tight text-white",
              aspect === "wide"
                ? "text-xl sm:text-3xl"
                : "text-lg sm:text-xl",
            )}
          >
            {door.title}
            <LearnChevron />
          </span>
          {/* The line sits a step quieter than the title (white/70, not the
              event cards' /85: Will, 2026-09-02, "draws too much attention"),
              on a PERCENTAGE measure of the copy block so both rows stop short
              of the card's right edge by layout rather than by where the words
              happen to break, and text-balance so the two rows land even. The
              copy scrim behind it (85% black at the foot) is what keeps /70
              readable; do not lift it without re-measuring. */}
          <span
            className={cn(
              "text-sm leading-relaxed text-balance text-white/70",
              aspect === "wide" ? "max-w-lg" : "max-w-[84%]",
            )}
          >
            {copy === "long" ? door.long : door.line}
          </span>
        </span>
      </Link>
    </div>
  );
}
