"use client";

import { Drawer } from "vaul";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/lib/use-media-query";

/**
 * The entry surface's HONEST-AFFORDANCE contract:
 * - "free": the guest can leave (X on desktop, a real draggable handle +
 *   swipe-to-dismiss on phones) because something browsable sits behind.
 * - "held": nothing real sits behind (a firm gate IS the page), so no X, no
 *   handle, and the sheet rubber-bands on drag instead of pretending.
 */
export type DismissMode = "free" | "held";

/**
 * The adaptive entry SHELL: a real Vaul drawer on phones (the iOS curve,
 * drag physics, repositionInputs so a focused field lifts the sheet above
 * the keyboard), and the ONE product Sheet from 640 up. Both shells render
 * the SAME children (the step content is written once in entry-modal) and
 * never own flow state: `open` is fully derived upstream and `onDismiss`
 * fires only for a user dismissal of a "free" surface.
 *
 * ★ THE SHELL IS THE SHEET: the responsive Sheet, around the step SEQUENCE
 * (welcome, then gate) — a bottom sheet in a hand, a full-height panel from the
 * right edge at a desk, and no centred float anywhere. Aligned to the bottom
 * rather than centred as a modal, it shows much more of the blurred album
 * awaiting above, which teases a guest on through the welcome gates. So the desk
 * half is never a box in the middle of the screen with the album showing around
 * it: it is the same primitive every other guest surface wears (Invite, Save,
 * Report and Download are all `SheetContent responsive`).
 *
 * ★ AND THE PHONE HALF STAYS VAUL, BECAUSE THE POSTURE WAS NEVER THE PROBLEM
 * THERE. An iPhone pass bought this drawer for three things a Radix panel
 * does not have — the iOS curve, real drag physics, and `repositionInputs` so a
 * focused password field lifts the sheet above the keyboard — and the entry
 * surface is the one place in the product that types into a bottom sheet. What
 * it takes from the Sheet is the POSTURE: `max-h-[85svh]`, so a long welcome on
 * a small phone stops short of the top edge instead of becoming the page.
 *
 * ★ THE DISMISSABILITY TABLE IS THE SAME IN BOTH SHELLS: `held` means no X, no
 * handle and an inert Escape / outside click, whichever one renders.
 */
export function EntryShell({
  open,
  dismissMode,
  onDismiss,
  title,
  description,
  children,
}: {
  open: boolean;
  dismissMode: DismissMode;
  /** A user dismissed a "free" surface (X / Escape / backdrop / swipe). */
  onDismiss: () => void;
  /** sr-only accessible name + description (steps render visible headings). */
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const held = dismissMode === "held";

  // Radix/vaul report closes via onOpenChange; opening is never theirs.
  function handleOpenChange(next: boolean) {
    if (!next && !held) onDismiss();
  }

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          responsive
          data-entry-sheet
          showCloseButton={!held}
          onInteractOutside={held ? (e) => e.preventDefault() : undefined}
          onEscapeKeyDown={held ? (e) => e.preventDefault() : undefined}
          // Never yank focus to a fallback target over the freshly revealed
          // gallery when the sheet closes (there is no trigger to return to).
          onCloseAutoFocus={(e) => e.preventDefault()}
          // The panel runs to its own edges, so the padding the step content
          // was written for lives here rather than in the primitive (the same
          // division GuestShare's body makes).
          className="overflow-y-auto p-6 text-sm"
        >
          <SheetTitle className="sr-only">{title}</SheetTitle>
          <SheetDescription className="sr-only">{description}</SheetDescription>
          {children}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer.Root
      open={open}
      onOpenChange={handleOpenChange}
      // dismissible=false gives the honest rubber-band on drag; the surface
      // can still close programmatically (open is derived upstream).
      dismissible={!held}
      repositionInputs
    >
      <Drawer.Portal>
        <Drawer.Overlay
          data-entry-overlay
          className="fixed inset-0 z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs"
        />
        {/* ★ THE SHEET IS THE FLOATING LAYER, SO IT WEARS ITS CORNER:
            `rounded-t-float`, the same token as the panel this surface becomes
            at 640. Not a multiple of a BUTTON's corner: that would tie the first
            surface every guest meets to the action rung, so a button retune
            would reshape the sheet.

            ★ AND `max-h-[85svh]` IS THE PRODUCT SHEET'S OWN CEILING, quoted
            from `floatingEdgeEntranceResponsive` rather than imported: vaul
            owns this element's transform and inset outright, so the two
            postures agree by one number here instead of by a class string that
            would also hand vaul its position. `svh` (not `vh`) because a phone
            browser's toolbar is what the last 10% of the screen usually is. */}
        <Drawer.Content
          data-entry-drawer
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85svh] flex-col overflow-y-auto rounded-t-float bg-popover px-6 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-sm text-popover-foreground shadow-layer ring-1 ring-foreground/10 outline-none"
        >
          {/* The handle is REAL (a vaul drag target) and renders only when
              dragging actually dismisses: the honest-affordance rule above. */}
          {!held && (
            <Drawer.Handle className="mx-auto mb-2 h-1 w-9 shrink-0 rounded-full bg-muted-foreground/30" />
          )}
          <Drawer.Title className="sr-only">{title}</Drawer.Title>
          <Drawer.Description className="sr-only">
            {description}
          </Drawer.Description>
          {children}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
