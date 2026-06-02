/**
 * Event create/update validation — the SHARED contract between the client form
 * resolver and the server action (which re-parses; never trust the client).
 *
 * Plain module on purpose: a `'use server'` file may export only async functions,
 * so schemas/types live here and the actions import them.
 *
 * Defaults below MIRROR the `events` column defaults in
 * supabase/migrations/…_init_schema.sql, so an event created with only a name
 * lands identically whether validated on the client or re-parsed on the server.
 * `qr_token` is intentionally ABSENT — the DB generates it and the app must never
 * supply it.
 */
import { z } from "zod";

import { Constants } from "@/lib/db/types";
import { QR_STYLE_KEYS } from "@/lib/constants/qr-presets";

export const createEventSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give your event a name.")
    .max(80, "Event names are capped at 80 characters."),
  description: z
    .string()
    .trim()
    .max(2000, "Keep the description under 2000 characters.")
    .optional(),
  // Informational display date ONLY — never a lifecycle/end date (events don't
  // expire; see tiers.ts anti-abuse note). "" is allowed so a cleared date input
  // round-trips; the mutation normalizes "" → null before it hits the DB.
  event_date: z.union([z.iso.date(), z.literal("")]).optional(),
  // 3-state access (open|password|private), sourced from the generated DB Constants
  // so it stays in lockstep with the Postgres event_visibility enum. 'password' is a
  // valid shape, but the mutation only persists it when a hash already exists — the
  // password itself is set/cleared by its own RPC (set_event_password).
  visibility: z.enum(Constants.public.Enums.event_visibility).default("open"),
  accepting_uploads: z.boolean().default(true),
  require_email: z.boolean().default(false),
  // Enum sourced from the generated DB Constants so it stays in lockstep with
  // the Postgres `moderation_mode` enum without restating the values here.
  moderation_mode: z
    .enum(Constants.public.Enums.moderation_mode)
    .default("live"),
  // Presentational QR style preset key. Validated against the app-side
  // QR_PRESETS set (not a DB enum); mirrors the events.qr_style DB default.
  qr_style: z.enum(QR_STYLE_KEYS).default("classic"),
});

export const updateEventSchema = createEventSchema.partial();

// input ≠ output because of the `.default()`s: the form/resolver works with the
// INPUT type (booleans optional), the action consumes the OUTPUT type (applied).
export type CreateEventInput = z.input<typeof createEventSchema>;
export type CreateEventValues = z.output<typeof createEventSchema>;
export type UpdateEventInput = z.input<typeof updateEventSchema>;
export type UpdateEventValues = z.output<typeof updateEventSchema>;

// Album password (set / change). The DB RPC (set_event_password) re-checks tier +
// length (defense-in-depth); this is the shared client + action shape.
export const eventPasswordSchema = z.object({
  password: z
    .string()
    .min(4, "Use at least 4 characters.")
    .max(128, "Keep the password under 128 characters."),
});
export type EventPasswordValues = z.output<typeof eventPasswordSchema>;
