/**
 * THE SIX-DIGIT EMAIL CODE, ONE EXPORT: the sign-in door (email-sign-in.tsx), the
 * account delete card (account-delete-card.tsx) and the email change machine
 * (email-change.ts, re-exported as EMAIL_CODE_LENGTH for email-actions.ts and
 * email-section.tsx) all render this many boxes and validate against it.
 *
 * MUST stay in lockstep with the Supabase "Email OTP Length" setting (Dashboard →
 * Authentication → Sign In / Providers → Email). Supabase enforces a 6-digit MINIMUM
 * for email OTP (a 4-digit email code isn't offered), and 6 is the standard. A
 * hand-synced pair, like tier_limits() ↔ tiers.ts: if the dashboard length changes,
 * change this constant (it drives every input's maxLength and rendered slot count).
 * The code will not verify if the two drift.
 */
export const CODE_LENGTH = 6;
