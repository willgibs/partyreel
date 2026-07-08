// The wire contract for POST /api/reel/upload (the client-encode export path, Plan A Phase C).
// PURE zod (v4) + types, shared by the route (parse) and the composer (request/response typing),
// and unit-tested directly. Three phases, one host-authed route:
//   begin    -> cache check + kill-switch + limiter preflight; returns the server hash + bounds
//               BEFORE the client spends an encode.
//   mint     -> presign the content-length-bound PUT for the reel output key (the abuse surface;
//               the server recomputes the config hash and the size cap, never trusting the client).
//   finalize -> after the PUT: verify the object landed, stamp highlight_reels ready + the hash.
// The `hash` is the SERVER-computed render hash from `begin`, echoed back opaquely; the server
// recomputes and compares at mint AND finalize so a mid-encode config change invalidates cleanly.

import { z } from "zod";

/** A sha256 hex digest (renderHash output). */
export const reelRenderHashSchema = z.string().regex(/^[0-9a-f]{64}$/);

export const reelUploadBodySchema = z.discriminatedUnion("phase", [
  z.object({
    phase: z.literal("begin"),
    event_id: z.uuid(),
  }),
  z.object({
    phase: z.literal("mint"),
    event_id: z.uuid(),
    hash: reelRenderHashSchema,
    size_bytes: z.number().int().positive(),
  }),
  z.object({
    phase: z.literal("finalize"),
    event_id: z.uuid(),
    hash: reelRenderHashSchema,
  }),
]);

export type ReelUploadBody = z.infer<typeof reelUploadBodySchema>;

// ---- Response shapes (server -> composer; typed, not validated client-side) ----

export type ReelUploadBeginResponse =
  | { ok: true; mode: "cached"; downloadUrl: string; filename: string }
  | {
      ok: true;
      mode: "encode";
      /** The server-computed render hash for the CURRENT config; echo it to mint/finalize. */
      hash: string;
      /** The attachment filename for the local save ("<event>-reel.mp4"). */
      filename: string;
      /** The mint-time upload ceiling in bytes (informational; the server re-enforces). */
      maxBytes: number;
    };

export type ReelUploadMintResponse = {
  ok: true;
  /** The presigned, content-length-bound PUT for the reel output key. */
  uploadUrl: string;
  /** Headers the browser must echo verbatim on the PUT (Content-Type). */
  headers: Record<string, string>;
};

export type ReelUploadFinalizeResponse = {
  ok: true;
  status: "ready";
  downloadUrl: string;
};

export type ReelUploadErrorResponse = {
  ok: false;
  code:
    | "bad_request"
    | "forbidden"
    | "empty"
    | "paused"
    | "rate_limited"
    | "config_changed"
    | "too_large"
    | "upload_incomplete"
    | "error";
  message?: string;
};
