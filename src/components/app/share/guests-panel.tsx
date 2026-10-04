"use client";

import { lazy, Suspense, useEffect, useState } from "react";

import { readGuestsRoomAction } from "@/app/(app)/dashboard/[eventId]/actions";
import type { GuestsRoomData } from "@/app/(app)/dashboard/[eventId]/guests/room.server";
import { Button } from "@/components/ui/button";
import type { Door } from "@/lib/event/door/door";

import { useEventShare } from "./event-share-provider";
import { RoomPanel, RoomShimmer } from "./room-panel";
import { loadGuestsRoom } from "./room-chunks";

const GuestsRoomLazy = lazy(() =>
  loadGuestsRoom().then((m) => ({ default: m.GuestsRoom })),
);

/**
 * THE GUESTS ROOM'S LAST READ, per event, for this page's life: a room opened again shows what it showed at once and
 * is read afresh behind it (the room's acts each revalidate the hub, so a newer read is never far behind), and a press
 * that started the read on the way in (`prefetchGuestsRoom`, the card's pointer coming down) hands its answer over.
 */
const reads = new Map<
  string,
  {
    at: number;
    answer: Promise<GuestsRoomData | null>;
    room: GuestsRoomData | null;
  }
>();

/** A read younger than this is the room's answer as it opens; an older one is shown while a new one is asked. */
const FRESH_MS = 10_000;

function ask(eventId: string): Promise<GuestsRoomData | null> {
  const held = reads.get(eventId);
  if (held && Date.now() - held.at < FRESH_MS) return held.answer;
  const answer = readGuestsRoomAction(eventId).then(
    (res) => (res.ok ? res.room : null),
    () => null,
  );
  const entry = { at: Date.now(), answer, room: held?.room ?? null };
  reads.set(eventId, entry);
  void answer.then((room) => {
    if (room && reads.get(eventId) === entry) entry.room = room;
  });
  return answer;
}

/** On intent (the card's press beginning): the room's read is on its way before the click lands. */
export function prefetchGuestsRoom(eventId: string) {
  void ask(eventId);
}

/** The newer of two reads of the room (each says when the server read it). */
function newer(
  a: GuestsRoomData | null,
  b: GuestsRoomData | null,
): GuestsRoomData | null {
  if (!a) return b;
  if (!b) return a;
  return b.readAt > a.readAt ? b : a;
}

/**
 * THE GUESTS ROOM IN ITS PANEL OVER THE HUB (event-header r2, `rooms=over`): the one panel (`RoomPanel`), and in it
 * the room (`guests-room.tsx`, a chunk of its own, warmed on the card's intent), drawn from the newest read there is:
 * the hub's own render's (`served`, whenever its address names the room: a link, a reload, and each act in the room,
 * whose action revalidates the hub) or the room's own ask (a card that opened it in place writes the address without
 * the server). Until the first read lands, the room's shimmer; a read that fails says so, with Try again.
 */
export function GuestsPanel({
  open,
  onOpenChange,
  eventId,
  eventName,
  joinUrl,
  qrStyle,
  door,
  served,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventName: string;
  joinUrl: string;
  qrStyle: string;
  door: Door;
  /** The hub's own read of the room, when its render's address named it. */
  served: GuestsRoomData | null;
}) {
  return (
    <RoomPanel
      room="guests"
      open={open}
      onOpenChange={onOpenChange}
      title="Guests"
      eventName={eventName}
    >
      <GuestsPanelBody
        eventId={eventId}
        eventName={eventName}
        joinUrl={joinUrl}
        qrStyle={qrStyle}
        door={door}
        served={served}
      />
    </RoomPanel>
  );
}

/** Mounted while the panel is open (its content unmounts as it closes): the read starts as the room opens. */
function GuestsPanelBody({
  eventId,
  eventName,
  joinUrl,
  qrStyle,
  door,
  served,
}: {
  eventId: string;
  eventName: string;
  joinUrl: string;
  qrStyle: string;
  door: Door;
  served: GuestsRoomData | null;
}) {
  const { openSheet, takeAnchor } = useEventShare();
  // What this page last read of the room, shown at once while a fresh read is asked.
  const [fetched, setFetched] = useState<GuestsRoomData | null>(
    () => reads.get(eventId)?.room ?? null,
  );
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // The section the room's opener named, taken once as the room opens.
  const [anchor] = useState(takeAnchor);

  // The newest read the hub's renders have brought, kept: a render that lands late with an older read (two acts'
  // answers crossing) never undoes a newer one (adjusted during render, the sanctioned "state from a prop" shape).
  const [kept, setKept] = useState(served);
  if (served && served !== kept && newer(kept, served) === served)
    setKept(served);
  // As the room opens (and on Try again): a served read as new as the page is the room's answer already; anything
  // else asks. Not again when the hub's render brings a newer read: that one simply wins (`newer`).
  const servedAt = served?.readAt ?? null;
  useEffect(() => {
    if (attempt === 0 && servedAt !== null && Date.now() - servedAt < FRESH_MS)
      return;
    let alive = true;
    void ask(eventId).then((room) => {
      if (!alive) return;
      if (room) {
        setFailed(false);
        setFetched(room);
      } else setFailed(true);
    });
    return () => {
      alive = false;
    };
    // The served read is asked about as the room opens, never each time the hub's render brings a newer one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, attempt]);

  const data = newer(kept, fetched);
  if (!data) {
    if (failed) {
      return (
        <div
          data-guests-unread=""
          className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-5"
        >
          <p className="text-sm text-muted-foreground">
            Couldn&rsquo;t load your guests.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              reads.delete(eventId);
              setFailed(false);
              setAttempt((n) => n + 1);
            }}
          >
            Try again
          </Button>
        </div>
      );
    }
    return <RoomShimmer shape="list" />;
  }
  return (
    <Suspense fallback={<RoomShimmer shape="list" />}>
      <GuestsRoomLazy
        eventId={eventId}
        eventName={eventName}
        joinUrl={joinUrl}
        qrStyle={qrStyle}
        door={door}
        data={data}
        anchor={anchor}
        onEverything={() => openSheet("share")}
      />
    </Suspense>
  );
}
