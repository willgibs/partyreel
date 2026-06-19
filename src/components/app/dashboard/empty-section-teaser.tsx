import { cn } from "@/lib/utils";

// A few ghost tiles at varied widths to preview the masonry the section will fill.
const GHOSTS: { src: string; w: string }[] = [
  { src: "/guest-ghost/g04.webp", w: "w-10" },
  { src: "/guest-ghost/g05.webp", w: "w-14" },
  { src: "/guest-ghost/g06.webp", w: "w-11" },
  { src: "/guest-ghost/g07.webp", w: "w-12" },
];

/**
 * The SLIM section teaser (Phase 5 S2b) for an empty Uploads or Likes section.
 * Per the per-section model: a free user is not only a host (they may have
 * saved/uploads/likes from OTHER events, or none yet), so each content section
 * shows an INVITING teaser when empty instead of a sad box — gentle onboarding +
 * feature intro that also keeps a lone-event page feeling full. Parameterized
 * (heading + blurb) so Uploads and Likes share it.
 */
export function EmptySectionTeaser({
  heading,
  blurb,
}: {
  heading: string;
  blurb: string;
}) {
  return (
    <section aria-label={heading}>
      <h2 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {heading}
      </h2>
      <div className="mt-2.5 flex items-center gap-4 rounded-xl border border-dashed border-border bg-muted/20 p-4">
        <div
          aria-hidden
          className="flex shrink-0 items-center gap-[3px] opacity-25 grayscale"
        >
          {GHOSTS.map(({ src, w }) => (
            // eslint-disable-next-line @next/next/no-img-element -- tiny local decorative asset
            <img
              key={src}
              src={src}
              alt=""
              loading="lazy"
              className={cn("h-14 rounded-[3px] object-cover", w)}
            />
          ))}
        </div>
        <p className="text-sm text-balance text-muted-foreground">{blurb}</p>
      </div>
    </section>
  );
}
