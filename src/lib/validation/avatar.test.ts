import { describe, expect, it } from "vitest";

import { AVATAR_MAX_BYTES, isWebp } from "@/lib/validation/avatar";

// Build a byte buffer from ASCII fourCCs / raw byte arrays, in order.
function bytesFrom(...parts: (string | number[])[]): Uint8Array {
  const out: number[] = [];
  for (const p of parts) {
    if (typeof p === "string") {
      for (const ch of p) out.push(ch.charCodeAt(0));
    } else {
      out.push(...p);
    }
  }
  return new Uint8Array(out);
}

const SIZE4 = [0, 0, 0, 0]; // the RIFF chunk-size field (ignored by the check)

describe("isWebp", () => {
  it("accepts a RIFF....WEBP header", () => {
    expect(isWebp(bytesFrom("RIFF", SIZE4, "WEBP", "VP8 "))).toBe(true);
  });

  it("rejects RIFF....WAVE (RIFF alone is not enough — .wav is also RIFF)", () => {
    expect(isWebp(bytesFrom("RIFF", SIZE4, "WAVE"))).toBe(false);
  });

  it("rejects PNG and JPEG magic bytes", () => {
    // PNG
    expect(
      isWebp(
        new Uint8Array([
          0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
        ]),
      ),
    ).toBe(false);
    // JPEG
    expect(
      isWebp(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])),
    ).toBe(false);
  });

  it("rejects a buffer too short to hold the WEBP fourCC", () => {
    expect(isWebp(bytesFrom("RIFF", SIZE4))).toBe(false); // only 8 bytes
    expect(isWebp(new Uint8Array(0))).toBe(false);
  });
});

describe("AVATAR_MAX_BYTES", () => {
  it("is 512 KB", () => {
    expect(AVATAR_MAX_BYTES).toBe(512 * 1024);
  });
});
