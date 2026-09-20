"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Search, ShieldCheck } from "lucide-react";

import { signOutAction } from "@/app/(auth)/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import {
  OperatorAlerts,
  type OperatorAlertCounts,
} from "@/components/admin/operator-alerts";
import { Logo } from "@/components/shared/logo";
import { Kbd } from "@/components/shared/kbd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isNavActive, NAV } from "@/lib/admin/nav";
import { cn } from "@/lib/utils";

/**
 * THE TOOL BAR (`chrome=devtool`, Will 2026-09-20: "44 px, a breadcrumb naming
 * the surface, a live tag, the health chip and an initial").
 *
 * Twelve pixels handed back to the work, and four facts in the row that is
 * left: WHICH surface (the crumb), WHICH environment (the tag), whether
 * anything is WRONG (the chip), and who you are signed in as (the initial).
 * The bar it replaces spent its right half on a full email address and a Sign
 * out button an operator presses about once a month; both now live under the
 * initial, which is where the space came from.
 *
 * ★ THE `Ops` CHIP IS GONE AND ITS JOB IS THE CRUMB'S. It was a `text-[10px]`
 * one-off under the body ladder's floor, and it said something the breadcrumb
 * now says better: `/ Ops / Jobs` names the tool AND the surface in the same
 * width the chip used for the tool alone.
 *
 * ★ THE DROPDOWN SURVIVES BELOW `lg`, and that is not a fallback. The rail is
 * 232px of permanent structure that a laptop can afford and a narrow window
 * cannot, so under `lg` the same twelve surfaces are reached the way they
 * always were. `admin-nav.tsx` is unchanged and the admin-triage board still
 * imports it.
 */
export function AdminBar({
  email,
  alerts,
  /** `VERCEL_ENV`, read on the server: "production", "preview", or undefined in dev. */
  env,
  /** How many jobs need a look; null when the heartbeat could not be read. */
  unhealthyJobs,
  onOpenPalette,
}: {
  email: string | null;
  alerts: OperatorAlertCounts;
  env: string | null;
  unhealthyJobs: number | null;
  onOpenPalette: () => void;
}) {
  const pathname = usePathname();
  const active = NAV.find((item) => isNavActive(pathname, item.href));
  const initial = (email?.trim()[0] ?? "P").toUpperCase();

  return (
    <header className="sticky top-0 z-40 h-11 shrink-0 border-b bg-background/85 backdrop-blur">
      <div className="flex h-11 items-center justify-between gap-3 px-3 lg:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/admin"
            aria-label="Partyreel operations"
            className="flex shrink-0 items-center"
          >
            <Logo className="h-4" />
          </Link>

          {/* The crumb, at the caption step. It names the tool and then the
              surface, which is the whole of what the old chip plus the
              dropdown's trigger used to say between them. */}
          <nav
            aria-label="Breadcrumb"
            className="hidden min-w-0 items-center gap-2 text-caption text-muted-foreground lg:flex"
          >
            <span aria-hidden className="opacity-40">
              /
            </span>
            <span>Ops</span>
            {active && active.href !== "/admin" ? (
              <>
                <span aria-hidden className="opacity-40">
                  /
                </span>
                <span className="truncate font-medium text-foreground">
                  {active.label}
                </span>
              </>
            ) : null}
          </nav>

          {env ? (
            <Badge
              variant={env === "production" ? "outline" : "info"}
              className="hidden font-normal lg:inline-flex"
            >
              {env === "production" ? "live" : env}
            </Badge>
          ) : null}

          {/* Below `lg` the rail is not drawn, so the surfaces keep their
              dropdown. Above it the rail is the nav and this is dead weight. */}
          <span className="lg:hidden">
            <AdminNav />
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onOpenPalette}
            className="hidden text-muted-foreground lg:inline-flex"
          >
            <Search />
            Search
            <Kbd className="ml-0.5">{"⌘K"}</Kbd>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onOpenPalette}
            aria-label="Search the portal"
            className="lg:hidden"
          >
            <Search />
          </Button>

          {/* The chip beside the band: it says HOW MANY on a bad day and is not
              there at all on a good one, which is the whole of `health=portal`. */}
          {unhealthyJobs === null ? (
            <Badge variant="destructive" asChild>
              <Link href="/admin/jobs">Health unreadable</Link>
            </Badge>
          ) : unhealthyJobs > 0 ? (
            <Badge variant="warning" asChild>
              <Link href="/admin/jobs">
                {unhealthyJobs} {unhealthyJobs === 1 ? "job" : "jobs"} need
                {unhealthyJobs === 1 ? "s" : ""} you
              </Link>
            </Badge>
          ) : null}

          <OperatorAlerts {...alerts} />

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Operator menu"
              className={cn(
                "flex size-7 items-center justify-center rounded-full bg-muted text-caption font-medium transition-colors outline-none",
                "hover:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-muted/70",
              )}
            >
              {initial}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
                {email ?? "Signed in"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/security">
                  <ShieldCheck />
                  Two-factor and sessions
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Sign-out is the shared server action; on the subdomain it clears
                  the host-isolated admin cookies and redirects to /login. */}
              <form action={signOutAction}>
                <DropdownMenuItem asChild>
                  <button type="submit" className="w-full">
                    <LogOut />
                    Sign out
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
