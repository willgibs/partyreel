/**
 * Pins the guest reel's anon allow-list (R3; guest-flow.md).
 *
 * The RETURNS TABLE of get_event_reel_by_qr_token IS the anon surface; guest-reel-payload.ts is its
 * TypeScript mirror. This test pins BOTH directions: the allow-list is exactly these 8 keys, and
 * none of the "never returned" names (render internals, timestamps, the tier) can sneak onto it or
 * onto the client payload. A future column added to the RPC by name lands on this tripwire.
 *
 * (After the 20260730120000 migration applies and types regenerate, the generated RPC Returns type
 * exists — extend this to compare against it, per the migration header's typing-seam notes.)
 */
import { describe, expect, it } from "vitest";

import type { Database } from "@/lib/db/types";

import {
  GUEST_REEL_ALLOWED_KEYS,
  GUEST_REEL_FORBIDDEN_KEYS,
  type GuestReelRpcRow,
  toGuestReelPayload,
} from "./guest-reel-payload";

// COMPILE-TIME pin against the GENERATED RPC Returns (post-regen): the mirror and the live
// function must carry the SAME key set, both directions. Key-level on purpose: the generator
// cannot express a RETURNS TABLE column's runtime nullability (cover_media_id), so a full type
// equality would be a lie; the allow-LIST is about NAMES.
type GeneratedReelRow =
  Database["public"]["Functions"]["get_event_reel_by_qr_token"]["Returns"][number];
type AssertKeysEqual<A, B> = [keyof A] extends [keyof B]
  ? [keyof B] extends [keyof A]
    ? true
    : never
  : never;
const GENERATED_MATCHES_MIRROR: AssertKeysEqual<
  GeneratedReelRow,
  GuestReelRpcRow
> = true;

// Compile-time exhaustiveness: constructing this record fails to typecheck if the allow-list array
// misses a key of GuestReelRpcRow, and the `satisfies` on the array itself refuses extras.
const EXHAUSTIVE: Record<(typeof GUEST_REEL_ALLOWED_KEYS)[number], true> = {
  style_id: true,
  orientation: true,
  seed: true,
  length_seconds: true,
  cover_media_id: true,
  mp4_ready: true,
  watermark: true,
  item_ids: true,
} satisfies Record<keyof GuestReelRpcRow, true>;

const row: GuestReelRpcRow = {
  style_id: "polaroid",
  orientation: "landscape",
  seed: 226912,
  length_seconds: 30,
  cover_media_id: "11111111-1111-4111-8111-111111111111",
  mp4_ready: true,
  watermark: true,
  item_ids: [
    "11111111-1111-4111-8111-111111111111",
    "22222222-2222-4222-8222-222222222222",
  ],
};

describe("the guest reel anon allow-list", () => {
  it("is exactly the 8 allowed keys (and mirrors the generated RPC type)", () => {
    expect([...GUEST_REEL_ALLOWED_KEYS].sort()).toEqual(
      Object.keys(EXHAUSTIVE).sort(),
    );
    expect(GUEST_REEL_ALLOWED_KEYS).toHaveLength(8);
    expect(GENERATED_MATCHES_MIRROR).toBe(true);
  });

  it("never intersects the forbidden names", () => {
    const allowed = new Set<string>(GUEST_REEL_ALLOWED_KEYS);
    // Imported from prod code, so an edit THERE could silently empty this loop.
    expect(
      GUEST_REEL_FORBIDDEN_KEYS.length,
      "the forbidden-key list is empty",
    ).toBeGreaterThan(2);
    for (const name of GUEST_REEL_FORBIDDEN_KEYS) {
      expect(allowed.has(name)).toBe(false);
    }
  });

  it("keeps the forbidden list covering every render internal + timestamp + the tier", () => {
    // The load-bearing names from the allow-list, spelled out so a rename is a conscious edit here.
    for (const name of [
      "output_key",
      "rendered_hash",
      "render_error",
      "render_cost_usd",
      "rendered_at",
      "tier",
    ]) {
      expect(GUEST_REEL_FORBIDDEN_KEYS).toContain(name);
    }
  });
});

describe("toGuestReelPayload", () => {
  it("maps 1:1, narrows orientation, and carries the cover url", () => {
    const payload = toGuestReelPayload(row, "https://r2.example/cover");
    expect(payload).toEqual({
      styleId: "polaroid",
      orientation: "landscape",
      seed: 226912,
      lengthSeconds: 30,
      coverMediaId: "11111111-1111-4111-8111-111111111111",
      watermark: true,
      orderedIds: row.item_ids,
      mp4Ready: true,
      coverUrl: "https://r2.example/cover",
    });
  });

  it("defaults an unknown orientation to portrait (the RPC CASEs, this is the belt)", () => {
    expect(
      toGuestReelPayload({ ...row, orientation: "sideways" }, null),
    ).toMatchObject({ orientation: "portrait", coverUrl: null });
  });

  it("emits no forbidden key under any spelling", () => {
    const keys = new Set(Object.keys(toGuestReelPayload(row, null)));
    for (const name of GUEST_REEL_FORBIDDEN_KEYS) {
      expect(keys.has(name)).toBe(false);
      // The camelCase spelling a mapper "helpfully" adding a field would produce:
      const camel = name.replace(/_([a-z])/g, (_, c: string) =>
        c.toUpperCase(),
      );
      expect(keys.has(camel)).toBe(false);
    }
  });
});
