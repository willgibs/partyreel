/**
 * QR style presets — the SINGLE source for the in-app QR designer (Phase 6).
 *
 * The renderer (`styled-qr.tsx`), the picker (`qr-preset-picker.tsx`), and the
 * zod event schema (`validation/event.ts`) all read from here. The chosen key is
 * persisted on `events.qr_style` (a plain text column, NOT a Postgres enum) so
 * the set can grow without a migration; an unknown/legacy value resolves to
 * `classic` in `resolveQrPreset`.
 *
 * SCANNABILITY is the hard constraint, not aesthetics: every preset keeps DARK
 * data modules on a WHITE background. Brand color only ever tints the corner
 * finder patterns (high error tolerance + scanners locate them by shape), never
 * the data — so a styled code still reads. Shape changes that lower the decode
 * margin bump `errorCorrectionLevel` to "Q". Prove a new preset by SCANNING it.
 *
 * `import type` only from qr-code-styling — erased at build, so this stays a
 * client-import-safe, runtime-decoupled constants module.
 */
import type {
  CornerDotType,
  CornerSquareType,
  DotType,
  ErrorCorrectionLevel,
} from "qr-code-styling";

/** The subset of qr-code-styling options a preset controls (assignable to its Options). */
export type QrStyleOptions = {
  dotsOptions: { type: DotType; color: string };
  cornersSquareOptions: { type: CornerSquareType; color: string };
  cornersDotOptions: { type: CornerDotType; color: string };
  backgroundOptions: { color: string };
  qrOptions: { errorCorrectionLevel: ErrorCorrectionLevel };
};

export type QrPreset = {
  key: QrStyleKey;
  label: string;
  description: string;
  options: QrStyleOptions;
};

export const QR_STYLE_KEYS = ["classic", "bold", "rounded", "dots"] as const;
export type QrStyleKey = (typeof QR_STYLE_KEYS)[number];

/** Mirrors the `events.qr_style` DB default; new events render this until changed. */
export const DEFAULT_QR_PRESET: QrStyleKey = "classic";

// Pure black on white is the scanner-safest pairing.
const INK = "#000000";
const PAPER = "#ffffff";
// The legacy coral corner tint, INTENTIONALLY retained under the V1 mono
// system: existing events keep their chosen preset rendering, scanners locate
// corners by SHAPE so the color is decode-safe, and the share studio (ROADMAP)
// redesigns the preset set wholesale. No longer tied to any UI token.
const BRAND = "#FB4817";

export const QR_PRESETS: Record<QrStyleKey, QrPreset> = {
  classic: {
    key: "classic",
    label: "Classic",
    description: "Clean black & white",
    options: {
      dotsOptions: { type: "square", color: INK },
      cornersSquareOptions: { type: "square", color: INK },
      cornersDotOptions: { type: "square", color: INK },
      backgroundOptions: { color: PAPER },
      qrOptions: { errorCorrectionLevel: "M" },
    },
  },
  bold: {
    key: "bold",
    label: "Bold",
    description: "Brand-accent corners",
    options: {
      // Data stays ink (scannable); brand punctuates the corner finders only.
      dotsOptions: { type: "square", color: INK },
      cornersSquareOptions: { type: "square", color: BRAND },
      cornersDotOptions: { type: "square", color: BRAND },
      backgroundOptions: { color: PAPER },
      qrOptions: { errorCorrectionLevel: "M" },
    },
  },
  rounded: {
    key: "rounded",
    label: "Rounded",
    description: "Soft & celebratory",
    options: {
      dotsOptions: { type: "rounded", color: INK },
      cornersSquareOptions: { type: "extra-rounded", color: INK },
      cornersDotOptions: { type: "dot", color: INK },
      backgroundOptions: { color: PAPER },
      qrOptions: { errorCorrectionLevel: "Q" },
    },
  },
  dots: {
    key: "dots",
    label: "Dots",
    description: "Playful dots",
    options: {
      dotsOptions: { type: "dots", color: INK },
      cornersSquareOptions: { type: "dot", color: INK },
      cornersDotOptions: { type: "dot", color: INK },
      backgroundOptions: { color: PAPER },
      qrOptions: { errorCorrectionLevel: "Q" },
    },
  },
};

/** Resolve a stored `qr_style` value (possibly null/legacy/unknown) to its options. */
export function resolveQrPreset(
  key: string | null | undefined,
): QrStyleOptions {
  if (key && key in QR_PRESETS) return QR_PRESETS[key as QrStyleKey].options;
  return QR_PRESETS[DEFAULT_QR_PRESET].options;
}
