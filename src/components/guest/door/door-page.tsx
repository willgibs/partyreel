import "../door.css";
import "./doorway.css";

import type { CSSProperties, ReactNode, Ref } from "react";

import { cn } from "@/lib/utils";

/**
 * THE DOOR'S PAGE, AROUND ITS DRAWING (`doorway.tsx`): where the doorway stands and how its words sit
 * under it, for every door screen. Server-safe (no hooks and no client-only import), so the shut door
 * and the broken link's page compose it on the server, and the album's stage on the client.
 */

/**
 * THE DOOR'S PAGE: the doorway, then everything said under it, in one centred column (the board's
 * page: a phone's column, a desk's a little wider). Every door screen stands in it, so a guest who
 * meets the door twice meets it in the same place.
 */
export function DoorColumn({
  doorway,
  children,
  className,
}: {
  doorway: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-door-column=""
      className={cn(
        "mx-auto flex w-full max-w-sm flex-col items-center text-center sm:max-w-md",
        className,
      )}
    >
      {doorway}
      {/* The words under the door, one box, so the walk through lets them go together (`stage-walk.ts`). */}
      <div
        data-door-words-box=""
        className="mt-10 flex w-full flex-col items-center"
      >
        {children}
      </div>
    </div>
  );
}

/**
 * THE DOOR'S WORDS: an optional eyebrow, the headline, an optional byline, and the lines under it,
 * centred under the doorway, in the door's text reveal (`door.css`'s `[data-door-line]`: each line
 * rises out of a blur in turn, wherever words arrive in place).
 *
 * The title and its lines are siblings in one box, so the message reads as one thing (the shut
 * door's pins read it that way). `data-door-heading` is the door's heading mark, as `DoorHeading`
 * carries it in the sheet.
 */
export function DoorWords({
  eyebrow,
  title,
  titleAs: Title = "p",
  titleRef,
  byline,
  lines = [],
  from = 0,
  className,
}: {
  /** The small line over the headline: its glyph, if any, then its word. */
  eyebrow?: ReactNode;
  title: ReactNode;
  /** The headline's element: a page's `h1` where the door is the page's own heading. */
  titleAs?: "h1" | "h2" | "p";
  /** The headline, for a stage that moves focus to its new words when they change. */
  titleRef?: Ref<HTMLElement>;
  /** What stands under the headline before its lines (the welcome's "Hosted by"). */
  byline?: ReactNode;
  lines?: readonly ReactNode[];
  /** The first line's place in the reveal, for words that follow others in. */
  from?: number;
  className?: string;
}) {
  let place = from;
  const next = () => ({ "--door-line-i": place++ }) as CSSProperties;
  return (
    <div
      data-door-heading=""
      data-door-words=""
      className={cn("flex w-full flex-col items-center", className)}
    >
      {eyebrow && (
        <p
          data-door-line
          style={next()}
          className="mb-1.5 flex items-center gap-1.5 text-label font-medium text-muted-foreground uppercase"
        >
          {eyebrow}
        </p>
      )}
      <Title
        ref={titleRef as Ref<HTMLHeadingElement & HTMLParagraphElement>}
        tabIndex={titleRef ? -1 : undefined}
        data-door-line
        style={next()}
        className="font-heading text-section text-balance outline-none"
      >
        {title}
      </Title>
      {byline && (
        <div data-door-line style={next()} className="mt-2">
          {byline}
        </div>
      )}
      {lines.map((line, i) => (
        <p
          // A door's lines are fixed for the door: their place is their identity.
          key={i}
          data-door-line
          style={next()}
          className={cn(
            i === 0 ? "mt-3" : "mt-1.5",
            "text-base leading-relaxed text-pretty text-muted-foreground",
          )}
        >
          {line}
        </p>
      ))}
    </div>
  );
}

/** The space between the door's words and what she can do there. */
export const DOOR_FOOT = "mt-8 flex w-full flex-col items-center gap-3";

/**
 * THE MAIN A DOOR PAGE STANDS IN (the shut door's page, the broken link's, and the stage): the door
 * at the same height on every one of them, held a little below the header rather than centred, so a
 * door whose words change while she watches (asked, then waiting, then let in) never moves under her.
 */
export const DOOR_MAIN =
  "flex flex-1 flex-col items-center px-5 pt-[clamp(1.25rem,9svh,5.5rem)] pb-16 sm:pt-[clamp(2rem,10svh,7rem)]";
