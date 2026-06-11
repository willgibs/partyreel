import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      // Shimmer = a background-position sweep (animate-shimmer in globals.css);
      // the foreground-tinted sheen reads in both modes. Reduced motion drops
      // to the static muted block.
      className={cn(
        "animate-shimmer rounded-md bg-muted bg-[linear-gradient(100deg,transparent_38%,--alpha(var(--color-foreground)/5%)_50%,transparent_62%)] bg-[length:200%_100%] motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
