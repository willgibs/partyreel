"use client";

import "./door.css";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";

/**
 * The entry surface's HONEST-AFFORDANCE contract:
 * - "free": the guest can leave (an X, Escape, the backdrop) because something
 *   browsable sits behind.
 * - "held": nothing real sits behind (a firm gate IS the page), so no X and an
 *   inert Escape and backdrop.
 */
export type DismissMode = "free" | "held";

/**
 * THE DOOR'S SCRIM, today's (10% black, a 4px blur where the browser can), held
 * here as the door's own so round 2 of `identity-door` can land its look as a
 * one-line restyle: the scrim is the one place the blur and the overlay live,
 * because the panel itself is opaque (`floating-layer.ts`).
 */
const DOOR_SCRIM = "bg-black/10 supports-backdrop-filter:backdrop-blur-xs";

/**
 * THE DOOR'S SHELL: the ONE product Sheet (`SheetContent responsive`) at both
 * widths, a bottom sheet in a hand and a full-height panel from the right edge
 * at a desk, with no centred float anywhere. Anchored to an edge rather than
 * centred as a modal, it shows much more of the blurred album waiting behind
 * it, which is the incentive the door runs on. The shell never owns flow
 * state: `open` is fully derived upstream and `onDismiss` fires only for a user
 * dismissal of a "free" surface.
 *
 * ★ THE PHONE HALF LEFT VAUL (door-flow, Will: the sheet "feels super buggy when
 * the mobile keyboard opens to type", "Very important"). vaul 1.1.2 is
 * unmaintained and its `repositionInputs` was the bug: it lifted the drawer by
 * `innerHeight - visualViewport.height` while ignoring `offsetTop`, so the lift
 * stacked with iOS's own pan; it pinned the drawer's height the first time the
 * keyboard opened and never reset it across steps of different heights; its
 * `touch-action: none` sat on the scroll container; and its scroll lock fixed
 * `body`. The door never drags (every step is held), so it wears the Sheet
 * every other guest surface wears, whose phone half is keyboard-safe for all of
 * them: it stands on the keyboard while a field is focused, caps itself at the
 * visible height less 12px, and keeps the primary action pinned at its foot.
 *
 * ★ NO FIELD IS FOCUSED WHEN THE DOOR OPENS, at either width: Radix's open
 * autofocus is prevented and the panel itself takes focus (the Sheet's own
 * rule), so the keyboard never rises into a sheet that is still arriving.
 *
 * ★ THE DISMISSABILITY TABLE IS ONE ROW: `held` means no X and an inert Escape
 * and outside click; the album menu's "Change name" is the one `free` surface.
 */
export function EntryShell({
  ref,
  open,
  dismissMode,
  onDismiss,
  title,
  description,
  children,
}: {
  /** The panel, for the modal's own "is focus inside the door" checks. */
  ref?: React.Ref<HTMLDivElement>;
  open: boolean;
  dismissMode: DismissMode;
  /** A user dismissed a "free" surface (X / Escape / backdrop). */
  onDismiss: () => void;
  /** sr-only accessible name + description (steps render visible headings). */
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const held = dismissMode === "held";

  // Radix reports closes via onOpenChange; opening is never theirs.
  function handleOpenChange(next: boolean) {
    if (!next && !held) onDismiss();
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        ref={ref}
        responsive
        data-entry-sheet
        showCloseButton={!held}
        overlayClassName={DOOR_SCRIM}
        onInteractOutside={held ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={held ? (e) => e.preventDefault() : undefined}
        // No field autofocuses on open (the Sheet puts focus on the panel).
        onOpenAutoFocus={(e) => e.preventDefault()}
        // Never yank focus to a fallback target over the freshly revealed
        // gallery when the sheet closes (there is no trigger to return to).
        onCloseAutoFocus={(e) => e.preventDefault()}
        // The panel runs to its own edges, so the padding the step content was
        // written for lives here rather than in the primitive (the same division
        // GuestShare's body makes). On a phone the foot keeps clear of the home
        // indicator while the keyboard is down. While it is up (`data-keyboard`,
        // the Sheet's own) the keyboard covers that inset: `open` hands the
        // bottom space to the sticky foot, which carries its own, and `tight` (a
        // landscape phone's thin band) keeps just enough padding for the field.
        className="gap-0 overflow-y-auto overscroll-contain p-6 text-sm outline-none data-[keyboard=open]:pb-0 data-[keyboard=tight]:py-2 max-sm:pt-5 max-sm:pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
      >
        <SheetTitle className="sr-only">{title}</SheetTitle>
        <SheetDescription className="sr-only">{description}</SheetDescription>
        {children}
      </SheetContent>
    </Sheet>
  );
}
