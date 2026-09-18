import { z } from "zod";

import { RESERVED_NAMES } from "@/lib/constants/reserved-names";
import { RESERVED_SLUGS } from "@/lib/constants/reserved-slugs";

export const DISPLAY_NAME_MAX_LENGTH = 60;

// The shared guidance shown wherever a user sets their name (onboarding, the guest name step, and
// /account). One source so the promise stays identical everywhere. No em-dashes (copy policy).
export const DISPLAY_NAME_GUIDANCE =
  "This is your public name when you upload. Change it anytime. Only event hosts see your email.";

// Public display name (uploader attribution + the "Hosted by" byline). REQUIRED now: every account
// always has one (Phase 1 identity foundation), so there is no blank-clears-it path anymore. Min 1
// allows short real names ("AJ", "MJ"). Reserved-name check blocks impersonation ("admin",
// "partyreel"); PROFANITY is enforced separately, server-side, in updateDisplayNameAction (the
// obscenity matcher must not ship to the client). Re-parsed server-side on every write.
export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a name.")
  .max(
    DISPLAY_NAME_MAX_LENGTH,
    `Keep your name under ${DISPLAY_NAME_MAX_LENGTH} characters.`,
  )
  .refine((name) => !RESERVED_NAMES.has(name.toLowerCase()), {
    message: "That name isn't available.",
  });

export type DisplayNameInput = z.infer<typeof displayNameSchema>;

// Keep these in lockstep with the profiles_slug_format CHECK in migration
// 20260708120000 (3..30, lowercase [a-z0-9-], no edge hyphen). The CHECK is the
// hard backstop; THIS schema is the UX gate and the sole owner of the
// reserved-word policy (policy lives app-side, per reserved-slugs.ts).
export const PROFILE_SLUG_MIN_LENGTH = 3;
export const PROFILE_SLUG_MAX_LENGTH = 30;

// Public profile handle for /u/[slug] (profiles-social.md: a profile is public by
// existence; the slug is just its address). Normalized to lowercase then
// validated, mirroring eventSlugSchema. Two reserved lists apply: RESERVED_SLUGS
// (route/brand words like "admin", "api") because /u/ is another public URL
// namespace, and RESERVED_NAMES (impersonation words like "support") because a
// handle reads as an identity. Both are policy, not security boundaries. No
// 32-hex qr_token-shape refine here (unlike eventSlugSchema): the 30-char max
// already makes a 32-hex collision impossible. Pro-gating is APP-side (setProfileSlug), never
// in this schema or the DB: the DB stores a slug for any tier so a later
// downgrade/grandfathering change never strands a stored handle.
export const profileSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(
    PROFILE_SLUG_MIN_LENGTH,
    `Handles are at least ${PROFILE_SLUG_MIN_LENGTH} characters.`,
  )
  .max(
    PROFILE_SLUG_MAX_LENGTH,
    `Keep your handle to ${PROFILE_SLUG_MAX_LENGTH} characters or fewer.`,
  )
  .regex(
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
    "Use lowercase letters, numbers, and hyphens (no leading or trailing hyphen).",
  )
  .refine(
    (s) => !RESERVED_SLUGS.has(s) && !RESERVED_NAMES.has(s),
    "That word is reserved. Try another.",
  );

export type ProfileSlugInput = z.infer<typeof profileSlugSchema>;
