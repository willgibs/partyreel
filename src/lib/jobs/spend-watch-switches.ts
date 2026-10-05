/**
 * THE SWITCHES THAT STOP A VECTOR (the spend watch, admin-observability.md "The spend watch"): read where each one
 * gates, read whole for the watch and the console, and paused by the watch. `ops_flags` is deny-all, so everything
 * here goes through the service-role admin client.
 *
 * ★ EACH FAILS IN ITS OWN DIRECTION, on purpose (the doc's "kill switches fail differently"):
 *  - guest uploads fail OPEN: a switch nobody can read must never stop a real party (the capability, the caps and the
 *    uploads meter still stand behind every upload);
 *  - lifecycle mail fails CLOSED for the mail it holds: a held reminder goes out the next night, while mail sent into
 *    a runaway spends the Resend quota the operator alerts ride;
 *  - a row not seeded yet reads as ON for both, so code that ships ahead of its migration changes nothing.
 */
import "server-only";

import { mustQuery } from "@/lib/db/must-query";
import { recordSignalFailure } from "@/lib/jobs/failure-log";
import {
  SWITCH_KEYS,
  type SwitchKey,
  type SwitchStates,
} from "@/lib/jobs/spend-watch";
import { Throttle } from "@/lib/jobs/throttle";
import { captureWarning } from "@/lib/observability/sentry";
import { createAdminClient } from "@/lib/supabase/admin";

/** One Sentry warning an instance a quarter hour for an unreadable uploads switch: a DB outage must not storm it. */
const unreadable = new Throttle<string>(15 * 60 * 1000);

/** Test seam: the throttle is process state. */
export function resetSwitchThrottle(): void {
  unreadable.reset();
}

/**
 * MAY GUESTS UPLOAD? Read at every guest presign, before anything else is asked. Off refuses the upload in a guest's
 * words; a missing row, a failed read or a thrown client all answer true (fail OPEN), the failure said once to Sentry.
 */
export async function guestUploadsOpen(): Promise<boolean> {
  try {
    const { data, error } = await createAdminClient()
      .from("ops_flags")
      .select("enabled")
      .eq("key", "uploads_enabled")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data?.enabled ?? true;
  } catch (e) {
    if (unreadable.claim("uploads_enabled", Date.now())) {
      captureWarning("upload", "uploads_switch_unreadable", {
        error: String(e).slice(0, 300),
        // What the guest got: the upload went ahead.
        failed: "open",
      });
    }
    return true;
  }
}

/**
 * MAY THE LIFECYCLE SWEEPS' RE-SENT MAIL GO? Read by `sendOnce` before it claims a held kind (send-kinds.ts). A
 * missing row is on; a failed read HOLDS (fail CLOSED: the sweep sends it the next night it is still due) and is
 * recorded in the `email_delivery` signal, so a hold nobody chose is never silent.
 */
export async function lifecycleMailFlowing(kind: string): Promise<boolean> {
  try {
    const { data, error } = await createAdminClient()
      .from("ops_flags")
      .select("enabled")
      .eq("key", "lifecycle_mail_enabled")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data?.enabled ?? true;
  } catch (e) {
    await recordSignalFailure({
      job: "email_delivery",
      area: "other",
      operation: `lifecycle mail switch unreadable, held (${kind})`,
      error: e instanceof Error ? e : new Error(String(e)),
      extra: { kind, failed: "closed" },
    });
    return false;
  }
}

/**
 * Every switch the watch can act on, with the instant it last changed. THROWS on a failed read (mustQuery): the
 * watch then pauses nothing, and the console says the switches could not be read rather than drawing them ON.
 */
export async function readSwitches(): Promise<SwitchStates> {
  const rows = await mustQuery(
    createAdminClient()
      .from("ops_flags")
      .select("key, enabled, updated_at")
      .in("key", [...SWITCH_KEYS])
      .limit(10),
    "spend watch: the switches",
  );
  const out: SwitchStates = {};
  for (const key of SWITCH_KEYS) {
    const row = (rows ?? []).find((r) => r.key === key);
    // A row not seeded yet is on, and has never been touched.
    out[key] = row
      ? { enabled: row.enabled, updatedAtMs: Date.parse(row.updated_at) }
      : { enabled: true, updatedAtMs: null };
  }
  return out;
}

/**
 * THE WATCH PAUSES ONE SWITCH, and only one that is on: an operator's pause is never re-stamped, so its instant (and
 * whose it is) survives. Answers the instant written, which the watch records as its own pause (`carryPaused`), or
 * null when the switch was already off. Throws on a failed write.
 */
export async function pauseSwitch(
  key: SwitchKey,
  at: Date,
): Promise<string | null> {
  const admin = createAdminClient();
  const iso = at.toISOString();
  const { data, error } = await admin
    .from("ops_flags")
    .update({ enabled: false, updated_at: iso })
    .eq("key", key)
    .eq("enabled", true)
    .select("key");
  if (error) throw new Error(`pause ${key}: ${error.message}`);
  if ((data ?? []).length > 0) return iso;

  // Nothing was on to pause: an operator's pause stands, or the row was never seeded (which reads as on).
  const existing = await mustQuery(
    admin.from("ops_flags").select("enabled").eq("key", key).maybeSingle(),
    `spend watch: ${key}`,
  );
  if (existing) return null;
  const { error: insertError } = await admin
    .from("ops_flags")
    .insert({ key, enabled: false, updated_at: iso });
  if (insertError) throw new Error(`pause ${key}: ${insertError.message}`);
  return iso;
}
