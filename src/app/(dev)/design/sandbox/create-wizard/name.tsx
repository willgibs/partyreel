"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * THE NAME'S CENTRE: ONE FIELD, AT THE SIZE IT WILL BE (first-event's
 * `asks=one`, his "bigger name edit field"): the name typed on a rule, never in
 * a box, the caret at its end. At a phone the keyboard holds the lower part of
 * the screen and the centre is the space between the question and the
 * keyboard, so the name stands there, on one line at a phone's width.
 *
 * ★ NOT ASKED (the carried call `name`): the name's centre holds no decision
 * this round. What it might show besides the name (the album's door, the
 * code's plate) is shown later in Create, where it is the step's own subject.
 *
 * `live` draws a real field (the flow's Try it): what she types is the name
 * the rest of Create carries.
 */
export function NameField({
  wide,
  name,
  live,
  onName,
}: {
  wide: boolean;
  name: string;
  live?: boolean;
  onName?: (name: string) => void;
}) {
  const type = wide ? "text-title" : "text-chapter";
  return (
    <div className={cn("w-full text-center", wide && "max-w-[980px]")}>
      {live ? (
        // Production's own field (`Input`, which keeps text typed before
        // hydration), drawn as the name: no box, no ring, the type at its size.
        <Input
          data-cw-hero
          value={name}
          onChange={(e) => onName?.(e.target.value)}
          placeholder="Name your event"
          aria-label="Name your event"
          maxLength={80}
          className={cn(
            "cw-name-input h-auto rounded-none border-0 bg-transparent px-0 py-0 text-center font-heading shadow-none focus-visible:ring-0 dark:bg-transparent",
            wide ? "!text-title" : "!text-chapter",
          )}
        />
      ) : (
        <p
          data-cw-hero
          data-cw-carry="name"
          className={cn(
            "mx-auto w-fit max-w-full truncate font-heading",
            type,
          )}
        >
          {name}
          <span className="cw-caret" aria-hidden />
        </p>
      )}
      <span
        aria-hidden
        className={cn(
          "mx-auto block h-0.5 rounded-full bg-foreground/80",
          wide ? "mt-5 w-[760px]" : "mt-4 w-full",
        )}
      />
    </div>
  );
}
