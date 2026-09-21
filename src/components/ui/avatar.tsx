"use client"

import * as React from "react"
import { Avatar as AvatarPrimitive } from "radix-ui"

import { background, blendMode, css, orbFor } from "@/lib/avatar/gradient"
import { cn } from "@/lib/utils"

/**
 * ★ THE SEEDED INK, THREADED WITHOUT A SECOND PROP ON EVERY CHILD. `Avatar`
 * is the only thing that knows a `seed`; `AvatarFallback` needs the one
 * colour it paints its initial in. A context scoped to this file (not a
 * second prop callers would have to repeat on both `Avatar` and
 * `AvatarFallback`, and not a CSS custom property threaded through an
 * arbitrary Tailwind value, which nothing else in this codebase does) is the
 * plainest way to get it there. `null` = no seed on this avatar, so
 * `AvatarFallback` keeps exactly its unseeded look.
 */
const AvatarSeedContext = React.createContext<string | null>(null)

function Avatar({
  className,
  size = "default",
  seed,
  style,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: "default" | "sm" | "lg" | "xl"
  /**
   * A stable per-person identity string — `seedFor(profiles.id)` from
   * `src/lib/avatar/seed.ts`, never a raw account id a viewer should not
   * already hold (docs/systems/profiles-social.md). When set, paints a
   * deterministic seeded colour on the root (`mesh`, `seed-avatar` r2:
   * one identity hue read at several diffused, blended depths): `AvatarFallback`
   * turns transparent so it shows through behind the initial, and `AvatarImage`
   * (always `size-full`, never inset) simply covers it once a real photo
   * loads — the colour waits UNDER the photograph rather than being
   * replaced by it, so a slow presign shows a person's hue instead of a
   * hole (`after-upload=under`, rulings.md). Never animated (`motion=none`).
   */
  seed?: string
}) {
  // orbFor's fitBody bisection is the expensive part of this call (up to a
  // few hundred contrast probes); memoized so a parent re-render — a large
  // guest list is exactly the case — doesn't redo it for an unchanged seed.
  // No second argument: the default palette IS "wheel" (`palette=wheel`,
  // the whole 360 degrees) — "mesh" is a `look`, background()'s argument
  // below, never orbFor's own PaletteMode parameter.
  const orb = React.useMemo(() => (seed ? orbFor(seed) : null), [seed])
  return (
    <AvatarSeedContext.Provider value={orb ? css(orb.ink) : null}>
      <AvatarPrimitive.Root
        data-slot="avatar"
        data-size={size}
        style={
          orb
            ? {
                ...style,
                backgroundImage: background(orb, "mesh"),
                // mesh paints four layers that only read as one hue at
                // several diffused depths WITH this blend mode; every
                // earlier look composited correctly with nothing set here.
                backgroundBlendMode: blendMode("mesh"),
              }
            : style
        }
        className={cn(
          // ★ THE BUG, FIXED (Will, rulings.md, the sixth batch: "the avatar
          // doesn't fully fill its container, and you can see horizontal
          // edges within" / "reveals the color underneath the photograph on
          // the edges"). The root had `rounded-full` with no `overflow-hidden`
          // — it never clipped anything — while `AvatarImage` and
          // `AvatarFallback` EACH drew their own `rounded-full` on top of it.
          // Two independently anti-aliased circles composited over the root's
          // paint, at a fractional size, is exactly the seam he saw. One clip,
          // here, and children below carry no radius of their own: now there
          // is only ever one edge to anti-alias.
          "group/avatar relative flex size-8 shrink-0 overflow-hidden rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 data-[size=xl]:size-20 dark:after:mix-blend-lighten",
          className
        )}
        {...props}
      />
    </AvatarSeedContext.Provider>
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      // No `rounded-full` here (the root clips); `size-full` with no inset is
      // what makes "the photograph covers the disc with no gap" true.
      className={cn("aspect-square size-full object-cover", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  style,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  const ink = React.useContext(AvatarSeedContext)
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      style={ink ? { ...style, color: ink } : style}
      className={cn(
        // No `rounded-full` here either — see AvatarImage above.
        "flex size-full items-center justify-center text-sm group-data-[size=sm]/avatar:text-xs group-data-[size=xl]/avatar:text-2xl",
        // Seeded: a transparent ground so the root's colour shows through
        // (`after-upload=under`); unseeded: exactly today's grey disc.
        ink ? "bg-transparent" : "bg-muted text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground bg-blend-color ring-2 ring-background select-none",
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
        className
      )}
      {...props}
    />
  )
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
}
