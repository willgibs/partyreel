"use client";

import { estimatePasswordStrength } from "@/lib/validation/password-strength";
import { cn } from "@/lib/utils";

// Soft password-strength guidance (security remediation). Shown only while typing a NEW password (account
// set/change + event password); NEVER a gate -- the validators enforce the minimums. Craft (per the
// design-eng skill): a GPU-friendly scaleX fill (not width -> no layout), the house --ease-emphasis curve,
// 200ms, and reduced-motion-safe. The track is always present; only the fill + its color transition.
const FILL_COLORS = [
  "bg-red-500",
  "bg-red-500",
  "bg-amber-500",
  "bg-lime-500",
  "bg-emerald-500",
] as const;

export function PasswordStrengthMeter({ value }: { value: string }) {
  const { score, label } = estimatePasswordStrength(value);
  if (!value) return null;

  // A visible sliver the moment they start typing (score 0 still reads faint-red "Weak").
  const fraction = Math.max(0.08, score / 4);

  return (
    <div className="space-y-1" aria-live="polite">
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full origin-left rounded-full transition-[transform,background-color] duration-200 ease-[var(--ease-emphasis)] motion-reduce:transition-none",
            FILL_COLORS[score],
          )}
          style={{ transform: `scaleX(${fraction})` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Password strength:{" "}
        <span className="font-medium text-foreground">{label}</span>. Longer
        passwords are harder to guess.
      </p>
    </div>
  );
}
