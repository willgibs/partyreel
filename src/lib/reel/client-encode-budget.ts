// The size budget for a CLIENT-encoded reel mp4 (Plan A Phase C). The mint endpoint bounds the
// presigned PUT with a server-computed cap so a hostile client can't use the reel output key as
// free blob storage: cap = the tier-clamped reel length x a bitrate budget + headroom. PURE math
// (no env / server-only imports) so both the mint route and Vitest exercise the same numbers.
//
// Budget rationale:
// - The engine encodes h264 at ENCODE_BITRATES (encode.ts) whose MAX is 8 Mbps; the constant here
//   mirrors it (kept standalone because encode.ts imports mediabunny, a browser-only module, and
//   this file must stay importable from the server route). A parity test guards the mirror.
// - Styles run intros/outros/transitions past the clip cap, so the length term gets a fixed
//   allowance rather than an exact frame count (which would need the engine registry server-side).
// - Headroom covers mux overhead + encoder variance. Generous is fine: this is an abuse ceiling,
//   not a quality knob (a 60s reel at 8 Mbps is ~60 MB; the cap lands ~135 MB).

/** Mirrors the MAX of encode.ts ENCODE_BITRATES (see the parity test). */
export const MAX_CLIENT_ENCODE_BITRATE_BPS = 8_000_000;

/** Seconds of style intro/outro/transition tail allowed past the tier length cap. */
export const ENCODE_LENGTH_ALLOWANCE_SEC = 15;

/** Container/mux overhead + encoder variance multiplier. */
export const ENCODE_SIZE_HEADROOM = 1.5;

/** Hard runaway ceiling regardless of length math (no legit reel comes near this). */
export const ENCODE_SIZE_CEILING_BYTES = 256 * 1024 * 1024;

/**
 * The max upload size (bytes) the mint endpoint accepts for a reel of `lengthSeconds`
 * (the SERVER-computed, tier-clamped length; never a client value).
 */
export function clientEncodeSizeCapBytes(lengthSeconds: number): number {
  const seconds = Math.max(1, lengthSeconds) + ENCODE_LENGTH_ALLOWANCE_SEC;
  const cap = Math.ceil(
    seconds * (MAX_CLIENT_ENCODE_BITRATE_BPS / 8) * ENCODE_SIZE_HEADROOM,
  );
  return Math.min(cap, ENCODE_SIZE_CEILING_BYTES);
}

/** Mint-time acceptance check: a positive integer byte count within the cap. */
export function withinClientEncodeSizeCap(
  sizeBytes: number,
  lengthSeconds: number,
): boolean {
  return (
    Number.isSafeInteger(sizeBytes) &&
    sizeBytes > 0 &&
    sizeBytes <= clientEncodeSizeCapBytes(lengthSeconds)
  );
}
