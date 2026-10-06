"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

import { ActDoor } from "@/components/app/dashboard/act-door";
import { LiveDot, Mark } from "@/components/app/dashboard/marks";
import { LampLight, Plate, Rail } from "@/components/app/dashboard/stage-lit";
import { useStageLive } from "@/components/app/dashboard/use-stage-live";
import { settingsPageHref } from "@/components/app/event-settings/settings-pages";
import { itemFor } from "@/lib/dashboard/attention";
import {
  type HomeContext,
  type HomeEvent,
  readyFactsOf,
} from "@/lib/dashboard/home-event";
import type { ShareFacts } from "@/lib/dashboard/home-view";
import type { StageLive } from "@/lib/dashboard/stage-action";
import {
  lampNear,
  lampOf,
  stageActsOf,
  stageDateLine,
  stageNumbersOf,
  stageRailOf,
  stageTicksOf,
  stageWordsOf,
  WALL_PHOTOS,
} from "@/lib/dashboard/stage";
import { phaseOfEvent } from "@/lib/dashboard/when";
import type { StagePhoto } from "@/lib/dashboard/stage";
import { formatCount } from "@/lib/format/count";
import { RangeText } from "@/lib/format/range-text";
import { cn } from "@/lib/utils";

/**
 * THE STAGE: THE PARTY OF THE MOMENT, DRAWN FROM ITS OWN PHOTOGRAPHS (host-dashboard r1,
 * `purpose=stage`, Will 2026-10-02: "This is by far my favorite"). The event `moment.ts` picks, on the
 * gallery's dark ground, its photographs its only colour (bible 6): before them, its code on its white
 * plate, the thing a host does next; on its day, the room filling (the live wall); after it, the album
 * at rest. Its words are a phase, a name, a date and the few numbers that move; its acts are the
 * event's own (`lib/dashboard/stage.ts`).
 *
 * ★ THE LIGHT COMES FROM THE PHOTOGRAPH, AND BEFORE ONE, FROM THE EVENT'S OWN LAMP. Behind the words a
 * blurred copy of the lead photograph spills its colour across the dark, so every party's stage is lit by
 * that party and no two read alike. An event with no photograph yet is lit by one of the house's five lamps,
 * its own (`stage-lit.tsx`, host-dashboard r3 `stage=lit`): the code on its plate and Settings' five steps
 * laid flat under the name, until the first photograph takes the light over.
 *
 * ★ ON ITS DAY, THE PHOTOGRAPHS LAND AS THEY ARRIVE (`arrivals=live`: "if we simple display the featured
 * event with that type of gallery preview to see what's happening, think that's a perfect direction").
 * The stage holds its event's facts and lays its numbers, its acts and its wall out of them through the
 * same pure rules the server used; the doorbell's answers (`useStageLive`) move those facts, so a guest
 * at the door or a queue that grows changes the act as it changes the number. The wall's tiles keep
 * the arrival fade (no `data-static`): the one place on the page whose photographs literally just
 * arrived, the place Just arrived used to be.
 *
 * ★ THREE SLOTS, FOR THE STAGE'S OWN WORDS (host-dashboard r4, `chooser=words`; `stage-lead.tsx` fills them): `eyebrow`
 * stands before the phase word in the first line, where the reason this event leads is the control that chooses what
 * leads; `className` is the band's own classes (the turn's entrance, its room at a phone); `plateCaption` is words
 * under the code in place of its opened line (a preview naming the event whose code it shows). The phase word has a
 * hook (`data-stage-phase`) so the reason can stand alone in the line while it is the control. With none of them the
 * stage is exactly what it was.
 */

function Ticks({
  ticks,
}: {
  ticks: NonNullable<ReturnType<typeof stageTicksOf>>["ticks"];
}) {
  return (
    <ul data-stage-ticks="" className="flex flex-wrap gap-x-5 gap-y-2">
      {ticks.map((t) => (
        <li
          key={t.id}
          data-done={t.done ? "" : undefined}
          className={cn(
            "flex items-center gap-2 text-sm",
            t.done ? "text-gallery-foreground" : "text-gallery-muted",
          )}
        >
          {t.done ? (
            <span className="flex size-4 items-center justify-center rounded-full bg-success">
              <Check
                className="size-2.5 text-success-foreground"
                strokeWidth={3.5}
                aria-hidden
              />
            </span>
          ) : (
            <span
              aria-hidden
              className="size-4 rounded-full border border-dashed border-gallery-muted"
            />
          )}
          <span className="sr-only">{t.done ? "Done: " : "To do: "}</span>
          {t.word}
        </li>
      ))}
    </ul>
  );
}

/** A photograph on the stage, filling its (relative, clipped) cell. */
function Still({ photo }: { photo: StagePhoto }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL, not optimizable
    <img
      src={photo.url}
      alt=""
      draggable={false}
      className="absolute inset-0 size-full object-cover"
    />
  );
}

/** The calm composition: the lead photograph, and at a desk two beside it. */
function Calm({ photos }: { photos: readonly StagePhoto[] }) {
  const [a, b, c] = photos;
  if (!a) return null;
  return (
    <div
      data-stage-calm={photos.length}
      className={cn(
        "grid size-full gap-1",
        b && c && "lg:grid-cols-[2fr_1fr] lg:grid-rows-2",
      )}
    >
      <div className="relative overflow-hidden lg:row-span-2">
        <Still photo={a} />
      </div>
      {b && c && (
        <>
          <div className="relative hidden overflow-hidden lg:block">
            <Still photo={b} />
          </div>
          <div className="relative hidden overflow-hidden lg:block">
            <Still photo={c} />
          </div>
        </>
      )}
    </div>
  );
}

/**
 * THE LIVE WALL: the newest photographs as they land, newest first, the newest four cells large; nine at
 * a desk, three in a hand. Keyed by photograph, so a new one fades in where it lands and the ones
 * already there never replay theirs. The newest is marked Just now only while photographs are landing
 * (an arrival in the last hour): the morning's last one, hours later, is not.
 */
function Wall({
  photos,
  fresh,
}: {
  photos: readonly StagePhoto[];
  fresh: boolean;
}) {
  const shown = photos.slice(0, WALL_PHOTOS);
  return (
    <ul
      data-stage-wall={shown.length}
      className="grid size-full grid-cols-3 grid-rows-2 gap-1 lg:grid-cols-4 lg:grid-rows-3"
    >
      {shown.map((p, i) => (
        <li
          key={p.id}
          data-media-tile
          className={cn(
            "relative overflow-hidden",
            i === 0 && "col-span-2 row-span-2",
            i >= 3 && "max-lg:hidden",
          )}
        >
          <Still photo={p} />
          {i === 0 && fresh && (
            <span className="absolute top-2.5 right-2.5">
              <Mark tone="live" on="photo">
                Just now
              </Mark>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function Stage({
  event: initial,
  ctx,
  guests,
  photos: initialPhotos,
  share,
  qrToken,
  eyebrow,
  className,
  plateCaption,
}: {
  event: HomeEvent;
  ctx: HomeContext;
  /** Who added to it (`getEventGuests`), or null where it was not read. */
  guests: number | null;
  /** Its newest photographs: the live wall's nine on its day, its card's stills on any other. */
  photos: StagePhoto[];
  share: ShareFacts;
  /** The album's doorbell channel, heard only on its day. */
  qrToken: string;
  /** Before the phase word, in the stage's first line. */
  eyebrow?: ReactNode;
  /** The band's own classes, after its own. */
  className?: string;
  /** Words under the plate in place of its opened line. */
  plateCaption?: ReactNode;
}) {
  // What the doorbell's answers have moved since the server drew the stage. A new drawing from the
  // server (a refresh behind the claims review, a return to the page) starts from its own facts again.
  const [live, setLive] = useState<StageLive | null>(null);
  const [drawn, setDrawn] = useState(initial);
  if (drawn !== initial) {
    setDrawn(initial);
    setLive(null);
  }
  const event: HomeEvent = live
    ? {
        ...initial,
        approved: live.approved,
        pending: live.pending,
        waiting: live.waiting,
        arrivals: { ...initial.arrivals, lastHour: live.lastHour },
      }
    : initial;
  const photos = live?.photos ?? initialPhotos;
  const phase = phaseOfEvent(event, ctx.today);

  useStageLive({
    eventId: event.id,
    qrToken,
    enabled: phase === "live",
    onLive: setLive,
  });

  const words = stageWordsOf(event, phase, ctx);
  const dateLine = stageDateLine(event, ctx.today);
  const item = itemFor(event, ctx);
  const numbers = stageNumbersOf(event, phase, guests);
  const facts = readyFactsOf(event, ctx);
  const { primary, secondary } = stageActsOf(event, phase, item);
  const lead = photos[0];
  // No photograph yet: the event's own lamp lights the stage, and its code stands on a plate (`stage-lit.tsx`).
  const plate = !lead;
  // Before its day the stage says what a guest still needs: a photographs' stage in readiness's ticks, a lit one in
  // Settings' five steps. On its day and after, with nothing readiness was asked of, the numbers say it.
  const rail = plate ? stageRailOf(facts) : null;
  const ticks = phase === "before" && !plate ? stageTicksOf(facts) : null;
  const wall = phase === "live" && photos.length >= WALL_PHOTOS;
  const lamp = lampOf(event.id);

  const door = (
    act: { label: string; to: Parameters<typeof ActDoor>[0]["to"] },
    variant: "default" | "secondary",
  ) => (
    <ActDoor
      eventId={event.id}
      eventName={event.name}
      share={share}
      label={act.label}
      to={act.to}
      location="dashboard-stage"
      size="lg"
      variant={variant}
      className="max-sm:flex-1"
    />
  );

  return (
    <section
      data-stage={phase}
      data-stage-lit={plate ? lamp : undefined}
      aria-label={event.name}
      className={cn(
        "dark relative isolate flex flex-col overflow-hidden rounded-2xl bg-gallery text-gallery-foreground ring-1 ring-gallery-border lg:grid lg:h-[clamp(420px,30vw,560px)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]",
        className,
      )}
    >
      {/* The light: the event's own lamp until its first photograph, then the lead photograph, blurred into the dark
          behind the words. */}
      {plate && (
        <LampLight
          lamp={lamp}
          near={lampNear(event, ctx.today)}
          eventId={event.id}
        />
      )}
      {lead && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute inset-0 lg:right-[45%]">
            {/* eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL, not optimizable */}
            <img
              src={lead.url}
              alt=""
              className="absolute inset-0 size-full scale-150 object-cover opacity-70 blur-3xl saturate-150"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-gallery/55 via-gallery/35 to-gallery/60" />
        </div>
      )}

      <div className="relative flex flex-col gap-6 p-5 sm:p-8 lg:justify-between lg:p-10">
        <div>
          <p
            data-stage-word={phase}
            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-label text-gallery-muted uppercase"
          >
            {eyebrow}
            {words.live && <LiveDot />}
            <span data-stage-phase="">{words.word}</span>
            {/* The party's pulse, beside the word that says it is on. */}
            {words.pulse !== null && (
              <span className="tracking-normal normal-case">
                {`· ${formatCount(words.pulse)} in the last hour`}
              </span>
            )}
          </p>
          <h2 className="mt-2 line-clamp-3 font-heading text-page text-balance text-white lg:mt-4 lg:text-section">
            {event.name}
          </h2>
          {dateLine ? (
            <p className="mt-1.5 text-sm text-gallery-muted">
              <RangeText text={dateLine} />
            </p>
          ) : (
            <Link
              href={settingsPageHref(event.id, "event")}
              className="mt-1.5 inline-block text-sm text-gallery-muted underline decoration-gallery-muted/40 underline-offset-4 outline-none hover:text-white focus-halo"
            >
              Add the date
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-5 lg:gap-7">
          {rail ? (
            <Rail rail={rail} />
          ) : ticks ? (
            <Ticks ticks={ticks.ticks} />
          ) : numbers.length > 0 ? (
            <dl data-stage-numbers="" className="flex gap-6 lg:gap-10">
              {numbers.map((n) => (
                // The term before its value, as a list reads it; the number drawn on top.
                <div key={n.key} className="flex flex-col-reverse">
                  <dt className="mt-0.5 text-xs text-gallery-muted">
                    {n.label}
                  </dt>
                  <dd
                    className={cn(
                      "font-heading text-subsection tabular-nums lg:text-page",
                      n.tone === "waiting" ? "text-warning" : "text-white",
                    )}
                  >
                    {formatCount(n.value)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
          <div
            data-stage-acts={item?.kind ?? "none"}
            className="flex flex-wrap items-center gap-2"
          >
            {door(primary, "default")}
            {secondary && door(secondary, "secondary")}
            {ticks?.ready && !item && (
              <span className="ml-1 flex items-center gap-1.5 text-sm text-gallery-muted">
                <Check className="size-3.5 text-success" aria-hidden />
                Ready for guests
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "relative order-first min-h-0 lg:order-none",
          plate
            ? "flex h-72 items-center justify-center lg:h-auto"
            : "aspect-[4/3] lg:aspect-auto",
        )}
      >
        {plate ? (
          <Plate
            eventId={event.id}
            name={event.name}
            share={share}
            opened={event.ready?.opened ?? null}
            lamp={lamp}
            caption={plateCaption}
          />
        ) : (
          <Link
            href={`/dashboard/${event.id}`}
            aria-label={`Open ${event.name}`}
            className="absolute inset-0 outline-none focus-halo halo-inset"
          >
            {wall ? (
              <Wall photos={photos} fresh={event.arrivals.lastHour > 0} />
            ) : (
              <Calm photos={photos} />
            )}
          </Link>
        )}
        {/* The photographs melt into the dark the words stand on. */}
        {!plate && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 hidden w-16 bg-gradient-to-r from-gallery/90 to-transparent lg:block"
          />
        )}
      </div>
    </section>
  );
}
