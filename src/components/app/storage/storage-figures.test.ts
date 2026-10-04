/**
 * THE STORAGE CHART'S ARITHMETIC (trash-in-storage): her plan's cap holds her albums and her Deleted together, so the
 * ring, the bar and the one sentence under it read the two as one figure against the cap, drawn apart; and amber
 * means what an upload must fit beside nears the cap, which her setting, Make room from Deleted, decides. Words are
 * read for their facts (a figure, the act they name), never their phrasing.
 */
import { describe, expect, it } from "vitest";

import { formatBytesUp } from "@/lib/billing/storage-guard";
import { GIGABYTE } from "@/lib/constants/tiers";

import {
  formatStored,
  makeRoomFrom,
  readStorage,
  roomRefusalWords,
  storageHeadline,
  storageNote,
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
  it("is on unless she turned it off, as a row from before the column reads", () => {
    expect(makeRoomFrom(null)).toBe(true);
    expect(makeRoomFrom(undefined)).toBe(true);
    expect(makeRoomFrom({ tier: "pro" })).toBe(true);
    expect(makeRoomFrom({ make_room_from_deleted: true })).toBe(true);
    expect(makeRoomFrom({ make_room_from_deleted: false })).toBe(false);
    // Anything but a boolean is the column's default, never a guess at "off".
    expect(makeRoomFrom({ make_room_from_deleted: "false" })).toBe(true);
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
