/**
 * THE TWIN'S HALF OF THE CONTRACT: the same vectors the app's `src/lib/drive/protocol.test.ts` holds. Web Crypto here,
 * node:crypto there; the strings below are the wire format both must produce and accept, byte for byte.
 */
import { describe, expect, it } from "vitest";

import { openLeaseToken, readKick, signWord, verifyWord } from "./protocol";

const SECRET = "drive-vector-secret";
const PAYLOAD = {
  v: 1,
  kind: "report",
  at: 1_900_000_000_000,
  lease: "11111111-2222-4333-8444-555555555555",
  items: [
    {
      mediaId: "66666666-7777-4888-9999-aaaaaaaaaaaa",
      outcome: "sent",
      fileId: "1AbC_dEf-2",
      md5: "0123456789abcdef0123456789abcdef",
    },
  ],
  done: true,
};
const WORD =
  "eyJ2IjoxLCJraW5kIjoicmVwb3J0IiwiYXQiOjE5MDAwMDAwMDAwMDAsImxlYXNlIjoiMTExMTExMTEtMjIyMi00MzMzLTg0NDQtNTU1NTU1NTU1NTU1IiwiaXRlbXMiOlt7Im1lZGlhSWQiOiI2NjY2NjY2Ni03Nzc3LTQ4ODgtOTk5OS1hYWFhYWFhYWFhYWEiLCJvdXRjb21lIjoic2VudCIsImZpbGVJZCI6IjFBYkNfZEVmLTIiLCJtZDUiOiIwMTIzNDU2Nzg5YWJjZGVmMDEyMzQ1Njc4OWFiY2RlZiJ9XSwiZG9uZSI6dHJ1ZX0.f42995b2a015f8b667d7e9ad087ab68807a5ba3558c0809e9d76cb0951de4616";
const SEALED = "AAECAwQFBgcICQoL.aMw-A8qgcjRVADPQGL_vMXpkVNCx3Mg9YHD3mtjp2jtfY1kX6Hnq53bRVA";
const LEASE = "11111111-2222-4333-8444-555555555555";

describe("the Drive protocol's twin", () => {
  it("signs the pinned vector byte for byte, and verifies it", async () => {
    expect(await signWord(SECRET, PAYLOAD)).toBe(WORD);
    const verdict = await verifyWord(SECRET, WORD, PAYLOAD.at);
    expect(verdict).toEqual({ ok: true, word: PAYLOAD });
  });

  it("refuses another secret, a changed body, a stale word and a malformed one", async () => {
    expect((await verifyWord("not-the-secret", WORD, PAYLOAD.at)).ok).toBe(false);
    const [body, mac] = WORD.split(".");
    expect(await verifyWord(SECRET, `${body}x.${mac}`, PAYLOAD.at)).toMatchObject({ ok: false, reason: "bad_signature" });
    expect(await verifyWord(SECRET, WORD, PAYLOAD.at + 5 * 60_000 + 1)).toMatchObject({ ok: false, reason: "stale" });
    expect(await verifyWord(SECRET, "a.b.c", PAYLOAD.at)).toMatchObject({ ok: false, reason: "malformed" });
  });

  it("opens the pinned sealed token for its own lease alone", async () => {
    expect(await openLeaseToken(SECRET, SEALED, LEASE)).toBe("ya29.a0-vector-access-token");
    expect(await openLeaseToken(SECRET, SEALED, "22222222-2222-4333-8444-555555555555")).toBeNull();
    expect(await openLeaseToken("not-the-secret", SEALED, LEASE)).toBeNull();
  });

  it("reads a kick: a connection and one to three lanes, nothing else", () => {
    const id = "33333333-4444-4555-8666-777777777777";
    expect(readKick({ v: 1, kind: "kick", at: 1, connectionId: id, lanes: 3 })).toEqual({ connectionId: id, lanes: 3 });
    expect(readKick({ v: 1, kind: "kick", at: 1, connectionId: id, lanes: 4 })).toBeNull();
    expect(readKick({ v: 1, kind: "lease", at: 1, connectionId: id, lanes: 1 })).toBeNull();
    expect(readKick({ v: 1, kind: "kick", at: 1, connectionId: "x", lanes: 1 })).toBeNull();
  });
});
