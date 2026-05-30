/**
 * Notification center mutation (Phase 6 cut #4). Marks all currently-published announcements
 * read for the signed-in host by advancing their seen marker. RLS self-update: the
 * `profiles_update_own` policy scopes it to the host's own row, and `announcements_seen_at` is
 * in the `profiles` column-grant allowlist (so the host may write THAT column — tier/storage_*
 * stay service-role-only). Best-effort — a failed mark must never break the page.
 */
import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function markAnnouncementsSeen(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({ announcements_seen_at: new Date().toISOString() })
    .eq("id", user.id);
}
