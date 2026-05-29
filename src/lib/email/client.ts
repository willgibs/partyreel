/**
 * The server-side Resend client. `server-only` keeps the API key out of any client
 * bundle. Lazily constructed so the app builds/deploys before RESEND_API_KEY + a
 * verified sending domain exist (assertResendEnv runs only when we actually send).
 */
import "server-only";

import { Resend } from "resend";

import { assertResendEnv } from "@/lib/env";

let client: Resend | null = null;

export function getResend(): Resend {
  if (!client) {
    client = new Resend(assertResendEnv().RESEND_API_KEY);
  }
  return client;
}
