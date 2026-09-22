/**
 * THE FORENSIC CAPTURE SEAM, AND WHAT IT HAS TO KNOW ABOUT A GUEST (trust-safety-forensics.md; the
 * guest identity round, Will 2026-09-22).
 *
 * One deny-all `upload_forensics` row per completed upload, and the identity on it is DENORMALIZED
 * as it stood at upload time so a later claim, rename or detach cannot rewrite history. For a guest
 * at level 2 — a typed name plus an address nobody has proved — the typed name and that address are
 * the only things in the whole system that connect the upload to a person, so a record that omitted
 * either would describe an upload by an untraceable stranger.
 *
 * Two properties are held here beyond the happy path:
 *   ★ THE SELECT MUST ASK FOR IT. A column the lookup never reads is a column the row never carries,
 *     and nothing about that failure is visible: the insert succeeds with a null.
 *   ★ CAPTURE IS NEVER FATAL, AND NEVER SILENT. The upload has already happened by the time this
 *     runs, so a failure warns through Sentry and returns; it must not throw at the caller.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const captureWarning = vi.fn();
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: (...args: unknown[]) => captureWarning(...args),
}));

/** What the guests lookup answers, what it was asked for, and what landed in upload_forensics. */
let guestRow: Record<string, unknown> | null = null;
let guestError: { message: string } | null = null;
let guestSelect = "";
let upserted: Record<string, unknown> | null = null;
let upsertOptions: unknown = null;
let upsertError: { message: string } | null = null;

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from(table: string) {
      if (table === "guests") {
        const builder = {
          select(columns: string) {
            guestSelect = columns;
            return builder;
          },
          eq: () => builder,
          maybeSingle: () =>
            Promise.resolve({ data: guestRow, error: guestError }),
        };
        return builder;
      }
      return {
        upsert(row: Record<string, unknown>, options: unknown) {
          upserted = row;
          upsertOptions = options;
          return Promise.resolve({ error: upsertError });
        },
      };
    },
  }),
}));

const { captureUploadForensics } = await import("@/lib/forensics/capture");

const EVENT = "11111111-1111-4111-8111-111111111111";
const MEDIA = "22222222-2222-4222-8222-222222222222";
const KEY = `events/${EVENT}/photo/${MEDIA}/original.jpg`;
const SESSION = "a".repeat(64);

function headers(): Headers {
  return new Headers({
    "x-forwarded-for": "203.0.113.7",
    "user-agent": "Mozilla/5.0 (iPhone)",
    "sec-ch-ua-platform": '"iOS"',
  });
}

function capture(
  overrides: Partial<Parameters<typeof captureUploadForensics>[0]> = {},
) {
  return captureUploadForensics({
    headers: headers(),
    mediaId: MEDIA,
    key: KEY,
    deviceUuid: "33333333-3333-4333-8333-333333333333",
    identity: { kind: "guest", sessionToken: SESSION },
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  guestError = null;
  upsertError = null;
  guestSelect = "";
  upserted = null;
  upsertOptions = null;
  guestRow = {
    id: "g1",
    user_id: null,
    email: null,
    display_name: "Maya J.",
    pending_email: "maya@example.com",
  };
});

describe("the guest lookup asks for the whole identity", () => {
  it("★ selects pending_email beside the typed name (a column not asked for is a null on the row)", async () => {
    await capture();
    expect(guestSelect).toBe("id, user_id, email, display_name, pending_email");
  });
});

describe("the row it writes", () => {
  it("★ denormalizes the typed name AND the unproved address", async () => {
    await capture();
    expect(upserted).toMatchObject({
      media_id: MEDIA,
      event_id: EVENT,
      uploader_kind: "guest",
      guest_id: "g1",
      guest_display_name: "Maya J.",
      guest_pending_email: "maya@example.com",
    });
  });

  it("carries the request facts and the device uuid alongside", async () => {
    await capture();
    expect(upserted).toMatchObject({
      ip: "203.0.113.7",
      user_agent: "Mozilla/5.0 (iPhone)",
      device_uuid: "33333333-3333-4333-8333-333333333333",
    });
  });

  it("null for a guest who typed no address (level 1), never undefined", async () => {
    guestRow = {
      id: "g1",
      user_id: null,
      email: null,
      display_name: "Theo",
      pending_email: null,
    };
    await capture();
    expect(upserted).toMatchObject({
      guest_display_name: "Theo",
      guest_pending_email: null,
    });
  });

  it("a CONFIRMED guest carries the proved address in guest_email and no unproved one", async () => {
    guestRow = {
      id: "g1",
      user_id: "u1",
      email: "alex@example.com",
      display_name: null,
      pending_email: null,
    };
    await capture();
    expect(upserted).toMatchObject({
      guest_email: "alex@example.com",
      guest_pending_email: null,
    });
  });

  it("★ a HOST upload never looks a guest up at all, and carries no guest identity", async () => {
    await capture({ identity: { kind: "host", hostUserId: "host-1" } });
    expect(guestSelect).toBe("");
    expect(upserted).toMatchObject({
      uploader_kind: "host",
      host_user_id: "host-1",
      guest_id: null,
      guest_email: null,
      guest_display_name: null,
      guest_pending_email: null,
    });
  });

  it("is retry-idempotent: the FIRST row is the evidence", async () => {
    await capture();
    expect(upsertOptions).toEqual({
      onConflict: "media_id",
      ignoreDuplicates: true,
    });
  });
});

describe("loud, never fatal", () => {
  it("an unparseable key warns and writes nothing, rather than throwing at the caller", async () => {
    await expect(capture({ key: "not/our/layout" })).resolves.toBeUndefined();
    expect(upserted).toBeNull();
    expect(captureWarning).toHaveBeenCalledWith(
      "security",
      "forensic_capture_failed",
      expect.objectContaining({ media_id: MEDIA }),
    );
  });

  it("a failed guest lookup warns, and the upload still stands", async () => {
    guestError = { message: "connection reset" };
    await expect(capture()).resolves.toBeUndefined();
    expect(captureWarning).toHaveBeenCalled();
  });

  it("a failed insert warns, and the upload still stands", async () => {
    upsertError = { message: "deadlock detected" };
    await expect(capture()).resolves.toBeUndefined();
    expect(captureWarning).toHaveBeenCalled();
  });
});
