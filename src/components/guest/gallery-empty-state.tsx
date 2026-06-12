import { Button } from "@/components/ui/button";

// The "photographic promise" empty state (Phase 4, the ratified V3): a faint
// ghost mosaic fills the gallery area with a centered CTA floating over it, so
// a brand-new event reads as "your photos go HERE" rather than a blank void.
// The mosaic photos are the optimized guest-ghost pack (small grayscale WebPs,
// ~3-8KB each), rendered at 25% opacity + grayscale + aria-hidden so they're
// pure atmosphere. When the viewer can't upload (uploads off), the CTA drops
// and the mosaic stands alone.
const GHOSTS = Array.from(
  { length: 9 },
  (_, i) => `/guest-ghost/g0${i + 1}.webp`,
);

export function GalleryEmptyState({
  onAddFirst,
}: {
  /** Present only when the viewer can upload — drives the CTA. */
  onAddFirst?: () => void;
}) {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="grid grid-cols-3 gap-1.5 opacity-25 grayscale [content-visibility:auto]"
      >
        {GHOSTS.map((src) => (
          // eslint-disable-next-line @next/next/no-img-element -- tiny local decorative asset
          <img
            key={src}
            src={src}
            alt=""
            loading="lazy"
            className="aspect-square w-full rounded-[3px] object-cover"
          />
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-heading text-2xl text-balance">
          This is where it all lands
        </p>
        {onAddFirst && (
          <Button size="lg" onClick={onAddFirst}>
            Be the first to add a photo
          </Button>
        )}
      </div>
    </div>
  );
}
