"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useAdoptTypedValue } from "@/lib/adopt-typed-value"

function Textarea({
  className,
  ref,
  ...props
}: React.ComponentProps<"textarea">) {
  // Text typed before the page hydrated is the field's to keep: see `Input`.
  const adoptRef = useAdoptTypedValue<HTMLTextAreaElement>(props.value)
  const composedRef = React.useCallback(
    (el: HTMLTextAreaElement | null) => {
      adoptRef(el)
      if (typeof ref === "function") ref(el)
      else if (ref) ref.current = el
    },
    [adoptRef, ref]
  )
  return (
    <textarea
      ref={composedRef}
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-halo disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:not-focus-visible:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
