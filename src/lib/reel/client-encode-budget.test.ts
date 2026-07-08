import { describe, expect, it } from "vitest";

import {
  clientEncodeSizeCapBytes,
  ENCODE_LENGTH_ALLOWANCE_SEC,
  ENCODE_SIZE_CEILING_BYTES,
  ENCODE_SIZE_HEADROOM,
  MAX_CLIENT_ENCODE_BITRATE_BPS,
  withinClientEncodeSizeCap,
} from "./client-encode-budget";
import { ENCODE_BITRATES } from "./engine/encode";
import { MAX_REEL_SECONDS } from "@/lib/constants/tiers";

describe("bitrate budget parity", () => {
  it("MAX_CLIENT_ENCODE_BITRATE_BPS mirrors the encoder's highest offered bitrate", () => {
    // The budget constant is standalone (encode.ts is browser-oriented; the mint route is server),
    // so this parity test is the tie that keeps the two from drifting.
    expect(MAX_CLIENT_ENCODE_BITRATE_BPS).toBe(Math.max(...ENCODE_BITRATES));
  });
});

describe("clientEncodeSizeCapBytes (the mint upload ceiling)", () => {
  it("is length x bitrate budget x headroom (+ the intro/outro allowance)", () => {
    const expected = Math.ceil(
      (30 + ENCODE_LENGTH_ALLOWANCE_SEC) *
        (MAX_CLIENT_ENCODE_BITRATE_BPS / 8) *
        ENCODE_SIZE_HEADROOM,
    );
    expect(clientEncodeSizeCapBytes(30)).toBe(expected);
  });

  it("grows with the tier length cap (a 60s pro reel gets a bigger ceiling)", () => {
    expect(clientEncodeSizeCapBytes(MAX_REEL_SECONDS.pro)).toBeGreaterThan(
      clientEncodeSizeCapBytes(MAX_REEL_SECONDS.free),
    );
  });

  it("comfortably fits an honest encode (a 60s reel at the max bitrate)", () => {
    // 60s at 8 Mbps is 60 MB of video; the cap must not reject a legit export.
    const honest = 60 * (MAX_CLIENT_ENCODE_BITRATE_BPS / 8);
    expect(clientEncodeSizeCapBytes(60)).toBeGreaterThan(honest);
  });

  it("never exceeds the hard ceiling, even for absurd lengths", () => {
    expect(clientEncodeSizeCapBytes(10_000)).toBe(ENCODE_SIZE_CEILING_BYTES);
  });

  it("floors degenerate lengths at 1s (still a positive cap)", () => {
    expect(clientEncodeSizeCapBytes(0)).toBeGreaterThan(0);
    expect(clientEncodeSizeCapBytes(-5)).toBe(clientEncodeSizeCapBytes(0));
  });
});

describe("withinClientEncodeSizeCap (mint-time acceptance)", () => {
  it("accepts a plausible mp4 size for a 30s reel", () => {
    // ~19 MB, the 5 Mbps default bitrate for ~30s.
    expect(withinClientEncodeSizeCap(19_000_000, 30)).toBe(true);
  });

  it("rejects a size over the cap", () => {
    expect(
      withinClientEncodeSizeCap(clientEncodeSizeCapBytes(30) + 1, 30),
    ).toBe(false);
  });

  it("accepts exactly the cap", () => {
    expect(withinClientEncodeSizeCap(clientEncodeSizeCapBytes(30), 30)).toBe(
      true,
    );
  });

  it("rejects zero, negative, fractional, and unsafe sizes", () => {
    expect(withinClientEncodeSizeCap(0, 30)).toBe(false);
    expect(withinClientEncodeSizeCap(-1, 30)).toBe(false);
    expect(withinClientEncodeSizeCap(1.5, 30)).toBe(false);
    expect(withinClientEncodeSizeCap(Number.MAX_SAFE_INTEGER + 2, 30)).toBe(
      false,
    );
    expect(withinClientEncodeSizeCap(NaN, 30)).toBe(false);
    expect(withinClientEncodeSizeCap(Infinity, 30)).toBe(false);
  });
});
