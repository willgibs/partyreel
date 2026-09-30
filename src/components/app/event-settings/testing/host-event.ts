/**
 * A HOST'S EVENT, FOR SETTINGS' OWN TESTS: production's defaults for an event made in the wizard
 * (Public, an email first on, a photo first off, uploads open and live, the reel on in the default
 * mood and hold, videos on), with whatever a test needs over it.
 */
import type { DoorCounts } from "@/lib/db/queries/event-doors";
import type { HostEvent } from "@/lib/db/queries/events";

export function hostEvent(over: Partial<HostEvent> = {}): HostEvent {
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
