import { describe, expect, it } from "vitest";

import { checkDisplayName } from "@/lib/guest/join";
import { isReservedName, RESERVED_NAMES } from "@/lib/constants/reserved-names";
import { BRAND_FOLD, BRAND_STEM } from "@/lib/constants/reserved-slugs";
import { parseGuestDisplayName } from "@/lib/validation/upload";
import { displayNameSchema } from "@/lib/validation/profile";
import { read, sources } from "@/testing/source-tree";

/**
 * THE BRAND REACHES DISPLAY NAMES (crumbs-20, the ROADMAP's `crumbs-11` security line).
 *
 * The list refused only WHOLE reserved names, so "Partyreel Support" was a legal uploader credit
 * and "Hosted by" byline: the doc above `RESERVED_NAMES` even named it as the thing it stopped. Now
 * a name that holds the brand alone or beside a staff word is refused, read by WORDS through the
 * disguises a name can wear. What is pinned both ways, as reserved-slugs.test.ts pins the slug's
 * family: what the rule takes, and, as deliberately, what it leaves.
 */

describe("a reserved word, whole (as before)", () => {
  it.each([
    "admin",
    "Administrator",
    "SUPPORT",
    "  Official  ",
    "Moderator",
    "team",
  ])("refuses %s", (name) => {
    expect(isReservedName(name)).toBe(true);
  });

  it("never refuses a name that merely contains one", () => {
    for (const name of [
      "Adminah",
      "Hosta",
      "Supporter",
      "Teamwork",
      "Hostess",
      "Ownership",
      "Officially Sam",
      "Sam Support",
      "Team Rocket",
      "Host Committee",
    ]) {
      expect(isReservedName(name), name).toBe(false);
    }
  });
});

describe("★ the brand, beside a staff word", () => {
  it("refuses the brand with any reserved staff word, in either order", () => {
    for (const name of [
      "Partyreel Support",
      "partyreel support",
      "PARTYREEL SUPPORT",
      "Support Partyreel",
      "Official Partyreel",
      "The Partyreel Team",
      "Partyreel Team",
      "Partyreel Admin",
      "Partyreel Administrator",
      "Partyreel Moderator",
      "Partyreel Mod",
      "Partyreel Staff",
      "Partyreel Security",
      "Partyreel Billing",
      "Partyreel Help",
      "Partyreel Host",
      "Partyreel Owner",
      "Partyreel System",
      "Sam, Partyreel Support",
    ]) {
      expect(isReservedName(name), name).toBe(true);
    }
  });

  it("★ every staff word the list holds, so a word added to it is refused beside the brand at once", () => {
    const staff = [...RESERVED_NAMES].filter(
      (word) => !word.replace(/\s/g, "").includes(BRAND_STEM),
    );
    expect(staff.length).toBeGreaterThanOrEqual(14);
    for (const word of staff) {
      expect(isReservedName(`Partyreel ${word}`), word).toBe(true);
      expect(isReservedName(`${word} Party Reel`), word).toBe(true);
    }
  });

  it("reads the brand across any separator between its letters", () => {
    for (const name of [
      "Party Reel Support",
      "Party-Reel Support",
      "Party_Reel Support",
      "Party.Reel Support",
      "Partyreel-Support",
      "Partyreel • Support",
      "Partyreel | Support!",
      "Party   Reel   Support",
      "P.a.r.t.y.R.e.e.l Support",
      "🎉 Partyreel Support 🎉",
      "Partyreel's Support",
    ]) {
      expect(isReservedName(name), name).toBe(true);
    }
  });

  it("reads the words run together, where nothing separates them", () => {
    for (const name of [
      "PartyreelSupport",
      "SupportPartyreel",
      "PartyReelSupportTeam",
      "PartyreelOfficialSupport",
      "Partyreel-SupportTeam",
    ]) {
      expect(isReservedName(name), name).toBe(true);
    }
  });

  it("reads a plural staff word, and a look-alike digit on either side", () => {
    for (const name of [
      "Partyreel Admins",
      "Partyreel Mods",
      "Partyreel Teams",
      "P4rtyr33l Support",
      "Partyree1 Support",
      "Par7yreel Team",
      "Partyreel Supp0rt",
      "Partyreel Adm1n",
      "P4rtyr33l Off1cial",
      "Partyreel 0wner",
      "Partyreel B1lling",
    ]) {
      expect(isReservedName(name), name).toBe(true);
    }
  });

  it("reads accents and full-width letters", () => {
    for (const name of [
      "Pärtÿreel Süpport",
      "Partyréel Support",
      "ＰＡＲＴＹＲＥＥＬ ＳＵＰＰＯＲＴ",
    ]) {
      expect(isReservedName(name), name).toBe(true);
    }
  });
});

describe("★ the brand, alone", () => {
  it("refuses it whole, in every disguise (the list held only two spellings)", () => {
    for (const name of [
      "Partyreel",
      "party reel",
      "Party Reel",
      "Party  Reel",
      "Party-Reel",
      "PARTY_REEL",
      "P4rtyr33l",
      "Partyree1",
      "par7yreel",
      "P.a.r.t.y.R.e.e.l",
      "Pärtyreel",
      "ＰＡＲＴＹＲＥＥＬ",
      "Partyreel!",
      "Party Reel Party Reel",
    ]) {
      expect(isReservedName(name), name).toBe(true);
    }
  });
});

describe("what the brand rule leaves alone, deliberately", () => {
  it("leaves the brand beside a name or a fan's word: that is not the staff", () => {
    for (const name of [
      "Sam Partyreel",
      "Partyreel Fan",
      "Partyreels Fan",
      "Sarah at Partyreel",
      "Partyreel Photography",
      "Partyreel 2026",
      "Partyreel Adminah",
      "Partyreel Hostess",
      "Partyreel Supporter",
      "Partyreel Teamwork",
    ]) {
      expect(isReservedName(name), name).toBe(false);
    }
  });

  it("leaves a typo, a near word and the halves apart alone", () => {
    for (const name of [
      // A dropped or doubled letter is a typo, not a disguise (the slug's fold leaves it too):
      "Partyrel Support",
      "Partyreeel Support",
      "Partyreal Team",
      // Real words that only look like the brand's halves:
      "Party Relay Team",
      "Party Release Support",
      "Sparty Reel Sam",
      // The halves on their own, reversed, or apart:
      "Party Support",
      "Reel Team",
      "Reel Party Support",
      "Party at the Reel Team",
      // A digit the brand has no letter for stays a digit:
      "Party 2 Reel Support",
    ]) {
      expect(isReservedName(name), name).toBe(false);
    }
  });

  it("leaves every other script and every ordinary name alone", () => {
    for (const name of [
      "Will Gibson",
      "AJ",
      "María José",
      "Anushka",
      "Dickson",
      "パーティー サポート",
      "Партирил Поддержка",
      "李雷",
      "Mohammed al-Farsi",
      "O'Brien",
    ]) {
      expect(isReservedName(name), name).toBe(false);
    }
  });

  it("is fast on a name no one would type (a megabyte of it)", () => {
    const started = Date.now();
    expect(isReservedName("partyreel ".repeat(100_000))).toBe(true);
    expect(isReservedName("supportsupportsupport".repeat(50_000) + "x")).toBe(
      false,
    );
    expect(isReservedName("a".repeat(1_000_000))).toBe(false);
    expect(Date.now() - started).toBeLessThan(3000);
  });
});

describe("the slug family and the name family read the same look-alike digits", () => {
  it("each digit the slug fold reads as a letter, a name reads as that letter too", () => {
    // BRAND_FOLD.from is "4317-": the four digits, then the hyphen it drops.
    const digits = [...BRAND_FOLD.from].filter((c) => /\d/.test(c));
    expect(digits).toEqual(["4", "3", "1", "7"]);
    for (const digit of digits) {
      const letter = BRAND_FOLD.to[BRAND_FOLD.from.indexOf(digit)];
      // The one letter of the stem that digit stands for, swapped in, still reads as the brand.
      const disguised = BRAND_STEM.replace(letter, digit);
      expect(disguised).not.toBe(BRAND_STEM);
      expect(isReservedName(disguised), disguised).toBe(true);
      expect(isReservedName(`${disguised} Support`), disguised).toBe(true);
    }
  });
});

/**
 * ★ EVERY DOOR A NAME COMES THROUGH ASKS THE ONE HOME. `displayNameSchema` is the single gate (the
 * server actions and routes re-parse with it; the browser's own checks call the same schema), so
 * the rule lives once and reaches: the account action, the door's adopted name, the guest join and
 * rename routes (through `parseGuestDisplayName`), and the guest doors' own inline checks
 * (`checkDisplayName`). SQL cannot check a name (the identity migration's header), so a new WRITER
 * of `display_name` has to be named here with the gate it asks first, or this fails.
 */
describe("every door a name comes through", () => {
  const SENTENCE = "That name isn't available.";

  it("the schema refuses it, with the sentence a person reads", () => {
    const result = displayNameSchema.safeParse("Partyreel Support");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe(SENTENCE);
    expect(displayNameSchema.parse("Partyreel Fan")).toBe("Partyreel Fan");
  });

  it("the guest routes' parse refuses it (join and rename)", () => {
    expect(parseGuestDisplayName("Party Reel Team")).toEqual({
      ok: false,
      code: "name_invalid",
      message: SENTENCE,
    });
    expect(parseGuestDisplayName("Sam Partyreel")).toEqual({
      ok: true,
      name: "Sam Partyreel",
    });
  });

  it("the guest doors' inline check refuses it before anything is sent", () => {
    const checked = checkDisplayName("Official Partyreel");
    expect(checked.ok).toBe(false);
    if (!checked.ok) {
      expect(checked.refusal).toEqual({
        kind: "name_invalid",
        message: SENTENCE,
      });
    }
    expect(checkDisplayName("Sam Partyreel")).toEqual({
      ok: true,
      name: "Sam Partyreel",
    });
  });

  /** A file that stores a typed name: an update of `display_name`, or the RPCs' `p_display_name`. */
  const STORES_A_NAME = /\.update\(\{\s*display_name\b|\bp_display_name\s*:/;

  /** The files that store a name, and the gate each asks first. */
  const WRITERS: Record<string, string> = {
    "src/app/(app)/account/actions.ts": "displayNameSchema",
    "src/app/(auth)/adopt-door-name.ts": "displayNameSchema",
    // The RPC wrappers hold no gate of their own: the routes below are their only callers.
    "src/lib/db/mutations/guest.ts": "",
  };
  /** The callers of those wrappers: two ask the gate, and the ask-to-join route sends no name at all. */
  const CALLERS: Record<string, RegExp> = {
    "src/app/api/guests/route.ts": /parseGuestDisplayName\(/,
    "src/app/api/guests/name/route.ts": /parseGuestDisplayName\(/,
    "src/app/api/guests/ask/route.ts": /displayName:\s*null/,
  };

  it("no other file stores a typed name: a new writer is named above with its gate", () => {
    const found = sources("src").filter((rel) => STORES_A_NAME.test(read(rel)));
    expect(found.sort()).toEqual(Object.keys(WRITERS).sort());
  });

  it("each writer asks the schema first, and the wrappers' callers ask the gate or send no name", () => {
    for (const [rel, gate] of Object.entries(WRITERS)) {
      if (gate) expect(read(rel), rel).toContain(gate);
    }
    for (const [rel, gate] of Object.entries(CALLERS)) {
      expect(read(rel), rel).toMatch(gate);
    }
    // The two that carry a typed name check its profanity as well: the matcher cannot ship to a browser.
    for (const rel of [
      "src/app/api/guests/route.ts",
      "src/app/api/guests/name/route.ts",
    ]) {
      expect(read(rel), rel).toContain("containsProfanity(");
    }
    const callers = sources("src").filter((rel) =>
      /\b(createGuest|setGuestDisplayName)\(/.test(read(rel)),
    );
    expect(
      callers.filter((rel) => rel !== "src/lib/db/mutations/guest.ts").sort(),
    ).toEqual(Object.keys(CALLERS).sort());
  });
});
