/**
 * SHARE, SAVE AND THE PHOTOGRAPH'S OWN ADDRESS (media-viewer r1, `link=file`,
 * Will 2026-09-24, verbatim: "By default, share should send the picture itself,
 * since it's the expected behavior. However, we could also include a 'copy link'
 * share action that sends a link to the photograph... Most users would likely
 * prefer a priority option of native photo library (especially on mobile), with
 * the rest as secondary options. We're not looking to reduce ways to download,
 * just include the expected native way as the default.").
 *
 * Pure: every browser object arrives as an argument (`NavigatorLike`, a `fetch`),
 * so the whole decision tree is unit-tested over mocked navigators in the node
 * project, and the viewer only renders what these functions answer.
 *
 * ★ iOS HAS ONE WEB DOOR INTO THE PHOTOS LIBRARY, AND IT IS THE SYSTEM SHEET
 * CARRYING THE FILE, SO SAVE ASKS NOTHING THERE (save-sheet, Will's iPhone
 * check: "we may not need to differentiate... just open the save sheet"). A
 * download lands in Files, which is exactly what he hit; `navigator.share({
 * files })` puts "Save Image" (or "Save Video") into Photos AND "Save to
 * Files" in the SAME sheet, so a second, plain-download choice would only ask
 * a question the sheet already answers. Android's download already lands in
 * the gallery and a desk downloads, so both keep the one plain Save they
 * already had.
 *
 * ★ THE FILE IS FETCHED ON THE TAP, NEVER BEFORE. A swipe through an album must
 * never pull originals a guest did not ask for. The cost is that a slow fetch can
 * outlive the tap's user activation, and iOS refuses `share()` without one, so a
 * lapsed activation comes back as `needs-tap` with the file in hand: the viewer
 * turns the button into a one-tap "Ready" rather than failing.
 *
 * ★ A CORS READ OF A GALLERY PRESIGN BYPASSES THE HTTP CACHE (uploads-and-r2.md):
 * a tile's plain <img> caches R2's answer without Access-Control-Allow-Origin
 * under the same stable URL, and a later CORS fetch of it fails with a bare
 * "Failed to fetch". `cache: "no-store"` is load-bearing here, as it is in the
 * reel engine's loaders.
 */
import { MIME_TO_EXT } from "@/lib/media/limits";

/** The query parameter that names an open photograph on an album link. */
export const PHOTO_PARAM = "photo";

/**
 * Above this, a file is not pulled into memory to hand to the system sheet: a
 * phone holding a clip this size as one Blob, after a wait this long on a party's
 * network, is worse than the plain download it falls back to. 100 MB is also the
 * line where our uploads switch to multipart, so it is already the product's
 * idea of "a big file". Photographs never reach it.
 */
export const SHARE_FILE_MAX_BYTES = 100 * 1024 * 1024;

/** An id this module will look for: the shape of a media id, nothing wider. */
const ID_SHAPE = /^[A-Za-z0-9_-]{1,64}$/;

/** The slice of `navigator` these helpers touch, so tests hand in a double. */
export type NavigatorLike = {
  userAgent?: string;
  maxTouchPoints?: number;
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
  clipboard?: { writeText(text: string): Promise<void> };
  userActivation?: { isActive: boolean };
};

/* ── the address ─────────────────────────────────────────────────────────── */

/**
 * The photograph an address names, or null. Only ever compared against the
 * items a viewer already holds, so this validates shape and nothing else: an
 * unknown, held or hidden id simply matches nothing.
 */
export function readPhotoParam(search: string): string | null {
  const id = new URLSearchParams(search).get(PHOTO_PARAM);
  return id && ID_SHAPE.test(id) ? id : null;
}

/**
 * The current page's path with the photograph named (or unnamed, for null),
 * every other parameter and the hash kept: the album link's `?reel` and anything
 * a campaign added travel untouched beside it.
 *
 * ★ THE OTHER PARAMETERS ARE KEPT AS WRITTEN, NOT RE-SERIALISED. A round trip
 * through URLSearchParams turns a bare `?reel` into `?reel=`, and the address
 * belongs to every lane that writes into it; this one only ever touches its own
 * `photo=` segment.
 */
export function withPhotoParam(href: string, id: string | null): string {
  const url = new URL(href, "http://localhost");
  const keyOf = (part: string) => {
    const key = part.split("=")[0] ?? "";
    try {
      return decodeURIComponent(key);
    } catch {
      return key;
    }
  };
  const kept = url.search
    .replace(/^\?/, "")
    .split("&")
    .filter((part) => part !== "" && keyOf(part) !== PHOTO_PARAM);
  if (id) kept.push(`${PHOTO_PARAM}=${encodeURIComponent(id)}`);
  const search = kept.length ? `?${kept.join("&")}` : "";
  return `${url.pathname}${search}${url.hash}`;
}

/**
 * The PUBLIC album link that opens on this photograph. Built from the surface's
 * `shareUrl` (the event's join link on the guest album and the host's feed
 * alike), never from the page's own address, so a host copying a link from
 * the dashboard hands on the album and never a dashboard URL.
 */
export function photoLink(albumUrl: string, id: string): string {
  try {
    const url = new URL(albumUrl);
    url.searchParams.set(PHOTO_PARAM, id);
    return url.toString();
  } catch {
    const joiner = albumUrl.includes("?") ? "&" : "?";
    return `${albumUrl}${joiner}${PHOTO_PARAM}=${encodeURIComponent(id)}`;
  }
}

/* ── the platform ────────────────────────────────────────────────────────── */

export type Platform = "ios" | "android" | "desktop";

/**
 * Which of the three save stories this device lives in. An iPad asking for the
 * desktop site reports a Mac user agent, so a Mac with a touch screen's worth of
 * touch points is an iPad (no Mac has one).
 */
export function detectPlatform(nav: NavigatorLike): Platform {
  const ua = nav.userAgent ?? "";
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Macintosh/.test(ua) && (nav.maxTouchPoints ?? 0) > 1) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export type SaveChoice = "photos" | "file";

/**
 * What Save does here: one choice, never a menu. iOS: the file into the
 * system sheet, whose "Save Image"/"Save Video" (Photos) and "Save to Files"
 * already live side by side there, so there is nothing left for a second,
 * plain-download option to add. Everywhere else the download IS the native
 * way (Android's lands in the gallery, a desk downloads), so it stays the
 * only choice there too.
 */
export function saveChoices(platform: Platform): readonly SaveChoice[] {
  return platform === "ios" ? ["photos"] : ["file"];
}

/* ── the file ────────────────────────────────────────────────────────────── */

const EXT_TO_MIME: Record<string, string> = Object.fromEntries(
  Object.entries(MIME_TO_EXT).map(([mime, ext]) => [ext, mime]),
);

/** The MIME a filename's extension promises, or "" when it promises none we know. */
export function mimeForName(name: string): string {
  const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  if (ext === "jpeg") return "image/jpeg";
  return EXT_TO_MIME[ext] ?? "";
}

/**
 * The name the file travels under. The save presign already carries the
 * server's chosen name inside its signed `response-content-disposition`
 * (download-filename.ts: the event's slug, a short id, the real extension), so
 * the sheet names the file exactly as Save would; an item with no save URL gets
 * a plain fallback.
 */
export function filenameFor(item: {
  id: string;
  type: "photo" | "video";
  downloadUrl?: string;
}): string {
  if (item.downloadUrl) {
    try {
      const disposition = new URL(item.downloadUrl).searchParams.get(
        "response-content-disposition",
      );
      const named = disposition?.match(/filename="([^"]+)"/)?.[1];
      if (named) return named;
    } catch {
      // Not a URL we can read: fall through to the plain name.
    }
  }
  return `partyreel-${item.id.slice(0, 8)}.${item.type === "video" ? "mp4" : "jpg"}`;
}

export type FetchedFile =
  | { kind: "file"; file: File }
  | { kind: "too-large" }
  | { kind: "failed" }
  | { kind: "aborted" };

/**
 * The original, as a File, fetched now. A declared length over the cap stops
 * the read before a byte of body is held; a body that turns out over it is
 * dropped. `signal` is the viewer's: moving on or closing aborts the read.
 */
export async function fetchMediaFile(
  url: string,
  name: string,
  opts: {
    fetch?: typeof fetch;
    signal?: AbortSignal;
    maxBytes?: number;
  } = {},
): Promise<FetchedFile> {
  const doFetch = opts.fetch ?? fetch;
  const maxBytes = opts.maxBytes ?? SHARE_FILE_MAX_BYTES;
  const own = new AbortController();
  const relay = () => own.abort();
  opts.signal?.addEventListener("abort", relay);
  try {
    if (opts.signal?.aborted) return { kind: "aborted" };
    const res = await doFetch(url, {
      mode: "cors",
      cache: "no-store",
      signal: own.signal,
    });
    if (!res.ok) return { kind: "failed" };
    const declared = Number(res.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > maxBytes) {
      own.abort();
      return { kind: "too-large" };
    }
    const blob = await res.blob();
    if (blob.size > maxBytes) return { kind: "too-large" };
    const type =
      blob.type || res.headers.get("content-type") || mimeForName(name);
    return { kind: "file", file: new File([blob], name, { type }) };
  } catch {
    return opts.signal?.aborted ? { kind: "aborted" } : { kind: "failed" };
  } finally {
    opts.signal?.removeEventListener("abort", relay);
  }
}

/* ── the sheet ───────────────────────────────────────────────────────────── */

const errorName = (e: unknown) =>
  typeof e === "object" && e !== null && "name" in e
    ? String((e as { name: unknown }).name)
    : "";

/**
 * Whether this device's sheet takes a file of this name at all, asked BEFORE
 * the fetch with an empty stand-in of the same type (a sheet judges a file by
 * its type, never its bytes), so a browser that would refuse never pays for the
 * download or spends the tap's activation waiting on it.
 */
export function canShareFileNamed(name: string, nav: NavigatorLike): boolean {
  if (typeof nav.share !== "function" || typeof nav.canShare !== "function")
    return false;
  const type = mimeForName(name);
  if (!type) return false;
  try {
    return nav.canShare({ files: [new File([], name, { type })] });
  } catch {
    return false;
  }
}

export type SheetOutcome =
  | { kind: "shared" }
  | { kind: "cancelled" }
  | { kind: "needs-tap"; file: File }
  | { kind: "unsupported" }
  | { kind: "failed" };

/**
 * Hand one file to the system sheet, asked with the REAL file this time. An
 * activation that has already lapsed is answered before the call (iOS would
 * refuse it), and a refusal after it comes back the same way: a file in hand
 * that one more tap can send.
 */
export async function shareFile(
  file: File,
  nav: NavigatorLike,
): Promise<SheetOutcome> {
  if (typeof nav.share !== "function") return { kind: "unsupported" };
  const data: ShareData = { files: [file] };
  if (typeof nav.canShare === "function" && !nav.canShare(data))
    return { kind: "unsupported" };
  if (nav.userActivation && !nav.userActivation.isActive)
    return { kind: "needs-tap", file };
  try {
    await nav.share(data);
    return { kind: "shared" };
  } catch (e) {
    const name = errorName(e);
    if (name === "AbortError") return { kind: "cancelled" };
    if (name === "NotAllowedError") return { kind: "needs-tap", file };
    return { kind: "failed" };
  }
}

/** Put text on the clipboard; false when the browser will not. */
export async function copyText(
  text: string,
  nav: NavigatorLike,
): Promise<boolean> {
  try {
    if (!nav.clipboard?.writeText) return false;
    await nav.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export type LinkOutcome =
  | { kind: "shared" }
  | { kind: "copied" }
  | { kind: "cancelled" }
  | { kind: "failed" };

/** A link through the sheet where there is one, else onto the clipboard. */
export async function shareLink(
  url: string,
  nav: NavigatorLike,
): Promise<LinkOutcome> {
  if (typeof nav.share === "function") {
    try {
      await nav.share({ url });
      return { kind: "shared" };
    } catch (e) {
      if (errorName(e) === "AbortError") return { kind: "cancelled" };
      // Refused or unsupported: the clipboard is the last way to hand it on.
    }
  }
  return (await copyText(url, nav)) ? { kind: "copied" } : { kind: "failed" };
}

/* ── the two taps ────────────────────────────────────────────────────────── */

export type ShareOutcome =
  | { kind: "shared-file" }
  | { kind: "needs-tap"; file: File }
  | { kind: "shared-link" }
  | { kind: "copied" }
  | { kind: "cancelled" }
  | { kind: "failed" };

type Deps = {
  nav: NavigatorLike;
  fetch?: typeof fetch;
  signal?: AbortSignal;
  maxBytes?: number;
};

/**
 * SHARE, ON ITS TAP: the picture itself, then the link, then a copy of it.
 * `link` is the photograph's public link where it has one (an approved item on
 * a surface with an album link), else the album's, else nothing.
 */
export async function shareMedia(
  input: { fileUrl?: string; name: string; link?: string },
  deps: Deps,
): Promise<ShareOutcome> {
  if (input.fileUrl && canShareFileNamed(input.name, deps.nav)) {
    const got = await fetchMediaFile(input.fileUrl, input.name, deps);
    if (got.kind === "aborted") return { kind: "cancelled" };
    if (got.kind === "file") {
      const sent = await shareFile(got.file, deps.nav);
      if (sent.kind === "shared") return { kind: "shared-file" };
      if (sent.kind === "cancelled") return { kind: "cancelled" };
      if (sent.kind === "needs-tap") return sent;
      // Refused by type after all, or broken: the link still goes.
    }
  }
  if (!input.link) return { kind: "failed" };
  const linked = await shareLink(input.link, deps.nav);
  if (linked.kind === "shared") return { kind: "shared-link" };
  return linked;
}

export type SaveOutcome =
  | { kind: "sheet" }
  | { kind: "needs-tap"; file: File }
  | { kind: "cancelled" }
  | { kind: "download" };

/**
 * SAVE TO PHOTOS (iOS): the file into the system sheet, whose "Save Image" is
 * the one web path into the library. Anything that keeps the file from the
 * sheet (too big, a refusal, a broken read) falls back to the plain download,
 * because a Save that saves nothing is the one outcome to avoid.
 */
export async function saveToPhotos(
  input: { fileUrl: string; name: string },
  deps: Deps,
): Promise<SaveOutcome> {
  if (!canShareFileNamed(input.name, deps.nav)) return { kind: "download" };
  const got = await fetchMediaFile(input.fileUrl, input.name, deps);
  if (got.kind === "aborted") return { kind: "cancelled" };
  if (got.kind !== "file") return { kind: "download" };
  const sent = await shareFile(got.file, deps.nav);
  if (sent.kind === "shared") return { kind: "sheet" };
  if (sent.kind === "cancelled") return { kind: "cancelled" };
  if (sent.kind === "needs-tap") return sent;
  return { kind: "download" };
}
