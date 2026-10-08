"use client";

import {
  createContext,
  useContext,
  type ComponentProps,
  type ReactNode,
} from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

/**
 * SETTINGS' RADIO CARDS, ONE CHOICE OF SEVERAL SAID AS ONE (crumbs-91, red-team 57b's NIT: every card was a Tab stop of its
 * own and the arrows did nothing). The door's gates and Customize's two answers are `RadioCard`, the album styles their own
 * pictured card over `RadioCardHit`, and each group is `RadioCards`: Radix's radio group, the house's one choice of several
 * (the roll's boxes, Create's styles, the code's looks), so a keyboard meets every group as it meets any radio group:
 *   - Tab reaches the chosen card, one stop for the group's radios (the first card where none is chosen), and what a card
 *     holds of its own (the door's (i), a consequence line, the develop time) keeps a stop of its own, in the page's order;
 *   - the arrows move between the cards and choose as they go, round from the last to the first, past a card that waits;
 *   - Space chooses the card in focus, and Enter does not (a radio's own keys, WAI-ARIA's).
 *
 * ★ A CARD CHOOSES ON ITS OWN PRESS (`onChoose`), NEVER THE GROUP'S `onValueChange`. An arrow chooses by pressing the card it
 * lands on (Radix clicks a card that takes focus while an arrow is down), so a tap, Space and an arrow are one path into
 * the page's own `choose`; and a press on the card already chosen is a choice too, which `onValueChange` never reports (it
 * lets a pending consequence go: the door's saved door picked back). So a choice that asks first only asks, however she
 * reached it: the group's value moves only when the page's does, and an arrow onto such a card leaves focus on it,
 * unchosen, its consequence line open beside it and announced, never focused (`consequence-line.tsx`).
 *
 * ★ THE CHOSEN CARD IS THE STOP, NEVER THE GROUP. Radix makes the group a stop of its own that hands focus on to the chosen
 * card, right only while the group holds nothing but radios. A card that holds a control (the door's (i)) puts a stop inside
 * the group before the chosen card: Shift+Tab from it landed on the group, which handed focus forward to the chosen card
 * again, a loop she could not back out of, and Tab skipped every (i) before the chosen card (both measured: the walks in
 * `radio-cards.test.tsx` and the door's tests). So once a card is chosen the group takes no focus and the chosen card's
 * radio is the one stop among the radios, every control met in the page's own order both ways. With none chosen (a mix
 * outside the album styles, whose cards hold nothing of their own), Radix's own stop stands, and hands focus to the first
 * card.
 *
 * ★ A CONTROL ON A CARD TAKES ITS OWN KEYS: it stands beside the card's radio, never inside it, and Radix moves the group
 * only on a key pressed on a radio itself, so the develop time's arrows are the field's, never the group's.
 */

/** The group's chosen value, which every card reads, so its look, its radio and its stop follow the one value. */
const ChosenValue = createContext<string | null>(null);

/** One group of radio cards: named, its chosen value the page's own (null where none is chosen). */
export function RadioCards({
  value,
  className,
  children,
  ...named
}: {
  /** The chosen card's value, or null where none is. */
  value: string | null;
  className?: string;
  children: ReactNode;
} & ({ "aria-label": string } | { "aria-labelledby": string })) {
  return (
    <ChosenValue.Provider value={value}>
      <RadioGroupPrimitive.Root
        {...named}
        value={value}
        loop
        // ★ THE CHOSEN CARD IS THE STOP (the file's head): with a card chosen the group is never one; with none, Radix's own.
        {...(value === null ? {} : { tabIndex: -1 })}
        className={className}
      >
        {children}
      </RadioGroupPrimitive.Root>
    </ChosenValue.Provider>
  );
}

/**
 * A CARD'S RADIO: the button over the whole card, so the whole card is the choice, its halo drawn inside the card's own edge
 * (`halo-inset`), named with what a reader hears for the card. The one stop of its group while it is chosen. While a save
 * is on its way (`disabled`) every card but the chosen one waits, its radio out of reach, and the arrows pass it.
 */
export function RadioCardHit({
  value,
  name,
  disabled = false,
  onChoose,
}: {
  value: string;
  /** What a reader hears for the card. */
  name: string;
  /** A save is on its way: the cards not chosen wait. */
  disabled?: boolean;
  onChoose: () => void;
}) {
  const chosen = useContext(ChosenValue);
  const on = chosen === value;
  return (
    <RadioGroupPrimitive.Item
      value={value}
      disabled={disabled && !on}
      onClick={onChoose}
      // ★ THE CHOSEN CARD IS THE STOP (the file's head): Radix's roving stop otherwise, where none is chosen.
      {...(chosen === null ? {} : { tabIndex: on ? 0 : -1 })}
      className="absolute inset-0 focus-halo rounded-xl outline-none halo-inset disabled:cursor-wait"
    >
      <span className="sr-only">{name}</span>
    </RadioGroupPrimitive.Item>
  );
}

/**
 * ONE RADIO CARD, the door's own idiom and Customize's: its radio, its name and one line inside, the whole card the choice.
 * What it holds of its own is a control beside the words (`aside`) and, under them, what the choice opens on its card
 * (`children`); each wears `relative z-10`, so it stands over the card's radio and takes its own press, its own stop and
 * its own keys.
 */
export function RadioCard({
  value,
  label,
  line,
  note,
  aside,
  disabled,
  onChoose,
  children,
  ...card
}: Omit<ComponentProps<"div">, "children" | "className"> & {
  value: string;
  /** The card's name: what it says, and what a reader hears for its radio. */
  label: string;
  line: string;
  /** One line more under the card's own, said only where it is true (the invite list's: who it would let in). */
  note?: ReactNode;
  /** A control of the card's own beside its words (the door's (i)). */
  aside?: ReactNode;
  /** A save is on its way (`RadioCardHit`). */
  disabled?: boolean;
  onChoose: () => void;
  /** What the choice opens on its card, under its words (a consequence line, the password, the develop time). */
  children?: ReactNode;
}) {
  const on = useContext(ChosenValue) === value;
  return (
    <div
      {...card}
      data-state={on ? "on" : "off"}
      // ★ A RADIO CARD IN THE HOUSE SET (identity r5): a flat tone that waits, the chosen one afloat, its lift kept tight
      // under it (`afloat-card`), since the boxes these cards stand in clip (the door's dormant step, Customize's card).
      className={cn(
        "relative rounded-xl px-3 py-2.5 transition-[background-color] duration-150 motion-reduce:transition-none",
        on ? "afloat afloat-card" : "bg-(--choice) hover:bg-(--choice-up)",
      )}
    >
      <div className="flex items-start gap-2.5">
        <RadioCardHit
          value={value}
          name={label}
          disabled={disabled}
          onChoose={onChoose}
        />
        <span
          aria-hidden
          // A radio waits as a ring of tone and fills with ink (identity r5).
          className={cn(
            "pointer-events-none relative mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full",
            on ? "bg-primary" : "inset-ring-2 inset-ring-foreground/45",
          )}
        >
          {on ? (
            <span className="size-1.5 rounded-full bg-primary-foreground" />
          ) : null}
        </span>
        <span className="pointer-events-none relative min-w-0 flex-1">
          <span className="block text-sm font-medium">{label}</span>
          <span className="block text-caption text-pretty text-muted-foreground">
            {line}
          </span>
          {note}
        </span>
        {aside}
      </div>
      {children}
    </div>
  );
}
