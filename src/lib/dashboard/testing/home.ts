import type { HomeContext, HomeEvent } from "@/lib/dashboard/home-event";
import type { HostedEvent } from "@/lib/dashboard/home-view";

/**
 * The dashboard's facts for a test, settled by default: dated nothing, an open album with nothing in
 * it, nobody waiting, readiness read and ready but for the code. A test states only what it is about.
 */
export function homeEvent(over: Partial<HomeEvent> = {}): HomeEvent {
  return {
    id: "e1",
    name: "Maya's 30th",
    date: null,
    lastArrival: null,
    createdAt: "2026-09-01T12:00:00.000Z",
    door: "open",
    hasPassword: false,
    acceptingUploads: true,
    showReel: true,
    description: "Add everything you take tonight.",
    approved: 0,
    pending: 0,
    waiting: 0,
    playable: 0,
    ready: { opened: 3, guestsIn: 0 },
    arrivals: { today: 0, lastHour: 0 },
    ...over,
  };
}

/** A hosted event as the page reads it, its tile and its code's facts filled. */
export function hostedEvent(over: Partial<HostedEvent> = {}): HostedEvent {
  return {
    ...homeEvent(over),
    qrToken: `qr-${over.id ?? "e1"}`,
    qrStyle: "classic",
    stills: [],
    uploadsLabel: "Open",
    dateLabel: "No date set",
    ...over,
  };
}

/** The viewer's day, in the afternoon, with room on the shelf and the reel's lever on. */
export function homeContext(
  today: string,
  over: Partial<HomeContext> = {},
): HomeContext {
  return {
    today,
    evening: false,
    liveReelEnabled: true,
    storagePct: 10,
    ...over,
  };
}
