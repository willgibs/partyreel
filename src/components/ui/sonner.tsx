"use client"

import { DismissableLayer } from "radix-ui/internal"
import { Toaster as Sonner, toast, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

// ERRORS PERSIST UNTIL DISMISSED: a failure that disappears before it is read
// repeats itself (success and warning keep sonner's fixed clock). Sonner has NO
// per-type default duration to lean on for this - verified against the
// installed package (node_modules/sonner/dist/index.mjs): both the Toaster's own
// `duration` prop and `toastOptions.duration` are ONE flat number applied to
// every kind, so setting either globally would also freeze success/warning on
// screen forever. Every `toast.error(...)` call site in the app already calls
// through sonner's OWN `toast.error`, the single choke point, so it is patched
// once here at module load, which the root layout imports before any page can
// render and fire one. A call site's own `duration`/`closeButton` still wins
// (spread after the forced defaults).
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
  return (
    // ★ A TOAST IS PRESSABLE OVER AN OPEN MODAL, AND A PRESS ON ONE IS INSIDE
    // EVERY LAYER. An open Radix modal (a popup, the Dialog, the Sheet, the
    // viewer, a menu) sets `pointer-events: none` on the body, which this band
    // inherits, and closes on any press outside it: a toast's Undo over the
    // storage list closed the list at a desk and went through to the chip
    // under it in a hand. So the band takes pointer events back (`style`
    // below; sonner's own rule still turns a hidden toast's off) and is a
    // DismissableLayer BRANCH, Radix's own "counts as inside every layer" (its
    // Toast viewport is one): one place, for every layer and every press on a
    // toast. `asChild` hands the branch's ref to sonner, which forwards it to
    // its always-mounted `<section>`. ★ A keyboard still cannot reach a toast
    // while a modal holds focus: Radix's focus trap pulls sonner's alt+T back.
    <DismissableLayer.Branch asChild>
      <Sonner
        // ★ ALWAYS SONNER'S DARK, because a toast is the display (identity r2,
        // layers=display): the camera's own screen, near-black on paper and lit
        // graphite in the room. Sonner's light theme paints a description and the close
        // button's glyph in near-black ink, which on the display is nothing; its
        // dark theme reads every part off the `--normal-*` colours below.
        theme="dark"
        className="toaster group"
        // Top centre, at both sizes: a band under the header, clear of every
        // fixed-bottom control on the page (the guest's action dock, and the
        // lightbox credit line on a phone) - one shared rule for the host app,
        // the guest pages and marketing alike, since the one Toaster in
        // layout.tsx mounts above every surface, not per-route.
        position="top-center"
        // Always expanded: every toast keeps its full height in its own row,
        // newest on top - never sonner's collapsed hover pile, which has no
        // hover on the phone this product is built for. `visibleToasts` stays
        // sonner's own default (3), which fits a run of three bulk outcomes;
        // nothing here asks for more.
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
        // breakpoint.
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
        // The display's own colours, read from the ground the Toaster stands in
        // (the `--display*` set is declared per ground, so a dark session's
        // toast is graphite and a light one's is near-black). A toast's state is
        // its glyph lit in the state's colour (globals.css), never a filled slab.
        style={
          {
            "--normal-bg": "var(--display)",
            "--normal-text": "var(--display-foreground)",
            "--normal-border": "var(--display-edge)",
            "--border-radius": "var(--radius-float)",
            // Above an open modal's scrim, as above the page (see the branch).
            pointerEvents: "auto",
          } as React.CSSProperties
        }
        toastOptions={{
          classNames: {
            // The display's ground, so a toast's parts (its glyph's state
            // colour, its Undo's ink) read the screen's tokens. The toast and
            // its buttons wear the house's focus mark (identity r4,
            // `focus-halo`), which globals.css composes past sonner's own
            // focus rules; its light edge is globals.css's too.
            toast: "cn-toast surface-display focus-halo",
            actionButton: "focus-halo",
            cancelButton: "focus-halo",
            closeButton: "focus-halo",
          },
        }}
        {...props}
      />
    </DismissableLayer.Branch>
  )
}

export { Toaster }
