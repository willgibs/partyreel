import { describe, expect, it } from "vitest";

import {
  createEventSchema,
  eventSlugSchema,
  updateEventSchema,
} from "@/lib/validation/event";

function parse(slug: string) {
  return eventSlugSchema.safeParse({ slug });
}

describe("eventSlugSchema", () => {
  it("accepts a simple lowercase slug", () => {
    const result = parse("sarahs-wedding");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.slug).toBe("sarahs-wedding");
  });

  it("trims and lowercases before validating", () => {
    const result = parse("  Sarahs-Wedding  ");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.slug).toBe("sarahs-wedding");
  });

  it("allows internal hyphens and digits", () => {
    expect(parse("party-2026").success).toBe(true);
  });

  it("rejects slugs shorter than 3 characters", () => {
    expect(parse("ab").success).toBe(false);
  });

  it("rejects slugs longer than 50 characters", () => {
    expect(parse("a".repeat(51)).success).toBe(false);
  });

  it("rejects spaces, underscores, and non-ASCII", () => {
    expect(parse("sarah wedding").success).toBe(false);
    expect(parse("sarah_wedding").success).toBe(false);
    expect(parse("café-night").success).toBe(false);
  });

  it("rejects leading and trailing hyphens", () => {
    expect(parse("-wedding").success).toBe(false);
    expect(parse("wedding-").success).toBe(false);
  });

  it("rejects a 32-hex string (it could be mistaken for a qr_token)", () => {
    expect(parse("0123456789abcdef0123456789abcdef").success).toBe(false);
  });

  it("rejects reserved words", () => {
    expect(parse("admin").success).toBe(false);
    expect(parse("pricing").success).toBe(false);
    expect(parse("dashboard").success).toBe(false);
  });
});

describe("createEventSchema: the host's identity switch", () => {
  it("requires a verified email BY DEFAULT (Will, the identity reshape, 2026-09-21)", () => {
    // The default is the whole ruling in one line: a host who never touches the switch runs an
    // event where every guest proves an email. It mirrors the events.require_verified_email column
    // default, so an event created with only a name lands identically whether the client or the
    // server applied it.
    const parsed = createEventSchema.parse({ name: "Sarah's wedding" });
    expect(parsed.require_verified_email).toBe(true);
  });

  it("keeps the legacy twin's default OPPOSITE, so a row naming either is consistent", () => {
    const parsed = createEventSchema.parse({ name: "Sarah's wedding" });
    expect(parsed.allow_anonymous_uploads).toBe(!parsed.require_verified_email);
  });

  it("takes the switch off when the host asks", () => {
    const parsed = createEventSchema.parse({
      name: "Backyard party",
      require_verified_email: false,
    });
    expect(parsed.require_verified_email).toBe(false);
  });
});

describe("createEventSchema: the upload gate (Will, the door as three steps, 2026-09-21)", () => {
  it("defaults Require an upload to view OFF", () => {
    // The album opens after the name (or the confirmed email) unless a host opts in.
    const parsed = createEventSchema.parse({ name: "Sarah's wedding" });
    expect(parsed.require_upload_to_view).toBe(false);
  });

  it("turns the gate on when the host asks", () => {
    const parsed = createEventSchema.parse({
      name: "Backyard party",
      require_upload_to_view: true,
    });
    expect(parsed.require_upload_to_view).toBe(true);
  });

  it("updateEventSchema carries the switch too", () => {
    const parsed = updateEventSchema.parse({ require_upload_to_view: true });
    expect(parsed.require_upload_to_view).toBe(true);
  });
});

// ★ AN UPDATE CARRIES EXACTLY THE KEYS SENT. `updateEvent` patches every defined key, so a key the
// schema INVENTS is a write the host never made: zod 4's `.partial()` keeps each `.default()`, so
// an update derived from the defaulted create turns a QR style save into "open the album, reopen
// uploads, approve every held upload".
describe("updateEventSchema: a partial save is exactly its keys", () => {
  it("parses an empty save to nothing at all", () => {
    expect(updateEventSchema.parse({})).toEqual({});
  });

  it("parses a QR style save to the QR style alone", () => {
    expect(updateEventSchema.parse({ qr_style: "dots" })).toEqual({
      qr_style: "dots",
    });
  });

  it("parses the review room's switch to the switch alone", () => {
    expect(
      updateEventSchema.parse({ moderation_mode: "hold_for_approval" }),
    ).toEqual({ moderation_mode: "hold_for_approval" });
  });

  it("invents none of the settings a create defaults", () => {
    const parsed = updateEventSchema.parse({ name: "Renamed" });
    for (const key of [
      "visibility",
      "accepting_uploads",
      "require_verified_email",
      "require_upload_to_view",
      "moderation_mode",
      "qr_style",
    ]) {
      expect(parsed).not.toHaveProperty(key);
    }
  });

  it("still validates what it is sent", () => {
    expect(updateEventSchema.safeParse({ qr_style: "neon" }).success).toBe(
      false,
    );
    expect(updateEventSchema.safeParse({ name: "" }).success).toBe(false);
  });
});

describe("createEventSchema: a create with only a name lands every default", () => {
  it("carries each column default (they mirror the events table's own)", () => {
    expect(createEventSchema.parse({ name: "Sarah's wedding" })).toMatchObject({
      name: "Sarah's wedding",
      visibility: "open",
      accepting_uploads: true,
      require_verified_email: true,
      require_upload_to_view: false,
      moderation_mode: "live",
      qr_style: "classic",
    });
  });

  it("still requires the name", () => {
    expect(createEventSchema.safeParse({}).success).toBe(false);
  });
});
