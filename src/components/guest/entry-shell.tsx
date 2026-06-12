"use client";

import { Drawer } from "vaul";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMediaQuery } from "@/lib/use-media-query";

/**
 * The entry surface's HONEST-AFFORDANCE contract (Phase 4.5, ratified):
 * - "free": the guest can leave (X on desktop, a real draggable handle +
 *   swipe-to-dismiss on phones) because something browsable sits behind.
 * - "held": nothing real sits behind (a firm gate IS the page), so no X, no
 *   handle, and the sheet rubber-bands on drag instead of pretending.
 */
export type DismissMode = "free" | "held";

/**
 * The adaptive entry SHELL: a real Vaul drawer on phones (the iOS curve,
 * drag physics, repositionInputs so a focused field lifts the sheet above
 * the keyboard), the centered Radix Dialog float on sm+. Both shells render
 * the SAME children (the step content is written once in entry-modal) and
 * never own flow state: `open` is fully derived upstream and `onDismiss`
 * fires only for a user dismissal of a "free" surface.
 *
 * Phase 4 shipped the sheet as max-sm: utility overrides on DialogContent;
 * Will's iPhone pass made the gaps concrete (decorative drag bar, keyboard
 * covering the sheet, no real physics) - the drawer answers all three.
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
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          data-entry-sheet
          showCloseButton={!held}
          onInteractOutside={held ? (e) => e.preventDefault() : undefined}
          onEscapeKeyDown={held ? (e) => e.preventDefault() : undefined}
          // Never yank focus to a fallback target over the freshly revealed
          // gallery when the sheet closes (there is no trigger to return to).
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="sm:max-w-sm"
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            {description}
          </DialogDescription>
          {children}
        </DialogContent>
      </Dialog>
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
        <Drawer.Content
          data-entry-drawer
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[calc(var(--radius-action)*1.4)] bg-popover px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] text-sm text-popover-foreground shadow-float ring-1 ring-foreground/10 outline-none"
        >
          {/* The handle is REAL now (vaul drag target) and renders only when
              dragging actually dismisses - the R2 honesty rule. */}
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
