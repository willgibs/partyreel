import { EVENT_CARD_GRID } from "@/components/app/dashboard/event-card-grid";
import { Skeleton } from "@/components/ui/skeleton";

export type RouteSkeletonVariant = "pulse" | "hub";

/**
 * ONE ROUTE SKELETON, TWO SHAPES (`app-vocabulary` r1, `loading=asneeded`:
 * the dashboard and the event hub share one real trait the other host routes
 * do not, a genuine wait before first paint (both presign URLs before they can
 * render anything), so one shared primitive is wired to exactly those two,
 * named as a rule rather than spread to routes already instant (Settings,
 * Account) or stripped from where it is earned).
 *
 * `dashboard/loading.tsx` and `dashboard/[eventId]/loading.tsx` BECAME this
 * (their content moved here byte for byte, so nothing about either shape
 * changed). The reel Studio's shape left with the Studio: the live reel makes
 * itself, and a clip's room opens over the reel, never as a route.
 */
export function RouteSkeleton({ variant }: { variant: RouteSkeletonVariant }) {
  if (variant === "pulse") return <PulseSkeleton />;
  return <HubSkeleton />;
}

// The dashboard's pulse: header + the next-step band + the arrivals strip +
// the storage line + the events list. It deliberately mirrors the bands and
// NOT the old filter chips, which retired with the inbox (home-wiring,
// 2026-09-20) — a skeleton that promises chips the page will never render is
// a worse jump than no skeleton at all.
// The (app) layout's AppShell already supplies <main> + Container chrome, so
// this returns a BARE root matching the page's own (<div className="space-y-6">).
function PulseSkeleton() {
  return (
    // Wide like the page (`data-app-wide`), or it would paint at 1280 first.
    <div data-app-wide className="space-y-6" aria-busy>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-8 w-28 rounded-action-sm" />
      </div>
      {/* band 1 — what needs you */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-48 rounded-full" />
        ))}
      </div>
      {/* band 2 — just arrived */}
      <div className="space-y-2.5">
        <Skeleton className="h-5 w-36" />
        <div className="grid grid-cols-4 gap-[var(--gap-gallery)] sm:grid-cols-8 xl:grid-cols-12">
          {Array.from({ length: 12 }, (_, i) => (
            <Skeleton
              key={i}
              className="aspect-square w-full rounded-[var(--radius-tile)]"
            />
          ))}
        </div>
      </div>
      {/* band 3 — the storage line */}
      <Skeleton className="h-5 w-full" />
      {/* band 4 — your events, with the heading and its controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-40 rounded-lg" />
        </div>
        <div className={EVENT_CARD_GRID}>
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="aspect-[16/10] w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

// The hub's streaming fallback. It presigns two URLs per media item before
// paint, so this holds the shape meanwhile.
//
// ★ IT MATCHES THE HUB, NOT THE PAGE THE HUB REPLACED. The old fallback drew a
// heading, a wide command-strip bar and a four-column grid; against the hub
// that read as the retired strip flashing into existence and then being
// replaced by a row of cards, which is exactly the kind of flicker a skeleton
// exists to prevent. The blocks below are the code, the title stack, the cards
// row and the album, in that order and at those sizes.
//
// The (app) layout's AppShell already supplies <main> + Container chrome, so
// this returns a BARE root matching the page's own.
function HubSkeleton() {
  return (
    // ★ WIDE BEFORE THE PAGE IS: the hub asks the shell for its wide width and
    // gutter with `data-app-wide`, and a skeleton that did not would paint at
    // 1280 and jump the moment the page streamed in.
    <div data-app-wide className="space-y-6" aria-busy>
      {/* The code beside the title + metadata + link stack. */}
      <div className="flex items-center gap-4 sm:gap-5">
        <Skeleton className="size-28 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </div>
      </div>
      {/* The cards row at rest: a phone's 2x2 grid, the row of tiles from
          `sm` (event-feed/room-card.ts). */}
      <div className="grid grid-cols-2 gap-2 py-2 sm:flex">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton
            key={i}
            className="h-16 shrink-0 rounded-xl sm:h-24 sm:w-36 md:w-40"
          />
        ))}
      </div>
      {/* The album: as many columns as the album's default tile size holds
          at this width, so a wide window is not four giant squares. */}
      <div className="space-y-2.5">
        <Skeleton className="h-5 w-36" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
          {Array.from({ length: 12 }, (_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
