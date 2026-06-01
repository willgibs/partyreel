"use client";

import { ArrowLeft, LifeBuoy, LogOut } from "lucide-react";
import Link from "next/link";

import { signOutAction } from "@/app/(auth)/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserMenuProps = {
  email: string | null;
  displayName: string | null;
};

function initial(email: string | null, displayName: string | null) {
  const source = displayName?.trim() || email?.trim() || "";
  return source ? source.charAt(0).toUpperCase() : "?";
}

export function UserMenu({ email, displayName }: UserMenuProps) {
  const label = displayName?.trim() || email || "Your account";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Avatar>
          <AvatarFallback>{initial(email, displayName)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      {/* Override the trigger-width default (the avatar is tiny) — twMerge keeps
          this later w-56. align=end so it hangs from the right edge. */}
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* Cross-group nav so a host can hop to the marketing site or help center
            without signing out; their session persists, and /login now redirects
            an already-authenticated visitor straight back into the app. Both are
            plain Links (same tab) — the menu closes and navigates on select. */}
        <DropdownMenuItem asChild>
          <Link href="/">
            <ArrowLeft /> Back to site
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/help">
            <LifeBuoy /> Help center
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Sign-out is a server action; a form submit clears cookies on the
            response, then signOutAction redirects to /login. */}
        <form action={signOutAction}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut /> Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
