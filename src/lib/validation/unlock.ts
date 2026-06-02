/**
 * Body schema for the password-unlock route (POST /api/guests/unlock). Exactly one
 * token: qr_token for the /e/ join page, share_token for the /a/ album. The password
 * is just non-empty here (the DB RPC does the real verify); a wrong one fails the
 * bcrypt check and the route returns a generic 401.
 */
import { z } from "zod";

export const unlockSchema = z
  .object({
    qr_token: z.string().min(1).optional(),
    share_token: z.string().min(1).optional(),
    password: z.string().min(1).max(128),
  })
  .refine((v) => (v.qr_token == null) !== (v.share_token == null), {
    message: "Provide exactly one of qr_token or share_token.",
  });

export type UnlockInput = z.input<typeof unlockSchema>;
