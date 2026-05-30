"use server";

import { markAnnouncementsSeen } from "@/lib/db/mutations/notifications";
import { markWelcomed } from "@/lib/db/mutations/profile";

// App-wide server actions for the (app) shell. The notification bell (a client component in the
// layout) calls this when the host opens the panel — it just persists the seen marker; the bell
// optimistically clears the unread count client-side, so no revalidation is needed.
export async function markAnnouncementsSeenAction(): Promise<void> {
  await markAnnouncementsSeen();
}

// The first-time welcome (/welcome) calls this on EVERY exit (Create / Look around / Skip) so
// the marker is set BEFORE the client navigates — otherwise the /dashboard guard bounces the
// host straight back to /welcome.
export async function markWelcomedAction(): Promise<void> {
  await markWelcomed();
}
