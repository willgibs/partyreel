import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  DRIVE_ROOT_FOLDER_NAME,
  driveContentType,
  driveFileDescription,
  driveFileExt,
  driveFileName,
  driveFileStem,
  driveFolderName,
  driveModifiedTime,
  driveMoment,
  driveSender,
} from "./drive-names";

describe("the album's folder", () => {
  it("says its name and its day, and an undated album its name alone", () => {
    expect(
      driveFolderName({ name: "Maya & Jay", eventDate: "2026-09-12" }),
    ).toBe("Maya & Jay · 12 Sep 2026");
    expect(driveFolderName({ name: "Maya & Jay" })).toBe("Maya & Jay");
    expect(
      driveFolderName({ name: "Maya & Jay", eventDate: "not a day" }),
    ).toBe("Maya & Jay");
  });

  it("says a range in the fewest words that stay exact", () => {
    expect(
      driveFolderName({
        name: "Lake week",
        eventDate: "2026-07-14",
        endDate: "2026-07-20",
      }),
    ).toBe("Lake week · 14–20 Jul 2026");
    expect(
      driveFolderName({
        name: "Fest",
        eventDate: "2026-06-30",
        endDate: "2026-07-02",
      }),
    ).toBe("Fest · 30 Jun – 2 Jul 2026");
    expect(
      driveFolderName({
        name: "NYE",
        eventDate: "2025-12-30",
        endDate: "2026-01-02",
      }),
    ).toBe("NYE · 30 Dec 2025 – 2 Jan 2026");
    // An end on or before the start is one day.
    expect(
      driveFolderName({
        name: "Gig",
        eventDate: "2026-07-14",
        endDate: "2026-07-14",
      }),
    ).toBe("Gig · 14 Jul 2026");
  });

  it("never carries a character a file system refuses, and is never empty", () => {
    expect(driveFolderName({ name: "A/B: C?*" })).toBe("A-B- C--");
    expect(driveFolderName({ name: "   " })).toBe("Album");
    expect(driveFolderName({ name: "Trailing dots..." })).toBe("Trailing dots");
    expect(driveFolderName({ name: "x".repeat(300) }).length).toBe(120);
  });

  it("lands under one Partyreel folder", () => {
    expect(DRIVE_ROOT_FOLDER_NAME).toBe("Partyreel");
  });
});

describe("a file's name: when, then who", () => {
  const arrivedAt = "2026-09-13T01:14:05Z";

  it("says the moment in her own zone, then who sent it", () => {
    expect(
      driveFileStem({ arrivedAt, tz: "America/New_York", who: "Priya" }),
    ).toBe("2026-09-12 21.14.05 · Priya");
    expect(driveFileStem({ arrivedAt, tz: "UTC", who: null })).toBe(
      "2026-09-13 01.14.05",
    );
  });

  it("falls back to UTC for a zone her browser sent badly", () => {
    expect(driveFileStem({ arrivedAt, tz: "Mars/Olympus", who: null })).toBe(
      "2026-09-13 01.14.05",
    );
  });

  it("takes a capture time the moment one is known, and Drive's modifiedTime follows the name", () => {
    const capturedAt = "2026-09-12T20:00:00Z";
    expect(driveMoment({ arrivedAt, capturedAt })).toBe(capturedAt);
    expect(driveMoment({ arrivedAt, capturedAt: null })).toBe(arrivedAt);
    expect(
      driveFileStem({ arrivedAt, capturedAt, tz: "UTC", who: "Sam" }),
    ).toBe("2026-09-12 20.00.00 · Sam");
    expect(driveModifiedTime({ arrivedAt, capturedAt })).toBe(
      "2026-09-12T20:00:00.000Z",
    );
    expect(driveModifiedTime({ arrivedAt })).toBe("2026-09-13T01:14:05.000Z");
  });

  it("cleans a sender's name for a file system and never prints an address shape as a path", () => {
    expect(driveSender("Ana/Bo")).toBe("Ana-Bo");
    expect(driveSender("  ")).toBeNull();
    expect(driveSender(null)).toBeNull();
  });

  it("keeps the original's own extension, or its kind's, and tells Drive its type", () => {
    expect(
      driveFileExt({ originalKey: "events/e/originals/m.heic", type: "photo" }),
    ).toBe("heic");
    expect(
      driveFileExt({ originalKey: "events/e/originals/m", type: "video" }),
    ).toBe("mp4");
    expect(driveContentType("mov", "video")).toBe("video/quicktime");
    expect(driveContentType("zzz", "photo")).toBe("image/jpeg");
  });

  it("describes the file in one line", () => {
    expect(
      driveFileDescription({
        who: "Sam",
        albumName: "Garden party",
        arrivedAt: "2026-10-03T21:14:00Z",
        tz: "UTC",
      }),
    ).toBe("From Sam at Garden party, 3 Oct 2026, 21:14. Sent from Partyreel.");
    expect(
      driveFileDescription({
        who: null,
        albumName: "Garden party",
        arrivedAt: "2026-10-03T21:14:00Z",
        tz: "UTC",
      }),
    ).toBe("From Garden party, 3 Oct 2026, 21:14. Sent from Partyreel.");
  });
});

describe("the ordinal, assigned in SQL and mirrored here", () => {
  const sql = readFileSync(
    join(
      process.cwd(),
      "supabase",
      "migrations",
      "20261005120000_cloud_export.sql",
    ),
    "utf8",
  );
  const start = sql.indexOf("create function public.cloud_export_name_items(");
  const body = sql.slice(start, sql.indexOf("$$;", start));

  it("builds the name exactly as driveFileName does", () => {
    expect(body).toContain(
      "v_name := v_stem || case when v_n = 1 then '' else ' (' || v_n || ')' end || '.' || v_ext;",
    );
    expect(driveFileName("2026-09-12 21.14.05 · Priya", "jpg", 1)).toBe(
      "2026-09-12 21.14.05 · Priya.jpg",
    );
    expect(driveFileName("2026-09-12 21.14.05 · Priya", "jpg", 2)).toBe(
      "2026-09-12 21.14.05 · Priya (2).jpg",
    );
  });

  it("counts against the album's folder on the connection, never against the same original sent again", () => {
    expect(body).toContain("oj.connection_id = v_lease.connection_id");
    expect(body).toContain("oj.event_id is not distinct from v_job.event_id");
    expect(body).toContain("oi.media_id <> v_media");
    // Under the connection's lock, so two lanes never pick one name.
    expect(
      body.indexOf(
        "from public.cloud_connections c where c.id = v_lease.connection_id for update",
      ),
    ).toBeLessThan(body.indexOf("v_n := 1;"));
  });
});
