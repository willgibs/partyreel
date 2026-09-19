/**
 * Validation for the public "report" flow — the SHARED contract between the
 * report controls and `/api/reports`. The route re-parses; never trust the client.
 *
 * TWO SUBJECTS, ONE ENDPOINT. An ALBUM report carries the event's `qr_token`,
 * which is the capability (database-security.md) and exactly what the report
 * button on the album has on hand; `media_id` is optional there (event-level
 * reports omit it, per-item reports pass it and the RPC checks it belongs to
 * the event). A PERSON report carries `profile_id` and no token at all: its
 * authorization is the signed-in viewer the route re-verifies, since a public
 * profile has no capability to present (Will, `block=report`, 2026-09-19).
 *
 * The refine is what keeps the pair honest: a body must name exactly one
 * subject, so a request can never arrive that the operator queue cannot file.
 * `reason` is capped to mirror the `reports_reason_len` DB check (2000).
 */
import { z } from "zod";

export const reportSchema = z
  .object({
    qr_token: z.string().trim().min(1).optional(),
    media_id: z.uuid().optional(),
    profile_id: z.uuid().optional(),
    reason: z
      .string()
      .trim()
      .max(2000, "Keep your report under 2000 characters.")
      .optional(),
  })
  .refine((body) => Boolean(body.qr_token) !== Boolean(body.profile_id), {
    message: "Report an album or a person, not both.",
  })
  // media_id belongs to the album arm: a person report with one would be a
  // cross-subject reference the RPC has no event to validate against.
  .refine((body) => !body.media_id || Boolean(body.qr_token), {
    message: "An item report needs its event link.",
  });

export type ReportInput = z.input<typeof reportSchema>;
