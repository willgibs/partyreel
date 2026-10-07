/**
 * THE NAME A TAPPED LINK ADOPTED, LEFT FOR THE ALBUM (crumbs-88): the callback writes the cookie's value, the album's mount
 * reads it (`confirm-beat.ts`'s `takeToldName`), and it is the callback's word only: bound to the album it was left for,
 * and checked as any name is before it is said.
 */
import { describe, expect, it } from "vitest";

import { toldNameFrom, toldNameValue } from "./adopt-door-name-told";

/** As `document.cookie` holds a value the jar wrote: percent-encoded once. */
const held = (album: string, name: string) =>
  encodeURIComponent(toldNameValue(album, name));

describe("the told name", () => {
  it("★ round-trips through the cookie jar's own encoding, for the album it was left for, names with punctuation and accents whole", () => {
    expect(toldNameFrom(held("qr-token", "Priya"), "qr-token")).toBe("Priya");
    expect(toldNameFrom(held("qr-token", "Zoë O'Brien; Jr."), "qr-token")).toBe(
      "Zoë O'Brien; Jr.",
    );
  });

  it("★ tells nothing for another album: a stale cookie for one the guest left is not this one's", () => {
    expect(toldNameFrom(held("qr-token", "Priya"), "another")).toBeNull();
  });

  it.each([
    ["no cookie", undefined],
    ["an empty one", ""],
    ["not JSON", "%7Bnope"],
    ["JSON that is no object", encodeURIComponent('"Priya"')],
    ["an object with no name", encodeURIComponent('{"a":"qr-token"}')],
    ["a name that is no string", encodeURIComponent('{"a":"qr-token","n":7}')],
    ["a blank name", held("qr-token", "   ")],
    ["an overlong name", held("qr-token", "x".repeat(61))],
    ["a reserved name", held("qr-token", "admin")],
  ])("★ is checked as any name is: %s says nothing", (_name, raw) => {
    expect(toldNameFrom(raw, "qr-token")).toBeNull();
  });
});
