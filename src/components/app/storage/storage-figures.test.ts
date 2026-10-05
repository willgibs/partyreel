/**
 * THE STORAGE CHART'S ARITHMETIC (trash-in-storage): her plan's cap holds her albums and her Deleted together, so the
 * ring, the bar and the one sentence under it read the two as one figure against the cap, drawn apart; and amber
 * means what an upload must fit beside nears the cap, which her setting, Make room from Deleted, decides. Words are
 * read for their facts (a figure, the act they name), never their phrasing.
 */
import { describe, expect, it } from "vitest";

import { formatBytesUp } from "@/lib/billing/storage-guard";
import { GIGABYTE, MEGABYTE, planById } from "@/lib/constants/tiers";

import {
  formatStored,
  makeRoomFrom,
  readStorage,
  readUploads,
  roomRefusalWords,
  storageHeadline,
  storageNote,
  uploadsLine,
  uploadsPausedWords,
  type StorageFigures,
} from "./storage-figures";

const CAP = 100 * GIGABYTE;
const figures = (over: Partial<StorageFigures>): StorageFigures => ({
  activeBytes: 0,
  deletedBytes: 0,
  capBytes: CAP,
  makeRoom: true,
  ...over,
});

describe("her setting, read off her profile", () => {
  // Reshaped on purpose at the types' regeneration (2026-10-04): the column is NOT NULL and typed boolean, so the two
  // cases for a row from before it and for a value that was not a boolean expired with the untyped seam. The scar
  // kept: no row to read is the column's default, on, never a guess at "off".
  it("is on unless she turned it off, and on with no row to read", () => {
    expect(makeRoomFrom(null)).toBe(true);
    expect(makeRoomFrom(undefined)).toBe(true);
    expect(makeRoomFrom({ make_room_from_deleted: true })).toBe(true);
    expect(makeRoomFrom({ make_room_from_deleted: false })).toBe(false);
  });
});

describe("the ring and the bar", () => {
  it("count her Deleted in what she stores, drawn apart from her albums", () => {
    const r = readStorage(
      figures({ activeBytes: 40 * GIGABYTE, deletedBytes: 10 * GIGABYTE }),
    );
    expect(r.storedBytes).toBe(50 * GIGABYTE);
    expect(r.ringPct).toBe(50);
    expect(r.albumsPct).toBeCloseTo(40);
    expect(r.deletedPct).toBeCloseTo(10);
    expect(r.over).toBe(false);
    expect(r.overBytes).toBe(0);
  });

  it("draws a full bar over the cap, the two still in proportion, and says by how much", () => {
    const r = readStorage(
      figures({ activeBytes: 90 * GIGABYTE, deletedBytes: 30 * GIGABYTE }),
    );
    expect(r.over).toBe(true);
    expect(r.overBytes).toBe(20 * GIGABYTE);
    expect(r.ringPct).toBe(100);
    expect(r.albumsPct + r.deletedPct).toBeCloseTo(100);
    expect(r.albumsPct / r.deletedPct).toBeCloseTo(3);
  });

  it("draws nothing against a plan with no cap on record", () => {
    const r = readStorage(
      figures({
        activeBytes: GIGABYTE,
        deletedBytes: GIGABYTE,
        capBytes: null,
      }),
    );
    expect(r).toMatchObject({
      storedBytes: 2 * GIGABYTE,
      ringPct: 0,
      over: false,
      warning: false,
    });
  });

  it("★ turns amber on what an upload must fit beside: her albums with the setting on, everything with it off", () => {
    // 70 GB kept and 30 GB in Deleted: full, but with the setting on an upload takes its room from Deleted.
    const full = { activeBytes: 70 * GIGABYTE, deletedBytes: 30 * GIGABYTE };
    expect(readStorage(figures({ ...full, makeRoom: true })).warning).toBe(
      false,
    );
    expect(readStorage(figures({ ...full, makeRoom: false })).warning).toBe(
      true,
    );
    // Her albums alone nearing the cap warn either way: Deleted cannot make that room.
    const kept = { activeBytes: 86 * GIGABYTE, deletedBytes: 0 };
    expect(readStorage(figures({ ...kept, makeRoom: true })).warning).toBe(
      true,
    );
  });
});

describe("the headline", () => {
  it("prints what she stores against the cap through the flow's one rounding", () => {
    expect(storageHeadline(Math.round(49.81 * GIGABYTE), "100 GB")).toBe(
      `${formatBytesUp(Math.round(49.81 * GIGABYTE))} of 100 GB`,
    );
    expect(storageHeadline(GIGABYTE, null)).toBe("1 GB stored");
  });

  it("prints nothing stored in the cap's own unit, never as bytes", () => {
    expect(formatStored(0, "100 GB")).toBe("0 GB");
    expect(formatStored(0, "100 MB")).toBe("0 MB");
    expect(formatStored(0, null)).toBe("0 GB");
    expect(storageHeadline(0, "100 GB")).toBe("0 GB of 100 GB");
  });
});

describe("the one sentence under the bar", () => {
  const note = (f: StorageFigures) => storageNote(f, readStorage(f));

  it("says nothing stored yet on an empty plan, and nothing at all with no cap", () => {
    expect(note(figures({}))).toMatch(/nothing stored/i);
    expect(note(figures({ capBytes: null, activeBytes: 1 }))).toBeNull();
  });

  it("over the plan, names the gap and the fix: Deleted's figure when Deleted holds it", () => {
    const withDeleted = note(
      figures({ activeBytes: 90 * GIGABYTE, deletedBytes: 30 * GIGABYTE }),
    );
    expect(withDeleted).toContain(formatBytesUp(20 * GIGABYTE));
    expect(withDeleted).toContain(formatBytesUp(30 * GIGABYTE));
    expect(withDeleted).toMatch(/Deleted/);

    const without = note(figures({ activeBytes: 120 * GIGABYTE }));
    expect(without).toContain(formatBytesUp(20 * GIGABYTE));
    expect(without).toMatch(/for good|bigger plan/);
  });

  it("near full with the setting off, points at Deleted's own figure", () => {
    const line = note(
      figures({
        activeBytes: 70 * GIGABYTE,
        deletedBytes: 20 * GIGABYTE,
        makeRoom: false,
      }),
    );
    expect(line).toContain(formatBytesUp(20 * GIGABYTE));
    expect(line).toMatch(/empty Deleted/i);
  });

  it("with room to spare, says only that Deleted counts, and what happens to it", () => {
    const on = note(
      figures({ activeBytes: 20 * GIGABYTE, deletedBytes: 5 * GIGABYTE }),
    );
    expect(on).toMatch(/Deleted counts/);
    expect(on).toMatch(/oldest/);
    const off = note(
      figures({
        activeBytes: 20 * GIGABYTE,
        deletedBytes: 5 * GIGABYTE,
        makeRoom: false,
      }),
    );
    expect(off).toMatch(/Deleted counts/);
    expect(off).toMatch(/30 days/);
    // Nothing in Deleted and room to spare: nothing to say.
    expect(note(figures({ activeBytes: 20 * GIGABYTE }))).toBeNull();
  });
});

describe("the owner's words when an upload won't fit", () => {
  const plain =
    "This file won't fit in your plan's storage. Free up space or upgrade.";

  it("keeps the plain sentence without the meter's numbers", () => {
    expect(roomRefusalWords({})).toBe(plain);
    expect(
      roomRefusalWords({
        neededBytes: null,
        deletedBytes: 5,
        makesRoom: false,
      }),
    ).toBe(plain);
    expect(
      roomRefusalWords({ neededBytes: 5, deletedBytes: 5, makesRoom: null }),
    ).toBe(plain);
  });

  it("with the setting on, any delete makes the room: the file need only fit beside her albums", () => {
    const line = roomRefusalWords({
      neededBytes: 2 * GIGABYTE,
      deletedBytes: 30 * GIGABYTE,
      makesRoom: true,
    });
    expect(line).toContain(formatBytesUp(2 * GIGABYTE));
    expect(line).toMatch(/albums/);
    expect(line).not.toMatch(/for good/);
  });

  it("with it off, names what Deleted holds and the two ways out when that is enough", () => {
    const line = roomRefusalWords({
      neededBytes: 2 * GIGABYTE,
      deletedBytes: 30 * GIGABYTE,
      makesRoom: false,
    });
    expect(line).toContain(formatBytesUp(2 * GIGABYTE));
    expect(line).toContain(formatBytesUp(30 * GIGABYTE));
    expect(line).toMatch(/empty it/);
    expect(line).toMatch(/Make room from Deleted/);
  });

  it("with it off and Deleted short of the room, says the rest must go for good", () => {
    const short = roomRefusalWords({
      neededBytes: 2 * GIGABYTE,
      deletedBytes: GIGABYTE,
      makesRoom: false,
    });
    expect(short).toMatch(/the rest for good/);
    const none = roomRefusalWords({
      neededBytes: 2 * GIGABYTE,
      deletedBytes: 0,
      makesRoom: false,
    });
    expect(none).toMatch(/for good/);
    expect(none).not.toMatch(/Deleted holds/);
  });
});

describe("the uploads line", () => {
  // The other counter (billing-caps.md: four counters, never reconciled): what her window has taken in uploads against
  // her plan's own published number. Words are read for their facts (a figure, the day), never their phrasing.
  const free = (monthUploadedBytes: number | null | undefined) =>
    readUploads({
      tier: "free",
      capBytes: planById("free").storageBytes,
      monthUploadedBytes,
    });

  it("reads Free's month against its own number, from tiers.ts", () => {
    const r = free(240 * MEGABYTE);
    expect(r).toEqual({
      usedBytes: 240 * MEGABYTE,
      allowanceBytes: planById("free").uploadsBytes,
      paused: false,
    });
  });

  it("reads Pro against its size's number: the smallest Ladder A size that holds her cap", () => {
    for (const id of ["pro_50", "pro_200", "pro_1tb"] as const) {
      const plan = planById(id);
      expect(
        readUploads({
          tier: "pro",
          capBytes: plan.storageBytes,
          monthUploadedBytes: GIGABYTE,
        })?.allowanceBytes,
      ).toBe(plan.uploadsBytes);
    }
  });

  it("★ is paused AT the line, as the upload advisories read it, and not a byte before", () => {
    const line = planById("free").uploadsBytes;
    expect(free(line - 1)?.paused).toBe(false);
    expect(free(line)?.paused).toBe(true);
    expect(free(4 * line)?.paused).toBe(true);
  });

  it("★ says nothing rather than a guess: no figure, a pass's year, a Pro with no cap on record", () => {
    // A failed read is null (never a zero that would say nothing is wrong); an older server's answer is absent.
    expect(free(null)).toBeNull();
    expect(free(undefined)).toBeNull();
    expect(free(Number.NaN)).toBeNull();
    expect(free(-1)).toBeNull();
    // A pass counts its own year on the pass; the month's ledger is not that figure.
    expect(
      readUploads({
        tier: "event_pass",
        capBytes: planById("event_pass").storageBytes,
        monthUploadedBytes: GIGABYTE,
      }),
    ).toBeNull();
    // Unmetered: a paid profile the webhook has not written a cap for fails open.
    expect(
      readUploads({
        tier: "pro",
        capBytes: null,
        monthUploadedBytes: GIGABYTE,
      }),
    ).toBeNull();
    // Nothing uploaded is a figure, and it reads.
    expect(free(0)).toMatchObject({ usedBytes: 0, paused: false });
  });

  it("prints the figure against the allowance through the plain rounding, never as bytes", () => {
    expect(uploadsLine(free(Math.round(1.2 * GIGABYTE))!)).toBe(
      "Uploads this month: 1.2 GB of 300 MB",
    );
    expect(uploadsLine(free(240 * MEGABYTE)!)).toBe(
      "Uploads this month: 240 MB of 300 MB",
    );
    // Nothing uploaded reads in the allowance's own unit.
    expect(uploadsLine(free(0)!)).toBe("Uploads this month: 0 MB of 300 MB");
    const pro = readUploads({
      tier: "pro",
      capBytes: planById("pro_200").storageBytes,
      monthUploadedBytes: 0,
    })!;
    expect(uploadsLine(pro)).toBe("Uploads this month: 0 GB of 200 GB");
  });

  it("at the line, names what pauses, the day it resumes and that a delete gives nothing back", () => {
    const words = uploadsPausedWords(new Date("2026-10-15T12:00:00Z"));
    expect(words).toMatch(/new uploads/i);
    expect(words).toMatch(/guests/);
    expect(words).toContain("November 1");
    expect(words).toMatch(/deleting/i);
    // The month turns at UTC midnight and a year turns with it.
    expect(uploadsPausedWords(new Date("2026-12-31T23:30:00Z"))).toContain(
      "January 1",
    );
  });
});
