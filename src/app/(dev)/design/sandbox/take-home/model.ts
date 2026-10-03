/**
 * WHAT EACH WAY HOME CARRIES, IN THIS ALBUM'S NUMBERS: one home for every size,
 * count and part the drawings print, so a menu's row, a sheet's header and a
 * toast can never say two sizes for one set. Pure, and tested
 * (`model.test.ts`).
 *
 * ★ THE BYTES ARE A REAL PHONE'S. An original photograph is what Will's iPhone's
 * camera app wrote on 2026-10-02 (12.2 MP, 2.9 MB; the orchestrator's walk
 * notes). Phone size is that photograph at 2048 px on its long side as a JPEG:
 * a quarter of its pixels at a lighter quality, about a fifth of its bytes. A
 * party clip is about fifteen seconds at 1080p, and phone size leaves a clip as
 * it was taken (the board's carried call `made`), so a clip weighs the same in
 * both sets.
 *
 * ★ ONE SHEET CARRIES UP TO 100 MB (the carried call `sheet`): the line the
 * product already treats as a big file (`SHARE_FILE_MAX_BYTES`, the multipart
 * line). Past it a Save goes in parts, a tap each, the way a big zip already
 * comes home in parts (uploads-and-r2.md "Download all").
 */

export const MB = 1024 * 1024;

/** An original photograph, as a phone's camera app writes it. */
export const PHOTO_ORIGINAL = 2.9 * MB;
/** The same photograph at phone size: 2048 px on its long side. */
export const PHOTO_PHONE = 0.55 * MB;
/** A party clip, about 15 s at 1080p, as taken (phone size leaves a clip as it is). */
export const CLIP = 22 * MB;
/** The long side of a phone-size photograph, in pixels. */
export const PHONE_EDGE = 2048;
/** An original photograph's pixels (the 12.2 MP camera's 4:3). */
export const ORIGINAL_PX = { w: 4032, h: 3024 } as const;

/** What one share sheet carries at most. */
export const SHEET_BYTES = 100 * MB;

export type Size = "original" | "phone";

/** A set of photographs and clips, by count. */
export type Take = { readonly photos: number; readonly clips: number };

/** The whole album: Maya and Jay's 214. */
export const ALBUM_TAKE: Take = { photos: 196, clips: 18 };

/** How many items a take holds. */
export const countOf = (t: Take): number => t.photos + t.clips;

/** A take's bytes at a size. */
export function bytesOf(t: Take, size: Size): number {
  const photo = size === "phone" ? PHOTO_PHONE : PHOTO_ORIGINAL;
  return t.photos * photo + t.clips * CLIP;
}

/**
 * THE SHEETS A TAKE NEEDS ON A PHONE: its files in the album's order
 * (photographs first, then clips), packed whole into sheets of at most
 * `SHEET_BYTES`; a file is never split. Returns how many files each sheet
 * carries, first to last.
 */
export function sheetsOf(t: Take, size: Size): number[] {
  const photo = size === "phone" ? PHOTO_PHONE : PHOTO_ORIGINAL;
  const files = [
    ...Array.from({ length: t.photos }, () => photo),
    ...Array.from({ length: t.clips }, () => CLIP),
  ];
  const sheets: number[] = [];
  let bytes = 0;
  let count = 0;
  for (const f of files) {
    if (count > 0 && bytes + f > SHEET_BYTES) {
      sheets.push(count);
      bytes = 0;
      count = 0;
    }
    bytes += f;
    count += 1;
  }
  if (count > 0) sheets.push(count);
  return sheets;
}

/** The first sheet of a take on a phone: how many files it carries and what they weigh. */
export function firstSheet(
  t: Take,
  size: Size,
): { count: number; bytes: number } {
  const count = sheetsOf(t, size)[0] ?? 0;
  const photos = Math.min(count, t.photos);
  return {
    count,
    bytes: bytesOf({ photos, clips: count - photos }, size),
  };
}

/**
 * THE MOMENT A WAIT IS DRAWN AT: three seconds after Save, on a party's
 * network. 10 Mbps is a crowded venue's Wi-Fi or a busy cell, an assumption the
 * frame's own title states; every option is drawn at the same moment, so the
 * difference between two rings is the difference between their bytes.
 */
export const WAIT_SECONDS = 3;
export const PARTY_MBPS = 10;

/** The bytes a phone has received after `seconds` at `mbps`. */
export const receivedIn = (seconds: number, mbps: number): number =>
  (seconds * mbps * 1e6) / 8;

/** How far a wait for `bytes` has come at the drawn moment, 0 to 1. */
export const progressAt = (bytes: number): number =>
  bytes > 0 ? Math.min(1, receivedIn(WAIT_SECONDS, PARTY_MBPS) / bytes) : 1;

/** A phone-size photograph's pixels: the original's long side brought to `PHONE_EDGE`. */
export function phonePixels(): { w: number; h: number } {
  const k = PHONE_EDGE / Math.max(ORIGINAL_PX.w, ORIGINAL_PX.h);
  return {
    w: Math.round(ORIGINAL_PX.w * k),
    h: Math.round(ORIGINAL_PX.h * k),
  };
}

/**
 * THE SETS A GUEST TAKES HOME, BY THE WAY SHE TOOK THEM (the board's `guest`
 * question), so the next question (`save`) is drawn on the very selection her
 * way leads to: Download all's Everything, the 24 she selected, the 9 in her
 * tray, or the one photograph open in the viewer.
 */
export type GuestWay = "today" | "select" | "tray" | "viewer";

export const WAY_TAKE: Record<GuestWay, Take> = {
  today: ALBUM_TAKE,
  select: { photos: 24, clips: 0 },
  tray: { photos: 9, clips: 0 },
  viewer: { photos: 1, clips: 0 },
};

/** Her own uploads in the album (Yours): what Download all's Yours row and select mode's Yours count. */
export const YOURS_TAKE: Take = { photos: 11, clips: 1 };

/** The items the host has hidden from guests (her Download's Include hidden items). */
export const HIDDEN_TAKE: Take = { photos: 3, clips: 0 };
