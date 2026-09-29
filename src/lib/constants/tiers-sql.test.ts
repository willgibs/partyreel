/**
 * THE SQL HALVES OF THE PLAN'S RULES, READ OFF THE MIGRATIONS (the free/pro shift, 2026-09-28).
 *
 * tier-limits-parity.test.ts guards the numbers; these guard the three rules the shift moved that
 * live in function bodies instead, each one a place where editing only the TypeScript would leave
 * the database enforcing yesterday's plan:
 *
 *   1. THE PAID GATES ON EVENT SETTINGS. `GATED_EVENT_SETTINGS` locks a control in the app; the
 *      setter RPC refuses a Free host in SQL. An app lock over an open RPC is a lock anyone can
 *      walk around, and an RPC refusal under an open control is a broken button, so each setter
 *      refuses Free exactly when its setting is on the list (empty since the shift).
 *   2. THE RESERVED WORDS. set_event_slug refuses exactly RESERVED_SLUGS, and the brand's whole
 *      family by the same fold as isBrandSlug: with custom links on Free, the RPC (callable past
 *      the server action) is the boundary a throwaway account meets.
 *   3. A SLUG FREED AT DELETION STAYS FREED. restore_event brings an event back without a custom
 *      link another event took while it sat in Deleted, instead of failing on the unique index.
 *
 * Same method as the parity test: TEXT-parsed (Vitest has no Postgres), the newest definition wins
 * (filenames sort in apply order), and anything unreadable throws rather than passing quietly.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  BRAND_FOLD,
  BRAND_NAME_MESSAGE,
  BRAND_STEM,
  isBrandSlug,
  RESERVED_SLUGS,
  RESERVED_WORD_MESSAGE,
} from "@/lib/constants/reserved-slugs";
import {
  GATED_EVENT_SETTINGS,
  type GatedEventSetting,
} from "@/lib/constants/tiers";

const MIGRATIONS = join(process.cwd(), "supabase", "migrations");

/** The winning body of `public.<name>(`, comments stripped, from its `as $tag$` to its close. */
function newestBody(name: string): { file: string; body: string } {
  let newest: { file: string; body: string } | null = null;
  for (const file of readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    const sql = readFileSync(join(MIGRATIONS, file), "utf8").replace(
      /--[^\n]*/g,
      "",
    );
    const re = new RegExp(
      `create\\s+(?:or\\s+replace\\s+)?function\\s+public\\.${name}\\s*\\(`,
      "g",
    );
    for (const m of sql.matchAll(re)) {
      const opener = sql.slice(m.index).match(/as \$([a-z_]*)\$/);
      if (!opener || opener.index === undefined) {
        throw new Error(`${file}: ${name} has no dollar-quoted body`);
      }
      const tag = `$${opener[1]}$`;
      const start = m.index + opener.index + opener[0].length;
      const end = sql.indexOf(`${tag};`, start);
      if (end < 0) throw new Error(`${file}: ${name}'s body never closes`);
      newest = { file, body: sql.slice(start, end) };
    }
  }
  if (!newest) throw new Error(`No migration defines public.${name}().`);
  return newest;
}

/** Which RPC writes each gateable setting (the only writers: the columns are revoked). */
const SETTERS: Record<GatedEventSetting, string> = {
  password: "set_event_password",
  custom_slug: "set_event_slug",
};

describe("each setter refuses Free exactly when its setting is gated", () => {
  for (const [setting, fn] of Object.entries(SETTERS) as [
    GatedEventSetting,
    string,
  ][]) {
    it(`${fn} (${setting})`, () => {
      const { file, body } = newestBody(fn);
      // A setter has no other reason to name the free tier: naming it IS the gate.
      const refusesFree = /'free'/.test(body);
      expect(
        refusesFree,
        `${file}: ${fn} ${refusesFree ? "still refuses" : "no longer refuses"} a Free host, but GATED_EVENT_SETTINGS ${GATED_EVENT_SETTINGS.includes(setting) ? "gates" : "does not gate"} "${setting}". Move both halves together.`,
      ).toBe(GATED_EVENT_SETTINGS.includes(setting));
    });
  }
});

describe("set_event_slug refuses exactly the reserved words", () => {
  it("its array is RESERVED_SLUGS, no more and no less", () => {
    const { file, body } = newestBody("set_event_slug");
    const array = body.match(/=\s*any\s*\(\s*array\s*\[([\s\S]*?)\]\s*\)/i);
    expect(
      array,
      `${file}: set_event_slug has no reserved-word array`,
    ).not.toBeNull();
    const words = array![1]
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean)
      .map((w) => {
        const quoted = w.match(/^'([a-z0-9-]+)'$/);
        if (!quoted) throw new Error(`${file}: unreadable reserved word ${w}`);
        return quoted[1];
      });
    expect(new Set(words).size, "a word listed twice").toBe(words.length);
    expect([...words].sort()).toEqual([...RESERVED_SLUGS].sort());
    // …and refuses with the zod schema's own sentence, so both doors say one thing.
    expect(body).toContain(RESERVED_WORD_MESSAGE);
  });

  // ★ THE BRAND'S FAMILY (crumbs-11). The SQL states the rule as one clause; this reads its three
  // literals back and holds them to the TypeScript, then runs that clause's own semantics (Postgres
  // `translate` + `position`, re-implemented here from the literals it READ, not from the TS) over
  // the cases, so a literal edited on one side alone fails with the side named.
  it("refuses the brand's whole family by the fold isBrandSlug uses", () => {
    const { file, body } = newestBody("set_event_slug");
    const clause = body.match(
      /if\s+position\(\s*'([a-z]+)'\s+in\s+translate\(\s*v_slug\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*\)\s*\)\s*>\s*0\s+then\s+raise\s+exception\s+'([^']*)'\s+using\s+errcode\s*=\s*'check_violation'/i,
    );
    expect(
      clause,
      `${file}: set_event_slug has no brand-family clause`,
    ).not.toBeNull();
    const [, stem, from, to, message] = clause!;
    expect(stem, `${file}: the stem`).toBe(BRAND_STEM);
    expect({ from, to }, `${file}: the fold`).toEqual(BRAND_FOLD);
    expect(message, `${file}: the sentence`).toBe(BRAND_NAME_MESSAGE);

    // The SQL's own reading of a slug, from the literals above.
    const sqlRefuses = (slug: string) =>
      [...slug.toLowerCase()]
        .map((ch) => {
          const at = from.indexOf(ch);
          return at < 0 ? ch : (to[at] ?? "");
        })
        .join("")
        .includes(stem);
    for (const slug of [
      "partyreel",
      "partyreel-support",
      "official-partyreel",
      "party-reel",
      "p4rtyr33l",
      "partyree1",
      "par7yreel",
      "partyrel-night",
      "party-relay",
      "partyreal-2026",
      "reel-party",
    ]) {
      expect(sqlRefuses(slug), slug).toBe(isBrandSlug(slug));
    }
    // And it runs BEFORE the uniqueness check, so a refused slug never answers "taken".
    expect(body.indexOf(BRAND_NAME_MESSAGE)).toBeLessThan(
      body.indexOf("That custom link is already taken."),
    );
  });
});

describe("a slug freed at deletion stays freed", () => {
  it("restore_event comes back without a custom link someone took, instead of failing", () => {
    const { body } = newestBody("restore_event");
    const flat = body.replace(/\s+/g, " ");
    expect(flat).toMatch(
      /exception when unique_violation then update public\.events set deleted_at = null, purge_at = null, custom_slug = null/,
    );
    expect(flat).toContain("'custom_slug_released', v_slug_released");
  });
});
