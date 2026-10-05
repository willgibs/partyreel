"use client";

import { type CSSProperties, useMemo } from "react";
import qrcode from "qrcode-generator";

import {
  background,
  blendMode,
  css,
  type Lch,
  orbFor,
} from "@/lib/avatar/gradient";
import {
  MARKETING_IMAGES,
  MARKETING_REELS,
  marketingImage,
} from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

/**
 * WHAT EVERY DECK DRAWS WITH, BESIDES ITS OWN DRAWINGS: the photographs, the
 * reels, the seeded colour and a scannable code, so three agency teams never
 * build three copies of the same plumbing.
 *
 * ★ THE PHOTOGRAPHS ARE THE BOOTSTRAP TWELVE (`MARKETING_IMAGES`), the real
 * party stills every board reuses: served from the repo, so the alias draws
 * exactly what a local tree does, and no new asset or rights to track. The
 * fixtures folder the brief names is landscapes and lives outside git, so
 * nothing here can lean on it. The stills are 900 px wide at most: a slide
 * that spreads one across 1440 is soft, which is an asset ask, not a defect.
 */

export type PhotoId =
  | "wedding-golden"
  | "reception-table"
  | "party-balloons"
  | "concert-confetti"
  | "wedding-rings"
  | "reception-hall"
  | "party-dj"
  | "wedding-toast"
  | "festival-lights"
  | "festival-crowd"
  | "wedding-arch"
  | "wedding-petals";

/** Every still, in the manifest's order, for a deck that needs a run of them. */
export const PHOTO_IDS = MARKETING_IMAGES.map((m) => m.id) as PhotoId[];

/** What a still shows, for a caption or an alt. */
export const photoSubject = (id: PhotoId): string => marketingImage(id).subject;

/**
 * ONE PHOTOGRAPH, cover-cropped to whatever box the drawing gives it. `focus`
 * is the crop's anchor (CSS `object-position`), since a wedding cropped to a
 * phone's column wants its couple, not its sky.
 */
export function Photo({
  id,
  className,
  style,
  focus,
  alt,
}: {
  id: PhotoId;
  className?: string;
  style?: CSSProperties;
  focus?: string;
  alt?: string;
}) {
  const m = marketingImage(id);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a bootstrap still drawn inside a lab frame
    <img
      src={m.src}
      alt={alt ?? m.subject}
      width={m.width}
      height={m.height}
      draggable={false}
      className={cn("block size-full object-cover", className)}
      style={{ objectPosition: focus, ...style }}
    />
  );
}

export type ReelId = "hero-candidate-01" | "hero-candidate-02";

/**
 * A RENDERED REEL, the two recorded loops (portrait 01, landscape 02). It
 * plays muted and looped; under reduced motion it stands still on its poster,
 * which the `autoPlay` guard decides in the frame's own window.
 */
export function Reel({
  id,
  className,
  style,
  still = false,
}: {
  id: ReelId;
  className?: string;
  style?: CSSProperties;
  /** Draw the poster only: a reel that should not move on this slide. */
  still?: boolean;
}) {
  const r = MARKETING_REELS.find((x) => x.id === id) ?? MARKETING_REELS[0];
  if (still)
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a reel's poster drawn inside a lab frame
      <img
        src={r.poster}
        alt=""
        draggable={false}
        className={cn("block size-full object-cover", className)}
        style={style}
      />
    );
  return (
    <video
      src={r.src}
      poster={r.poster}
      muted
      loop
      playsInline
      autoPlay
      preload="metadata"
      className={cn("block size-full object-cover", className)}
      style={style}
      ref={(v) => {
        // The frame's own window decides: reduced motion keeps the poster.
        const win = v?.ownerDocument.defaultView;
        if (v && win?.matchMedia("(prefers-reduced-motion: reduce)").matches)
          v.pause();
      }}
    />
  );
}

/**
 * THE SEEDED COLOUR AT ANY SIZE: production's own hashvatar (`mesh`, one hue
 * at several depths, `src/lib/avatar/gradient.ts`), painted on a box. The seed
 * is a fixture string here; in production it is always `seedFor(id)`, never a
 * name or an email. Round by default (an orb); pass `shape="field"` for a wash
 * that fills its box (a backdrop, a card's ground).
 */
export function Seeded({
  seed,
  shape = "orb",
  className,
  style,
  children,
}: {
  seed: string;
  shape?: "orb" | "field";
  className?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}) {
  const orb = useMemo(() => orbFor(seed), [seed]);
  return (
    <div
      data-bd-seed={seed}
      className={cn(shape === "orb" && "rounded-full", className)}
      style={{
        backgroundImage: background(orb, "mesh"),
        backgroundBlendMode: blendMode("mesh"),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** A seed's colours, for a drawing that composes its own light from them. */
export function seededColors(seed: string): {
  hue: number;
  lit: string;
  body: string;
  deep: string;
  ink: string;
} {
  const o = orbFor(seed);
  const c = (l: Lch) => css(l);
  return {
    hue: o.hue,
    lit: c(o.lit),
    body: c(o.body),
    deep: c(o.deep),
    ink: c(o.ink),
  };
}

/** The guests every deck's fixtures share, so three visions seat the same crowd. */
export const GUESTS = [
  { name: "Maya", seed: "guest-maya-7" },
  { name: "Jay", seed: "guest-jay-12" },
  { name: "Priya", seed: "guest-priya-3" },
  { name: "Theo", seed: "guest-theo-9" },
  { name: "Sam", seed: "guest-sam-21" },
  { name: "Lena", seed: "guest-lena-5" },
  { name: "Omar", seed: "guest-omar-14" },
  { name: "Ines", seed: "guest-ines-2" },
] as const;

/** The event every deck draws: one party, so the three visions are compared on it. */
export const PARTY = {
  name: "Maya & Jay",
  kind: "Wedding",
  date: "Saturday 12 September",
  dateShort: "12.09.26",
  slug: "maya-and-jay",
  url: "partyreel.com/e/maya-and-jay",
  guests: 31,
  photos: 1284,
  host: "Maya",
  seed: "event-maya-and-jay",
  hostSeed: "host-maya-7",
} as const;

/**
 * A REAL, SCANNABLE CODE as a module grid (it encodes the demo-style address
 * above), drawn as squares or dots in `currentColor` unless `color` says
 * otherwise. The quiet zone is the caller's: wrap it in the plate the vision
 * designs. Error correction at Q, so a vision may lay a small mark over its
 * heart (`clear` empties a centred square of modules for it).
 */
export function Qr({
  value = `https://${PARTY.url}`,
  size = 160,
  dots = false,
  color,
  clear = 0,
  className,
}: {
  value?: string;
  size?: number;
  dots?: boolean;
  color?: string;
  /** Modules a side to leave empty at the centre, for a mark. */
  clear?: number;
  className?: string;
}) {
  const { n, on } = useMemo(() => {
    const q = qrcode(0, "Q");
    q.addData(value);
    q.make();
    const count = q.getModuleCount();
    const cells: [number, number][] = [];
    const lo = Math.floor((count - clear) / 2);
    const hi = lo + clear;
    for (let r = 0; r < count; r++)
      for (let c = 0; c < count; c++) {
        if (clear && r >= lo && r < hi && c >= lo && c < hi) continue;
        if (q.isDark(r, c)) cells.push([r, c]);
      }
    return { n: count, on: cells };
  }, [value, clear]);
  return (
    <svg
      viewBox={`0 0 ${n} ${n}`}
      width={size}
      height={size}
      className={className}
      fill={color ?? "currentColor"}
      role="img"
      aria-label={`A code for ${value}`}
      shapeRendering={dots ? undefined : "crispEdges"}
    >
      {on.map(([r, c]) =>
        dots ? (
          <circle key={`${r}-${c}`} cx={c + 0.5} cy={r + 0.5} r={0.43} />
        ) : (
          <rect key={`${r}-${c}`} x={c} y={r} width={1.02} height={1.02} />
        ),
      )}
    </svg>
  );
}
