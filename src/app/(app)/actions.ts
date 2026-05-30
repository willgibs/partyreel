"use server";

import { markAnnouncementsSeen } from "@/lib/db/mutations/notifications";

// App-wide server actions for the (app) shell. The notification bell (a client component in the
// layout) calls this when the host opens the panel — it just persists the seen marker; the bell
// optimistically clears the unread count client-side, so no revalidation is needed.
export async function markAnnouncementsSeenAction(): Promise<void> {
  await markAnnouncementsSeen();
}
