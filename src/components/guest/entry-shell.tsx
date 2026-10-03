"use client";

import "./door.css";

import {
  DOOR_SCRIM,
  DoorLamp,
  type LampStrength,
} from "@/components/guest/door/lit";
import { STAGE_SCRIM } from "@/components/guest/door/stage";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * The entry surface's HONEST-AFFORDANCE contract:
 * - "free": the guest can leave (an X, Escape, the backdrop) because something
 *   browsable sits behind.
 * - "held": nothing real sits behind (a firm gate IS the page), so no X and an
 *   inert Escape and backdrop.
 */
export type DismissMode = "free" | "held";

/**
 * ★ THE DOOR IS LIT (`identity-door` r2, Will's `look=lit`), every step of it: the lit scrim
 * behind (`DOOR_SCRIM`, the one place the blur and the overlay live, because the panel itself is
 * opaque) and the album's own light on the sheet's free edge (`DoorLamp`). Both are the SHELL's
 * rather than any step's, so the welcome, the password, the chooser, the name, the code, the
 * upload, the keep and the stalled beat all stand in the same light.
 */

/**
 * THE DOOR'S SHEET, ITS PADDING AND POSTURE, worn by the held door and by every sheet of the door's
 * family that opens over the album (the confirm, add and change sheets, the like door), so one
 * guest meets one door. The panel runs to its own edges, so the padding the step content was
 * written for lives here rather than in the primitive (the same division GuestShare's body makes).
 * On a phone the foot keeps clear of the home indicator while the keyboard is down. While it is up
 * (`data-keyboard`, the Sheet's own) the keyboard covers that inset: `open` hands the bottom space
 * to the sticky primary, which carries its own 16px, and a screen with no sticky primary (the code
 * screen: the sixth digit sends it) keeps those same 16px itself, or its last line would sit on the
 * keyboard's edge (ROADMAP's line, measured about 6px off it); `tight` (a landscape phone's thin
 * band) keeps just enough padding for the field.
 */
export const DOOR_SHEET =
  "gap-0 overflow-y-auto overscroll-contain p-6 text-sm outline-none data-[keyboard=open]:pb-0 data-[keyboard=open]:not-has-[[data-sheet-primary]]:pb-4 data-[keyboard=tight]:py-2 max-sm:pt-5 max-sm:pb-[calc(1.5rem+env(safe-area-inset-bottom))]";

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
 * `body`. Nothing drags now that vaul is gone (not the door's held steps, and
 * not the one free surface, "Change name," either), so every guest sheet
 * wears the same plain, keyboard-safe Sheet: it stands on the keyboard while
 * a field is focused, caps itself at the visible height less 12px, and keeps
 * the primary action pinned at its foot.
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
  lamp = "base",
  scrim = "album",
  arriving = false,
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
  /** The lamp blooms on "You're in"; the code screen's lean is the stylesheet's (`lit.css`). */
  lamp?: LampStrength;
  /**
   * What the sheet stands over: the album (`DOOR_SCRIM`, blurred as the reward), or the doorway at a
   * gate (`STAGE_SCRIM`, a light dim that leaves the door and its light legible above the sheet).
   */
  scrim?: "album" | "door";
  /**
   * ★ THE SHEET RISES INTO A SCRIM ALREADY STANDING (door-reveal): where the page's first byte drew the
   * album behind the door's scrim (`entry-modal.tsx`'s `arrival.scrim`), the sheet's own scrim takes its
   * place standing, with no fade of its own, so the album never shows between the two.
   */
  arriving?: boolean;
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
        overlayClassName={cn(
          scrim === "door" ? STAGE_SCRIM : DOOR_SCRIM,
          arriving && "data-open:animate-none!",
        )}
        onInteractOutside={held ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={held ? (e) => e.preventDefault() : undefined}
        // No field autofocuses on open (the Sheet puts focus on the panel).
        onOpenAutoFocus={(e) => e.preventDefault()}
        // Never yank focus to a fallback target over the freshly revealed
        // gallery when the sheet closes (there is no trigger to return to).
        onCloseAutoFocus={(e) => e.preventDefault()}
        className={DOOR_SHEET}
        data-door-lit=""
      >
        <DoorLamp edge="free" strength={lamp} />
        <SheetTitle className="sr-only">{title}</SheetTitle>
        <SheetDescription className="sr-only">{description}</SheetDescription>
        {children}
      </SheetContent>
    </Sheet>
  );
}
