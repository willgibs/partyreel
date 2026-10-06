/**
 * THE TWO LINES AN UPLOAD CAN MEET, IN THE PRODUCT'S VOICE (billing-caps.md; billing-integrity): the uploads line (her
 * plan's own number over its window, or a pass the nightly recompute has not caught up with: `uploads_refused`) and
 * storage (the cap and its 10%). One home for each refusal's words, so the context's early answer, the presign meter's
 * exact one and the complete's backstop say each line alike, for a guest and for the owner.
 *
 * ★ A guest's words name the album, never the plan: she must not learn the host's plan. The owner's name her plan; at
 * the presign her storage refusal is `roomRefusalWords` (`components/app/storage/storage-figures.ts`), the room this
 * file needs and the one way to make it, which the meter knows and a complete does not.
 *
 * The complete used to say "Storage is full for your plan" to a host for every refusal holding "limit" (her uploads
 * line read as storage), and to a guest the SQL's own "Upload limit reached for this plan." (the plan named to her).
 */

/** The album's storage is full (a guest's words). */
export const ALBUM_STORAGE_FULL =
  "This album is full right now. The host needs to free up space.";

/** The album's uploads line is met. "For now", never "for the month": a pass counts its uploads over its own year. */
export const ALBUM_UPLOADS_SPENT =
  "This album has hit its upload limit for now.";

/** Her plan's uploads line is met (the owner's words), whatever its window. */
export const PLAN_UPLOADS_SPENT =
  "You've hit this plan's upload limit for now.";

/** Her plan's storage is full, at the complete (the owner's words; the help center quotes them). */
export const PLAN_STORAGE_FULL =
  "Storage is full for your plan. Free up space or upgrade.";

/** The line an upload met: her uploads line, or storage. */
export type CapLine = "uploads" | "storage";

/**
 * Which line a complete's refusal met, read off `create_media*`'s own sentences ("Upload limit reached for this plan.",
 * "Storage capacity exceeded for this plan."); null for every other refusal.
 */
export function capLineOf(message: string): CapLine | null {
  const m = message.toLowerCase();
  if (m.includes("upload limit")) return "uploads";
  if (m.includes("storage capacity")) return "storage";
  return null;
}
