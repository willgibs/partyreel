import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      // A placeholder BREATHES (identity r2, status=lights): its opacity rises
      // and falls on an even curve (`animate-skeleton-breathe`, theme.css), a
      // light waiting rather than a sheen sweeping across it. Reduced motion
      // stands it still at its full tone.
      className={cn(
        "animate-skeleton-breathe rounded-md bg-muted motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
