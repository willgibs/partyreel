"use client";

import { useState } from "react";
import {
  ArrowLeftRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Pin,
  Search,
  X,
} from "lucide-react";

import Link from "next/link";

import { ActDoor } from "@/components/app/dashboard/act-door";
import { Stage } from "@/components/app/dashboard/stage";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { itemFor } from "@/lib/dashboard/attention";
import type { HomeContext } from "@/lib/dashboard/home-event";
import type { HostedEvent, StageView } from "@/lib/dashboard/home-view";
import { stageActsOf, stageWordsOf } from "@/lib/dashboard/stage";
import { dateFace, phaseOfEvent, whenOf } from "@/lib/dashboard/when";
import { GLASS_MARK } from "@/lib/glass";
import { cn } from "@/lib/utils";

import type { PickWay } from "./model";

/**
 * THE STAGE, PRODUCTION'S OWN, AND THE HOST'S HAND ON IT (`pick`).
 *
 * The stage is `components/app/dashboard/stage.tsx` as it ships, keyed by its
 * event as the page keys it. What an option adds sits in the stage's top
 * corner, on the product's glass over a photograph (`GLASS_MARK`), and only
 * for a host with more than one event (at one, there is nothing to choose):
 *  - `kept`: Change, which opens her events (the stage's contenders first) and
 *    features the one she presses until she lifts it; featured, the corner says
 *    so and carries the way back to the calendar.
 *  - `step`: the rule's lead and its next two contenders, a press apart.
 * And where the quiet day's answer is that the stage rests (`lead=rest`), the
 * slot draws it as one line that carries the same control.
 */

const PILL = cn(
  "flex h-8 items-center gap-1.5 rounded-full px-3 text-xs leading-none font-medium whitespace-nowrap text-white outline-none focus-visible:ring-2 focus-visible:ring-white/60",
  GLASS_MARK,
);

/** An event's face in the picker: its cover, or its date as a tile wears it. */
function Face({ e }: { e: HostedEvent }) {
  const cover = e.stills[0];
  const face = e.date ? dateFace(e.date) : null;
  return (
    <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element -- a fixture still at a crop
        <img
          src={cover}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      ) : face ? (
        <span className="flex flex-col items-center leading-none">
          <span className="text-[9px] font-medium text-muted-foreground uppercase">
            {face.month}
          </span>
          <span className="text-xs font-semibold tabular-nums">{face.day}</span>
        </span>
      ) : (
        // No photograph and no date: the plain face the tile wears before either.
        <CalendarDays className="size-4 text-muted-foreground" aria-hidden />
      )}
    </span>
  );
}

function Picker({
  events,
  today,
  current,
  featured,
  open,
  onOpenChange,
  onFeature,
}: {
  /** Her events, the stage's contenders first. */
  events: readonly HostedEvent[];
  today: string;
  current: string;
  featured: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** An event to feature, or null to let the calendar choose again. */
  onFeature: (id: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const words = query.trim().toLowerCase();
  const shown = words
    ? events.filter((e) => e.name.toLowerCase().includes(words))
    : events;
  return (
    <Popover open={open} onOpenChange={onOpenChange} modal={false}>
      <div
        data-hd-pick={featured ? "featured" : "change"}
        className="flex items-center gap-1"
      >
        <PopoverTrigger asChild>
          <button type="button" className={PILL}>
            {featured ? (
              <Pin className="size-3.5" aria-hidden />
            ) : (
              <ArrowLeftRight className="size-3.5" aria-hidden />
            )}
            {featured ? "Featured" : "Change"}
          </button>
        </PopoverTrigger>
        {featured && (
          <button
            type="button"
            aria-label="Let the calendar choose"
            onClick={() => onFeature(null)}
            className={cn(PILL, "w-8 justify-center px-0")}
          >
            <X className="size-3.5" aria-hidden />
          </button>
        )}
      </div>
      <PopoverContent
        align="end"
        className="w-80 p-0"
        // A frame drawn with the list open must not take the page's focus from its neighbours.
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <p className="px-3 pt-3 pb-2 text-xs text-muted-foreground">
          Lead your dashboard with
        </p>
        {events.length > 8 && (
          <label className="relative mx-3 mb-2 flex items-center">
            <Search
              className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground"
              aria-hidden
            />
            <span className="sr-only">Search your events</span>
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${events.length} events`}
              className="h-8 rounded-full pl-8 text-xs md:text-xs"
            />
          </label>
        )}
        <ul className="max-h-80 overflow-y-auto px-1 pb-1">
          {shown.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                data-hd-pick-item={e.id}
                onClick={() => onFeature(e.id)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left outline-none hover:bg-muted focus-visible:bg-muted"
              >
                <Face e={e} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {e.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {whenOf(e.date, today)}
                  </span>
                </span>
                {e.id === current && (
                  <Check
                    className="size-4 shrink-0"
                    aria-label="On the stage"
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
        {featured && (
          <button
            type="button"
            onClick={() => onFeature(null)}
            className="w-full border-t border-border px-3 py-2.5 text-left text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground"
          >
            Let the calendar choose
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

function Stepper({
  at,
  count,
  onStep,
}: {
  at: number;
  count: number;
  onStep: (to: number) => void;
}) {
  return (
    <div data-hd-pick="step" className={cn(PILL, "gap-0 px-1")}>
      <button
        type="button"
        aria-label="The one before"
        onClick={() => onStep((at - 1 + count) % count)}
        className="flex size-6 items-center justify-center rounded-full outline-none hover:bg-white/15 focus-visible:bg-white/20"
      >
        <ChevronLeft className="size-4" aria-hidden />
      </button>
      <span className="px-1 tabular-nums">{`${at + 1} of ${count}`}</span>
      <button
        type="button"
        aria-label="The next one"
        onClick={() => onStep((at + 1) % count)}
        className="flex size-6 items-center justify-center rounded-full outline-none hover:bg-white/15 focus-visible:bg-white/20"
      >
        <ChevronRight className="size-4" aria-hidden />
      </button>
    </div>
  );
}

/**
 * THE STAGE AT REST (`lead=rest`): a quiet day's party of the moment as one
 * line on the stage's own dark ground, so the events lead the page. Its words
 * and its act are the stage's own (`stageWordsOf`, `stageActsOf`, production's
 * pure rules), its face the tile's: the cover, or the date before there is one.
 */
function RestLine({
  stage,
  ctx,
  control,
}: {
  stage: StageView;
  ctx: HomeContext;
  control: React.ReactNode;
}) {
  const event = stage.event;
  const phase = phaseOfEvent(event, ctx.today);
  const words = stageWordsOf(event, phase, ctx);
  const { primary } = stageActsOf(event, phase, itemFor(event, ctx));
  const cover = event.stills[0];
  const face = event.date ? dateFace(event.date) : null;
  return (
    <section
      data-stage="rest"
      aria-label={event.name}
      className="dark flex items-center gap-3 rounded-2xl bg-gallery p-2.5 pr-3 text-gallery-foreground ring-1 ring-gallery-border sm:gap-4 sm:pr-4"
    >
      <Link
        href={`/dashboard/${event.id}`}
        aria-label={`Open ${event.name}`}
        className="relative flex h-12 w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/8 outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL in production, a fixture crop here
          <img
            src={cover}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : face ? (
          <span className="flex flex-col items-center leading-none">
            <span className="text-[9px] font-medium text-gallery-muted uppercase">
              {face.month}
            </span>
            <span className="font-heading text-card-title text-white tabular-nums">
              {face.day}
            </span>
          </span>
        ) : (
          <CalendarDays className="size-4 text-gallery-muted" aria-hidden />
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <p
          data-stage-word={phase}
          className="truncate text-label text-gallery-muted uppercase"
        >
          {words.word}
        </p>
        <p className="truncate font-heading text-card-title text-white">
          {event.name}
        </p>
      </div>
      {control}
      <ActDoor
        eventId={event.id}
        eventName={event.name}
        share={stage.share}
        label={primary.label}
        to={primary.to}
        location="dashboard-stage"
        size="sm"
        variant="secondary"
      />
    </section>
  );
}

export function StageSlot({
  stage,
  ctx,
  resting,
  pick,
  events,
  featured,
  onFeature,
  pickOpen,
  onPickOpen,
  step,
  steps,
  onStep,
}: {
  stage: StageView;
  ctx: HomeContext;
  /** A quiet day's stage, folded to a line (`lead=rest`). */
  resting: boolean;
  pick: PickWay;
  /** Her events, the stage's contenders first: what Change lists. */
  events: readonly HostedEvent[];
  /** Whether the stage holds her pick rather than the rule's. */
  featured: boolean;
  onFeature: (id: string | null) => void;
  pickOpen: boolean;
  onPickOpen: (open: boolean) => void;
  step: number;
  steps: number;
  onStep: (to: number) => void;
}) {
  const hand = events.length > 1 && pick !== "none";
  const control = !hand ? null : pick === "kept" ? (
    <Picker
      events={events}
      today={ctx.today}
      current={stage.event.id}
      featured={featured}
      open={pickOpen}
      onOpenChange={onPickOpen}
      onFeature={(id) => {
        onFeature(id);
        onPickOpen(false);
      }}
    />
  ) : (
    <Stepper at={step} count={steps} onStep={onStep} />
  );
  // Her own pick is a stage of its own, never a line: she chose to see it.
  if (resting && !featured)
    return (
      <div data-hd-stage-slot="">
        <RestLine stage={stage} ctx={ctx} control={control} />
      </div>
    );
  return (
    <div className="relative" data-hd-stage-slot="">
      <Stage
        // A new party of the moment is a new stage, as the page keys it.
        key={stage.event.id}
        event={stage.event}
        ctx={ctx}
        guests={stage.guests}
        photos={stage.photos}
        share={stage.share}
        qrToken={stage.event.qrToken}
      />
      {control && <div className="absolute top-3 right-3 z-10">{control}</div>}
    </div>
  );
}
