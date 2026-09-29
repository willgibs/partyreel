import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  INVITE_BATCH_MAX,
  INVITE_LIST_CAP,
  isReadableAddress,
  readAddresses,
} from "@/lib/event/door/invite-list";

describe("one field that takes one typed or two hundred pasted", () => {
  it("reads one typed address, normalised", () => {
    expect(readAddresses("  Maya@Example.com ")).toEqual({
      addresses: ["maya@example.com"],
      unreadable: [],
    });
  });

  it("reads a pasted column, a comma list and a spreadsheet's rows alike", () => {
    const pasted = [
      "maya@example.com",
      "Tom Reyes <tom@example.co.uk>, priya@example.org; o'brien@example.ie",
      "Jay\tjay@example.com\tTable 4",
      "mailto:sam@example.net",
    ].join("\n");
    expect(readAddresses(pasted).addresses).toEqual([
      "maya@example.com",
      "tom@example.co.uk",
      "priya@example.org",
      "o'brien@example.ie",
      "jay@example.com",
      "sam@example.net",
    ]);
  });

  it("lands each address once, in the order it came", () => {
    expect(readAddresses("a@example.com, B@example.com\nA@EXAMPLE.COM").addresses).toEqual([
      "a@example.com",
      "b@example.com",
    ]);
  });

  it("flags every entry that held no readable address, each once, and drops none silently", () => {
    const { addresses, unreadable } = readAddresses(
      "maya@gmail, Table 4, bad@@example.com, maya@gmail\nok@example.com",
    );
    expect(addresses).toEqual(["ok@example.com"]);
    expect(unreadable).toEqual(["maya@gmail", "Table 4", "bad@@example.com"]);
  });

  it("gives up nothing, and flags nothing, for an empty field", () => {
    expect(readAddresses("")).toEqual({ addresses: [], unreadable: [] });
    expect(readAddresses(" \n ,, ; ")).toEqual({ addresses: [], unreadable: [] });
  });

  it("is stricter than the database, never looser: everything it reads, the CHECK stores", () => {
    // The CHECK: lower(btrim()), 3 to 254 characters, an @ past the first character, no whitespace.
    const check = (email: string) =>
      email === email.trim().toLowerCase() &&
      email.length >= 3 &&
      email.length <= 254 &&
      email.indexOf("@") > 0 &&
      !/\s/.test(email);
    const samples = readAddresses(
      "a@b.co, x.y+tag@sub.example.com, weird@-example.com",
    ).addresses;
    expect(samples.length).toBeGreaterThan(0);
    for (const address of samples) expect(check(address), address).toBe(true);
    // ★ A character it does not know flags the whole address, never a shorter somebody else's.
    expect(readAddresses("ÜBER@example.com")).toEqual({
      addresses: [],
      unreadable: ["ÜBER@example.com"],
    });
    expect(isReadableAddress(`${"a".repeat(65)}@example.com`)).toBe(false);
    expect(isReadableAddress(`a@${"b".repeat(250)}.com`)).toBe(false);
  });
});

describe("the list's limits are the database's", () => {
  it("INVITE_LIST_CAP and INVITE_BATCH_MAX match add_event_invites", () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase", "migrations", "20260929120000_event_doors.sql"),
      "utf8",
    ).replace(/--[^\n]*/g, "");
    const body = sql.slice(
      sql.indexOf("create function public.add_event_invites("),
      sql.indexOf("create function public.remove_event_invite("),
    );
    expect(body).toContain(`c_cap constant integer := ${INVITE_LIST_CAP};`);
    expect(body).toContain(`cardinality(p_emails) > ${INVITE_BATCH_MAX}`);
  });
});
