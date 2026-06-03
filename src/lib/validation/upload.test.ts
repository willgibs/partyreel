import { describe, expect, it } from "vitest";

import {
  completeUploadSchema,
  hostCompleteUploadSchema,
  hostPresignUploadSchema,
  joinSchema,
  presignUploadSchema,
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

  it("accepts a lone qr_token (identity is the verified session, not the body)", () => {
    // Phase 2c: the join carries ONLY qr_token; require-email is a verified Supabase
    // session derived inside create_guest, never a field in this request.
    expect(joinSchema.safeParse({ qr_token: "q" }).success).toBe(true);
  });
});
