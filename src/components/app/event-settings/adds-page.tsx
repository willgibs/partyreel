"use client";

import { AlbumStyleSettings } from "@/components/app/event-settings/camera-settings";
import { SwitchSetting } from "@/components/app/event-settings/settings-furniture";
import { useSettings } from "@/components/app/event-settings/settings-state";
import { VideosSwitch } from "@/components/app/event-settings/videos-switch";

/**
 * WHAT GUESTS CAN ADD, AS ITS OWN PAGE (event-settings r1), told as album styles (the-wait r1, Will's pick of option
 * 2's Settings: "cleaner design/presentation, difference feels more clear"): one pick of Live, Review or Disposable,
 * each a card with its picture (`camera-settings.tsx`); under them the develop time where the album has one, the pause,
 * and Videos with the size cap tucked under it; then Customize, where how guests add and when everyone sees stand
 * apart. Each saves the moment it changes; a change that would show held or waiting photos to everyone asks first, in
 * its own line.
 */
export function AddsPage() {
  const s = useSettings();
  const v = s.values;
  return (
    <AlbumStyleSettings>
      <SwitchSetting
        label="Accepting uploads"
        line="Turn off to freeze the album. Guests can still view it."
        checked={v.acceptingUploads}
        onCheckedChange={(next) => void s.saveEvent({ acceptingUploads: next })}
      />
      <VideosSwitch />
    </AlbumStyleSettings>
  );
}
