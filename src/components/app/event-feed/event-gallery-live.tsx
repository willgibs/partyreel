"use client";

import {
  useHostAlbum,
  useHubLive,
} from "@/components/app/event-feed/host-album";
import { Badge } from "@/components/ui/badge";

/**
 * THE LIVE PIP (Will, `first=live`, 2026-09-21: "It lands while she is looking.
 * The empty room gives way to the tile, the count moves, a Live pip").
 *
 * ★ THE PIP IS THE PAGE'S ONE LIVE ISLAND IN THE HEADER, AND IT DRAWS NOTHING
 * UNTIL THE DOORBELL'S SOCKET IS ACTUALLY SUBSCRIBED: a pip claiming "Live" over
 * a dead socket is worse than no pip. What keeps the album current is the page's
 * album store (`HostAlbumProvider`: the doorbell, the fallback poll, the tab's
 * return), which never refreshes the page; this reads only whether the socket is
 * up.
 */
export function EventLive() {
  const live = useHubLive(useHostAlbum());
  if (!live) return null;
  // The live mark (`ui/badge`'s `live`): its dot and its word are the badge's own.
  return (
    <Badge variant="live" title="New photos appear here as they arrive">
      Live
    </Badge>
  );
}
