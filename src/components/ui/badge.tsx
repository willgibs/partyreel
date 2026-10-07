import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

// ★ A BADGE IS A POINT AND ITS WORD (identity r2, status=lights; brand-marks
// r1, `status=amber`): no plate, no pill, no wash. A state's colour is the
// point beside the word, solid and hard-edged (no glow: the glow is the
// light's, and a status beside a light is a point), and the word stays the
// ground's ink, so a list of states reads as quiet text with colour only where
// it means something. The word is a READOUT in the camera's voice (voice=
// camera): spaced capitals on the house's `label` step, semibold, figures
// tabular, which is how a camera prints a state.
//
// ★ FOUR TIERS, A CLEAR HIERARCHY OF STATES (design-system.md maps every state
// production shows to its tier): STANDBY (`info`, waiting on us or the line)
// is the point half-lit in the word's own ink, no hue; READY (`success`) a
// clear green; a WARNING (`warning`, look soon, nothing lost) amber, deepening
// toward orange on paper so it stands; a FAULT (`destructive`) the one red,
// shared with a count that needs her (`--needs-you`) and with LIVE (`live`,
// `--signal`), the only point that breathes. A state with no colour of its own
// (secondary, outline, ghost) is an unlit point, a ring: an operator's label,
// never a state.
//
// ★ THE POINT IS 8px: in the badge's 20px row it sits on whole pixels at a
// device pixel ratio of 1 (7 straddles a half pixel and blurs), it is the
// readout's cap height, and Standby's half needs the pixel (at 7px its open
// half closes into a blot). Reduced motion stands live still and lit, the
// global guard in globals.css. On a photograph the word takes a soft shadow
// so it reads over a bright sky (`data-surface="photo"`, the contract's
// hook). A badge that is a link wears the house's focus mark (identity r4,
// `focus-halo`).
const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1.5 rounded-sm text-label font-semibold whitespace-nowrap text-foreground uppercase tabular-nums transition-colors outline-none [--dot:var(--foreground)] before:size-2 before:shrink-0 before:rounded-full before:bg-(--dot) before:content-[''] focus-halo aria-invalid:[--dot:var(--destructive)] in-data-[surface=photo]:[text-shadow:0_1px_6px_oklch(0_0_0/60%)] [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "[a]:hover:opacity-80",
        // An unlit LED: a ring where a colour would be.
        secondary:
          "before:bg-transparent before:ring-[1.5px] before:ring-foreground/45 before:ring-inset [a]:hover:opacity-80",
        // The tiers, each its point in its token (globals.css), solid.
        destructive: "[--dot:var(--destructive)] [a]:hover:opacity-80",
        success: "[--dot:var(--success)] [a]:hover:opacity-80",
        warning: "[--dot:var(--warning)] [a]:hover:opacity-80",
        // Standby: the left half lit in the word's own ink, a hairline round
        // the rest, so it reads as a light waiting rather than one off.
        info: "[--dot:currentColor] before:bg-transparent before:bg-[linear-gradient(90deg,var(--dot)_50%,transparent_50%)] before:shadow-[inset_0_0_0_1px_var(--dot)] [a]:hover:opacity-80",
        // Live: the one red point that breathes (theme.css's live-signal).
        live: "[--dot:var(--signal)] before:animate-live-signal",
        outline:
          "before:bg-transparent before:ring-[1.5px] before:ring-foreground/45 before:ring-inset [a]:hover:opacity-80",
        ghost:
          "before:bg-transparent before:ring-[1.5px] before:ring-foreground/45 before:ring-inset hover:opacity-80",
        // A link is words, not a state: no light.
        link: "text-primary normal-case underline-offset-4 before:hidden hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
