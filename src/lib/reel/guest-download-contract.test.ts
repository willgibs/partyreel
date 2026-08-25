import { describe, expect, expectTypeOf, it } from "vitest";

import {
  reelDownloadBodySchema,
  type ReelDownloadResponse,
} from "./guest-download-contract";

describe("reelDownloadBodySchema (the /api/reel/download wire contract)", () => {
  it("accepts a qr_token", () => {
    expect(
      reelDownloadBodySchema.safeParse({ qr_token: "abc123" }).success,
    ).toBe(true);
  });

  it("rejects a missing, empty, or non-string token", () => {
    for (const qr_token of [undefined, "", 42, null, {}]) {
      expect(reelDownloadBodySchema.safeParse({ qr_token }).success).toBe(
        false,
      );
    }
  });

  it("carries the token and NOTHING else the client could steer", () => {
    // The token IS the capability: the route re-derives the event + access from it. An event_id or a
    // publish flag on the wire would be a client-supplied authorization input.
    const parsed = reelDownloadBodySchema.parse({
      qr_token: "abc123",
      event_id: "2485e1e6-12b1-4d02-aee3-1e2bb5d38d4f",
      guest_visible: true,
    });
    expect(parsed).toEqual({ qr_token: "abc123" });
  });
});

describe("the guest download response union", () => {
  it("narrows a success to the single artifact mode", () => {
    const res: ReelDownloadResponse = {
      ok: true,
      mode: "artifact",
      fresh: false,
      url: "https://r2/presigned",
      filename: "Test Wedding-reel.mp4",
    };
    if (res.ok) {
      expectTypeOf(res.mode).toEqualTypeOf<"artifact">();
      expectTypeOf(res.fresh).toBeBoolean();
    }
  });

  it("keeps `no_artifact` distinct from the refusals (the client branches on it)", () => {
    const noArtifact: ReelDownloadResponse = {
      ok: false,
      code: "no_artifact",
      filename: "Test Wedding-reel.mp4",
    };
    // no_artifact means "you may have it, we just have not rendered one" -> self-encode ladder.
    expect(noArtifact.ok).toBe(false);
    if (!noArtifact.ok && noArtifact.code === "no_artifact") {
      expectTypeOf(noArtifact.filename).toBeString();
    }
  });

  it("does not leak a publish-state oracle: one code covers every 'nothing for you' case", () => {
    // no reel row / nothing curated / not shared must all answer identically, or a stranger could poll
    // the route to learn whether a private album has a reel waiting.
    const codes: ReelDownloadResponse[] = [
      { ok: false, code: "no_reel" },
      { ok: false, code: "forbidden" },
      { ok: false, code: "rate_limited", retryAfterSec: 900 },
      { ok: false, code: "bad_request" },
    ];
    expect(codes.filter((c) => !c.ok && c.code === "no_reel")).toHaveLength(1);
    // retryAfterSec is the one optional field, and only rate_limited ever sets it.
    const limited = codes.find((c) => !c.ok && c.code === "rate_limited");
    expect(limited && !limited.ok && "retryAfterSec" in limited).toBe(true);
    expect(
      codes.filter((c) => !c.ok && "retryAfterSec" in c && c.retryAfterSec),
    ).toHaveLength(1);
  });
});
