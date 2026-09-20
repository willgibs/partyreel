import { Skeleton } from "@/components/ui/skeleton";

// Navigation fallback for the dashboard (blocking RSC — streaming deferred, S1).
// Mirrors THE PULSE so the route swap doesn't jump: header + the next-step band
// + the arrivals strip + the storage line + the events list. It deliberately
// mirrors the bands and NOT the old filter chips, which retired with the inbox
// (home-wiring, 2026-09-20) — a skeleton that promises chips the page will
// never render is a worse jump than no skeleton at all.
// The (app) layout's AppShell already supplies <main> + Container chrome, so
// this returns a BARE root matching the page's own (<div className="space-y-6">).
export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="aspect-[16/10] w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
