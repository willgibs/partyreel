import * as React from "react"
import { cva } from "class-variance-authority"
import { NavigationMenu as NavigationMenuPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import {
  floatingEntrance,
  floatingPanel,
  floatingRow,
} from "@/components/ui/floating-layer"
import { ChevronDownIcon } from "lucide-react"

// ★ THE FLOATING-LAYER CONTRACT (2026-08-28 nav round). This primitive shipped
// generated-for-Base-UI and never joined the contract that ui/dropdown-menu,
// ui/popover and ui/tooltip all follow: rounded-float + shadow-layer (it was
// shadow-float until the light ruling, 2026-09-17) + an origin-aware
// transform-origin + fade-in-0/fade-out-0 + one house clock on
// --ease-emphasis. It was missing all five, which is what made the marketing
// mega-menu feel slow and jagged next to every other menu in the app. Five
// specific defects fixed here, each verified in the browser before the change:
//   1. `origin-top-center` is NOT a Tailwind utility (valid: origin-top,
//      origin-center, …) so the panel scaled from its CENTRE and detached from
//      the bar. Now origin-top, offset to the ACTIVE TRIGGER (see 5).
//   2. `zoom-in-90`/`zoom-out-90` with no fade-in/fade-out: a big opaque panel
//      popped in and snapped away at full opacity. Fades added.
//   3. `duration-100` alone set a literal transition-duration while leaving
//      transition-property at its CSS initial value `all` — so the box morphed
//      on 100ms/ease while the content swept 208px on 150ms/emphasis. The
//      transition is now explicit and shares ONE clock with the animation.
//   4. `rounded-lg` resolves to --radius (the SURFACE corner, 2px then, which
//      the doctrine forbids on the floating layer) and a raw `shadow` drew
//      Tailwind's stock shadow instead of the house family (a raw shadow on any
//      production surface is refused by src/lib/elevation-policy.test.ts now).
//   5. `transition-all` on the trigger + link (the house rule is explicit
//      properties on primitives) with a symmetric 150ms on a slow-headed curve,
//      which needed ~64ms just to reach half opacity — why a moderately fast
//      cursor skim missed rows entirely.
// Clocks live in marketing.css as --mkt-dropdown-*; every utility carries the
// baked fallback so the root /404 (which renders MarketingHeader WITHOUT
// marketing.css) still gets the right motion.

function NavigationMenu({
  className,
  children,
  viewport = true,
  viewportProps,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Root> & {
  viewport?: boolean
  /** Props for the internally-rendered viewport. The consumer cannot otherwise
   *  reach it, and the marketing nav needs to flag panel→panel swaps on it
   *  (see NavigationMenuViewport's data-swap note) — spelled out here rather
   *  than left to a loose index signature so the flag stays discoverable. */
  viewportProps?: React.ComponentProps<typeof NavigationMenuViewport> & {
    "data-swap"?: "true"
  }
}) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      data-viewport={viewport}
      className={cn(
        "group/navigation-menu relative flex max-w-max flex-1 items-center justify-center",
        className
      )}
      {...props}
    >
      {children}
      {viewport && <NavigationMenuViewport {...viewportProps} />}
    </NavigationMenuPrimitive.Root>
  )
}

function NavigationMenuList({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn(
        "group flex flex-1 list-none items-center justify-center gap-0",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Item>) {
  return (
    <NavigationMenuPrimitive.Item
      data-slot="navigation-menu-item"
      className={cn("relative", className)}
      {...props}
    />
  )
}

const navigationMenuTriggerStyle = cva(
  "group/navigation-menu-trigger inline-flex h-9 w-max items-center justify-center rounded-lg px-2.5 py-1.5 text-sm font-medium transition-[color,background-color] duration-[var(--mkt-dropdown-ink-ms,60ms)] ease-emphasis outline-none hover:bg-muted focus:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-open:bg-muted/50 data-open:hover:bg-muted data-open:focus:bg-muted"
)

function NavigationMenuTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(navigationMenuTriggerStyle(), "group", className)}
      {...props}
    >
      {children}{" "}
      {/* Flips on the PANEL's clock, not its own: at the generated 300ms the
          chevron was still rotating long after the panel had settled. */}
      <ChevronDownIcon className="relative top-px ml-1 size-3 transition-transform duration-[var(--mkt-dropdown-open-ms,200ms)] ease-emphasis group-data-open/navigation-menu-trigger:rotate-180" aria-hidden="true" />
    </NavigationMenuPrimitive.Trigger>
  )
}

function NavigationMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        // The side-by-side cross-slide (08-page-side-by-side): the slide-*-8
        // (32px) + blur-in/out-[3px] here are the FALLBACK shape; marketing.css
        // drives the live distance/blur off --mkt-dropdown-swap-* (they have to
        // be set on THIS element — every --tw-enter-*/--tw-exit-* is registered
        // `inherits: false`, so a value on the viewport never reaches it). The
        // duration deliberately matches the viewport's so box and contents move
        // as one object.
        "top-0 left-0 w-full p-1 duration-[var(--mkt-dropdown-open-ms,200ms)] ease-emphasis group-data-[viewport=false]/navigation-menu:top-full group-data-[viewport=false]/navigation-menu:mt-1.5 group-data-[viewport=false]/navigation-menu:overflow-hidden group-data-[viewport=false]/navigation-menu:rounded-float group-data-[viewport=false]/navigation-menu:bg-popover group-data-[viewport=false]/navigation-menu:text-popover-foreground group-data-[viewport=false]/navigation-menu:shadow-layer group-data-[viewport=false]/navigation-menu:ring-1 group-data-[viewport=false]/navigation-menu:ring-foreground/10 data-[motion=from-end]:slide-in-from-right-8 data-[motion=from-start]:slide-in-from-left-8 data-[motion=to-end]:slide-out-to-right-8 data-[motion=to-start]:slide-out-to-left-8 data-[motion^=from-]:animate-in data-[motion^=from-]:fade-in data-[motion^=from-]:blur-in-[3px] data-[motion^=to-]:animate-out data-[motion^=to-]:fade-out data-[motion^=to-]:blur-out-[3px] **:data-[slot=navigation-menu-link]:focus:ring-0 **:data-[slot=navigation-menu-link]:focus:outline-none md:absolute md:w-auto group-data-[viewport=false]/navigation-menu:data-open:animate-in group-data-[viewport=false]/navigation-menu:data-open:fade-in-0 group-data-[viewport=false]/navigation-menu:data-open:zoom-in-95 group-data-[viewport=false]/navigation-menu:data-closed:animate-out group-data-[viewport=false]/navigation-menu:data-closed:fade-out-0 group-data-[viewport=false]/navigation-menu:data-closed:zoom-out-95",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuViewport({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Viewport>) {
  return (
    <div
      className={cn(
        // left-1/2 + translate centers the shared panel under the trigger
        // cluster (the generated left-0 pinned it to the cluster's left edge,
        // which collides at md widths). House rewrite, kept minimal.
        "absolute top-full left-1/2 isolate z-50 flex -translate-x-1/2 justify-center"
      )}
    >
      <NavigationMenuPrimitive.Viewport
        data-slot="navigation-menu-viewport"
        // data-mkt + data-mkt-dropdown opt the panel into the marketing
        // dropdown SHAPE (marketing.css [data-mkt][data-mkt-dropdown]); inert
        // everywhere else (those rules only exist under (marketing)).
        data-mkt=""
        data-mkt-dropdown=""
        className={cn(
          // ORIGIN-AWARE GROWTH: because this wrapper is centred on the Root,
          // 50% of the viewport IS the Root's centre — so a plain px delta from
          // the active trigger's centre (written as --mkt-nav-origin-dx by the
          // consumer) lands the origin exactly under the hovered label without
          // anyone needing to know the panel's width. The panel grows out of
          // the label you pointed at, which is what ties it to the indicator.
          // ★ THE ONE CLOCK THE CONTRACT DOES NOT SET, and it is a knob rather
          // than a number: --mkt-dropdown-*-ms in marketing.css, ruled in the
          // 2026-08-28 nav round and driven live by the motion tuner. Its
          // default (200ms in, 130ms out) IS the contract's standard rung, which
          // is the right one by frequency: a mega-menu is a chapter switch a
          // visitor opens a few times, not a control a host flips fifty times a
          // night.
          "origin-[calc(50%+var(--mkt-nav-origin-dx,0px))_top] relative mt-1.5 h-(--radix-navigation-menu-viewport-height) w-full overflow-hidden duration-[var(--mkt-dropdown-open-ms,200ms)] data-closed:duration-[var(--mkt-dropdown-close-ms,130ms)] md:w-(--radix-navigation-menu-viewport-width) " +
          floatingPanel +
          " " +
          floatingEntrance +
          " " +
          // THE MORPH, GATED (01-card-resize). Radix seeds the width/height vars
          // from a ResizeObserver, so on a FIRST open they are unset for one
          // frame — the content is md:absolute, so the box measures 0×0 and then
          // snaps. Transitioning that would animate a 0→N wipe. data-swap is set
          // by the consumer only when one panel replaces another (both values
          // non-empty), so a first open and a close snap their box (correct:
          // there is nothing to morph from) and only panel→panel morphs.
          "transition-none data-[swap=true]:transition-[width,height] data-[swap=true]:will-change-[width,height] motion-reduce:transition-none",
          className
        )}
        {...props}
      />
    </div>
  )
}

function NavigationMenuLink({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Link>) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      // Asymmetric hover: a menu row is SKIMMED, so the in has to land inside a
      // fast pass while the out stays calm. `transition-all` (the generated
      // default) is banned on primitives by the design system anyway.
      className={cn(
        // The corner is the contract's row, not `rounded-md`: a link IS a row
        // inside the panel above it, and a nested corner shares a centre.
        "flex items-center gap-2 p-2 text-sm transition-[color,background-color] duration-[var(--mkt-dropdown-hover-out-ms,180ms)] ease-emphasis outline-none hover:bg-muted hover:duration-[var(--mkt-dropdown-hover-ms,90ms)] focus:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-1 data-active:bg-muted/50 data-active:hover:bg-muted data-active:focus:bg-muted [&_svg:not([class*='size-'])]:size-4",
        floatingRow,
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuIndicator({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Indicator>) {
  return (
    <NavigationMenuPrimitive.Indicator
      data-slot="navigation-menu-indicator"
      className={cn(
        "top-full z-1 flex h-1.5 items-end justify-center overflow-hidden data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:animate-in data-[state=visible]:fade-in",
        className
      )}
      {...props}
    >
      {/* The panel's arrow is part of the layer it points from, so it wears the
          layer's shadow (it was Tailwind's stock shadow-md, the generator's). */}
      <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-layer" />
    </NavigationMenuPrimitive.Indicator>
  )
}

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
}
