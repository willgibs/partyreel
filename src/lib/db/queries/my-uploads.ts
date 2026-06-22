/**
 * The signed-in user's own uploads across ALL events (host uploads + guest uploads), render-ready for the
 * dashboard "Uploads" tab (Phase 4). `get_my_uploads` is a SECURITY DEFINER RPC because it reads the
 * name/date/token of events the user may NOT own (events RLS is host-only); it's auth.uid()-based +
 * authenticated-only. We presign the R2 keys server-side here (ADR-0003) — raw keys never reach the browser.
 */
import "server-only";

import type { GridMedia } from "@/components/app/media-grid";
import { toMyUploadsItems } from "@/lib/r2/grid-items";
import { createClient } from "@/lib/supabase/server";
import { formatEventDate } from "@/lib/utils";

// v1 cap on the flat cross-event feed (two presigns/item). `truncated` lets the UI say so rather than
// silently dropping the (limit+1)th upload (the "no silent caps" rule). A future cursor (created_at <)
// is the load-more upgrade path with no RPC change.
const MY_UPLOADS_LIMIT = 200;

export async function getMyUploadCards(): Promise<{
  items: GridMedia[];
  truncated: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], truncated: false };

  const { data, error } = await supabase.rpc("get_my_uploads", {
    p_limit: MY_UPLOADS_LIMIT,
  });
  if (error) throw error;

  const rows = data ?? [];
  const items = await toMyUploadsItems(
    rows.map((r) => ({
      id: r.id,
      type: r.type,
      originalKey: r.original_key,
      previewKey: r.preview_key ?? null,
      eventName: r.event_name,
      // event_date is nullable in reality (the generated TABLE type widens it to string); guard it.
      eventDateLabel: r.event_date ? formatEventDate(r.event_date) : null,
      eventQrToken: r.event_qr_token,
      width: r.width,
      height: r.height,
      durationSeconds: r.duration_seconds,
    })),
  );
  return { items, truncated: rows.length >= MY_UPLOADS_LIMIT };
}
