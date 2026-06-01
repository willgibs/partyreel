import { z } from "zod";

// Shared validation for the operator announcement compose form + the publish action. Title + body are
// required; `href` is an optional CTA link; `publishedAt` is optional (a future value = scheduled — the
// host read RLS gates on `published_at <= now()`). Optional fields accept "" (empty form inputs). Pure,
// unit-tested. zod v4: top-level z.url(), error.issues.
export const announcementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(120, "Keep the title under 120 characters"),
  body: z
    .string()
    .trim()
    .min(1, "Body is required")
    .max(2000, "Keep the body under 2000 characters"),
  href: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || z.url().safeParse(v).success, "Enter a valid URL"),
  publishedAt: z
    .string()
    .optional()
    .refine(
      (v) => !v || !Number.isNaN(Date.parse(v)),
      "Enter a valid date and time",
    ),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;
