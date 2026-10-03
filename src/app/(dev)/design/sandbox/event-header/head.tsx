"use client";

import type { CSSProperties, ReactNode } from "react";
import { Copy } from "lucide-react";

import { EventCodeDoor } from "@/components/app/share/event-code-door";
import {
  EventHead,
  HeadStills,
} from "@/components/guest/event-experience-head";
import { PageHeading } from "@/components/shared/page-heading";
import { cn } from "@/lib/utils";

import { SEAM_RISE, type DoorsId } from "./doors";
import { Facts, type FactsId } from "./facts";
import { type Case, EVENT, whenOf } from "./fixtures";
import type { ScreenId } from "./scene";

/**
 * HER COVER: production's own frame and ground (`EventHead side="hub"`, the
 * photographs dissolving in `HeadStills`' keyframes over the house light),
 * bled to the window's edges and reaching up to the app's bar as the hub
 * draws it (`event-hub-head.tsx`'s `HubCover`). What the two decisions redraw
 * stands at its foot: the facts under the name (`facts.tsx`), and where the
 * doors are glass, their capsule; where they are cards over the seam, the
 * cover fades into the page under them.
 *
 * ★ THE WHEN IS ONE QUIET LINE OVER THE NAME, in every option: a day
 * ("September 12, 2026"), a range ("October 2–4, 2026", which day of it
 * while it is on), the days still to wait the week before, and nothing at all
 * where no date is set. No option draws a date on an axis.
 *
 * ★ THE LINK STANDS UNDER THE CODE IT ENCODES, as round two moved it: the
 * readable form shown and the permanent one copied (production's link row's
 * rule), so the cover's foot is the fact's alone.
 *
 * ★ A HEAD THAT REACHES THE BAR TAKES THE MAIN'S 32px BACK INLINE, never with
 * a `-mt-8`: the hub's root is production's `space-y-6`, whose margin rule sits
 * in production's utilities layer and beats any lab utility on the property.
 */

const TO_THE_BAR: CSSProperties = { marginTop: -32 };

/** The event's name, the page's h1, on the cover's step (production's classes). */
function Name({ name, desk }: { name: string; desk: boolean }) {
  return (
    <PageHeading
      className={cn(
        "text-balance text-white",
        desk ? "text-chapter" : "text-section",
      )}
    >
      {name}
    </PageHeading>
  );
}

/** The one quiet line over the name: when, and where it stands in its days. */
function When({ c, desk }: { c: Case; desk: boolean }) {
  const when = whenOf(c, !desk);
  if (!when) return null;
  const note =
    c.photos === 0 && c.daysToGo > 0
      ? `in ${c.daysToGo} days`
      : c.end && c.day
        ? `day ${c.day}`
        : null;
  return (
    <p className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-white/80">
      <span>{when}</span>
      {note ? (
        // The note and its point wrap as one, so a narrow line never ends on a point.
        <span className="flex items-center gap-2 whitespace-nowrap text-white/65">
          <span aria-hidden className="text-white/45">
            ·
          </span>
          {note}
        </span>
      ) : null}
    </p>
  );
}

/**
 * THE CODE AND ITS ADDRESS: production's live code on its white mat, its
 * corner mark the door (2 at it tonight), and the link it encodes under it.
 */
function CodeWithAddress({ c, desk }: { c: Case; desk: boolean }) {
  return (
    <span className="flex shrink-0 flex-col items-end gap-1.5">
      <EventCodeDoor
        eventName={c.name}
        joinUrl={EVENT.joinUrl}
        qrStyle={EVENT.qrStyle}
        door={c.door}
        acceptingUploads={c.ready.acceptingUploads}
        waiting={c.waiting}
      />
      <span
        data-eh-address=""
        className="flex items-center gap-1 text-xs text-white/70"
        title="Copy the link to this event"
      >
        {desk ? `partyreel.com/e/${c.slug}` : c.slug}
        <Copy className="size-3" aria-hidden />
      </span>
    </span>
  );
}

/** At a desk a fact that is a base line spans the cover's foot; one that is a line of words stands under the name. */
const BASE: Record<FactsId, boolean> = {
  strip: true,
  colours: true,
  faces: false,
  latest: false,
};

export function HubHead({
  facts,
  doors,
  c,
  screen,
  doorsOnCover,
}: {
  facts: FactsId;
  doors: DoorsId;
  c: Case;
  screen: ScreenId;
  /** The doors, where they stand on the photograph in glass (`doors=glass`). */
  doorsOnCover?: ReactNode;
}) {
  const desk = screen === "1440";
  const seam = doors === "cards";
  // In a hand the name's column is the code's neighbour, so every fact takes the cover's whole width.
  const base = BASE[facts] || !desk;
  const fact = <Facts facts={facts} c={c} narrow={!desk} />;
  // Over the seam, the words clear the cards' rise and stand on the photograph above it.
  const pad = seam ? SEAM_RISE[screen] + (desk ? 22 : 16) : desk ? 28 : 16;
  return (
    <EventHead
      side="hub"
      data-eh-head=""
      style={TO_THE_BAR}
      className="-mx-3 sm:-mx-5"
      ground={
        <>
          {c.photos > 0 ? <HeadStills stills={c.stills} /> : null}
          {seam ? (
            <div
              aria-hidden
              className="eh-seam-fade absolute inset-x-0 bottom-0"
              style={{ height: SEAM_RISE[screen] + (desk ? 56 : 40) }}
            />
          ) : null}
        </>
      }
    >
      <div
        className={cn("flex flex-col", desk ? "gap-5 px-5" : "gap-3.5 px-3")}
        style={{ paddingBottom: pad }}
      >
        <div className={cn("flex items-end", desk ? "gap-8" : "gap-4")}>
          <div className="min-w-0 flex-1">
            <When c={c} desk={desk} />
            <Name name={c.name} desk={desk} />
            {base ? null : <div className="mt-3.5">{fact}</div>}
          </div>
          <CodeWithAddress c={c} desk={desk} />
        </div>
        {doorsOnCover}
        {base ? fact : null}
      </div>
    </EventHead>
  );
}
