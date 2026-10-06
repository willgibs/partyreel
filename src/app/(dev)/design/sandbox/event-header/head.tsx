"use client";

import type { CSSProperties, RefObject } from "react";
import { Copy } from "lucide-react";

import { EventCodeDoor } from "@/components/app/share/event-code-door";
import {
  EventHead,
  HeadStills,
} from "@/components/guest/event-experience-head";
import { PageHeading } from "@/components/shared/page-heading";
import { cn } from "@/lib/utils";

import type { DoorDraw, DoorOption } from "./door-kit";
import { FactsStrip } from "./facts";
import { EVENT, whenOf } from "./fixtures";
import type { Case } from "./fixtures";
import { isPhone } from "./scene";
import { CoverScrim } from "./seam";

/**
 * HER COVER: production's own frame and ground (`EventHead side="hub"`, the
 * photographs dissolving in `HeadStills`' keyframes over the house light),
 * bled to the window's edges and reaching up to the app's bar as the hub
 * draws it (`event-hub-head.tsx`'s `HubCover`). Its foot is the settled strip
 * (`facts.tsx`) and whatever the door option draws on the photograph
 * (`DoorOption.CoverFoot`); where the cards stand on its foot, the cover's
 * words clear them (`DoorOption.seam`), and its own scrim lifts under them so
 * the photograph's edge shows where the Seam is born (`seam.tsx`).
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

export function HubHead({
  door,
  d,
  mark,
}: {
  /** The door option the hub is drawn in. */
  door: DoorOption;
  d: DoorDraw;
  /** What the live frame reads its stuck state off, where the door marks the cover. */
  mark: RefObject<HTMLDivElement | null>;
}) {
  const { c, screen } = d;
  // The cover's own steps change at `sm` (production's `h-[20.5rem] sm:h-[25rem]`): a tablet takes a desk's.
  const desk = !isPhone(screen);
  const seam = door.seam[screen];

  const fact = <FactsStrip c={c} narrow={!desk} />;
  // Where the doors rise into the cover, its words clear them and stand on the photograph above.
  const pad = seam.rise > 0 ? seam.rise + (desk ? 22 : 16) : desk ? 28 : 16;
  const Foot = door.CoverFoot;
  return (
    <EventHead
      side="hub"
      data-eh-head=""
      style={TO_THE_BAR}
      className="-mx-3 sm:-mx-5"
      ground={
        <>
          {c.photos > 0 ? <HeadStills stills={c.stills} /> : null}
          {c.photos > 0 ? <CoverScrim screen={screen} /> : null}
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
          </div>
          <CodeWithAddress c={c} desk={desk} />
        </div>
        <Foot {...d} fact={fact} mark={mark} />
      </div>
    </EventHead>
  );
}
