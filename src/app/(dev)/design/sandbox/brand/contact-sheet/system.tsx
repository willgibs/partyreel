"use client";

import { type CSSProperties, Fragment, type ReactNode, useId } from "react";

import { seedsFrom } from "@/lib/avatar/gradient";
import { cn } from "@/lib/utils";

import {
  GUESTS,
  PARTY,
  Photo,
  type PhotoId,
  Seeded,
  seededColors,
} from "../deck/media";

/**
 * CONTACT SHEET'S SYSTEM: the palette, the status set and the signature's
 * primitives, so an application is composed from these rather than redrawn.
 *
 * The idea in one line: Partyreel is everyone's roll, developed together. The
 * brand has no colour of its own; it is the print and the paper around it.
 *
 * ★ NO BRAND HUE, AND THE PAPER IS WARM. The chrome is paper and ink (chroma
 * under 0.01), so colour on any screen comes from two sources only: the
 * photographs, and people (the hashvatar). Status is the one chroma the chrome
 * itself ever shows, and it arrives as a mark a hand makes (`Mark`), never a
 * fill, so it cannot be mistaken for a brand that has none.
 *
 * ★ HEX IN THE PAINT, OKLCH IN THE BOOK. The deck's caption measures contrast
 * off computed `rgb()` colours, and a browser reports an `oklch()` colour as
 * `oklch()`, so every ground and every status colour is painted with its exact
 * sRGB equivalent; the oklch value is the source and is what a slide prints.
 */

/* ── the palette ─────────────────────────────────────────────────────────── */

export type Swatch = {
  readonly name: string;
  readonly role: string;
  readonly oklch: string;
  readonly hex: string;
};

/** The grounds and the inks, achromatic and warm. The ratios are WCAG, measured. */
export const GROUND = {
  paper: {
    name: "Paper",
    role: "Every page, the photo book",
    oklch: "oklch(0.972 0.007 82)",
    hex: "#f8f5f1",
  },
  print: {
    name: "Print",
    role: "A print's border, a step whiter",
    oklch: "oklch(0.993 0.004 85)",
    hex: "#fefdfa",
  },
  sheet: {
    name: "Sheet",
    role: "A well under prints",
    oklch: "oklch(0.948 0.009 80)",
    hex: "#f1ede7",
  },
  ink: {
    name: "Ink",
    role: "Type, the edge band, 17.1:1",
    oklch: "oklch(0.185 0.009 62)",
    hex: "#16120f",
  },
  ink2: {
    name: "Ink 2",
    role: "A second line, 7.4:1",
    oklch: "oklch(0.43 0.012 66)",
    hex: "#554f49",
  },
  faint: {
    name: "Faint",
    role: "Captions only, 3.9:1",
    oklch: "oklch(0.585 0.012 70)",
    hex: "#817b74",
  },
  room: {
    name: "Room",
    role: "Where film is projected",
    oklch: "oklch(0.13 0.006 60)",
    hex: "#090705",
  },
  roomInk: {
    name: "Room ink",
    role: "Type in the room, 17.7:1",
    oklch: "oklch(0.955 0.008 82)",
    hex: "#f3f0ea",
  },
  roomMuted: {
    name: "Room 2",
    role: "A second line in the room, 8.7:1",
    oklch: "oklch(0.74 0.012 75)",
    hex: "#afaaa3",
  },
} as const satisfies Record<string, Swatch>;

/** The edge band laid in the room: a strip a step up from the room's black. */
export const BAND_IN_ROOM = "#191512";

export type StatusState = "waiting" | "done" | "failed";
export type MarkKind = "circle" | "open" | "tick" | "cross";

/**
 * THE LAB'S MARKS: a state is a mark and its word. Each has a paper register
 * (4.5:1 and up on paper) and a room register (on the projection's black).
 */
export const STATUS: Record<
  StatusState,
  {
    readonly mark: MarkKind;
    readonly tool: string;
    readonly word: string;
    readonly paper: { oklch: string; hex: string; ratio: string };
    readonly room: { oklch: string; hex: string; ratio: string };
  }
> = {
  // ★ WAITING HAS NO HUE (the creative director's pass): a blue pencil was a
  // hue of its own on the commonest state, on a slide headed "No colour of
  // our own". It is graphite now, an open loop the hand has not closed yet.
  waiting: {
    mark: "open",
    tool: "Graphite pencil",
    word: "Developing",
    paper: { oklch: "oklch(0.47 0.008 70)", hex: "#5e5a56", ratio: "6.3:1" },
    room: { oklch: "oklch(0.78 0.01 75)", hex: "#bbb7b0", ratio: "10.1:1" },
  },
  done: {
    mark: "tick",
    tool: "Green marker",
    word: "In the album",
    paper: { oklch: "oklch(0.52 0.13 152)", hex: "#137d41", ratio: "4.8:1" },
    room: { oklch: "oklch(0.79 0.16 152)", hex: "#5dd786", ratio: "11.0:1" },
  },
  failed: {
    mark: "cross",
    tool: "Red grease pencil",
    word: "Didn't take",
    paper: { oklch: "oklch(0.545 0.2 28)", hex: "#cb2622", ratio: "5.0:1" },
    room: { oklch: "oklch(0.72 0.16 28)", hex: "#f9786a", ratio: "7.6:1" },
  },
};

/** Today's waiting amber, for the slide that retires it (1.7:1 on paper, measured). */
export const OLD_WAITING = { oklch: "oklch(0.8 0.14 80)", hex: "#edb345" };

/* ── small helpers ───────────────────────────────────────────────────────── */

/** An SVG id that survives `url(#…)`: React's own carries characters CSS reads as syntax. */
export function useSvgId(): string {
  return `cs${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
}

/** A custom property in a style object, typed once. */
export const vars = (v: Record<string, string | number>): CSSProperties =>
  v as CSSProperties;

/* ── the edge ────────────────────────────────────────────────────────────── */

/**
 * THE EDGE'S ARROW: the small solid triangle a film stock prints before every
 * frame number, pointing the way the film advances. Drawn, never a glyph, so
 * every face and size agree on it.
 */
export function EdgeArrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 10 12"
      className={cn("cs-arrow", className)}
      aria-hidden
      focusable="false"
    >
      <path d="M0.4 0.6 L9.6 6 L0.4 11.4 Z" fill="currentColor" />
    </svg>
  );
}

/**
 * One item of an edge: a word, or a word with a person's seeded dot (who shot
 * the frame), or a dimmed word (the stock name, which is the quietest thing a
 * film prints).
 */
export type EdgeItem =
  | string
  | { readonly text: string; readonly seed?: string; readonly dim?: boolean };

const itemText = (i: EdgeItem) => (typeof i === "string" ? i : i.text);

/**
 * THE EDGE: the film's edge printing, as Partyreel's signature. A line of
 * Antonio capitals with the arrow between its items, carrying true facts only
 * (the event's code, its name, its date, frame numbers, who shot what).
 *
 * - `band`: knocked out of an ink strip (the rebate), for a hero's foot, the
 *   footer and a contact strip; otherwise the type sits on its ground.
 * - `repeat`: printed again along its length, the way a stock repeats its name
 *   down a roll; the box clips it, so a long band never wraps.
 *
 * ★ NEVER OVER A PHOTOGRAPH, NEVER A SENTENCE, NEVER IN A CONTROL, and one per
 * region of a view: an edge is a caption in the film's voice, and a stack of
 * them reads as a terminal, which is the one thing it must never become.
 */
export function Edge({
  items,
  size = 11,
  band = false,
  repeat = 1,
  height,
  align = "start",
  className,
  style,
  read,
}: {
  items: readonly EdgeItem[];
  /** The type's size in px (10 to 13 is the edge's whole range). */
  size?: number;
  band?: boolean;
  repeat?: number;
  /** A band's height; the type is centred in it. */
  height?: number;
  align?: "start" | "center" | "end";
  className?: string;
  style?: CSSProperties;
  /** Marks the edge for the deck's caption (`data-bd-read`). */
  read?: string;
}) {
  const run: EdgeItem[] = [];
  for (let r = 0; r < repeat; r++) run.push(...items);
  return (
    <div
      className={cn("cs-edge", band && "cs-edge-band", className)}
      style={{
        fontSize: size,
        height: band ? (height ?? Math.round(size * 2.4)) : height,
        justifyContent:
          align === "center"
            ? "center"
            : align === "end"
              ? "flex-end"
              : undefined,
        ...style,
      }}
      aria-label={items.map(itemText).join(", ")}
      data-bd-read={read}
    >
      {run.map((it, i) => {
        const text = itemText(it);
        const seed = typeof it === "string" ? undefined : it.seed;
        const dim = typeof it === "string" ? false : it.dim;
        return (
          <Fragment key={`${i}-${text}`}>
            {i > 0 && <EdgeArrow />}
            <span
              className={cn("cs-edge-item", dim && "cs-edge-dim")}
              aria-hidden
            >
              {seed && <Seeded seed={seed} className="cs-edge-dot" />}
              {text}
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}

/**
 * AN EVENT'S FRAME MARK: a frame number off its seed (12 to 36, most of them
 * an A frame, the half-frame mark that makes an edge read as film), so
 * neighbouring events print different edges. Pure: the same seed always
 * prints the same mark (Maya & Jay's is 25A).
 */
export function edgeCode(seed: string): string {
  const [, n, a] = seedsFrom(`frame:${seed}`, 3);
  return `${12 + Math.floor(n * 25)}${a > 0.35 ? "A" : ""}`;
}

export type EdgeEvent = {
  readonly name: string;
  readonly seed: string;
  /** dd.mm.yy, a range "12.09 ▸ 14.09.26" is two items; undated prints none. */
  readonly date?: string;
};

/**
 * EVERY EVENT HAS ITS OWN EDGE: Partyreel's name, the event's frame mark, its
 * name and its date, then whatever the surface adds (a count, a line). An
 * undated event prints no date rather than a placeholder.
 */
export function eventEdge(
  e: EdgeEvent = { name: PARTY.name, seed: PARTY.seed, date: PARTY.dateShort },
  extra: readonly EdgeItem[] = [],
): EdgeItem[] {
  return [
    { text: "Partyreel", dim: true },
    edgeCode(e.seed),
    e.name,
    ...(e.date ? [e.date] : []),
    ...extra,
  ];
}

/** The event every deck draws, as its edge prints it. */
export const PARTY_EDGE: EdgeItem[] = eventEdge();

/** A few more events, for a host's sheet (a dashboard, an account). */
export const EVENTS: readonly (EdgeEvent & { kind: string })[] = [
  {
    name: PARTY.name,
    seed: PARTY.seed,
    date: PARTY.dateShort,
    kind: "Wedding",
  },
  {
    name: "Theo turns 30",
    seed: "event-theo-30",
    date: "03.10.26",
    kind: "Birthday",
  },
  {
    name: "Lisbon trip",
    seed: "event-lisbon-trip",
    date: "21.10.26",
    kind: "Trip",
  },
  { name: "Studio offsite", seed: "event-offsite-2026", kind: "Conference" },
];

/** Who shot what: a guest by index, for a strip's frame credit. */
export const who = (i: number) => {
  const g = GUESTS[i % GUESTS.length];
  return { name: g.name, seed: g.seed };
};

/* ── the latent image, the develop ──────────────────────────────────────── */

/**
 * THE LATENT IMAGE: on a screen with no media, the hashvatar (production's
 * seeded mesh) is the photograph about to be, with the paper still over it.
 * Seeded per event or per person; never a name or an email as the seed.
 */
export function Latent({
  seed,
  breathe = false,
  veil = 1,
  className,
  style,
}: {
  seed: string;
  /** The veil drifts toward the photograph and back (9 s, motion only). */
  breathe?: boolean;
  /** How much paper is still over it, 0 to 1. */
  veil?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn("cs-latent", className)}
      style={style}
      data-cs-breathe={breathe ? "" : undefined}
      aria-hidden
    >
      <Seeded seed={seed} shape="field" className="absolute inset-0" />
      <div className="cs-latent-veil" style={{ opacity: veil }} />
    </div>
  );
}

/**
 * THE DEVELOP: an image rising from paper white through warm midtones. It
 * plays once as an arrival (or loops, for a specimen); at rest, and under
 * reduced motion, the image is simply developed.
 */
export function Develop({
  children,
  delay = 300,
  duration = 2400,
  loop = false,
  className,
  style,
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  loop?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn("cs-develop absolute inset-0", className)}
      data-cs-loop={loop ? "" : undefined}
      style={{
        ...vars({
          "--cs-dev-delay": `${delay}ms`,
          "--cs-dev-dur": `${duration}ms`,
        }),
        ...style,
      }}
    >
      {children}
      <i className="cs-develop-warm" aria-hidden />
      <i className="cs-develop-paper" aria-hidden />
    </div>
  );
}

/* ── the print ───────────────────────────────────────────────────────────── */

/**
 * A PHOTOGRAPH ALONE SITS AS A PRINT: a border a step whiter than the page, a
 * 2 px corner on the image, the lift under it, and (where it is the event's)
 * its edge printed in the bottom border. The border is even on all four sides
 * (a print, never an instant film's deep chin); the bottom gains only the
 * room its edge needs.
 *
 * The image is a photograph (`photo`), the latent image (`seed`), or children.
 */
export function Print({
  photo,
  seed,
  w,
  ratio = 3 / 2,
  border,
  edge,
  edgeSize,
  tilt = 0,
  flat = false,
  focus,
  develop,
  breathe,
  veil,
  className,
  style,
  children,
  read,
}: {
  photo?: PhotoId;
  seed?: string;
  /** The print's outer width in px. */
  w: number;
  /** The image's width over its height (3:2 a 35 mm frame, 4:5 a phone's portrait). */
  ratio?: number;
  /** The border in px; about 5 percent of the width when absent. */
  border?: number;
  edge?: readonly EdgeItem[];
  edgeSize?: number;
  /** Degrees: a print handed round sits a little turned, never more than 4. */
  tilt?: number;
  /** A hairline instead of the lift, for a print lying flat in a sheet. */
  flat?: boolean;
  focus?: string;
  develop?: boolean | { delay?: number; duration?: number; loop?: boolean };
  breathe?: boolean;
  veil?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  read?: string;
}) {
  const b = border ?? Math.round(Math.min(26, Math.max(7, w * 0.05)));
  const es = edgeSize ?? Math.max(9, Math.min(12, Math.round(b * 0.46)));
  const iw = w - 2 * b;
  const ih = Math.round(iw / ratio);
  const bottom = edge ? Math.max(b, Math.round(es * 2.3)) : b;
  const image = photo ? (
    <Photo id={photo} focus={focus} />
  ) : seed ? (
    <Latent seed={seed} breathe={breathe} veil={veil} />
  ) : (
    children
  );
  return (
    <div
      className={cn("cs-print", flat && "cs-print-flat", className)}
      style={{
        width: w,
        padding: `${b}px ${b}px ${bottom}px`,
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
        ...style,
      }}
      data-bd-read={read}
    >
      <div className="cs-print-image" style={{ width: iw, height: ih }}>
        {develop ? (
          <Develop {...(typeof develop === "object" ? develop : {})}>
            {image}
          </Develop>
        ) : (
          image
        )}
      </div>
      {edge && (
        <Edge
          items={edge}
          size={es}
          style={{
            position: "absolute",
            left: b,
            right: b,
            bottom: Math.round((bottom - es) / 2),
          }}
        />
      )}
    </div>
  );
}

/* ── the contact strip ───────────────────────────────────────────────────── */

export type StripFrame = {
  readonly photo?: PhotoId;
  readonly seed?: string;
  readonly focus?: string;
  /** The frame number its edge prints ("12", "12A"). */
  readonly n: string;
  /** Who shot it: their name and seeded dot ride the frame's edge. */
  readonly who?: { readonly name: string; readonly seed: string };
};

/**
 * A CONTACT STRIP: everyone's frames side by side in the film's ink, the
 * event's edge along the top and each frame's number (and who shot it) along
 * the bottom. A sheet is a stack of these; the album's first rows are one.
 * No sprocket holes, ever: the edge's type is the whole film reference.
 */
export function Strip({
  frames,
  frameW,
  ratio = 3 / 2,
  gap = 6,
  pad = 10,
  top,
  edgeSize = 10,
  develop,
  className,
  style,
}: {
  frames: readonly StripFrame[];
  frameW: number;
  ratio?: number;
  gap?: number;
  pad?: number;
  /** The edge printed along the strip's top (repeated to fill). */
  top?: readonly EdgeItem[];
  edgeSize?: number;
  /** Each frame develops in turn, 140 ms apart. */
  develop?: { delay?: number; duration?: number };
  className?: string;
  style?: CSSProperties;
}) {
  const fh = Math.round(frameW / ratio);
  const rowTop = Math.round(edgeSize * 2.4);
  const rowBottom = Math.round(edgeSize * 2.6);
  const width = pad * 2 + frames.length * frameW + (frames.length - 1) * gap;
  return (
    <div
      className={cn("cs-strip", className)}
      style={{
        width,
        paddingTop: rowTop,
        paddingBottom: rowBottom,
        paddingLeft: pad,
        paddingRight: pad,
        ...style,
      }}
    >
      {top && (
        <Edge
          items={top}
          size={edgeSize}
          repeat={4}
          className="cs-edge-dim"
          style={{
            position: "absolute",
            left: pad,
            right: 0,
            top: Math.round((rowTop - edgeSize) / 2),
          }}
        />
      )}
      <div className="cs-strip-frames" style={{ gap }}>
        {frames.map((f, i) => {
          const image = f.photo ? (
            <Photo id={f.photo} focus={f.focus} />
          ) : f.seed ? (
            <Latent seed={f.seed} />
          ) : null;
          return (
            <div
              key={`${f.n}-${i}`}
              className="cs-strip-frame"
              style={{ width: frameW, height: fh }}
            >
              {develop ? (
                <Develop
                  delay={(develop.delay ?? 200) + i * 140}
                  duration={develop.duration ?? 1800}
                >
                  {image}
                </Develop>
              ) : (
                image
              )}
            </div>
          );
        })}
      </div>
      {frames.map((f, i) => (
        <div
          key={`label-${f.n}-${i}`}
          className="cs-strip-label cs-edge"
          style={{
            fontSize: edgeSize,
            left: pad + i * (frameW + gap),
            width: frameW,
            bottom: Math.round((rowBottom - edgeSize) / 2),
          }}
          aria-label={`Frame ${f.n}${f.who ? `, ${f.who.name}` : ""}`}
        >
          <EdgeArrow />
          <span aria-hidden>{f.n}</span>
          {f.who && (
            <span
              className="cs-edge-item"
              aria-hidden
              style={{ marginLeft: "0.5em" }}
            >
              <Seeded seed={f.who.seed} className="cs-edge-dot" />
              {f.who.name}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── the lab's marks ─────────────────────────────────────────────────────── */

/**
 * The three strokes, drawn by hand in a 48 box: the circle overshoots its own
 * start the way a grease pencil does when a frame is circled in one motion;
 * the tick's second stroke is the long one; the cross's two strokes differ.
 */
const MARK_PATHS: Record<MarkKind, readonly string[]> = {
  circle: [
    "M30.6 8.4C20.6 5.7 8.9 10.5 6.7 21.7C4.6 32.7 13.3 42 24.7 41.7C36.5 41.4 43.7 32.5 42.5 21.9C41.5 12.7 33.3 7.1 22.9 8C19.5 8.3 16.7 9.4 14.4 11",
  ],
  // The loop not yet closed: the pencil stops short of where it began.
  open: [
    "M30.6 8.4C20.6 5.7 8.9 10.5 6.7 21.7C4.6 32.7 13.3 42 24.7 41.7C36.5 41.4 43.7 32.5 42.5 21.9C42.1 18.4 40.8 15.5 38.9 13.2",
  ],
  tick: [
    "M9.4 25.8C12.6 28.5 15.6 32.2 18.9 36.8C23.9 26.4 30.9 16.6 40.8 8.4",
  ],
  cross: [
    "M11.6 10.8C19.7 19.3 27.9 28.6 36.9 38.4",
    "M37.8 10.2C29.5 18.1 20.9 27.4 11 37.8",
  ],
};

/**
 * ONE OF THE LAB'S MARKS, as a grease pencil leaves it (a slight wax at the
 * edge). It draws itself once when it lands (`draw`); the waiting circle keeps
 * circling (`circling`) until the state ends. At rest it is simply drawn.
 */
export function Mark({
  kind,
  size = 28,
  w,
  h,
  color,
  weight = 3.4,
  draw = false,
  circling = false,
  delay,
  rough = true,
  className,
  style,
}: {
  kind: MarkKind;
  size?: number;
  /** A loop drawn round something wider than tall (a frame's number on its
   *  edge): the 48 box stretched to w by h, the stroke kept even. */
  w?: number;
  h?: number;
  /** A STATUS register's hex, or ink for a note in the margin. */
  color?: string;
  /** Stroke width in the 48 box. */
  weight?: number;
  draw?: boolean;
  circling?: boolean;
  /** Milliseconds before it draws. */
  delay?: number;
  /** The wax at the stroke's edge (off below about 18 px, where it is noise). */
  rough?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const id = useSvgId();
  const wax = rough && size >= 18;
  return (
    <svg
      viewBox="0 0 48 48"
      width={w ?? size}
      height={h ?? size}
      preserveAspectRatio={w || h ? "none" : undefined}
      className={cn("cs-mark", className)}
      style={{
        color,
        ...(delay != null ? vars({ "--cs-mark-delay": `${delay}ms` }) : {}),
        ...style,
      }}
      data-cs-draw={draw && !circling ? "" : undefined}
      data-cs-circling={circling ? "" : undefined}
      aria-hidden
      focusable="false"
    >
      {wax && (
        <defs>
          <filter id={`${id}w`} x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves={2}
              seed={7}
              result="n"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="n"
              scale={1.4}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      )}
      <g filter={wax ? `url(#${id}w)` : undefined}>
        {/* Circling: the loop is always there, faint, and the pencil goes
            round it again, so a frame of the animation never reads as a
            broken mark. At rest the pencil's pass is simply complete. */}
        {circling &&
          MARK_PATHS[kind].map((d) => (
            <path
              key={`base-${d}`}
              d={d}
              strokeWidth={
                w || h
                  ? Math.max(
                      1.6,
                      (weight * Math.min(w ?? size, h ?? size)) / 30,
                    )
                  : weight
              }
              vectorEffect={w || h ? "non-scaling-stroke" : undefined}
              className="cs-mark-base"
            />
          ))}
        {MARK_PATHS[kind].map((d) => (
          <path
            key={d}
            d={d}
            pathLength={1}
            strokeWidth={
              w || h
                ? Math.max(1.6, (weight * Math.min(w ?? size, h ?? size)) / 30)
                : weight
            }
            vectorEffect={w || h ? "non-scaling-stroke" : undefined}
            className="cs-mark-pen"
          />
        ))}
      </g>
    </svg>
  );
}

/**
 * A STATE: its mark and its word, in one register. The word carries the
 * contrast the caption measures (`data-bd-contrast`), so a slide never claims
 * a ratio its frame does not show.
 */
export function Status({
  state,
  tone = "paper",
  size = 15,
  word,
  measure,
  className,
  style,
}: {
  state: StatusState;
  tone?: "paper" | "room";
  /** The word's size in px; the mark is drawn at about 1.6 times it. */
  size?: number;
  word?: string;
  /** The caption's name for this claim (`data-bd-contrast`); unmeasured when absent. */
  measure?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const s = STATUS[state];
  const color = s[tone].hex;
  return (
    <span
      className={cn("cs-status", className)}
      style={{ fontSize: size, ...style }}
    >
      <Mark
        kind={s.mark}
        size={Math.round(size * 1.65)}
        color={color}
        draw={state !== "waiting"}
        circling={state === "waiting"}
      />
      <span style={{ color }} data-bd-contrast={measure}>
        {word ?? s.word}
      </span>
    </span>
  );
}

/* ── a phone, for a touchpoint ───────────────────────────────────────────── */

/**
 * A PHONE: a near-black body round a screen of the vision's ground. Sized by
 * width; the corner follows. Children draw the screen (its top 44 px are the
 * status bar's, where the island sits).
 */
export function PhoneShell({
  w = 300,
  h = 620,
  ground = "paper",
  children,
  className,
  style,
}: {
  w?: number;
  h?: number;
  ground?: "paper" | "room";
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const r = Math.round(w * 0.16);
  return (
    <div
      className={cn("cs-phone", className)}
      style={{ width: w, height: h, borderRadius: r, ...style }}
    >
      <div
        className="cs-phone-screen"
        style={{
          borderRadius: r - 7,
          background: ground === "room" ? GROUND.room.hex : GROUND.paper.hex,
          color: ground === "room" ? GROUND.roomInk.hex : GROUND.ink.hex,
        }}
      >
        {children}
      </div>
      <div className="cs-phone-island" aria-hidden />
    </div>
  );
}

/** A seed's body colour, for a drawing that needs one person's light as a value. */
export const bodyOf = (seed: string) => seededColors(seed).body;
