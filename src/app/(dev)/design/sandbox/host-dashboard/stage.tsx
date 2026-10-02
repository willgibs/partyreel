"use client";

import { Check } from "lucide-react";

import { StyledQr } from "@/components/app/styled-qr";
import { Button } from "@/components/ui/button";
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import { readiness } from "@/lib/events/readiness";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import type { DashEvent, Host, Photo } from "./fixtures";
import {
  daysFrom,
  isEvening,
  type Item,
  longDate,
  type Phase,
  readyFacts,
  whenOf,
} from "./model";
import { Dot, Mark, Still, useWide } from "./ui";

/**
 * THE STAGE: ONE EVENT, DRAWN FROM ITS OWN PHOTOGRAPHS.
 *
 * The event of the moment (`momentEvent`) on the gallery's dark ground, the
 * party's photographs its only colour (bible 6): before them, its code on its
 * white plate, the thing a host does next; on the night, the room filling;
 * after it, the album at rest. Its words are a phase, a name, a date and the
 * few numbers that move, and its acts are the event's own.
 *
 * ★ THE LIGHT COMES FROM THE PHOTOGRAPH. Behind the words a blurred copy of
 * the stage's lead photograph spills its colour across the dark, so every
 * party's stage is lit by that party and no two read alike; before there is a
 * photograph, the white plate is the source and the glow is its own.
 *
 * ★ THE STEP IS THE RULE'S, THE STATE IS THE STAGE'S. What the stage asks of
 * the host (Let them in, Invite, Print) shows only when the board's attention
 * rule puts the event's item on the page (`step`); its numbers and its ticks
 * are state and always show, so under the bell rule the stage still says two
 * people wait, in amber, and the bell holds the act.
 */

export type StageMedia = "calm" | "wall";

const PHASE_WORD = (
  phase: Phase,
  event: DashEvent,
  host: Host,
): { word: string; live: boolean } => {
  const evening = isEvening(host.clock);
  if (phase === "live")
    return { word: evening ? "Live tonight" : "Today", live: evening };
  if (!event.date) return { word: "No date yet", live: false };
  const d = daysFrom(host.today, event.date);
  if (phase === "before")
    return {
      word:
        d === 1
          ? "Tomorrow"
          : d < 7
            ? whenOf(event.date, host.today)
            : `In ${d} days`,
      live: false,
    };
  return { word: whenOf(event.date, host.today, true), live: false };
};

/** The numbers that move, by phase: what is in, who came, who waits. */
function numbersOf(event: DashEvent, phase: Phase) {
  const f = event.facts;
  const out: { label: string; value: number; tone?: "waiting" }[] = [];
  if (phase === "before" && f.approved === 0) return out;
  out.push({ label: f.approved === 1 ? "photo" : "photos", value: f.approved });
  out.push({ label: f.guests === 1 ? "guest" : "guests", value: f.guests });
  if (f.waiting > 0)
    out.push({ label: "at the door", value: f.waiting, tone: "waiting" });
  if (f.pending > 0)
    out.push({ label: "to review", value: f.pending, tone: "waiting" });
  return out;
}

/** Readiness's three essentials as ticks: what a guest needs, said in a word each. */
function Ticks({ event, host }: { event: DashEvent; host: Host }) {
  const r = readiness(readyFacts(event, host));
  const words: Record<string, string> = {
    door: "Door",
    adds: "Uploads",
    code: "Code",
    room: "Room",
  };
  const essentials = r.items.filter((i) => i.essential);
  return (
    <ul
      data-hd-ticks={`${r.needed.done}/${r.needed.of}`}
      className="flex flex-wrap gap-x-5 gap-y-2"
    >
      {essentials.map((i) => (
        <li
          key={i.id}
          className={cn(
            "flex items-center gap-2 text-sm",
            i.done ? "text-gallery-foreground" : "text-gallery-muted",
          )}
        >
          {i.done ? (
            <span className="flex size-4 items-center justify-center rounded-full bg-success/90">
              <Check
                className="size-2.5 text-black"
                strokeWidth={3.5}
                aria-hidden
              />
            </span>
          ) : (
            <span
              className="size-4 rounded-full border border-dashed border-gallery-muted"
              aria-hidden
            />
          )}
          {words[i.id] ?? i.title}
        </li>
      ))}
    </ul>
  );
}

/** The plate a guest points a phone at: production's code, on its white, as the stage's object. */
function CodePlate({ event, size }: { event: DashEvent; size: number }) {
  return (
    <div className="relative flex flex-col items-center gap-4">
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 size-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl"
      />
      <div
        data-hd-plate=""
        className="relative rounded-xl bg-white p-2.5 shadow-lift"
        style={{ width: size + 20 }}
      >
        <StyledQr
          value={`https://partyreel.com/e/${event.id}`}
          size={size}
          style={resolveQrPreset("rounded")}
        />
      </div>
      <p className="relative text-xs text-gallery-muted">
        {event.facts.opened > 0
          ? `Opened ${formatCount(event.facts.opened)} ${event.facts.opened === 1 ? "time" : "times"}`
          : "Never opened"}
      </p>
    </div>
  );
}

/** The calm composition: the lead photograph and two beside it. */
function Calm({ photos, wide }: { photos: readonly Photo[]; wide: boolean }) {
  const [a, b, c] = photos;
  if (!a) return null;
  if (!wide || !b || !c)
    return (
      <div className="relative size-full overflow-hidden">
        <Still photo={a} eager />
      </div>
    );
  return (
    <div className="grid size-full grid-cols-[2fr_1fr] grid-rows-2 gap-1">
      <div className="relative row-span-2 overflow-hidden">
        <Still photo={a} eager />
      </div>
      <div className="relative overflow-hidden">
        <Still photo={b} eager />
      </div>
      <div className="relative overflow-hidden">
        <Still photo={c} eager />
      </div>
    </div>
  );
}

/**
 * THE LIVE WALL: the newest photographs as they land, newest first, the
 * newest marked. These keep the arrival fade (no `data-static`), the one
 * place on the page whose tiles literally just arrived.
 */
function Wall({ photos, wide }: { photos: readonly Photo[]; wide: boolean }) {
  // The newest takes four cells, so an arrival reads as one; the rest fill
  // the grid in arrival order (nine at a desk, three in a hand).
  const shown = photos.slice(0, wide ? 9 : 3);
  return (
    <ul
      data-hd-wall={shown.length}
      className={cn(
        "grid size-full gap-1",
        wide ? "grid-cols-4 grid-rows-3" : "grid-cols-3 grid-rows-2",
      )}
    >
      {shown.map((p, i) => (
        <li
          key={p.id}
          data-media-tile
          style={{ "--tile-i": i } as React.CSSProperties}
          className={cn(
            "relative overflow-hidden",
            i === 0 && "col-span-2 row-span-2",
          )}
        >
          <Still photo={p} eager />
          {i === 0 && (
            <span className="absolute top-2.5 right-2.5">
              <Mark tone="live">Just now</Mark>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function Stage({
  host,
  event,
  phase,
  step,
  media,
}: {
  host: Host;
  event: DashEvent;
  phase: Phase;
  /** The event's item when the attention rule puts it on the page. */
  step: Item | null;
  /** How the photographs stand on the night: calm, or the live wall. */
  media: StageMedia;
}) {
  const wide = useWide();
  const { word, live } = PHASE_WORD(phase, event, host);
  const photos = event.photos;
  const lead = photos[0];
  const showCode = phase === "before" && photos.length === 0;
  // A wall needs a wall's worth: a morning's first few stand calm until it fills.
  const wall =
    media === "wall" && phase === "live" && photos.length >= (wide ? 9 : 3);
  const numbers = numbersOf(event, phase);

  const primary =
    step?.kind === "door"
      ? `Let ${formatCount(event.facts.waiting)} in`
      : step?.kind === "review"
        ? `Review ${formatCount(event.facts.pending)}`
        : step?.kind === "code"
          ? "Invite"
          : step
            ? step.act
            : phase === "after"
              ? "Share the album"
              : phase === "before"
                ? "Invite"
                : "Open";
  const secondary =
    step?.kind === "code" ? "Print" : primary === "Open" ? null : "Open";

  const name = (
    <h2
      data-hd-stage-name=""
      className={cn(
        "font-heading text-balance text-white",
        wide ? "text-section" : "text-page",
      )}
    >
      {event.name}
    </h2>
  );

  const words = (
    <div
      className={cn(
        "relative flex flex-col",
        wide ? "justify-between p-10" : "gap-5 p-5",
      )}
    >
      <div>
        <p
          data-hd-phase={phase}
          className="flex items-center gap-2 text-label text-gallery-muted uppercase"
        >
          {live ? <Dot tone="live" /> : null}
          {word}
          {/* The party's pulse, beside the word that says it is on. */}
          {phase === "live" && event.facts.lastHour > 0 && (
            <span className="tracking-normal normal-case">
              {`· ${formatCount(event.facts.lastHour)} in the last hour`}
            </span>
          )}
        </p>
        <div className={wide ? "mt-4" : "mt-2"}>{name}</div>
        <p className="mt-1.5 text-sm text-gallery-muted">
          {event.date ? longDate(event.date) : "No date set"}
        </p>
      </div>

      <div className={cn("flex flex-col", wide ? "gap-7" : "gap-5")}>
        {phase === "before" ? (
          <Ticks event={event} host={host} />
        ) : (
          <dl
            data-hd-numbers=""
            className={cn("flex", wide ? "gap-10" : "gap-6")}
          >
            {numbers.map((n) => (
              // The term before its value, as a list reads it; the number drawn on top.
              <div key={n.label} className="flex flex-col-reverse">
                <dt className="mt-0.5 text-xs text-gallery-muted">{n.label}</dt>
                <dd
                  className={cn(
                    "font-heading tabular-nums",
                    wide ? "text-page" : "text-subsection",
                    n.tone === "waiting" ? "text-warning" : "text-white",
                  )}
                >
                  {formatCount(n.value)}
                </dd>
              </div>
            ))}
          </dl>
        )}

        <div
          data-hd-acts={step ? step.kind : "none"}
          className="flex flex-wrap items-center gap-2"
        >
          <Button
            size={wide ? "lg" : "default"}
            tabIndex={-1}
            className={wide ? "" : "flex-1"}
          >
            {primary}
          </Button>
          {secondary && (
            <Button
              size={wide ? "lg" : "default"}
              variant="secondary"
              tabIndex={-1}
              className={wide ? "" : "flex-1"}
            >
              {secondary}
            </Button>
          )}
          {phase === "before" && !step && (
            <span className="ml-1 flex items-center gap-1.5 text-sm text-gallery-muted">
              {readiness(readyFacts(event, host)).ready
                ? "Ready for guests"
                : null}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const picture = showCode ? (
    <div className="flex size-full items-center justify-center">
      <CodePlate event={event} size={wide ? 196 : 168} />
    </div>
  ) : wall ? (
    <Wall photos={photos} wide={wide} />
  ) : (
    <Calm photos={photos} wide={wide} />
  );

  return (
    <section
      data-hd-stage={phase}
      aria-label={event.name}
      className={cn(
        "dark relative isolate overflow-hidden rounded-xl bg-gallery text-gallery-foreground ring-1 ring-gallery-border",
        wide
          ? "grid h-[420px] grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
          : "flex flex-col",
      )}
    >
      {/* The light: the lead photograph, blurred into the dark behind the words. */}
      {lead && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div
            className={cn(
              "absolute",
              wide ? "inset-y-0 left-0 w-[55%]" : "inset-0",
            )}
          >
            <Still
              photo={lead}
              className="scale-150 opacity-70 blur-3xl saturate-150"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-gallery/55 via-gallery/35 to-gallery/60" />
        </div>
      )}

      {wide ? (
        <>
          {words}
          <div className="relative min-h-0">
            {picture}
            {/* The photographs melt into the dark the words stand on. */}
            {!showCode && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-gallery/90 to-transparent"
              />
            )}
          </div>
        </>
      ) : (
        <>
          <div className={cn("relative", showCode ? "h-64" : "aspect-[4/3]")}>
            {picture}
          </div>
          {words}
        </>
      )}
    </section>
  );
}
