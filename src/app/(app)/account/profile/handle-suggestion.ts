import { slugify } from "@/lib/slug";
import {
  PROFILE_SLUG_MAX_LENGTH,
  profileSlugSchema,
} from "@/lib/validation/profile";

/**
 * THE WIZARD'S FIRST SCREEN ARRIVES FILLED IN (`identity-profile` r1, `setup=wizard`, drawn with
 * "priya" already in the field): her display name, as a handle, in the few spellings the page then
 * asks the database about at once, so most people meet a free address and press Continue.
 *
 * The name is already public wherever she uploads, so a handle made from it tells nobody anything
 * new, and it is only a suggestion: the field is hers to change, and the live check still answers
 * for whatever she types. The spelling is `slugify`'s (the one home of how a name becomes a slug,
 * `lib/slug.ts`), and every candidate passes `profileSlugSchema`, the same rules a save obeys
 * (length, characters, reserved words), so the field never opens on an address it would refuse. A
 * name that makes no valid handle ("AJ" is two letters) suggests nothing.
 */
export function handleCandidates(displayName: string | null): string[] {
  // Sliced to the cap, then a hyphen the slice may have left dangling is trimmed.
  const base = slugify(displayName ?? "", PROFILE_SLUG_MAX_LENGTH).replace(
    /-+$/g,
    "",
  );
  const first = profileSlugSchema.safeParse(base);
  if (!first.success) return [];

  const candidates = [first.data];
  for (let n = 2; n <= 9; n++) {
    const suffix = `-${n}`;
    const stem = first.data
      .slice(0, PROFILE_SLUG_MAX_LENGTH - suffix.length)
      .replace(/-+$/g, "");
    const next = profileSlugSchema.safeParse(`${stem}${suffix}`);
    if (next.success) candidates.push(next.data);
  }
  return candidates;
}
