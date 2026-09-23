import { z } from "zod";

import type { PlanId } from "@/lib/constants/tiers";

/**
 * The six Pro plan ids (three sizes, monthly and yearly), typed ONCE here so the
 * checkout body, the change-plan body and every client that branches on "is
 * this a Pro plan" read one list. `checkout.test.ts` holds it against the Pro
 * rows of `tiers.ts`, so a seventh size cannot ship in the plans and be refused
 * as an unknown id at both doors.
 */
export const PRO_PLAN_IDS = [
  "pro_100",
  "pro_500",
  "pro_2tb",
  "pro_100_yr",
  "pro_500_yr",
  "pro_2tb_yr",
] as const satisfies readonly PlanId[];

export type ProPlanId = (typeof PRO_PLAN_IDS)[number];

export function isProPlanId(value: unknown): value is ProPlanId {
  return (PRO_PLAN_IDS as readonly unknown[]).includes(value);
}

// The 6 Pro plan ids (monthly + annual subscriptions) + the one-time Event Pass
// (payment mode). The checkout route picks the Stripe mode from the plan's `billing`
// kind. `renewal` (Event Pass only) uses the cheaper renewal price + is gated to
// holders of a still-active pass.
export const checkoutSchema = z.object({
  planId: z.enum([...PRO_PLAN_IDS, "event_pass"] as const),
  renewal: z.boolean().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/**
 * A Pro-to-Pro change: sizes and intervals alike, and nothing else. The Event
 * Pass is absent on purpose, since a pass is never a CHANGE to a subscription
 * (it stacks, through checkout). The return path rides the raw body and is
 * checked against the allow-list in `pricing/return-path.ts`, exactly as the
 * checkout route does, so it is not part of this shape.
 */
export const changePlanSchema = z.object({
  planId: z.enum(PRO_PLAN_IDS),
});

export type ChangePlanInput = z.infer<typeof changePlanSchema>;
