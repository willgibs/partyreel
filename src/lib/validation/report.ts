/**
 * Validation for the public "report" flow — the SHARED contract between the
 * report dialog and `/api/reports`. The route re-parses; never trust the client.
 *
 * The capability here is the `qr_token` (the single event link, database-security.md) —
 * exactly what the report button has on hand. `media_id` is optional: event-level
 * reports omit it (v1), per-item reports pass it (the RPC checks it belongs to the
 * event). `reason` is capped to mirror the `reports_reason_len` DB check (2000).
 */
import { z } from "zod";

export const reportSchema = z.object({
  qr_token: z.string().trim().min(1),
  media_id: z.uuid().optional(),
  reason: z
    .string()
    .trim()
    .max(2000, "Keep your report under 2000 characters.")
    .optional(),
});

export type ReportInput = z.input<typeof reportSchema>;
