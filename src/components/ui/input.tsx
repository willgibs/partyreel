"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useAdoptTypedValue } from "@/lib/adopt-typed-value"

function Input({
  className,
  type,
  ref,
  ...props
}: React.ComponentProps<"input">) {
  // ★ TEXT TYPED BEFORE THE PAGE HYDRATED IS THE FIELD'S OWN TO KEEP (`adopt-typed-value.ts`): a
  // controlled field is typeable from the first paint and React's state is not told, so the first
  // render after hydration wrote `""` over the person's words. At its mount the field hands the DOM's
  // value to its own `onChange`, and every field in the app, a form library's or a `useState`, keeps it.
  const adoptRef = useAdoptTypedValue<HTMLInputElement>(props.value)
  const composedRef = React.useCallback(
    (el: HTMLInputElement | null) => {
      adoptRef(el)
      if (typeof ref === "function") ref(el)
      else if (ref) ref.current = el
    },
    [adoptRef, ref]
  )
  return (
    <input
      ref={composedRef}
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
