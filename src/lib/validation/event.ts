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
 *
 * ★ THE REEL'S THREE DEFAULTS ARE UPDATE-ONLY (`reelFields`). A new event takes
 * their column defaults (the reel on, the default mood, the default hold), so they
 * join the update and never the create: a create that sent one has it stripped,
 * as `z.object` strips an unknown key. Each is nullable, and null hands the
 * setting back to the product's own default.
 */
import { z } from "zod";

import { Constants } from "@/lib/db/types";
import { QR_STYLE_KEYS } from "@/lib/constants/qr-presets";
import {
  BRAND_NAME_MESSAGE,
  isBrandSlug,
  RESERVED_SLUGS,
  RESERVED_WORD_MESSAGE,
} from "@/lib/constants/reserved-slugs";
import { CAPTURES } from "@/lib/disposable/facts";
import {
  DEVELOP_MAX_AHEAD_DAYS,
  developTimeWithinReach,
} from "@/lib/disposable/reveal";
import {
  FIRST_EVENT_YEAR,
  isSaneDay,
  LAST_EVENT_YEAR,
} from "@/lib/events/dates";
import { MAX_UPLOAD_BYTES, MIN_UPLOAD_CAP_BYTES } from "@/lib/media/limits";
import { isHoldStep, isReelMoodId } from "@/lib/reel/defaults";

/**
 * ★ A DATE REFUSES IN A HOST'S WORDS (crumbs-59, red-team 47's NIT: zod's stock "Invalid ISO date" and "Invalid input").
 * Settings sends a date field's own value, so these meet a crafted request, a stale tab, or a year with a fifth digit
 * (the field says its own first, `event-page.tsx`, from the same window): a line that fits under a field and in a toast.
 */
export const DATE_UNREADABLE =
  "That doesn't look like a date. Pick one from the calendar.";
export const DATE_OUT_OF_RANGE = `Pick a year from ${FIRST_EVENT_YEAR} to ${LAST_EVENT_YEAR}.`;

/**
 * ONE DAY AS A DATE FIELD SENDS IT: a real calendar day inside the window of years an event may name (`isSaneDay`: Chrome's
 * field passes 0002, 0020 and 0202 on its way to a typed 2027, and a column holds Postgres's `'infinity'`, so neither is a
 * day), or "" to clear it. The date's own failure aborts, so a bad day says one thing, once.
 */
const eventDay = z.union(
  [
    z.iso
      .date({ error: DATE_UNREADABLE, abort: true })
      .refine(isSaneDay, DATE_OUT_OF_RANGE),
    z.literal(""),
  ],
  DATE_UNREADABLE,
);

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
  event_date: eventDay.optional(),
  // ★ THE LAST DAY OF A RANGE OF DAYS (lane `event-dates`, 20261003120000), as informational as the date: it says
  // when the event happens and never ends, locks or purges anything. It travels with its first day (`datesInOrder`
  // below, the CHECK `events_end_date_on_or_after` the boundary); "" clears it, and the mutation stores a range said
  // twice as the one day it is.
  event_end_date: eventDay.optional(),
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
  // ★ REQUIRE AN UPLOAD TO VIEW, OFF BY DEFAULT (the door as three steps, Will 2026-09-21).
  // On, a guest (never the host) sees the full album only
  // once one upload of theirs has completed, approved or held for review; the gate FAILS OPEN
  // while uploads are closed or the album is full, so nobody is ever held at a step they cannot
  // pass. Off (the default), the album opens after the name or the confirmed email. Free on every
  // tier: a genuinely new flag with no legacy twin and no tier gate (GATED_EVENT_SETTINGS gates no
  // setting at all since the free/pro shift). Mirrors the events.require_upload_to_view column
  // default (false).
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

/** The refusals of a range in words, in Settings' own field names, said on the end date where the field sits. */
export const LAST_DAY_BEFORE_FIRST =
  "The end date can't be before the event date.";
export const LAST_DAY_WITHOUT_FIRST = "Add the event date first.";

/**
 * ★ AN END TRAVELS WITH ITS START, AND NEVER BEFORE IT. A save or a create that names a last day names its first
 * beside it (Settings sends the two together), so the order is checked here, in words, before the database's CHECK
 * (`events_end_date_on_or_after`) would refuse it; a cleared last day ("") asks nothing. Applied after the object
 * is whole (and after the update's `.partial()`): zod 4 refuses to pick, omit or partial a refined object.
 */
function datesInOrder(
  v: { event_date?: string; event_end_date?: string },
  ctx: z.RefinementCtx,
) {
  if (!v.event_end_date) return;
  if (!v.event_date) {
    ctx.addIssue({
      code: "custom",
      path: ["event_end_date"],
      message: LAST_DAY_WITHOUT_FIRST,
    });
  } else if (v.event_end_date < v.event_date) {
    ctx.addIssue({
      code: "custom",
      path: ["event_end_date"],
      message: LAST_DAY_BEFORE_FIRST,
    });
  }
}

// HOW GUESTS ADD AND WHEN THE ALBUM DEVELOPS (lane `disposable-foundation`, 20261002200000). A new event is born with
// them too (create-wizard r3's add=styles: a style is these two columns and `moderation_mode`, one insert, so no
// half-state is ever stored), and the update sends them as Settings' styles and develop time change them.
//  - `capture`: free uploads or the album's camera. The database fills in the roll (24) and stamps its period
//    (`events.sealed_from`, never written here); `roll_size` is the wizard's to name later, never this form's.
//  - `develops_at`: the develop time, or null for none. Any real time up to a year and a day ahead; one at or before
//    now (Develop now writes the browser's now) is stored as the database's own now. The column holds only a
//    finite-time envelope (`events_develops_at_finite`), so this bound is the write's.
// The third, `moderation_mode`, is the event's own field above: the three-way "when everyone sees" writes it beside
// `develops_at`, and `createEvent` and `updateEvent` refuse the pair approval-with-a-develop in words
// (`approvalWithADevelop`) before the database's CHECK would.
const developFields = {
  capture: z.enum(CAPTURES),
  develops_at: z.iso
    .datetime({ offset: true })
    .refine(
      (iso) => developTimeWithinReach(iso),
      `Pick a develop time within ${DEVELOP_MAX_AHEAD_DAYS} days.`,
    )
    .nullable(),
};

/**
 * A CREATE: the fields, with the defaults a new event needs (each mirrors its column default), so
 * a create that names only the event lands every setting a host who never touched one gets.
 */
export const createEventSchema = z
  .object({
    ...eventFields,
    visibility: eventFields.visibility.default("open"),
    accepting_uploads: eventFields.accepting_uploads.default(true),
    require_verified_email: eventFields.require_verified_email.default(true),
    require_upload_to_view: eventFields.require_upload_to_view.default(false),
    moderation_mode: eventFields.moderation_mode.default("live"),
    qr_style: eventFields.qr_style.default("classic"),
    // The album's style at birth: free uploads and no develop time, as the columns default.
    capture: developFields.capture.default("upload"),
    develops_at: developFields.develops_at.default(null),
  })
  .superRefine(datesInOrder);

// The reel's event-wide defaults (Will, reel-host `style=both`): what every viewer STARTS on, each
// viewer's own change staying on their device. Update-only (see the header).
const reelFields = {
  // The host's switch for the reel everywhere it shows (the album's tile, the view, a screen).
  show_reel: z.boolean(),
  // One of the eight moods, or null for the default mood. The column carries no CHECK (a new mood
  // needs no migration), so this refusal is the write's boundary.
  reel_style_id: z
    .string()
    .refine(isReelMoodId, "Pick one of the reel's looks.")
    .nullable(),
  // Exactly one of the hold's steps, or null for the default hold. The database holds only an
  // envelope around the steps (events_reel_hold_sec_range), so this is the step check.
  reel_hold_sec: z
    .number()
    .refine(isHoldStep, "Pick one of the hold's steps.")
    .nullable(),
};

// The host's Videos switch (event-settings r1, Will `lock=switch`: "so a host can keep an album to
// photos"), update-only like the reel's: a new event takes its column default (on), and the switch
// only ever narrows. ★ IT GRANTS NOTHING: a Free album still takes no video whatever it holds, since
// the upload's own gate reads the plan (`create_media`), never this column alone.
const videoFields = {
  allow_videos: z.boolean(),
};

/**
 * AN UPDATE: exactly the keys a caller sent, and nothing else. `updateEvent` patches every
 * defined key, so a default here would be a WRITE (the header's defect): a one-field save
 * (`{ qr_style }` from the QR designer, `{ moderation_mode }` from the review room) must parse to
 * that one field.
 */
export const updateEventSchema = z
  .object({ ...eventFields, ...reelFields, ...videoFields, ...developFields })
  .partial()
  .superRefine(datesInOrder);

/**
 * `setReelDefaults`' input (lib/reel/defaults-action.ts), the one write both the view's "Set for
 * everyone" and Settings' Highlight reel section call: the event, then any of the three defaults,
 * each the update's own field. Unknown keys are stripped, so it can never carry another setting.
 */
export const reelDefaultsInputSchema = z.object({
  eventId: z.uuid("Unknown event."),
  showReel: reelFields.show_reel.optional(),
  styleId: reelFields.reel_style_id.optional(),
  holdSec: reelFields.reel_hold_sec.optional(),
});
export type ReelDefaultsInput = z.input<typeof reelDefaultsInputSchema>;

// The create's input ≠ output because of its `.default()`s: the wizard's resolver works with
// the INPUT type (booleans optional), the action consumes the OUTPUT type (applied). An update's
// two types are the same shape (every key optional), kept as two names so the settings form's
// resolver reads the pair it always has.
export type CreateEventInput = z.input<typeof createEventSchema>;
export type CreateEventValues = z.output<typeof createEventSchema>;
export type UpdateEventInput = z.input<typeof updateEventSchema>;
export type UpdateEventValues = z.output<typeof updateEventSchema>;

// Album password (set / change), on every plan. The DB RPC (set_event_password) re-checks
// the length (defense-in-depth); this is the shared client + action shape.
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

// Custom event slug (every plan) — an optional human-friendly ALIAS for the /e/[token]
// link. Normalized to lowercase, then validated. The DB RPC (set_event_slug) re-checks
// format, the reserved words, the brand's family and uniqueness, and is the boundary (a host can
// call it past the action); this is the shared client + action shape, and the friendly refusal
// for either reserved kind (lib/constants/reserved-slugs.ts, which the SQL mirrors word for word).
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
    .refine((s) => !RESERVED_SLUGS.has(s), RESERVED_WORD_MESSAGE)
    // Any slug that CONTAINS the name, a hyphen or a look-alike digit included (`party-reel`,
    // `p4rtyr33l`): the whole-word list above cannot see `partyreel-support`.
    .refine((s) => !isBrandSlug(s), BRAND_NAME_MESSAGE),
});
export type EventSlugValues = z.output<typeof eventSlugSchema>;
