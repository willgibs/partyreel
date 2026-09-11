/**
 * The desktop browser mock the two open marketing boards render inside
 * (decomposition, hero substrate): a chrome strip and a viewport that scrolls
 * INTERNALLY (fixed height), so a board's scroll choreography is self-contained
 * and comparable side by side. Trimmed to this one component in the library
 * round (2026-09-02): the useInView / Reveal / usePrefersReducedMotion copies
 * that used to live here duplicated production hooks (@/lib/shared) and died
 * with the boards that imported them.
 */

/** The desktop browser mock every direction lives in. The viewport scrolls
 *  internally (fixed height) so each direction's scroll choreography is
 *  self-contained and comparable side by side. */
export function DesktopFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background shadow-[0_24px_60px_-32px_rgba(0,0,0,0.35)]">
      <div className="flex items-center gap-2 border-b bg-muted/60 px-3 py-2">
        <span className="flex gap-1.5">
          <i className="size-2.5 rounded-full bg-border" />
          <i className="size-2.5 rounded-full bg-border" />
          <i className="size-2.5 rounded-full bg-border" />
        </span>
        <span className="mx-auto flex h-6 w-56 items-center justify-center rounded-md bg-background text-[11px] text-muted-foreground">
          partyreel.com
        </span>
        {/* Right spacer mirrors the dots so the address pill stays centered. */}
        <span className="w-[46px]" aria-hidden />
      </div>
      <div className="h-[560px] overflow-y-auto overscroll-contain">
        {children}
      </div>
    </div>
  );
}
