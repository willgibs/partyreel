"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  isNavGroup,
  isNavItemCurrent,
  PRIMARY_NAV,
} from "@/lib/constants/marketing-nav";
import { readCssMs } from "@/lib/shared/read-css-ms";
import { cn } from "@/lib/utils";

import { MegaPanel } from "./mega-panel";
import { useNavIndicator } from "./nav-indicator";

// Re-export so existing importers (marketing-header) keep their path.
export type { MarketingSkin } from "./portal-skin";

// ★ THE PORTAL RULE lives in ./portal-skin.ts (shared with the help palette
// since R6). In the nav it applies to the MOBILE menu only (./mobile-menu.tsx):
// the DESKTOP panels need none of it (NavigationMenu renders its viewport
// IN-FLOW inside the skin wrapper, verified against the primitive's source in
// the expansion round), so tokens + skins apply naturally there.

// The label's colour is the FIRST thing that answers a hover — it lands on
// --mkt-dropdown-ink-ms (60ms) while the indicator behind it travels on 180ms.
// That lead is why the bar feels immediate even though the larger motion is
// still settling; it is also why this is `transition-colors`, not the pill's
// clock.
const linkClass =
  "text-sm text-muted-foreground transition-colors duration-[var(--mkt-dropdown-ink-ms,60ms)] ease-emphasis hover:text-foreground";

// The house trigger look layered OVER the generated nova pill style (cn's
// tailwind-merge lets the later utilities win): quiet text links, no pill
// fills of their own (the shared indicator is the fill now), ink on open.
// The built-in chevron rotation comes with the primitive.
const quietTrigger = cn(
  linkClass,
  "h-auto rounded-full bg-transparent px-3 py-1.5 font-normal",
  "hover:bg-transparent hover:text-foreground focus:bg-transparent",
  "focus-visible:ring-2 focus-visible:ring-ring/40",
  "data-open:bg-transparent data-open:text-foreground",
);

const flatLink = cn(
  linkClass,
  "rounded-full bg-transparent px-3 py-1.5 hover:bg-transparent focus:bg-transparent",
);

// Radix's own delayDuration default is 200ms, which reads as lag; 0 flashes a
// panel every time the cursor sweeps across the bar toward the CTA (the trigger
// opens on pointermove, not on a dwell). The ruled value is ~100ms, and it only
// ever costs you the FIRST open: Radix clears isOpenDelayed while a menu is up,
// so trigger→trigger is instant, and skipDelayDuration keeps it instant for
// half a second after a close. Read from CSS (never parseInt — Lightning CSS
// canonicalises 100ms → .1s) off the nav's own element, because --mkt-* live on
// [data-mkt], never :root.
const NAV_INTENT_FALLBACK_MS = 100;
const SKIP_DELAY_MS = 500;

/** Desktop primary nav (the expansion mega-menu): flat items render as links,
 *  `children` items as rich PANELS (MegaPanel) on a shared centered viewport.
 *  The Root is CONTROLLED so a route change closes the panel (covers featured
 *  cards whose roots are plain Links and can't dispatch the primitive's
 *  close-on-select) — and, since the 2026-08-28 round, so the nav can tell the
 *  viewport whether a size change is a SWAP or a first open, and can aim the
 *  panel's transform-origin at the trigger it belongs to. */
export function MarketingNavDesktop({ className }: { className?: string }) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState("");
  const [swapping, setSwapping] = useState(false);
  const [intentMs, setIntentMs] = useState(NAV_INTENT_FALLBACK_MS);

  // Close on route change via the render-time derived-state reset (the
  // React-sanctioned pattern; an effect-body setState trips the
  // set-state-in-effect lint, the header-shell lesson).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) setOpen("");
  }

  useLayoutEffect(() => {
    setIntentMs(
      readCssMs("--mkt-nav-intent-ms", NAV_INTENT_FALLBACK_MS, rootRef.current),
    );
  }, []);

  const openIndex = open
    ? PRIMARY_NAV.findIndex((item) => item.label === open)
    : null;
  const { listProps, itemProps, indicator } = useNavIndicator(
    openIndex === -1 ? null : openIndex,
  );

  const handleValueChange = (value: string) => {
    // A SWAP is panel→panel. A first open has no measured size to morph from
    // (Radix seeds the viewport width/height vars from a ResizeObserver a frame
    // late, so the box is 0×0 until then) and a close has nothing to morph to,
    // so both must snap instead of animating a 0→N wipe.
    setSwapping(open !== "" && value !== "");
    // Aim the panel's growth at the trigger it belongs to, BEFORE React mounts
    // it — the enter animation starts at mount, so a frame-late write would be
    // too late. The viewport is centred on this root, so 50% of the panel IS
    // this root's centre and a plain px delta lands the origin under the label
    // without anyone needing to know the panel's width.
    const root = rootRef.current;
    const trigger = value
      ? root?.querySelector<HTMLElement>(
          `[data-nav-value="${CSS.escape(value)}"]`,
        )
      : null;
    if (root && trigger) {
      const t = trigger.getBoundingClientRect();
      const r = root.getBoundingClientRect();
      root.style.setProperty(
        "--mkt-nav-origin-dx",
        `${Math.round(t.left + t.width / 2 - (r.left + r.width / 2))}px`,
      );
    }
    setOpen(value);
  };

  return (
    <NavigationMenu
      ref={rootRef}
      value={open}
      onValueChange={handleValueChange}
      delayDuration={intentMs}
      skipDelayDuration={SKIP_DELAY_MS}
      className={cn("max-w-none", className)}
      viewportProps={{ "data-swap": swapping ? "true" : undefined }}
    >
      <NavigationMenuList className="relative gap-0" {...listProps}>
        {indicator}
        {PRIMARY_NAV.map((item, index) => {
          const current = isNavItemCurrent(item, pathname);
          return isNavGroup(item) ? (
            <NavigationMenuItem
              key={item.label}
              value={item.label}
              className="z-10"
              data-nav-value={item.label}
              {...itemProps(index)}
            >
              <NavigationMenuTrigger
                className={cn(quietTrigger, current && "text-foreground")}
              >
                {item.label}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <MegaPanel group={item} />
              </NavigationMenuContent>
            </NavigationMenuItem>
          ) : (
            <NavigationMenuItem
              key={item.label}
              className="z-10"
              data-nav-value={item.label}
              {...itemProps(index)}
            >
              <NavigationMenuLink
                asChild
                className={cn(flatLink, current && "text-foreground")}
              >
                <Link
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
