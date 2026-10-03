import "./demo-framing.css";

import type { CSSProperties } from "react";

import { marketingImage } from "@/lib/constants/marketing-media";

import { linkOf } from "./fixtures";

import {
  CELLS_BY_RING,
  DOT_R,
  HEART_R,
  INK,
  matrixOf,
  MID,
  MODULES,
  RINGS,
} from "./qr";

/**
 * EACH ADDRESS ITS OWN CODE, DRAWN AS A DESIGNED THING (his round three note:
 * "the QR itself looks pretty bad"). What a code encodes is the address
 * standing beside it, `https://partyreel.com/e/<slug>`, so a new address is a
 * new code and the code a visitor scans is always the link they are reading.
 * Every address the demo prints is reserved to it (the wiring's, with the
 * demo's seed), so any code caught off the hero will open the demo; until
 * then a scan lands on the link's own not-found door.
 *
 * ★ THE PRODUCT'S OWN DESIGNED CODE, NOT A NEW ONE: dots for the data and
 * rounded eyes, the in-app designer's `dots` preset (`qr-presets.ts`: dark
 * modules on white, error correction Q), plus the party's own picture at its
 * heart, which the share studio would print the same way. The picture costs
 * the code no scan: Q recovers a quarter of its words and the heart (with the
 * white kept round it) covers about a twentieth of its modules. Proved by decoding the drawn code, not by
 * arithmetic: Chrome's own `BarcodeDetector` reads every address on the board
 * with its heart in place, at a phone's size (the caption says so per frame).
 *
 * ★ ONE GRID FOR EVERY ADDRESS. Every code is version 4 (33 modules), fixed
 * rather than fitted, so the eyes, the timing and the heart stand still while
 * an address changes and only the data dots move: a new code blooms out of
 * the old one's place instead of the whole code re-gridding under a key.
 *
 * ★ IT IS REWRITTEN, NEVER EMPTIED (round five: round four folded it into its
 * heart while the next address typed, and the empty tile read as a code still
 * loading). The code stands whole, the party standing, while the next address
 * is typed; as it lands the new party's picture beats at the heart and the
 * dots that differ turn, in a ripple out from it, ring by ring, as the album
 * leaves at lightspeed. The loop sets a few attributes a landing
 * (`showCode`), and the board's sheet (`demo-framing.css`) runs every dot;
 * reduced motion and a paused frame draw the standing code still.
 */

/**
 * One eye, as the `dots` preset draws a corner: a ring and a round pupil, so
 * the whole code is circles. A scanner finds an eye by its proportions along
 * a line (1:1:3:1:1), which a ring of one module and a pupil of three keep.
 */
function Eye({ r, c }: { r: number; c: number }) {
  return (
    <>
      <circle
        data-df-eye=""
        cx={c + 3.5}
        cy={r + 3.5}
        r={3}
        fill="none"
        stroke={INK}
        strokeWidth={1}
      />
      <circle data-df-eye="" cx={c + 3.5} cy={r + 3.5} r={1.5} fill={INK} />
    </>
  );
}

/**
 * THE CODE, LIVE. Rendered once with the address it opens on (the demo's own:
 * what a first paint, a crawler and reduced motion see), then redrawn by the
 * hero's loop through `showCode`, never by React, so a turn costs two
 * attribute writes and a pass over the dots that change.
 */
export function LiveCode({
  slug,
  photo,
  motion = true,
  className,
  style,
}: {
  slug: string;
  /** The heart's picture: a `marketing-media.ts` id. */
  photo: string;
  /** Run the bloom (a specimen or reduced motion draws it still). */
  motion?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const value = linkOf(slug);
  const m = matrixOf(value);
  const clip = `df-heart-${slug}`;
  return (
    <svg
      viewBox={`0 0 ${MODULES} ${MODULES}`}
      aria-hidden
      focusable="false"
      data-df-live=""
      data-df-code={value}
      data-df-modules={MODULES}
      data-df-open=""
      data-df-dir="out"
      data-df-motion={motion ? "" : undefined}
      className={className}
      style={
        {
          display: "block",
          overflow: "visible",
          "--rings": RINGS,
          ...style,
        } as CSSProperties
      }
    >
      {CELLS_BY_RING.map((ring, k) => (
        <g key={k} style={{ "--ring": k } as CSSProperties} fill={INK}>
          {ring.map((cell) => (
            <circle
              key={cell.i}
              data-i={cell.i}
              data-on={m[cell.i] ? "" : undefined}
              cx={cell.x}
              cy={cell.y}
              r={DOT_R}
            />
          ))}
        </g>
      ))}
      <Eye r={0} c={0} />
      <Eye r={0} c={MODULES - 7} />
      <Eye r={MODULES - 7} c={0} />
      <defs>
        <clipPath id={clip}>
          <circle cx={MID} cy={MID} r={HEART_R} />
        </clipPath>
      </defs>
      <g data-df-heart="">
        <image
          data-df-heart-photo={photo}
          href={marketingImage(photo).src}
          x={MID - HEART_R}
          y={MID - HEART_R}
          width={HEART_R * 2}
          height={HEART_R * 2}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clip})`}
        />
        <circle
          cx={MID}
          cy={MID}
          r={HEART_R}
          fill="none"
          stroke="rgb(0 0 0 / 0.08)"
          strokeWidth={0.12}
        />
      </g>
    </svg>
  );
}

/** Every dot of a live code, found once per element. */
const DOTS = new WeakMap<SVGSVGElement, SVGCircleElement[]>();

function dotsOf(svg: SVGSVGElement): SVGCircleElement[] {
  let dots = DOTS.get(svg);
  if (!dots) {
    dots = [];
    for (const el of svg.querySelectorAll<SVGCircleElement>("circle[data-i]"))
      dots[Number(el.dataset.i)] = el;
    DOTS.set(svg, dots);
  }
  return dots;
}

/**
 * Rewrite a live code to an address: the dots that differ turn in a ripple
 * out from its heart, centre first, and the heart beats as `photo` swaps its
 * picture. `null` folds it into its heart, edge first (no hero does now; the
 * sheet keeps the fold for a code that has nothing to say). Idempotent: a
 * code already showing the value is not touched, so the loop may call it
 * every frame.
 */
export function showCode(
  svg: SVGSVGElement,
  slug: string | null,
  photo?: string,
): void {
  const value = slug === null ? "" : linkOf(slug);
  if (svg.getAttribute("data-df-code") === value) return;
  svg.setAttribute("data-df-code", value);
  // The heart's beat: two names for one keyframe, so each rewrite restarts it.
  if (slug !== null)
    svg.setAttribute(
      "data-df-beat",
      svg.getAttribute("data-df-beat") === "a" ? "b" : "a",
    );
  svg.setAttribute("data-df-dir", slug === null ? "in" : "out");
  if (slug === null) svg.removeAttribute("data-df-open");
  else {
    if (photo) {
      const img = svg.querySelector<SVGImageElement>("[data-df-heart-photo]");
      if (img && img.dataset.dfHeartPhoto !== photo) {
        img.dataset.dfHeartPhoto = photo;
        img.setAttribute("href", marketingImage(photo).src);
      }
    }
    svg.setAttribute("data-df-open", "");
  }
  const m = slug === null ? null : matrixOf(value);
  const dots = dotsOf(svg);
  for (let i = 0; i < dots.length; i++) {
    const el = dots[i];
    if (!el) continue;
    const on = m ? m[i] === 1 : false;
    if (on !== el.hasAttribute("data-on")) {
      if (on) el.setAttribute("data-on", "");
      else el.removeAttribute("data-on");
    }
  }
}

/* ── reading a code off the screen ─────────────────────────────────────── */

type Detector = {
  detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]>;
};

const DECODED = new Map<string, string>();

/**
 * WHAT THE DRAWN CODE SAYS WHEN A CAMERA READS IT: the svg as it stands,
 * rasterised at its own on-screen size on a white quiet zone, read by the
 * browser's own `BarcodeDetector`. Asynchronous, so the first call starts the
 * read and answers null; the caption's later timers find the answer. A
 * browser with no detector answers "unread", never a claim it did not test.
 */
export function decodedOf(svg: SVGSVGElement, win: Window): string | null {
  const value = svg.getAttribute("data-df-code") ?? "";
  const px = Math.round(svg.getBoundingClientRect().width);
  const key = `${value}@${px}`;
  const hit = DECODED.get(key);
  // An empty answer is a read still running: not settled yet.
  if (hit !== undefined) return hit === "" ? null : hit;
  const Ctor = (
    win as Window & { BarcodeDetector?: new (o: unknown) => Detector }
  ).BarcodeDetector;
  if (!Ctor || !value || px < 8) {
    DECODED.set(key, "unread");
    return "unread";
  }
  DECODED.set(key, "");
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(px));
  clone.setAttribute("height", String(px));
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  // The sheet that scales a dot in or out does not travel with the markup, so
  // the clone keeps only the dots that stand. And an <image> inside an svg
  // drawn as an image is never fetched, so the heart goes too: the reader
  // sees white where the picture is, which is the harder case for it.
  for (const dot of clone.querySelectorAll("circle[data-i]:not([data-on])"))
    dot.remove();
  clone.querySelector("[data-df-heart]")?.remove();
  const markup = new XMLSerializer().serializeToString(clone);
  const img = new (win as Window & typeof globalThis).Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  img
    .decode()
    .then(async () => {
      const pad = Math.round(px * 0.16);
      const canvas = win.document.createElement("canvas");
      canvas.width = px + pad * 2;
      canvas.height = px + pad * 2;
      const g = canvas.getContext("2d");
      if (!g) throw new Error("no canvas");
      g.fillStyle = "#fff";
      g.fillRect(0, 0, canvas.width, canvas.height);
      g.drawImage(img, pad, pad, px, px);
      const found = await new Ctor({ formats: ["qr_code"] }).detect(canvas);
      DECODED.set(key, found[0]?.rawValue ?? "nothing");
    })
    .catch(() => DECODED.set(key, "unread"));
  return null;
}
