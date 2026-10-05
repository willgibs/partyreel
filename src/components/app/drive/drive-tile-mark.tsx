"use client";

/**
 * AN ALBUM'S TILE WEARS ITS SEND'S LIGHT (Will, desk 2: `progress = album`, "its tile on the dashboard wears a
 * light"): "Sending 32%", "Paused", "Partly done", or a fresh "In your Drive", a corner mark on the product's glass as
 * the tile's own marks are drawn. Nothing for an album with no send that matters now, and nothing at all for a host
 * who never sent (the hint cookie: no poll).
 */
import { useEffect, useState } from "react";

import { hasDriveHint } from "@/lib/drive/links";
import { sendForAlbum, tileLight } from "@/lib/drive/moments";
import { GLASS_MARK } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { useDriveStatus } from "./use-drive-status";

const DOT: Record<string, string> = {
  sending: "bg-info",
  paused: "bg-warning",
  done: "bg-success",
  stopped: "bg-muted-foreground",
};

function Listening({ eventId }: { eventId: string }) {
  const { status } = useDriveStatus();
  const send = status ? sendForAlbum(status.sends, eventId) : null;
  const light = send ? tileLight(send) : null;
  if (!light) return null;
  return (
    <span
      data-drive-tile={light.tone}
      className={cn(
        "pointer-events-none flex h-6 items-center gap-1.5 rounded-full pr-2.5 pl-2 text-[11px] leading-none font-medium whitespace-nowrap text-white tabular-nums",
        GLASS_MARK,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block size-1.5 shrink-0 rounded-full",
          DOT[light.tone],
        )}
      />
      {light.label}
    </span>
  );
}

export function DriveTileMark({ eventId }: { eventId: string }) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the hint is the browser's cookie, read after mount
    setActive(hasDriveHint());
  }, []);
  return active ? <Listening eventId={eventId} /> : null;
}
