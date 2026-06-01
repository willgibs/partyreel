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
  PRIMARY_NAV,
  type NavGroup,
} from "@/lib/constants/marketing-nav";
import { cn } from "@/lib/utils";

// Quick (<160ms) hover color transition per the emil-design-eng craft bar.
const linkClass =
  "text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground";

/** Desktop primary nav: flat items render as links, `children` items as dropdowns. */
export function MarketingNavDesktop({ className }: { className?: string }) {
  return (
    <nav className={cn("items-center gap-6", className)}>
      {PRIMARY_NAV.map((item) =>
        isNavGroup(item) ? (
          <NavGroupMenu key={item.label} group={item} />
        ) : (
          <Link key={item.label} href={item.href} className={linkClass}>
            {item.label}
          </Link>
        ),
      )}
    </nav>
  );
}

function NavGroupMenu({ group }: { group: NavGroup }) {
  return (
    <DropdownMenu>
      {/* `group` class lets the chevron react to the trigger's open state. The
          DropdownMenuContent (ui primitive) already scales in origin-aware + fast. */}
      <DropdownMenuTrigger
        className={cn(
          linkClass,
          "group inline-flex items-center gap-1 data-[state=open]:text-foreground",
        )}
      >
        {group.label}
        <ChevronDown className="size-3.5 transition-transform duration-150 group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
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
export function MarketingNavMobile({ className }: { className?: string }) {
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
      <SheetContent side="right" className="w-72 gap-0 p-0">
        <div className="flex h-16 items-center border-b px-4">
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
              <Link href="/login">Get started</Link>
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
