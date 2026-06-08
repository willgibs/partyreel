/**
 * Pure, dependency-free password-strength heuristic for the SOFT strength meter (security remediation:
 * we KEEP the length minimums but GUIDE users toward stronger passwords rather than forcing character-class
 * rules). This is NOT a gate -- the validators are the real rules (lib/validation/auth.ts: min 8 for
 * accounts; the 4-char floor in event-password-control). Deliberately light (no zxcvbn) per the
 * cost-frugality posture: length tiers + character-class variety, which is what actually moves the needle.
 */
export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: "" | "Weak" | "Fair" | "Good" | "Strong";
};

export function estimatePasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "" };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) =>
    re.test(password),
  ).length;
  if (classes >= 3) score += 1;

  // Length is dominant: a short password can never read above "Weak", whatever the variety.
  if (password.length < 8) score = Math.min(score, 1);

  const clamped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const label = (["Weak", "Weak", "Fair", "Good", "Strong"] as const)[clamped];
  return { score: clamped, label };
}
