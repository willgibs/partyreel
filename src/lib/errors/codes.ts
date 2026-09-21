/**
 * THE ERROR TAXONOMY (program Phase 2, slice 4). One superset union of every
 * failure code the app can return, plus user-facing fallback copy per code.
 *
 * The contract:
 * - Per-file result unions (mutations, actions, API routes) stay NARROW; this
 *   union is the superset they must all fit inside. codes.test.ts holds
 *   compiler-enforced subtype assertions, so adding a code to a route without
 *   adding it here is a type error in CI, never a silent drift.
 * - `message` on a result is OPTIONAL context from the producer; the consumer
 *   falls back to FALLBACK_MESSAGES via messageFor(). New surfaces should
 *   prefer codes + fallbacks over hand-rolled inline copy.
 * - Copy rules: plain language, no em-dashes (the AST guard enforces it), no
 *   internals leaked. Generic codes (unknown/error/server_error/failed) all
 *   read identically on purpose.
 */

export type ErrorCode =
  // authz / identity
  | "unauthorized"
  | "not_owner"
  | "invalid_session"
  // request shape
  | "bad_request"
  | "validation"
  | "not_found"
  // uploads + media
  | "unsupported_type"
  | "invalid_file"
  | "invalid_image"
  | "invalid_media"
  | "too_large"
  | "too_long"
  | "video_not_allowed"
  | "uploads_closed"
  | "bad_key"
  | "complete_failed"
  // caps + plan limits
  | "cap_reached"
  | "limit_reached"
  | "insufficient_space"
  | "event_limit"
  // event lifecycle
  | "event_deleted"
  | "event_gone"
  // guest access
  | "verification_required"
  | "name_required"
  | "name_invalid"
  | "incorrect_password"
  | "wrong_password"
  | "unlock_required"
  | "not_configured"
  | "rate_limited"
  // billing
  | "no_customer"
  | "not_eligible"
  // delivery
  | "send_failed"
  // generic buckets
  | "failed"
  | "server_error"
  | "error"
  | "unknown";

export const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";

/**
 * User-facing copy when the producer didn't attach a message. Keyed total
 * (Record over ErrorCode) so a new code without copy is a type error.
 */
export const FALLBACK_MESSAGES: Record<ErrorCode, string> = {
  unauthorized: "You don't have permission to do that.",
  not_owner: "You don't have permission to do that.",
  invalid_session: "Your session has expired. Refresh the page and try again.",
  bad_request: "That request didn't look right. Please try again.",
  validation: "Please check the form and try again.",
  not_found: "We couldn't find that.",
  unsupported_type: "That file type isn't supported.",
  invalid_file: "That file can't be uploaded.",
  invalid_image: "That image can't be used. Try a different one.",
  invalid_media: "That item is no longer available.",
  too_large: "That file is too large.",
  too_long: "That video is too long.",
  video_not_allowed: "Videos aren't available on this event's plan.",
  uploads_closed: "Uploads are closed for this event.",
  bad_key: "Something went wrong with that upload. Please try again.",
  complete_failed: "We couldn't finish that upload. Please try again.",
  cap_reached: "This event's storage is full.",
  limit_reached: "You've reached your plan's limit.",
  insufficient_space: "There isn't enough space left to do that.",
  event_limit: "You've reached your plan's event limit.",
  event_deleted: "That event has been deleted.",
  event_gone: "That event is no longer available.",
  verification_required: "Confirm your email to join this event.",
  name_required: "Enter a name.",
  name_invalid: "That name isn't available.",
  incorrect_password: "That password is incorrect.",
  wrong_password: "That password is incorrect.",
  unlock_required: "This event is locked. Enter the event password to continue.",
  not_configured: "That isn't set up for this event.",
  rate_limited: "Too many attempts. Wait a moment and try again.",
  no_customer: "We couldn't find billing details for your account.",
  not_eligible: "Your account isn't eligible for that change.",
  send_failed: "We couldn't send that. Please try again.",
  failed: DEFAULT_ERROR_MESSAGE,
  server_error: DEFAULT_ERROR_MESSAGE,
  error: DEFAULT_ERROR_MESSAGE,
  unknown: DEFAULT_ERROR_MESSAGE,
};

/** The canonical failure arm: producers attach a code, message is optional. */
export type ActionFailure = {
  ok: false;
  code: ErrorCode;
  message?: string;
};

/**
 * Resolve the copy to show: the producer's message wins, then the code's
 * fallback, then the generic default (covers untyped `code: string` callers
 * like the uploader's passthrough responses).
 */
export function messageFor(code: string, message?: string): string {
  if (message) return message;
  return (
    (FALLBACK_MESSAGES as Record<string, string>)[code] ??
    DEFAULT_ERROR_MESSAGE
  );
}
