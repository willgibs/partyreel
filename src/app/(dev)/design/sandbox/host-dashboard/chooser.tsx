"use client";

import { CalendarDays } from "lucide-react";

import type { HomeContext } from "@/lib/dashboard/home-event";
import type { HostedEvent, StageView } from "@/lib/dashboard/home-view";
import { cn } from "@/lib/utils";

import { type Lead, lampLight, lampOf, nextLamp, type RuleId } from "./model";

/**
 * WHAT EVERY DIRECTION OF THE CHOOSER TAKES, AND THE PIECES THEY SHARE
 * (`chooser`, round four: Will picked the corner in round three and asked for
 * "another exploration of the design of this UI").
 *
 * ★ A DIRECTION DRAWS THE STAGE WITH ITS CONTROL, WHOLE. Each one is a
 * component of `LeadProps` that draws the stage through `StageView` (its
 * slots: `eyebrow`, `overlay`, `className`) and its own control, so where the
 * control lives (on the glass, in the words, around the band) and how the
 * stage moves when the rule changes are the direction's own, and the stage
 * under every option is the same stage.
 *
 * ★ THE RULES ARE THE SAME FOUR SENTENCES IN EVERY DIRECTION (`RULES`, his r2
 * note: "these could be more like sort options, such as: newest, last opened,
 * upcoming"), each with the event it would lead with today and the fact that
 * picked it (`leads`: "Nia & Alex's Wedding · made yesterday", "· nothing
 * dated ahead", "· opened last"), never a list of her events. A party on its
 * own day always leads, so the control only stands when there is something to
 * choose (`hand`).
 */

export type Picks = Record<RuleId, HostedEvent | null>;
export type Leads = Record<RuleId, Lead | null>;

export type LeadProps = {
  /** The event on the stage now, as the page composed it around the rule's lead. */
  stage: StageView;
  ctx: HomeContext;
  /** The rule she keeps. */
  rule: RuleId;
  /** Choosing a rule: the stage follows at once, and her account keeps it. */
  onRule: (r: RuleId) => void;
  /** What each rule would lead with today. */
  picks: Picks;
  /**
   * The same, with the fact each rule read to pick it (`leadWhyOf`), so every
   * direction says the same true reason: `leadLine` and `factOf` word it.
   */
  leads: Leads;
  /** More than one event and no party on its own day: a rule has something to choose. */
  hand: boolean;
  /** The control drawn in use as the frame opens (what "in use" draws is the direction's). */
  open: boolean;
  onOpen: (open: boolean) => void;
  /** A laptop's frame (1440) rather than a phone's (375). */
  wide: boolean;
  /** The album count's word after its day (`details`, H6). */
  countWord?: string;
};

/**
 * AN EVENT'S FACE, SMALL: its cover where it has photographs, else its own
 * lamp's light on the gallery's dark (the light its empty stage stands in),
 * so a rule's line previews the stage it would draw.
 */
export function Face({
  e,
  className,
}: {
  e: HostedEvent;
  className?: string;
}) {
  const cover = e.stills[0];
  const h = lampOf(e.id);
  return (
    <span
      aria-hidden
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gallery",
        className,
      )}
    >
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element -- a fixture still at a crop
        <img
          src={cover}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <>
          <span
            className="absolute inset-0"
            style={{
              background: `radial-gradient(70% 70% at 65% 45%, ${lampLight(h, 70)}, transparent 75%), radial-gradient(60% 60% at 95% 105%, ${lampLight(nextLamp(h), 45)}, transparent 70%)`,
            }}
          />
          <CalendarDays className="relative size-3.5 text-white/80" />
        </>
      )}
    </span>
  );
}
