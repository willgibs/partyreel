"use client";

import {
  ArrowLeft,
  Check,
  LifeBuoy,
  LogOut,
  Monitor,
  Moon,
  Settings,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import { signOutAction } from "@/app/(auth)/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserMenuProps = {
  email: string | null;
  displayName: string | null;
  /** Presigned avatar URL (server-side), or null to show the initial-letter fallback. */
  avatarUrl: string | null;
};

// Theme picker options. Each mode has its own icon; the active one gets a trailing
// check. `as const` narrows `value` to the literal union next-themes' setTheme wants.
const THEME_OPTIONS = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
] as const;

function initial(email: string | null, displayName: string | null) {
  const source = displayName?.trim() || email?.trim() || "";
  return source ? source.charAt(0).toUpperCase() : "?";
}

// Theme submenu for the account dropdown. The chosen theme is GLOBAL: next-themes
// sets the `.dark` class on <html> and persists to localStorage, so it also styles
// the marketing site (this menu is the only toggle UI). `theme` is undefined during
// SSR / first paint, so a `mounted` flag keeps the live state (trigger icon + active
// check) hydration-safe; before mount we show the neutral Monitor (= system default).
function ThemeSubmenu() {
  const { theme, setTheme } = useTheme();
  // Client-only gate (no set-state-in-effect) so the live theme renders only
  // after hydration; mirrors the useSyncExternalStore feature-detect in
  // guest-share.tsx. false on the server + first paint, true once hydrated.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const TriggerIcon =
    mounted && theme === "light"
      ? Sun
      : mounted && theme === "dark"
        ? Moon
        : Monitor;

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <TriggerIcon /> Theme
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {THEME_OPTIONS.map(({ value, label, Icon }) => (
          <DropdownMenuItem key={value} onSelect={() => setTheme(value)}>
            <Icon /> {label}
            {mounted && theme === value ? <Check className="ml-auto" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

export function UserMenu({ email, displayName, avatarUrl }: UserMenuProps) {
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
      {/* Override the trigger-width default (the avatar is tiny) — twMerge keeps
          this later w-56. align=end so it hangs from the right edge. */}
      <DropdownMenuContent align="end" className="w-56">
        {/* Who you're signed in as: the editable display name (when set — the design touch) above
            the email (always shown — the critical "who am I" identifier). */}
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
        {/* In-app account settings (email, password / sign-in). Same-tab, unlike the
            external links below. */}
        <DropdownMenuItem asChild>
          <Link href="/account">
            <Settings /> Account
          </Link>
        </DropdownMenuItem>
        {/* Cross-group links to the marketing site + help center. They open in a
            NEW tab (target=_blank) so the host keeps their place in the app and can
            use either as a side reference rather than navigating away; rel=noopener
            is the standard pairing for _blank. (Signing out is unaffected, and the
            recent /login guard means even a same-tab return would land them back in
            the app.) */}
        <DropdownMenuItem asChild>
          <Link href="/" target="_blank" rel="noopener noreferrer">
            <ArrowLeft /> Back to site
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/help" target="_blank" rel="noopener noreferrer">
            <LifeBuoy /> Help center
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Global light/dark/system theme picker (see ThemeSubmenu). */}
        <ThemeSubmenu />
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
