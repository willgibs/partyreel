"use client";

import { useState } from "react";
import { Clapperboard, MonitorPlay, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { DEFAULT_HOLD, DEFAULT_MOOD_ID, HOLD_STEPS, MOODS } from "./fixtures";
import { UnrelatedCard } from "./scene";
import { useStills } from "./stills";

/**
 * THE SETTINGS SHEET'S PIECES, QUOTED (`event-settings/profile-social-card.tsx`'s
 * own rows and classes, copied rather than imported: the real component reaches
 * `updateEventSocialSettingsAction` on every flip, a Server Function this board
 * must never call). Local `useState` stands in for the optimistic mutation.
 *
 * ★ EVERY PIECE HOLDS THE REST OF THE SHEET STEADY. The defaults question's
 * options vary only whether the Reel card exists; the switch question's vary
 * only WHERE the switch sits, never the guest-list card's own two rows.
 */

/* ── the reel's defaults: the moods as real frames, and the hold's steps ─── */

export function ReelDefaultsCard() {
  const stills = useStills();
  const [mood, setMood] = useState<string>(DEFAULT_MOOD_ID);
  const [hold, setHold] = useState<number>(DEFAULT_HOLD);
  return (
    <Card data-rh-defaults="">
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Clapperboard className="size-4 text-muted-foreground" aria-hidden />
            Highlight reel
          </span>
        </CardTitle>
        <CardDescription>
          Where every guest starts. Anyone can change their own, on their own
          device.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {MOODS.map((m) => {
            const src = stills[`mood-${m.id}`];
            const on = m.id === mood;
            return (
              <button
                key={m.id}
                type="button"
                data-rh-mood={m.id}
                tabIndex={-1}
                onClick={() => setMood(m.id)}
                className="flex flex-col items-center gap-1"
              >
                <span
                  className={cn(
                    "relative block aspect-video w-full overflow-hidden rounded-[var(--radius-tile)] bg-[#07080a]",
                    on &&
                      "ring-2 ring-foreground ring-offset-2 ring-offset-card",
                  )}
                >
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element -- a data url the engine drew
                    <img src={src} alt="" className="size-full object-cover" />
                  ) : null}
                </span>
                <span
                  className={cn(
                    "text-[11px]",
                    on ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Hold</p>
          <div
            data-rh-hold-steps={HOLD_STEPS.length}
            className="flex rounded-lg bg-muted p-0.5"
          >
            {HOLD_STEPS.map((s) => (
              <button
                key={s}
                type="button"
                tabIndex={-1}
                onClick={() => setHold(s)}
                className={cn(
                  "h-7 flex-1 rounded-md text-xs tabular-nums transition-colors duration-150 motion-reduce:transition-none",
                  s === hold
                    ? "bg-background font-medium text-foreground shadow-lift"
                    : "text-muted-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Seconds each photograph stays on screen.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── the switch: beside the guest list, or at the head of the sheet ─────── */

function ReelSwitchRow({ id, line }: { id: string; line: string }) {
  const [on, setOn] = useState(true);
  return (
    <div className="flex items-start justify-between gap-4">
      <Label
        htmlFor={id}
        className="min-w-0 flex-1 cursor-pointer flex-col items-start gap-1 font-normal"
      >
        <span className="text-sm font-medium text-foreground">
          Show the reel
        </span>
        <span className="text-xs leading-relaxed text-muted-foreground">
          {line}
        </span>
      </Label>
      <Switch id={id} checked={on} onCheckedChange={setOn} />
    </div>
  );
}

export function ProfileGuestsCard({
  withReelRow,
}: {
  /** `switch=guestlist`: a third row joins the two shipped ones. */
  withReelRow?: boolean;
}) {
  const [displayInProfile, setDisplayInProfile] = useState(true);
  const [showGuestList, setShowGuestList] = useState(true);
  return (
    <Card data-rh-relevant={withReelRow || undefined}>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" aria-hidden />
            Profile &amp; guests
          </span>
        </CardTitle>
        <CardDescription>
          How this event shows up beyond its own link.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <Label
            htmlFor="rh-display-in-profile"
            className="min-w-0 flex-1 cursor-pointer flex-col items-start gap-1 font-normal"
          >
            <span className="text-sm font-medium text-foreground">
              Show on my profile
            </span>
            <span className="text-xs leading-relaxed text-muted-foreground">
              Lists this event, with its album link, on your public profile
              page.
            </span>
          </Label>
          <Switch
            id="rh-display-in-profile"
            checked={displayInProfile}
            onCheckedChange={setDisplayInProfile}
          />
        </div>

        <div className="flex items-start justify-between gap-4 border-t border-border/60 pt-5">
          <Label
            htmlFor="rh-show-guest-list"
            className="min-w-0 flex-1 cursor-pointer flex-col items-start gap-1 font-normal"
          >
            <span className="text-sm font-medium text-foreground">
              Show the guest list on the album
            </span>
            <span className="text-xs leading-relaxed text-muted-foreground">
              Every guest who added photos is listed by name, for anyone who
              can open the album.
            </span>
          </Label>
          <Switch
            id="rh-show-guest-list"
            checked={showGuestList}
            onCheckedChange={setShowGuestList}
          />
        </div>

        {withReelRow ? (
          <div data-rh-reel-row className="border-t border-border/60 pt-5">
            <ReelSwitchRow
              id="rh-show-reel"
              line="A highlight reel plays from the album's second photo. Off hides it everywhere: the album, the view and any screen."
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

/**
 * The reel's own card at the head of the sheet (`switch=first`), which the
 * screen question's `settings` option also puts its door in.
 */
export function ReelHeadCard({ withScreenRow }: { withScreenRow?: boolean }) {
  return (
    <Card data-rh-relevant>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Clapperboard className="size-4 text-muted-foreground" aria-hidden />
            Highlight reel
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <ReelSwitchRow
          id="rh-head-show-reel"
          line="It plays from the album's second photo. Off hides it everywhere, for everyone."
        />
        {withScreenRow ? (
          <div
            data-rh-screen-row=""
            className="flex items-start justify-between gap-4 border-t border-border/60 pt-5"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium">Play on a screen</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Opens the reel full screen with the code in its corner, in a
                new tab, one press to start.
              </p>
            </div>
            <span className="flex h-7 shrink-0 items-center gap-1.5 rounded-[calc(var(--radius-action)*0.7)] border border-border px-2.5 text-xs font-medium">
              <MonitorPlay className="size-3.5" aria-hidden />
              Open
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** The sheet's remaining cards, never drawn in full: this board has no
 *  question about Details, Visibility or Uploads, so they stand in as three
 *  quiet placeholders rather than spending the reading budget on cards
 *  nobody here is judging. */
export function UnrelatedSettingsCards() {
  return (
    <>
      <UnrelatedCard title="Details: name, date, note for guests" />
      <UnrelatedCard title="Visibility: public, password, custom link" />
      <UnrelatedCard title="Uploads: moderation, verified email, upload cap" />
    </>
  );
}
