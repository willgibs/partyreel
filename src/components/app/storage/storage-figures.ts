/**
 * THE STORAGE CHART'S ARITHMETIC AND ITS WORDS, pure (trash-in-storage, Will 2026-10-03: "Storage visual chart can
 * show used vs delete separately, and maybe an account setting toggle to auto-delete trash if needed by FIFO"). Her
 * plan's cap holds her albums and her Deleted together, so the chart is one bar against the cap with the two drawn
 * apart, and every sentence on it reads off these few functions, never a second opinion about the same bytes.
 *
 * The bytes are the server's (`host_storage_summary`, through `getHostStorageSummary`), printed through the storage
 * flow's one rounding (`formatBytesUp`) so a figure here reads as the plan's refusal and the size list read it.
 */
import { formatBytesUp } from "@/lib/billing/storage-guard";
import type { Tables } from "@/lib/db/types";

/** The share of the cap past which the ring and the chart turn amber: near enough that it matters. */
export const NEAR_FULL = 0.85;

/**
 * HER SETTING, Make room from Deleted, read off her profile row (`profiles.make_room_from_deleted`, 20261003220000,
 * NOT NULL and on by default): on unless she turned it off, and on when there is no row to read (the column's
 * default, never a guess at "off").
 */
export function makeRoomFrom(
  profile:
    | Pick<Tables<"profiles">, "make_room_from_deleted">
    | null
    | undefined,
): boolean {
  return profile?.make_room_from_deleted ?? true;
}

export type StorageFigures = {
  activeBytes: number;
  deletedBytes: number;
  /** The plan's cap; null for a plan with no cap on record (nothing to draw against). */
  capBytes: number | null;
  /** Her setting: an upload that needs room takes it from Deleted, oldest first. */
  makeRoom: boolean;
};

export type StorageReading = {
  storedBytes: number;
  /** Each segment's share of the bar, 0 to 100; together never past 100 (an over-cap account draws a full bar). */
  albumsPct: number;
  deletedPct: number;
  /** What she stores as a share of her cap, rounded, for the ring (capped at 100). */
  ringPct: number;
  over: boolean;
  /** Bytes past the cap, 0 when within it. */
  overBytes: number;
  /** Amber: what an upload must fit beside is near the cap (Deleted that makes room never counts toward it). */
  warning: boolean;
};

/** The chart and the ring, read once. */
export function readStorage(f: StorageFigures): StorageReading {
  const storedBytes = f.activeBytes + f.deletedBytes;
  const cap = f.capBytes;
  if (!cap || cap <= 0) {
    return {
      storedBytes,
      albumsPct: 0,
      deletedPct: 0,
      ringPct: 0,
      over: false,
      overBytes: 0,
      warning: false,
    };
  }
  const scale = Math.max(cap, storedBytes);
  // The line an upload meets: what she keeps, less Deleted while her setting lets an upload make room from it
  // (`host_room_used`). Amber is that line nearing the cap, never Deleted that would make way on its own.
  const holding = f.makeRoom ? f.activeBytes : storedBytes;
  return {
    storedBytes,
    albumsPct: (f.activeBytes / scale) * 100,
    deletedPct: (f.deletedBytes / scale) * 100,
    ringPct: Math.min(100, Math.round((storedBytes / cap) * 100)),
    over: storedBytes > cap,
    overBytes: Math.max(0, storedBytes - cap),
    warning: holding >= cap * NEAR_FULL,
  };
}

/**
 * A stored figure through the storage flow's one rounding, and nothing in the cap's own unit: "0 GB of 100 GB" on
 * Pro, "0 MB of 100 MB" on Free, never "0 B", which reads as a unit nobody stores in.
 */
export function formatStored(bytes: number, capLabel: string | null): string {
  if (bytes > 0) return formatBytesUp(bytes);
  return `0 ${capLabel?.split(" ").at(-1) ?? "GB"}`;
}

/** "4.2 GB of 100 GB", or "4.2 GB stored" with no cap to read against. */
export function storageHeadline(
  storedBytes: number,
  capLabel: string | null,
): string {
  const stored = formatStored(storedBytes, capLabel);
  return capLabel ? `${stored} of ${capLabel}` : `${stored} stored`;
}

/**
 * The one sentence under the bar, only when there is something to know or to do (null otherwise): over the plan, near
 * it, or Deleted taking room she may not expect. Each names its fix (the bible's third: a problem arrives with its fix).
 */
export function storageNote(
  f: StorageFigures,
  r: StorageReading,
): string | null {
  if (f.capBytes === null) return null;
  if (r.storedBytes === 0) return "Nothing stored yet.";
  if (r.over) {
    return f.deletedBytes > 0
      ? `Over your plan by ${formatBytesUp(r.overBytes)}. Emptying Deleted frees ${formatBytesUp(f.deletedBytes)}.`
      : `Over your plan by ${formatBytesUp(r.overBytes)}. Delete something for good, or choose a bigger plan.`;
  }
  if (r.warning) {
    return f.deletedBytes > 0 && !f.makeRoom
      ? `Almost full. Deleted holds ${formatBytesUp(f.deletedBytes)} of it: empty Deleted to make room.`
      : "Almost full. Delete something for good, or choose a bigger plan.";
  }
  if (f.deletedBytes > 0) {
    return f.makeRoom
      ? "Deleted counts toward your plan. When an upload needs room, its oldest items go first."
      : "Deleted counts toward your plan until it's emptied, or each item's 30 days are up.";
  }
  return null;
}

/** The setting's own words, one line beneath its label. */
export const MAKE_ROOM_LABEL = "Make room from Deleted";
export const MAKE_ROOM_HINT =
  "When an upload needs room, the oldest items in Deleted are deleted for good first.";

/**
 * THE OWNER'S WORDS WHEN AN UPLOAD WON'T FIT (the presign's meter, `meter_upload`'s numbers): the room the file needs and
 * the one way she can make it, which her setting decides. On, Deleted makes room at the upload, so the file only has
 * to fit beside her albums, and any delete helps; off, Deleted holds its bytes until it is emptied. Without the numbers
 * (a database before 20261003220000) the plain sentence stands. Never a guest's: hers name the album, never the plan.
 */
export function roomRefusalWords(refusal: {
  neededBytes?: number | null;
  deletedBytes?: number | null;
  makesRoom?: boolean | null;
}): string {
  const { neededBytes: needed, deletedBytes: deleted, makesRoom } = refusal;
  if (needed == null || !(needed > 0) || makesRoom == null) {
    return "This file won't fit in your plan's storage. Free up space or upgrade.";
  }
  const room = formatBytesUp(needed);
  if (makesRoom) {
    return `This file needs ${room} more room than your albums leave. Delete something, or upgrade.`;
  }
  if (deleted != null && deleted > 0) {
    const held = formatBytesUp(deleted);
    return deleted >= needed
      ? `This file needs ${room} more room. Deleted holds ${held}: empty it, or turn on Make room from Deleted.`
      : `This file needs ${room} more room. Deleted holds ${held}: empty it and delete the rest for good, or upgrade.`;
  }
  return `This file needs ${room} more room. Delete something for good, or upgrade.`;
}
