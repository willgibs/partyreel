"use client";

import { useState, useTransition } from "react";

import { toast } from "sonner";

import { DestructiveSheet } from "@/components/admin/destructive-sheet";
import { Switch } from "@/components/ui/switch";

import { toggleWatchSwitchAction } from "./actions";

/**
 * The write behind a switch: the Server Function, which every caller gets unless it hands in another. Only the Library
 * does (`library/compositions/spend-watch-demo.tsx`), so a specimen of the card can be pressed through its whole flow (the
 * sheet, the pause, the way back) without a platform switch moving: the action pauses guest uploads for every album, and the
 * lab runs against the real project.
 */
export type WatchToggle = typeof toggleWatchSwitchAction;

/**
 * THE TWO SWITCHES WHOSE HOME IS THE SPEND WATCH'S CARD (guest uploads, lifecycle mail): one press, and its OFF edge
 * opens the portal's one sheet (`destructive=sheet`), which says what pausing reaches before it does. ON is
 * immediate: turning a guard back off is never the expensive act.
 */
export type WatchSwitchCopy = {
  /** The line beside the switch while it is on, and while it is off. */
  on: string;
  off: string;
  title: string;
  lede: string;
  verb: string;
  touches: string[];
};

export function WatchSwitch({
  switchKey,
  label,
  enabled,
  copy,
  toggle = toggleWatchSwitchAction,
}: {
  switchKey: "uploads_enabled" | "lifecycle_mail_enabled";
  label: string;
  enabled: boolean;
  copy: WatchSwitchCopy;
  /** The write behind the switch. Omitted, the Server Function (every page of the portal). */
  toggle?: WatchToggle;
}) {
  const [on, setOn] = useState(enabled);
  const [asking, setAsking] = useState(false);
  const [pending, startTransition] = useTransition();

  function resume() {
    setOn(true);
    startTransition(async () => {
      const res = await toggle(switchKey, true);
      if (!res.ok) {
        setOn(false);
        toast.error(res.message ?? "Couldn't update the switch.");
        return;
      }
      toast.success(`${label} back on.`);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-caption text-muted-foreground">
        {on ? copy.on : copy.off}
      </span>
      <Switch
        checked={on}
        onCheckedChange={(next) => (next ? resume() : setAsking(true))}
        disabled={pending}
        aria-label={`Toggle ${label}`}
      />
      <DestructiveSheet
        open={asking}
        onOpenChange={setAsking}
        title={copy.title}
        lede={copy.lede}
        verb={copy.verb}
        touches={copy.touches}
        severity="reversible"
        successMessage={`${label} paused.`}
        onConfirm={async () => {
          const res = await toggle(switchKey, false);
          if (res.ok) setOn(false);
          return res;
        }}
      />
    </div>
  );
}
