import { Minus } from "lucide-react";

import DashboardLoading from "@/app/(app)/dashboard/loading";
import EventDetailLoading from "@/app/(app)/dashboard/[eventId]/loading";
import { Logo } from "@/components/shared/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * LOADING: the two real `loading.tsx` files that exist today (imported
 * verbatim, not recreated), a coverage strip for the other five routes, and
 * an illustrative sketch of the one route that has NEITHER a skeleton NOR an
 * instant shell today: the Reel Studio.
 *
 * ★ THE STUDIO IS A FINDING, NOT A GIVEN. `dashboard/[eventId]/reel/page.tsx`
 * awaits `listEventMedia` + three more queries before it returns anything (the
 * same presign-before-paint shape as the two routes that DO have a skeleton),
 * and it has no `loading.tsx` at all: today it freezes the previous screen
 * rather than showing either treatment. So "two of seven" is not two DELIBERATE
 * choices and five deliberate omissions — it is two routes that got the
 * scaffold and one equally heavy route that was missed, plus four routes that
 * never needed it (Welcome and the wizard are client-paced; Settings and
 * Account read one light row). The sketch below is captioned as one: a rough
 * mock of the shape a shared primitive would take there, never a proposal for
 * its exact layout.
 */

const ROUTES: { name: string; needsWait: boolean }[] = [
  { name: "Dashboard", needsWait: true },
  { name: "Event page", needsWait: true },
  { name: "Reel Studio", needsWait: true },
  { name: "Settings", needsWait: false },
  { name: "New event", needsWait: false },
  { name: "Welcome", needsWait: false },
  { name: "Account", needsWait: false },
];

export type LoadingOption = "everywhere" | "none" | "asneeded";

/** Whether ROUTE gets a skeleton under OPTION. */
function skeletonOn(option: LoadingOption, needsWait: boolean): boolean {
  if (option === "everywhere") return true;
  if (option === "none") return false;
  return needsWait;
}

function RouteChip({ name, on }: { name: string; on: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        on
          ? "border-border bg-muted text-foreground"
          : "border-dashed border-border/70 text-muted-foreground",
      )}
    >
      {on ? (
        <Skeleton className="h-2 w-4 rounded-full" />
      ) : (
        <Minus className="size-3" aria-hidden />
      )}
      {name}
    </div>
  );
}

/** A rough mock of the Studio's Moments grid + filmstrip, in the SAME
 *  primitive (`Skeleton`) the two real files already use — not a new
 *  component, not a claim about its final layout. */
function StudioSketch() {
  return (
    <div className="space-y-3 rounded-lg border border-dashed border-border p-3" aria-hidden>
      <p className="text-[10px] text-muted-foreground">
        The Reel Studio, sketched: nothing like this ships today
      </p>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-7 w-20 rounded-action-sm" />
      </div>
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
        {Array.from({ length: 12 }, (_, i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-md" />
        ))}
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-10 shrink-0 rounded-md" />
        ))}
      </div>
    </div>
  );
}

/** What "none" draws instead of a skeleton: the header paints; nothing below
 *  it waits on anything, because there is nothing left to draw a fallback for. */
function InstantShell() {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-3 flex items-center justify-between border-b border-border/60 pb-3">
        <Logo />
        <span className="size-6 rounded-full bg-muted" />
      </div>
      <p className="text-xs text-muted-foreground">
        Nothing renders here. The shell is already the real one; only a
        section with a genuine wait (none, under this option) would carry its
        own scoped placeholder.
      </p>
    </div>
  );
}

export function LoadingShowcase({ option }: { option: LoadingOption }) {
  const dashboardOn = skeletonOn(option, true);
  const studioOn = skeletonOn(option, true) && option !== "none";

  return (
    <div className="min-h-full space-y-4 bg-background p-5 text-foreground">
      <div className="flex flex-wrap gap-1.5">
        {ROUTES.map((r) => (
          <RouteChip key={r.name} name={r.name} on={skeletonOn(option, r.needsWait)} />
        ))}
      </div>

      {dashboardOn ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-border p-3">
            <p className="mb-2 text-[10px] text-muted-foreground">
              Dashboard, the real loading.tsx
            </p>
            <DashboardLoading />
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="mb-2 text-[10px] text-muted-foreground">
              Event page, the real loading.tsx
            </p>
            <EventDetailLoading />
          </div>
          {studioOn && <StudioSketch />}
        </div>
      ) : (
        <InstantShell />
      )}
    </div>
  );
}
