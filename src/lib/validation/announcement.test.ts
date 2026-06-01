import { describe, expect, it } from "vitest";

import { announcementSchema } from "@/lib/validation/announcement";

// The compose form + the publish action share this schema; it's the data contract for what reaches
// every host's notification bell, so the required/optional/url/date rules are worth pinning down.
describe("announcementSchema", () => {
  it("accepts a minimal valid announcement (title + body)", () => {
    expect(
      announcementSchema.safeParse({ title: "Hi", body: "Welcome" }).success,
    ).toBe(true);
  });

  it("requires a non-empty title and body", () => {
    expect(announcementSchema.safeParse({ title: "", body: "x" }).success).toBe(
      false,
    );
    expect(announcementSchema.safeParse({ title: "x", body: "" }).success).toBe(
      false,
    );
    expect(
      announcementSchema.safeParse({ title: "   ", body: "x" }).success,
    ).toBe(false);
  });

  it("allows empty optional href + publishedAt", () => {
    expect(
      announcementSchema.safeParse({
        title: "a",
        body: "b",
        href: "",
        publishedAt: "",
      }).success,
    ).toBe(true);
  });

  it("validates href as a URL only when present", () => {
    expect(
      announcementSchema.safeParse({ title: "a", body: "b", href: "not-a-url" })
        .success,
    ).toBe(false);
    expect(
      announcementSchema.safeParse({
        title: "a",
        body: "b",
        href: "https://partyreel.com/pricing",
      }).success,
    ).toBe(true);
  });

  it("validates publishedAt parses as a date only when present", () => {
    expect(
      announcementSchema.safeParse({
        title: "a",
        body: "b",
        publishedAt: "nonsense",
      }).success,
    ).toBe(false);
    expect(
      announcementSchema.safeParse({
        title: "a",
        body: "b",
        publishedAt: "2026-06-15T14:30",
      }).success,
    ).toBe(true);
  });
});
