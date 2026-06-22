import { describe, expect, it } from "vitest";

import {
  EXPORT_TOKEN_VERSION,
  type ExportManifestPayload,
  isValidExportKey,
  verifyExportToken,
} from "./export-token";

const SECRET = "test-export-secret-please-rotate";
const NOW = 1_700_000_000_000;
const EID = "11111111-1111-1111-1111-111111111111";
const MID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const KEY = `events/${EID}/photo/${MID}/original.jpg`;

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Sign with Web Crypto in the SAME format the app's node:crypto signer emits — base64url(payload) + "." +
// hmac-sha256 hex. (HMAC-SHA256 is spec-deterministic, so this exercises the exact format the app produces.)
async function sign(secret: string, payload: ExportManifestPayload): Promise<string> {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, enc.encode(body)),
  );
  const macHex = [...sig].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${body}.${macHex}`;
}

function payload(over: Partial<ExportManifestPayload> = {}): ExportManifestPayload {
  return {
    v: EXPORT_TOKEN_VERSION,
    jti: "abc",
    scope: "host",
    eventId: EID,
    zipName: "sarah-toms-wedding.zip",
    items: [{ key: KEY, name: "sarah-toms-wedding-aaaaaaaa.jpg" }],
    exp: NOW + 60_000,
    ...over,
  };
}

describe("isValidExportKey", () => {
  it("accepts canonical keys, rejects traversal / non-event / wrong-kind", () => {
    expect(isValidExportKey(KEY)).toBe(true);
    expect(isValidExportKey(`events/${EID}/video/${MID}/preview.webp`)).toBe(true);
    expect(isValidExportKey(`secrets/${MID}/x.env`)).toBe(false);
    expect(isValidExportKey(`events/${EID}/photo/${MID}/../x.jpg`)).toBe(false);
    expect(isValidExportKey(`events/bad/photo/${MID}/original.jpg`)).toBe(false);
  });
});

describe("worker verifyExportToken (Web Crypto)", () => {
  it("verifies a properly signed token", async () => {
    const r = await verifyExportToken(SECRET, await sign(SECRET, payload()), NOW);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.payload.eventId).toBe(EID);
  });

  it("rejects a token signed with a different secret", async () => {
    expect(
      (await verifyExportToken(SECRET, await sign("other", payload()), NOW)).ok,
    ).toBe(false);
  });

  it("rejects expired / bad-version / non-canonical-key / empty-items", async () => {
    expect(
      (await verifyExportToken(SECRET, await sign(SECRET, payload({ exp: NOW - 1 })), NOW)).ok,
    ).toBe(false);
    expect(
      (await verifyExportToken(SECRET, await sign(SECRET, payload({ v: 9 })), NOW)).ok,
    ).toBe(false);
    expect(
      (
        await verifyExportToken(
          SECRET,
          await sign(SECRET, payload({ items: [{ key: `secrets/x.env`, name: "x" }] })),
          NOW,
        )
      ).ok,
    ).toBe(false);
    expect(
      (await verifyExportToken(SECRET, await sign(SECRET, payload({ items: [] })), NOW)).ok,
    ).toBe(false);
  });

  it("rejects a tampered MAC and a malformed / missing token", async () => {
    const t = await sign(SECRET, payload());
    const tampered = t.slice(0, -1) + (t.at(-1) === "a" ? "b" : "a");
    expect((await verifyExportToken(SECRET, tampered, NOW)).ok).toBe(false);
    expect((await verifyExportToken(SECRET, null, NOW)).ok).toBe(false);
    expect((await verifyExportToken(SECRET, "onlyonepart", NOW)).ok).toBe(false);
    expect((await verifyExportToken("", t, NOW)).ok).toBe(false);
  });
});
