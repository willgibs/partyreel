"use client";

/**
 * The gallery doorbell subscription (Phase 3): listens on the PUBLIC Realtime
 * broadcast channel `gallery:<qr_token>` for the contentless `ping` the
 * media_gallery_doorbell DB trigger sends, coalesces ping bursts, and reports
 * whether the socket is live so the caller can slow its fallback poll.
 *
 * - Public channel by design: possession of the qr_token IS the gallery
 *   capability (database-security.md), and the ping carries no data — the refetch is
 *   access-gated server-side. No Realtime Authorization involved.
 * - Pings funnel through a leading-edge coalescer (refresh-coalescer.ts):
 *   immediate refetch on the first ping, bursts (approve-all, photo dumps)
 *   collapse into one trailing refetch. The coalescer lives inside the
 *   subscription effect, so its lifecycle is exactly the channel's.
 * - `live` is keyed solely off the subscribe status callback, which fires
 *   repeatedly across reconnects (SUBSCRIBED/CHANNEL_ERROR/TIMED_OUT/CLOSED)
 *   — handled idempotently; supabase-js retries the join itself.
 * - The channel stays subscribed while the tab is hidden (heartbeats are
 *   cheap; the caller's refresh-on-visible covers anything missed while the
 *   OS froze the tab).
 */
import { useEffect, useEffectEvent, useState } from "react";

import { createRefreshCoalescer } from "@/lib/guest/refresh-coalescer";
import { createClient } from "@/lib/supabase/client";

export function useGalleryDoorbell({
  qrToken,
  enabled,
  onRefresh,
}: {
  qrToken: string;
  /** Mirrors the poll gate: false for the demo + access==='none'. */
  enabled: boolean;
  /** The (coalesced) refetch. Always the latest closure (Effect Event). */
  onRefresh: () => void;
}): { live: boolean } {
  const [live, setLive] = useState(false);
  const fire = useEffectEvent(onRefresh);

  useEffect(() => {
    if (!enabled) return;
    const coalescer = createRefreshCoalescer(() => fire());
    const supabase = createClient();
    const channel = supabase
      .channel(`gallery:${qrToken}`)
      .on("broadcast", { event: "ping" }, () => coalescer.ping())
      .subscribe((status) => {
        setLive(status === "SUBSCRIBED");
      });
    return () => {
      setLive(false);
      coalescer.dispose();
      void supabase.removeChannel(channel);
    };
  }, [qrToken, enabled]);

  return { live };
}
