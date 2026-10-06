/**
 * THE APP'S HALF OF THE DRIVE PROTOCOL'S CONTRACT: the vectors `workers/drive/src/protocol.test.ts` holds too. The
 * Worker signs and opens with Web Crypto; this verifies, signs the kick and seals with node:crypto; the strings are the
 * wire format both must produce and accept, byte for byte.
 */
import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  DRIVE_FRESH_MS,
  kickWordSchema,
  laneFailWordSchema,
  reportWordSchema,
  sealForLease,
  signDriveWord,
  verifyDriveWord,
} from "@/lib/drive/protocol";

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
} as const;
const WORD =
  "eyJ2IjoxLCJraW5kIjoicmVwb3J0IiwiYXQiOjE5MDAwMDAwMDAwMDAsImxlYXNlIjoiMTExMTExMTEtMjIyMi00MzMzLTg0NDQtNTU1NTU1NTU1NTU1IiwiaXRlbXMiOlt7Im1lZGlhSWQiOiI2NjY2NjY2Ni03Nzc3LTQ4ODgtOTk5OS1hYWFhYWFhYWFhYWEiLCJvdXRjb21lIjoic2VudCIsImZpbGVJZCI6IjFBYkNfZEVmLTIiLCJtZDUiOiIwMTIzNDU2Nzg5YWJjZGVmMDEyMzQ1Njc4OWFiY2RlZiJ9XSwiZG9uZSI6dHJ1ZX0.f42995b2a015f8b667d7e9ad087ab68807a5ba3558c0809e9d76cb0951de4616";
const SEALED =
  "AAECAwQFBgcICQoL.aMw-A8qgcjRVADPQGL_vMXpkVNCx3Mg9YHD3mtjp2jtfY1kX6Hnq53bRVA";
/** A dying lane's word as the Worker's `laneFail` signs it (its suite pins the same string): bound to its message. */
const LANEFAIL = {
  v: 1,
  at: 1_900_000_000_000,
  kind: "lanefail",
  connectionId: "33333333-4444-4555-8666-777777777777",
  messageId: "0123456789abcdef0123456789abcdef",
  error: "TypeError: boom",
} as const;
const LANEFAIL_WORD =
  "eyJ2IjoxLCJhdCI6MTkwMDAwMDAwMDAwMCwia2luZCI6ImxhbmVmYWlsIiwiY29ubmVjdGlvbklkIjoiMzMzMzMzMzMtNDQ0NC00NTU1LTg2NjYtNzc3Nzc3Nzc3Nzc3IiwibWVzc2FnZUlkIjoiMDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWYiLCJlcnJvciI6IlR5cGVFcnJvcjogYm9vbSJ9.d1b6c914c0721948c6b8404894d405e51ef4b011e100b97dbb9ea67f5497d8bf";

describe("a word between the app and the Drive Worker", () => {
  it("★ reads a dying lane's word with its Queue message, and refuses one without (the count is one a message)", () => {
    expect(
      verifyDriveWord(SECRET, LANEFAIL_WORD, laneFailWordSchema, LANEFAIL.at),
    ).toEqual({ ok: true, word: LANEFAIL });
    expect(signDriveWord(SECRET, LANEFAIL)).toBe(LANEFAIL_WORD);
    const bare = Object.fromEntries(
      Object.entries(LANEFAIL).filter(([key]) => key !== "messageId"),
    );
    expect(
      verifyDriveWord(
        SECRET,
        signDriveWord(SECRET, bare),
        laneFailWordSchema,
        LANEFAIL.at,
      ),
    ).toEqual({ ok: false, reason: "malformed" });
    expect(
      verifyDriveWord(
        SECRET,
        signDriveWord(SECRET, { ...LANEFAIL, messageId: "a b" }),
        laneFailWordSchema,
        LANEFAIL.at,
      ),
    ).toEqual({ ok: false, reason: "malformed" });
  });

  it("verifies the pinned vector into its schema, and signs it byte for byte", () => {
    expect(verifyDriveWord(SECRET, WORD, reportWordSchema, PAYLOAD.at)).toEqual(
      { ok: true, word: PAYLOAD },
    );
    expect(signDriveWord(SECRET, PAYLOAD)).toBe(WORD);
  });

  it("★ is no export token and no export report: its MAC is over its own domain", () => {
    const [body] = WORD.split(".");
    const bare = `${body}.${createHmac("sha256", SECRET).update(body!).digest("hex")}`;
    const report = `${body}.${createHmac("sha256", SECRET).update(`report:${body}`).digest("hex")}`;
    expect(verifyDriveWord(SECRET, bare, reportWordSchema, PAYLOAD.at)).toEqual(
      { ok: false, reason: "bad_signature" },
    );
    expect(
      verifyDriveWord(SECRET, report, reportWordSchema, PAYLOAD.at),
    ).toEqual({ ok: false, reason: "bad_signature" });
  });

  it("refuses another secret, a changed body, a stale word, a malformed one and a shape it does not know", () => {
    expect(
      verifyDriveWord("other", WORD, reportWordSchema, PAYLOAD.at),
    ).toEqual({ ok: false, reason: "bad_signature" });
    const [body, mac] = WORD.split(".");
    expect(
      verifyDriveWord(SECRET, `${body}A.${mac}`, reportWordSchema, PAYLOAD.at)
        .ok,
    ).toBe(false);
    expect(
      verifyDriveWord(
        SECRET,
        WORD,
        reportWordSchema,
        PAYLOAD.at + DRIVE_FRESH_MS + 1,
      ),
    ).toEqual({
      ok: false,
      reason: "stale",
    });
    expect(
      verifyDriveWord(SECRET, "a.b.c", reportWordSchema, PAYLOAD.at),
    ).toEqual({ ok: false, reason: "malformed" });
    // A report signed right but shaped as a kick: refused by the schema, never half-read.
    expect(verifyDriveWord(SECRET, WORD, kickWordSchema, PAYLOAD.at)).toEqual({
      ok: false,
      reason: "malformed",
    });
  });

  it("seals a lease's token as the Worker opens it (the pinned vector), bound to that lease", () => {
    const iv = Buffer.from("000102030405060708090a0b", "hex");
    expect(
      sealForLease(
        SECRET,
        "ya29.a0-vector-access-token",
        "11111111-2222-4333-8444-555555555555",
        iv,
      ),
    ).toBe(SEALED);
    expect(
      sealForLease(
        SECRET,
        "ya29.a0-vector-access-token",
        "22222222-2222-4333-8444-555555555555",
        iv,
      ),
    ).not.toBe(SEALED);
    // A real seal draws its own IV every time.
    expect(
      sealForLease(SECRET, "t", "11111111-2222-4333-8444-555555555555"),
    ).not.toBe(
      sealForLease(SECRET, "t", "11111111-2222-4333-8444-555555555555"),
    );
  });
});
