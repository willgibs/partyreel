"use client";

import Link from "next/link";
import { ChevronLeft, X } from "lucide-react";
import { type ReactNode, type Ref, useState } from "react";

import { SectionLight } from "@/components/marketing/system/section-light";
import { Button } from "@/components/ui/button";
import { useKeyboardInset } from "@/lib/use-keyboard-inset";
import { cn } from "@/lib/utils";

import "./create-room.css";

/**
 * CREATE AS A ROOM OF ITS OWN (create-wizard r1 `shape=screen`, Will 2026-10-02), IN HIS LAYOUT (r2,
 * settled): "Always keep the question up top so users aren't searching for the spot of the new one in a
 * centered group each time, keeping the button at the bottom, and using the center space as needed."
 * So every screen of Create is the same four places: the subtle steppers at the top, the question just
 * under them in one place, the answer's space in the centre, one button at the foot.
 *
 * ★ A SCREEN OF ITS OWN, DARK IN BOTH THEMES (round one's carried `room`, taken: "Create is a room of
 * its own, so the pictures and the light carry it in both themes"). It is `fixed` over the page, and the
 * app's own bar steps aside for it the way a wide page asks for its width: in CSS, through the shell's
 * `group/shell` and `:has()` (`app-shell.tsx`, `data-app-room`), because the shell is the layout's and
 * this is its grandchild. Nothing of the app stands around Create, and nothing of it waits in the tab
 * order behind the room.
 *
 * ★ IT STANDS ON THE KEYBOARD. A phone's keyboard does not shrink the page on iOS (nor on Android's
 * default), so a `fixed` foot would sit under it; `useKeyboardInset` writes the keyboard's height onto
 * the room and the room's own foot rides on it, Continue at the thumb above the keys (the carried
 * `name`: "At a phone the keyboard holds the lower part of the screen and Continue rides on it").
 *
 * ★ THE ROOM'S LIGHT IS THE AURORA'S FIELD, never a gradient of its own: a band at the floor
 * (`SectionLight`, `bottom`), its register and clock the field's own. The board drew it in the lamp
 * set's hues as a stand-in, because its frames have no filter host; production has one in the root
 * layout. The door at the cap stands unlit (design-system.md: light never goes near a cap), and the beat
 * dims the floor for the code's own light (`light="low"`), one lamp to a screen.
 */

export type RoomStep = { at: number; of: number };

export type RoomClose = {
  href: string;
  /** What the close does, said: "Close" while nothing exists, the event once it does. */
  label: string;
};

/** The room's ground: the whole screen, dark, its light at the floor. */
export function RoomGround({
  onRoom,
  light = "floor",
  screen,
  busy,
  children,
}: {
  /** The room's own element, for what measures inside it (the carry). */
  onRoom?: (room: HTMLDivElement | null) => void;
  /** `floor`: the field at the foot; `low`: the beat's, dimmed for the code's light; `none`: unlit. */
  light?: "floor" | "low" | "none";
  /** Which screen stands in the room, for a test or a capture to read. */
  screen: string;
  busy?: boolean;
  children: ReactNode;
}) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  useKeyboardInset(el);
  return (
    <div
      ref={(node) => {
        setEl(node);
        onRoom?.(node);
      }}
      data-app-room=""
      data-room={screen}
      aria-busy={busy || undefined}
      // `bottom` is the keyboard's: 0 until a field inside is typed into on a phone.
      className="dark fixed inset-x-0 top-0 bottom-[var(--kb-inset,0px)] z-50 flex flex-col overflow-hidden bg-background text-foreground [color-scheme:dark]"
    >
      {light !== "none" ? (
        <div
          aria-hidden
          data-room-light={light}
          className="pointer-events-none absolute inset-0 grid"
        >
          {/* A grid stretches the field's own box to the room's, so its floor band is the room's floor
              (the field takes no className; its geometry is the caller's through `reach`). */}
          <SectionLight
            placement="bottom"
            reach={light === "low" ? "26%" : "44%"}
          >
            {null}
          </SectionLight>
        </div>
      ) : null}
      {children}
    </div>
  );
}

/**
 * THE STEPPERS (his "subtle steppers up top"): one hairline a screen, the screens done and the one she is
 * on filled. With `carry` a done hairline is a press back to its screen, a pointer's convenience beside
 * the head's Back (which is the keyboard's and the screen reader's), so it takes no tab stop of its own.
 */
function Hairlines({
  step,
  onStep,
}: {
  step: RoomStep;
  onStep?: (n: number) => void;
}) {
  return (
    <span
      className="flex w-36 items-center gap-1.5 md:w-56 md:gap-2"
      aria-hidden
    >
      {Array.from({ length: step.of }, (_, i) => {
        const n = i + 1;
        const state = n < step.at ? "done" : n === step.at ? "current" : "todo";
        const line = (
          <span className="relative block h-[3px] w-full overflow-hidden rounded-full bg-foreground/15">
            <span
              data-room-fill
              className="cr-fill absolute inset-0 rounded-full bg-foreground"
            />
          </span>
        );
        return (
          <span
            key={n}
            data-room-step={n}
            data-state={state}
            className="flex-1"
          >
            {state === "done" && onStep ? (
              // A hit area a thumb can find under a three-pixel line.
              <button
                type="button"
                tabIndex={-1}
                onClick={() => onStep(n)}
                className="-my-3 block w-full cursor-pointer py-3"
              >
                {line}
              </button>
            ) : (
              line
            )}
          </span>
        );
      })}
    </span>
  );
}

/**
 * THE HEAD. Back at the left from the second screen until the event exists; the event's name over the
 * steppers once she has given it (`carry`: each answer rises into the head, and the head is the way
 * back); the close at the right.
 */
export function RoomHead({
  step,
  name,
  onBack,
  onStep,
  onName,
  close,
}: {
  /** None on the door: it is not a step. */
  step?: RoomStep;
  /** Her name, titling the room from the second screen. */
  name?: string;
  onBack?: () => void;
  onStep?: (n: number) => void;
  onName?: () => void;
  close: RoomClose;
}) {
  return (
    <header
      data-room-head=""
      className="relative flex h-16 shrink-0 items-center px-3 md:px-8"
    >
      {onBack ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          aria-label="Back"
          data-room-back=""
          onClick={onBack}
          className="-ml-1"
        >
          <ChevronLeft className="size-5" />
        </Button>
      ) : (
        <span aria-hidden className="size-9" />
      )}
      {step ? (
        <span className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
          {/* The name's line is always there, so the steppers never move between screens. */}
          <span
            data-room-name=""
            className="block h-5 max-w-[220px] truncate font-heading text-working md:max-w-[420px]"
          >
            {name ? (
              onName ? (
                <button
                  type="button"
                  onClick={onName}
                  // The visible words stay inside the name a screen reader hears (label in name).
                  aria-label={`Back to the name, ${name}`}
                  className="max-w-full cursor-pointer truncate rounded-sm outline-none focus-halo"
                >
                  {name}
                </button>
              ) : (
                name
              )
            ) : null}
          </span>
          <Hairlines step={step} onStep={onStep} />
          <span className="sr-only">{`Step ${step.at} of ${step.of}`}</span>
        </span>
      ) : null}
      <Button
        asChild
        variant="ghost"
        size="icon-lg"
        className="relative -mr-1 ml-auto"
      >
        <Link href={close.href} aria-label={close.label} data-room-close="">
          <X className="size-5" />
        </Link>
      </Button>
    </header>
  );
}

/**
 * THE QUESTION, ALWAYS IN ONE PLACE: the same distance under the head on every screen; the centre takes
 * whatever is left above the foot, its answer centred in it (`safe`, so an answer taller than a small
 * phone's room scrolls from its top rather than being cut at both ends).
 */
export function RoomPage({
  question,
  questionId,
  questionHidden,
  sub,
  pageRef,
  children,
}: {
  question: ReactNode;
  questionId: string;
  /** Held for its moment (the beat's, while Create runs): its place kept, its words not yet true. */
  questionHidden?: boolean;
  sub?: ReactNode;
  pageRef?: Ref<HTMLElement>;
  children: ReactNode;
}) {
  return (
    <section
      ref={pageRef}
      data-room-page=""
      aria-labelledby={questionId}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div
        data-room-question=""
        className="shrink-0 px-6 pt-5 text-center md:mx-auto md:max-w-[760px] md:px-8 md:pt-8"
      >
        <h1
          id={questionId}
          tabIndex={-1}
          aria-hidden={questionHidden || undefined}
          data-room-heading=""
          data-held={questionHidden ? "" : undefined}
          className="cr-question font-heading text-page text-balance outline-none"
        >
          {question}
        </h1>
        {sub ? (
          <p className="mt-2 text-working text-muted-foreground">{sub}</p>
        ) : null}
      </div>
      <div
        data-room-centre=""
        className="flex min-h-0 flex-1 flex-col items-center justify-center-safe px-5 py-4 md:px-12 md:py-6"
      >
        {children}
      </div>
    </section>
  );
}

/** The foot's one button, at the thumb on a phone, centred at a desk. */
export function RoomFoot({ children }: { children?: ReactNode }) {
  return (
    <footer
      data-room-foot=""
      className="relative flex min-h-[4.75rem] shrink-0 items-center justify-center px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:px-8 md:pt-4 md:pb-9"
    >
      {children}
    </footer>
  );
}

/** The class every foot button wears: the whole thumb's width on a phone, a calm width at a desk. */
export const footButton = "w-full md:w-auto md:min-w-64";

/**
 * Where the room's moving parts land, outside React's own children: the leaving screen's picture and
 * her words in flight (`carry.ts`). React renders these empty and never touches what is put in them.
 */
export function RoomStage({
  ghostRef,
  flyerRef,
  className,
}: {
  ghostRef: Ref<HTMLDivElement>;
  flyerRef: Ref<HTMLDivElement>;
  className?: string;
}) {
  return (
    <>
      <div
        ref={ghostRef}
        aria-hidden
        data-room-ghosts=""
        className={cn("pointer-events-none absolute inset-0", className)}
      />
      <div ref={flyerRef} aria-hidden data-room-flyers="" />
    </>
  );
}

/**
 * THE ROOM'S OWN WAIT (`/dashboard/new`'s loading, through the one route skeleton): its ground and its
 * close, at once, so a press of New event lands in the dark room immediately and the screen arrives in
 * it. Without it the nearest wait is the dashboard's, a paper skeleton cut to the dark room a beat later.
 */
export function RoomWait() {
  return (
    <RoomGround screen="loading" busy>
      <RoomHead close={{ href: "/dashboard", label: "Close" }} />
    </RoomGround>
  );
}
