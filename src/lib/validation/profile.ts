import { z } from "zod";

export const DISPLAY_NAME_MAX_LENGTH = 60;

// Host display name — the name shown to guests under "Hosted by" on the event page. Trimmed;
// EMPTY IS ALLOWED and means "clear / not set" (the action stores null, which the guest byline
// hides on). No min length: a blank submission is how you remove the name. Max keeps the byline
// tidy and is re-enforced server-side in updateDisplayNameAction.
export const displayNameSchema = z
  .string()
  .trim()
  .max(
    DISPLAY_NAME_MAX_LENGTH,
    `Keep your name under ${DISPLAY_NAME_MAX_LENGTH} characters.`,
  );

export type DisplayNameInput = z.infer<typeof displayNameSchema>;
