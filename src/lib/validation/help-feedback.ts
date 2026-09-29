/**
 * THE FEEDBACK BEACON'S BODY (help-center r1 `feedback=beacon`): the shared contract between
 * `ArticleFeedback` and `POST /api/help/feedback`. The route re-parses; never trust the client.
 *
 * Two fields and nothing else, on purpose: the row it becomes (`article_feedback`) carries no
 * address, account, device or free text, so nothing a reader sends can identify them. `.strict()`
 * refuses a third key rather than silently dropping it, so a client that starts sending more is a
 * 400 someone notices, not a column somebody later adds to hold it.
 *
 * The slug's shape mirrors the table's `article_feedback_slug_shape` CHECK (lowercase words joined by
 * single hyphens, at most 120 characters); the route then refuses a well-formed slug the catalog
 * does not hold, so a row can only ever name a real article.
 */
import { z } from "zod";

export const HELP_FEEDBACK_SLUG_MAX = 120;
export const HELP_FEEDBACK_SLUG_SHAPE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const helpFeedbackSchema = z
  .object({
    slug: z
      .string()
      .max(HELP_FEEDBACK_SLUG_MAX)
      .regex(HELP_FEEDBACK_SLUG_SHAPE),
    helpful: z.boolean(),
  })
  .strict();

export type HelpFeedbackInput = z.infer<typeof helpFeedbackSchema>;
