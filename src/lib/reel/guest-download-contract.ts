// The wire contract for POST /api/reel/download — a GUEST saving the event's reel video. PURE zod (v4)
// + types, shared by the route (parse) and the guest overlay (request/response typing), and unit-tested
// directly. Same split as upload-contract.ts, but the postures are opposites and that is the point:
//
//   upload   = the HOST's write path: authed, presigns a PUT, mints artifacts.
//   download = a GUEST's read path: NO write, NO render, NO mint. It can only ever hand back a
//              presigned GET of an mp4 the host already produced, or a refusal.
//
// The request carries only `qr_token`, deliberately: the token IS the capability (ADR-0004), and the
// route re-derives the event + gallery access from it rather than trusting any client-supplied event id
// or publish state.
//
// ★ `no_reel` is ONE answer covering several situations — no reel row, nothing curated, or a reel the
// host has not shared. That is intentional: distinguishable codes would turn this route into a
// publish-state oracle a stranger could poll to learn whether a private album has a reel waiting.
// `no_artifact` is different in kind (the reel EXISTS and the guest is allowed to see it, there is just
// no rendered mp4 yet), so it is safe to name and the client needs it to pick its fallback.

import { z } from "zod";

export const reelDownloadBodySchema = z.object({
  /** The event's guest capability token (the `/e/[qr_token]` link). */
  qr_token: z.string().min(1),
});

export type ReelDownloadBody = z.infer<typeof reelDownloadBodySchema>;

// ---- Response shapes (server -> overlay; typed, not validated client-side) ----

export type ReelDownloadSuccess = {
  ok: true;
  /** There is exactly one success mode: a presigned GET of the stored mp4. */
  mode: "artifact";
  /**
   * Whether the stored mp4 matches the reel as it is CONFIGURED right now (rendered_hash === the
   * current render hash). False = the host changed the reel after this mp4 was made, so the file is
   * real but stale; the client decides between encoding the current cut on-device and taking this one.
   */
  fresh: boolean;
  /** Presigned, `attachment`-dispositioned GET (short TTL). */
  url: string;
  /** The save filename ("<event>-reel.mp4"), so a local re-encode names its file identically. */
  filename: string;
};

export type ReelDownloadNoArtifact = {
  ok: false;
  code: "no_artifact";
  /** Still returned: the client may encode the reel itself and needs the same filename. */
  filename: string;
};

export type ReelDownloadError = {
  ok: false;
  code: "no_reel" | "forbidden" | "rate_limited" | "bad_request";
  /** Seconds to wait, on `rate_limited` only. */
  retryAfterSec?: number;
};

export type ReelDownloadResponse =
  | ReelDownloadSuccess
  | ReelDownloadNoArtifact
  | ReelDownloadError;
