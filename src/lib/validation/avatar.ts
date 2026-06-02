/**
 * Avatar upload validation — the bytes that reach POST /api/account/avatar. The avatar is
 * re-encoded to webp client-side (canvas), but the route NEVER trusts the client: it re-checks
 * the size and sniffs the magic bytes here before the object lands in R2. Pure (no env/IO),
 * so it unit-tests cleanly.
 */

/** Post-resize ceiling. A 512px webp is ~80-120 KB; 512 KB is generous headroom + a hard cap. */
export const AVATAR_MAX_BYTES = 512 * 1024;

/** The only content-type we accept/store. Canvas output is raster webp — no SVG/XSS surface. */
export const AVATAR_CONTENT_TYPE = "image/webp";

/**
 * True iff `bytes` is a WebP: a RIFF container whose form-type is "WEBP".
 *
 *   "RIFF" (bytes 0..3) · uint32 file size (4..7) · "WEBP" (bytes 8..11)
 *
 * Checking only "RIFF" is NOT enough — a .wav is also a RIFF container; the "WEBP" fourCC at
 * offset 8 is the real discriminator. This is the server's defense-in-depth against a request
 * that bypasses the client and POSTs arbitrary bytes under an image/webp content-type.
 */
export function isWebp(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  // "RIFF"
  if (
    bytes[0] !== 0x52 ||
    bytes[1] !== 0x49 ||
    bytes[2] !== 0x46 ||
    bytes[3] !== 0x46
  ) {
    return false;
  }
  // "WEBP"
  return (
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}
