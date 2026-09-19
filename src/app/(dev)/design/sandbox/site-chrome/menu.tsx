"use client";

import Link from "next/link";
import { ChevronDown, Home, LayoutGrid, Sparkles, Tag, X } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import {
  isNavGroup,
  MARKETING_CTA,
  type NavItem,
} from "@/lib/constants/marketing-nav";
import { cn } from "@/lib/utils";

import { flatFor, navFor, type Holds, type PhoneMenu } from "./fixtures";

/**
 * THE PHONE'S MENU, THREE WAYS, AS A LOCAL REPLICA.
 *
 * ★ NEVER THE REAL SHEET, AND THE REASON IS THE PORTAL. `MarketingNavMobile`
 * is a radix `Sheet`, which portals to `document.body`. A `Frame` renders the
 * board's tree THROUGH a React portal into the iframe's document, but the
 * global `document` a radix portal reaches for is still the LAB page's, so the
 * real sheet would escape the 375 frame entirely and cover the board. Every
 * row, clock and class below is the shipped one (`mobile-menu.tsx`); only the
 * container is local.
 *
 * ★ AND IT IS `fixed`, NOT `absolute`, WHICH IS NOT A DETAIL. A portalled
 * `Frame` renders into the iframe's own document, so `fixed` resolves to THAT
 * viewport: 375 by 812, the phone being judged. `absolute` resolves to the
 * scene root instead, which is the header plus a full-height hero, so the
 * sheet ran 876 px and its Log in and Start free foot sat below the window in
 * every capture. Caught by reading the pictures against their words.
 *
 * The portal rule (`portal-skin.ts`) is why this matters in production and not
 * only here: the real sheet leaves the marketing skin wrapper, so it has to
 * carry `data-mkt` and the skin class itself or its accordion clocks fall back
 * to the baked defaults. A replica inside the frame inherits both.
 */

const ROW =
  "flex min-h-11 items-center rounded-lg transition-[color,background-color,transform] duration-[var(--mkt-dropdown-hover-ms,90ms)] ease-emphasis active:scale-[0.99]";

function Lead({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-4 text-lg font-medium text-foreground">
      {children}
    </span>
  );
}

/** The menu's own header row: the bar, mirrored, so it reads as the site
 *  opening up rather than a drawer sliding over it. */
function MenuHead() {
  return (
    <div className="flex h-[var(--mkt-header-h,4rem)] shrink-0 items-center justify-between px-4">
      <Logo />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Close menu"
      >
        <X />
      </Button>
    </div>
  );
}

function Foot() {
  return (
    <div className="flex shrink-0 flex-col gap-2 border-t p-4">
      <Button type="button" variant="outline" size="lg">
        Log in
      </Button>
      <Button type="button" size="lg">
        {MARKETING_CTA.label}
      </Button>
    </div>
  );
}

/** Today: a full-screen sheet, one group open at a time, big touch rows. */
function AccordionSheet({ items }: { items: NavItem[] }) {
  const openLabel = items.find(isNavGroup)?.label ?? null;
  return (
    <>
      <MenuHead />
      <nav className="flex-1 divide-y overflow-hidden px-4 pb-8">
        {items.map((item) => {
          if (!isNavGroup(item))
            return (
              <div key={item.label}>
                <Link href={item.href} className={cn(ROW, "w-full")}>
                  <Lead>{item.label}</Lead>
                </Link>
              </div>
            );
          const open = item.label === openLabel;
          return (
            <div key={item.label}>
              <button
                type="button"
                aria-expanded={open}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-2 py-4 text-left text-lg font-medium text-foreground/90",
                  "transition-[color,background-color,transform] duration-[var(--mkt-dropdown-hover-ms,90ms)] ease-emphasis active:scale-[0.99]",
                )}
              >
                {item.label}
                <ChevronDown
                  aria-hidden
                  className={cn(
                    "size-5 shrink-0 text-muted-foreground transition-transform duration-[var(--mkt-acc-chevron,250ms)] ease-emphasis",
                    open && "rotate-180",
                  )}
                />
              </button>
              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-[var(--mkt-acc-expand,250ms)] ease-emphasis",
                  open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div className="overflow-hidden">
                  <ul className="flex flex-col pt-0.5 pb-3">
                    {item.href ? (
                      <li>
                        <Link
                          href={item.href}
                          className={cn(
                            ROW,
                            "px-2 py-2.5 pl-5 text-base text-muted-foreground",
                          )}
                        >
                          All {item.label.toLowerCase()}
                        </Link>
                      </li>
                    ) : null}
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className={cn(
                            ROW,
                            "px-2 py-2.5 pl-5 text-base text-muted-foreground",
                          )}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </nav>
      <Foot />
    </>
  );
}

/** No accordion: the bar's own entries, each one a tap straight to its hub. */
function FlatSheet({ holds }: { holds: Holds }) {
  const links = flatFor(holds);
  return (
    <>
      <MenuHead />
      <nav className="flex-1 divide-y px-4">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={cn(ROW, "w-full")}>
            <Lead>{link.label}</Lead>
          </Link>
        ))}
        <Link href="/help" className={cn(ROW, "w-full")}>
          <span className="px-2 py-4 text-lg font-medium text-muted-foreground">
            Help center
          </span>
        </Link>
      </nav>
      <Foot />
    </>
  );
}

const BAR_ICONS = [Home, Sparkles, LayoutGrid, Tag] as const;

/** No hamburger at all: four standing destinations at the thumb. */
export function BottomBar({ holds }: { holds: Holds }) {
  const links = [{ label: "Home", href: "/" }, ...flatFor(holds)].slice(0, 4);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-around border-t border-border bg-background/90 px-2 pt-2 pb-4 backdrop-blur">
      {links.map((link, i) => {
        const Icon = BAR_ICONS[i] ?? Home;
        const current = i === 0;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "flex min-w-14 flex-col items-center gap-1 rounded-lg px-2 py-1 text-[11px] transition-transform duration-150 active:scale-[0.97]",
              current ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" aria-hidden />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** The menu over the page, filling the frame the way it fills a phone. */
export function PhoneMenuLayer({
  menu,
  holds,
}: {
  menu: PhoneMenu;
  holds: Holds;
}) {
  if (menu === "bar") return <BottomBar holds={holds} />;
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      {menu === "sheet" ? (
        <AccordionSheet items={navFor(holds)} />
      ) : (
        <FlatSheet holds={holds} />
      )}
    </div>
  );
}
