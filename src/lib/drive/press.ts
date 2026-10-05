/**
 * THE PRESS'S WIRE (`POST /api/drive/exports`): what a client sends and what it is answered, one home for the route
 * and the panel, the picker and the storage door that call it. Pure.
 */

/** At most this many albums a press (Your events' picker sends a season; a bigger one is several presses). */
export const MAX_ALBUMS_A_PRESS = 50;

/** What happened to one album of a press. */
export type PressResult = {
  eventId: string;
  jobId: string | null;
  /**
   * started: a new send, its folder made; open: a send of the album already under way (the press opened it); empty:
   * nothing to send; refused: not hers, in Deleted, or a plan's bound; failed: Google could not make its folder (the
   * next press tries again).
   */
  state: "started" | "open" | "empty" | "refused" | "failed";
  code?: string;
};

/** The press refused whole, in a code the client words. */
export type PressRefusal =
  | "bad_request"
  | "unauthorized"
  | "unavailable"
  | "rate_limited"
  | "not_connected"
  | "disconnected"
  | "paused"
  | "busy"
  | "google_unreachable"
  | "drive_full"
  | "domain_policy";

export type PressAnswer =
  | { ok: true; results: PressResult[] }
  | { ok: false; code: PressRefusal; free?: number; needs?: number; retryAfterSec?: number };

/** What a send of one album would take (the final press's facts, `GET /api/drive/preview`). */
export type AlbumPreview = {
  eventId: string;
  name: string;
  eventDate: string | null;
  eventEndDate: string | null;
  items: number;
  bytes: number;
  photos: number;
  clips: number;
  newItems: number;
  newBytes: number;
  /** When an earlier send of this album reached this Drive, if one did. */
  sentBefore: string | null;
  /** An unfinished send of this album (a press opens it). */
  unfinished: string | null;
};

