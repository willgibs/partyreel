"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  isNavGroup,
  isNavItemCurrent,
  MARKETING_CTA,
  PRIMARY_NAV,
  type NavGroup,
} from "@/lib/constants/marketing-nav";
import { cn } from "@/lib/utils";

import { portalSkinProps, type MarketingSkin } from "./portal-skin";
import { useSignedInHint } from "./session-hint";

/**
 * THE MOBILE MENU (rebuilt full-screen, 2026-08-28, Will's ruling). The old
 * 288px right-hand sheet listed every group flattened and fully expanded, so a
 * phone got one long scroll of 17 undifferentiated links. This is the same
 * information as a full-screen surface with COLLAPSED groups: big touch rows,
 * one group open at a time, and the header bar mirrored at the top so the menu
 * reads as the site opening up rather than a drawer sliding over it.
 *
 * ★ THE PORTAL RULE (portal-skin.ts): the sheet portals to <body>, escaping the
 * marketing skin wrapper, so it must carry the skin class + data-mkt itself.
 * data-mkt matters twice over here: the disclosure clocks below are --mkt-acc-*
 * and would silently fall back without it.
 *
 * Everything animates through Tailwind utilities with var(…, fallback) clocks
 * rather than the marketing.css .mkt-acc grammar, because this header also
 * renders on the root /404 where marketing.css never loads — there the menu
 * still collapses and expands, just on the baked defaults.
 */
export function MarketingNavMobile({
  className,
  skin = "paper",
}: {
  className?: string;
  skin?: MarketingSkin;
}) {
  const portal = portalSkinProps(skin);
  const pathname = usePathname();
  // The same presence HINT the bar's right cluster reads (session-hint.tsx
  // holds the reasoning, and the word "hint" is load-bearing: /dashboard
  // re-checks). The sheet's foot is the phone's whole right cluster, so it
  // must swap with it or a signed-in host would meet two doors to /login the
  // moment they opened the menu.
  const signedIn = useSignedInHint();
  const [open, setOpen] = useState(false);
  // Single-open accordion: a full-screen list stays scannable only while at
  // most one group is expanded. Reset on close so the menu always OPENS tidy,
  // which is the whole point of the rebuild.
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setOpenGroup(null);
      }}
    >
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn(className)}
          aria-label="Open menu"
        >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="top"
        showCloseButton={false}
        {...portal}
        // bottom-0 (rather than a height) is deliberate: the primitive already
        // ships `data-[side=top]:h-auto`, which outranks a plain h-* utility,
        // and fixed + inset is the honest way to fill a phone viewport anyway.
        className={cn(
          "bottom-0 gap-0 p-0 data-[side=top]:border-b-0",
          portal.className,
        )}
      >
        <div className="flex h-[var(--mkt-header-h,4rem)] shrink-0 items-center justify-between px-4">
          <SheetClose asChild>
            <Link href="/" aria-label="Partyreel home">
              <Logo />
            </Link>
          </SheetClose>
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Close menu">
              <X />
            </Button>
          </SheetClose>
        </div>

        <nav className="flex-1 divide-y overflow-y-auto px-4 pb-8">
          {PRIMARY_NAV.map((item, index) => (
            <Row key={item.label} index={index}>
              {isNavGroup(item) ? (
                <MobileGroup
                  group={item}
                  current={isNavItemCurrent(item, pathname)}
                  open={openGroup === item.label}
                  onToggle={() =>
                    setOpenGroup((g) => (g === item.label ? null : item.label))
                  }
                />
              ) : (
                <MobileLink
                  href={item.href}
                  current={isNavItemCurrent(item, pathname)}
                  size="lead"
                >
                  {item.label}
                </MobileLink>
              )}
            </Row>
          ))}
        </nav>

        <div className="flex shrink-0 flex-col gap-2 border-t p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {signedIn ? (
            <SheetClose asChild>
              <Button asChild size="lg">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </SheetClose>
          ) : (
            <>
              <SheetClose asChild>
                <Button asChild variant="outline" size="lg">
                  <Link href="/login">Log in</Link>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button asChild size="lg">
                  <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
                </Button>
              </SheetClose>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** One top-level row, staggered in behind the sheet's own slide. Opening a
 *  full-screen menu is a RARE interaction, which is where the animate-by-
 *  frequency policy allows actual delight — unlike the desktop panel, where a
 *  stagger would make rows arrive LATER and fight the whole point of the round.
 *  fill-mode-both holds each row invisible through its delay; reduced motion
 *  drops the delay so nothing is ever waiting on a suppressed animation. */
function Row({
  index,
  children,
}: {
  index: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{ ["--row" as string]: index }}
      className="animate-in duration-[var(--mkt-acc-expand,250ms)] ease-emphasis fade-in-0 fill-mode-both [animation-delay:calc(var(--row)*28ms)] slide-in-from-bottom-3 motion-reduce:[animation-delay:0ms]"
    >
      {children}
    </div>
  );
}

function MobileGroup({
  group,
  open,
  current,
  onToggle,
}: {
  group: NavGroup;
  open: boolean;
  current: boolean;
  onToggle: () => void;
}) {
  const panelId = `mobile-nav-${group.label.toLowerCase()}`;
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-2 py-4 text-left text-lg font-medium",
          "transition-[color,background-color,transform] duration-[var(--mkt-dropdown-hover-ms,90ms)] ease-emphasis hover:bg-accent active:scale-[0.99]",
          current ? "text-foreground" : "text-foreground/90",
        )}
      >
        {group.label}
        <ChevronDown
          aria-hidden
          className={cn(
            "size-5 shrink-0 text-muted-foreground transition-transform duration-[var(--mkt-acc-chevron,250ms)] ease-emphasis motion-reduce:transition-none",
            open && "rotate-180",
          )}
        />
      </button>
      {/* 21-accordion: grid-rows 0fr<->1fr, no JS measuring. Padding lives on
          the INNER element — a padded 0fr track never fully closes. */}
      <div
        id={panelId}
        data-open={open ? "true" : "false"}
        className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-[var(--mkt-acc-collapse,250ms)] ease-emphasis data-[open=true]:grid-rows-[1fr] data-[open=true]:duration-[var(--mkt-acc-expand,250ms)] motion-reduce:transition-none"
      >
        <div className="overflow-hidden">
          <ul className="flex flex-col pt-0.5 pb-3">
            {group.href && (
              <li>
                <MobileLink href={group.href} muted>
                  All {group.label.toLowerCase()}
                </MobileLink>
              </li>
            )}
            {group.children.map((child) => (
              <li key={child.href}>
                <MobileLink href={child.href} muted>
                  {child.label}
                </MobileLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// SheetClose closes the menu on tap; active:scale gives the emil press feedback.
// min-h-11 keeps every row at the 44px touch target even at the muted size.
function MobileLink({
  href,
  children,
  muted = false,
  size = "child",
  current = false,
}: {
  href: string;
  children: React.ReactNode;
  muted?: boolean;
  size?: "lead" | "child";
  current?: boolean;
}) {
  return (
    <SheetClose asChild>
      <Link
        href={href}
        aria-current={current ? "page" : undefined}
        className={cn(
          "flex min-h-11 items-center rounded-lg transition-[color,background-color,transform] duration-[var(--mkt-dropdown-hover-ms,90ms)] ease-emphasis hover:bg-accent active:scale-[0.99]",
          size === "lead"
            ? "px-2 py-4 text-lg font-medium"
            : "px-2 py-2.5 pl-5 text-base",
          muted ? "text-muted-foreground" : "text-foreground",
          current && "text-foreground",
        )}
      >
        {children}
      </Link>
    </SheetClose>
  );
}
