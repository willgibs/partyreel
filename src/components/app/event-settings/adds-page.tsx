"use client";

import {
  SettingsCard,
  SwitchSetting,
} from "@/components/app/event-settings/settings-furniture";
import { useSettings } from "@/components/app/event-settings/settings-state";
import { VideosSwitch } from "@/components/app/event-settings/videos-switch";
import { ConfirmSwitch } from "@/components/ui/confirm-switch";

/**
 * WHAT GUESTS CAN ADD, AS ITS OWN PAGE (event-settings r1): the pause, Review, and Videos with the size
 * cap tucked under it. Each saves the moment it changes. Review still asks first where turning it off
 * would put held photos in front of everyone (`ConfirmSwitch`, the long explanation living in its
 * confirm, the carried `one-line`).
 */
export function AddsPage() {
  const s = useSettings();
  const v = s.values;
  const pending = s.pendingCount;
  return (
    <SettingsCard label="What guests can add">
      <SwitchSetting
        label="Accepting uploads"
        line="Turn off to freeze the album. Guests can still view it."
        checked={v.acceptingUploads}
        onCheckedChange={(next) => void s.saveEvent({ acceptingUploads: next })}
      />
      <div className="px-4 py-3">
        <ConfirmSwitch
          label="Review uploads before they appear"
          description="Hold new photos until you approve or reject them, instead of showing them live."
          checked={v.review}
          onCheckedChange={(next) => void s.saveEvent({ review: next })}
          confirmWhen={(next) => !next && pending > 0}
          dialogTitle="Stop reviewing uploads?"
          dialogDescription={
            <>
              {pending === 1
                ? "1 photo is under review. Turning this off approves it and shows it to everyone right away."
                : `${pending} photos are under review. Turning this off approves them and shows them to everyone right away.`}{" "}
              New uploads will then appear live without your review. You can
              turn this back on anytime.
            </>
          }
          confirmLabel={
            pending === 1 ? "Approve it and stop" : "Approve all and stop"
          }
          cancelLabel="Keep reviewing"
        />
      </div>
      <VideosSwitch />
    </SettingsCard>
  );
}
