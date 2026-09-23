/**
 * ★ THE NUMBER THAT DECIDES WHETHER A CODE SCANS IS THE MODULE, NOT THE CODE.
 *
 * Promoted out of the `first-event` board's frame (`sandbox/first-event/frame.tsx`,
 * where every caption on the board reported the real one) at the board's
 * retirement, because the print stock needs the same arithmetic in production
 * and a second copy of it would drift the moment a preset's error correction
 * changes.
 *
 * Two geometries, because the product has two renderers and they reserve their
 * quiet zones differently:
 *
 *  - `StyledQr` (every code on a SCREEN) reserves `round(size * 0.1)` per side
 *    INSIDE the box it is given, so the data spends `size - 2 * margin`.
 *  - `FooterQr` (the zero-JS server renderer the paper uses) bakes a 4-module
 *    quiet zone into the viewBox, so a code drawn at `size` covers
 *    `moduleCount + 8` units and every unit is the same length.
 *
 * The module count itself comes from the LENGTH of the encoded URL and the
 * preset's error-correction level (M for classic and bold, Q for rounded and
 * dots: `qr-presets.ts`), which is why this takes the real value rather than a
 * count: a custom slug and a token are different codes.
 *
 * Pure module (`qrcode-generator` is DOM-free), so both floors are Vitest-pinnable.
 */
import qrcode from "qrcode-generator";

import { QR_PRESETS, type QrStyleKey } from "@/lib/constants/qr-presets";

/** The quiet zone `FooterQr` bakes into its viewBox, in modules, per side. */
export const FOOTER_QR_QUIET_ZONE = 4;

/**
 * What a phone camera needs off a SCREEN, in CSS px per module. The river's
 * plate (`shared/river/qr-plate.tsx`, `QR_MODULE_FLOOR_PX`) computes its size to
 * meet this; every other plate in the product is a fixed pixel number and meets
 * it by arithmetic, which is what the tests below check.
 */
export const MODULE_FLOOR_PX = 3;

/**
 * What a phone camera needs off PAPER, in millimetres per module.
 *
 * ★ IT IS NOT THE SCREEN FLOOR IN DISGUISE. 3 CSS px is ~0.79 mm, and paper is
 * both more forgiving (no backlight, no moire against a pixel grid, no glare
 * off a phone held over a phone) and less (ink spread on a domestic inkjet).
 * 0.5 mm is the conventional print minimum for a mid-range camera at arm's
 * length; every piece this product prints clears it with room to spare, and the
 * test says by how much rather than merely that it passes — a piece that only
 * just clears is a piece that stops scanning on the first cheap printer.
 */
export const MODULE_FLOOR_MM = 0.5;

/** Modules across one edge of the code itself, quiet zone EXCLUDED. */
export function qrModuleCount(value: string, style: QrStyleKey): number {
  const code = qrcode(
    0,
    QR_PRESETS[style].options.qrOptions.errorCorrectionLevel,
  );
  code.addData(value);
  code.make();
  return code.getModuleCount();
}

/**
 * The module edge of a code `StyledQr` drew at `size` CSS px. Compare against
 * `MODULE_FLOOR_PX`.
 */
export function modulePx(
  size: number,
  value: string,
  style: QrStyleKey,
): number {
  const margin = Math.round(size * 0.1);
  return (size - margin * 2) / qrModuleCount(value, style);
}

/**
 * The module edge, in millimetres, of a code `FooterQr` drew at `sizeMm`
 * millimetres (the quiet zone is inside that measurement, as it is inside the
 * viewBox). Compare against `MODULE_FLOOR_MM`.
 */
export function moduleMm(
  sizeMm: number,
  value: string,
  style: QrStyleKey,
): number {
  return sizeMm / (qrModuleCount(value, style) + FOOTER_QR_QUIET_ZONE * 2);
}
