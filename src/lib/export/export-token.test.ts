import { describe, expect, it } from "vitest";

import {
  EXPORT_TOKEN_VERSION,
  type ExportManifestPayload,
  isValidExportKey,
  signExportToken,
  verifyExportToken,
} from "@/lib/export/export-token";

const SECRET = "test-export-secret-please-rotate";
const NOW = 1_700_000_000_000;
const EID = "11111111-1111-1111-1111-111111111111";
const MID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const KEY = `events/${EID}/photo/${MID}/original.jpg`;

function payload(over: Partial<ExportManifestPayload> = {}): ExportManifestPayload {
  return {
    v: EXPORT_TOKEN_VERSION,
    jti: "abc123",
    scope: "host",
    eventId: EID,
    zipName: "sarah-toms-wedding.zip",
    items: [{ key: KEY, name: "sarah-toms-wedding-aaaaaaaa.jpg" }],
    exp: NOW + 60_000,
    ...over,
  };
}

describe("isValidExportKey", () => {
  it("accepts a canonical original/preview key", () => {
    expect(isValidExportKey(KEY)).toBe(true);
    expect(isValidExportKey(`events/${EID}/video/${MID}/preview.webp`)).toBe(true);
  });

  it("rejects traversal, non-event, wrong-kind, and bad-shape keys", () => {
    expect(isValidExportKey(`avatars/${MID}/x.jpg`)).toBe(false);
    expect(isValidExportKey(`events/${EID}/photo/${MID}/../secret.jpg`)).toBe(false);
    expect(isValidExportKey(`events/${EID}/audio/${MID}/original.mp3`)).toBe(false);
    expect(isValidExportKey(`events/not-a-uuid/photo/${MID}/original.jpg`)).toBe(false);
    expect(isValidExportKey(`events/${EID}/photo/${MID}/original`)).toBe(false);
    expect(isValidExportKey(`events/${EID}/photo/${MID}/hacked.jpg`)).toBe(false);
  });
});

describe("export-token", () => {
  it("round-trips a freshly signed token", () => {
    const token = signExportToken(SECRET, payload());
    const r = verifyExportToken(SECRET, token, NOW);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.payload.eventId).toBe(EID);
      expect(r.payload.items).toHaveLength(1);
      expect(r.payload.zipName).toBe("sarah-toms-wedding.zip");
    }
  });

  it("rejects a tampered MAC", () => {
    const token = signExportToken(SECRET, payload());
    const last = token.at(-1);
    const tampered = token.slice(0, -1) + (last === "a" ? "b" : "a");
    const r = verifyExportToken(SECRET, tampered, NOW);
    expect(r).toEqual({ ok: false, reason: "bad_signature" });
  });

  it("rejects a token signed with a different secret", () => {
    const token = signExportToken("another-secret", payload());
    expect(verifyExportToken(SECRET, token, NOW).ok).toBe(false);
  });

  it("rejects an expired token", () => {
    const token = signExportToken(SECRET, payload({ exp: NOW - 1 }));
    expect(verifyExportToken(SECRET, token, NOW)).toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("rejects a wrong version", () => {
    const token = signExportToken(SECRET, payload({ v: 99 }));
    expect(verifyExportToken(SECRET, token, NOW)).toEqual({
      ok: false,
      reason: "bad_version",
    });
  });

  it("rejects a manifest carrying a tampered (non-canonical) key", () => {
    const token = signExportToken(
      SECRET,
      payload({ items: [{ key: `secrets/${MID}/x.env`, name: "x.env" }] }),
    );
    // The MAC is valid (we signed it), so the catch is the per-key layout gate.
    expect(verifyExportToken(SECRET, token, NOW)).toEqual({
      ok: false,
      reason: "bad_key",
    });
  });

  it("rejects an empty item set", () => {
    const token = signExportToken(SECRET, payload({ items: [] }));
    expect(verifyExportToken(SECRET, token, NOW)).toEqual({
      ok: false,
      reason: "bad_payload",
    });
  });

  it("fails closed on an empty secret, missing token, or malformed token", () => {
    const token = signExportToken(SECRET, payload());
    expect(verifyExportToken("", token, NOW).ok).toBe(false);
    expect(verifyExportToken(SECRET, undefined, NOW).ok).toBe(false);
    expect(verifyExportToken(SECRET, "onlyonepart", NOW).ok).toBe(false);
    expect(verifyExportToken(SECRET, "too.many.dots", NOW).ok).toBe(false);
  });
});
