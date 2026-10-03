"use client";

import { type CSSProperties, type ReactNode, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ImagePlus, Smartphone } from "lucide-react";

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
  stageTicksOf,
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

import { lampOf, rangeDays, rangeLine, type StageWay } from "./model";

/**
 * THE STAGE OF AN EVENT WITH NO PHOTOGRAPHS YET, FOUR WAYS (`stage`, his r2
 * note on `lead=made`: "We should ensure featured events with no uploaded media
 * yet still look beautiful as featured in the dashboard"). With `lead=made`
 * settled, this is the stage every new host meets first: the event she made
 * last night, nothing in it.
 *
 * ★ EVERY WAY SAYS THE SAME FACTS, PRODUCTION'S: its words, its date (a range's
 * as `event-dates` will say it), readiness's essentials (`stageTicksOf`, the
 * hub's checklist's own function), its one item and acts (`stageActsOf`), its
 * code (the code card, `CodeCard`, opened by the plate). What a way changes is
 * the picture those facts stand in:
 *  - `lit`: the code on its plate, lit by the event's own lamp, Settings' five
 *    steps laid flat under the name: Create's last screen, carried here;
 *  - `album`: the album's own frames, waiting, the code in the first;
 *  - `card`: the name set like an invitation, lit from above;
 *  - `guest`: the phone her guests will hold, beside the code that opens it.
 *
 * ★ THE COLOUR IS LIGHT, NEVER PAINT (bible 6): one of the house's five lamps,
 * the event's own (`lampOf`), only ever as light in a gradient; the
 * interface stays the gallery's dark, and the photographs take the light over
 * the day the first one lands.
 */

const BOX =
  "dark relative isolate flex flex-col overflow-hidden rounded-2xl bg-gallery text-gallery-foreground ring-1 ring-gallery-border";
const SPLIT =
  "lg:grid lg:h-[clamp(420px,30vw,560px)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]";

/** A lamp as light: a gradient's colour, never a class (the lamp set is not in `@theme`). */
const lamp = (n: number, alpha: number) =>
  `color-mix(in oklch, var(--lamp-${n}) ${alpha}%, transparent)`;
const nextLamp = (n: number) => (n % 5) + 1;

/** What every way reads: production's own words, ticks and acts for the event. */
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
  const ticks = stageTicksOf(facts);
  const steps = facts ? settingsSteps(settingsReadiness(facts)) : [];
  const head = facts ? readyHead(readiness(facts)) : null;
  const item = itemFor(event, ctx);
  const acts = stageActsOf(event, phase, item);
  return {
    phase,
    word,
    dateLine,
    ticks,
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

/* ── the pieces every way shares ──────────────────────────────────────── */

function Words({
  event,
  facts,
  centred,
  big,
}: {
  event: HostedEvent;
  facts: Facts;
  centred?: boolean;
  big?: boolean;
}) {
  return (
    <div className={cn(centred && "flex flex-col items-center text-center")}>
      <p
        data-stage-word={facts.phase}
        className="text-label text-gallery-muted uppercase"
      >
        {facts.word}
      </p>
      <h2
        className={cn(
          "mt-2 line-clamp-3 font-heading text-balance text-white lg:mt-4",
          big ? "text-section lg:text-chapter" : "text-page lg:text-section",
        )}
      >
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

/** Readiness's essentials as ticks, the stage's own drawing (`stage.tsx`'s `Ticks`). */
function Ticks({ facts, centred }: { facts: Facts; centred?: boolean }) {
  if (!facts.ticks) return null;
  return (
    <ul
      data-stage-ticks=""
      className={cn(
        "flex flex-wrap gap-x-5 gap-y-2",
        centred && "justify-center",
      )}
    >
      {facts.ticks.ticks.map((t) => (
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

function Acts({
  event,
  share,
  facts,
  centred,
}: {
  event: HostedEvent;
  share: ShareFacts;
  facts: Facts;
  centred?: boolean;
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
      className={cn(
        "flex flex-wrap items-center gap-2",
        centred && "justify-center",
      )}
    >
      {door(primary, "default")}
      {secondary && door(secondary, "secondary")}
      {facts.ticks?.ready && !facts.item && (
        <span className="ml-1 flex items-center gap-1.5 text-sm text-gallery-muted">
          <Check className="size-3.5 text-success" aria-hidden />
          Ready for guests
        </span>
      )}
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

/* ── 1. the code, lit by its own lamp ─────────────────────────────────── */

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
                "max-w-full truncate pr-2 text-xs",
                s.done ? "text-gallery-foreground" : "text-gallery-muted",
              )}
            >
              <span className="sr-only">{s.done ? "Done: " : "To do: "}</span>
              {s.title}
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

function Lit({
  event,
  share,
  facts,
  fresh,
}: {
  event: HostedEvent;
  share: ShareFacts;
  facts: Facts;
  fresh: boolean;
}) {
  const h = facts.hue;
  // The week before, the light is fuller: the day is near.
  const near = facts.days !== null && facts.days < WEEK_DAYS;
  return (
    <section
      data-stage="before"
      data-hd-empty="lit"
      data-hd-lamp={h}
      aria-label={event.name}
      className={cn(BOX, SPLIT)}
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
        <Words event={event} facts={facts} />
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
    </section>
  );
}

/* ── 2. the album, waiting ────────────────────────────────────────────── */

function Pane({
  hue,
  delay,
  children,
  className,
}: {
  hue: number;
  delay: number;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("relative overflow-hidden bg-white/[0.035]", className)}
    >
      <div
        aria-hidden
        data-hd-develop=""
        className="absolute -inset-1/4"
        style={
          {
            background: `radial-gradient(55% 55% at 35% 40%, ${lamp(hue, 30)}, transparent 70%), radial-gradient(45% 50% at 75% 75%, ${lamp(nextLamp(hue), 20)}, transparent 70%)`,
            animationDelay: `${delay}s`,
          } as CSSProperties
        }
      />
      {children}
    </div>
  );
}

function Album({
  event,
  share,
  facts,
}: {
  event: HostedEvent;
  share: ShareFacts;
  facts: Facts;
}) {
  const h = facts.hue;
  return (
    <section
      data-stage="before"
      data-hd-empty="album"
      data-hd-lamp={h}
      aria-label={event.name}
      className={cn(BOX, SPLIT)}
    >
      <div className="relative flex flex-col gap-6 p-5 sm:p-8 lg:justify-between lg:p-10">
        <Words event={event} facts={facts} />
        <div className="flex flex-col gap-5 lg:gap-7">
          <Ticks facts={facts} />
          <Acts event={event} share={share} facts={facts} />
        </div>
      </div>
      <div className="relative order-first aspect-[4/3] min-h-0 lg:order-none lg:aspect-auto">
        <div className="grid size-full gap-1 lg:grid-cols-[2fr_1fr] lg:grid-rows-2">
          <Pane
            hue={h}
            delay={0}
            className="flex flex-col items-center justify-center gap-3 lg:row-span-2"
          >
            <Plate event={event} share={share} size={128} />
            <p className="relative text-center text-sm text-white">
              The first photos land here
            </p>
            <OpenedLine opened={facts.opened} />
          </Pane>
          <Pane hue={nextLamp(h)} delay={-3} className="max-lg:hidden" />
          <Pane hue={h} delay={-6} className="max-lg:hidden" />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 hidden w-16 bg-gradient-to-r from-gallery/90 to-transparent lg:block"
        />
      </div>
    </section>
  );
}

/* ── 3. set like an invitation ────────────────────────────────────────── */

function Card({
  event,
  share,
  facts,
}: {
  event: HostedEvent;
  share: ShareFacts;
  facts: Facts;
}) {
  const h = facts.hue;
  return (
    <section
      data-stage="before"
      data-hd-empty="card"
      data-hd-lamp={h}
      aria-label={event.name}
      className={cn(
        BOX,
        "items-center justify-center px-5 py-10 sm:px-10 lg:h-[clamp(420px,30vw,560px)]",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(70% 55% at 50% -8%, ${lamp(h, 58)}, transparent 70%), radial-gradient(30% 40% at 12% 0%, ${lamp(nextLamp(h), 34)}, transparent 70%), radial-gradient(30% 40% at 88% 0%, ${lamp(nextLamp(nextLamp(h)), 26)}, transparent 70%)`,
        }}
      />
      <div className="flex max-w-3xl flex-col items-center gap-6 lg:gap-8">
        <Words event={event} facts={facts} centred big />
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
          <div className="flex items-center gap-3">
            <Plate event={event} share={share} size={84} />
            <div className="flex flex-col items-start gap-1">
              <p className="text-sm text-white">Your guests&apos; way in</p>
              <OpenedLine opened={facts.opened} />
            </div>
          </div>
          <span
            aria-hidden
            className="hidden h-12 w-px bg-white/15 sm:block"
          />
          <Ticks facts={facts} />
        </div>
        <Acts event={event} share={share} facts={facts} centred />
      </div>
    </section>
  );
}

/* ── 4. what her guests will see ──────────────────────────────────────── */

/** Her guests' first screen, drawn small: the name, her welcome, the one button. */
function GuestPhone({ event }: { event: HostedEvent }) {
  return (
    <div
      data-hd-guest-phone=""
      className="relative w-[190px] rounded-[2rem] border border-white/15 bg-black p-1.5 shadow-lift lg:w-[210px]"
    >
      <div className="flex aspect-[9/17] flex-col justify-between overflow-hidden rounded-[1.6rem] bg-gallery px-4 pt-8 pb-5">
        <div className="space-y-2">
          <p className="text-[10px] font-medium tracking-[0.12em] text-gallery-muted uppercase">
            You&apos;re invited to add
          </p>
          <p className="font-heading text-subsection leading-tight text-white">
            {event.name}
          </p>
          {event.description ? (
            <p className="line-clamp-4 text-xs leading-snug text-gallery-muted">
              {event.description}
            </p>
          ) : (
            <p className="rounded-md border border-dashed border-white/20 px-2 py-1.5 text-[11px] leading-snug text-gallery-muted">
              Your welcome note shows here
            </p>
          )}
        </div>
        <div className="space-y-2">
          <span className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-white text-xs font-medium text-gallery">
            <ImagePlus className="size-3.5" aria-hidden /> Add photos
          </span>
          <p className="text-center text-[10px] text-gallery-muted">
            Nothing here yet. Be the first.
          </p>
        </div>
      </div>
    </div>
  );
}

function Guest({
  event,
  share,
  facts,
}: {
  event: HostedEvent;
  share: ShareFacts;
  facts: Facts;
}) {
  const h = facts.hue;
  return (
    <section
      data-stage="before"
      data-hd-empty="guest"
      data-hd-lamp={h}
      aria-label={event.name}
      className={cn(BOX, SPLIT)}
    >
      <div className="relative flex flex-col gap-6 p-5 sm:p-8 lg:justify-between lg:p-10">
        <Words event={event} facts={facts} />
        <div className="flex flex-col gap-5 lg:gap-7">
          <Ticks facts={facts} />
          <Acts event={event} share={share} facts={facts} />
        </div>
      </div>
      <div className="relative order-first flex items-center justify-center gap-6 py-8 lg:order-none lg:py-0">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(45% 60% at 62% 50%, ${lamp(h, 42)}, transparent 72%)`,
          }}
        />
        <div className="relative flex flex-col items-center gap-3 max-sm:hidden">
          <Plate event={event} share={share} size={112} />
          <p className="flex items-center gap-1.5 text-xs text-gallery-muted">
            <Smartphone className="size-3.5" aria-hidden /> Scan it, and a
            guest sees this
          </p>
          <OpenedLine opened={facts.opened} />
        </div>
        <GuestPhone event={event} />
      </div>
    </section>
  );
}

/* ── the stage, one way ───────────────────────────────────────────────── */

export function EmptyStage({
  way,
  event,
  ctx,
  share,
  end,
  fresh = false,
}: {
  way: StageWay;
  event: HostedEvent;
  ctx: HomeContext;
  share: ShareFacts;
  /** A range's last day (`event-dates`, drawn as settled). */
  end?: string;
  /** She has just arrived from Create: the lamp ignites once. */
  fresh?: boolean;
}) {
  const facts = useFacts(event, ctx, end);
  if (way === "album")
    return <Album event={event} share={share} facts={facts} />;
  if (way === "card") return <Card event={event} share={share} facts={facts} />;
  if (way === "guest")
    return <Guest event={event} share={share} facts={facts} />;
  return <Lit event={event} share={share} facts={facts} fresh={fresh} />;
}
