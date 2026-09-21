"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, toast, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

// ERRORS PERSIST UNTIL DISMISSED (`toasts` r1, `life=persist`, 2026-09-20:
// "a failure that disappears before it is read repeats itself"; success and
// warning keep sonner's fixed clock). Sonner has NO per-type default duration
// to lean on for this - verified against the installed package
// (node_modules/sonner/dist/index.mjs): both the Toaster's own `duration`
// prop and `toastOptions.duration` are ONE flat number applied to every kind,
// so setting either globally would also freeze success/warning on screen
// forever. And the 65 existing `toast.error(...)` call sites across the app
// stay exactly as they are this lane (the "if the control can show it, no
// toast" sweep is a follow-up, not this one) - so the single choke point
// every one of them already calls through is sonner's OWN `toast.error`,
// patched once here at module load, which the root layout imports before any
// page can render and fire one. A call site's own `duration`/`closeButton`
// still wins (spread after the forced defaults).
//
// ★ GUARDED AGAINST DOUBLE-PATCHING. `"sonner"` is a singleton module, but
// this file's own module can be re-evaluated more than once (Turbopack/Fast
// Refresh re-running an edited module while its imports stay cached), which
// would otherwise wrap an already-wrapped `toast.error` again on every dev
// save - harmless in effect (the same two defaults, applied twice) but
// needless indirection. The flag lives on `toast` itself, not on a
// module-local `let`, because it is `toast` that a re-evaluation would
// re-wrap.
const ERROR_PATCHED = Symbol.for("partyreel.sonner.error-persists")
type PatchableToast = typeof toast & { [ERROR_PATCHED]?: true }
const patchableToast = toast as PatchableToast
if (!patchableToast[ERROR_PATCHED]) {
  const sonnerError = toast.error
  // Annotated as a variable (not cast on the arrow function itself) so
  // `message`/`data` are contextually typed from `ErrorFn` instead of
  // falling back to implicit `any`.
  type ErrorFn = typeof sonnerError
  const persistentError: ErrorFn = (message, data) =>
    sonnerError(message, { duration: Infinity, closeButton: true, ...data })
  patchableToast.error = persistentError
  patchableToast[ERROR_PATCHED] = true
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      // WHERE (`where=top`): both sizes move to a band under the header,
      // clear of every fixed-bottom control on the page today (the guest's
      // floating Add pill and the lightbox credit line on a phone, the
      // host's own fixed action bar on both sizes) - one shared rule for
      // the host app, the guest pages and marketing alike, since the one
      // Toaster in layout.tsx mounts above every surface, not per-route.
      position="top-center"
      // STACK (`stack=expanded`): every toast keeps its full height in its
      // own row, newest on top - never sonner's collapsed hover pile, which
      // has no hover on the phone this product is built for.
      // `visibleToasts` stays sonner's own default (3): the board's own
      // example is "a run of three bulk outcomes", and nothing here asks
      // for more (his to overrule).
      expand
      // The top offset clears the TALLEST bar in the product - the
      // marketing header (`--mkt-header-h`, marketing.css, 4rem) - plus a
      // 1rem breath. The app shell's bar (`app-shell.tsx`, h-14, 3.5rem)
      // and the guest header (`guest-header.tsx`, its h-8 slot + py-3, also
      // 3.5rem) are both shorter, so one number clears every surface with
      // room left over rather than three. It cannot read `--mkt-header-h`
      // directly: that var is scoped to `[data-mkt]` (marketing.css's
      // containment contract), and the Toaster mounts as `[data-mkt]`'s
      // SIBLING in layout.tsx, outside the scope the cascade would need.
      // Same number on mobile: none of the three bars change height by
      // breakpoint. His to overrule.
      offset={{ top: "5rem" }}
      mobileOffset={{ top: "5rem" }}
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius-float)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
