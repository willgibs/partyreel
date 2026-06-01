import { z } from "zod";

// Shared triage lifecycle for the admin Support (contact submissions) + Applicants (job
// applications) inboxes. This is the single source: the DB CHECK constraint
// (migration 20260601100000_admin_triage_columns) mirrors TRIAGE_STATUSES, and the admin
// actions validate writes against triageStatusSchema.
export const TRIAGE_STATUSES = ["new", "in_progress", "closed"] as const;
export type TriageStatus = (typeof TRIAGE_STATUSES)[number];

export const triageStatusSchema = z.enum(TRIAGE_STATUSES);

// Display label + Badge variant per status (Badge variants: default / secondary / outline).
export const TRIAGE_STATUS_META: Record<
  TriageStatus,
  { label: string; badge: "default" | "secondary" | "outline" }
> = {
  new: { label: "New", badge: "default" },
  in_progress: { label: "In progress", badge: "secondary" },
  closed: { label: "Closed", badge: "outline" },
};
