/**
 * THE CHANGE-PLAN CONFIGURATION, WATCHED AT ITS SOURCE (billing-orphans; the configuration is billing-caps.md's, its
 * setup PRICING.md's "Stripe setup"). Stripe refuses a Pro switch to a price the tagged configuration does not list, so
 * every Switch to it is a failure the host meets first. `/admin/accounts` read it live on each view
 * (`portal-check.ts`) and rang no bell, so the spend watch's daily run reads it too (`change-plan-watch-run.ts`) and
 * raises it as its other checks raise: the bell (the run held at attention), the ops mail, and the run's note on
 * `/admin/jobs` naming each price `tiers.ts` sells that the configuration lacks.
 *
 * PURE (no env, no Stripe, no DB): the record the run keeps in `job_runs.counts.change_plan`, read back strictly, and
 * the words the note, the card and the mail say.
 */
import { composeMail, OPERATOR_TAG, type Mail } from "@/lib/email/templates";

import type { PortalCheck, SoldPrice } from "@/app/admin/accounts/portal-check";

/** The run's record (`counts.change_plan`), snake-cased as `job_runs.counts` keeps everything. */
export type StoredChangePlan =
  | { state: "whole"; configuration_id: string; sold: number }
  | {
      state: "missing";
      configuration_id: string;
      sold: number;
      missing: { plan_id: string; label: string; price_id: string }[];
    }
  | { state: "no_configuration" }
  | { state: "unread"; message: string };

/** The check as the run keeps it. */
export function storedChangePlan(check: PortalCheck): StoredChangePlan {
  switch (check.state) {
    case "whole":
      return {
        state: "whole",
        configuration_id: check.configurationId,
        sold: check.sold,
      };
    case "missing":
      return {
        state: "missing",
        configuration_id: check.configurationId,
        sold: check.sold,
        missing: check.missing.map((price: SoldPrice) => ({
          plan_id: price.planId,
          label: price.label,
          price_id: price.priceId,
        })),
      };
    case "no_configuration":
      return { state: "no_configuration" };
    case "unread":
      return { state: "unread", message: check.message.slice(0, 200) };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const nonEmpty = (value: unknown): value is string =>
  typeof value === "string" && value !== "";

/** Read a run's record back; anything this code never wrote is null (the card then says nothing of it). */
export function parseStoredChangePlan(value: unknown): StoredChangePlan | null {
  if (!isRecord(value)) return null;
  switch (value.state) {
    case "whole":
      return nonEmpty(value.configuration_id) && typeof value.sold === "number"
        ? {
            state: "whole",
            configuration_id: value.configuration_id,
            sold: value.sold,
          }
        : null;
    case "missing": {
      if (
        !nonEmpty(value.configuration_id) ||
        typeof value.sold !== "number" ||
        !Array.isArray(value.missing) ||
        value.missing.length === 0
      ) {
        return null;
      }
      const missing: { plan_id: string; label: string; price_id: string }[] =
        [];
      for (const item of value.missing) {
        if (
          !isRecord(item) ||
          !nonEmpty(item.plan_id) ||
          !nonEmpty(item.label) ||
          !nonEmpty(item.price_id)
        ) {
          return null;
        }
        missing.push({
          plan_id: item.plan_id,
          label: item.label,
          price_id: item.price_id,
        });
      }
      return {
        state: "missing",
        configuration_id: value.configuration_id,
        sold: value.sold,
        missing,
      };
    }
    case "no_configuration":
      return { state: "no_configuration" };
    case "unread":
      return typeof value.message === "string"
        ? { state: "unread", message: value.message }
        : null;
    default:
      return null;
  }
}

/** Does it wait on a person (a Switch Stripe refuses today)? A check that could not run fails the run instead. */
export function changePlanNeedsALook(stored: StoredChangePlan): boolean {
  return stored.state === "missing" || stored.state === "no_configuration";
}

/** "Pro 50 GB, $90/yr (price_…)", each missing price in the order `tiers.ts` sells them. */
function missingWords(missing: { label: string; price_id: string }[]): string {
  return missing.map((p) => `${p.label} (${p.price_id})`).join(", ");
}

/**
 * The run's note (`/admin/jobs`' line for the spend watch), naming each price the configuration lacks. Null when
 * whole: a calm night says nothing.
 */
export function changePlanNote(stored: StoredChangePlan): string | null {
  switch (stored.state) {
    case "whole":
      return null;
    case "missing":
      return `Change plan in Stripe: the tagged configuration (${stored.configuration_id}) lacks ${missingWords(stored.missing)}, so Stripe refuses a switch to ${stored.missing.length === 1 ? "it" : "each"}.`;
    case "no_configuration":
      return "Change plan in Stripe: no active configuration carries partyreel_purpose=change_plan, so every Pro switch is refused.";
    case "unread":
      return `Change plan in Stripe: no reading (${stored.message.slice(0, 120)}).`;
  }
}

/** The mail's once-a-day key: the same broken set mails once a day, a different one at once. */
export function changePlanMailKey(stored: StoredChangePlan, now: Date): string {
  const what =
    stored.state === "missing"
      ? stored.missing
          .map((p) => p.price_id)
          .sort()
          .join("+")
      : stored.state;
  return `change_plan:${what}:${now.toISOString().slice(0, 10)}`;
}

/**
 * THE OPS MAIL, in the operator alert's shape (no button, the tagged subject, the jobs console in the foot). Only for a
 * configuration that needs a look; a check that could not run is the run's failure, said on the card.
 */
export function changePlanEmail(opts: {
  stored: Extract<StoredChangePlan, { state: "missing" | "no_configuration" }>;
  jobsUrl: string;
}): Mail {
  const { stored } = opts;
  const subject =
    stored.state === "missing"
      ? `${OPERATOR_TAG} Change plan in Stripe: ${stored.missing.length} of ${stored.sold} Pro prices missing`
      : `${OPERATOR_TAG} Change plan in Stripe: no configuration tagged`;
  const blocks: Parameters<typeof composeMail>[0]["blocks"] =
    stored.state === "missing"
      ? [
          {
            kind: "p",
            parts: [
              "The change-plan configuration Stripe uses for a Pro switch does not list every Pro price Partyreel sells. ",
              {
                strong:
                  "A host who presses Switch to one of these meets an error.",
              },
            ],
          },
          {
            kind: "fields",
            rows: [
              { label: "Configuration", value: stored.configuration_id },
              ...stored.missing.map((p) => ({
                label: p.label,
                value: p.price_id,
              })),
            ],
          },
          {
            kind: "p",
            parts: [
              { strong: "What to do:" },
              " list each price on that configuration's subscription updates in Stripe (PRICING.md, Stripe setup). The next run says whether it holds.",
            ],
          },
        ]
      : [
          {
            kind: "p",
            parts: [
              "No active billing portal configuration carries partyreel_purpose=change_plan with subscription updates on. ",
              {
                strong:
                  "Every switch between Pro plans is refused until one does.",
              },
            ],
          },
          {
            kind: "p",
            parts: [
              { strong: "What to do:" },
              " tag the change-plan configuration in Stripe, or re-create it (PRICING.md, Stripe setup).",
            ],
          },
        ];
  return composeMail({
    subject,
    heading:
      stored.state === "missing"
        ? "Stripe refuses a Pro switch"
        : "Every Pro switch is refused",
    blocks,
    foot: {
      line: "Partyreel operations alert (the spend watch's daily run, billing-caps.md). Sent once a day while it holds.",
      link: { href: opts.jobsUrl, label: "Open the spend watch" },
    },
  });
}
