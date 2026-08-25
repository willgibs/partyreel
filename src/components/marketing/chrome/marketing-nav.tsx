"use client";

import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  type NavGroup,
} from "@/lib/constants/marketing-nav";
import { cn } from "@/lib/utils";

/** Which marketing skin the chrome sits in (the group layouts thread it down). */
export type MarketingSkin = "cinema" | "paper";

// ★ THE PORTAL RULE (Track B theming): radix dropdown/sheet content PORTALS to
// <body> and so ESCAPES the cinema wrapper's descendant-scoped `dark` class —
// without help, a dark page would pop a paper-light menu. Whenever skin is
// "cinema", portaled content (DropdownMenuContent, SheetContent) must receive
// className="dark" AND the data-mkt attribute (the marketing tokens are scoped
// to [data-mkt], which the portal also escapes). Both ui primitives spread
// className + extra props onto the portaled element, so this threads through.
const portalSkinProps = (skin: MarketingSkin) =>
  ({
    "data-mkt": "",
    className: skin === "cinema" ? "dark" : undefined,
  }) as const;

// Quick (<160ms) hover color transition per the emil-design-eng craft bar.
const linkClass =
  "text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground";

/** Desktop primary nav: flat items render as links, `children` items as dropdowns. */
export function MarketingNavDesktop({
  className,
  skin = "paper",
}: {
  className?: string;
  skin?: MarketingSkin;
}) {
  return (
    <nav className={cn("items-center gap-6", className)}>
      {PRIMARY_NAV.map((item) =>
        isNavGroup(item) ? (
          <NavGroupMenu key={item.label} group={item} skin={skin} />
        ) : (
          <Link key={item.label} href={item.href} className={linkClass}>
            {item.label}
          </Link>
        ),
      )}
    </nav>
  );
}

function NavGroupMenu({
  group,
  skin,
}: {
  group: NavGroup;
  skin: MarketingSkin;
}) {
  const portal = portalSkinProps(skin);
  return (
    <DropdownMenu>
      {/* `group` class lets the chevron react to the trigger's open state. */}
      <DropdownMenuTrigger
        className={cn(
          linkClass,
          "group inline-flex items-center gap-1 data-[state=open]:text-foreground",
        )}
      >
        {group.label}
        <ChevronDown className="size-3.5 transition-transform duration-150 group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>
      {/* data-mkt-dropdown = the menu-dropdown recipe CLOCKS (marketing.css
          chapter 2): 250ms open / 150ms close, 0.97 pre-scale / 0.99 closing
          scale — marketing-scoped, so ui/dropdown-menu.tsx stays untouched. */}
      <DropdownMenuContent
        align="start"
        data-mkt-dropdown=""
        {...portal}
        className={cn("min-w-44", portal.className)}
      >
        {group.href && (
          <DropdownMenuItem asChild>
            <Link href={group.href}>All {group.label.toLowerCase()}</Link>
          </DropdownMenuItem>
        )}
        {group.children.map((child) => (
          <DropdownMenuItem key={child.href} asChild>
            <Link href={child.href}>{child.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
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
