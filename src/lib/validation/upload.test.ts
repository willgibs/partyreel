import { describe, expect, it } from "vitest";

import {
  completeUploadSchema,
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

describe("joinSchema", () => {
  it("requires a qr_token", () => {
    expect(joinSchema.safeParse({}).success).toBe(false);
  });

  it("rejects a malformed email", () => {
    expect(joinSchema.safeParse({ qr_token: "q", email: "nope" }).success).toBe(
      false,
    );
  });

  it("allows an empty email", () => {
    expect(joinSchema.safeParse({ qr_token: "q", email: "" }).success).toBe(
      true,
    );
  });
});
