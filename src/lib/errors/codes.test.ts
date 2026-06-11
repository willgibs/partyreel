/**
 * Compiler-enforced taxonomy contract: every per-file result union's failure
 * codes must be a subtype of ErrorCode. If a route/mutation grows a new code
 * without adding it to the taxonomy (and its fallback copy), the IsSubtype
 * line for that file becomes a type error and the suite fails to build.
 * Runtime tests cover the copy rules + messageFor resolution.
 */
import { describe, expect, it } from "vitest";

import type { ActionResult as AccountActionResult } from "@/app/(app)/account/actions";
import type { ActionResult as DashboardActionResult } from "@/app/(app)/dashboard/actions";
import type {
  CreateGuestResult,
  CreateMediaResult,
  UploadContextResult,
} from "@/lib/db/mutations/guest";
import type {
  CreateHostMediaResult,
  HostUploadContextResult,
} from "@/lib/db/mutations/host-media";
import type { MutationResult } from "@/lib/db/mutations/events";
import type { CreateReportResult } from "@/lib/db/mutations/report";
import type { GuestEventResult } from "@/lib/db/queries/guest-events";

import {
  DEFAULT_ERROR_MESSAGE,
  FALLBACK_MESSAGES,
  messageFor,
  type ErrorCode,
} from "./codes";

// --- type-level assertions (these "tests" run at compile time) -------------

type CodeOf<R> = Extract<R, { ok: false }> extends { code: infer C }
  ? C
  : never;
type IsSubtype<A, B> = [A] extends [B] ? true : false;
type Expect<T extends true> = T;

// Mutations
type _guest = Expect<IsSubtype<CodeOf<CreateGuestResult>, ErrorCode>>;
type _guestCtx = Expect<IsSubtype<CodeOf<UploadContextResult>, ErrorCode>>;
type _media = Expect<IsSubtype<CodeOf<CreateMediaResult>, ErrorCode>>;
type _hostCtx = Expect<IsSubtype<CodeOf<HostUploadContextResult>, ErrorCode>>;
type _hostMedia = Expect<IsSubtype<CodeOf<CreateHostMediaResult>, ErrorCode>>;
type _mutation = Expect<IsSubtype<CodeOf<MutationResult<unknown>>, ErrorCode>>;
type _report = Expect<IsSubtype<CodeOf<CreateReportResult>, ErrorCode>>;

// Server actions
type _dashboard = Expect<IsSubtype<CodeOf<DashboardActionResult>, ErrorCode>>;
type _account = Expect<IsSubtype<CodeOf<AccountActionResult>, ErrorCode>>;

// Queries with code-carrying failure arms
type _guestEvent = Expect<IsSubtype<CodeOf<GuestEventResult>, ErrorCode>>;

// API-route inline codes (no exported types; the literal lists below mirror
// the routes and act as the tripwire when one of them grows a code). Listed
// per route file - when you add a code to a route, add it to ITS mirror here
// (and to ErrorCode + FALLBACK_MESSAGES) or this suite fails to compile.
type AvatarRouteCode =
  | "unauthorized"
  | "unsupported_type"
  | "too_large"
  | "invalid_image"
  | "server_error";
type GuestPresignCode =
  | "bad_request"
  | "unsupported_type"
  | "invalid_file"
  | "invalid_session"
  | "event_gone"
  | "uploads_closed"
  | "video_not_allowed"
  | "cap_reached"
  | "too_large";
type HostPresignCode =
  | "unauthorized"
  | "bad_request"
  | "unsupported_type"
  | "invalid_file"
  | "not_found"
  | "video_not_allowed"
  | "cap_reached";
type GuestRouteCode = "bad_request" | "rate_limited";
type UnlockRouteCode =
  | "bad_request"
  | "rate_limited"
  | "wrong_password"
  | "not_configured";
type CaptureEmailCode =
  | "unauthorized"
  | "bad_request"
  | "rate_limited"
  | "failed";
type GalleryRouteCode = "bad_request";
type StripeRouteCode =
  | "unauthorized"
  | "bad_request"
  | "not_eligible"
  | "no_customer";
type MeMenuCode = "unauthorized";
type ReportsRouteCode = "bad_request" | "rate_limited";
// Guest api/r2/complete-upload inline codes; the host route adds unauthorized.
type CompleteUploadCode =
  | "bad_request"
  | "unsupported_type"
  | "too_large"
  | "complete_failed"
  | "bad_key";
type HostCompleteUploadCode = CompleteUploadCode | "unauthorized";
type _avatar = Expect<IsSubtype<AvatarRouteCode, ErrorCode>>;
type _presign = Expect<IsSubtype<GuestPresignCode, ErrorCode>>;
type _hostPresign = Expect<IsSubtype<HostPresignCode, ErrorCode>>;
type _guests = Expect<IsSubtype<GuestRouteCode, ErrorCode>>;
type _unlock = Expect<IsSubtype<UnlockRouteCode, ErrorCode>>;
type _captureEmail = Expect<IsSubtype<CaptureEmailCode, ErrorCode>>;
type _gallery = Expect<IsSubtype<GalleryRouteCode, ErrorCode>>;
type _stripe = Expect<IsSubtype<StripeRouteCode, ErrorCode>>;
type _meMenu = Expect<IsSubtype<MeMenuCode, ErrorCode>>;
type _reports = Expect<IsSubtype<ReportsRouteCode, ErrorCode>>;
type _complete = Expect<IsSubtype<CompleteUploadCode, ErrorCode>>;
type _hostComplete = Expect<IsSubtype<HostCompleteUploadCode, ErrorCode>>;

// Keep TS from flagging the assertion aliases as unused.
export type _TaxonomyAssertions = [
  _guest,
  _guestCtx,
  _media,
  _hostCtx,
  _hostMedia,
  _mutation,
  _report,
  _dashboard,
  _account,
  _guestEvent,
  _avatar,
  _presign,
  _hostPresign,
  _guests,
  _unlock,
  _captureEmail,
  _gallery,
  _stripe,
  _meMenu,
  _reports,
  _complete,
  _hostComplete,
];

// --- runtime: copy rules + resolution ---------------------------------------

describe("error taxonomy fallbacks", () => {
  it("every code has non-empty user copy", () => {
    for (const [code, message] of Object.entries(FALLBACK_MESSAGES)) {
      expect(message.length, code).toBeGreaterThan(0);
    }
  });

  it("copy follows the rules: no em-dashes, no internals", () => {
    for (const message of Object.values(FALLBACK_MESSAGES)) {
      expect(message).not.toContain("—");
      expect(message.toLowerCase()).not.toMatch(/sql|postgres|supabase|stack/);
    }
  });

  it("messageFor prefers the producer message, then fallback, then default", () => {
    expect(messageFor("too_large", "Max 2 GB per file.")).toBe(
      "Max 2 GB per file.",
    );
    expect(messageFor("too_large")).toBe(FALLBACK_MESSAGES.too_large);
    expect(messageFor("some_future_code")).toBe(DEFAULT_ERROR_MESSAGE);
  });

  it("the generic buckets all read identically", () => {
    expect(FALLBACK_MESSAGES.unknown).toBe(DEFAULT_ERROR_MESSAGE);
    expect(FALLBACK_MESSAGES.error).toBe(DEFAULT_ERROR_MESSAGE);
    expect(FALLBACK_MESSAGES.server_error).toBe(DEFAULT_ERROR_MESSAGE);
    expect(FALLBACK_MESSAGES.failed).toBe(DEFAULT_ERROR_MESSAGE);
  });
});
