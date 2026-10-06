"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useAdoptTypedValue } from "@/lib/adopt-typed-value"

function Textarea({
  className,
  ref,
  ...props
}: React.ComponentProps<"textarea">) {
  // Text typed before the page hydrated is the field's to keep, and a field is a well: see `Input`.
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
        "flex field-sizing-content min-h-16 w-full rounded-lg px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground field-well focus-halo disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
