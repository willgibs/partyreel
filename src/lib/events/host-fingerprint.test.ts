// @contract-for: src/lib/events/host-fingerprint.ts
// @contract-for: src/app/api/events/[eventId]/live/route.ts

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { hostEtag } from "@/lib/events/host-fingerprint";

/**
 * THE HUB'S VALIDATOR (Will, `first=live`, 2026-09-21).
 *
 * Every failure this guards is quiet. A hash that ignores a field means a host
 * watching an empty room never sees the first photograph land and has no way to
 * know she is looking at a stale page; a hash that matches across events means a
 * 304 serving one album's state to another. Neither throws and neither looks
 * wrong on screen.
 */

const ROOT = process.cwd();
const ROUTE = "src/app/api/events/[eventId]/live/route.ts";
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
/** Source with comments stripped: the route NAMES what it must not do, in prose. */
const code = (rel: string) =>
  read(rel)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

const base = {
  eventId: "e1",
  album: 2,
  pending: 0,
  newestUpdatedAt: "2026-09-23T12:00:00.123456+00:00",
};

describe("the host fingerprint", () => {
  it("is stable for an unchanged album", () => {
    expect(hostEtag(base)).toBe(hostEtag({ ...base }));
  });

  it("moves when a photograph arrives", () => {
    // An arrival is a new row: the album count moves, and so does the newest write.
    expect(
      hostEtag({
        ...base,
        album: 3,
        newestUpdatedAt: "2026-09-23T12:00:05.000001+00:00",
      }),
    ).not.toBe(hostEtag(base));
  });

  it("moves when a photograph leaves", () => {
    expect(hostEtag({ ...base, album: 1 })).not.toBe(hostEtag(base));
  });

  it("moves when one is hidden from a second tab, though no count moves", () => {
    // A hide keeps the row in the album (approved + hidden), so both counts hold still. What moves
    // is the row's updated_at: media_set_updated_at stamps every write, a status flip included.
    expect(
      hostEtag({
        ...base,
        newestUpdatedAt: "2026-09-23T12:01:00.000000+00:00",
      }),
    ).not.toBe(hostEtag(base));
  });

  it("moves when an arrival and a removal cancel in the counts", () => {
    // One in, one out between two polls: the album count is back where it was, but the arrival is
    // the newest write, so a hash of the counts alone would 304 a stale album here.
    expect(
      hostEtag({
        ...base,
        newestUpdatedAt: "2026-09-23T12:02:00.000000+00:00",
      }),
    ).not.toBe(hostEtag(base));
  });

  it("moves when something lands in Review, which the doorbell never reports", () => {
    // The doorbell trigger fires only on APPROVED-VISIBLE changes, so on a
    // moderated event a held upload wakes nobody. This is the only signal the
    // host gets, and a hash that dropped `pending` would silently remove it.
    expect(hostEtag({ ...base, pending: 1 })).not.toBe(hostEtag(base));
  });

  it("hashes an empty event, and moves when its first photograph lands", () => {
    const empty = {
      eventId: "e1",
      album: 0,
      pending: 0,
      newestUpdatedAt: null,
    };
    expect(hostEtag(empty)).toBe(hostEtag({ ...empty }));
    expect(
      hostEtag({ ...empty, album: 1, newestUpdatedAt: base.newestUpdatedAt }),
    ).not.toBe(hostEtag(empty));
  });

  it("never validates across two events", () => {
    expect(hostEtag({ ...base, eventId: "e2" })).not.toBe(hostEtag(base));
  });

  it("carries a version prefix, quoted and strong", () => {
    const tag = hostEtag(base);
    // h2: the shape moved from the item list to the counts, so an h1 validator a tab still
    // holds can never match (it cannot anyway, being a hash of different input; the prefix says so).
    expect(tag.startsWith('"h2-')).toBe(true);
    expect(tag.endsWith('"')).toBe(true);
    expect(tag.startsWith("W/")).toBe(false);
  });

  it("cannot be confused with the guest gallery's validator", () => {
    // Different prefixes, so a client holding one can never 304 the other's
    // route even if a future refactor let the two cross paths.
    expect(hostEtag(base).startsWith('"g1-')).toBe(false);
  });
});

describe("the live route", () => {
  it("re-verifies the caller rather than trusting the cookie", () => {
    const src = code(ROUTE);
    expect(/supabase\.auth\.getUser\(\)/.test(src)).toBe(true);
    expect(
      /getSession\(/.test(src),
      "authorised from a cookie rather than from a check",
    ).toBe(false);
  });

  it("reads the event through the RLS-scoped query, never by host_id in a filter", () => {
    const src = code(ROUTE);
    expect(/getEvent\(/.test(src)).toBe(true);
    expect(
      /host_id/.test(src),
      "the route started deciding ownership itself instead of letting RLS answer",
    ).toBe(false);
  });

  it("answers 304 when nothing moved", () => {
    const src = code(ROUTE);
    expect(/If-None-Match|if-none-match/.test(src)).toBe(true);
    expect(/304/.test(src)).toBe(true);
  });

  it("presigns nothing", () => {
    // The whole point of this route is that it is cheap: the expensive work —
    // a dozen queries and three presigns an item — belongs to the page render it
    // triggers, and only when something actually changed.
    const src = code(ROUTE);
    expect(/presign/i.test(src)).toBe(false);
  });

  it("counts the album and lists none of it", () => {
    // A list read ends at PostgREST's 1,000 rows, so a validator built from one
    // stops seeing an album's oldest photographs; counts and a one-row read never
    // do, and cost the same at any size (the 1,000-row round).
    const src = code(ROUTE);
    expect(
      /readAlbumCounts\(/.test(src) && /readNewestAlbumUpdate\(/.test(src),
    ).toBe(true);
    expect(
      /listEventMedia|readEventMedia/.test(src),
      "the poll went back to reading the album to hash it",
    ).toBe(false);
  });

  it("is never cached", () => {
    const src = code(ROUTE);
    expect(/force-dynamic/.test(src)).toBe(true);
  });
});
