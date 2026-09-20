"use client";

import { GuardedSwitch } from "@/components/admin/destructive-sheet";

import { toggleExportsAction } from "./actions";

// The "Download all" kill-switch. Off pauses ALL new exports platform-wide within ~2 min (no Worker
// redeploy), which is why the OFF edge now opens the portal's one destructive sheet and says what it
// touches before it happens (`destructive=sheet`, 2026-09-20); ON is a plain tap.
export function ExportKillSwitch({ enabled }: { enabled: boolean }) {
  return (
    <GuardedSwitch
      enabled={enabled}
      // Stable feature-name label; the switch carries the state (see the reels twin for the
      // double-negative WHY).
      label="Album downloads"
      description={
        enabled
          ? "On. Hosts and guests can download albums."
          : "Paused. New downloads are blocked across the platform."
      }
      ariaLabel="Toggle downloads"
      sheet={{
        title: "Pause album downloads?",
        lede: "Every new download is refused until you turn this back on. Downloads already in progress finish.",
        verb: "Pause downloads",
        touches: [
          "Every host and every guest, on every event",
          "Downloads already running are not interrupted",
          "Nobody is told: a paused download reads as a refusal",
        ],
      }}
      onToggle={toggleExportsAction}
      onMessage="Downloads enabled."
      offMessage="Downloads paused."
    />
  );
}
