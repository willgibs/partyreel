import { z } from "zod";

// The 3 Pro plan ids (subscription) + the one-time Event Pass (payment mode). The
// checkout route picks the Stripe mode from the plan's `billing` kind. `renewal` (Event
// Pass only) uses the cheaper renewal price + is gated to current/recent pass holders.
export const checkoutSchema = z.object({
  planId: z.enum(["pro_100", "pro_500", "pro_2tb", "event_pass"]),
  renewal: z.boolean().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
