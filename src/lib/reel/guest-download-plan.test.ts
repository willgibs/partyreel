import { describe, expect, it } from "vitest";

import {
  needsEncodeProbe,
  planReelDownload,
} from "@/lib/reel/guest-download-plan";

// The four ladder rungs the live red-team forces one at a time (ADR-0022 ruling 4), plus the
// refusals. If a rung's outcome changes, this is the file that has to say so.

const artifact = (fresh: boolean) =>
  ({
    ok: true as const,
    mode: "artifact" as const,
    fresh,
    url: "https://r2.example/signed.mp4",
    filename: "sarahs-party-reel.mp4",
  }) satisfies Parameters<typeof planReelDownload>[0];

describe("planReelDownload (the guest download ladder)", () => {
  it("serves a FRESH artifact regardless of device capability", () => {
    for (const canEncode of [true, false]) {
      expect(planReelDownload(artifact(true), canEncode)).toEqual({
        kind: "artifact",
        url: "https://r2.example/signed.mp4",
        fresh: true,
      });
    }
  });

  it("prefers a local encode over a STALE artifact when the device can encode", () => {
    expect(planReelDownload(artifact(false), true)).toEqual({
      kind: "encode",
      filename: "sarahs-party-reel.mp4",
    });
  });

  it("falls back to the STALE artifact when the device cannot encode", () => {
    expect(planReelDownload(artifact(false), false)).toEqual({
      kind: "artifact",
      url: "https://r2.example/signed.mp4",
      fresh: false,
    });
  });

  it("encodes locally when there is NO artifact and the device can", () => {
    expect(
      planReelDownload(
        { ok: false, code: "no_artifact", filename: "reel.mp4" },
        true,
      ),
    ).toEqual({ kind: "encode", filename: "reel.mp4" });
  });

  it("asks the host only at the true dead end (no artifact, no encoder)", () => {
    expect(
      planReelDownload(
        { ok: false, code: "no_artifact", filename: "reel.mp4" },
        false,
      ),
    ).toEqual({ kind: "ask_host" });
  });

  it("passes the limiter's Retry-After through", () => {
    expect(
      planReelDownload(
        { ok: false, code: "rate_limited", retryAfterSec: 42 },
        true,
      ),
    ).toEqual({ kind: "rate_limited", retryAfterSec: 42 });
  });

  it("collapses no_reel / forbidden / bad_request / a dead request into ONE answer", () => {
    // The route refuses to be a publish-state oracle; the client must not undo that in its copy.
    for (const code of ["no_reel", "forbidden", "bad_request"] as const) {
      expect(planReelDownload({ ok: false, code }, true)).toEqual({
        kind: "unavailable",
      });
    }
    expect(planReelDownload(null, true)).toEqual({ kind: "unavailable" });
  });

  it("never plans a write path (no mint/upload/render rung exists)", () => {
    const kinds = new Set(
      [
        planReelDownload(artifact(true), true),
        planReelDownload(artifact(false), true),
        planReelDownload(artifact(false), false),
        planReelDownload({ ok: false, code: "no_artifact", filename: "r" }, true),
        planReelDownload(
          { ok: false, code: "no_artifact", filename: "r" },
          false,
        ),
        planReelDownload({ ok: false, code: "no_reel" }, true),
      ].map((p) => p.kind),
    );
    expect([...kinds].sort()).toEqual([
      "artifact",
      "ask_host",
      "encode",
      "unavailable",
    ]);
  });
});

describe("needsEncodeProbe (skip the WebCodecs probe when the plan cannot change)", () => {
  it("probes only where a local encode is a live option", () => {
    expect(needsEncodeProbe(artifact(false))).toBe(true);
    expect(
      needsEncodeProbe({ ok: false, code: "no_artifact", filename: "r" }),
    ).toBe(true);
  });

  it("skips the probe on the fresh hit and every refusal", () => {
    expect(needsEncodeProbe(artifact(true))).toBe(false);
    expect(needsEncodeProbe({ ok: false, code: "no_reel" })).toBe(false);
    expect(needsEncodeProbe({ ok: false, code: "rate_limited" })).toBe(false);
    expect(needsEncodeProbe(null)).toBe(false);
  });
});
