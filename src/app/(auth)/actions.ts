"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

// Sign-out runs server-side so the auth cookies are cleared on the response
// before we navigate. redirect() throws NEXT_REDIRECT, so it must be the last
// statement and outside any try/catch.
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
