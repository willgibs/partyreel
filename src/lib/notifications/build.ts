/**
 * Notification center (Phase 6 cut #4) — the PURE builder that turns raw signals into the
 * badge count + panel items. Derive-on-read: there is no feed table; everything is computed
 * from state that already exists (pending media, profile flags) plus broadcast announcements.
 *
 * TWO kinds of notification:
 *   • Derived host ALERTS (review / over-capacity / pass-expiring) are STATE — they show while
 *     the underlying condition holds and clear when it resolves (NOT dismissed by viewing).
 *   • ANNOUNCEMENTS are operator broadcasts with per-host read state (unread until the host
 *     opens the panel, which advances `announcements_seen_at`).
 *
 * Pure + deterministic (takes `now`) so the thresholds/counts are unit-tested. Date FORMATTING
 * is left to the component — items carry raw ISO strings.
 *
 * ★ ONE NUMBER FOR A WAITING QUEUE (`reel-host`, Will 2026-09-25: `review=agree`). The bell's
 * badge, the event card's "N to review" chip and Review's own header read the SAME count: the
 * badge counts each waiting UPLOAD (not one per alert), each review row names its event and opens
 * that event's queue, and every number comes from one definition (pending, outside the bin, on the
 * host's live events). Nothing about review is ever drawn on a reel or a screen: a room watching
 * the reel never sees the host's queue.
 *
 * Adding a new signal later (e.g. co-host invites — see ROADMAP) = one new field here + one
 * read in `getNotificationData`. Keep it that simple.
 */
import { DRIVE_ACCOUNT_PATH } from "@/lib/drive/links";
import { stopTitle } from "@/lib/drive/moments";
import { peopleWaiting } from "@/lib/event/door/words";
import { roomHref } from "@/lib/event/sections";
import { RECOVERY_PURGE_NUDGE_DAYS } from "@/lib/lifecycle/recently-deleted";
import { RENEWAL_NUDGE_DAYS } from "@/lib/lifecycle/renewal";

const DAY_MS = 86_400_000;

export type NotificationKind =
  | "door"
  | "review"
  | "over_capacity"
  | "pass_expiring"
  | "recovery_clearing"
  | "drive"
  | "announcement";

export type NotificationItem = {
  key: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  /** Raw ISO date for items with a deadline/timestamp; the component formats it. */
  date?: string;
  href: string | null;
  /** Alerts are always highlighted; announcements only while unread. */
  unread: boolean;
};

/** One event's waiting queue, as the bell names it. */
export type PendingEvent = {
  eventId: string;
  eventName: string;
  /** Uploads waiting on the host's review: the event card's chip and Review's header count. */
  pending: number;
};

/**
 * One event's door, as the bell names it (the doors, event-settings r1): newcomers waiting for the
 * host to let them in, counted like a waiting queue, each opening that event's At the door.
 */
export type DoorWaitingEvent = {
  eventId: string;
  eventName: string;
  waiting: number;
};

export type AnnouncementInput = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  published_at: string;
};

/** One Send to Google Drive stop that waits on her (the strip's own title; `partly_done` for files left short). */
export type DriveStopSignal = {
  jobId: string;
  eventId: string | null;
  albumName: string;
  reason: string;
};

export type NotificationSignals = {
  /** Count of media awaiting approval across the host's live events (RLS-scoped upstream). */
  pendingCount: number;
  /**
   * The same queue per event, when the caller has it: one review row per event, naming it and
   * opening its queue. Absent (a lab board, an older caller), the bell falls back to one row over
   * `pendingCount` that lands on the dashboard.
   */
  pendingByEvent?: PendingEvent[];
  /** People waiting at each event's door. Absent reads as nobody, as before the doors. */
  doorByEvent?: DoorWaitingEvent[];
  storageGraceUntil: string | null;
  /** DB `profiles.tier` value. */
  tier: string;
  tierExpiresAt: string | null;
  /** Soonest upcoming hard-purge across the host's removed media + soft-deleted events (min purge_at), or null. */
  recoverySoonestPurgeAt: string | null;
  /** Recent published announcements (already filtered/limited upstream). */
  announcements: AnnouncementInput[];
  announcementsSeenAt: string | null;
  /** Send to Google Drive's stops that wait on her (drive-export.md); absent for a host who never used Drive. */
  driveStops?: DriveStopSignal[];
  now?: Date;
};

export type NotificationSummary = {
  items: NotificationItem[];
  /**
   * Uploads waiting + the other active alerts + unread announcements. Alerts persist;
   * announcements clear on view. A waiting queue counts each upload, so a host with one event
   * reads the same number on the bell as on the card and in Review.
   */
  badgeCount: number;
};

const uploadsToReview = (n: number) =>
  `${n} ${n === 1 ? "upload" : "uploads"} to review`;

// The door's words are the room's and the pulse's too (`lib/event/door/words.ts`).
const peopleAtTheDoor = (n: number) => `${peopleWaiting(n)} at the door`;

export function buildNotifications(
  signals: NotificationSignals,
): NotificationSummary {
  const now = signals.now ?? new Date();
  const items: NotificationItem[] = [];
  let alertCount = 0;

  // Most urgent first: over-capacity (will auto-reduce) → pass-expiring → review.
  if (signals.storageGraceUntil) {
    items.push({
      key: "over_capacity",
      kind: "over_capacity",
      title: "You're over your storage limit",
      body: "Upgrade or remove media before we auto-reduce it.",
      date: signals.storageGraceUntil,
      href: "/pricing",
      unread: true,
    });
    alertCount++;
  }

  if (signals.tier === "event_pass" && signals.tierExpiresAt) {
    const expiresMs = new Date(signals.tierExpiresAt).getTime();
    if (expiresMs <= now.getTime() + RENEWAL_NUDGE_DAYS * DAY_MS) {
      items.push({
        key: "pass_expiring",
        kind: "pass_expiring",
        title: "Your Event Pass is expiring",
        body: "Renew to keep your extra storage.",
        date: signals.tierExpiresAt,
        href: "/dashboard",
        unread: true,
      });
      alertCount++;
    }
  }

  // Recently-deleted items nearing permanent purge (the in-app nudge; bell-only by design, so we
  // never email a host about what they intentionally deleted). Threshold mirrors pass-expiry.
  if (signals.recoverySoonestPurgeAt) {
    const purgeMs = new Date(signals.recoverySoonestPurgeAt).getTime();
    if (purgeMs <= now.getTime() + RECOVERY_PURGE_NUDGE_DAYS * DAY_MS) {
      items.push({
        key: "recovery_clearing",
        kind: "recovery_clearing",
        title: "Items in Deleted are about to be cleared",
        body: "Restore anything you want to keep, or it's gone for good.",
        date: signals.recoverySoonestPurgeAt,
        href: "/dashboard",
        unread: true,
      });
      alertCount++;
    }
  }

  // Send to Google Drive's stops that wait on her: a stop she cannot miss reaches the bell too, standing while the
  // stop does and opening the album it sends (Account, for a lost connection).
  for (const stop of signals.driveStops ?? []) {
    items.push({
      key: `drive:${stop.jobId}`,
      kind: "drive",
      title: stopTitle(stop.reason, stop.albumName),
      body: stop.albumName,
      href:
        stop.reason === "disconnected"
          ? DRIVE_ACCOUNT_PATH
          : stop.eventId
            ? `/dashboard/${stop.eventId}`
            : "/dashboard",
      unread: true,
    });
    alertCount++;
  }

  // ★ PEOPLE AT THE DOOR, FIRST OF THE QUEUES (the doors, event-settings r1: a waiting newcomer
  // counts wherever the host is told about held uploads): one row per event, opening its Guests
  // room over the hub (event-header r2, `rooms=over`), At the door its first section, the badge
  // counting every person as the Guests card does.
  let waitingPeople = 0;
  for (const door of signals.doorByEvent ?? []) {
    if (door.waiting <= 0) continue;
    items.push({
      key: `door:${door.eventId}`,
      kind: "door",
      title: peopleAtTheDoor(door.waiting),
      body: door.eventName,
      href: roomHref(door.eventId, "guests"),
      unread: true,
    });
    waitingPeople += door.waiting;
  }

  // A waiting queue: one row per event when the caller knows them, each opening that event's
  // Review room over its hub, the badge counting every upload so it reads the card's and the room's number.
  let waitingUploads = 0;
  if (signals.pendingByEvent) {
    for (const queue of signals.pendingByEvent) {
      if (queue.pending <= 0) continue;
      items.push({
        key: `review:${queue.eventId}`,
        kind: "review",
        title: uploadsToReview(queue.pending),
        body: queue.eventName,
        href: roomHref(queue.eventId, "review"),
        unread: true,
      });
      waitingUploads += queue.pending;
    }
  } else if (signals.pendingCount > 0) {
    items.push({
      key: "review",
      kind: "review",
      title: uploadsToReview(signals.pendingCount),
      body: "Guests are waiting for your approval.",
      href: "/dashboard",
      unread: true,
    });
    waitingUploads = signals.pendingCount;
  }

  // Announcements last (unread highlighted). Unread = published after the host's seen marker.
  const seenMs = signals.announcementsSeenAt
    ? new Date(signals.announcementsSeenAt).getTime()
    : 0;
  let unreadAnnouncements = 0;
  for (const a of signals.announcements) {
    const unread = new Date(a.published_at).getTime() > seenMs;
    if (unread) unreadAnnouncements++;
    items.push({
      key: `announcement:${a.id}`,
      kind: "announcement",
      title: a.title,
      body: a.body,
      date: a.published_at,
      href: a.href,
      unread,
    });
  }

  return {
    items,
    badgeCount:
      alertCount + waitingPeople + waitingUploads + unreadAnnouncements,
  };
}
