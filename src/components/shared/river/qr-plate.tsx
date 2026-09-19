// The river's own sheet, which carries `.rvr-plate` too: the plate is one of
// the flow's parts, and a placement may mount it without the stream (the
// Library draws the code alone on the door's ink), so it imports its own
// styles rather than borrowing the ones river.tsx happens to have loaded.
import "./river.css";

import qrcode from "qrcode-generator";
import type { CSSProperties } from "react";

import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { cn } from "@/lib/utils";

/**
 * THE CODE THE RIVER POURS OUT OF: a real scannable QR on its white plate,
 * standing in a media-forward card with the flow falling out from under it.
 *
 * Will ruled the pair on river-card round one (2026-09-19): `place=tenth` ("41
 * px from the top of the tall door at 1440, three times the air you saw, and
 * the most door left for the photographs to fall through"), `code=in` ("The
 * album pours out of the real scannable code, so the picture is also a way into
 * the demo"), and no label at all ("Think of this more as an Easter egg in our
 * design"). The stream itself is the shared `River` at this module's `origin`;
 * this is only the object it is born from.
 *
 * ★ SERVER-RENDERED, and that is why it is its own component rather than a
 * layer inside the river. `FooterQr` computes the matrix during the server
 * render and ships inert markup (zero client JS); folded into the flow's
 * client island it would drag `qrcode-generator` into the browser on
 * /features and all six feature pages for pixels that never change. The two
 * are siblings inside the door instead, which is also what puts them on the
 * right LAYERS: the flow runs between the door's two scrims, and the plate
 * rises over everything, because a scrim over a white plate greys it into
 * exactly the square a short value exists to avoid.
 *
 * ★ NO LINK, NO LABEL, NOTHING FOCUSABLE. The door is already one link, and a
 * second tap target inside it is two names for one destination. Decorative to
 * assistive tech; the code is for a camera.
 */

/* ── The shares ── */

/**
 * ★ EVERY LENGTH IS A FRACTION OF THE DOOR'S WIDTH, exactly as the river's own
 * arithmetic is, so the plate, the birth point and the flow agree at any width
 * with nothing measured and no resize listener. The lab's board took the door's
 * box in px off a ResizeObserver; production cannot afford the blank card that
 * buys, because the rest state has to be in the server's own HTML.
 */
export const QR_CODE_SHARE = 0.3;
/** The plate's padding around the code, per side. */
export const QR_PLATE_PAD_SHARE = 0.03;
/** The whole plate: the code plus its padding on both sides. */
export const QR_PLATE_SHARE = QR_CODE_SHARE + 2 * QR_PLATE_PAD_SHARE;

/** FooterQr's quiet zone, in modules per side (its own constant, the spec's
 *  minimum, mirrored here because the module count is what sizes the plate). */
const QUIET_ZONE_MODULES = 4;

/** The px a module needs to survive a phone camera reading it off a screen
 *  (footer-qr.tsx). Below this the code is a grey square. */
export const QR_MODULE_FLOOR_PX = 3;

/** How far down the door the plate's TOP edge sits: a tenth of the door's
 *  height (Will's `place=tenth`), in widths. */
const QR_PLATE_TOP_SHARE = 0.1;

/**
 * What the copy block and its air need at the foot of the door, in widths.
 * A door too short to give the plate this much is one the plate would sit on
 * the words of, so the height collapses to the top of the picture rather than
 * overlapping them. The QR door is 4:5 everywhere it ships (Will's
 * `short=tall`), where the clamp never bites; it exists for the shapes the
 * component still accepts.
 */
const QR_COPY_RESERVE_SHARE = 0.45;
const QR_TOP_AIR_SHARE = 0.02;

/**
 * ★ THE SCAN FLOOR IS MEASURED OFF THE VALUE and never typed: FooterQr draws
 * the quiet zone INSIDE its box, so a module gets size / span, not size /
 * count. `https://partyreel.com/demo` is 25 modules, span 33, a 99 px floor;
 * the demo event's full link is 33 modules, span 41, and 123.
 */
export function qrSpanOf(value: string) {
  const code = qrcode(0, "M");
  code.addData(value);
  code.make();
  return code.getModuleCount() + QUIET_ZONE_MODULES * 2;
}

/**
 * ★ THE FLOOR IS ENFORCED ON THE PLATE, NOT ON THE CODE, and that is what makes
 * the whole object one CSS `max()` with no measurement. The plate is
 * border-box and its padding is a share of the DOOR, so the code's rendered
 * edge is `max(1.2F, 0.36w) - 0.06w`, which is at least `F` at every width:
 * below the crossover (w = 10F/3) it is `1.2F - 0.06w >= F`, and above it is
 * `0.3w > F`. The two meet exactly at the hub's own door, where the code is
 * the 99 px Will ruled.
 */
export const qrPlateFloorPx = (value: string) =>
  Math.ceil(
    (qrSpanOf(value) * QR_MODULE_FLOOR_PX * QR_PLATE_SHARE) / QR_CODE_SHARE,
  );

/** Where the plate's top edge sits, in widths from the door's top. */
export function qrPlateTop(ratio: number) {
  const room = ratio - QR_PLATE_SHARE - QR_COPY_RESERVE_SHARE;
  return Math.max(QR_TOP_AIR_SHARE, Math.min(QR_PLATE_TOP_SHARE * ratio, room));
}

/**
 * Where the flow is born: the code's own centre, so every frame starts inside
 * the plate and slides out from under it (`River`'s `origin`, in widths).
 */
export const qrRiverOrigin = (ratio: number) =>
  qrPlateTop(ratio) + QR_PLATE_SHARE / 2;

/* ── The object ── */

/**
 * The size handed to FooterQr is NOMINAL: its svg carries a square viewBox, so
 * the sheet below scales it to the plate's content box and the markup ships one
 * copy at any size. It is the board's number, kept so a stray unstyled render
 * is still the right shape.
 */
const NOMINAL_PX = 132;

export function QrRiverPlate({
  ratio,
  value,
  className,
}: {
  /** The door's height over its width: the plate reads its own height off it. */
  ratio: number;
  /** What the code encodes. Its module count sets the plate's floor. */
  value: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("absolute inset-x-0 z-10 flex justify-center", className)}
      style={{ top: `${((qrPlateTop(ratio) / ratio) * 100).toFixed(3)}%` }}
    >
      <span
        className={cn(
          "rvr-plate",
          // The door's own press and hover reach it through the link's `group`,
          // exactly as they reached the plate this replaces.
          "transition-transform duration-500 ease-emphasis group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100",
        )}
        // ★ CUSTOM PROPERTIES, NOT `width` AND `padding` DIRECTLY. React writes
        // an inline style through the CSSOM, and a parser that does not know
        // `max()` DROPS the declaration rather than keeping the text: the
        // browsers all take it, jsdom does not, so the one length the scan
        // floor lives in would be missing in exactly the place a test looks
        // for it. A custom property is always kept verbatim, and the sheet
        // (`.rvr-plate`) is where the rest of the river's geometry lives
        // anyway.
        style={
          {
            "--rvr-qr-plate": `max(${qrPlateFloorPx(value)}px, ${(QR_PLATE_SHARE * 100).toFixed(3)}%)`,
            "--rvr-qr-pad": `${(QR_PLATE_PAD_SHARE * 100).toFixed(3)}%`,
          } as CSSProperties
        }
      >
        <FooterQr
          value={value}
          size={NOMINAL_PX}
          className="w-full p-0 [&>svg]:h-auto [&>svg]:w-full"
        />
      </span>
    </span>
  );
}
