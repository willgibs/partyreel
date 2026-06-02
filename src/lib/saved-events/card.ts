import type { Database } from "@/lib/db/types";
import { formatEventDate } from "@/lib/utils";

/**
 * Pure presentation logic for a "Saved" event card. Kept server-free (no R2/Supabase
 * imports) so it's unit-testable and importable from a Client Component. The cover URL
 * is presigned server-side and passed in (raw R2 keys never reach the browser).
 *
 * The RPC `get_saved_events` already MASKS by visibility (private → null name/host/date/
 * token, accessible=false; password → name/host/date/token but NO cover). This mapper
 * turns that masked row into display strings + the album href, and defends the cover
 * (forces null when not accessible) so a private save can never show media.
 */
// The generated `get_saved_events` return type marks every column non-null — Supabase's
// type generator can't infer nullability for a RETURNS TABLE function. But the RPC MASKS
// columns to null by visibility (private → name/host/date/token/cover null; password →
// cover null), so we model the TRUE nullability here. The generated (non-null) row is
// structurally assignable to this, so the query layer casts to it.
export type SavedEventRow = {
  event_id: string;
  saved_at: string;
  name: string | null;
  host_display_name: string | null;
  event_date: string | null;
  visibility: Database["public"]["Enums"]["event_visibility"];
  has_password: boolean;
  share_token: string | null;
  cover_key: string | null;
  accessible: boolean;
};

export type SavedEventCardData = {
  eventId: string;
  /** `/a/[share_token]` when accessible, else null (the card renders disabled). */
  href: string | null;
  name: string;
  dateLabel: string;
  /** "Hosted by X" when known + accessible. */
  byline: string | null;
  coverUrl: string | null;
  accessible: boolean;
  passwordProtected: boolean;
};

export function savedEventCardProps(
  row: SavedEventRow,
  coverUrl: string | null,
): SavedEventCardData {
  const accessible = row.accessible;
  return {
    eventId: row.event_id,
    accessible,
    // Capability split: link to the ALBUM (share_token), never the qr_token. Private
    // saves resolve to null → a disabled card.
    href: accessible && row.share_token ? `/a/${row.share_token}` : null,
    name: accessible ? (row.name ?? "Untitled event") : "Private event",
    dateLabel: accessible
      ? row.event_date
        ? formatEventDate(row.event_date)
        : "No date set"
      : "The host made this event private",
    byline:
      accessible && row.host_display_name
        ? `Hosted by ${row.host_display_name}`
        : null,
    // Defense in depth: a non-accessible (private) save never carries a cover, even if
    // a stale key were somehow passed.
    coverUrl: accessible ? coverUrl : null,
    passwordProtected: row.has_password,
  };
}
