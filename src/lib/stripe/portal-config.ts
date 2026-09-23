/**
 * Finds the change-plan portal configuration by its TAG (metadata
 * `partyreel_purpose=change_plan`), once per server instance.
 *
 * WHY BY TAG AND NOT BY ENV: the configuration is an object in each Stripe mode,
 * like the webhook endpoint, but unlike a price id nothing else in the app refers
 * to it, and an eleventh env value is one more thing the live cutover can
 * half-swap. Listing the account's active configurations costs one request per
 * warm instance and makes "re-create it in live with the same tag" the whole
 * cutover step (PRICING.md).
 *
 * ★ FAILS CLOSED. No tagged configuration means no change-plan session, never a
 * fallback to the default configuration: that one carries the plan switcher (and,
 * until the Orchestrator closes it, the quantity stepper), which is the door the
 * storage guard exists to shut.
 */
import "server-only";

import { getStripe } from "@/lib/stripe/client";
import {
  pickChangePlanConfiguration,
  type PortalConfigurationLike,
} from "@/lib/stripe/change-plan";

/** Module scope: the id survives for the life of a warm instance. */
let cachedId: string | null = null;

export class ChangePlanConfigurationMissingError extends Error {
  constructor() {
    super(
      "No active Stripe billing portal configuration carries metadata partyreel_purpose=change_plan (see PRICING.md, Stripe setup).",
    );
    this.name = "ChangePlanConfigurationMissingError";
  }
}

export async function changePlanConfigurationId(): Promise<string> {
  if (cachedId) return cachedId;
  const configurations: PortalConfigurationLike[] = [];
  // Auto-pagination: an account holds a handful, but a page boundary must never
  // decide whether the tag is found.
  for await (const configuration of getStripe().billingPortal.configurations.list(
    { active: true, limit: 100 },
  )) {
    configurations.push(configuration);
  }
  const id = pickChangePlanConfiguration(configurations);
  if (!id) throw new ChangePlanConfigurationMissingError();
  cachedId = id;
  return id;
}

/**
 * Forget the cached id. The route calls this when Stripe rejects the configuration
 * (re-created or deactivated while this instance was warm), then looks again once.
 */
export function forgetChangePlanConfiguration(): void {
  cachedId = null;
}
