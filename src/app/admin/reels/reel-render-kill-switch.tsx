"use client";

import { GuardedSwitch } from "@/components/admin/destructive-sheet";

import { toggleReelRenderAction } from "./actions";

// The reel-render kill-switch. Off pauses ALL new reel video renders platform-wide (in-flight renders
// finish + still land in R2), so the OFF edge opens the portal's one destructive sheet and names what
// it touches (`destructive=sheet`, 2026-09-20); ON is a plain tap.
export function ReelRenderKillSwitch({ enabled }: { enabled: boolean }) {
  return (
    <GuardedSwitch
      enabled={enabled}
      /* A STABLE feature-name label: a state-describing label ("Reel videos paused") next to
         an OFF switch reads as "pausing is off" (the double-negative trap; it confused the
         operator in the M1 drill). The switch position carries the state; the caption spells
         it out. */
      label="Reel video renders"
      description={
        enabled
          ? "On. Hosts can render their highlight reel to video."
          : "Paused. New renders are blocked across the platform."
      }
      ariaLabel="Toggle reel videos"
      sheet={{
        title: "Pause reel video renders?",
        lede: "Every new render is refused until you turn this back on. Renders already running finish and still land in R2.",
        verb: "Pause renders",
        touches: [
          "Every host on every event, for new renders only",
          "Renders in flight finish and are kept",
          "A host who asks for one sees the reel refuse to render",
        ],
      }}
      onToggle={toggleReelRenderAction}
      onMessage="Reel videos enabled."
      offMessage="Reel videos paused."
    />
  );
}
