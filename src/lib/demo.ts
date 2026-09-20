import { SITE_URL } from "@/lib/constants/site";
import { env } from "@/lib/env";

// Interactive demo (polish-arc Round 3). A REAL curated event's qr_token is set in
// NEXT_PUBLIC_DEMO_QR_TOKEN. When present:
//   • marketing renders a real scannable QR + a "Try the live demo" CTA, and
//   • that event's /e/[qr_token] guest page runs in DEMO MODE — a visitor's "upload"
//     is simulated client-side (a local object-URL tile, never written to DB/R2), so
//     the curated media stays pristine.
// Unset → no demo anywhere (decorative QR, no CTA, normal guest behavior). No schema
// change. This module reads `env`, so (like site.ts) it isn't Vitest-importable;
// the demo path is verified end-to-end via the Preview MCP with a seeded event.

export const DEMO_QR_TOKEN = env.NEXT_PUBLIC_DEMO_QR_TOKEN;

/** The demo event's guest URL, or undefined when no demo is configured. */
export const DEMO_EVENT_URL = DEMO_QR_TOKEN
  ? `${SITE_URL}/e/${DEMO_QR_TOKEN}`
  : undefined;

/** True only for the demo event's qr_token (so its guest page simulates uploads). */
export function isDemoToken(token: string): boolean {
  return !!DEMO_QR_TOKEN && token === DEMO_QR_TOKEN;
}

/* ── phone=pair (the sixth batch, 2026-09-20, docs/design/rulings.md) ──────
 * "What the phone adds appears on the laptop's album a second later and the
 * laptop says where it came from. One broadcast channel, no stored bytes."
 *
 * A visitor who scans a demo door off a laptop screen shares ONE ephemeral
 * session with it: the laptop mints a random id and folds it into the share
 * link it shows (`?pair=<id>`); the phone that scans it carries the id back
 * in the URL it loads. Both sides open a Supabase Realtime BROADCAST channel
 * keyed by that id — the doorbell's own MECHANISM (use-gallery-doorbell.ts:
 * an ambient websocket ping, never a poll), but never its actual channel.
 * `gallery:<qr_token>` is the SAME topic for every stranger currently looking
 * at the one public demo event, and a personal pairing must not broadcast one
 * visitor's phone onto a hundred other visitors' laptops. Nothing here is
 * persisted (no new table, per the standing rule): the channel forgets
 * everything the moment either tab closes.
 */

/** The query param a laptop's demo share link carries for a scanning phone. */
export const DEMO_PAIR_PARAM = "pair";

/** The ephemeral Realtime channel two demo tabs share for one pairing. */
export function pairChannelName(pairId: string): string {
  return `demo-pair:${pairId}`;
}

/** The one broadcast event a paired phone ever sends. */
export const DEMO_PAIR_EVENT = "arrived";

/** What rides that one event — a downscaled LOOK at what just landed, never
 *  the real file. `dataUrl` is omitted for a video (no cheap client-side
 *  poster frame worth the code), which the laptop then announces in words
 *  alone rather than with a tile. */
export type DemoPairArrival = {
  dataUrl?: string;
  kind: "photo" | "video";
};

// Longest edge a paired thumbnail travels at, and its JPEG quality — small
// enough to clear Realtime's broadcast payload cap with room to spare (256 KB
// on the free plan, 3 MB on Pro+; this lands well under 100 KB in practice
// for a phone photo) and fast enough that "it's on your laptop already"
// still reads as instant.
const PAIR_THUMB_MAX_EDGE = 640;
const PAIR_THUMB_QUALITY = 0.7;

/**
 * Downscale a picked photo into a small JPEG data URL for the pair broadcast.
 * `null` for a video, or any decode failure — the caller degrades to the
 * words-only line rather than failing the (already-succeeded) simulated
 * upload over a decoration.
 */
export async function fileToPairThumbnail(
  file: File,
): Promise<string | null> {
  if (!file.type.startsWith("image/")) return null;
  try {
    const bitmap = await createImageBitmap(file);
    try {
      const scale = Math.min(
        1,
        PAIR_THUMB_MAX_EDGE / Math.max(bitmap.width, bitmap.height),
      );
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(bitmap, 0, 0, width, height);
      return canvas.toDataURL("image/jpeg", PAIR_THUMB_QUALITY);
    } finally {
      bitmap.close();
    }
  } catch {
    return null;
  }
}

/** The receiving side of the same trip: a broadcast data URL back into a
 *  File the gallery's EXISTING optimistic-tile path already knows how to
 *  hold (live-gallery.tsx's `notifyUploaded` — no second tile mechanism). */
export async function pairThumbnailToFile(
  dataUrl: string,
  filename = "from-a-phone.jpg",
): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
}

/** A fresh, unguessable id for one pairing — never persisted, never reused. */
export function newPairId(): string {
  return crypto.randomUUID();
}

/**
 * `try=turn` + `phone=pair`, decided (Will, the sixth batch, 2026-09-20): one
 * slot directly above the album, never stacked, never for a real event. A
 * pure function HERE rather than inline in event-experience.tsx on purpose —
 * that component transitively imports a Next.js Server Action
 * (live-gallery.tsx's `removeMyUploadGuestAction`), which drags in
 * `server-only`-marked modules a plain Vitest run cannot resolve at all; this
 * module already carries the lane's other pairing logic and needs nothing
 * event-experience.tsx does, so the manifest's own contract ("the turn card
 * only in the demo") is testable in isolation. Same reasoning as
 * entry-steps.ts's own header comment about entry-modal.tsx.
 */
export type AboveAlbumState = "none" | "paired-phone" | "paired-laptop" | "turn";
export function pickAboveAlbumState({
  isDemo,
  pairedAsPhone,
  pairedArrivals,
  demoUploaded,
}: {
  isDemo: boolean;
  /** This tab sent at least one paired upload out ("It's on your laptop already"). */
  pairedAsPhone: boolean;
  /** This tab has received at least one paired arrival ("That one just came from your phone"). */
  pairedArrivals: number;
  /** This tab's own (real or simulated) upload queue has a completed item. */
  demoUploaded: boolean;
}): AboveAlbumState {
  if (!isDemo) return "none";
  if (pairedAsPhone) return "paired-phone";
  if (pairedArrivals > 0) return "paired-laptop";
  if (demoUploaded) return "turn";
  return "none";
}
