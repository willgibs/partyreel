import { readdirSync, readFileSync } from "node:fs";
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
      expect(
        bioSchema.safeParse(bio).success,
        `expected "${bio}" refused`,
      ).toBe(false);
    }
  });

  it("leaves ordinary prose alone (a full stop is not a domain)", () => {
    for (const bio of [
      "Weddings, mostly. Always the one with the camera.",
      "Mrs. Smith to my students, Ana to everyone else.",
      "Photographer (e.g. weddings, birthdays, the odd dog).",
    ]) {
      expect(
        bioSchema.safeParse(bio).success,
        `expected "${bio}" allowed`,
      ).toBe(true);
    }
  });
});

/**
 * THE BIO'S OTHER HALF IS SQL, and this guards it as text: the zod cap and the CHECK constraint
 * drift the moment one number moves alone, and nothing else in the gate would notice.
 *
 * ★ WHAT LEFT THIS FILE (the guest identity round, 2026-09-22). This describe used to re-assert
 * get_public_profile's whole consent scope as well, pinned to migration 20260919120000, because at
 * the time that file held the body that actually ran while the older guard still parsed
 * 20260708120000's superseded text. Its own comment called the duplication a finding rather than a
 * silent edit of another lane's test. Migration 20260922122000 replaces that body again (the
 * attended arm becomes an opt-in on profile_shown_events, with a verified belt), which would have
 * left this copy pinned to a file two generations stale and asserting the OLD table by name. The
 * consent scope now has one home — social/public-profile-visibility.test.ts, which resolves the
 * winning body LATEST-WINS across the whole migration set — and what stays here is the bio, which
 * is this file's own fact. Do not re-add the consent assertions; extend that guard instead.
 */
describe("the bio's SQL half", () => {
  const migrations = join(__dirname, "..", "..", "..", "supabase/migrations");

  /** Latest-wins, like the guard in social/: the truth is the migration SET, never one file. */
  const body = (() => {
    let latest: string | null = null;
    for (const file of readdirSync(migrations)
      .filter((f) => f.endsWith(".sql"))
      .sort()) {
      const sql = readFileSync(join(migrations, file), "utf8");
      const start = sql.indexOf(
        "create or replace function public.get_public_profile",
      );
      if (start === -1) continue;
      const end = sql.indexOf("$$;", start);
      expect(
        end,
        `${file}: get_public_profile body never closes`,
      ).toBeGreaterThan(start);
      latest = sql.slice(start, end);
    }
    expect(latest, "get_public_profile defined nowhere").not.toBeNull();
    return latest!;
  })();

  it("still returns the bio from the body that actually runs", () => {
    expect(body).toContain("'bio', p.bio");
  });

  it("caps the bio in the database too, not only in zod", () => {
    const all = readdirSync(migrations)
      .filter((f) => f.endsWith(".sql"))
      .sort()
      .map((f) => readFileSync(join(migrations, f), "utf8"))
      .join("\n");
    expect(all).toContain("profiles_bio_len");
    expect(all).toContain(String(BIO_MAX_LENGTH));
  });
});
