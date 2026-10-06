/**
 * THE CHANGE-PLAN CONFIGURATION'S STEP IN THE SPEND WATCH'S RUN (billing-orphans; the rules and words are
 * `change-plan-watch.ts`'s). It asks Stripe exactly as `/admin/accounts` does (`checkChangePlanConfiguration`: the
 * route's own pick, its products read whole, against every Pro price `tiers.ts` sells), and hands the run its record,
 * whether it waits on a person (the bell) and the note. A configuration that lacks a price mails the ops inbox, once a
 * day while it holds.
 *
 * NEVER THROWS, NEVER SILENT: a check that could not run (Stripe, a Pro price's unset env) fails the run, as a plan
 * limit's failed read does, so the card reads "Last run failed" rather than a calm night; a mail that fails is captured
 * and tried again the next run.
 */
import "server-only";

import { checkChangePlanConfiguration } from "@/app/admin/accounts/portal-check";
import { SUPPORT_EMAIL } from "@/lib/constants/site";
import { sendOnce } from "@/lib/email/send";
import { serverEnv } from "@/lib/env";
import {
  changePlanEmail,
  changePlanMailKey,
  changePlanNeedsALook,
  changePlanNote,
  storedChangePlan,
  type StoredChangePlan,
} from "@/lib/jobs/change-plan-watch";
import { adminJobsUrl } from "@/lib/jobs/limits-watch-run";
import { captureError, captureWarning } from "@/lib/observability/sentry";

export type ChangePlanOutcome = {
  /** `job_runs.counts.change_plan`. */
  stored: StoredChangePlan;
  /** A Switch Stripe refuses today: the run is held at attention (the bell and the band). */
  attention: boolean;
  /** The check could not run: the run fails. */
  failed: boolean;
  /** The run's note, naming each price missing; null when whole. */
  note: string | null;
};

export async function runChangePlanWatch(opts: {
  now: Date;
}): Promise<ChangePlanOutcome> {
  let stored: StoredChangePlan;
  try {
    stored = storedChangePlan(await checkChangePlanConfiguration());
  } catch (e) {
    // The check never throws by contract; the belt to its braces.
    stored = {
      state: "unread",
      message: (e instanceof Error ? e.message : String(e)).slice(0, 200),
    };
  }
  const attention = changePlanNeedsALook(stored);
  const failed = stored.state === "unread";
  const note = changePlanNote(stored);

  if (failed) {
    captureWarning("cron", "change_plan_check_unread", {
      job: "spend_watch",
      message: stored.state === "unread" ? stored.message : "",
    });
  }
  if (stored.state === "missing" || stored.state === "no_configuration") {
    captureWarning("billing", "stripe_change_plan_configuration_incomplete", {
      job: "spend_watch",
      state: stored.state,
      ...(stored.state === "missing"
        ? {
            configurationId: stored.configuration_id,
            missing: stored.missing.map((p) => p.price_id),
          }
        : {}),
    });
    try {
      const mail = changePlanEmail({
        stored,
        jobsUrl: adminJobsUrl("job-spend_watch"),
      });
      await sendOnce({
        kind: "spend_watch",
        dedupeKey: changePlanMailKey(stored, opts.now),
        to: serverEnv.CONTACT_NOTIFY_EMAIL ?? SUPPORT_EMAIL,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
    } catch (e) {
      captureError("cron", e, {
        job: "spend_watch",
        phase: "change_plan_mail",
      });
      return {
        stored,
        attention,
        failed: true,
        note: `${note} Its mail could not be sent: it is tried again next run.`,
      };
    }
  }
  return { stored, attention, failed, note };
}
