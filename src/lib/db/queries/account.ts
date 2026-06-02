/**
 * Account auth reads for the authenticated host (ADR-0011). Both wrap a SECURITY
 * DEFINER RPC that authorizes via auth.uid(); we still re-check getUser() (RLS is the
 * boundary, the proxy is not). They only READ auth.users and return booleans — the
 * password WRITE itself is supabase.auth.updateUser() on the BROWSER client, never here,
 * so the session-rotating write happens where the cookie write is unconditional.
 */
import "server-only";

import { createClient } from "@/lib/supabase/server";

// True when the signed-in account has a password credential. Drives the /account
// Security copy (Set vs Change) and whether the current-password field is shown. Fails
// closed (false) on any error so the UI degrades to "Set a password" rather than leaking.
export async function hasPassword(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc("has_password");
  if (error) return false;
  return data === true;
}

// True when `password` matches the signed-in account's current password. Used to
// re-confirm ownership BEFORE a change — the RPC only READS, so the live session is
// never disrupted (the actual change is updateUser() on the client). MUST only be called
// in "change" mode: a passwordless account returns false here, which the UI would
// otherwise show as "current password is incorrect". Fails closed.
export async function verifyCurrentPassword(
  password: string,
): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc("verify_current_password", {
    p_password: password,
  });
  if (error) return false;
  return data === true;
}
