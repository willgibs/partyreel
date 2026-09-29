"use client";

import { toast } from "sonner";

import { signOutAction } from "@/app/(auth)/actions";

/**
 * THE DEVICE SIGN-OUT, AS A FORM'S ACTION: the account menu's and the admin
 * bar's, so both answer a refusal the way Sign out everywhere does (crumbs-14).
 * A refused GoTrue call leaves this session standing, so the server action
 * comes back instead of leaving for /login, and this says so: the person can
 * press again rather than land back on the dashboard as if it had worked.
 * Success never answers, since the action has left for /login.
 */
export async function signOutHere(): Promise<void> {
  const refused = await signOutAction();
  if (refused) toast.error(refused.message);
}
