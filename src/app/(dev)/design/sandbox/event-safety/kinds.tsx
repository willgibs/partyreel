"use client";

import { type ReactNode } from "react";
import { Ban, ChevronLeft, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  floatingPanel,
  floatingPopupShapes,
} from "@/components/ui/floating-layer";
import {
  type DialogShape,
  isDialogShape,
  type PopupKind,
  shapeFor,
} from "@/components/ui/popup-kinds";
import { cn } from "@/lib/utils";

import type { Person } from "./fixtures";
import { Face } from "./host";
import type { ScreenId } from "./scene";

/**
 * THE POPUP KINDS, QUOTED FROM THE ONE TABLE (`ui/popup-kinds.ts`, popups-wiring
 * `3e7952e3`). Every popup on this board names its kind and reads its shape off
 * production's own row for the width it is drawn at, so when Will moves a kind
 * the board moves with it, the way `PopupContent` does: the settings kind is his
 * unfocused panel at a desk and its own screen under a back arrow in a hand; a
 * list is a panel at a desk and a screen in a hand; a name's look is a card
 * beside the name at a desk and the Sheet in a hand.
 *
 * ★ QUOTED, NEVER MOUNTED: `PopupContent` sits in a Radix portal, which renders
 * on the lab page's document rather than inside the frame being judged
 * (`scene.tsx`). The element below wears production's own classes instead: the
 * shapes (`floatingPopupShapes`, keyed by the `data-shape` it sets) and the
 * content and overlay strings `popup.tsx` keeps private, copied here because it
 * does not export them. They are production's utilities, so they resolve in the
 * frame at its real width with nothing of the lab's competing.
 *
 * Nothing opens or closes: every control is `tabIndex={-1}` and inert, drawn
 * at rest, so reduced motion has nothing to honour.
 */

/** A desk or a hand, as the product's one breakpoint reads the frame. */
export const deskOf = (screen: ScreenId) => screen === "1440";

/** `popup.tsx`'s scrim, quoted: the Dialog's and the Sheet's, never drawn behind a whole screen. */
const OVERLAY = cn(
  "fixed inset-0 z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs",
  "data-[shape=screen]:invisible data-[shape=cover]:invisible",
);

/** `popup.tsx`'s content element, quoted: the column every shape stands on. */
const CONTENT =
  "fixed z-50 flex flex-col overflow-hidden bg-popover text-sm text-popover-foreground shadow-layer outline-none";

/**
 * ONE POPUP OF ONE KIND, AT ONE WIDTH: the head, the body that scrolls and an
 * optional foot, exactly the three parts `PopupContent` draws in every shape. A
 * hand's `screen` heads with its bar (the back arrow naming where Back returns,
 * the title centred, the line under it); every other shape heads with the title
 * and its line and carries the close in its corner.
 */
export function PopupQuote({
  kind,
  screen,
  title,
  description,
  back,
  size = "sm",
  bodyClassName,
  foot,
  children,
}: {
  kind: PopupKind;
  screen: ScreenId;
  title: ReactNode;
  description?: ReactNode;
  /** Where a hand's back arrow returns, in words. */
  back?: string;
  size?: "sm" | "md" | "lg";
  bodyClassName?: string;
  foot?: ReactNode;
  children: ReactNode;
}) {
  const wanted = shapeFor(kind, deskOf(screen));
  // An own shape (the anchored look, the menu) asked to stand as a dialog
  // element stands where the Dialog or the Sheet would, as `PopupContent` does.
  const shape: DialogShape = isDialogShape(wanted)
    ? wanted
    : deskOf(screen)
      ? "dialog"
      : "sheet";
  const bar = shape === "screen";
  return (
    <>
      <div aria-hidden data-shape={shape} className={OVERLAY} />
      <div
        data-slot="popup-content"
        data-kind={kind}
        data-shape={shape}
        data-size={size}
        className={cn(CONTENT, floatingPopupShapes)}
      >
        {bar ? (
          <div data-slot="popup-header" className="shrink-0 border-b">
            <div className="grid h-13 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-2">
              <Button
                variant="ghost"
                size="sm"
                tabIndex={-1}
                className="max-w-full gap-0.5 justify-self-start px-1.5 text-muted-foreground"
              >
                <ChevronLeft className="size-5" />
                <span className="truncate">{back ?? "Back"}</span>
              </Button>
              <p className="max-w-[55vw] truncate text-center font-heading text-base font-medium text-foreground">
                {title}
              </p>
              <span aria-hidden />
            </div>
            {description ? (
              <p className="px-4 pb-3 text-sm text-pretty text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        ) : (
          <div
            data-slot="popup-header"
            className="flex shrink-0 flex-col gap-1 p-4 pr-12"
          >
            <p className="font-heading text-card-title font-medium text-pretty text-foreground">
              {title}
            </p>
            {description ? (
              <p className="text-sm text-pretty text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        )}
        <div
          data-slot="popup-body"
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4",
            bar && "pt-4",
            bodyClassName,
          )}
        >
          {children}
        </div>
        {foot}
        {!bar && (
          <Button
            variant="ghost"
            size="icon-sm"
            tabIndex={-1}
            aria-label="Close"
            className={cn(
              "absolute",
              shape === "dialog" || shape === "wide"
                ? "top-2 right-2"
                : "top-3 right-3",
            )}
          >
            <X />
          </Button>
        )}
      </div>
    </>
  );
}

/* ── a name's look, and Block inside it ───────────────────────────────────── */

/** The one line under a look's name (`guest-peek.tsx`'s `lookLine`): what kind of name it is. */
const lookLine = (person: Person) =>
  person.verified
    ? "Confirmed their email"
    : "Unverified: anyone can type a name";

/**
 * THE ACT THE LOOK GAINS (the `entry` ask's proposal): Block, on the look's own
 * foot where its actions already stand (`LookActions`), in the destructive
 * button's quiet red. It opens the block itself, which the popups board settled
 * as a centred confirm (`confirm=dialog`), so nothing about the act is drawn
 * here, only its door.
 */
function BlockAct() {
  return (
    <div className="flex flex-col gap-2 pt-1">
      <Button
        variant="destructive"
        className="w-full"
        tabIndex={-1}
        data-es-reach
      >
        <Ban /> Block from this event
      </Button>
    </div>
  );
}

/**
 * A NAME'S LOOK, AS THE HOST OPENS IT (`social/guest-peek.tsx`, popups
 * `peek=card`): the face, the name, the line that says what kind of name it is,
 * the address only a host ever sees, and the look's actions, Block among them.
 * At a desk it is the card beside the name, positioned by whoever drew the
 * name; in a hand it is the peek kind's Sheet from the foot of the screen.
 */
export function PersonLook({
  person,
  screen,
  className,
}: {
  person: Person;
  screen: ScreenId;
  /** Where the desk's card stands beside its name. */
  className?: string;
}) {
  if (shapeFor("peek", deskOf(screen)) === "anchored") {
    return (
      <div
        data-slot="guest-peek"
        className={cn("z-50 w-80 space-y-3 p-4", floatingPanel, className)}
      >
        <div className="flex items-center gap-3">
          <Face person={person} size="lg" />
          <div className="min-w-0 space-y-0.5">
            <p className="truncate font-heading text-card-title font-medium">
              {person.name}
            </p>
            <p className="text-sm text-muted-foreground">{lookLine(person)}</p>
          </div>
        </div>
        {person.email ? (
          <p className="truncate text-caption text-muted-foreground">
            {person.email}
          </p>
        ) : null}
        <BlockAct />
      </div>
    );
  }
  return (
    <PopupQuote
      kind="peek"
      screen={screen}
      title={
        <span className="flex items-center gap-3">
          <Face person={person} size="lg" />
          <span className="min-w-0 truncate">{person.name}</span>
        </span>
      }
      description={lookLine(person)}
      bodyClassName="space-y-3"
    >
      {person.email ? (
        <p className="truncate text-caption text-muted-foreground">
          {person.email}
        </p>
      ) : null}
      <BlockAct />
    </PopupQuote>
  );
}
