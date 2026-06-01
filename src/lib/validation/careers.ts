import { z } from "zod";

// Shared by the /careers/[slug] client form (zodResolver) and the server action.
// Mirrors the contact schema; `links` is a free-text field (portfolio / LinkedIn /
// GitHub — people paste several, so cap length but don't force one URL format).
// `website` is the honeypot the action silently drops.
export const careerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Please enter your name.")
    .max(100, "Name is too long (100 characters max)."),
  email: z.email("Please enter a valid email address."),
  links: z
    .string()
    .trim()
    .max(500, "That's a lot. Keep links under 500 characters.")
    .optional(),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little more (at least 10 characters).")
    .max(5000, "Message is too long (5,000 characters max)."),
  website: z.string().optional(),
});

export type CareerInput = z.infer<typeof careerSchema>;
