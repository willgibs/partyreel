import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type RouteSkeletonVariant = "pulse" | "hub" | "studio";

/**
 * ONE ROUTE SKELETON, THREE SHAPES (`app-vocabulary` r1, `loading=asneeded`:
 * the dashboard, the event hub and the reel Studio share one real trait the
 * other four host routes do not — a genuine wait before first paint (all
 * three presign at least one URL before they can render anything), so one
 * shared primitive is wired to exactly those three, named as a rule rather
 * than spread to routes already instant (Settings, Account) or stripped from
 * where it is earned).
 *
 * `dashboard/loading.tsx` and `dashboard/[eventId]/loading.tsx` BECAME this
 * (their content moved here byte for byte, so nothing about either shape
 * changed); the Studio gets its FIRST skeleton here, on its real shape
 * (`reel-studio.tsx`) rather than the sandbox exploration's rough grid sketch
 * ("nothing like this ships today, never a proposal for its exact layout" —
 * that file's own caption).
 */
export function RouteSkeleton({
  variant,
}: {
  variant: RouteSkeletonVariant;
}) {
  if (variant === "pulse") return <PulseSkeleton />;
  if (variant === "hub") return <HubSkeleton />;
  return <StudioSkeleton />;
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

// A shimmer block for the Studio's always-dark room. The shared Skeleton's
// gradient is tinted off --color-foreground (a THEME token), which on this
// room's literal oklch(0.11 0 0) reads as a stray light patch on roughly half
// of all visits (the room ignores the site's light/dark preference on
// purpose, reel-studio.tsx's own words: "its own world"). White at low alpha
// instead, the same shimmer sweep, hand-composed rather than overriding
// Skeleton's own background classes (an arbitrary bg-[linear-gradient(...)]
// beside another is the kind of override tailwind-merge is not guaranteed to
// resolve the way a reader expects).
function DarkSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-md bg-white/10 bg-[linear-gradient(100deg,transparent_38%,rgba(255,255,255,0.14)_50%,transparent_62%)] bg-[length:200%_100%] motion-reduce:animate-none",
        className,
      )}
    />
  );
}

// The Studio's own shape (reel-studio.tsx): a fixed, full-bleed, always-dark
// room — exit left, the room's name centered, one loud action right; the
// canvas as the room, centred and capped at the player's own widths; the
// filmstrip dock; the five-chip control tray. NOT a bare `space-y-6` div: the
// real room sits OUTSIDE the (app) shell's light chrome entirely (`fixed
// inset-x-0 top-0 z-40`), so a light skeleton in the normal flow would flash
// the app's background for one frame before the room paints over it.
function StudioSkeleton() {
  return (
    <div
      aria-busy
      className="fixed inset-x-0 top-0 z-40 flex h-dvh flex-col overflow-x-clip bg-[oklch(0.11_0_0)]"
    >
      {/* Header: exit left, the room's name, one loud action right. */}
      <div className="relative z-10 flex items-center justify-between gap-2 px-3 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2">
        <DarkSkeleton className="size-9 shrink-0 rounded-full" />
        <div className="flex min-w-0 flex-col items-center gap-1.5">
          <DarkSkeleton className="h-2.5 w-20" />
          <DarkSkeleton className="h-2 w-14" />
        </div>
        <DarkSkeleton className="h-9 w-20 shrink-0 rounded-action-sm" />
      </div>

      {/* The canvas: the reel's own frame, centred and capped exactly like
          CanvasReelPlayer (portrait by default — most reels start there). */}
      <div className="relative min-h-0 flex-1 px-6">
        <div className="mx-auto aspect-[9/16] h-full max-w-full">
          <DarkSkeleton className="mx-auto h-full w-full max-w-[360px] rounded-xl" />
        </div>
      </div>

      {/* The dock: the filmstrip's thumbnails. */}
      <div className="relative z-10 flex justify-center gap-1.5 px-3 pt-2">
        {Array.from({ length: 5 }, (_, i) => (
          <DarkSkeleton key={i} className="size-10 shrink-0 rounded-md" />
        ))}
      </div>

      {/* The control tray: Moments, Style, Cover, Length, Layout. */}
      <div className="relative z-10 flex justify-center gap-1.5 px-3 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {["w-16", "w-12", "w-14", "w-16", "w-14"].map((w, i) => (
          <DarkSkeleton key={i} className={cn("h-8 rounded-action-sm", w)} />
        ))}
      </div>
    </div>
  );
}
