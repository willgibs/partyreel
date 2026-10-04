"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

import { CodeCard, readableLink } from "@/components/app/share/code-card";
import { StyledQr } from "@/components/app/styled-qr";
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import type { ShareFacts } from "@/lib/dashboard/home-view";
import { openedLineOf, type StageRail } from "@/lib/dashboard/stage";
import { cn } from "@/lib/utils";

/**
 * THE STAGE BEFORE ITS FIRST PHOTOGRAPH, LIT BY ITS OWN LAMP (host-dashboard r3, Will 2026-10-04: `stage=lit`; his
 * r2 note on `lead=made`: "We should ensure featured events with no uploaded media yet still look beautiful as
 * featured in the dashboard"). With the newest event leading, this is the stage every new host meets first: the event
 * she made last night, nothing in it. The code on its white plate, lit by the event's own lamp; beside it Settings'
 * five steps laid flat under the name, Create's last screen carried here.
 *
 * ★ THE COLOUR IS LIGHT, NEVER PAINT (bible 6): one of the house's five lamps, the event's own (`lampOf`, picked by
 * its id and never changing), only ever as light in a gradient, so the interface stays the gallery's dark; the
 * lamp burns fuller from the week before the day (`lampNear`), and the photographs take the light over the day the
 * first one lands (`stage.tsx`).
 */

/** A lamp as light: a gradient's colour, never a class (the five are not in `@theme`, by design). */
const lamp = (n: number, alpha: number) =>
  `color-mix(in oklch, var(--lamp-${n}) ${alpha}%, transparent)`;
const nextLamp = (n: number) => (n % 5) + 1;

/**
 * The light: the event's lamp spilling in from the plate's side, a second lamp low in the corner, and the dark
 * the words stand on. Behind everything (`-z-10`, over the stage's own ground).
 */
export function LampLight({
  lamp: n,
  near,
}: {
  lamp: 1 | 2 | 3 | 4 | 5;
  near: boolean;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(48% 62% at 70% 46%, ${lamp(n, near ? 62 : 46)}, transparent 72%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(42% 46% at 92% 104%, ${lamp(nextLamp(n), near ? 40 : 26)}, transparent 70%)`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-gallery via-gallery/70 to-transparent max-lg:bg-gradient-to-b max-lg:from-transparent max-lg:via-gallery/60 max-lg:to-gallery" />
    </div>
  );
}

/**
 * SETTINGS' FIVE STEPS LAID FLAT (Create's beat draws the same rail): a number, a tick once done, joined by a
 * line, the checklist's one line under them. A step's state is also said in words for a reader that cannot see it.
 */
export function Rail({ rail }: { rail: StageRail }) {
  return (
    <div data-stage-rail="" className="space-y-2.5">
      <ol className="flex items-start">
        {rail.steps.map((s, i) => (
          <li
            key={s.item}
            data-done={s.done ? "" : undefined}
            className="relative flex min-w-0 flex-1 flex-col items-start gap-1.5"
          >
            {i < rail.steps.length - 1 && (
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
                "relative flex size-5 items-center justify-center rounded-full text-micro font-semibold tabular-nums",
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
                "max-w-full pr-1 text-xs leading-tight",
                s.done ? "text-gallery-foreground" : "text-gallery-muted",
              )}
            >
              <span className="sr-only">{s.done ? "Done: " : "To do: "}</span>
              {s.word}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-sm text-gallery-muted">
        <span className="text-gallery-foreground">{rail.head.title}.</span>{" "}
        {rail.head.line}
      </p>
    </div>
  );
}

/**
 * The plate a guest points a phone at: the event's own code on its white at 176 px, its card one press away, in the
 * lamp's glow, and under it whether the code has ever been opened.
 */
export function Plate({
  eventId,
  name,
  share,
  opened,
  lamp: n,
}: {
  eventId: string;
  name: string;
  share: ShareFacts;
  /** Visits to the code's link, the host's own included; null where readiness was not read. */
  opened: number | null;
  lamp: 1 | 2 | 3 | 4 | 5;
}) {
  const router = useRouter();
  const look = useMemo(() => resolveQrPreset(share.qrStyle), [share.qrStyle]);
  const line = openedLineOf(opened);
  return (
    <div className="relative flex flex-col items-center gap-4">
      <span
        aria-hidden
        className="absolute top-1/2 left-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: lamp(n, 34) }}
      />
      <CodeCard
        who="host"
        eventName={name}
        joinUrl={share.joinUrl}
        prettyUrl={readableLink(share.joinUrl)}
        qrStyle={share.qrStyle}
        location="dashboard-stage"
        onEverything={() => router.push(`/dashboard/${eventId}?room=share`)}
        trigger={
          <button
            type="button"
            data-stage-plate=""
            aria-label={`Show ${name}'s code`}
            className="relative rounded-xl bg-white p-2.5 shadow-lift transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-3 focus-visible:ring-white/60 active:scale-[0.98] motion-reduce:active:scale-100"
          >
            <span className="block size-[176px]">
              <StyledQr
                value={share.joinUrl}
                size={176}
                style={look}
                className="size-full [&_svg]:size-full"
              />
            </span>
          </button>
        }
      />
      {line && <p className="relative text-xs text-gallery-muted">{line}</p>}
    </div>
  );
}
