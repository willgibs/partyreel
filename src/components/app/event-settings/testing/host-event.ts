/**
 * A HOST'S EVENT, FOR SETTINGS' OWN TESTS: production's defaults for an event made in the wizard
 * (Public, an email first on, a photo first off, uploads open and live, the reel on in the default
 * mood and hold, videos on, and the zone of the browser it was made in: event-zone's capture), with
 * whatever a test needs over it. `time_zone: null` is an event from before the column.
 */
import type { DoorCounts } from "@/lib/db/queries/event-doors";
import type { HostEvent } from "@/lib/db/queries/events";
import { deviceZone } from "@/lib/event/zone";
import type { ReadyFacts } from "@/lib/events/readiness";

export function hostEvent(
  // `time_zone` beside the generated row until the types carry the column (event-zone's seam, `zoneOfRow`).
  over: Partial<HostEvent> & { time_zone?: string | null } = {},
): HostEvent {
  return {
    id: "11111111-2222-4333-8444-555555555555",
    host_id: "host-1",
    name: "Maya's 30th",
    description: null,
    event_date: null,
    visibility: "open",
    door: "open",
    has_password: false,
    accepting_uploads: true,
    require_verified_email: true,
    require_upload_to_view: false,
    moderation_mode: "live",
    max_upload_bytes: null,
    allow_videos: true,
    show_reel: true,
    reel_style_id: null,
    reel_hold_sec: null,
    display_in_profile: false,
    qr_style: "classic",
    qr_token: "0123456789abcdef0123456789abcdef",
    custom_slug: null,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
    deleted_at: null,
    purge_at: null,
    time_zone: deviceZone(),
    ...over,
  } as HostEvent;
}

/** Nobody in, nobody waiting, no list. */
export const NO_COUNTS: DoorCounts = {
  in: 0,
  inByName: 0,
  waiting: 0,
  waitingListed: 0,
  invited: 0,
  joined: 0,
};

/**
 * THE EVENT'S READINESS AS THE HUB READS IT, for Settings' rail: production's new event (Public, uploads
 * open, the reel on), nothing in the album, the code never opened, with whatever a test needs over it.
 */
export function readyFacts(over: Partial<ReadyFacts> = {}): ReadyFacts {
  return {
    door: "open",
    hasPassword: false,
    guestsIn: 0,
    invited: 0,
    acceptingUploads: true,
    approved: 0,
    playable: 0,
    showReel: true,
    liveReelEnabled: true,
    eventDate: null,
    description: null,
    opened: 0,
    storagePct: 0,
    ...over,
  };
}
