import { z } from "zod";

import { CONTACT_TOPIC_VALUES } from "@/lib/constants/contact";
import { noteField, publicFormFields } from "@/lib/validation/public-form";

// The /contact form's schema: the public forms' shared fields and honeypot (public-form.ts), and the
// topic and subject that are this form's own. `topic` is required on the form (the picker) though the DB
// column is nullable; the enum mirrors the migration CHECK via CONTACT_TOPIC_VALUES.
export const contactSchema = z.object({
  topic: z.enum(
    CONTACT_TOPIC_VALUES,
    "Pick a topic so your note lands in the right place.",
  ),
  ...publicFormFields,
  subject: z
    .string()
    .trim()
    .max(150, "Subject is too long (150 characters max).")
    .optional(),
  message: noteField(
    "Please add a little more detail (at least 10 characters).",
  ),
});

export type ContactInput = z.infer<typeof contactSchema>;
