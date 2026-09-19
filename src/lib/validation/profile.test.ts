import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  BIO_MAX_LENGTH,
  bioSchema,
  DISPLAY_NAME_MAX_LENGTH,
  displayNameSchema,
  PROFILE_SLUG_MAX_LENGTH,
  PROFILE_SLUG_MIN_LENGTH,
  profileSlugSchema,
} from "@/lib/validation/profile";

const MIGRATION = "supabase/migrations/20260919120000_profile_bio.sql";

describe("displayNameSchema", () => {
  it("trims surrounding whitespace", () => {
    expect(displayNameSchema.parse("  Will Gibson  ")).toBe("Will Gibson");
  });

  it("requires a name (empty / whitespace-only is rejected now)", () => {
    expect(displayNameSchema.safeParse("").success).toBe(false);
    expect(displayNameSchema.safeParse("   ").success).toBe(false);
  });

  it("accepts short real names (1-2 chars: AJ, MJ, Bo)", () => {
    expect(displayNameSchema.parse("AJ")).toBe("AJ");
    expect(displayNameSchema.parse("Bo")).toBe("Bo");
    expect(displayNameSchema.parse("J")).toBe("J");
  });

  it("accepts a name at the max length", () => {
    const name = "a".repeat(DISPLAY_NAME_MAX_LENGTH);
    expect(displayNameSchema.parse(name)).toBe(name);
  });

  it("rejects a name over the max length", () => {
    const tooLong = "a".repeat(DISPLAY_NAME_MAX_LENGTH + 1);
    expect(displayNameSchema.safeParse(tooLong).success).toBe(false);
  });

  it("rejects reserved / impersonation names (case-insensitive)", () => {
    expect(displayNameSchema.safeParse("admin").success).toBe(false);
    expect(displayNameSchema.safeParse("Partyreel").success).toBe(false);
    expect(displayNameSchema.safeParse("SUPPORT").success).toBe(false);
    expect(displayNameSchema.safeParse("Official").success).toBe(false);
  });

  it("allows a normal name that merely contains a reserved token", () => {
    expect(displayNameSchema.parse("Adminah")).toBe("Adminah");
    expect(displayNameSchema.parse("Hosta")).toBe("Hosta");
  });
});

describe("profileSlugSchema", () => {
  it("normalizes: trims and lowercases before validating", () => {
    expect(profileSlugSchema.parse("  Will-Gibson  ")).toBe("will-gibson");
  });

  it("accepts plain lowercase handles with digits and inner hyphens", () => {
    expect(profileSlugSchema.parse("will")).toBe("will");
    expect(profileSlugSchema.parse("dj-max-2026")).toBe("dj-max-2026");
    expect(profileSlugSchema.parse("abc")).toBe("abc");
  });

  it("enforces the length bounds (mirrors the DB CHECK: 3..30)", () => {
    expect(profileSlugSchema.safeParse("ab").success).toBe(false);
    expect(
      profileSlugSchema.parse("a".repeat(PROFILE_SLUG_MAX_LENGTH)),
    ).toHaveLength(PROFILE_SLUG_MAX_LENGTH);
    expect(
      profileSlugSchema.safeParse("a".repeat(PROFILE_SLUG_MAX_LENGTH + 1))
        .success,
    ).toBe(false);
    expect(PROFILE_SLUG_MIN_LENGTH).toBe(3);
  });

  it("rejects edge hyphens, spaces, and non [a-z0-9-] characters", () => {
    expect(profileSlugSchema.safeParse("-will").success).toBe(false);
    expect(profileSlugSchema.safeParse("will-").success).toBe(false);
    expect(profileSlugSchema.safeParse("will gibson").success).toBe(false);
    expect(profileSlugSchema.safeParse("will_gibson").success).toBe(false);
    expect(profileSlugSchema.safeParse("wíll").success).toBe(false);
    expect(profileSlugSchema.safeParse("will.gibson").success).toBe(false);
  });

  it("a 32-hex qr_token shape can never pass (length bound covers it)", () => {
    // No dedicated refine (unlike eventSlugSchema, max 50): 32 > PROFILE_SLUG_MAX_LENGTH.
    expect(32).toBeGreaterThan(PROFILE_SLUG_MAX_LENGTH);
    expect(profileSlugSchema.safeParse("a".repeat(32)).success).toBe(false);
  });

  it("rejects both reserved lists: route/brand slugs AND impersonation names", () => {
    expect(profileSlugSchema.safeParse("admin").success).toBe(false); // both lists
    expect(profileSlugSchema.safeParse("api").success).toBe(false); // RESERVED_SLUGS
    expect(profileSlugSchema.safeParse("support").success).toBe(false); // RESERVED_NAMES
    expect(profileSlugSchema.safeParse("Partyreel").success).toBe(false); // lowercased first
  });

  it("allows a handle that merely contains a reserved token", () => {
    expect(profileSlugSchema.parse("adminah")).toBe("adminah");
    expect(profileSlugSchema.parse("api-fans")).toBe("api-fans");
  });
});

describe("bioSchema", () => {
  it("collapses a bio to ONE line (no walls, no ASCII art)", () => {
    expect(bioSchema.parse("Weddings,\n\nmostly.   Always late.")).toBe(
      "Weddings, mostly. Always late.",
    );
  });

  it("treats empty and whitespace-only as no bio at all (clearing is emptying)", () => {
    expect(bioSchema.parse("")).toBeNull();
    expect(bioSchema.parse("   \n  ")).toBeNull();
  });

  it("accepts a bio at the cap and refuses one past it", () => {
    const at = "a".repeat(BIO_MAX_LENGTH);
    expect(bioSchema.parse(at)).toBe(at);
    expect(bioSchema.safeParse("a".repeat(BIO_MAX_LENGTH + 1)).success).toBe(
      false,
    );
  });

  it("refuses links, bare domains and email addresses (a free page is a free backlink)", () => {
    for (const bio of [
      "https://example.com",
      "follow me at www.example.com",
      "maya.com",
      "t.me/maya",
      "maya@example.com",
    ]) {
      expect(bioSchema.safeParse(bio).success, `expected "${bio}" refused`).toBe(
        false,
      );
    }
  });

  it("leaves ordinary prose alone (a full stop is not a domain)", () => {
    for (const bio of [
      "Weddings, mostly. Always the one with the camera.",
      "Mrs. Smith to my students, Ana to everyone else.",
      "Photographer (e.g. weddings, birthdays, the odd dog).",
    ]) {
      expect(bioSchema.safeParse(bio).success, `expected "${bio}" allowed`).toBe(
        true,
      );
    }
  });
});

/**
 * THE BIO'S OTHER HALF IS SQL, and this guards it as text, exactly as
 * public-profile-visibility.test.ts guards the original migration.
 *
 * ★ WHY HERE. Migration 20260919120000 REPLACES get_public_profile to carry the
 * bio, so the function body that ships now lives in that file while the older
 * guard still parses 20260708120000's superseded text. Until the two guards are
 * merged (a finding, not a silent edit of another lane's test), the consent
 * scope is re-asserted against the body that actually runs: every gate on the
 * attended arm, no album capability in it, and the hosted arm still deliberately
 * ungated on visibility.
 */
describe("get_public_profile, as migration 20260919120000 replaces it", () => {
  const sql = readFileSync(
    join(__dirname, "..", "..", "..", MIGRATION),
    "utf8",
  );
  const body = (() => {
    const start = sql.indexOf("create or replace function public.get_public_profile");
    expect(start).toBeGreaterThan(-1);
    const end = sql.indexOf("$$;", start);
    expect(end).toBeGreaterThan(start);
    return sql.slice(start, end);
  })();
  const arm = (name: "hosted_events" | "attended_events") => {
    const start = body.indexOf(`'${name}'`);
    const end = body.indexOf("'[]'::jsonb", start);
    return body.slice(start, end);
  };

  it("returns the bio", () => {
    expect(body).toContain("'bio', p.bio");
  });

  it("keeps every gate on the attended arm", () => {
    const attended = arm("attended_events");
    expect(attended).toContain("e.show_guest_list");
    expect(attended).toContain("e.visibility = 'open'");
    expect(attended).toContain("e.deleted_at is null");
    expect(attended).toContain("profile_hidden_events");
    expect(attended).toContain("m.status = 'approved'");
  });

  it("never hands out the album capability through attendance", () => {
    const attended = arm("attended_events");
    expect(attended).not.toContain("qr_token");
    expect(attended).not.toContain("custom_slug");
  });

  it("leaves the hosted arm ungated on visibility (the host published it)", () => {
    const hosted = arm("hosted_events");
    expect(hosted).toContain("e.display_in_profile");
    expect(hosted).not.toContain("e.visibility = 'open'");
  });

  it("caps the bio in the database too, not only in zod", () => {
    expect(sql).toContain("profiles_bio_len");
    expect(sql).toContain(String(BIO_MAX_LENGTH));
  });
});
