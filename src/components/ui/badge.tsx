import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

// ★ A BADGE IS A LIGHT AND ITS WORD (identity r2, status=lights): no plate,
// no pill, no wash. A state's colour is the LED beside the word, lit with a
// little glow (`--dot`, set by each variant), and the word stays the ground's
// ink, so a list of states reads as quiet text with colour only where it means
// something. A state with no colour of its own (secondary, outline, ghost) is
// an unlit LED, a ring. The word is a READOUT in the camera's voice (voice=
// camera): spaced capitals on the house's `label` step, semibold, figures
// tabular, which is how a camera prints a state.
//
// ★ THE LIVE MARK (`event-header` r1, the atom contract) is the recording red
// (`--signal`, viewfinder's one signal light, delete's own red so the palette
// gains no hue), and its light rings out from the dot as it breathes (lights:
// "the live mark breathes"). Reduced motion stands it still and lit, the
// global guard in globals.css. On a photograph the word takes a soft shadow so
// it reads over a bright sky (`data-surface="photo"`, the contract's hook).
const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1.5 rounded-sm text-label font-semibold whitespace-nowrap text-foreground uppercase tabular-nums transition-colors outline-none [--dot:var(--foreground)] before:size-[7px] before:shrink-0 before:rounded-full before:bg-(--dot) before:content-[''] focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:[--dot:var(--destructive)] in-data-[surface=photo]:[text-shadow:0_1px_6px_oklch(0_0_0/60%)] [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "[a]:hover:opacity-80",
        // An unlit LED: a ring where a colour would be.
        secondary:
          "before:bg-transparent before:ring-[1.5px] before:ring-foreground/45 before:ring-inset [a]:hover:opacity-80",
        // The four states, each its LED in the state's own token (globals.css),
        // lit with a glow of its own colour. `--warning` is a fill token, and
        // as a light it is exactly that: the word beside it stays the ink.
        destructive:
          "[--dot:var(--destructive)] before:shadow-[0_0_6px_color-mix(in_oklab,var(--dot)_70%,transparent)] [a]:hover:opacity-80",
        success:
          "[--dot:var(--success)] before:shadow-[0_0_6px_color-mix(in_oklab,var(--dot)_70%,transparent)] [a]:hover:opacity-80",
        warning:
          "[--dot:var(--warning)] before:shadow-[0_0_6px_color-mix(in_oklab,var(--dot)_70%,transparent)] [a]:hover:opacity-80",
        info: "[--dot:var(--info)] before:shadow-[0_0_6px_color-mix(in_oklab,var(--dot)_70%,transparent)] [a]:hover:opacity-80",
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
