import { describe, expect, it } from "vitest";

import { DISPLAY_NAME_MAX_LENGTH } from "@/lib/validation/profile";
import {
  completeUploadSchema,
  hostCompleteUploadSchema,
  hostPresignUploadSchema,
  joinSchema,
  parseGuestDisplayName,
  presignUploadSchema,
  renameGuestSchema,
} from "@/lib/validation/upload";

describe("presignUploadSchema", () => {
  it("strips a client-supplied key (the server builds the key)", () => {
    const parsed = presignUploadSchema.parse({
      session_token: "tok",
      content_type: "image/jpeg",
      size_bytes: 1234,
      key: "events/someone-elses-event/evil.jpg",
    });
    expect("key" in parsed).toBe(false);
  });

  it("requires a session_token", () => {
    expect(
      presignUploadSchema.safeParse({
        content_type: "image/jpeg",
        size_bytes: 1,
      }).success,
    ).toBe(false);
  });

  it("rejects a non-positive size", () => {
    expect(
      presignUploadSchema.safeParse({
        session_token: "t",
        content_type: "image/jpeg",
        size_bytes: 0,
      }).success,
    ).toBe(false);
  });
});

describe("completeUploadSchema", () => {
  it("requires a uuid media_id", () => {
    expect(
      completeUploadSchema.safeParse({
        session_token: "t",
        media_id: "not-a-uuid",
        key: "k",
        content_type: "image/jpeg",
        size_bytes: 1,
        upload_id: null,
      }).success,
    ).toBe(false);
  });

  it("accepts a single-PUT completion (null upload_id, default empty parts)", () => {
    const result = completeUploadSchema.safeParse({
      session_token: "t",
      media_id: "11111111-1111-4111-8111-111111111111",
      key: "events/e/photo/m/original.jpg",
      content_type: "image/jpeg",
      size_bytes: 1,
      upload_id: null,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.parts).toEqual([]);
  });
});

describe("hostPresignUploadSchema", () => {
  it("requires a uuid event_id (not a capability session_token)", () => {
    // A guest-shaped payload (session_token, no event_id) must NOT validate here.
    expect(
      hostPresignUploadSchema.safeParse({
        session_token: "tok",
        content_type: "image/jpeg",
        size_bytes: 1234,
      }).success,
    ).toBe(false);
    // A non-uuid event_id is rejected.
    expect(
      hostPresignUploadSchema.safeParse({
        event_id: "not-a-uuid",
        content_type: "image/jpeg",
        size_bytes: 1234,
      }).success,
    ).toBe(false);
  });

  it("strips a client-supplied key (the server builds the key)", () => {
    const parsed = hostPresignUploadSchema.parse({
      event_id: "11111111-1111-4111-8111-111111111111",
      content_type: "image/jpeg",
      size_bytes: 1234,
      key: "events/someone-elses-event/evil.jpg",
    });
    expect("key" in parsed).toBe(false);
  });

  it("rejects a non-positive size", () => {
    expect(
      hostPresignUploadSchema.safeParse({
        event_id: "11111111-1111-4111-8111-111111111111",
        content_type: "image/jpeg",
        size_bytes: 0,
      }).success,
    ).toBe(false);
  });
});

describe("hostCompleteUploadSchema", () => {
  it("requires a uuid event_id and media_id", () => {
    expect(
      hostCompleteUploadSchema.safeParse({
        event_id: "not-a-uuid",
        media_id: "11111111-1111-4111-8111-111111111111",
        key: "k",
        content_type: "image/jpeg",
        size_bytes: 1,
        upload_id: null,
      }).success,
    ).toBe(false);
  });

  it("accepts a single-PUT completion (null upload_id, default empty parts)", () => {
    const result = hostCompleteUploadSchema.safeParse({
      event_id: "22222222-2222-4222-8222-222222222222",
      media_id: "11111111-1111-4111-8111-111111111111",
      key: "events/e/photo/m/original.jpg",
      content_type: "image/jpeg",
      size_bytes: 1,
      upload_id: null,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.parts).toEqual([]);
  });
});

describe("joinSchema", () => {
  it("requires a qr_token", () => {
    expect(joinSchema.safeParse({}).success).toBe(false);
  });

  it("accepts a lone qr_token (a VERIFIED joiner sends no name at all)", () => {
    // The identity is still a verified Supabase session derived inside create_guest, never a field
    // in this request; a typed name is what a NAME-ONLY event asks for, and the route decides
    // which of the two this event wants.
    expect(joinSchema.safeParse({ qr_token: "q" }).success).toBe(true);
  });

  it("carries a typed display_name through, unvalidated (the route owns the name's rules)", () => {
    const parsed = joinSchema.safeParse({ qr_token: "q", display_name: "  " });
    // A blank does NOT fail the envelope: if it did, the route could only answer a flat 400, and
    // the door needs "Enter a name." with a 422 it can render beside the field.
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.display_name).toBe("  ");
  });

  it("never carries an email (the poisoning surface the reshape closed)", () => {
    const parsed = joinSchema.parse({ qr_token: "q", email: "evil@example.com" });
    expect("email" in parsed).toBe(false);
  });
});

describe("renameGuestSchema", () => {
  it("requires both capabilities: the qr_token AND the session_token", () => {
    expect(renameGuestSchema.safeParse({ qr_token: "q" }).success).toBe(false);
    expect(renameGuestSchema.safeParse({ session_token: "s" }).success).toBe(
      false,
    );
    expect(
      renameGuestSchema.safeParse({ qr_token: "q", session_token: "s" }).success,
    ).toBe(true);
  });

  it("never carries a guest_id or a user_id (the session token IS the capability)", () => {
    const parsed = renameGuestSchema.parse({
      qr_token: "q",
      session_token: "s",
      display_name: "Sam",
      guest_id: "someone-elses-guest-row",
      user_id: "someone-elses-account",
    });
    expect("guest_id" in parsed).toBe(false);
    expect("user_id" in parsed).toBe(false);
  });
});

describe("parseGuestDisplayName", () => {
  it("trims, and returns the trimmed name", () => {
    const out = parseGuestDisplayName("  Maya J.  ");
    expect(out).toEqual({ ok: true, name: "Maya J." });
  });

  it("answers name_required for nothing, a blank, and a non-string", () => {
    for (const raw of [undefined, null, "", "   ", 42, {}]) {
      const out = parseGuestDisplayName(raw);
      expect(out.ok).toBe(false);
      if (!out.ok) expect(out.code).toBe("name_required");
    }
  });

  it(`answers name_invalid past ${DISPLAY_NAME_MAX_LENGTH} characters (the DB CHECK's twin)`, () => {
    expect(parseGuestDisplayName("x".repeat(DISPLAY_NAME_MAX_LENGTH)).ok).toBe(
      true,
    );
    const out = parseGuestDisplayName("x".repeat(DISPLAY_NAME_MAX_LENGTH + 1));
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.code).toBe("name_invalid");
  });

  it("answers name_invalid for a reserved name (impersonation), whatever the case", () => {
    for (const raw of ["admin", "Partyreel", "  SUPPORT  "]) {
      const out = parseGuestDisplayName(raw);
      expect(out.ok, raw).toBe(false);
      if (!out.ok) expect(out.code).toBe("name_invalid");
    }
  });

  it("every refusal carries a sentence a guest can read", () => {
    for (const raw of ["", "admin", "x".repeat(200)]) {
      const out = parseGuestDisplayName(raw);
      expect(out.ok).toBe(false);
      if (!out.ok) {
        expect(out.message.length).toBeGreaterThan(0);
        expect(out.message).not.toContain("—"); // the copy policy
      }
    }
  });
});
