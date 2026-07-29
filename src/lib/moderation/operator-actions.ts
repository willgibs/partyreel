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
// `removed_by_admin` is service-role-write-only (QA #8, migration 20260729180000): it is the
// difference between a removal the host may undo and a takedown only an operator may undo.
export type MediaModerationUpdate =
  | { status: "removed"; removed_at: string; removed_by_admin: true }
  | { status: "approved"; removed_at: null; removed_by_admin: false };

/**
 * Soft-remove: status='removed' + stamp the grace clock (the purge cron reclaims after the
 * window) + mark it an OPERATOR takedown. That last flag is what stops the reported host from
 * quietly restoring the item from their own Trash: restore_media refuses a removed_by_admin row
 * (QA #8). It is ungranted to `authenticated`, so only this service-role path can set it.
 */
export function removalUpdate(now: Date = new Date()): MediaModerationUpdate {
  return {
    status: "removed",
    removed_at: now.toISOString(),
    removed_by_admin: true,
  };
}

/**
 * Restore (undo a takedown): clear removed_at so the cron can't reclaim it, release the operator
 * flag so the host owns the item again, and un-remove it.
 *
 * `status: "approved"` is the FLOOR, not the outcome: the media_derive_removal_provenance BEFORE
 * trigger rewrites it to `status_before_removed` (QA #24), so an item that was HIDDEN when the
 * operator took it down comes back HIDDEN rather than being silently republished to the album.
 * The derivation lives at the DB so every restore path (this one, restore_media, anything future)
 * inherits it. (Supersedes the old "we store no prior status" limitation note.)
 */
export function restoreUpdate(): MediaModerationUpdate {
  return { status: "approved", removed_at: null, removed_by_admin: false };
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
