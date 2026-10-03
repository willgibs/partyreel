"use client";

import { CameraSettings } from "@/components/app/event-settings/camera-settings";
import {
  SettingsCard,
  SwitchSetting,
} from "@/components/app/event-settings/settings-furniture";
import { useSettings } from "@/components/app/event-settings/settings-state";
import { VideosSwitch } from "@/components/app/event-settings/videos-switch";

/**
 * WHAT GUESTS CAN ADD, AS ITS OWN PAGE (event-settings r1): how guests add and when everyone sees what's added
 * (`camera-settings.tsx`: free uploads or the album's camera, and right away, once you approve each, or at a develop
 * time; today's Review switch lives there now, one of the three, so a host meets it in one place), the pause, and
 * Videos with the size cap tucked under it. Each saves the moment it changes; a change that would show held or
 * waiting photos to everyone asks first, in its own line.
 */
export function AddsPage() {
  const s = useSettings();
  const v = s.values;
  return (
    <SettingsCard label="What guests can add">
      <CameraSettings />
      <SwitchSetting
        label="Accepting uploads"
        line="Turn off to freeze the album. Guests can still view it."
        checked={v.acceptingUploads}
        onCheckedChange={(next) => void s.saveEvent({ acceptingUploads: next })}
      />
      <VideosSwitch />
    </SettingsCard>
  );
}
