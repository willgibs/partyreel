import { cn } from "@/lib/utils";

/**
 * The two-sided walkthrough's side marker, ONE quiet convention everywhere
 * (hero legend + every spine step): an uppercase, tracked, hairline chip in
 * plain ink, on the body face at the eyebrow's own weight (kill-mono,
 * 2026-09-14). Deliberately amber-free and color-free; the sides are labels,
 * not states (the amber register stays reserved for the app's review queue).
 */
export function SideChip({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase",
        className,
      )}
    >
      {children}
    </span>
  );
}
