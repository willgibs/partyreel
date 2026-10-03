/**
 * TAKING PHOTOS HOME, AS RULES (take-home r1, Will's desk on build 45: `guest=select`, `save=light`, `host=two`).
 * Pure and client-safe: what a Save hands a phone, how it is packed into the phone's own share sheets, and the two
 * sizes every choice shows. The engine that drives it is `components/app/export/take-home-save.ts`; the server's
 * half (the links, minted per Save) is `take-home.server.ts`.
 *
 *  - `save=light`: a phone's Save puts her picks into Photos at PHONE SIZE through the share sheet (a photograph's
 *    2048 px copy, else its original; a clip as taken), while the originals stay one zip in Files. Each choice shows
 *    its size ("24 photos · 15 MB" beside "Originals · 72 MB"), so Files reads as the full-quality path (his note:
 *    "otherwise it's easy to assume it's the same quality and only a path selection").
 *  - `host=two`: Originals to keep, Phone size to post tonight: phone size is the photographs (the panel's own
 *    "196 photos · 108 MB · 2048 px"); clips come as they were taken, with the originals.
 *  - The board's carried `sheet`: one share sheet carries up to 100 MB (`SHARE_FILE_MAX_BYTES`, the product's line
 *    for a big file); past it a Save goes in parts, a tap each, the way a big zip already comes home in parts.
 */
import {
  type ExportSummary,
  MAX_EXPORT_ITEMS,
} from "@/lib/export/build-manifest";
import { formatCount } from "@/lib/format/count";
import {
  canShareFileNamed,
  detectPlatform,
  type NavigatorLike,
  SHARE_FILE_MAX_BYTES,
} from "@/lib/media/share-save";
import { formatBytes } from "@/lib/utils";

/** One file a Save hands the phone: where its bytes are, the name it travels under, what it weighs. */
export type SaveItem = {
  id: string;
  type: "photo" | "video";
  /** A presigned GET (attachment-named, so the same link also downloads it plainly). */
  url: string;
  name: string;
  bytes: number;
};

/** The most one Save asks for: one zip's own ceiling, so a set that fits a zip fits a Save. */
export const SAVE_MAX_ITEMS = MAX_EXPORT_ITEMS;

/** What one share sheet carries at most (the board's carried `sheet`). */
export const SHEET_BYTES = SHARE_FILE_MAX_BYTES;

/**
 * THE SHEETS A SAVE NEEDS: its files in order, packed whole into sheets of at most `max` bytes (a file is never
 * split). A file heavier than a whole sheet can never ride one (`fetchMediaFile` stops at the line), so it comes
 * back `loose`: the engine downloads it plainly instead.
 */
export function packSheets<T extends { bytes: number }>(
  items: readonly T[],
  max: number = SHEET_BYTES,
): { sheets: T[][]; loose: T[] } {
  const sheets: T[][] = [];
  const loose: T[] = [];
  let sheet: T[] = [];
  let bytes = 0;
  for (const item of items) {
    if (item.bytes > max) {
      loose.push(item);
      continue;
    }
    if (sheet.length > 0 && bytes + item.bytes > max) {
      sheets.push(sheet);
      sheet = [];
      bytes = 0;
    }
    sheet.push(item);
    bytes += item.bytes;
  }
  if (sheet.length > 0) sheets.push(sheet);
  return { sheets, loose };
}

/** A set's two sizes, read off a summary: how many, as taken, and at phone size. */
export type TakeHomeSizes = {
  photos: number;
  clips: number;
  /** Every item as taken: what the originals' zip holds. */
  original: number;
  /** Every item at phone size: a photograph's copy (else its original), a clip as taken. */
  phone: number;
  /** The photographs alone at phone size: a host's Phone size set. */
  photosPhone: number;
  /** The clips alone, as taken (a clip's size is the same at both). */
  clipBytes: number;
};

export function takeHomeSizes(
  summary: ExportSummary,
  includeHidden = false,
): TakeHomeSizes {
  const photo = includeHidden
    ? add(summary.shown.photo, summary.hidden.photo)
    : summary.shown.photo;
  const video = includeHidden
    ? add(summary.shown.video, summary.hidden.video)
    : summary.shown.video;
  return {
    photos: photo.count,
    clips: video.count,
    original: photo.bytes + video.bytes,
    phone: photo.phone + video.phone,
    photosPhone: photo.phone,
    clipBytes: video.bytes,
  };
}

type Bucket = ExportSummary["shown"]["photo"];
const add = (a: Bucket, b: Bucket): Bucket => ({
  count: a.count + b.count,
  bytes: a.bytes + b.bytes,
  phone: a.phone + b.phone,
});

/** "24 photos", "1 photo", "26 photos & videos", "2 videos": a set in the album's own words. */
export function setNoun(photos: number, clips: number): string {
  if (photos > 0 && clips > 0) {
    return `${formatCount(photos + clips)} photos & videos`;
  }
  if (clips > 0)
    return clips === 1 ? "1 video" : `${formatCount(clips)} videos`;
  return photos === 1 ? "1 photo" : `${formatCount(photos)} photos`;
}

/**
 * THE TWO CHOICES' HINTS, SIZES BESIDE THEM (his `save=light` note): what goes into Photos ("24 photos · 15 MB")
 * and what the originals' zip weighs ("Originals · 72 MB"), so the heavier one reads as the full-quality path.
 */
export function saveHints(sizes: TakeHomeSizes): {
  photos: string;
  originals: string;
} {
  return {
    photos: `${setNoun(sizes.photos, sizes.clips)} · ${formatBytes(sizes.phone)}`,
    originals: `Originals · ${formatBytes(sizes.original)}`,
  };
}

/**
 * Whether this device's own sheet can take her photographs: a phone (an iPhone's sheet holds Save Images, the web's
 * one way into Photos; an Android's hands them to its photo apps) whose sheet takes a JPEG. A desk, or a phone browser
 * whose sheet takes no file, saves the originals' zip instead.
 */
export function sheetCanSave(nav: NavigatorLike): boolean {
  return (
    detectPlatform(nav) !== "desktop" && canShareFileNamed("photo.jpg", nav)
  );
}
