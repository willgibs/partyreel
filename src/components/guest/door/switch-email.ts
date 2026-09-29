"use client";

import { leaveAllGuestSessions } from "@/lib/guest/use-stored-session";
import { createClient } from "@/lib/supabase/client";

/**
 * "USE A DIFFERENT EMAIL" (event-safety r1, `unlisted=ask`'s second action: "This handles both the
 * 'hey host, could you let me in' and 'oops wrong email' situations"). Signing out is the switch: every
 * guest ticket on the device goes down first (the header's own sign-out courtesy, so the next address
 * inherits nothing), then the session, then a full reload, so every island (the header's menu, the
 * door) starts over as the signed-out visitor who is asked for an email at the door.
 */
export async function switchEmail(): Promise<void> {
  const left = leaveAllGuestSessions();
  try {
    await createClient().auth.signOut();
    // ★ THE RELOAD WAITS FOR THE COOKIE'S EXPIRY: the door reads the ticket beside the account, and a
    // ticket still riding the reload would stand her at the door she just stepped away from.
    await left;
  } finally {
    window.location.reload();
  }
}
