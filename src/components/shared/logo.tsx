import { Aperture } from "lucide-react";

import { cn } from "@/lib/utils";

type LogoProps = {
  /** Render only the mark (no wordmark) — for tight spaces. */
  markOnly?: boolean;
  /**
   * Render only the wordmark (no mark tile). For surfaces where the mark's
   * filled tile competes with something nearby: the ink footer sits under a
   * white QR plate, and two white rectangles in one column read as a clash.
   */
  wordmarkOnly?: boolean;
  className?: string;
};

/**
 * Brand lockup. The mark is the single splash of `--brand` accent allowed in
 * neutral chrome (see globals.css). Logo is presentation only — wrap it in a
 * <Link> at the call site rather than baking navigation in here.
 */
export function Logo({
  markOnly = false,
  wordmarkOnly = false,
  className,
}: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-semibold tracking-tight",
        className,
      )}
    >
      {!wordmarkOnly && (
        <span className="flex size-7 items-center justify-center rounded-md bg-brand text-brand-foreground">
          <Aperture className="size-4" />
        </span>
      )}
      {!markOnly && <span className="text-lg">Partyreel</span>}
    </span>
  );
}
