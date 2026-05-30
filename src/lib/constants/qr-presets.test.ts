import { describe, expect, it } from "vitest";

import {
  DEFAULT_QR_PRESET,
  QR_PRESETS,
  QR_STYLE_KEYS,
  resolveQrPreset,
} from "@/lib/constants/qr-presets";
import { createEventSchema } from "@/lib/validation/event";

// The preset KEYS are the contract shared by the renderer, the picker, and the
// zod schema (and persisted in events.qr_style). These guard that the set stays
// internally consistent and in lockstep with the schema enum + DB default.
describe("qr presets", () => {
  it("QR_PRESETS keys are exactly QR_STYLE_KEYS, each tagged with its own key", () => {
    expect(Object.keys(QR_PRESETS).sort()).toEqual([...QR_STYLE_KEYS].sort());
    for (const key of QR_STYLE_KEYS) {
      expect(QR_PRESETS[key].key).toBe(key);
    }
  });

  it("every preset is scanner-safe: opaque colors, white background, ECL ≥ M", () => {
    for (const key of QR_STYLE_KEYS) {
      const { options } = QR_PRESETS[key];
      expect(options.backgroundOptions.color).toBe("#ffffff");
      // 8-digit hex (alpha) would risk translucent modules; require 6-digit.
      expect(options.dotsOptions.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(["M", "Q", "H"]).toContain(options.qrOptions.errorCorrectionLevel);
    }
  });

  it("createEventSchema accepts every key and defaults to classic", () => {
    for (const key of QR_STYLE_KEYS) {
      const parsed = createEventSchema.parse({ name: "Party", qr_style: key });
      expect(parsed.qr_style).toBe(key);
    }
    expect(createEventSchema.parse({ name: "Party" }).qr_style).toBe(
      DEFAULT_QR_PRESET,
    );
    expect(DEFAULT_QR_PRESET).toBe("classic");
  });

  it("resolveQrPreset falls back to classic for null / unknown / legacy values", () => {
    expect(resolveQrPreset(null)).toBe(QR_PRESETS.classic.options);
    expect(resolveQrPreset(undefined)).toBe(QR_PRESETS.classic.options);
    expect(resolveQrPreset("bogus")).toBe(QR_PRESETS.classic.options);
    expect(resolveQrPreset("rounded")).toBe(QR_PRESETS.rounded.options);
  });
});
