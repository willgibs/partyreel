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
  UserRound,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import { signOutAction } from "@/app/(auth)/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuFooter,
  DropdownMenuGroup,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  /**
   * The claimed handle, or null. It decides where the profile door GOES, not
   * whether it exists: a host without one is offered the claim card rather
   * than a dead link (the handle is FREE for everyone, profiles-social.md).
   */
  slug?: string | null;
  /**
   * `seedFor(user.id)` (src/lib/avatar/seed.ts), computed by the caller —
   * never the raw id (a client never receives an id it does not already
   * hold). Paints the account's colour until a real photo replaces it.
   */
  seed?: string | null;
};

// Theme picker options. Each mode has its own icon; the active one gets a trailing
// check. `as const` narrows `value` to the literal union next-themes' setTheme wants.
const THEME_OPTIONS = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
] as const;

// Exported so the guest event-page account menu (guest-account-menu.tsx) reuses the
// exact same initial-letter logic as the host menu.
export function initial(email: string | null, displayName: string | null) {
  const source = displayName?.trim() || email?.trim() || "";
  return source ? source.charAt(0).toUpperCase() : "?";
}

// Theme submenu for the account dropdown. The chosen theme is GLOBAL: next-themes
// sets the `.dark` class on <html> and persists to localStorage, so it also styles
// the marketing site (this menu is the only toggle UI). `theme` is undefined during
// SSR / first paint, so a `mounted` flag keeps the live state (trigger icon + active
// check) hydration-safe; before mount we show the neutral Monitor (= system default).
// Exported so the guest event-page account menu reuses this next-themes + hydration
// wiring verbatim (the one piece both menus must never duplicate).
export function ThemeSubmenu() {
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
        {/* The submenu carries its own label, the same part the parent's groups
            use (Will, 2026-09-17: Glass's quieter group labels, "the submenu's
            own label included"). A branch that opens with no heading makes the
            reader hold the trigger's word in their head while they read. */}
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
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

export function UserMenu({
  email,
  displayName,
  avatarUrl,
  slug = null,
  seed = null,
}: UserMenuProps) {
  // ★ THE HANDLE-LESS DOOR. /u/<slug> does not exist until a handle is claimed,
  // and claiming it is free, so the door leads to the claim card rather than
  // disappearing: #public-profile is the id on /account's Public profile card,
  // the same anchor the after-upload prompt uses. A host who has never thought
  // about a handle taps "Your profile" and lands on the one box that gives
  // them one.
  const profileHref = slug ? `/u/${slug}` : "/account#public-profile";
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
      {/* Override the trigger-width default (the avatar is tiny) — twMerge keeps
          this later w-56. align=end so it hangs from the right edge. */}
      {/* ★ 224px IS A PHONE MEASUREMENT, NOT A TASTE. This menu holds the one
          submenu in the product, and a submenu is fully visible only while it is
          narrower than the room beside its parent (radix flips it to the roomier
          side and then keeps it attached to its trigger). At 375 the container's
          px-4 puts this panel's right edge at 359, so w-56 leaves 135px to its
          left and the theme picker measures 121px: it fits with 14px to spare.
          At w-60 the room is 119px and the picker hangs off the screen. Widen
          this and re-measure the picker, or the theme rows go over the edge. */}
      <DropdownMenuContent align="end" className="w-56">
        {/* THE TITLE ROW, which is what the identity block always wanted to be
            (Card, Will 2026-09-17). It was a DropdownMenuLabel wearing a
            two-line flex column, so the part that names GROUPS was also the part
            that named the person: two jobs, one slot. Who you are signed in as
            is the menu's SUBJECT, so it takes the header: the editable display
            name (when set) over the email, which is always shown because it is
            the "who am I" answer. */}
        {/* THE TITLE ROW, which is what the identity block always wanted to be
            (Card, Will 2026-09-17). Who you are signed in as is the menu's
            SUBJECT, so it takes the header: the editable display name (when
            set) over the email, which is always shown because it is the
            "who am I" answer.

            ★ IT IS NOT THE PROFILE DOOR, AND THE REASON IS MECHANICAL. The
            brief offered the header as that door to buy the second door for
            zero rows; `DropdownMenuHeader` is a plain <div> with no `asChild`,
            and `ui/dropdown-menu.tsx` belongs to another lane this round. The
            workaround — a bare <a> inside the header — is reachable by Tab but
            NOT by the arrow keys radix gives every real menu item, so the one
            door a keyboard user would look for would be the one they could not
            walk to. So the two doors are two rows instead. The w-56 measurement
            below is horizontal (the submenu clearing a 375 screen) and a row
            does not touch it. His to overrule. */}
        <DropdownMenuHeader>
          {displayName?.trim() ? (
            <>
              <span className="block truncate">{displayName}</span>
              <span className="block truncate text-xs leading-tight font-normal text-muted-foreground">
                {email ?? "Your account"}
              </span>
            </>
          ) : (
            <span className="block truncate">{email ?? "Your account"}</span>
          )}
        </DropdownMenuHeader>
        {/* TWO GROUPS WHERE THERE WERE THREE SEPARATORS. The rows never changed
            what they do; the menu simply says which are yours and which are
            ours, which is the whole of Card's argument. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>Your account</DropdownMenuLabel>
          {/* DOOR ONE — the person: their own photographs, their likes, the
              people they follow, and the page everyone else sees. */}
          <DropdownMenuItem asChild>
            <Link href={profileHref}>
              <UserRound /> Your profile
            </Link>
          </DropdownMenuItem>
          {/* DOOR TWO — the money and the settings: plan, billing, password,
              sign-in. Same-tab, unlike the external links below. */}
          <DropdownMenuItem asChild>
            <Link href="/account">
              <Settings /> Account
            </Link>
          </DropdownMenuItem>
          {/* Global light/dark/system theme picker (see ThemeSubmenu). The one
              nested menu in the product, and the reason the submenu had to be
              portalled before it could be kept. */}
          <ThemeSubmenu />
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Partyreel</DropdownMenuLabel>
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
        </DropdownMenuGroup>
        {/* THE FOOTER RAIL: signing out is the one row here you cannot undo
            without typing a password again, so it gets a ground of its own
            rather than a hairline. Sign-out is a server action; a form submit
            clears cookies on the response, then signOutAction redirects to
            /login. */}
        <DropdownMenuFooter>
          <form action={signOutAction}>
            <DropdownMenuItem asChild>
              <button type="submit" className="w-full">
                <LogOut /> Sign out
              </button>
            </DropdownMenuItem>
          </form>
        </DropdownMenuFooter>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
