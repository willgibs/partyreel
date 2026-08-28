import qrcode from "qrcode-generator";

import { cn } from "@/lib/utils";

/**
 * THE FOOTER QR (the ink slab's signature object).
 *
 * SERVER-RENDERED, deliberately. The app's other QRs ride StyledQr, which is a
 * client island that dynamic-imports qr-code-styling inside an effect. That is
 * right for the host's QR designer (the value changes, and it needs .download()),
 * but wrong here: the footer's value is a build-time constant, so a client island
 * would fetch and parse a chunk after hydration on ~50 statically prerendered
 * routes just to paint a below-the-fold graphic. qrcode-generator is DOM-free
 * (verified: zero document/window references), so the matrix is computed during
 * the server render and the markup ships inert. Net client JS: zero.
 *
 * One <path> of 1-unit squares rather than a <rect> per module: a 33-module code
 * is up to ~1000 dark modules, and a thousand extra DOM nodes in the footer of
 * every page is a real cost for identical pixels. crispEdges kills the seams
 * antialiasing would otherwise leave between adjacent squares.
 *
 * The 4-module quiet zone is baked INTO the viewBox (the spec minimum) so the
 * code stays scannable no matter what padding a caller puts around the plate.
 * White plate is the scanner-contrast exception the LiveQr/DemoTicket precedent
 * already set, not a palette choice: it is the one bright object on the slab.
 * Error correction "M" (15%) at 33 modules gives ~4.1px per module at the
 * default size, comfortably above the ~3px screen-scanning floor.
 *
 * Renders the plate only. It is aria-hidden and carries no link: FooterDemo
 * wraps it so one accessible name covers the whole object (QR + photo stack),
 * the live-qr.tsx precedent.
 */

/** Quiet zone in modules. The QR spec minimum; do not lower it. */
const QUIET_ZONE = 4;

export function FooterQr({
  value,
  size = 128,
  className,
}: {
  /** What the code encodes. */
  value: string;
  /** Rendered edge length in px, quiet zone included. */
  size?: number;
  className?: string;
}) {
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();

  const count = qr.getModuleCount();
  const span = count + QUIET_ZONE * 2;

  let d = "";
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) {
        d += `M${col + QUIET_ZONE},${row + QUIET_ZONE}h1v1h-1z`;
      }
    }
  }

  return (
    <span
      className={cn(
        "inline-flex rounded-[var(--radius-tile)] bg-white p-2",
        className,
      )}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${span} ${span}`}
        shapeRendering="crispEdges"
        aria-hidden
        focusable="false"
      >
        {/* The quiet zone made real: scanners need the light border, and the
            plate's padding alone cannot be trusted to survive a layout change. */}
        <rect width={span} height={span} fill="#fff" />
        <path d={d} fill="#000" />
      </svg>
    </span>
  );
}
