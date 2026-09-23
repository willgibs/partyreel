/**
 * Event create/update validation — the SHARED contract between the client form
 * resolver and the server action (which re-parses; never trust the client).
 *
 * Plain module on purpose: a `'use server'` file may export only async functions,
 * so schemas/types live here and the actions import them.
 *
 * ★ TWO SCHEMAS FROM ONE SET OF FIELDS, AND ONLY THE CREATE CARRIES DEFAULTS.
 * zod 4's `.partial()` KEEPS each `.default()` (by design: "partial should not
 * clobber defaults"), so an update schema derived from a defaulted create schema
 * fills every defaulted key into a one-field save: a QR style save would also
 * write `visibility: "open"` (a password or private album opens to the link),
 * `accepting_uploads: true` (paused uploads reopen) and `moderation_mode: "live"`
 * (on which `updateEventAction` approves every held upload). So the FIELDS below
 * carry no default; `createEventSchema` adds the defaults a create needs, and
 * `updateEventSchema` is the fields' own `.partial()`, which carries exactly the
 * keys a caller sent. Never derive the update from the create.
 *
 * The create's defaults MIRROR the `events` column defaults in
 * supabase/migrations/…_init_schema.sql, so an event created with only a name
 * lands identically whether validated on the client or re-parsed on the server.
 * `qr_token` is intentionally ABSENT — the DB generates it and the app must never
 * supply it.
 */
import { z } from "zod";

import { Constants } from "@/lib/db/types";
import { QR_STYLE_KEYS } from "@/lib/constants/qr-presets";
import { RESERVED_SLUGS } from "@/lib/constants/reserved-slugs";
import { MAX_UPLOAD_BYTES, MIN_UPLOAD_CAP_BYTES } from "@/lib/media/limits";

// The FIELDS, with no defaults (see the header): the one place a field's shape is written.
const eventFields = {
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
  visibility: z.enum(Constants.public.Enums.event_visibility),
  accepting_uploads: z.boolean(),
  // ★ REQUIRE VERIFIED EMAILS, ON BY DEFAULT (the identity reshape, Will 2026-09-21). On, a guest
  // confirms an email before the full album and any upload; off, they type a display name at the
  // door and upload under it with an unverified mark. Free on every tier; turning it OFF is the
  // opt-in, behind a consequence-confirm (UploadsSection). Mirrors the
  // events.require_verified_email column default (true), which the create below applies.
  require_verified_email: z.boolean(),
  // ITS LEGACY TWIN, kept for the deploy window only. A DB trigger holds the two exactly opposite
  // in both directions, so a form that still submits this one lands a consistent row; the new flag
  // WINS when a write moves both. It leaves with the column (host-app.md), and nothing new should
  // read or send it. Mirrors the events.allow_anonymous_uploads column default (false).
  allow_anonymous_uploads: z.boolean(),
  // ★ REQUIRE AN UPLOAD TO VIEW, OFF BY DEFAULT (the door as three steps, Will 2026-09-21).
  // On, a guest (never the host) sees the full album only
  // once one upload of theirs has completed, approved or held for review; the gate FAILS OPEN
  // while uploads are closed or the album is full, so nobody is ever held at a step they cannot
  // pass. Off (the default), the album opens after the name or the confirmed email. Free on every
  // tier: a genuinely new flag with no legacy twin and no tier gate (GATED_EVENT_SETTINGS stays
  // password + custom_slug only). Mirrors the events.require_upload_to_view column default (false).
  require_upload_to_view: z.boolean(),
  // Host-configurable per-upload size cap for GUEST uploads (bytes). null = no host cap
  // (the universal MAX_UPLOAD_BYTES applies). Bounds MIRROR the events_max_upload_bytes_range
  // DB CHECK (defense-in-depth); the settings UI offers UPLOAD_CAP_PRESETS within this range.
  // The host's own uploads are exempt (enforced in the RPCs, not here).
  max_upload_bytes: z
    .number()
    .int()
    .min(MIN_UPLOAD_CAP_BYTES)
    .max(MAX_UPLOAD_BYTES)
    .nullable()
    .optional(),
  // Enum sourced from the generated DB Constants so it stays in lockstep with
  // the Postgres `moderation_mode` enum without restating the values here.
  moderation_mode: z.enum(Constants.public.Enums.moderation_mode),
  // Presentational QR style preset key. Validated against the app-side
  // QR_PRESETS set (not a DB enum); the create's default mirrors the events.qr_style DB default.
  qr_style: z.enum(QR_STYLE_KEYS),
};

/**
 * A CREATE: the fields, with the defaults a new event needs (each mirrors its column default), so
 * a create that names only the event lands every setting a host who never touched one gets.
 */
export const createEventSchema = z.object({
  ...eventFields,
  visibility: eventFields.visibility.default("open"),
  accepting_uploads: eventFields.accepting_uploads.default(true),
  require_verified_email: eventFields.require_verified_email.default(true),
  allow_anonymous_uploads: eventFields.allow_anonymous_uploads.default(false),
  require_upload_to_view: eventFields.require_upload_to_view.default(false),
  moderation_mode: eventFields.moderation_mode.default("live"),
  qr_style: eventFields.qr_style.default("classic"),
});

/**
 * AN UPDATE: exactly the keys a caller sent, and nothing else. `updateEvent` patches every
 * defined key, so a default here would be a WRITE (the header's defect): a one-field save
 * (`{ qr_style }` from the QR designer, `{ moderation_mode }` from the review room) must parse to
 * that one field.
 */
export const updateEventSchema = z.object(eventFields).partial();

// The create's input ≠ output because of its `.default()`s: the wizard's resolver works with
// the INPUT type (booleans optional), the action consumes the OUTPUT type (applied). An update's
// two types are the same shape (every key optional), kept as two names so the settings form's
// resolver reads the pair it always has.
export type CreateEventInput = z.input<typeof createEventSchema>;
export type CreateEventValues = z.output<typeof createEventSchema>;
export type UpdateEventInput = z.input<typeof updateEventSchema>;
export type UpdateEventValues = z.output<typeof updateEventSchema>;

// Album password (set / change). The DB RPC (set_event_password) re-checks tier +
// length (defense-in-depth); this is the shared client + action shape.
/** Exported so the help center's spec inline renders the real floor. */
export const EVENT_PASSWORD_MIN_LENGTH = 4;
export const eventPasswordSchema = z.object({
  password: z
    .string()
    .min(
      EVENT_PASSWORD_MIN_LENGTH,
      `Use at least ${EVENT_PASSWORD_MIN_LENGTH} characters.`,
    )
    .max(128, "Keep the password under 128 characters."),
});
export type EventPasswordValues = z.output<typeof eventPasswordSchema>;

// Custom event slug (Pro / Event-Pass) — an optional human-friendly ALIAS for the
// /e/[token] link. Normalized to lowercase, then validated. The DB RPC (set_event_slug)
// re-checks tier + format + uniqueness (defense-in-depth); this is the shared client +
// action shape, and also owns the reserved-word policy (a brand/clarity list, not a
// routing or security boundary — see lib/constants/reserved-slugs.ts).
export const eventSlugSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Custom links are at least 3 characters.")
    .max(50, "Keep custom links to 50 characters or fewer.")
    .regex(
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
      "Use lowercase letters, numbers, and hyphens (no leading or trailing hyphen).",
    )
    // A 32-hex slug could be mistaken for a qr_token in the shared /e/ namespace.
    .refine(
      (s) => !/^[0-9a-f]{32}$/.test(s),
      "That custom link isn't available.",
    )
    .refine(
      (s) => !RESERVED_SLUGS.has(s),
      "That word is reserved. Try another.",
    ),
});
export type EventSlugValues = z.output<typeof eventSlugSchema>;
