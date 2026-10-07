import { Skeleton } from "@/components/ui/skeleton";

/**
 * THE OWNER MODE'S WAIT: the two galleries' bands, at the bands' size. The profile page (`/u/[slug]`) and `/me` (an
 * account with no handle keeps the same sections there) each stream `OwnerSections` behind this, in a boundary of
 * their own inside the page and never a `loading.tsx` (profiles-social.md says why). Neither draws its own gap
 * above: the page that holds it does, as it does for the sections themselves.
 */
export function OwnerSkeleton() {
  return (
    <div className="space-y-8" aria-busy>
      {Array.from({ length: 2 }, (_, band) => (
        <div key={band} className="space-y-2.5">
          <Skeleton className="h-3 w-24" />
          <div className="grid grid-cols-3 gap-[var(--gap-gallery)] sm:grid-cols-6 lg:grid-cols-9">
            {Array.from({ length: 9 }, (_, i) => (
              <Skeleton
                key={i}
                className="aspect-square w-full rounded-[var(--radius-tile)]"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
