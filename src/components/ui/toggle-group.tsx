"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * shadcn radix-nova's toggle-group, HAND-CHECKED after generation (home-wiring,
 * 2026-09-20) — three things the generator got wrong for this repo:
 *
 * 1. It emitted `import { cn } from "cn"` and then ADDED a package called `cn`
 *    to package.json to satisfy it. Our `cn()` is `@/lib/utils` (the alias
 *    components.json already declares). The stray dependency was reverted;
 *    config is the Orchestrator's to mutate, never a lane's.
 * 2. It shipped a sibling `toggle.tsx` purely to export `toggleVariants`. One
 *    consumer, one file: the variants live here, so this lane owns every line
 *    it added and the lane check stays clean.
 * 3. Its `sm` size carried `text-[0.8rem]`, which is a body-ladder sweep target
 *    (`ladder-wiring`'s grep looks for exactly that literal). The sizes we do
 *    not use are gone rather than left for another lane to clean up.
 *
 * Sizes here are stock classes that EQUAL a ladder step (text-sm = 14,
 * text-xs = 12). The step NAMES do not exist yet — Tailwind v4 emits no utility
 * for an undeclared `--text-working`, so the element would silently inherit and
 * nothing in the gate would see it.
 */
const toggleVariants = cva(
  "group/toggle inline-flex items-center justify-center gap-1 rounded-lg text-sm font-medium whitespace-nowrap transition-all outline-none hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-pressed:bg-muted data-[state=on]:bg-muted [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-input bg-transparent hover:bg-muted",
      },
      size: {
        default: "h-8 min-w-8 px-2.5",
        sm: "h-7 min-w-7 px-2 text-xs [&_svg:not([class*='size-'])]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
})

function ToggleGroup({
  className,
  variant,
  size,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      className={cn(
        "group/toggle-group flex w-fit flex-row items-center gap-0.5 rounded-lg",
        className
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
}

function ToggleGroupItem({
  className,
  children,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      className={cn(
        "shrink-0 focus:z-10 focus-visible:z-10",
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
}

export { ToggleGroup, ToggleGroupItem, toggleVariants }
