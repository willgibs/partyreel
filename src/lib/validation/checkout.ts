import { z } from "zod";

// Cut 4b accepts only the 3 Pro plan ids (subscription). The one-time Event Pass
// (event_pass) is added in Cut 4c with checkout mode "payment".
export const checkoutSchema = z.object({
  planId: z.enum(["pro_100", "pro_500", "pro_2tb"]),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
