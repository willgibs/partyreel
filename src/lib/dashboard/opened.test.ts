import { describe, expect, it } from "vitest";

import { openedIdOf } from "./opened";

/**
 * AN EVENT'S OPEN, READ OFF A LINK (host-dashboard r3): which presses on the dashboard go INTO an event, and so stamp
 * it (the Recent row and the Last opened order), and which are anything else. A wrong answer here is a stamp on a
 * page that is no event, or an event whose open is never seen.
 */

const ID = "6f1c2c9e-5a3b-4d11-9a0a-1d2f3a4b5c6d";

describe("a link into an event", () => {
  it("is its hub and any room of it, by the event it names", () => {
    expect(openedIdOf(`/dashboard/${ID}`)).toBe(ID);
    expect(openedIdOf(`/dashboard/${ID}/print`)).toBe(ID);
    expect(openedIdOf(`/dashboard/${ID}?room=guests`)).toBe(ID);
    expect(openedIdOf(`/dashboard/${ID}/guests#door`)).toBe(ID);
  });

  it("names the event in the one case a database ids in, whatever the link wrote", () => {
    expect(openedIdOf(`/dashboard/${ID.toUpperCase()}`)).toBe(ID);
  });

  it("is nothing else: create, the dashboard itself, a guest album, an outside link, a mangled id", () => {
    for (const href of [
      "/dashboard",
      "/dashboard/",
      "/dashboard/new",
      "/dashboard/new?x=1",
      `/dashboard/${ID}extra`,
      `/dashboard/${ID.slice(1)}`,
      "/dashboard/not-a-uuid",
      "/e/qr-token",
      `https://partyreel.com/dashboard/${ID}`,
      `/account/${ID}`,
      "",
      null,
      undefined,
    ])
      expect(openedIdOf(href), String(href)).toBeNull();
  });
});
