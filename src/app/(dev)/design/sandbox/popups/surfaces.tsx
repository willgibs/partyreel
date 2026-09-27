"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";
import { ChevronLeft, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { floatingPanel } from "@/components/ui/floating-layer";
import { cn } from "@/lib/utils";

import { KEYBOARD_H, Keyboard } from "./keyboard";
import { PHONE, VISIBLE_H } from "./scene";

/**
 * THE SURFACES: every shape an option on this board can give a popup, each
 * quoting the production primitive it is (or would become) class for class.
 *
 * ★ ONE POPUP, MANY SHAPES. A kind's content is written once as `Parts` (its
 * title, its words, its body, its act and its way out), and each shape here
 * lays those same parts out its own way: a sheet stacks its act at its foot, a
 * dialog puts Cancel and the act in its banded footer, a phone's own screen
 * moves them into its bar. So two options differ only in the surface, which is
 * the one thing each question asks, and no option wins on better copy.
 *
 * ★ QUOTED, NEVER MOUNTED (`scene.tsx`'s landmine): a real Radix Dialog or
 * Sheet portals to the lab page, not the frame. `fixed` here is the frame's
 * own viewport, so a surface sits exactly where the product would put it.
 *
 * ★ THE KEYBOARD RULE IS PRODUCTION'S (`floating-layer.ts`,
 * `floatingEdgeEntranceResponsive` and `floatingKeyboardFoot`): with a field
 * focused a phone surface stands on the keyboard's top edge, its ceiling the
 * visible band less 12 px, its act pinned at its foot on an opaque ground. The
 * dialog is drawn under the same rule taught to it (the board's carried call:
 * today's `DialogContent` is not keyboard-safe).
 */

export type Size = "phone" | "desk";

export type Act = {
  label: ReactNode;
  tone?: "default" | "destructive";
  icon?: ReactNode;
};

export type Parts = {
  title: ReactNode;
  description?: ReactNode;
  body?: ReactNode;
  act?: Act;
  /** The way out, in the popup's own words ("Cancel", "Keep my account"). */
  cancel?: string;
  /** Under the act in a sheet's foot: a quiet link or a note. */
  after?: ReactNode;
  /** A field in the body holds focus: a phone raises its keyboard. */
  typing?: boolean;
  /** The keyboard's return key while typing. */
  enter?: string;
};

/** A desk has no keyboard to raise: the same parts, never typing there. */
export const forSize = (parts: Parts, size: Size): Parts =>
  size === "desk" && parts.typing ? { ...parts, typing: false } : parts;

/* ── the pieces every shape shares ─────────────────────────────────────────── */

/** `sheet.tsx` / `dialog.tsx`'s scrim: 10 percent black, `backdrop-blur-xs`. */
export function Scrim({
  dim = 0.1,
  blur = 4,
}: {
  dim?: number;
  blur?: number;
}) {
  const filter = blur ? `blur(${blur}px)` : undefined;
  return (
    <div
      data-pop-scrim=""
      aria-hidden
      className="fixed inset-0 z-50"
      style={
        {
          backgroundColor: `rgb(0 0 0 / ${dim})`,
          backdropFilter: filter,
          WebkitBackdropFilter: filter,
        } as CSSProperties
      }
    />
  );
}

/** The act, as the Button production renders it. `data-pop-primary` is what
 *  every caption measures against the keyboard or the foot. */
export function ActButton({
  act,
  size = "default",
  className,
}: {
  act: Act;
  size?: "default" | "sm" | "lg" | "cta";
  className?: string;
}) {
  return (
    <Button
      type="button"
      tabIndex={-1}
      data-pop-primary=""
      variant={act.tone === "destructive" ? "destructive" : "default"}
      size={size}
      className={className}
    >
      {act.icon}
      {act.label}
    </Button>
  );
}

function CancelButton({
  label,
  className,
  size = "default",
}: {
  label: string;
  className?: string;
  size?: "default" | "lg" | "cta";
}) {
  return (
    <Button
      type="button"
      tabIndex={-1}
      variant="outline"
      size={size}
      className={className}
    >
      {label}
    </Button>
  );
}

/** The primitives' own close: a ghost icon in the corner. */
function CloseX({ at }: { at: "sheet" | "dialog" }) {
  return (
    <Button
      type="button"
      tabIndex={-1}
      variant="ghost"
      size="icon-sm"
      className={cn(
        "absolute",
        at === "sheet" ? "top-3 right-3" : "top-2 right-2",
      )}
    >
      <X />
      <span className="sr-only">Close</span>
    </Button>
  );
}

function Title({
  children,
  dialog,
}: {
  children: ReactNode;
  dialog?: boolean;
}) {
  return (
    <p
      className={cn(
        "font-heading text-card-title font-medium text-pretty text-foreground",
        dialog && "leading-none",
      )}
    >
      {children}
    </p>
  );
}

function Description({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm text-pretty text-muted-foreground">{children}</p>
  );
}

/** `floatingKeyboardFoot`: the act stuck to the sheet's foot while typing, on
 *  an opaque ground with a short fade above it. */
const KEYBOARD_FOOT =
  "sticky bottom-0 z-10 bg-popover pt-2 pb-4 before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-4 before:bg-linear-to-t before:from-popover before:to-transparent before:content-['']";

/**
 * A FOCUSED FIELD IS IN VIEW (the Sheet's own keyboard hook scrolls a field
 * above `data-sheet-primary`; iOS does the same for a dialog's body): the
 * scroller the field lives in is scrolled so the field clears the foot, or the
 * scroller's own bottom, by 16 px. Set on the frame's node from the board's
 * realm, and again as the frame's stylesheets and webfont settle.
 *
 * ★ NEVER `scrollIntoView`: from inside a same-origin frame it also scrolls
 * the LAB PAGE to the frame, which would jerk the reviewer's own scroll.
 */
function useFieldInView(on: boolean) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const box = ref.current;
    const win = box?.ownerDocument.defaultView;
    if (!on || !box || !win) return;
    const place = () => {
      const field = box.querySelector("[data-pop-field]");
      if (!field) return;
      const foot = box.querySelector("[data-pop-foot]");
      const limit =
        (foot
          ? foot.getBoundingClientRect().top
          : box.getBoundingClientRect().bottom) - 16;
      const f = field.getBoundingClientRect();
      if (f.bottom > limit) box.scrollTop += f.bottom - limit;
    };
    place();
    const timers = [120, 400, 900, 1800].map((ms) => win.setTimeout(place, ms));
    win.document.fonts?.ready.then(place).catch(() => {});
    return () => timers.forEach((t) => win.clearTimeout(t));
  }, [on]);
  return ref;
}

/* ── the one responsive Sheet: a bottom sheet in a hand ────────────────────── */

const SHEET_MATERIAL =
  "flex flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-layer";

/**
 * `SheetContent responsive`, phone half: full width, the family's corner on
 * its one free edge, as tall as its content up to 85 percent (or, typing, up
 * to the visible band less 12 px, its foot on the keyboard).
 */
export function BottomSheet({ parts }: { parts: Parts }) {
  const typing = Boolean(parts.typing);
  const scroller = useFieldInView(typing);
  return (
    <>
      <Scrim />
      <div
        ref={scroller}
        data-pop-surface="bottom-sheet"
        data-keyboard={typing ? "open" : undefined}
        className={cn(
          "fixed inset-x-0 z-50 w-full overflow-y-auto rounded-t-float border-t",
          SHEET_MATERIAL,
          typing && "pb-0",
        )}
        style={
          typing
            ? { bottom: KEYBOARD_H, maxHeight: VISIBLE_H - 12 }
            : { bottom: 0, maxHeight: Math.round(PHONE.h * 0.85) }
        }
      >
        <div className="flex flex-col gap-0.5 p-4 pr-12">
          <Title>{parts.title}</Title>
          {parts.description && <Description>{parts.description}</Description>}
        </div>
        {parts.body && <div className="px-4">{parts.body}</div>}
        {(parts.act || parts.cancel || parts.after) && (
          <div
            data-pop-foot=""
            className={cn(
              "mt-auto flex flex-col gap-2 p-4",
              typing ? KEYBOARD_FOOT : "relative",
            )}
          >
            {parts.act && <ActButton act={parts.act} className="w-full" />}
            {parts.cancel && (
              <CancelButton label={parts.cancel} className="w-full" />
            )}
            {parts.after}
          </div>
        )}
        <CloseX at="sheet" />
      </div>
      {typing && <Keyboard enter={parts.enter} />}
    </>
  );
}

/* ── the one responsive Sheet: a side panel at a desk ──────────────────────── */

/**
 * `SheetContent responsive`, desk half: a right-edge panel, `w-3/4 max-w-md`,
 * full height, its foot stacked (a panel has a column, not a dialog's row).
 */
export function SidePanel({
  parts,
  scrim = true,
}: {
  parts: Parts;
  scrim?: boolean;
}) {
  return (
    <>
      {scrim && <Scrim />}
      <div
        data-pop-surface="side-panel"
        className={cn(
          "fixed inset-y-0 right-0 z-50 h-full w-3/4 max-w-md overflow-y-auto border-l",
          SHEET_MATERIAL,
        )}
      >
        <div className="flex flex-col gap-0.5 p-4 pr-12">
          <Title>{parts.title}</Title>
          {parts.description && <Description>{parts.description}</Description>}
        </div>
        {parts.body && <div className="min-h-0 px-4">{parts.body}</div>}
        {(parts.act || parts.cancel || parts.after) && (
          <div className="mt-auto flex flex-col gap-2 p-4">
            {parts.act && <ActButton act={parts.act} className="w-full" />}
            {parts.cancel && (
              <CancelButton label={parts.cancel} className="w-full" />
            )}
            {parts.after}
          </div>
        )}
        <CloseX at="sheet" />
      </div>
    </>
  );
}

/* ── the centred Dialog ────────────────────────────────────────────────────── */

export type DialogWidth = "sm" | "md" | "lg" | "wide";

/**
 * The dialog's widths, in rem: today's `sm:max-w-sm` (24), and the sizes the
 * options add. ★ INLINE, NEVER A CLASS: a utility only this board uses
 * compiles into the lab's `utilities.lab` sub-layer, which production's own
 * `max-w-[calc(100%-2rem)]` (in `utilities`) beats whatever its breakpoint,
 * so `sm:max-w-md` drew a 1408 px dialog. `min()` keeps the phone's 2rem
 * margin and the desk's cap in one declaration.
 */
const WIDTH_REM: Record<DialogWidth, number> = {
  sm: 24,
  md: 28,
  lg: 36,
  wide: 48,
};

/**
 * `DialogContent`: centred, `max-w-[calc(100%-2rem)]`, the floating panel's
 * corner, material and light; its footer a muted band that stacks the act on
 * top in a hand and rows it to the right at a desk. Typing on a phone, it is
 * centred in the band the keyboard leaves (the carried call's fix), with a
 * cap and its own scroll.
 */
export function CentredDialog({
  parts,
  width = "sm",
  scrollBody = false,
}: {
  parts: Parts;
  width?: DialogWidth;
  /** A long body scrolls inside the dialog under a cap. */
  scrollBody?: boolean;
}) {
  const typing = Boolean(parts.typing);
  const scroller = useFieldInView(typing);
  return (
    <>
      <Scrim />
      <div
        data-pop-surface="dialog"
        className={cn(
          "fixed left-1/2 z-50 flex w-full -translate-x-1/2 -translate-y-1/2 flex-col gap-4 p-4 text-sm outline-none",
          floatingPanel,
          // A list or a plan in a dialog is capped at 80 percent and
          // scrolls inside itself, as `profile-page`'s centred list was.
          scrollBody && "max-h-[80vh]",
        )}
        style={{
          maxWidth: `min(calc(100% - 2rem), ${WIDTH_REM[width]}rem)`,
          ...(typing
            ? { top: VISIBLE_H / 2, maxHeight: VISIBLE_H - 24 }
            : { top: "50%" }),
        }}
      >
        <div className="flex flex-col gap-2 pr-8">
          <Title dialog>{parts.title}</Title>
          {parts.description && <Description>{parts.description}</Description>}
        </div>
        {parts.body && (
          <div
            ref={scroller}
            className={cn(
              (scrollBody || typing) && "min-h-0 flex-1 overflow-y-auto",
            )}
          >
            {parts.body}
          </div>
        )}
        {(parts.act || parts.cancel) && (
          <div className="-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-float border-t bg-muted/50 p-4 sm:flex-row sm:justify-end">
            {parts.cancel && <CancelButton label={parts.cancel} />}
            {parts.act && <ActButton act={parts.act} />}
          </div>
        )}
        {parts.after && <div className="-mt-2 text-center">{parts.after}</div>}
        <CloseX at="dialog" />
      </div>
      {typing && <Keyboard enter={parts.enter} />}
    </>
  );
}

/* ── a phone's own screen ──────────────────────────────────────────────────── */

export type Bar = "back" | "compose" | "close";

/**
 * THE WHOLE SCREEN IN A HAND: `DialogContent fullScreen`'s own shape (built,
 * never called) with a bar of its own. `back` is a list or a place (a chevron
 * and the title), `compose` is a form (Cancel, the title, the act in the bar,
 * out of the keyboard's way), `close` is a plan (the title and a close).
 */
export function PhoneScreen({
  parts,
  bar,
  back = "Back",
}: {
  parts: Parts;
  bar: Bar;
  /** The back chevron's own words: where Back returns to. */
  back?: string;
}) {
  const typing = Boolean(parts.typing);
  const scroller = useFieldInView(typing);
  return (
    <>
      <div
        data-pop-surface="screen"
        className="fixed inset-x-0 top-0 z-50 flex flex-col bg-background text-sm text-foreground"
        style={{ bottom: typing ? KEYBOARD_H : 0 }}
      >
        <div className="flex h-13 shrink-0 items-center gap-2 border-b px-2">
          {bar === "compose" ? (
            <>
              <Button type="button" tabIndex={-1} variant="ghost" size="sm">
                {parts.cancel ?? "Cancel"}
              </Button>
              <p className="min-w-0 flex-1 truncate text-center font-heading text-base font-medium">
                {parts.title}
              </p>
              {parts.act && <ActButton act={parts.act} size="sm" />}
            </>
          ) : (
            <>
              {bar === "back" && (
                <span className="flex shrink-0 items-center gap-0.5 pr-1 text-sm text-muted-foreground">
                  <ChevronLeft className="size-5" aria-hidden />
                  {back}
                </span>
              )}
              <p
                className={cn(
                  "min-w-0 flex-1 truncate font-heading text-base font-medium",
                  bar === "close" ? "pl-2" : "pr-12 text-center",
                )}
              >
                {parts.title}
              </p>
              {bar === "close" && (
                <Button
                  type="button"
                  tabIndex={-1}
                  variant="ghost"
                  size="icon-sm"
                >
                  <X />
                  <span className="sr-only">Close</span>
                </Button>
              )}
            </>
          )}
        </div>
        <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-4 p-4">
            {parts.description && (
              <Description>{parts.description}</Description>
            )}
            {parts.body}
            {bar !== "compose" &&
              (parts.act || parts.cancel || parts.after) && (
                <div className="flex flex-col gap-2 pt-1">
                  {parts.act && (
                    <ActButton act={parts.act} className="w-full" />
                  )}
                  {parts.cancel && (
                    <CancelButton label={parts.cancel} className="w-full" />
                  )}
                  {parts.after}
                </div>
              )}
          </div>
        </div>
      </div>
      {typing && <Keyboard enter={parts.enter} />}
    </>
  );
}

/* ── a menu at its button, rows at the thumb ───────────────────────────────── */

/**
 * AT A DESK, A MENU UNDER ITS BUTTON: the floating panel (`popover.tsx`'s
 * material, `p-1` rows at the derived corner), placed by the ground next to
 * the button that asked for it, so nothing dims and nothing is dismissed.
 */
export function AnchoredMenu({
  children,
  width = 288,
  align = "left",
  className,
}: {
  children: ReactNode;
  width?: number;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <div
      data-pop-surface="menu"
      className={cn(
        "absolute top-full z-50 mt-2 p-1 text-sm",
        floatingPanel,
        align === "left" ? "left-0" : "right-0",
        className,
      )}
      style={{ width }}
    >
      {children}
    </div>
  );
}

/** A row of a menu: the derived row corner, an icon, words. */
export function MenuRow({
  icon,
  children,
  hint,
  tone,
}: {
  icon?: ReactNode;
  children: ReactNode;
  hint?: ReactNode;
  tone?: "destructive";
}) {
  return (
    <div
      data-pop-row=""
      className={cn(
        "flex min-h-9 items-center gap-2.5 rounded-[calc(var(--radius-float)_-_4px)] px-2.5 py-1.5 [&>svg]:size-4 [&>svg]:shrink-0",
        tone === "destructive" ? "text-destructive" : "text-foreground",
      )}
    >
      {icon}
      <span className="min-w-0 flex-1">{children}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

/**
 * IN A HAND, ROWS AT THE FOOT: the choices rise to the thumb on the floating
 * panel's material, inset from the phone's edges, with Cancel on its own
 * below them: the phone's own chooser, in the house's material.
 */
export function ActionSheet({
  title,
  children,
  cancel = "Cancel",
}: {
  title?: ReactNode;
  children: ReactNode;
  cancel?: string;
}) {
  return (
    <>
      <Scrim />
      <div
        data-pop-surface="action-sheet"
        className="fixed inset-x-2 bottom-2 z-50 flex flex-col gap-2 text-sm"
      >
        <div className={cn("overflow-hidden p-1", floatingPanel)}>
          {title && (
            <p className="px-3 pt-2.5 pb-2 text-center text-xs text-pretty text-muted-foreground">
              {title}
            </p>
          )}
          {children}
        </div>
        <div
          className={cn(
            "flex h-12 items-center justify-center text-base font-medium",
            floatingPanel,
          )}
        >
          {cancel}
        </div>
      </div>
    </>
  );
}

/** A row of the action sheet: taller than a desk's, one thumb's height. */
export function ActionRow({
  icon,
  children,
  hint,
  primary,
}: {
  icon?: ReactNode;
  children: ReactNode;
  hint?: ReactNode;
  /** The row the popup's act is (the one a caption measures). */
  primary?: boolean;
}) {
  return (
    <div
      data-pop-row=""
      data-pop-primary={primary ? "" : undefined}
      className="flex min-h-12 items-center gap-3 rounded-[calc(var(--radius-float)_-_4px)] px-3 py-2 text-base [&>svg]:size-5 [&>svg]:shrink-0 [&>svg]:text-muted-foreground"
    >
      {icon}
      <span className="min-w-0 flex-1">{children}</span>
      {hint && <span className="text-sm text-muted-foreground">{hint}</span>}
    </div>
  );
}

/* ── the toast (sonner, top centre) ────────────────────────────────────────── */

/**
 * `ui/sonner.tsx`'s one Toaster, quoted: top centre, clear of every fixed
 * bottom control, one trailing action. Undo is that action.
 */
export function UndoToast({
  children,
  action = "Undo",
  below,
}: {
  children: ReactNode;
  action?: string;
  below?: ReactNode;
}) {
  return (
    <div
      data-pop-surface="toast"
      className={cn(
        "fixed top-20 left-1/2 z-50 flex w-[min(356px,calc(100%-2rem))] -translate-x-1/2 flex-col gap-2 p-4 text-sm",
        floatingPanel,
      )}
    >
      <div className="flex items-start gap-3">
        <p className="min-w-0 flex-1 text-pretty">{children}</p>
        <Button
          type="button"
          tabIndex={-1}
          size="sm"
          variant="outline"
          data-pop-primary=""
          className="shrink-0"
        >
          {action}
        </Button>
      </div>
      {below}
    </div>
  );
}

/* ── in place, with the keyboard up ────────────────────────────────────────── */

/**
 * A PAGE THE PHONE HAS SCROLLED TO ITS FOCUSED FIELD: what iOS does when a
 * field in the page itself takes focus. The page stands in the band above the
 * keyboard, scrolled so the field's foot sits 96 px above it, which is where
 * Safari leaves a field it brought into view.
 *
 * ★ THE SCROLL IS SET FROM THE BOARD'S REALM ON THE FRAME'S NODE, AND SET
 * AGAIN AS THE FRAME SETTLES (its stylesheets and the webfont land after the
 * first layout, `Measured`'s own schedule), so it converges rather than
 * trusting a first reading taken on an unstyled page.
 */
export function PageOnKeyboard({
  children,
  enter,
}: {
  children: ReactNode;
  enter?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const box = ref.current;
    const win = box?.ownerDocument.defaultView;
    if (!box || !win) return;
    const place = () => {
      const field = box.querySelector("[data-pop-field]");
      if (!field) return;
      const b = box.getBoundingClientRect();
      const f = field.getBoundingClientRect();
      box.scrollTop += f.bottom - (b.bottom - 96);
    };
    place();
    const timers = [120, 400, 900, 1800].map((ms) => win.setTimeout(place, ms));
    win.document.fonts?.ready.then(place).catch(() => {});
    return () => timers.forEach((t) => win.clearTimeout(t));
  }, []);
  return (
    <>
      <div
        ref={ref}
        className="fixed inset-x-0 top-0 overflow-hidden"
        style={{ bottom: KEYBOARD_H }}
      >
        {children}
      </div>
      <Keyboard enter={enter} />
    </>
  );
}

/** A field as it looks while it holds focus: the ring production draws on
 *  `focus-visible`, drawn here on a field nobody has focused. */
export const FOCUSED = "border-ring ring-3 ring-ring/50";
