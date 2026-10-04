"use client";

import { type ReactNode, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

import { ActDoor } from "@/components/app/dashboard/act-door";
import { settingsPageHref } from "@/components/app/event-settings/settings-pages";
import { CodeCard, readableLink } from "@/components/app/share/code-card";
import { StyledQr } from "@/components/app/styled-qr";
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import { itemFor } from "@/lib/dashboard/attention";
import { type HomeContext, readyFactsOf } from "@/lib/dashboard/home-event";
import type { HostedEvent, ShareFacts } from "@/lib/dashboard/home-view";
import {
  stageActsOf,
  stageDateLine,
  stageWordsOf,
} from "@/lib/dashboard/stage";
import { daysFrom, phaseOfEvent, WEEK_DAYS } from "@/lib/dashboard/when";
import {
  readiness,
  readyHead,
  settingsReadiness,
  settingsSteps,
} from "@/lib/events/readiness";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import { lampLight, lampOf, nextLamp, rangeDays, rangeLine } from "./model";

/**
 * THE STAGE OF AN EVENT WITH NO PHOTOGRAPHS YET, LIT BY ITS OWN LAMP
 * (`stage=lit`, Will 2026-10-04; `dashboard-wiring` builds it in production
 * now, so it is drawn here as settled): the code on its plate in the event's
 * own light, Settings' five steps laid flat under the name, Create's last
 * screen carried to the dashboard.
 *
 * ★ IT SAYS PRODUCTION'S FACTS: its words, its date (a range's as `event-dates`
 * says it), readiness's steps (`settingsSteps`, the hub's checklist's own), its
 * one item and acts (`stageActsOf`), its code (the code card, `CodeCard`,
 * opened by the plate).
 *
 * ★ THE COLOUR IS LIGHT, NEVER PAINT (bible 6): one of the house's five lamps,
 * the event's own (`lampOf`), only ever as light in a gradient; the interface
 * stays the gallery's dark, and the photographs take the light over the day
 * the first one lands.
 *
 * ★ ITS SLOTS ARE THE CHOOSER'S (round four): `eyebrow` stands before the
 * phase word in the stage's first line, `overlay` is a layer over the whole
 * band, each drawn by the direction that needs it (`stage-view.tsx`).
 */

const BOX =
  "dark relative isolate flex flex-col overflow-hidden rounded-2xl bg-gallery text-gallery-foreground ring-1 ring-gallery-border";
const SPLIT =
  "lg:grid lg:h-[clamp(420px,30vw,560px)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]";

const lamp = lampLight;

/** What the stage reads: production's own words, steps and acts for the event. */
function useFacts(
  event: HostedEvent,
  ctx: HomeContext,
  end: string | undefined,
) {
  const phase = phaseOfEvent(event, ctx.today);
  const words = stageWordsOf(event, phase, ctx);
  const d = event.date ? daysFrom(ctx.today, event.date) : null;
  const word =
    event.date && end && d !== null && d > 1 && d < WEEK_DAYS
      ? rangeDays(event.date, end)
      : words.word;
  const dateLine =
    event.date && end
      ? rangeLine(event.date, end)
      : stageDateLine(event, ctx.today);
  const facts = readyFactsOf(event, ctx);
  const steps = facts ? settingsSteps(settingsReadiness(facts)) : [];
  const head = facts ? readyHead(readiness(facts)) : null;
  const item = itemFor(event, ctx);
  const acts = stageActsOf(event, phase, item);
  return {
    phase,
    word,
    dateLine,
    steps,
    head,
    acts,
    item,
    days: d,
    opened: event.ready?.opened ?? null,
    hue: lampOf(event.id),
  };
}

type Facts = ReturnType<typeof useFacts>;

/* ── its pieces ───────────────────────────────────────────────────────── */

function Words({
  event,
  facts,
  eyebrow,
}: {
  event: HostedEvent;
  facts: Facts;
  eyebrow?: ReactNode;
}) {
  return (
    <div>
      <p
        data-stage-word={facts.phase}
        className="flex flex-wrap items-center gap-x-2 gap-y-1 text-label text-gallery-muted uppercase"
      >
        {eyebrow}
        <span data-stage-phase="">{facts.word}</span>
      </p>
      <h2 className="mt-2 line-clamp-3 font-heading text-page text-balance text-white lg:mt-4 lg:text-section">
        {event.name}
      </h2>
      {facts.dateLine ? (
        <p className="mt-1.5 text-sm text-gallery-muted">{facts.dateLine}</p>
      ) : (
        <Link
          href={settingsPageHref(event.id, "event")}
          className="mt-1.5 inline-block text-sm text-gallery-muted underline decoration-gallery-muted/40 underline-offset-4 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white/50"
        >
          Add the date
        </Link>
      )}
    </div>
  );
}

function Acts({
  event,
  share,
  facts,
}: {
  event: HostedEvent;
  share: ShareFacts;
  facts: Facts;
}) {
  const { primary, secondary } = facts.acts;
  const door = (
    act: typeof primary,
    variant: "default" | "secondary",
  ): ReactNode => (
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
    <div
      data-stage-acts={facts.item?.kind ?? "none"}
      className="flex flex-wrap items-center gap-2"
    >
      {door(primary, "default")}
      {secondary && door(secondary, "secondary")}
    </div>
  );
}

/** Whether the code has been opened: readiness's own fact, said under the plate. */
function OpenedLine({ opened }: { opened: number | null }) {
  if (opened === null) return null;
  return (
    <p className="relative text-xs text-gallery-muted">
      {opened > 0
        ? `Opened ${formatCount(opened)} ${opened === 1 ? "time" : "times"}`
        : "Not opened yet: scan it once from your phone"}
    </p>
  );
}

/** The plate a guest points a phone at: the event's own code, its card one press away. */
function Plate({
  event,
  share,
  size,
}: {
  event: HostedEvent;
  share: ShareFacts;
  /** The code's side, in px. */
  size: number;
}) {
  const router = useRouter();
  const look = useMemo(() => resolveQrPreset(share.qrStyle), [share.qrStyle]);
  return (
    <CodeCard
      who="host"
      eventName={event.name}
      joinUrl={share.joinUrl}
      prettyUrl={readableLink(share.joinUrl)}
      qrStyle={share.qrStyle}
      location="dashboard-stage"
      onEverything={() => router.push(`/dashboard/${event.id}?room=share`)}
      trigger={
        <button
          type="button"
          data-stage-plate=""
          aria-label={`Show ${event.name}'s code`}
          className="relative rounded-xl bg-white p-2.5 shadow-lift transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-3 focus-visible:ring-white/60 active:scale-[0.98] motion-reduce:active:scale-100"
        >
          <span className="block" style={{ width: size, height: size }}>
            <StyledQr
              value={share.joinUrl}
              size={size}
              style={look}
              className="size-full [&_svg]:size-full"
            />
          </span>
        </button>
      }
    />
  );
}

/** Each of Settings' five steps in a word, the stage's own (`stage.ts` says Door, Uploads, Code). */
const STEP_WORDS: Record<string, string> = {
  door: "Door",
  adds: "Uploads",
  photos: "First photos",
  welcome: "Welcome",
  code: "Code",
};

/**
 * SETTINGS' FIVE STEPS LAID FLAT (Create's beat draws the same rail): a number,
 * a tick once done, joined by a line, the checklist's one line under them.
 */
function Rail({ facts }: { facts: Facts }) {
  if (facts.steps.length === 0) return null;
  return (
    <div data-stage-rail="" className="space-y-2.5">
      <ol className="flex items-start">
        {facts.steps.map((s, i) => (
          <li
            key={s.item}
            data-done={s.done ? "" : undefined}
            className="relative flex min-w-0 flex-1 flex-col items-start gap-1.5"
          >
            {i < facts.steps.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "absolute top-2.5 left-5 h-px w-[calc(100%-1.25rem)]",
                  s.done ? "bg-white/45" : "bg-white/15",
                )}
              />
            )}
            <span
              className={cn(
                "relative flex size-5 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums",
                s.done
                  ? "bg-white text-gallery"
                  : "border border-white/30 text-gallery-muted",
              )}
            >
              {s.done ? (
                <Check className="size-3" strokeWidth={3.5} aria-hidden />
              ) : (
                s.n
              )}
            </span>
            <span
              className={cn(
                "max-w-full pr-1 text-[11px] leading-tight sm:text-xs",
                s.done ? "text-gallery-foreground" : "text-gallery-muted",
              )}
            >
              <span className="sr-only">{s.done ? "Done: " : "To do: "}</span>
              {STEP_WORDS[s.item] ?? s.title}
            </span>
          </li>
        ))}
      </ol>
      {facts.head && (
        <p className="text-sm text-gallery-muted">
          <span className="text-gallery-foreground">{facts.head.title}.</span>{" "}
          {facts.head.line}
        </p>
      )}
    </div>
  );
}

/* ── the stage ────────────────────────────────────────────────────────── */

export function LitStage({
  event,
  ctx,
  share,
  end,
  fresh = false,
  eyebrow,
  overlay,
  className,
}: {
  event: HostedEvent;
  ctx: HomeContext;
  share: ShareFacts;
  /** A range's last day (`event-dates`, drawn as settled). */
  end?: string;
  /** She has just arrived from Create: the lamp ignites once. */
  fresh?: boolean;
  /** Before the phase word, in the stage's first line. */
  eyebrow?: ReactNode;
  /** A layer over the whole band, placed by its owner. */
  overlay?: ReactNode;
  className?: string;
}) {
  const facts = useFacts(event, ctx, end);
  const h = facts.hue;
  // The week before, the light is fuller: the day is near.
  const near = facts.days !== null && facts.days < WEEK_DAYS;
  return (
    <section
      data-stage="before"
      data-hd-empty="lit"
      data-hd-lamp={h}
      aria-label={event.name}
      className={cn(BOX, SPLIT, className)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div
          data-hd-ignite={fresh ? "" : undefined}
          className="absolute inset-0"
          style={{
            background: `radial-gradient(48% 62% at 70% 46%, ${lamp(h, near ? 62 : 46)}, transparent 72%)`,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(42% 46% at 92% 104%, ${lamp(nextLamp(h), near ? 40 : 26)}, transparent 70%)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gallery via-gallery/70 to-transparent max-lg:bg-gradient-to-b max-lg:from-transparent max-lg:via-gallery/60 max-lg:to-gallery" />
      </div>
      <div className="relative flex flex-col gap-6 p-5 sm:p-8 lg:justify-between lg:p-10">
        <Words event={event} facts={facts} eyebrow={eyebrow} />
        <div className="flex flex-col gap-6">
          <Rail facts={facts} />
          <Acts event={event} share={share} facts={facts} />
        </div>
      </div>
      <div className="relative order-first flex h-72 flex-col items-center justify-center gap-4 lg:order-none lg:h-auto">
        <span
          aria-hidden
          className="absolute top-1/2 left-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{ background: lamp(h, 34) }}
        />
        <Plate event={event} share={share} size={176} />
        <OpenedLine opened={facts.opened} />
      </div>
      {overlay}
    </section>
  );
}
