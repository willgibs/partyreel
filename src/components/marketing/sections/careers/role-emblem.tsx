import { cn } from "@/lib/utils";

/**
 * THE ROLE EMBLEM - a per-role mark, shown on its card and again as the avatar
 * above its title on the role page, which the two pages morph between.
 *
 * Drawn as SVG rather than the DOM art used elsewhere on this page: these need
 * true circles and arcs, and they render at 44px on a card AND at 96px in a
 * page header, where hand-placed divs stop being precise and start being
 * approximate. Everything is `currentColor`, so one emblem works on the card's
 * gray plate and on the role page's ink header with no variant.
 *
 * ! Achromatic, like every other mark on this site. There is no brand hue.
 *
 * The set is a FAMILY, not a pile of icons: each one is a precise optical or
 * mechanical plate built from the same primitives (a ring, a frame, ticks, a
 * hub), so a role we have not written yet still looks like it belongs. Roles
 * map by slug; anything unmapped falls back deterministically rather than
 * rendering nothing, so a new listing is never emblem-less.
 */

export type RoleEmblemKind = "reel" | "open" | "grid";

/** Slug → emblem. A new role adds a line here, or inherits the hash fallback. */
const BY_SLUG: Record<string, RoleEmblemKind> = {
  "reels-engineer": "reel",
  general: "open",
};

/**
 * ★ NEUTRAL kinds only, which is what makes the fallback SAFE (tightened at the
 * careers merge, 2026-08-29). The hash originally drew from all three, so a
 * listing nobody had written an emblem for could inherit `reel` (the graphics
 * role's own mark) or `open` (the empty slide mount, which literally means "the
 * catch-all"). An emblem that asserts the wrong thing is worse than a generic
 * one. The album plate claims nothing, so it is the only member today; when the
 * family grows, add its neutral plates here and the hash starts doing real work
 * again. Pinned by role-emblem.test.ts.
 */
const NEUTRAL_KINDS: RoleEmblemKind[] = ["grid"];

/** Deterministic fallback (integer ops only: this renders on the server and
 *  again at hydration, and must agree bit for bit - never Math.random()). */
function fallbackKind(slug: string): RoleEmblemKind {
  let h = 0;
  for (let i = 0; i < slug.length; i++)
    h = (h * 31 + slug.charCodeAt(i)) % 9973;
  return NEUTRAL_KINDS[h % NEUTRAL_KINDS.length];
}

export function roleEmblemKind(slug: string): RoleEmblemKind {
  return BY_SLUG[slug] ?? fallbackKind(slug);
}

function Art({ kind }: { kind: RoleEmblemKind }) {
  switch (kind) {
    case "reel":
      // A film reel head-on: the ring, the hub, five holes, and the tick marks
      // of a measured plate. Deliberately NOT an aperture - that is the
      // wordmark's shape and this must not read as the logo.
      return (
        <>
          <circle
            cx="48"
            cy="48"
            r="34"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle
            cx="48"
            cy="48"
            r="27"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.4"
          />
          <circle cx="48" cy="48" r="5" fill="currentColor" />
          {[0, 72, 144, 216, 288].map((deg) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            return (
              <circle
                key={deg}
                cx={48 + Math.cos(rad) * 18}
                cy={48 + Math.sin(rad) * 18}
                r="4.6"
                stroke="currentColor"
                strokeWidth="1.6"
              />
            );
          })}
          {[0, 90, 180, 270].map((deg) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            return (
              <line
                key={deg}
                x1={48 + Math.cos(rad) * 39}
                y1={48 + Math.sin(rad) * 39}
                x2={48 + Math.cos(rad) * 44}
                y2={48 + Math.sin(rad) * 44}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.55"
              />
            );
          })}
        </>
      );
    case "open":
      // An empty slide mount: the frame is here, the picture is not yet. The
      // catch-all's whole proposition, drawn.
      return (
        <>
          <rect
            x="14"
            y="14"
            width="68"
            height="68"
            rx="7"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect
            x="26"
            y="26"
            width="44"
            height="44"
            rx="4"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.4"
          />
          <line
            x1="48"
            y1="38"
            x2="48"
            y2="58"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <line
            x1="38"
            y1="48"
            x2="58"
            y2="48"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </>
      );
    case "grid":
      // The album plate: the house's own grid, at emblem scale.
      return (
        <>
          <rect
            x="14"
            y="14"
            width="68"
            height="68"
            rx="7"
            stroke="currentColor"
            strokeWidth="2"
          />
          {[0, 1, 2].map((row) =>
            [0, 1, 2].map((col) => {
              const filled = (row + col) % 2 === 0;
              return (
                <rect
                  key={`${row}-${col}`}
                  x={26 + col * 16}
                  y={26 + row * 16}
                  width="12"
                  height="12"
                  rx="2.5"
                  fill="currentColor"
                  opacity={filled ? 1 : 0.25}
                />
              );
            }),
          )}
        </>
      );
  }
}

/**
 * The emblem in its plate. `data-role-emblem` is the morph hook: the delegate
 * names exactly one of these at a time (see role-morph.tsx), so the mark
 * appears to travel from the card into the role page's header.
 */
export function RoleEmblem({
  slug,
  size = "card",
  target = false,
  className,
}: {
  slug: string;
  /** "card" = the listing's mark; "header" = the role page's avatar. */
  size?: "card" | "header";
  /** Mark this as the role page's own emblem, the morph's landing spot. */
  target?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      data-role-emblem={target ? "target" : ""}
      className={cn(
        // A slide-mount plate: hairline, faint fill, and a second inset ring
        // via ring-offset so it reads as a mounted object rather than a box.
        // All current-color, so one treatment serves the ink header and the
        // gray card without a variant.
        "grid shrink-0 place-items-center rounded-sm border border-current/20 bg-current/[0.07] ring-1 ring-current/[0.06] ring-offset-1 ring-offset-transparent",
        size === "header" ? "size-20 sm:size-24" : "size-11",
        className,
      )}
    >
      <svg
        viewBox="0 0 96 96"
        fill="none"
        className={size === "header" ? "size-14 sm:size-16" : "size-7"}
      >
        <Art kind={roleEmblemKind(slug)} />
      </svg>
    </span>
  );
}
