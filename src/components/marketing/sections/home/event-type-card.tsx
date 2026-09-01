import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

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
        className={
          "group relative block aspect-4/5 overflow-hidden rounded-xl bg-muted " +
          // The focus ring is WHITE and offset inward, not the token ring:
          // `outline-ring` lands ~1.4:1 on a dark photograph (the footer round's
          // token-redeclaration trap, in its keyboard form).
          "focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white" +
          // The house press idiom: explicit transition properties, never `all`.
          "transition-[transform] duration-200 ease-emphasis active:scale-[0.99] motion-reduce:transition-none"
        }
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

        {/* THE COPY SCRIM -- measured, not assumed. On the deployed preview the
            main scrim alone left the Conferences title at a median 3.65:1
            against the white tablecloth under it (worst 2.1:1), and Parties at
            a borderline 4.5:1, read per-pixel off the rendered image with the
            gradient's alpha applied. Same answer the hero reached for its
            mobile copy (cinema-hero.tsx): one extra short ramp that puts ink
            behind the copy block ONLY, so the photograph above stays bright
            and the main scrim keeps lifting on hover. This one does not lift. */}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[55%] bg-linear-to-t from-black/75 to-transparent"
        />

        <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-5">
          <span className="font-heading text-lg leading-tight text-white sm:text-xl">
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
