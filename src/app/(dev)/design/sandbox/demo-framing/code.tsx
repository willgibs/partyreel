import qrcode from "qrcode-generator";
import type { CSSProperties } from "react";

import { SITE_URL } from "@/lib/constants/site";

/**
 * EACH ADDRESS ITS OWN CODE: what the hero's code encodes is the address
 * standing under it, `https://partyreel.com/e/<slug>`, so a new address is a
 * new code (his "bounce in a new QR above the input each time it's updated")
 * and the code a visitor scans is always the link they are reading. Every
 * address the demo prints is reserved to it (the wiring's, with the demo's
 * seed), so any code caught off the hero will open the demo on the phone that
 * scanned it; until then a scan lands on the link's own not-found door.
 *
 * ★ DRAWN AS `footer-qr.tsx` DRAWS ITS CODE: `qrcode-generator` is DOM-free,
 * so the matrix is plain arithmetic in the render, one <path> of unit squares
 * at crispEdges, the four-module quiet zone baked into the viewBox. The plate
 * the code stands on is the quiet zone's own white; the object rounds its
 * corners, which cut only into that margin.
 *
 * ★ A REAL SCAN AT A DESK: an address of this length is a version 3 code, 29
 * modules and 37 with the quiet zone, so at a desk's 128 px each module is
 * 3.5 px, over the 3 px a phone reads off a laptop screen (the demo modal's
 * own floor). The caption reads the size off the frame.
 */

/** The quiet zone, in modules: the spec's minimum (footer-qr.tsx's). */
const QUIET = 4;

/** The code's ink: the paper's own near-black, at a scanner's contrast. */
const INK = "#0b0b0c";

type Matrix = { readonly d: string; readonly modules: number };

const MATRICES = new Map<string, Matrix>();

/** The code for one value, solved once a value. */
function matrixOf(value: string): Matrix {
  const hit = MATRICES.get(value);
  if (hit) return hit;
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();
  const n = qr.getModuleCount();
  let d = "";
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (qr.isDark(r, c)) d += `M${c + QUIET},${r + QUIET}h1v1h-1z`;
  const m = { d, modules: n };
  MATRICES.set(value, m);
  return m;
}

/** What an address's code encodes. */
export const linkOf = (slug: string) => `${SITE_URL}/e/${slug}`;

export function CodeMark({
  slug,
  className,
  style,
}: {
  slug: string;
  className?: string;
  style?: CSSProperties;
}) {
  const value = linkOf(slug);
  const { d, modules } = matrixOf(value);
  const span = modules + QUIET * 2;
  return (
    <svg
      viewBox={`0 0 ${span} ${span}`}
      shapeRendering="crispEdges"
      aria-hidden
      focusable="false"
      data-df-code={value}
      data-df-modules={modules}
      className={className}
      style={{ display: "block", ...style }}
    >
      <rect width={span} height={span} fill="#fff" />
      <path d={d} fill={INK} />
    </svg>
  );
}
