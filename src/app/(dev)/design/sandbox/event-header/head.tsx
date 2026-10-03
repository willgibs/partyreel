"use client";

import type { CSSProperties, ReactNode } from "react";
import { Copy, Eye, Images, Users } from "lucide-react";

import { EventCodeDoor } from "@/components/app/share/event-code-door";
import { EventLinkRow } from "@/components/app/share/event-link-row";
import {
  EventHead,
  HeadStills,
} from "@/components/guest/event-experience-head";
import { PageHeading } from "@/components/shared/page-heading";
import { Badge } from "@/components/ui/badge";
import { GlyphCount } from "@/components/ui/glyph-count";
import { formatCount, formatMediaCount } from "@/lib/format/count";
import { cn, formatEventDate } from "@/lib/utils";

import { COVER, EVENT, type HostFacts } from "./fixtures";
import { NightDial, NightStrip } from "./night";
import type { ScreenId } from "./scene";

/**
 * MAYA'S COVER, AND THE FOUR WAYS IT CARRIES HER FACTS.
 *
 * The cover is production's own frame and ground (`EventHead side="hub"`,
 * the photographs dissolving in `HeadStills`' keyframes over the house
 * light), bled to the window's edges and reaching up to the app's bar as the
 * hub draws it (`event-hub-head.tsx`'s `HubCover`). What a `facts` option
 * redraws is only what stands at its foot beside the name:
 *
 *  - `today`, HubCover's words as built: the date, the album's, guests' and
 *    views' glyph counts (`GlyphCount`) and the live mark (`Badge live`) in a
 *    line under the name, the link row (`EventLinkRow`) under that;
 *  - `dial`, the night as a clock face beside the code (`night.tsx`);
 *  - `strip`, the night along the cover's foot;
 *  - `name`, the date and the live mark over the name and nothing else.
 *
 * ★ A FACT THAT LEAVES THE LINE GOES WHERE IT IS COUNTED (the carried call
 * `fact-homes`): guests onto the Guests door, the album's count onto its own
 * label (production's "Album 214"), the date over the name, and the link
 * under the code as its address, copied on a press. Nothing is said twice.
 *
 * ★ THE CODE IS PRODUCTION'S (`EventCodeDoor`): the live code on its white
 * mat, its corner mark the door (2 at it tonight), under the share provider
 * its press reads.
 *
 * ★ A HEAD THAT REACHES THE BAR TAKES THE MAIN'S 32px BACK INLINE, never with
 * a `-mt-8`: the hub's root is production's `space-y-6`, whose margin rule sits
 * in production's utilities layer and beats any lab utility on the property.
 */

export type FactsId = "today" | "dial" | "strip" | "name";

const TO_THE_BAR: CSSProperties = { marginTop: -32 };

/** The event's name, the page's h1, on the cover's step (production's classes). */
function Name({ desk }: { desk: boolean }) {
  return (
    <PageHeading
      className={cn(
        "text-balance text-white",
        desk ? "text-chapter" : "text-section",
      )}
    >
      {EVENT.name}
    </PageHeading>
  );
}

/** The one quiet line over the name: the date, and the live mark where it is the head's to say. */
function Eyebrow({
  f,
  live = false,
}: {
  f: HostFacts;
  /** The live mark rides the eyebrow (the name alone); the night's own instruments light it instead. */
  live?: boolean;
}) {
  const before = f.photos === 0;
  return (
    <p className="mb-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-white/80">
      {live && !before ? <Badge variant="live">Live</Badge> : null}
      <span>{formatEventDate(EVENT.date)}</span>
      {before ? (
        <span className="text-white/60">{`in ${f.daysToGo} days`}</span>
      ) : null}
    </p>
  );
}

/** HubCover's facts line as built: the date, three glyph counts, the live mark. */
function TodayLine({ f }: { f: HostFacts }) {
  return (
    <>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/85">
        <span>{formatEventDate(EVENT.date)}</span>
        <GlyphCount
          icon={<Images />}
          count={f.photos}
          label={formatMediaCount(f.photos)}
        />
        <GlyphCount
          icon={<Users />}
          count={f.guests}
          label={f.guests === 1 ? "1 guest" : `${formatCount(f.guests)} guests`}
        />
        <GlyphCount
          icon={<Eye />}
          count={f.views}
          label={f.views === 1 ? "1 view" : `${formatCount(f.views)} views`}
        />
        {f.photos > 0 ? <Badge variant="live">Live</Badge> : null}
      </div>
      <EventLinkRow
        prettyUrl={EVENT.prettyUrl}
        permanentUrl={EVENT.joinUrl}
        className="mt-2"
      />
    </>
  );
}

/** Production's live code with its corner mark (the door: 2 waiting tonight). */
function Code({ f }: { f: HostFacts }) {
  return (
    <EventCodeDoor
      eventName={EVENT.name}
      joinUrl={EVENT.joinUrl}
      qrStyle={EVENT.qrStyle}
      door={f.door}
      acceptingUploads={f.ready.acceptingUploads}
      waiting={f.waiting}
    />
  );
}

/**
 * THE CODE AND ITS ADDRESS: the link stands under the code it encodes, the
 * readable form shown and the permanent one copied (production's link row's
 * rule), so the line under the name has nothing left to carry.
 */
function CodeWithAddress({ f, desk }: { f: HostFacts; desk: boolean }) {
  return (
    <span className="flex shrink-0 flex-col items-end gap-1.5">
      <Code f={f} />
      <span
        data-eh-address=""
        className="flex items-center gap-1 text-xs text-white/70"
        title="Copy the link to this event"
      >
        {desk ? "partyreel.com/e/maya-and-jay" : "maya-and-jay"}
        <Copy className="size-3" aria-hidden />
      </span>
    </span>
  );
}

export function HubHead({
  facts,
  f,
  screen,
  doorsOnCover,
}: {
  facts: FactsId;
  f: HostFacts;
  screen: ScreenId;
  /** The doors, where they stand on the photograph in glass (`doors=glass`). */
  doorsOnCover?: ReactNode;
}) {
  const desk = screen === "1440";
  const live = f.photos > 0;
  const date = formatEventDate(EVENT.date);

  const right =
    facts === "today" ? (
      <Code f={f} />
    ) : facts === "dial" ? (
      desk ? (
        <span className="flex shrink-0 items-start gap-5">
          <NightDial f={f} size={128} className="mb-[1.375rem]" />
          <CodeWithAddress f={f} desk />
        </span>
      ) : (
        <span className="flex shrink-0 flex-col items-center gap-3">
          <NightDial f={f} size={92} />
          <CodeWithAddress f={f} desk={false} />
        </span>
      )
    ) : (
      <CodeWithAddress f={f} desk={desk} />
    );

  const left = (
    <>
      {facts === "today" ? null : <Eyebrow f={f} live={facts === "name"} />}
      <Name desk={desk} />
      {facts === "today" ? <TodayLine f={f} /> : null}
      {doorsOnCover && desk ? <div className="mt-5">{doorsOnCover}</div> : null}
    </>
  );

  return (
    <EventHead
      side="hub"
      data-eh-head=""
      style={TO_THE_BAR}
      className="-mx-3 sm:-mx-5"
      ground={live ? <HeadStills stills={COVER} /> : null}
    >
      <div
        className={cn(
          "flex flex-col",
          desk ? "gap-5 px-5 pb-7" : "gap-3.5 px-3 pb-4",
        )}
      >
        <div className={cn("flex items-end", desk ? "gap-8" : "gap-4")}>
          <div className="min-w-0 flex-1">{left}</div>
          {right}
        </div>
        {doorsOnCover && !desk ? doorsOnCover : null}
        {facts === "strip" ? (
          <NightStrip f={f} narrow={!desk} date={date} />
        ) : null}
      </div>
    </EventHead>
  );
}
