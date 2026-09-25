"use client";

import { GuardedSwitch } from "@/components/admin/destructive-sheet";

import { toggleLiveReelAction } from "./actions";

// The live reel's platform lever. Off pauses the reel, the screen and the clip creator across every
// event at once (no redeploy: the guest poll and the host dashboard both read it fresh), which is why
// the OFF edge opens the portal's one destructive sheet and says what it touches before it happens
// (`destructive=sheet`, 2026-09-20); ON is a plain tap.
export function LiveReelKillSwitch({ enabled }: { enabled: boolean }) {
  return (
    <GuardedSwitch
      enabled={enabled}
      // Stable feature-name label; the switch carries the state (see the downloads twin for the
      // double-negative WHY).
      label="Live reel"
      description={
        enabled
          ? "On. The reel, the screen and Make your own play on every event."
          : "Paused. No tile, view, screen or Make your own on any event."
      }
      ariaLabel="Toggle the live reel"
      sheet={{
        title: "Pause the live reel?",
        lede: "Every event loses its reel tile, its screen and Make your own until you turn this back on. Nothing is deleted.",
        verb: "Pause the reel",
        touches: [
          "Every host and every guest, on every event",
          "The reel's own guidance and screen disappear; the album underneath is untouched",
          "A host whose reel was live sees it as if they had switched it off themselves",
        ],
      }}
      onToggle={toggleLiveReelAction}
      onMessage="Live reel enabled."
      offMessage="Live reel paused."
    />
  );
}
