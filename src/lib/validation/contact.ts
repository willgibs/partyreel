import { z } from "zod";

import { CONTACT_TOPIC_VALUES } from "@/lib/constants/contact";

// Shared by the /contact client form (via zodResolver) and the server action
// (which re-validates — never trust the client). `website` is a honeypot: a hidden
// field real users leave empty; the action silently drops any submission that fills it.
// `topic` is required on the form (the chip picker) though the DB column is nullable;
// the enum mirrors the migration CHECK via CONTACT_TOPIC_VALUES.
export const contactSchema = z.object({
  topic: z.enum(
    CONTACT_TOPIC_VALUES,
    "Pick a topic so your note lands in the right place.",
  ),
  name: z
    .string()
    .trim()
    .min(1, "Please enter your name.")
    .max(100, "Name is too long (100 characters max)."),
  email: z.email("Please enter a valid email address."),
  subject: z
    .string()
    .trim()
    .max(150, "Subject is too long (150 characters max).")
    .optional(),
  message: z
    .string()
    .trim()
    .min(10, "Please add a little more detail (at least 10 characters).")
    .max(5000, "Message is too long (5,000 characters max)."),
  website: z.string().optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
