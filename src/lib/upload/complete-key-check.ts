/**
 * The key/kind/ext binding, the complete seam's consistency check — pure, so it unit-tests without the
 * `server-only` pipeline (the gallery-access.ts / gallery-access.server.ts split).
 *
 * ★ THE KEY IS THE ISSUANCE RECORD. Presign minted both keys server-side as
 * events/<eventId>/<kind>/<mediaId>/<variant>.<ext>, deriving <kind> and <ext> from THAT request's
 * content_type. Requiring the completion's echoed content_type to re-derive the same segments
 * therefore pins complete-time content_type to presign-time content_type with ZERO stored state —
 * no issuance table needed. What it closes:
 *   - variant swap: completing with the ~2 MB preview as `key` would meter the preview as
 *     file_size_bytes while the up-to-10 GB original sat uncounted (and un-purgeable);
 *   - kind swap: uploading video bytes but completing as `photo` (a photo-typed row) dodges the
 *     free-tier photos-only gate and every video-specific surface;
 *   - ext drift: a content_type whose ext disagrees with the key's names a file R2 never presigned.
 *   - the phone copy (take-home r1): a photograph's 2048 px JPEG, `phone.jpg` beside its original,
 *     never a video's (videos stay as taken) and never another variant in its slot (an unmetered copy
 *     must never be the original or the preview by another name).
 * The client echoes presign's content_type verbatim (uploader.ts), so no legitimate caller changes.
 */
import type { MediaKind } from "@/lib/media/limits";
import {
  parseExtFromKey,
  parseKindFromKey,
  parseVariantFromKey,
} from "@/lib/r2/keys";

/** The first inconsistency found, for the refusal's captureWarning tag; null = consistent. */
export type CompleteKeyProblem =
  | "key_not_original"
  | "key_kind_mismatch"
  | "key_ext_mismatch"
  | "preview_not_preview"
  | "preview_kind_mismatch"
  | "preview_ext_not_webp"
  | "phone_not_phone"
  | "phone_not_photo"
  | "phone_ext_not_jpg";

export function checkCompleteKeyConsistency(args: {
  key: string;
  previewKey: string | null | undefined;
  /** The phone-size copy's key, set only when the client PUT one (`phoneKeyFor`). */
  phoneKey?: string | null;
  /** classifyMime(content_type) at complete — already refused as 415 when null. */
  kind: MediaKind;
  /** extForMime(content_type) at complete — null means a mime presign could never have minted. */
  ext: string | null;
}): CompleteKeyProblem | null {
  const { key, previewKey, phoneKey, kind, ext } = args;

  if (parseVariantFromKey(key) !== "original") return "key_not_original";
  if (parseKindFromKey(key) !== kind) return "key_kind_mismatch";
  if (!ext || parseExtFromKey(key) !== ext) return "key_ext_mismatch";

  if (previewKey) {
    if (parseVariantFromKey(previewKey) !== "preview") {
      return "preview_not_preview";
    }
    // The preview belongs to the SAME upload: same kind segment as the original's key…
    if (parseKindFromKey(previewKey) !== kind) return "preview_kind_mismatch";
    // …and previews are always the client-generated WebP (presign mints ext "webp" verbatim).
    if (parseExtFromKey(previewKey) !== "webp") return "preview_ext_not_webp";
  }

  if (phoneKey) {
    if (parseVariantFromKey(phoneKey) !== "phone") return "phone_not_phone";
    // Only a photograph has a phone copy, and presign mints it under the photo kind alone.
    if (kind !== "photo" || parseKindFromKey(phoneKey) !== "photo") {
      return "phone_not_photo";
    }
    if (parseExtFromKey(phoneKey) !== "jpg") return "phone_ext_not_jpg";
  }

  return null;
}
