"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clapperboard } from "lucide-react";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { marketingImage } from "@/lib/constants/marketing-media";
import { setReelDefaults } from "@/lib/reel/defaults-action";
import {
  DEFAULT_HOLD_SEC,
  HOLD_STEPS_SEC,
  REEL_MOOD_IDS,
  resolveHoldSec,
} from "@/lib/reel/defaults";
import {
  DEFAULT_STYLE_ID,
  STYLE_CATALOG,
} from "@/lib/reel/engine/style-registry";
import { resolveTheme } from "@/lib/reel/engine/themes";
import { cn } from "@/lib/utils";

/** What the card holds, each already resolved to what a guest starts on. */
type Defaults = { showReel: boolean; styleId: string; holdSec: number };

/** The photograph the looks are shown on before the event has one of its own. */
const SAMPLE = marketingImage("wedding-toast");

const MOODS = REEL_MOOD_IDS.map((id) => ({
  id,
  label: STYLE_CATALOG.find((entry) => entry.id === id)?.label ?? id,
}));

/** A stored style that is not a mood (a legacy treatment, a retired id) starts guests on the default. */
function resolveMood(styleId: string | null): string {
  return styleId && REEL_MOOD_IDS.includes(styleId)
    ? styleId
    : DEFAULT_STYLE_ID;
}

const seconds = (s: number) => `${s} ${s === 1 ? "second" : "seconds"}`;

/**
 * SETTINGS' HIGHLIGHT REEL SECTION (`reel-host`, Will 2026-09-25: `style=both`, and his amendment
 * to `switch`: "reel ... could use its own settings section"). Show the reel, the look every guest
 * starts on, and the hold every guest starts on, in one card of their own.
 *
 * ★ INSTANT, LIKE PROFILE & GUESTS. Each control is a deliberate one-value act, so it saves the
 * moment it changes (`setReelDefaults`, the one write the view's "Set for everyone" shares) rather
 * than waiting behind the form's Save changes. Optimistic, and put back with a sentence when the
 * save is refused. The action revalidates nothing, so the card keeps what the save answered.
 *
 * ★ THE LOOKS ARE SHOWN, NOT NAMED. Each swatch is the event's own photograph wearing that mood's
 * grade, read off the engine's catalog (`resolveTheme(id).grade`, the very CSS filter the engine
 * draws a still with), and Editorial sits on its paper card; before the event has a photo, one
 * sample photograph stands in and says so.
 *
 * ★ BILLBOARD AND CONTROL AT ONCE (his `style` note: Settings "effectively acting as a billboard
 * for the feature itself if not discovered in usage"): the switch's own line says what the reel
 * is before it says what Off does.
 */
export function HighlightReelCard({
  eventId,
  showReel,
  styleId,
  holdSec,
  sampleStill,
}: {
  eventId: string;
  showReel: boolean;
  /** `events.reel_style_id`: null is the default mood. */
  styleId: string | null;
  /** `events.reel_hold_sec`: null is the default hold. */
  holdSec: number | null;
  /** One of the event's own photographs to show the looks on, or null before the first. */
  sampleStill: string | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const initial: Defaults = {
    showReel,
    styleId: resolveMood(styleId),
    holdSec: resolveHoldSec(holdSec),
  };
  const [shown, setShown] = useState<Defaults>(initial);
  // What the database last confirmed: where a refused save puts the card back.
  const confirmed = useRef<Defaults>(initial);
  // Only the newest save answers for the card: a slow answer to an older pick must not undo a
  // newer one the host has already made.
  const latest = useRef(0);

  function persist(patch: Partial<Defaults>) {
    const seq = ++latest.current;
    setShown((s) => ({ ...s, ...patch }));
    startTransition(async () => {
      const result = await setReelDefaults({ eventId, ...patch });
      if (result.ok) {
        confirmed.current = {
          showReel: result.defaults.showReel,
          styleId: resolveMood(result.defaults.styleId),
          holdSec: resolveHoldSec(result.defaults.holdSec),
        };
      }
      if (seq !== latest.current) return;
      if (!result.ok) {
        setShown(confirmed.current);
        toast.error("Couldn't save that setting.", {
          description: result.message,
        });
        return;
      }
      setShown(confirmed.current);
      if (patch.showReel !== undefined) {
        // The switch is felt on the album, not here: say so, and let the hub's Reel card catch up.
        toast.success(
          patch.showReel
            ? "The highlight reel is on."
            : "The highlight reel is off.",
          {
            description: patch.showReel
              ? "It plays on the album from the second photo."
              : "Guests no longer see it anywhere.",
          },
        );
        router.refresh();
      }
    });
  }

  const photo = sampleStill ?? SAMPLE.src;

  return (
    <Card data-highlight-reel-settings="">
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Clapperboard
              className="size-4 text-muted-foreground"
              aria-hidden
            />
            Highlight reel
          </span>
        </CardTitle>
        <CardDescription>
          The album&rsquo;s own reel, made from every photo guests can see.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <Label
            htmlFor="show-reel"
            className="min-w-0 flex-1 cursor-pointer flex-col items-start gap-1 font-normal"
          >
            <span className="text-sm font-medium text-foreground">
              Show the reel
            </span>
            <span className="text-xs leading-relaxed text-muted-foreground">
              It plays on the album from the second photo, for everyone with the
              link. Off hides it everywhere: the album, the view and any screen.
            </span>
          </Label>
          <Switch
            id="show-reel"
            checked={shown.showReel}
            onCheckedChange={(checked) => persist({ showReel: checked })}
          />
        </div>

        <div className="space-y-2 border-t border-border/60 pt-5">
          <div className="space-y-0.5">
            <p id="reel-look-label" className="text-sm font-medium">
              Look
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Where every guest starts. Anyone can pick their own on their
              device.
              {sampleStill
                ? null
                : " Shown on a sample photo until yours arrive."}
            </p>
          </div>
          <ToggleGroupPrimitive.Root
            type="single"
            value={shown.styleId}
            onValueChange={(id) => {
              // A second press on the look already chosen answers "", which is no look at all.
              if (id && id !== shown.styleId) persist({ styleId: id });
            }}
            aria-labelledby="reel-look-label"
            className="grid grid-cols-4 gap-2"
          >
            {MOODS.map((mood) => (
              <ToggleGroupPrimitive.Item
                key={mood.id}
                value={mood.id}
                data-reel-mood={mood.id}
                className="group flex min-w-0 flex-col items-center gap-1 rounded-[calc(var(--radius-tile)+2px)] outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <MoodSwatch id={mood.id} photo={photo} />
                <span className="w-full truncate text-center text-xs text-muted-foreground group-data-[state=on]:font-medium group-data-[state=on]:text-foreground">
                  {mood.label}
                </span>
              </ToggleGroupPrimitive.Item>
            ))}
          </ToggleGroupPrimitive.Root>
        </div>

        <div className="space-y-2 border-t border-border/60 pt-5">
          <div className="space-y-0.5">
            <p id="reel-hold-label" className="text-sm font-medium">
              Hold
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Seconds each photo stays on screen. {DEFAULT_HOLD_SEC} unless you
              choose.
            </p>
          </div>
          <ToggleGroupPrimitive.Root
            type="single"
            value={String(shown.holdSec)}
            onValueChange={(value) => {
              const next = Number(value);
              if (value && next !== shown.holdSec) persist({ holdSec: next });
            }}
            aria-labelledby="reel-hold-label"
            className="flex rounded-lg bg-muted p-0.5"
          >
            {HOLD_STEPS_SEC.map((step) => (
              <ToggleGroupPrimitive.Item
                key={step}
                value={String(step)}
                aria-label={seconds(step)}
                className={cn(
                  "h-7 flex-1 rounded-md text-xs text-muted-foreground tabular-nums transition-colors duration-150 outline-none motion-reduce:transition-none",
                  "hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
                  "data-[state=on]:bg-background data-[state=on]:font-medium data-[state=on]:text-foreground data-[state=on]:shadow-lift",
                )}
              >
                {step}
              </ToggleGroupPrimitive.Item>
            ))}
          </ToggleGroupPrimitive.Root>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * One look, shown: the photograph under the mood's own grade (the CSS filter the engine draws a
 * still with), on the mood's own backdrop, and inset on its paper for the mood whose signature is
 * the printed card. The ring marks the chosen one.
 */
function MoodSwatch({ id, photo }: { id: string; photo: string }) {
  const theme = resolveTheme(id);
  const paper = theme.backdrop === "paper" ? theme.signature?.paper : undefined;
  const inset = paper ? (theme.signature?.inset ?? 0.08) : 0;
  return (
    <span
      className="relative block aspect-video w-full overflow-hidden rounded-[var(--radius-tile)] ring-offset-2 ring-offset-card transition-shadow duration-150 group-data-[state=on]:ring-2 group-data-[state=on]:ring-foreground motion-reduce:transition-none"
      style={{
        background: paper ?? theme.background,
        padding: inset ? `${inset * 100}%` : undefined,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a presigned R2 preview or a local still */}
      <img
        src={photo}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        className="size-full object-cover"
        style={{ filter: theme.grade }}
      />
    </span>
  );
}
