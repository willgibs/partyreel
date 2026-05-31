import { z } from "zod";

// Shared by the /contact client form (via zodResolver) and the server action
// (which re-validates — never trust the client). `website` is a honeypot: a hidden
// field real users leave empty; the action silently drops any submission that fills it.
export const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(100),
  email: z.email("Please enter a valid email address."),
  subject: z.string().trim().max(150).optional(),
  message: z
    .string()
    .trim()
    .min(10, "Please add a little more detail (at least 10 characters).")
    .max(5000),
  website: z.string().optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
