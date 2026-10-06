/**
 * A PHOTOGRAPH'S CAPTURE TIME, ONE HOME (`capture-time.ts`; Will's X7, 2026-10-05: "keep the capture time, never the
 * place or device"): what instant a stamp names, the claim the uploader sends, and the server's word on it, the
 * bounds' one home. Every case fails on the code before the lane (none of it existed: no capture time was kept).
 */
import { describe, expect, it } from "vitest";

import {
  acceptCaptureTime,
  CAPTURE_TIME_AHEAD_MS,
  CAPTURE_TIME_FLOOR_MS,
  captureClaim,
  captureInstant,
} from "./capture-time";

const at = (iso: string) => Date.parse(iso);

describe("the instant a stamp names", () => {
  it("reads an Exif wall clock in the zone the camera wrote beside it", () => {
    expect(
      captureInstant({
        kind: "wall",
        wall: "2026:10:03 21:14:05",
        offset: "-04:00",
      }),
    ).toBe(at("2026-10-04T01:14:05Z"));
    expect(
      captureInstant({
        kind: "wall",
        wall: "2026:10:04 06:44:05",
        offset: "+05:30",
      }),
    ).toBe(at("2026-10-04T01:14:05Z"));
  });

  it("reads a wall clock with no zone in the uploader's own (this runtime's), never as UTC", () => {
    // The browser's zone is the one the uploader is in; the runtime's own local reading is that rule's definition.
    expect(
      captureInstant({
        kind: "wall",
        wall: "2026:10:03 21:14:05",
        offset: null,
      }),
    ).toBe(new Date(2026, 9, 3, 21, 14, 5).getTime());
  });

  it("takes a container's instant as it is", () => {
    expect(
      captureInstant({ kind: "instant", ms: at("2026-10-04T01:14:05Z") }),
    ).toBe(at("2026-10-04T01:14:05Z"));
  });

  it("names none for nothing, a shape it does not know, a year a Date cannot read as written, or no instant at all", () => {
    expect(captureInstant(null)).toBeNull();
    expect(captureInstant(undefined)).toBeNull();
    expect(
      captureInstant({
        kind: "wall",
        wall: "2026-10-03 21:14:05",
        offset: null,
      }),
    ).toBeNull();
    // Year 0099 would read as 1999 through Date.UTC: it names none instead.
    expect(
      captureInstant({
        kind: "wall",
        wall: "0099:01:01 00:00:00",
        offset: "+00:00",
      }),
    ).toBeNull();
    expect(captureInstant({ kind: "instant", ms: Number.NaN })).toBeNull();
    expect(captureInstant({ kind: "instant", ms: 9e15 })).toBeNull();
  });

  it("reads a malformed zone as none, never as a shifted instant", () => {
    expect(
      captureInstant({
        kind: "wall",
        wall: "2026:10:03 21:14:05",
        offset: "+0400",
      }),
    ).toBe(new Date(2026, 9, 3, 21, 14, 5).getTime());
  });
});

describe("the claim the uploader sends", () => {
  it("is the instant as the ISO string the server reads, and nothing for a file that said nothing", () => {
    expect(
      captureClaim({
        kind: "wall",
        wall: "2026:10:03 21:14:05",
        offset: "-04:00",
      }),
    ).toBe("2026-10-04T01:14:05.000Z");
    expect(captureClaim({ kind: "instant", ms: 1791076445000 })).toBe(
      "2026-10-04T01:14:05.000Z",
    );
    expect(captureClaim(undefined)).toBeUndefined();
    expect(captureClaim({ kind: "instant", ms: 9e15 })).toBeUndefined();
  });

  it("judges nothing: an absurd instant is still the file's word, for the server to drop", () => {
    expect(captureClaim({ kind: "instant", ms: 0 })).toBe(
      "1970-01-01T00:00:00.000Z",
    );
  });
});

describe("the server's word on a claim (the bounds' one home)", () => {
  const now = at("2026-10-05T12:00:00Z");

  it("keeps a claim inside the bounds, as the instant the column stores", () => {
    expect(acceptCaptureTime("2026-10-04T01:14:05.000Z", now)).toBe(
      "2026-10-04T01:14:05.000Z",
    );
    expect(acceptCaptureTime("2026-10-04T01:14:05Z", now)).toBe(
      "2026-10-04T01:14:05.000Z",
    );
    // A throwback is a capture time like any other, as long as a camera could have stamped it.
    expect(acceptCaptureTime("1995-06-01T12:00:00.000Z", now)).toBe(
      "1995-06-01T12:00:00.000Z",
    );
  });

  it("★ drops a lie past now plus a day: the arrival stands", () => {
    const edge = new Date(now + CAPTURE_TIME_AHEAD_MS).toISOString();
    expect(acceptCaptureTime(edge, now)).toBe(edge);
    expect(
      acceptCaptureTime(
        new Date(now + CAPTURE_TIME_AHEAD_MS + 1000).toISOString(),
        now,
      ),
    ).toBeNull();
    expect(acceptCaptureTime("2099-12-31T23:59:59.000Z", now)).toBeNull();
  });

  it("★ drops the absurdly old: before 1990, the reset clocks' 1904, 1970 and 1980 among it", () => {
    expect(CAPTURE_TIME_FLOOR_MS).toBe(at("1990-01-01T00:00:00Z"));
    expect(acceptCaptureTime("1990-01-01T00:00:00.000Z", now)).toBe(
      "1990-01-01T00:00:00.000Z",
    );
    for (const old of [
      "1989-12-31T23:59:59.999Z",
      "1980-01-01T00:00:00.000Z",
      "1970-01-01T00:00:00.000Z",
      "1904-01-01T00:00:00.000Z",
    ]) {
      expect(acceptCaptureTime(old, now), old).toBeNull();
    }
  });

  it("drops anything that is not a real instant in the claim's one shape, and never throws", () => {
    for (const bad of [
      undefined,
      null,
      1791076445000,
      true,
      {},
      [],
      "",
      "yesterday",
      "2026-10-04",
      "2026-10-04 01:14:05",
      "2026-10-04T01:14:05+02:00",
      "2026-10-04T01:14:05.0000001Z",
      "2026-02-30T10:00:00.000Z",
      "2026-10-03T24:00:00.000Z",
      "2026-13-01T10:00:00.000Z",
      "infinity",
      " 2026-10-04T01:14:05.000Z",
      "2026-10-04T01:14:05.000Z\n",
    ]) {
      expect(acceptCaptureTime(bad, now), JSON.stringify(bad)).toBeNull();
    }
  });
});
