/**
 * Body schema for the password-unlock route (POST /api/guests/unlock). The event's
 * qr_token (the single link) + the password. The password is just non-empty here (the
 * DB RPC does the real verify); a wrong one fails the bcrypt check and the route
 * returns a generic 401.
 */
import { z } from "zod";

export const unlockSchema = z.object({
  qr_token: z.string().min(1),
  password: z.string().min(1).max(128),
});

export type UnlockInput = z.input<typeof unlockSchema>;
