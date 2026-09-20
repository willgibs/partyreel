import { Skeleton } from "@/components/ui/skeleton";

/**
 * The hub's streaming fallback. It presigns two URLs per media item before
 * paint, so this holds the shape meanwhile.
 *
 * ★ IT MATCHES THE HUB, NOT THE PAGE THE HUB REPLACED. The old fallback drew a
 * heading, a wide command-strip bar and a four-column grid; against the hub
 * that read as the retired strip flashing into existence and then being
 * replaced by a row of cards, which is exactly the kind of flicker a skeleton
 * exists to prevent. The blocks below are the code, the title stack, the cards
 * row and the album, in that order and at those sizes.
 *
 * The (app) layout's AppShell already supplies <main> + Container chrome, so
 * this returns a BARE root matching the page's own.
 */
export default function EventDetailLoading() {
  return (
    <div className="space-y-6" aria-busy>
      {/* The code beside the title + metadata + link stack. */}
      <div className="flex max-w-7xl items-center gap-4 sm:gap-5">
        <Skeleton className="size-28 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </div>
      </div>
      {/* The cards row: four doors at their resting height. */}
      <div className="flex gap-2 py-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 w-36 shrink-0 rounded-xl sm:w-40" />
        ))}
      </div>
      {/* The album. */}
      <div className="space-y-2.5">
        <Skeleton className="h-5 w-36" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
