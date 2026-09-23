// @contract-for: src/lib/events/host-fingerprint.ts
// @contract-for: src/app/api/events/[eventId]/live/route.ts

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { hostEtag } from "@/lib/events/host-fingerprint";

/**
 * THE HUB'S VALIDATOR (Will, `first=live`, 2026-09-21).
 *
 * Every failure this guards is quiet. A hash that ignores a field means a host
 * watching an empty room never sees the first photograph land and has no way to
 * know she is looking at a stale page; a hash that matches across events means a
 * 304 serving one album's state to another. Neither throws and neither looks
 * wrong on screen.
 */

const ROOT = process.cwd();
const ROUTE = "src/app/api/events/[eventId]/live/route.ts";
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
/** Source with comments stripped: the route NAMES what it must not do, in prose. */
const code = (rel: string) =>
  read(rel)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

const base = {
  eventId: "e1",
  pending: 0,
  items: [
    { id: "a", status: "approved" },
    { id: "b", status: "approved" },
  ],
};

describe("the host fingerprint", () => {
  it("is stable for an unchanged album", () => {
    expect(hostEtag(base)).toBe(hostEtag({ ...base, items: [...base.items] }));
  });

  it("moves when a photograph arrives", () => {
    expect(
      hostEtag({ ...base, items: [{ id: "c", status: "approved" }, ...base.items] }),
    ).not.toBe(hostEtag(base));
  });

  it("moves when a photograph leaves", () => {
    expect(hostEtag({ ...base, items: [base.items[0]] })).not.toBe(hostEtag(base));
  });

  it("moves when one is hidden from a second tab", () => {
    expect(
      hostEtag({
        ...base,
        items: [{ id: "a", status: "hidden" }, base.items[1]],
      }),
    ).not.toBe(hostEtag(base));
  });

  it("moves when something lands in Review, which the doorbell never reports", () => {
    // The doorbell trigger fires only on APPROVED-VISIBLE changes, so on a
    // moderated event a held upload wakes nobody. This is the only signal the
    // host gets, and a hash that dropped `pending` would silently remove it.
    expect(hostEtag({ ...base, pending: 1 })).not.toBe(hostEtag(base));
  });

  it("never validates across two events", () => {
    expect(hostEtag({ ...base, eventId: "e2" })).not.toBe(hostEtag(base));
  });

  it("carries a version prefix, quoted and strong", () => {
    const tag = hostEtag(base);
    expect(tag.startsWith('"h1-')).toBe(true);
    expect(tag.endsWith('"')).toBe(true);
    expect(tag.startsWith("W/")).toBe(false);
  });

  it("cannot be confused with the guest gallery's validator", () => {
    // Different prefixes, so a client holding one can never 304 the other's
    // route even if a future refactor let the two cross paths.
    expect(hostEtag(base).startsWith('"g1-')).toBe(false);
  });
});

describe("the live route", () => {
  it("re-verifies the caller rather than trusting the cookie", () => {
    const src = code(ROUTE);
    expect(/supabase\.auth\.getUser\(\)/.test(src)).toBe(true);
    expect(
      /getSession\(/.test(src),
      "authorised from a cookie rather than from a check",
    ).toBe(false);
  });

  it("reads the event through the RLS-scoped query, never by host_id in a filter", () => {
    const src = code(ROUTE);
    expect(/getEvent\(/.test(src)).toBe(true);
    expect(
      /host_id/.test(src),
      "the route started deciding ownership itself instead of letting RLS answer",
    ).toBe(false);
  });

  it("answers 304 when nothing moved", () => {
    const src = code(ROUTE);
    expect(/If-None-Match|if-none-match/.test(src)).toBe(true);
    expect(/304/.test(src)).toBe(true);
  });

  it("presigns nothing", () => {
    // The whole point of this route is that it is cheap: the expensive work —
    // eleven queries and three presigns an item — belongs to the page render it
    // triggers, and only when something actually changed.
    const src = code(ROUTE);
    expect(/presign/i.test(src)).toBe(false);
  });

  it("is never cached", () => {
    const src = code(ROUTE);
    expect(/force-dynamic/.test(src)).toBe(true);
  });
});
