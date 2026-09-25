import { describe, expect, it } from "vitest";

import { HOLD_STEPS_SEC, REEL_MOOD_IDS } from "@/lib/reel/defaults";
import {
  createEventSchema,
  eventSlugSchema,
  reelDefaultsInputSchema,
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

// ★ THE REEL'S DEFAULTS (Will, reel-host `style=both`): what every viewer starts on, set by the host
// from the view and from Settings. Update-only, each nullable (null: the product's own default), and
// the look and the hold checked here because the columns hold no step list and no mood list.
describe("updateEventSchema: the reel's three defaults", () => {
  it("parses each alone, as sent, and null hands it back to the default", () => {
    expect(updateEventSchema.parse({ show_reel: false })).toEqual({
      show_reel: false,
    });
    expect(updateEventSchema.parse({ reel_style_id: "mono" })).toEqual({
      reel_style_id: "mono",
    });
    expect(updateEventSchema.parse({ reel_hold_sec: 2.2 })).toEqual({
      reel_hold_sec: 2.2,
    });
    expect(
      updateEventSchema.parse({ reel_style_id: null, reel_hold_sec: null }),
    ).toEqual({ reel_style_id: null, reel_hold_sec: null });
  });

  it("takes every mood and every step", () => {
    for (const id of REEL_MOOD_IDS) {
      expect(updateEventSchema.safeParse({ reel_style_id: id }).success).toBe(
        true,
      );
    }
    for (const sec of HOLD_STEPS_SEC) {
      expect(updateEventSchema.safeParse({ reel_hold_sec: sec }).success).toBe(
        true,
      );
    }
  });

  it("refuses a treatment and an unknown look: the live reel plays moods only", () => {
    for (const id of ["polaroid", "filmstrip", "neon", "", "Classic"]) {
      expect(
        updateEventSchema.safeParse({ reel_style_id: id }).success,
        id,
      ).toBe(false);
    }
  });

  it("refuses a hold off the steps, never rounding it onto one", () => {
    for (const sec of [2.5, 0, -1, 0.5, 30, 1e9, NaN, Infinity]) {
      expect(
        updateEventSchema.safeParse({ reel_hold_sec: sec }).success,
        String(sec),
      ).toBe(false);
    }
    expect(updateEventSchema.safeParse({ reel_hold_sec: "3" }).success).toBe(
      false,
    );
  });

  it("a create never carries them: a new event takes the column defaults", () => {
    const parsed = createEventSchema.parse({
      name: "Sarah's wedding",
      show_reel: false,
      reel_style_id: "mono",
      reel_hold_sec: 7,
    });
    for (const key of ["show_reel", "reel_style_id", "reel_hold_sec"]) {
      expect(parsed).not.toHaveProperty(key);
    }
  });

  it("a save of some other setting invents none of them", () => {
    const parsed = updateEventSchema.parse({ qr_style: "dots" });
    for (const key of ["show_reel", "reel_style_id", "reel_hold_sec"]) {
      expect(parsed).not.toHaveProperty(key);
    }
  });
});

describe("reelDefaultsInputSchema: setReelDefaults' input", () => {
  const eventId = "5d0f0f6e-2b1a-4c1e-9a55-1f2d3c4b5a69";

  it("takes the event and any of the three", () => {
    expect(
      reelDefaultsInputSchema.parse({ eventId, holdSec: 5, styleId: null }),
    ).toEqual({ eventId, holdSec: 5, styleId: null });
    expect(reelDefaultsInputSchema.parse({ eventId, showReel: true })).toEqual({
      eventId,
      showReel: true,
    });
  });

  it("strips every other key, so it can never carry another setting", () => {
    expect(
      reelDefaultsInputSchema.parse({
        eventId,
        holdSec: 3,
        visibility: "open",
        moderation_mode: "live",
        reel_hold_sec: 7,
      }),
    ).toEqual({ eventId, holdSec: 3 });
  });

  it("refuses a malformed event id, a treatment and a hold off the steps", () => {
    for (const input of [
      { eventId: "event-1", holdSec: 3 },
      { eventId: "", holdSec: 3 },
      { eventId, styleId: "polaroid" },
      { eventId, holdSec: 4 },
      { eventId, showReel: "yes" },
    ]) {
      expect(
        reelDefaultsInputSchema.safeParse(input).success,
        JSON.stringify(input),
      ).toBe(false);
    }
  });
});
