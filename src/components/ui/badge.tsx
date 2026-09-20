import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

// The badge is a PILL, so it says so: it wore the generator's `rounded-4xl`,
// which faked a pill with the top of the derived scale, and that rung is
// dropped (theme.css sets it `initial`, so the class now emits nothing).
const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        // THE OTHER THREE STATES, on the same wash `destructive` already wears
        // (`colour=rows`, Will 2026-09-20: "the same four"). The portal had ONE
        // state colour -- red -- so healthy, paused, running and never-run all
        // shared a grey, which is the thing the admin board's colour decision
        // set out to fix. Each reads the shipped token pair in globals.css and
        // invents no hue: a second green here would be the second red the board
        // deliberately refused.
        success:
          "bg-success/10 text-success focus-visible:ring-success/20 dark:bg-success/20 [a]:hover:bg-success/20",
        // ★ WARNING TAKES ITS FOREGROUND AS INK IN LIGHT MODE, AND THAT IS NOT
        // A TYPO. `--warning` is a FILL token (oklch(0.8 .14 80)); as ink on a
        // paper card it lands near 2:1 and is unreadable, which is why the one
        // shipped consumer that uses it as ink sits on a muted plate. The wash
        // still carries the hue and `--warning-foreground` is the dark amber
        // the pair was designed to be read in. In dark the card is dark, the
        // token is light, and the hue can be the ink like its siblings.
        warning:
          "bg-warning/15 text-warning-foreground focus-visible:ring-warning/30 dark:bg-warning/20 dark:text-warning [a]:hover:bg-warning/25",
        info: "bg-info/10 text-info focus-visible:ring-info/20 dark:bg-info/20 [a]:hover:bg-info/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
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
