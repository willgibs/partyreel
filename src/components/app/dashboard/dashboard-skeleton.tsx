import { Skeleton } from "@/components/ui/skeleton";

/**
 * THE HOME'S SHAPE WHILE IT READS (`loading=asneeded`: the dashboard presigns before it can paint):
 * the head, the stage, a week of parties, and the first group of tiles, in the page's own places and
 * at its own sizes, so nothing jumps when the page lands. It lives with the dashboard, so the page and
 * its skeleton change in one place; `RouteSkeleton`'s `pulse` draws it and holds the bar's trail.
 *
 * The (app) layout's AppShell already supplies the chrome, so this is a BARE root matching the page's
 * own (`data-app-wide`, or it would paint at 1280 first and jump).
 */
export function DashboardSkeleton() {
  return (
    <div data-app-wide className="space-y-7 lg:space-y-9" aria-busy>
      {/* The head: the day and its line, the ring and New event. */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="min-w-0 flex-1 space-y-2 sm:flex sm:flex-none sm:items-center sm:gap-4 sm:space-y-0">
          <Skeleton className="h-7 w-44 sm:w-56" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="hidden h-8 w-16 rounded-full sm:ml-auto sm:block" />
        <Skeleton className="h-8 w-28 rounded-action-sm" />
      </div>
      {/* The stage: a picture on top in a hand, words beside it at a desk. */}
      <div className="flex flex-col overflow-hidden rounded-2xl lg:grid lg:h-[clamp(420px,30vw,560px)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Skeleton className="order-first aspect-[4/3] w-full rounded-none lg:order-last lg:aspect-auto lg:h-full" />
        <div className="space-y-3 bg-muted/60 p-5 sm:p-8 lg:p-10">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-2 pt-4">
            <Skeleton className="h-9 w-28 rounded-action-sm" />
            <Skeleton className="h-9 w-20 rounded-action-sm" />
          </div>
        </div>
      </div>
      {/* The first group of tiles, at its own fluid columns. */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(calc(50%_-_6px),240px),1fr))] gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="aspect-[3/2] w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
