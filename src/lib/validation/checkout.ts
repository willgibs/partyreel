import { z } from "zod";

// The 6 Pro plan ids (monthly + annual subscriptions) + the one-time Event Pass
// (payment mode). The checkout route picks the Stripe mode from the plan's `billing`
// kind. `renewal` (Event Pass only) uses the cheaper renewal price + is gated to
// holders of a still-active pass.
export const checkoutSchema = z.object({
  planId: z.enum([
    "pro_100",
    "pro_500",
    "pro_2tb",
    "pro_100_yr",
    "pro_500_yr",
    "pro_2tb_yr",
    "event_pass",
  ]),
  renewal: z.boolean().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
