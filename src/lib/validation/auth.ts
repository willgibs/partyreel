/**
 * Account auth validation — email + password sign-in / account creation / password
 * set + change (auth-accounts.md). Passwords are an ADDITIONAL credential on the same
 * auth.users row as the passwordless paths (OTP / magic-link / Google).
 *
 * Plain module (no 'use server') so the client forms AND the server action that
 * re-checks the current password both import these. The AUTHORITATIVE strength
 * enforcement is server-side (Supabase Auth: the dashboard "Minimum password length"
 * + Leaked Password Protection / HaveIBeenPwned); these schemas are the UX layer plus
 * a defense-in-depth floor — never the only gate.
 */
import { z } from "zod";

// Hand-synced to the Supabase dashboard "Minimum password length" (Authentication →
// Sign In / Providers → Email). A lockstep pair like OTP_LENGTH ↔ the dashboard OTP
// length and tiers.ts ↔ tier_limits(): change one, change the other, or a new password
// passes here but Supabase rejects it (or vice versa). A Vitest test pins this to 8.
export const MIN_PASSWORD_LENGTH = 8;

// bcrypt hashes only the first 72 BYTES of input; anything past 72 is silently ignored.
// Cap the field so a long password can't have a no-op tail the user thinks is protecting
// them. (Supabase enforces the same 72 ceiling.)
const MAX_PASSWORD_LENGTH = 72;

// The strength-checked password used for creation / set / change. NO character-class
// rules on purpose: length + leaked-password protection is stronger and friendlier than
// "needs a symbol" theater.
export const passwordField = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters.`)
  .max(
    MAX_PASSWORD_LENGTH,
    `Keep your password to ${MAX_PASSWORD_LENGTH} characters or fewer.`,
  );

// SIGN-IN password is min(1) ONLY. Never apply the length/strength rules to the gate:
// a user whose password predates a rule change (or who set a shorter one before) must
// still be able to log in. Strength rules belong on creation/change, not sign-in.
export const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

// First-time set on a passwordless account (no current password to re-enter — the active
// verified session is the ownership proof). `confirm` guards typos.
export const setPasswordSchema = z
  .object({ password: passwordField, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });

// Change an existing password: re-confirm the current one (verified server-side via the
// verify_current_password RPC) before the client-side updateUser write.
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    password: passwordField,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });

export type SignInValues = z.output<typeof signInSchema>;
export type SetPasswordValues = z.output<typeof setPasswordSchema>;
export type ChangePasswordValues = z.output<typeof changePasswordSchema>;
