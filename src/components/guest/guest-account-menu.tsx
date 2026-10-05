"use client";

import {
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Settings,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { ThemeSubmenu, initial } from "@/components/app/user-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HELP_CENTER_HREF } from "@/lib/content/help-links";

// The account menu shown in the guest event-page header for a LOGGED-IN visitor — the auth-aware
// swap of the "Start for free" CTA (see guest-header.tsx). It deliberately differs from the host
// UserMenu in two ways:
//   1. it adds a "Dashboard" entry (the guest page has no app nav) + an owner-only "Manage event"
//      deep link, so a signed-in visitor can get back into the app, and Your profile, the door the host
//      menu opens its account group with (her uploads, likes and connections: crumbs-81);
//   2. Sign out runs CLIENT-side (the onSignOut prop), so the visitor STAYS on the event page and
//      an account-required event re-gates, the job the removed "Not you? Switch guest" button did.
// It reuses the host menu's ThemeSubmenu (next-themes + hydration wiring) + initial() so the
// shared logic is single-sourced; the layout below intentionally mirrors UserMenu's.
export function GuestAccountMenu({
  email,
  displayName,
  avatarUrl,
  slug = null,
  seed,
  ownsThisEvent,
  eventId,
  onSignOut,
}: {
  email: string | null;
  displayName: string | null;
  /** Presigned avatar URL (server-side via /api/me/menu), or null for the initial-letter fallback. */
  avatarUrl: string | null;
  /**
   * Her claimed handle, from /api/me/menu, or null (not claimed, or not asked yet). It decides where Your profile
   * GOES, not whether it exists: `/u/<handle>` is a page only once a handle is claimed, so an account without one
   * opens `/me`, which holds the same sections and sends her on the day she has one (`UserMenu`'s own rule).
   */
  slug?: string | null;
  /** seedFor(user.id), from /api/me/menu — null until phase 2 resolves (GuestHeader). */
  seed?: string | null;
  /** True only when /api/me/menu confirmed ownership (RLS-scoped) — never inferred on the client. */
  ownsThisEvent: boolean;
  eventId: string;
  /** Client-side sign-out (clears the guest session, signs out, refreshes) — owned by GuestHeader. */
  onSignOut: () => void | Promise<void>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Avatar seed={seed ?? undefined}>
          {/* radix Avatar.Image auto-falls-back to the initial when src is null/fails. */}
          <AvatarImage src={avatarUrl ?? undefined} alt="" />
          <AvatarFallback>{initial(email, displayName)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Who you're signed in as: the editable display name (when set) above the email. */}
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          {displayName?.trim() ? (
            <>
              <span className="truncate leading-tight font-medium">
                {displayName}
              </span>
              <span className="truncate text-xs leading-tight font-normal text-muted-foreground">
                {email ?? "Your account"}
              </span>
            </>
          ) : (
            <span className="truncate leading-tight">
              {email ?? "Your account"}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* Owner-only deep link to the host event page (curate / settings). */}
        {ownsThisEvent && (
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/${eventId}`}>
              <SlidersHorizontal /> Manage event
            </Link>
          </DropdownMenuItem>
        )}
        {/* DOOR ONE, the person (as the host menu's first row): her uploads, likes and the people she follows,
            and the page everyone else sees. The same tab, like the app's two entry points below. */}
        <DropdownMenuItem asChild>
          <Link href={slug ? `/u/${slug}` : "/me"}>
            <UserRound /> Your profile
          </Link>
        </DropdownMenuItem>
        {/* The app entry points the guest page otherwise lacks. */}
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutDashboard /> Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account">
            <Settings /> Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Global light/dark/system theme picker (shared with the host menu). */}
        <ThemeSubmenu />
        {/* The standing door into help (help-center r1: "globally accessible for general
            questions as well"), the host menu's Help center row in its new tab, so the event
            page stays where it is. */}
        <DropdownMenuItem asChild>
          <a href={HELP_CENTER_HREF} target="_blank" rel="noopener noreferrer">
            <LifeBuoy /> Help center
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Client-side sign out — NOT the host menu's server action (which redirects to /login).
            preventDefault keeps radix from closing the menu out from under the async handler. */}
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void onSignOut();
          }}
        >
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
