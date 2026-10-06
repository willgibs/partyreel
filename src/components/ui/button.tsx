import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * The 44px action's corner, as ONE string: the `cta` size wears it, and so do
 * the few 44px actions that are not a <Button> (the guest reel's overlay pair,
 * the footer's hairline CTA, the reel builder's Create), so the site's loudest
 * button has one corner wherever it is drawn. 1.1x the 40px button's corner,
 * derived from --radius-action, so the tuner's one knob moves it too.
 */
export const ctaCorner = "rounded-[calc(var(--radius-action)*1.1)]"

const buttonVariants = cva(
  // V1 craft: actions are the ROUND family (radius ~0.4 x height, per size
  // below), explicit transition properties, never `all`. NOTE: `scale` must be
  // listed separately - Tailwind v4's scale-* compiles to the standalone CSS
  // `scale` longhand, which `transform` in a transition list does NOT cover.
  //
  // ★ THE HOUSE'S FOCUS AND PRESS (identity r4: focus=halo, press=shrink), one
  // utility each in globals.css: `focus-halo` is the keyboard's mark and
  // `press-shrink` the give under a finger, landing at once and letting go on
  // the 150ms below (each size names its own give, `--press-scale`). No
  // `box-shadow` in the transition: the halo arrives in a beat of its own and
  // leaves at once.
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,transform,scale] duration-150 ease-emphasis outline-none select-none focus-halo press-shrink disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:not-focus-visible:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30",
        link: "text-primary underline-offset-4 hover:underline",
        // ★ TWO FOR A PHOTOGRAPH (`event-header` r1's picks, the atom contract with identity r2):
        // where a photograph is the ground (the album's cover, the hub's), the page's paper is not
        // behind the control, so paper's variants read as stickers. `on-photo` is the white primary
        // standing on it (the one Add of a cover), `glass` the round beside it in the material every
        // control on a photograph wears (`lib/glass.ts`: Crystal, its glyph carrying its own light
        // over a bright sky). Their halo is a photograph's wherever they stand, white over a
        // near-black band, the one mark that reads on any photograph (globals.css keys it on the
        // two variants).
        "on-photo":
          "bg-white text-neutral-950 shadow-layer hover:bg-white/90",
        glass:
          "glass text-white hover:bg-white/15 aria-expanded:bg-white/15 [&_svg]:glass-mark-lit",
      },
      // Radius rides height (ratio ~0.4): h-8 is --radius-action-sm and the
      // in-between sizes DERIVE from --radius-action (h-6 0.6x, h-7 0.7x, h-9
      // 0.9x of the 40px button's 16px), so one knob on the tuner moves the
      // whole action ladder (the rounding round, 2026-09-14; the literals
      // 0.6rem / 0.7rem / 0.9rem they replace were the same numbers, frozen).
      //
      // ★ `cta` IS THE 44px BUTTON, NAMED (Will, 2026-09-18, `actions=today`).
      // Every hero, CTA band, dead end and form submit on the site forced
      // `size="lg"` up to h-11 with `h-11 px-6 text-base`, so the site's
      // loudest button wore the 36px button's corner (0.9x, 14.4px) on a 44px
      // box, at 45 call sites. It is a size now, on the same rule as the rest:
      // 1.1x of the 40px button's corner (17.6px), derived, so the one knob
      // still moves it. Never force another size up to h-11; use this.
      //
      // ★ THE ICON PAIRING (Will, `body-type` r2, 2026-09-20, `pairs=step-up`):
      // every icon sits ONE Tailwind icon-step over its own text (12/14,
      // 14/16, 16/18), turning "the download and select buttons felt
      // mismatched between their icon sizes and new font size" into a stated
      // rule. `xs`/`sm` read 12 (`text-xs`, on the caption rung) so their icon
      // grows to `size-3.5`; `default`/`lg` inherit the base's `text-sm` (14)
      // so their icon is `size-4`; `cta`'s `text-base` (16) grows its icon to
      // `size-4.5`. EVERY size below sets its OWN icon selector explicitly,
      // even where the number equals the base's `size-4` fallback above
      // (`default`, `lg`, `icon`, `icon-lg`): before this only `xs`, `sm` and
      // `icon-xs` did, and `icon-sm` silently fell through to the base's
      // `size-4` (16) with no size of its own to hold it there — the exact
      // mismatch he saw. The four icon-only sizes pair by the HEIGHT they
      // share with a text size (`icon-xs`↔`xs`, `icon-sm`↔`sm`, `icon`↔`default`,
      // `icon-lg`↔`lg`), so `icon-sm` reads 14 too, not 16 (measured on the
      // approved board's own probe, `body-type/surfaces.tsx`'s `iconClass`).
      // Heights never move: every icon this round proposes still fits its
      // current box with room on every side.
      //
      // ★ EACH SIZE NAMES ITS GIVE (press=shrink, `--press-scale`): about two
      // pixels whatever the size, so the default 32 and 36px keys keep the
      // utility's 0.96, a 24 or 28px key takes 0.95, every round 0.92 (a small
      // round gives more), and the 44px call to action, often full width, 0.98.
      size: {
        default:
          "h-8 gap-1.5 rounded-action-sm px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-4",
        xs: "h-6 gap-1 rounded-[calc(var(--radius-action)*0.6)] px-2 text-xs [--press-scale:0.95] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-7 gap-1 rounded-[calc(var(--radius-action)*0.7)] px-2.5 text-xs [--press-scale:0.95] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 rounded-[calc(var(--radius-action)*0.9)] px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-4",
        cta: `h-11 gap-1.5 ${ctaCorner} px-6 text-base [--press-scale:0.98] has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5 [&_svg:not([class*='size-'])]:size-4.5`,
        icon: "size-8 rounded-action-sm [--press-scale:0.92] [&_svg:not([class*='size-'])]:size-4",
        "icon-xs": "size-6 rounded-[calc(var(--radius-action)*0.6)] [--press-scale:0.92] [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-7 rounded-[calc(var(--radius-action)*0.7)] [--press-scale:0.92] [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-9 rounded-[calc(var(--radius-action)*0.9)] [--press-scale:0.92] [&_svg:not([class*='size-'])]:size-4",
        // ★ THE 44px ROUND, `cta`'s height as a circle (`event-header` r1): the glass rounds that stand
        // beside a cover's Add, and the shutter's two flanks. Round, not cornered: on a photograph and
        // at the foot, a control is media chrome, and media chrome is round (the viewer's capsule, the
        // reel's dock). Its icon pairs with `cta`'s text step, as every icon size pairs by height.
        "icon-cta": "size-11 rounded-full [--press-scale:0.92] [&_svg:not([class*='size-'])]:size-4.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
