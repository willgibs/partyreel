import { DashboardSkeleton } from "@/components/app/dashboard/dashboard-skeleton";
import { CrumbsHold } from "@/components/shared/crumbs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export type RouteSkeletonVariant = "pulse" | "hub" | "account" | "welcome";

/**
 * ONE ROUTE SKELETON, ONE SHAPE PER ROUTE WITH A WAIT (`app-vocabulary` r1,
 * `loading=asneeded`: one shared primitive wired to exactly the routes with a
 * genuine wait before first paint, named as a rule rather than spread to routes
 * already instant or stripped from where it is earned). The dashboard and the
 * event hub presign before they can paint; since crumbs-44, Account and the
 * welcome too: Account grew to fourteen reads, then the picker's presigns, before
 * its first card, and the welcome builds every Guest card it counts.
 *
 * `dashboard/loading.tsx` and `dashboard/[eventId]/loading.tsx` BECAME this
 * (their content moved here byte for byte, so nothing about either shape
 * changed). The reel Studio's shape left with the Studio: the live reel makes
 * itself, and a clip's room opens over the reel, never as a route.
 *
 * ★ IT HOLDS THE APP BAR'S TRAIL (crumbs-19). A route with a loading.tsx
 * commits its new address with this skeleton on screen and its page lands a
 * wait later, so `CrumbsHold` keeps the last route's trail through the wait
 * (crumbs.tsx says why the bar cannot simply follow the address). It draws
 * nothing, so the skeleton's root is still the bare shape below.
 */
export function RouteSkeleton({ variant }: { variant: RouteSkeletonVariant }) {
  return (
    <>
      <CrumbsHold />
      {variant === "pulse" ? (
        // The dashboard's own shape, homed with the dashboard (host-dashboard r1's wiring).
        <DashboardSkeleton />
      ) : variant === "hub" ? (
        <HubSkeleton />
      ) : variant === "account" ? (
        <AccountSkeleton />
      ) : (
        <WelcomeSkeleton />
      )}
    </>
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

/** A card's header as the page draws it: the title, then its one line. */
function CardHeading({ title, line }: { title: string; line: string }) {
  return (
    <CardHeader>
      <Skeleton className={`h-5 ${title}`} />
      <Skeleton className={`h-4 ${line} max-w-full`} />
    </CardHeader>
  );
}

// Account's first screen: the heading and its line, then the Plan card (its
// two facts and its buttons), the Profile card (the photo row and the name) and
// the Public profile card, each on the real Card, so the skeleton's chrome is
// the page's own and only the bars give way when it lands.
//
// ★ THE PAGE'S OWN COLUMN, NOT THE SHELL'S WIDE ONE: Account is
// `mx-auto max-w-2xl`, and a skeleton at the shell's width would paint wide and
// snap narrow the moment the page streamed in. The (app) layout's AppShell
// supplies <main> + Container chrome, so this returns a BARE root.
function AccountSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6" aria-busy>
      <div className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      {/* Plan: two facts, then the buttons. */}
      <Card>
        <CardHeading title="w-14" line="w-56" />
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-7 w-20 rounded-action-sm" />
            <Skeleton className="h-7 w-28 rounded-action-sm" />
          </div>
        </CardContent>
      </Card>
      {/* Profile: the photo row, then the name. */}
      <Card>
        <CardHeading title="w-16" line="w-72" />
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 shrink-0 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-7 w-28 rounded-action-sm" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
      {/* Public profile: its line and the handle's field. */}
      <Card>
        <CardHeading title="w-28" line="w-80" />
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}

// The welcome's first screen is the name step for the account it most often
// greets (every account is born nameless, so a first visit names itself before
// any tour): the welcome's heading and line, the name field's label, guidance
// and input, and its full-width button, on the real Card at the flow's own
// `max-w-lg`. The (app) layout's AppShell supplies the chrome; a BARE root.
function WelcomeSkeleton() {
  return (
    <Card className="mx-auto w-full max-w-lg" aria-busy>
      <CardHeader className="space-y-2">
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-8 w-full rounded-lg" />
        <Skeleton className="h-8 w-full rounded-action-sm" />
      </CardContent>
    </Card>
  );
}
