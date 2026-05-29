import { z } from "zod";

// The 3 Pro plan ids (subscription) + the one-time Event Pass (payment mode). The
// checkout route picks the Stripe mode from the plan's `billing` kind.
export const checkoutSchema = z.object({
  planId: z.enum(["pro_100", "pro_500", "pro_2tb", "event_pass"]),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
