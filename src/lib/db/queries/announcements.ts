/**
 * Operator-internal read for the admin Announcements surface (P7). SERVICE-ROLE admin client: lists ALL
 * announcements including future-scheduled ones (the host-facing read in the notification center is
 * RLS-gated to `published_at <= now()`). The /admin/announcements page gates on requireAdmin() first.
 */
import "server-only";

import type { Tables } from "@/lib/db/types";
import { createAdminClient } from "@/lib/supabase/admin";

export type Announcement = Tables<"announcements">;
/** A row + a server-computed `scheduled` flag (published_at in the future). Computing it here — in a
 * plain query fn, not a component render — keeps Date.now() out of render (the purity lint rule). */
export type AnnouncementListItem = Announcement & { scheduled: boolean };

export async function listAnnouncements(): Promise<AnnouncementListItem[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("announcements")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(50);
  if (error) throw error;

  const now = Date.now();
  return (data ?? []).map((a) => ({
    ...a,
    scheduled: new Date(a.published_at).getTime() > now,
  }));
}
