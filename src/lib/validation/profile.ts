import { z } from "zod";

import { RESERVED_NAMES } from "@/lib/constants/reserved-names";

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
