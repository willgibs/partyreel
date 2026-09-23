import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import { marketingImage } from "@/lib/constants/marketing-media";
import { QR_STYLE_KEYS } from "@/lib/constants/qr-presets";
import { cn } from "@/lib/utils";

/**
 * THE WALKTHROUGH'S PICTURE ANATOMY: the small pieces the twelve step pictures
 * are built OUT OF, never a box they are all poured INTO.
 *
 * Will killed the box (2026-09-19, `pictures=bespoke`): the six frames on this
 * page "are incredibly V1, and were never considered individually, just all
 * thrown up at once". The failure was one `FrameCard` wrapper worn by five of
 * six steps, so every moment of the loop looked like the same rounded rectangle
 * with different words in it. What replaces it is twelve pictures designed one
 * at a time ({host,guest}-pictures.tsx) sharing only what a real family shares:
 * one button shape, one chip, one tile, one phone body, one plane.
 *
 * ★ THE TWO SETS ARE TWO REGISTERS, and that is the toggle's real payoff. The
 * host's six are OBJECTS ON A DESK (the paper chapter is the host's desk: app
 * panels, a printed card, a browser album, a dialog). The guest's six are ONE
 * PHONE, six screens, each with a companion object beside it. Flipping the
 * toggle changes the medium, not only the words, and the answer to "what does a
 * guest see" is visible before a word is read.
 *
 * ★ EVERY STRING IN A PICTURE IS THE APP'S OWN, verbatim. A picture of the
 * product that invents its labels teaches a visitor a product that does not
 * exist; `mock-parity.test.ts` pins the load-bearing one ("Email me a code")
 * against email-sign-in.tsx, and the rest are quoted from the files each
 * picture names in its own comment.
 *
 * ★ NO HEADING FACE ANYWHERE IN HERE. A picture of a heading is still a
 * heading to the type-ladder scan, and the old step-frames.tsx needed a
 * standing exception for exactly one drawn event name. These pictures set drawn
 * type on the body face at the size the picture calls for, so the exception
 * goes and the ladder's allow-list gets shorter (type-ladder-policy.test.ts).
 */

/** The site's fixture event, one coherent fictional album across every page. */
export const EVENT_NAME = "Maya & Jay's Wedding";
export const EVENT_URL = "partyreel.com/a/maya-and-jay";

/**
 * THE PICTURE PLANE: the one surface a drawn app panel stands on. Not a
 * wrapper every picture wears (that was the bug) but the sheet a panel is
 * printed on when a picture needs one, at the app's own card radius and
 * hairline. Compose it, skin it, or leave it out.
 */
export function Panel({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      style={style}
      className={cn(
        "rounded-2xl border bg-card p-4 ring-1 ring-foreground/5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A resting primary button, the app's own 36px shape. Never a real control. */
export function MockPrimary({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** A resting outline button, the app's `size="sm"` shape. */
export function MockOutline({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * One selectable chip. `on` is the app's selected treatment (a ring at the
 * ink's own weight), never a fill: these are pictures of controls at rest.
 */
export function Chip({
  on = false,
  className,
  children,
}: {
  on?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-md border px-2 py-1 text-caption font-medium",
        on
          ? "text-foreground ring-1 ring-foreground/40"
          : "text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * A DRAWN CODE, deterministic so server and client agree on every module.
 *
 * Not a real one: a scannable code on a marketing page is a door, and the only
 * door on this site is the demo's (demo-door.tsx renders the real renderer).
 * This is a PICTURE of a code inside a picture of a product, so it is drawn,
 * and drawn at a believable module count: `modules` is 13 where a card is the
 * subject and 9 where four of them are style swatches. The four presets differ
 * by CORNER and DOT treatment, which is exactly what the real picker's four
 * thumbnails differ by, so the drawing varies the two things the control
 * varies and nothing else.
 *
 * ★ EVERY MODULE IS BLACK, AND NO PRESET USES A TOKEN. A code is ink on a
 * white plate because that is what a scanner needs, and the plates here are
 * literal `bg-white`. `bg-foreground` inverts on a dark ground, so the same
 * picture drawn inside the home's stepper (cinema) went white-on-white and
 * every code vanished; `bg-brand` on the bold preset's finders did it a second
 * time, one fix later, because --brand aliases --primary and flips with the
 * theme too. Both found on screen. So the four presets differ by SHAPE and
 * DENSITY, which survive any ground: square, heavier, rounded, dots.
 */
export function MiniQr({
  preset = "classic",
  modules = 13,
}: {
  preset?: (typeof QR_STYLE_KEYS)[number];
  modules?: number;
}) {
  return (
    <span
      aria-hidden
      className="grid w-full gap-px"
      style={{ gridTemplateColumns: `repeat(${modules}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: modules * modules }, (_, i) => {
        const x = i % modules;
        const y = Math.floor(i / modules);
        const finder =
          (x < 3 && y < 3) ||
          (x >= modules - 3 && y < 3) ||
          (x < 3 && y >= modules - 3);
        const on =
          finder ||
          (x * 31 + y * 67 + x * y * 7) % 5 < (preset === "bold" ? 3 : 2);
        return (
          <span
            key={i}
            className={cn(
              "aspect-square",
              preset === "dots"
                ? "rounded-full"
                : preset === "rounded"
                  ? "rounded-[2px]"
                  : "",
              on ? "bg-black" : "bg-transparent",
            )}
          />
        );
      })}
    </span>
  );
}

/** One photograph from the manifest, cropped square unless told otherwise. */
export function Tile({
  id,
  className,
  sizes = "120px",
  children,
}: {
  id: string;
  className?: string;
  sizes?: string;
  children?: ReactNode;
}) {
  const m = marketingImage(id);
  return (
    <span
      className={cn(
        "relative block aspect-square overflow-hidden rounded-tile",
        className,
      )}
    >
      <Image src={m.src} alt="" fill sizes={sizes} className="object-cover" />
      {children}
    </span>
  );
}

/**
 * THE GUEST'S PHONE. A body, not a bezel from the frame library: narrower and
 * taller than `PhoneFrame`'s 2.5rem card, with a real status bar, because the
 * guest pictures live or die on reading as a phone in a hand at a glance. The
 * screen clips; the body never does, so an overlapping companion object can
 * sit on it.
 *
 * ★ NO `data-lit` HERE, unlike every other framed screen on the site. The
 * bright edge is dark-grounds-only by construction (globals.css compiles it
 * through the `dark` variant, which excludes `.surface-paper *`), and this
 * phone only ever stands inside the walkthrough's PAPER chapter. The hook
 * would generate nothing, and an attribute that does nothing is a claim the
 * next reader has to disprove.
 */
export function Phone({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "w-full rounded-[2rem] border bg-card p-2 ring-1 ring-foreground/5",
        className,
      )}
    >
      {/* ★ THE SCREEN IS ALWAYS THE LIGHT GROUND, and a dark screen is drawn
          by the CONTENT, never by skinning this box: the status bar's ink is
          `foreground`, so a black screen would swallow the one row that makes
          the object read as a phone at a glance. */}
      <div className="relative overflow-hidden rounded-[1.6rem] bg-background">
        {/* The status bar: a time, a pill for the camera, two bars. Drawn
            small on purpose, so the eye reads "phone" and moves on. */}
        <div className="flex items-center justify-between px-4 pt-2.5 pb-1">
          <span className="text-[9px] font-semibold tabular-nums">9:41</span>
          <span className="h-3 w-10 rounded-full bg-foreground/85" />
          <span className="flex items-center gap-0.5">
            <span className="h-2 w-2.5 rounded-[1px] bg-foreground/45" />
            <span className="h-2.5 w-4 rounded-[2px] border border-foreground/45" />
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

/**
 * A guest picture's stage: the phone on the left, its companion object filling
 * the rest of the column and running UNDER it.
 *
 * ★ WHY NOT A CENTRED PHONE. Will, on the payoff's portrait video (2026-09-19):
 * "I haven't been liking using a centered mobile portrait video in these
 * sections. It leaves tons of blank space on either side of the reel on
 * desktop. If we're using a portrait, we should fill some of the space to one
 * or both sides." A portrait object in a wide column is the same problem
 * wherever it appears, so every guest picture answers it the same way: the
 * phone takes a little over half the width and the companion pays for the
 * rest. Below `sm` the companion goes and the phone takes the column, because
 * a two-object scene at 375 is two cramped objects.
 */
export function PhoneScene({
  companion,
  clear = false,
  children,
}: {
  /** What stands beside the phone at sm and up; dropped at a phone's own width. */
  companion: ReactNode;
  /**
   * `true` when the companion is a CARD or a list, whose words have to clear
   * the phone; `false` when it is a continuation (an album running off the
   * page, prints lying under it) that should genuinely pass behind. Getting
   * this backwards is the bug that hides a companion's first column, and it
   * only shows up at a real width.
   */
  clear?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative mx-auto flex w-full max-w-[16rem] items-center justify-center sm:max-w-none sm:justify-start">
      {/* At a phone's own width the companion is gone, so the phone stops
          being half a scene and becomes the whole picture: it centres and
          takes the column rather than hugging the left edge with dead space
          beside it. */}
      <div className="relative z-10 w-full shrink-0 sm:max-w-[14.5rem]">
        {children}
      </div>
      <div
        className={cn(
          "relative -ml-10 hidden min-w-0 flex-1 sm:block",
          clear && "pl-16",
        )}
      >
        {companion}
      </div>
    </div>
  );
}
