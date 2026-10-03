"use client";

/**
 * THE GALLERY DOORBELL: the PUBLIC Realtime broadcast channel `gallery:<qr_token>`, on which the
 * `media_gallery_doorbell` DB trigger sends a contentless `ping` whenever what the album shows (or what waits) changes.
 * Every album surface hears it here (the guest's album, the host's, the dashboard's live stage), and each answers a
 * ping with its own one sync.
 *
 * - Public channel by design: possession of the qr_token IS the gallery capability (database-security.md), and the
 *   ping carries no data; the refetch is access-gated server-side. No Realtime Authorization involved.
 * - ★ PINGS LAND IN CALM BATCHES (album-calm): they funnel through the batch clock (`refresh-coalescer.ts`), so every
 *   ping heard before this device's next tick is answered by one sync at the tick, about every fifteen seconds while
 *   guests upload, and a quiet album asks nothing. The coalescer lives inside one join of the channel, so its life is
 *   exactly the channel's.
 * - ★ A MOMENT RINGS AT ONCE (crumbs-61, red-team 48's LOW): the batch clock is for a stream of arrivals, and a develop is
 *   one write that moves every sealed shot, so its ring (`album_doorbell`, the one ring for a write that held its per-row
 *   pings) says so in its payload (`{ moment: true }`; an arrival's is contentless) and the album asks at once, the sync
 *   covering every ping heard before it. A ring that says nothing (every arrival, and a database that has not yet been
 *   told to say it) waits for the tick as before, so a deploy of this ahead of its migration changes nothing.
 * - ★ A HIDDEN TAB IS NO LISTENER (album-calm; Will: "background tabs can stop syncing, that's needlessly draining
 *   resources for something that isn't being watched"). A broadcast is billed one message a listener, so the moment
 *   the tab hides it LEAVES the channel and drops a batch waiting for its tick; a ping already on the wire is never
 *   answered. supabase-js keeps the empty socket 50 s (`disconnectOnEmptyChannelsAfterMs`, twice its heartbeat,
 *   measured: a tab back inside it rejoins on the same socket) and then closes it, so a long hidden spell holds no
 *   connection either. It joins again when the tab comes back. The catch-up is NOT this hook's: the live poll's
 *   return (`use-live-poll.ts`) asks once, at once, so a return is one sync, and what it missed arrives through the
 *   album's own new-media entry.
 * - ★ A JOIN WAITS FOR ANY LEAVE OF ITS TOPIC. supabase-js hands back the SAME channel while one by that topic is
 *   still in its list, and a channel still leaving ignores `subscribe`, so a join made inside a leave's round trip
 *   would sit deaf for good: a tab hidden and shown in a blink, and a remount (the album's `key={access}` flip, React's
 *   own double mount in development), whose old line's leave is still in flight when the new one joins. Every leave
 *   in flight is kept by client and topic, and a join goes once it has landed (`removeChannel` resolves on the ack,
 *   or on its own timeout).
 * - `live` is the channel's own word (SUBSCRIBED, or not: CHANNEL_ERROR, TIMED_OUT, CLOSED), across reconnects that
 *   supabase-js retries itself, and the caller slows its fallback poll on it. ★ A tab coming back keeps its last word
 *   while its channel rejoins, for `REJOIN_GRACE_MS` at most, so the host's Live mark never blinks on every return,
 *   and a rejoin refused, or not answered in time, says so. A leave's own CLOSED is never read as the socket
 *   dropping. While hidden it says nothing new: the poll is stopped then anyway.
 */
import { useEffect, useEffectEvent, useState } from "react";

import {
  createRefreshCoalescer,
  isMoment,
  type RefreshCoalescer,
} from "@/lib/guest/refresh-coalescer";
import { createClient } from "@/lib/supabase/client";

/**
 * How long a returning tab's `live` stands on its last word while the channel rejoins: a rejoin is a round trip or
 * two (a new socket, then the join), well inside it, and one that takes longer is treated as the socket it may be.
 */
export const REJOIN_GRACE_MS = 3_000;

/** The page's visibility, as the doorbell reads it (the document; a test hands a stand-in). */
export type PageVisibility = {
  readonly hidden: boolean;
  addEventListener(type: "visibilitychange", listener: () => void): void;
  removeEventListener(type: "visibilitychange", listener: () => void): void;
};

type BrowserClient = ReturnType<typeof createClient>;
type DoorbellChannel = ReturnType<BrowserClient["channel"]>;
type DoorbellClient = Pick<BrowserClient, "channel" | "removeChannel">;

/** Leaves still in flight, by client and topic: a join on that topic waits for them (see the head note). */
const leavesInFlight = new WeakMap<
  DoorbellClient,
  Map<string, Promise<void>>
>();

/**
 * ONE LINE TO THE DOORBELL for as long as it is open: joined while the page is visible, left while it is hidden,
 * every ping answered at the batch clock's next tick with `fire`. `close()` ends it (an unmount).
 */
export function connectDoorbell({
  client,
  topic,
  fire,
  setLive,
  doc = document,
  coalescer,
}: {
  client: DoorbellClient;
  topic: string;
  /** The sync a batch of pings asks for. */
  fire: () => void;
  /** Told each time the channel's word changes. */
  setLive: (live: boolean) => void;
  doc?: PageVisibility;
  /** The batch clock's knobs (a test's phase); the product takes the defaults. */
  coalescer?: Parameters<typeof createRefreshCoalescer>[1];
}): { close: () => void } {
  let closed = false;
  let channel: DoorbellChannel | null = null;
  let batch: RefreshCoalescer | null = null;
  /** The leave this line is waiting on before it joins (its own, or a predecessor's on the same topic). */
  let awaiting: Promise<void> | null = null;
  let live = false;
  let grace: ReturnType<typeof setTimeout> | null = null;

  const report = (next: boolean) => {
    if (next === live) return;
    live = next;
    setLive(next);
  };
  const endGrace = () => {
    if (grace) clearTimeout(grace);
    grace = null;
  };

  function join() {
    const pings = createRefreshCoalescer(fire, coalescer);
    batch = pings;
    // A return keeps its last word while it rejoins, never longer than the grace.
    if (live)
      grace = setTimeout(() => {
        grace = null;
        report(false);
      }, REJOIN_GRACE_MS);
    const joined = client.channel(topic);
    channel = joined;
    joined
      // A ping on the wire for a channel this line has left is never answered: the return's catch-up covers it.
      .on("broadcast", { event: "ping" }, (message: unknown) => {
        if (channel !== joined) return;
        if (isMoment(message)) pings.moment();
        else pings.ping();
      })
      .subscribe((status) => {
        // A channel this line has left: its CLOSED is the leave's own, not the socket dropping.
        if (channel !== joined) return;
        endGrace();
        report(status === "SUBSCRIBED");
      });
  }

  function leave(gone: DoorbellChannel) {
    channel = null;
    batch?.dispose();
    batch = null;
    endGrace();
    let inFlight = leavesInFlight.get(client);
    if (!inFlight) leavesInFlight.set(client, (inFlight = new Map()));
    const landed = () => {
      if (inFlight.get(topic) === left) inFlight.delete(topic);
    };
    const left: Promise<void> = client.removeChannel(gone).then(landed, landed);
    inFlight.set(topic, left);
  }

  /** Bring the line to what the page wants now: joined while visible and open, left otherwise. */
  function settle() {
    const wanted = !closed && !doc.hidden;
    if (!wanted) {
      if (channel) leave(channel);
      return;
    }
    if (channel) return;
    const pending = leavesInFlight.get(client)?.get(topic);
    if (!pending) {
      join();
      return;
    }
    if (awaiting === pending) return; // already waiting on it
    awaiting = pending;
    void pending.then(() => {
      if (awaiting === pending) awaiting = null;
      settle();
    });
  }

  doc.addEventListener("visibilitychange", settle);
  settle();

  return {
    close() {
      if (closed) return;
      closed = true;
      doc.removeEventListener("visibilitychange", settle);
      settle();
      report(false);
    },
  };
}

export function useGalleryDoorbell({
  qrToken,
  enabled,
  onRefresh,
}: {
  qrToken: string;
  /** Mirrors the poll gate: false for the demo + access==='none'. */
  enabled: boolean;
  /** The (batched) refetch. Always the latest closure (Effect Event). */
  onRefresh: () => void;
}): { live: boolean } {
  const [live, setLive] = useState(false);
  const fire = useEffectEvent(onRefresh);

  useEffect(() => {
    if (!enabled) return;
    const line = connectDoorbell({
      client: createClient(),
      topic: `gallery:${qrToken}`,
      fire: () => fire(),
      setLive,
    });
    return () => line.close();
  }, [qrToken, enabled]);

  return { live };
}
