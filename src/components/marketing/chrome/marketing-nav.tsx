"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  isNavGroup,
  MARKETING_CTA,
  PRIMARY_NAV,
} from "@/lib/constants/marketing-nav";
import { cn } from "@/lib/utils";

import { MegaPanel } from "./mega-panel";
import { portalSkinProps, type MarketingSkin } from "./portal-skin";

// Re-export so existing importers (marketing-header) keep their path.
export type { MarketingSkin } from "./portal-skin";

// ★ THE PORTAL RULE lives in ./portal-skin.ts (shared with the help palette
// since R6). In the nav it applies to the MOBILE Sheet only: the DESKTOP
// panels need none of it (NavigationMenu renders its viewport IN-FLOW inside
// the skin wrapper, verified against the primitive's source in the expansion
// round), so tokens + skins apply naturally there.

// Quick (<160ms) hover color transition per the emil-design-eng craft bar.
const linkClass =
  "text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground";

// The house trigger look layered OVER the generated nova pill style (cn's
// tailwind-merge lets the later utilities win): quiet text links, no pill
// fills, ink on open. The built-in chevron rotation comes with the primitive.
const quietTrigger = cn(
  linkClass,
  "h-auto rounded-md bg-transparent px-2 py-1.5 font-normal",
  "hover:bg-transparent hover:text-foreground focus:bg-transparent",
  "focus-visible:ring-2 focus-visible:ring-ring/40",
  "data-open:bg-transparent data-open:text-foreground data-popup-open:bg-transparent data-popup-open:hover:bg-transparent",
);

/** Desktop primary nav (the expansion mega-menu): flat items render as links,
 *  `children` items as rich PANELS (MegaPanel) on a shared centered viewport.
 *  The Root is CONTROLLED so a route change closes the panel (covers featured
 *  cards whose roots are plain Links and can't dispatch the primitive's
 *  close-on-select). */
export function MarketingNavDesktop({ className }: { className?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState("");
  // Close on route change via the render-time derived-state reset (the
  // React-sanctioned pattern; an effect-body setState trips the
  // set-state-in-effect lint, the header-shell lesson).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) setOpen("");
  }

  return (
    <NavigationMenu
      value={open}
      onValueChange={setOpen}
      className={cn("max-w-none", className)}
    >
      <NavigationMenuList className="gap-2">
        {PRIMARY_NAV.map((item) =>
          isNavGroup(item) ? (
            <NavigationMenuItem key={item.label} value={item.label}>
              <NavigationMenuTrigger className={quietTrigger}>
                {item.label}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <MegaPanel group={item} />
              </NavigationMenuContent>
            </NavigationMenuItem>
          ) : (
            <NavigationMenuItem key={item.label}>
              <NavigationMenuLink
                asChild
                className={cn(
                  linkClass,
                  "rounded-md bg-transparent px-2 py-1.5 hover:bg-transparent focus:bg-transparent",
                )}
              >
                <Link href={item.href}>{item.label}</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          ),
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

/** Mobile nav: a hamburger that opens a Sheet listing everything (the desktop nav
    is `hidden md:flex`, so without this there is no nav on phones). */
export function MarketingNavMobile({
  className,
  skin = "paper",
}: {
  className?: string;
  skin?: MarketingSkin;
}) {
  const portal = portalSkinProps(skin);
  return (
    <Sheet>
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
      {/* THE PORTAL RULE applies here too: the sheet portals to <body>. */}
      <SheetContent
        side="right"
        {...portal}
        className={cn("w-72 gap-0 p-0", portal.className)}
      >
        <div className="flex h-[var(--mkt-header-h,4rem)] items-center border-b px-4">
          <Logo />
          <SheetTitle className="sr-only">Menu</SheetTitle>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          {PRIMARY_NAV.map((item) =>
            isNavGroup(item) ? (
              <div key={item.label} className="flex flex-col py-2">
                <p className="px-3 pb-1 text-xs font-medium text-muted-foreground">
                  {item.label}
                </p>
                {item.href && (
                  <MobileLink href={item.href}>
                    All {item.label.toLowerCase()}
                  </MobileLink>
                )}
                {item.children.map((child) => (
                  <MobileLink key={child.href} href={child.href}>
                    {child.label}
                  </MobileLink>
                ))}
              </div>
            ) : (
              <MobileLink key={item.label} href={item.href}>
                {item.label}
              </MobileLink>
            ),
          )}
        </nav>
        <div className="flex flex-col gap-2 border-t p-4">
          <SheetClose asChild>
            <Button asChild variant="outline">
              <Link href="/login">Log in</Link>
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button asChild>
              <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// SheetClose closes the drawer on tap; active:scale gives the emil press feedback.
function MobileLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <SheetClose asChild>
      <Link
        href={href}
        className="rounded-md px-3 py-2 text-sm text-foreground transition-[color,background-color,transform] duration-150 hover:bg-accent active:scale-[0.99]"
      >
        {children}
      </Link>
    </SheetClose>
  );
}
