import { describe, expect, it } from "vitest";

import { shouldClientEncode } from "./encode-gate";
import { ENGINE_STYLES } from "./registry";

describe("shouldClientEncode (client encode vs Lambda fallback)", () => {
  it("takes the client path when the device encodes and the style is ported", () => {
    for (const styleId of Object.keys(ENGINE_STYLES)) {
      expect(shouldClientEncode({ canEncode: true }, styleId)).toBe(true);
    }
  });

  it("falls back to Lambda when WebCodecs can't encode", () => {
    expect(shouldClientEncode({ canEncode: false }, "classic")).toBe(false);
  });

  it("falls back to Lambda when the probe itself failed (null support)", () => {
    expect(shouldClientEncode(null, "classic")).toBe(false);
    expect(shouldClientEncode(undefined, "classic")).toBe(false);
  });

  it("falls back to Lambda for an unported / unknown style id", () => {
    expect(shouldClientEncode({ canEncode: true }, "not-a-style")).toBe(false);
    expect(shouldClientEncode({ canEncode: true }, null)).toBe(false);
    expect(shouldClientEncode({ canEncode: true }, "")).toBe(false);
  });
});
