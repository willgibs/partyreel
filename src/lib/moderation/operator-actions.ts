import { z } from "zod";

import type { GridMedia } from "@/components/app/media-grid";
import type { Tables } from "@/lib/db/types";

/**
 * Pure (IO-free) domain helpers for the admin Albums browser (P5 — proactive moderation).
 * Lives apart from the query/action/presign layers so it imports cleanly into BOTH server
 * (queries, presign, the server actions) and client (the moderation grid) code, and so the
 * write payloads + filter parsing are unit-testable without a DB. No env, no IO.
 */

type MediaStatus = Tables<"media">["status"];
type MediaKind = Tables<"media">["type"];

// The album status filter for the feed. "all" = active (everything that is NOT removed); the
// other tabs narrow to one status. "removed" is how the operator finds items to restore.
// Single source: the filter tabs + the page query both read this (mirrors triage.ts).
export const ALBUM_FILTERS = [
  "all",
  "pending",
  "approved",
  "hidden",
  "removed",
] as const;
export type AlbumFilter = (typeof ALBUM_FILTERS)[number];

export const albumFilterSchema = z.enum(ALBUM_FILTERS);

/** Coerce a raw `?status=` value (string | undefined) to a filter; anything unknown → "all". */
export function parseAlbumFilter(raw: string | undefined): AlbumFilter {
  return albumFilterSchema.catch("all").parse(raw);
}

export const ALBUM_FILTER_META: Record<AlbumFilter, { label: string }> = {
  all: { label: "Active" },
  pending: { label: "Pending" },
  approved: { label: "Approved" },
  hidden: { label: "Hidden" },
  removed: { label: "Removed" },
};

// The DB update an operator action applies. Returns ABSOLUTE state (not a toggle) so a
// re-run is idempotent, and matches the soft-remove shape the reports "Action" path uses.
export type MediaModerationUpdate =
  | { status: "removed"; removed_at: string }
  | { status: "approved"; removed_at: null };

/** Soft-remove: status='removed' + stamp the grace clock (the purge cron reclaims after 7d). */
export function removalUpdate(now: Date = new Date()): MediaModerationUpdate {
  return { status: "removed", removed_at: now.toISOString() };
}

// Restore (undo a mistaken removal within the grace window): clear removed_at so the cron
// can't reclaim it, and set status='approved'. We store no prior status (no migration), so a
// previously-hidden/pending item lands as approved — a rare, documented v1 limitation.
export function restoreUpdate(): MediaModerationUpdate {
  return { status: "approved", removed_at: null };
}

// A media row enriched with its album (event) + host — the shared shape produced by the
// moderation queries and consumed by the feed presigner. `hostLabel` is the host's display
// name or email (for the feed caption).
export type ModerationMediaItem = {
  id: string;
  type: MediaKind;
  status: MediaStatus;
  createdAt: string;
  originalKey: string;
  eventId: string;
  eventName: string;
  hostId: string;
  hostLabel: string | null;
};

// What the operator moderation grid renders: a presigned GridMedia (so it reuses MediaTile +
// MediaLightbox) plus the status (drives Remove vs Restore) and album context (the feed caption).
export type ModerationGridItem = GridMedia & {
  status: NonNullable<GridMedia["status"]>;
  eventId: string;
  eventName: string;
  hostLabel: string | null;
};
