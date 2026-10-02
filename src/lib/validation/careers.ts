import { z } from "zod";

import { noteField, publicFormFields } from "@/lib/validation/public-form";

// A job application's schema: the public forms' shared fields and honeypot (public-form.ts), and the
// work links that are this form's own. `links` is free text (portfolio / LinkedIn / GitHub: people paste
// several), so its length is capped and its format is not.
export const careerSchema = z.object({
  ...publicFormFields,
  links: z
    .string()
    .trim()
    .max(500, "That's a lot. Keep links under 500 characters.")
    .optional(),
  message: noteField("Tell us a little more (at least 10 characters)."),
});

export type CareerInput = z.infer<typeof careerSchema>;
