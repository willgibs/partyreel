import { Check, Link2, Lock, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import {
  QR_DOOR_FRAMES,
  QR_DOOR_SIZES,
} from "@/components/shared/river/qr-door-frames";
import {
  qrRiverOrigin,
  QrRiverPlate,
} from "@/components/shared/river/qr-plate";
import { River } from "@/components/shared/river/river";
import { featurePage } from "@/lib/constants/feature-pages";
import {
  marketingImage,
  MARKETING_REELS,
} from "@/lib/constants/marketing-media";
import { GOLDEN_LINES } from "@/lib/constants/marketing-voice";
import { SITE_URL } from "@/lib/constants/site";
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
 * rooms rather than six crops of the same album. The QR door is the one that
 * is not a still: the album pours out of a real scannable code standing on
 * ink (Will's `code=in`, `place=tenth`, `fall=behind`, 2026-09-19), which is
 * the card visual he called the first truly beautiful one. The old hub used
 * hand-drawn motifs on bare cards for the same "seven identical rectangles"
 * problem; photographs solve it at the size a door deserves, and the motif
 * code went with them.
 *
 * ★ NO LAMP HERE, BY RULING (the event cards' lesson): a row of lit doors is
 * the every-section-gets-a-version failure. The photograph is the colour.
 * ★ NO TILT, NO GLARE (Will). The press affordance stays.
 *
 * Presentational and server-safe (no hooks); the river is the one client leaf,
 * and the code beside it is server-rendered with no JS at all (qr-plate.tsx).
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

/** The same shapes as numbers, for the one visual whose arithmetic needs the
 *  box: the QR door's river. `wide` is its >=640 ratio, and the QR door is 4:5
 *  everywhere it ships (Will's `short=tall`), so the pair never disagree where
 *  it matters. */
const RATIO: Record<Aspect, number> = {
  portrait: 5 / 4,
  landscape: 2 / 3,
  wide: 9 / 21,
};

/**
 * ★ THE MEDIA-FORWARD CARD'S OWN COPY GRADIENT, ruled on river-card round one
 * and deliberately NOT part of any visual (Will, 2026-09-19): "A subtle dark
 * gradient overlay from the bottom left to allow the text in the card to be
 * slightly more visible... This would stack on top of the existing gradient
 * that fades the photo out, more custom to the cards themselves for more
 * distinction between the card copy and its visual. The river has a gradient
 * overlay to fade it out for its own visual, then the card would have its own
 * from its text, being treated separately so the card's applies to all
 * features & visual pairings." And: "Not exclusive to the QR code card, nor
 * part of the river visual design itself, which keeps its own overlay fade as
 * well."
 *
 * So it is ONE string with ONE home, worn by every door here and by the home's
 * event-type cards, and it replaces the straight bottom-up ramp both used to
 * carry. Two layers, because "bottom left" is two facts: a band that gives the
 * whole copy row its ground, and a bloom in the corner the copy starts from.
 * Their alphas compose (1 - (1-a)(1-b)), so the corner is the darkest point of
 * the card and the bottom RIGHT, where no copy ever reaches, keeps more of its
 * photograph than it did before -- which is the distinction he asked for.
 *
 * ★ MEASURED, NOT ASSUMED, on every door's and every event card's real visual
 * at 1440 and 375: the copy hidden, the card photographed, the white composited
 * over each pixel at its own alpha. Against the ramp it replaces, the worst 5
 * percent of the title's pixels went 7.60 -> 10.89 on Conferences, 9.17 ->
 * 13.11 on Parties, 11.13 -> 15.05 on Trips (the three the old note called a
 * hair under AA), and no door moved DOWN. The one that is genuinely hard is the
 * QR door, where the copy reads over twelve full-luminance photographs in
 * flight: sampled across a whole 7.6s cycle at 1440 the title (20px/700, which
 * is AA-large) holds a median of 16.19 with a 1st percentile of 3.16, and the
 * line a median of 9.63 with a 1st percentile of 4.96. It was 1.00 at the fifth
 * percentile under the old ramp. The cost of `fall=behind` is that a letter can
 * cross a bright frame; the ruling took that trade with its eyes open, and this
 * gradient is what keeps it a moment rather than a state.
 *
 * An inline style rather than an arbitrary class: one constant in one place
 * beats the same hundred-character gradient spelled twice, and a class this
 * long is what `pnpm format` mangles.
 */
export const CARD_COPY_SCRIM: CSSProperties = {
  backgroundImage: [
    // The band: the copy row's ground, gone by the middle of the card.
    "linear-gradient(to top, oklch(0 0 0 / 0.78) 0%, oklch(0 0 0 / 0.4) 18%, oklch(0 0 0 / 0.1) 38%, transparent 55%)",
    // The corner: an ellipse springing from the bottom-left, wide enough to
    // carry a title and a two-row line and spent well before the right edge.
    "radial-gradient(92% 62% at 0% 100%, oklch(0 0 0 / 0.62) 0%, oklch(0 0 0 / 0.36) 34%, oklch(0 0 0 / 0.12) 62%, transparent 85%)",
  ].join(", "),
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

/**
 * ★ WHAT THE QR DOOR'S CODE OPENS (Will's `opens=short`, 2026-09-19): a short
 * link to the live demo event, at the smallest code that scans. The value is
 * the whole size argument — `/demo` is 25 modules and a 99 px floor, the demo
 * event's own link is 33 and 123, a quarter more card spent on the object the
 * album is meant to be falling out of. The redirect that carries it is
 * `src/app/demo/route.ts`. Never the apex again: a code that opens the page
 * the reader is already on is an Easter egg with nothing inside it.
 */
const QR_DOOR_VALUE = `${SITE_URL}/demo`;

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
            copy's ground is the darkest part of the frame. This is THE
            VISUAL'S OWN FADE, the one the card's gradient stacks over. */}
        <span
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/10 transition-opacity duration-[180ms] ease-emphasis group-hover:opacity-70 motion-reduce:transition-none"
        />

        {/* ★ THE RIVER, BETWEEN THE TWO SCRIMS (Will's `fall=behind`,
            2026-09-19: "The whole door streams, like the photographs beside
            it; the words read over moving pictures, under the shade the event
            cards were measured with"). The layer is the whole point: under
            BOTH scrims the rest scrim is 40 percent black by the door's middle
            and every photograph goes to mud; above both, the copy keeps bare
            ink and the flow stops before the words. Here it runs on behind the
            copy under the card's own gradient alone. The wrapper takes the
            door's box, so the flow's own aspect-ratio box lands on it exactly
            and every length inside stays a fraction of the door. */}
        {!art && (
          <div aria-hidden className="absolute inset-0">
            <River
              className="rvr-ink"
              frames={QR_DOOR_FRAMES}
              ratio={RATIO[aspect]}
              origin={qrRiverOrigin(RATIO[aspect])}
              sizes={QR_DOOR_SIZES}
            />
          </div>
        )}

        {/* THE CARD'S OWN COPY GRADIENT. It does not lift on hover. */}
        <span
          aria-hidden
          className="absolute inset-0"
          style={CARD_COPY_SCRIM}
        />

        {/* The code, over everything: a scrim across a white plate greys it
            into the square a short value exists to avoid. */}
        {!art && <QrRiverPlate ratio={RATIO[aspect]} value={QR_DOOR_VALUE} />}

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
          {/* A door's title is a tile's title (`subsection`, like every
              marketing tile); the wide door is the featured one and sits one
              step up (`subhead`). Two steps, never a stock ramp per aspect. */}
          <span
            className={cn(
              "flex items-center gap-1.5 font-heading text-white",
              aspect === "wide" ? "text-subhead" : "text-subsection",
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
