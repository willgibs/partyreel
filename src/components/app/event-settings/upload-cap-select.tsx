"use client";

import { useId } from "react";

import { useSettings } from "@/components/app/event-settings/settings-state";
import { UPLOAD_CAP_PRESETS } from "@/lib/media/limits";

/**
 * MAX SIZE PER UPLOAD: caps any one guest file, so one guest can't fill the host's storage (the host's
 * own uploads are exempt, in the RPCs). A native select on production's classes, saved as it changes.
 */
export function UploadCapSelect() {
  const s = useSettings();
  const id = useId();
  const value = s.values.maxUploadBytes;
  return (
    <div className="space-y-1.5 pt-1">
      <label htmlFor={id} className="text-sm font-medium">
        Max size per upload
      </label>
      <select
        id={id}
        className="h-8 w-full min-w-0 cursor-pointer rounded-lg px-2.5 py-1 text-base transition-colors outline-none field-well focus-halo md:text-sm"
        value={value == null ? "" : String(value)}
        onChange={(e) =>
          void s.saveEvent({
            maxUploadBytes:
              e.target.value === "" ? null : Number(e.target.value),
          })
        }
      >
        {UPLOAD_CAP_PRESETS.map((preset) => (
          <option
            key={preset.label}
            value={preset.bytes == null ? "" : String(preset.bytes)}
          >
            {preset.label}
          </option>
        ))}
      </select>
      <p className="text-caption text-pretty text-muted-foreground">
        Caps any one guest file, so one video can&rsquo;t fill your storage.
      </p>
    </div>
  );
}
