import { cn } from "@/lib/utils";

/**
 * A neutral phone bezel for the mobile-first screens. Deliberately direction-
 * agnostic (near-black hardware in every direction) so only the SCREEN inside
 * carries the identity being judged. Decorative; mockup content is aria-hidden
 * at the screen level.
 */
export function PhoneShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[360px]", className)}>
      <div className="rounded-[2.75rem] bg-zinc-950 p-2 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.5)] ring-1 ring-black/40">
        <div className="relative overflow-hidden rounded-[2.25rem] bg-background">
          {/* notch */}
          <div className="absolute top-2 left-1/2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-zinc-950" />
          <div className="relative aspect-[9/18.5] overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
