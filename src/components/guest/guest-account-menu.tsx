"use client";

import { LayoutDashboard, LogOut, Settings, SlidersHorizontal } from "lucide-react";
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

// The account menu shown in the guest event-page header for a LOGGED-IN visitor — the auth-aware
// swap of the "Start for free" CTA (see guest-header.tsx). It deliberately differs from the host
// UserMenu in two ways:
//   1. it adds a "Dashboard" entry (the guest page has no app nav) + an owner-only "Manage event"
//      deep link, so a signed-in visitor can get back into the app;
//   2. Sign out runs CLIENT-side (the onSignOut prop), so the visitor STAYS on the event page and
//      an account-required event re-gates, the job the removed "Not you? Switch guest" button did.
// It reuses the host menu's ThemeSubmenu (next-themes + hydration wiring) + initial() so the
// shared logic is single-sourced; the layout below intentionally mirrors UserMenu's.
export function GuestAccountMenu({
  email,
  displayName,
  avatarUrl,
  ownsThisEvent,
  eventId,
  onSignOut,
}: {
  email: string | null;
  displayName: string | null;
  /** Presigned avatar URL (server-side via /api/me/menu), or null for the initial-letter fallback. */
  avatarUrl: string | null;
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
        <Avatar>
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
