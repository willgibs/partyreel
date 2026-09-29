"use client";

import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";

import {
  SettingsCard,
  StackSetting,
  SwitchSetting,
} from "@/components/app/event-settings/settings-furniture";
import {
  moodLabel,
  useSettings,
} from "@/components/app/event-settings/settings-state";
import { Dormant } from "@/components/ui/dormant";
import { marketingImage } from "@/lib/constants/marketing-media";
import { secondsLabel } from "@/lib/events/guest-experience-summary";
import {
  DEFAULT_HOLD_SEC,
  HOLD_STEPS_SEC,
  REEL_MOOD_IDS,
} from "@/lib/reel/defaults";
import { resolveTheme } from "@/lib/reel/engine/themes";
import { cn } from "@/lib/utils";

/** The photograph the looks are shown on before the event has one of its own. */
const SAMPLE = marketingImage("wedding-toast");

/**
 * THE HIGHLIGHT REEL, AS ITS OWN PAGE (`reel-host`, Will 2026-09-25: `style=both`, and his amendment to
 * `switch`: "reel ... could use its own settings section"; event-settings r1 gave it a page). Show the
 * reel, and under it, dormant while it is off, the look and the hold every guest starts on.
 *
 * ★ EACH CHOICE SAVES THE MOMENT IT IS MADE, through the one write the view's "Set for everyone" shares
 * (`setReelDefaults`, by way of the settings' state, which keeps the reel card's own rules: only the
 * field that changed is sent, a refused save is put back with a sentence, and a slow answer to an older
 * pick never undoes a newer one).
 *
 * ★ THE LOOKS ARE SHOWN, NOT NAMED. Each swatch is the event's own photograph wearing that mood's
 * grade, read off the engine's catalog (`resolveTheme(id).grade`, the very CSS filter the engine draws
 * a still with), and Editorial sits on its paper card; before the event has a photo, one sample
 * photograph stands in and says so.
 *
 * ★ BILLBOARD AND CONTROL AT ONCE (his `style` note: Settings "effectively acting as a billboard for the
 * feature itself if not discovered in usage"): the switch's own line says what the reel is, and while it
 * is off its look and hold stay in view as one quiet line (the dormant setting), never gone.
 */
export function ReelPage() {
  const s = useSettings();
  const v = s.values;
  const photo = s.reelSample ?? SAMPLE.src;
  return (
    <SettingsCard label="Highlight reel">
      <SwitchSetting
        label="Show the reel"
        line="It plays on the album from the second photo, for everyone with the link. Off hides it everywhere."
        checked={v.showReel}
        onCheckedChange={(next) => void s.saveReel({ showReel: next })}
        after={
          <Dormant
            awake={v.showReel}
            summary="Its look and its hold. Turn the reel on to choose them."
          >
            <div data-highlight-reel-settings="" className="space-y-5 pt-2">
              <StackSetting
                className="px-0 py-0"
                label="Look"
                labelId="reel-look-label"
                line={
                  <>
                    Where every guest starts. Anyone can pick their own on their
                    device.
                    {s.reelSample
                      ? null
                      : " Shown on a sample photo until yours arrive."}
                  </>
                }
              >
                <ToggleGroupPrimitive.Root
                  type="single"
                  value={v.reelStyleId}
                  onValueChange={(id) => {
                    // A second press on the look already chosen answers "", which is no look at all.
                    if (id && id !== v.reelStyleId)
                      void s.saveReel({ reelStyleId: id });
                  }}
                  aria-labelledby="reel-look-label"
                  className="grid grid-cols-4 gap-2"
                >
                  {REEL_MOOD_IDS.map((id) => (
                    <ToggleGroupPrimitive.Item
                      key={id}
                      value={id}
                      data-reel-mood={id}
                      className="group flex min-w-0 flex-col items-center gap-1 rounded-[calc(var(--radius-tile)+2px)] outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      <MoodSwatch id={id} photo={photo} />
                      <span className="w-full truncate text-center text-xs text-muted-foreground group-data-[state=on]:font-medium group-data-[state=on]:text-foreground">
                        {moodLabel(id)}
                      </span>
                    </ToggleGroupPrimitive.Item>
                  ))}
                </ToggleGroupPrimitive.Root>
              </StackSetting>
              <StackSetting
                className="px-0 py-0"
                label="Hold"
                labelId="reel-hold-label"
                line={`Seconds each photo stays on screen. ${DEFAULT_HOLD_SEC} unless you choose.`}
              >
                <ToggleGroupPrimitive.Root
                  type="single"
                  value={String(v.reelHoldSec)}
                  onValueChange={(value) => {
                    const next = Number(value);
                    if (value && next !== v.reelHoldSec)
                      void s.saveReel({ reelHoldSec: next });
                  }}
                  aria-labelledby="reel-hold-label"
                  className="flex rounded-lg bg-muted p-0.5"
                >
                  {HOLD_STEPS_SEC.map((step) => (
                    <ToggleGroupPrimitive.Item
                      key={step}
                      value={String(step)}
                      aria-label={secondsLabel(step)}
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
              </StackSetting>
            </div>
          </Dormant>
        }
      />
    </SettingsCard>
  );
}

/**
 * One look, shown: the photograph under the mood's own grade (the CSS filter the engine draws a still
 * with), on the mood's own backdrop, and inset on its paper for the mood whose signature is the printed
 * card. The ring marks the chosen one.
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
