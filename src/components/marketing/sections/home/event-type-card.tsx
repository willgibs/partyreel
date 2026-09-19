import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { CARD_COPY_SCRIM } from "@/components/marketing/sections/features/shared/feature-door";
import { cn } from "@/lib/utils";

/**
 * AN EVENT-TYPE CARD, MEDIA-FORWARD: the photograph IS the card.
 *
 * Will, round 2: "make the event card design media-forward with the image
 * being the full background, the copy keeping its position bottom left, and
 * using a dark gradient overlay to ensure the text is distinct."
 *
 * This is the blog's post-card anatomy (post-card.tsx), adopted rather than
 * re-invented: type sits ON the photograph over a bottom-weighted scrim that
 * LIFTS on hover instead of desaturating, because photography supplies all the
 * colour in this system and draining it fights the identity. White type over
 * media is the house precedent (cinema-hero's H1) and is theme-independent.
 *
 * ★ NO LAMP HERE, BY RULING. Three earlier versions put light on or under this
 * card. The last one worked, and was still pulled: four spills in a row
 * followed 765px later by the Pro card's beam put two light events inside one
 * viewport and "loses the magic". Scarcity is a distance. The photograph now
 * does the whole job the light was doing -- it is the colour.
 *
 * ★ NO TILT, NO GLARE (Will). The 3D hover and its cursor-tracking glare each
 * read fine alone, but either would have to become a site-wide pattern to
 * belong, and neither complements the spill/beam identity. The press
 * affordance stays.
 *
 * Presentational and server-safe (no hooks), so the section ships no JS for it.
 * Crop: 4/5, the app's UNIFORM_TILE_ASPECT, same as the post card.
 */
export function EventTypeCard({
  href,
  src,
  title,
  teaser,
  style,
}: {
  href: string;
  src: string;
  title: string;
  teaser: string;
  style?: CSSProperties;
}) {
  return (
    <div data-mkt-reveal className="h-full" style={style}>
      <Link
        href={href}
        className={cn(
          "group relative block aspect-4/5 overflow-hidden rounded-xl bg-muted",
          // The focus ring is WHITE and offset inward, not the token ring:
          // `outline-ring` lands ~1.4:1 on a dark photograph (the footer round's
          // token-redeclaration trap, in its keyboard form).
          "focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white",
          // The house press idiom: explicit transition properties, never `all`.
          // ★ cn(), never string concatenation: the first cut joined these with
          // `+` and no separating space, so the rendered class was
          // `outline-whitetransition-[transform]` and both the focus ring and
          // the press transition were silently dead (caught 2026-09-01).
          "transition-[transform] duration-200 ease-emphasis active:scale-[0.99] motion-reduce:transition-none",
        )}
      >
        <Image
          src={src}
          alt=""
          fill
          sizes="(min-width: 1024px) 280px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 ease-emphasis group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />

        {/* Rest scrim -> hover scrim. 180ms out is the ratified hover
            asymmetry: a card is skimmed, not studied, so the trail back stays
            calm. Bottom-weighted so the copy's ground is the darkest part of
            the frame and the top of the photograph stays nearly clear. */}
        <span
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/10 transition-opacity duration-[180ms] ease-emphasis group-hover:opacity-70 motion-reduce:transition-none"
        />

        {/* THE CARD'S OWN COPY GRADIENT -- measured, not assumed, and no longer
            spelled here: it is one ruled treatment worn by every media-forward
            card on the site (CARD_COPY_SCRIM in feature-door.tsx has the
            ruling, the two layers and the measurement note). It replaced the
            straight 85% / 60% bottom-up ramp this card carried, which was
            itself re-cut twice against per-pixel readings; the weight moved
            into the bottom-left corner the copy starts from, so the bottom
            right keeps more of its photograph. Like the ramp it replaces, this
            one does not lift on hover while the main scrim does. The
            conference still is a borrowed placeholder (see events-teaser.tsx);
            the gradient is sized for the real photograph that replaces it, not
            tuned to this one. */}
        <span
          aria-hidden
          className="absolute inset-0"
          style={CARD_COPY_SCRIM}
        />

        <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-5">
          <span className="font-heading text-subsection text-white">
            {title}
          </span>
          {/* white/85, not /80: the teaser is the smaller face over the
              lighter part of the ramp, and a translucent white is a lower
              contrast than the measurement's pure-white assumption. */}
          <span className="text-sm leading-relaxed text-white/85">
            {teaser}
          </span>
        </span>
      </Link>
    </div>
  );
}
