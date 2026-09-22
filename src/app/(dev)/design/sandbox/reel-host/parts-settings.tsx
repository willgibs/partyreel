"use client";

import { useState } from "react";
import { Clapperboard, Users } from "lucide-react";

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

import { DEFAULT_MOOD_ID, MOOD_SWATCH, MOODS } from "./fixtures";
import { UnrelatedCard } from "./scene";

/**
 * THE SETTINGS SHEET'S PIECES, QUOTED (`event-settings/profile-social-card.tsx`'s
 * own rows and classes, copied rather than imported: the real component reaches
 * `updateEventSocialSettingsAction` on every flip, a Server Function this board
 * must never call). Local `useState` stands in for the optimistic mutation.
 *
 * ★ EVERY PIECE HOLDS THE REST OF THE SHEET STEADY. `style`'s two sheet
 * options vary only whether the moods row exists; `switch`'s two settings
 * options vary only WHERE the reel's own switch sits, never the guest-list
 * card's own two rows, which is why `ProfileGuestsCard` takes a boolean
 * rather than growing three near-identical copies.
 */

/* ── style: eight moods, one card ────────────────────────────────────────── */

export function ReelMoodsCard() {
  const [selected, setSelected] = useState(DEFAULT_MOOD_ID);
  return (
    <Card data-rh-relevant>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Clapperboard className="size-4 text-reel" aria-hidden />
            Reel
          </span>
        </CardTitle>
        <CardDescription>
          The mood everyone sees by default. Anyone can switch it on their own
          device, free.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div data-rh-moods-row className="grid grid-cols-4 gap-2">
          {MOODS.map((mood) => (
            <button
              key={mood.id}
              type="button"
              data-rh-mood={mood.id}
              onClick={() => setSelected(mood.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border p-2 text-[11px] font-medium transition-colors",
                mood.id === selected
                  ? "border-reel bg-reel/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/25",
              )}
            >
              <span
                className="h-8 w-full rounded-md"
                style={{ background: MOOD_SWATCH[mood.id] }}
                aria-hidden
              />
              {mood.label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── switch: beside the guest list, or its own head card ────────────────── */

export function ProfileGuestsCard({
  withReelRow,
}: {
  /** `switch=guestlist`: a third row joins the two shipped ones. Omitted (the
   *  other two settings options) draws the card exactly as it ships today. */
  withReelRow?: boolean;
}) {
  const [displayInProfile, setDisplayInProfile] = useState(true);
  const [showGuestList, setShowGuestList] = useState(true);
  const [showReel, setShowReel] = useState(true);
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

        {withReelRow && (
          <div
            data-rh-reel-row
            className="flex items-start justify-between gap-4 border-t border-border/60 pt-5"
          >
            <Label
              htmlFor="rh-show-reel"
              className="min-w-0 flex-1 cursor-pointer flex-col items-start gap-1 font-normal"
            >
              <span className="text-sm font-medium text-foreground">
                Show the reel
              </span>
              <span className="text-xs leading-relaxed text-muted-foreground">
                A live highlight reel plays from the album; guests can switch
                its look and make their own cut. Off hides it everywhere.
              </span>
            </Label>
            <Switch
              id="rh-show-reel"
              checked={showReel}
              onCheckedChange={setShowReel}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ReelHeadCard() {
  const [showReel, setShowReel] = useState(true);
  return (
    <Card data-rh-relevant>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Clapperboard className="size-4 text-reel" aria-hidden />
            Reel
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <Label
            htmlFor="rh-head-show-reel"
            className="min-w-0 flex-1 cursor-pointer flex-col items-start gap-1 font-normal"
          >
            <span className="text-sm font-medium text-foreground">
              Show the reel
            </span>
            <span className="text-xs leading-relaxed text-muted-foreground">
              A live highlight reel plays from the album from the third
              photo. Off hides it everywhere, for everyone.
            </span>
          </Label>
          <Switch
            id="rh-head-show-reel"
            checked={showReel}
            onCheckedChange={setShowReel}
          />
        </div>
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
