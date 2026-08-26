import { cn } from "@/lib/utils";

/**
 * The two-sided walkthrough's side marker, ONE quiet convention everywhere
 * (hero legend + every spine step): a mono, uppercase, hairline chip in plain
 * ink. Deliberately amber-free and color-free; the sides are labels, not
 * states (the amber register stays reserved for the app's live review queue).
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
        "inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase",
        className,
      )}
    >
      {children}
    </span>
  );
}
