import { describe, expect, it } from "vitest";

import { computeDoor, contributionAnswered } from "@/lib/guest/entry-steps";

/**
 * THE DOOR AS AN ITINERARY. Every permutation of its rules, read as the cases the sheet actually
 * meets.
 */
// A first-time guest at a plain, name-only, upload-open event with no switch on.
const base = {
  gate: null as "password" | "account" | "upload" | null,
  access: "full" as "none" | "teaser" | "full",
  hasContributed: false,
  uploadsOpen: true,
  requireUpload: false,
  welcomeSeen: false,
  hasName: false,
  contributed: false,
  skipped: false,
  returning: false,
  isOwner: false,
  isDemo: false,
};

describe("computeDoor", () => {
  it("the owner gets no sheet at all, whatever the event asks", () => {
    expect(computeDoor({ ...base, isOwner: true })).toEqual({
      steps: [],
      autoOpen: false,
    });
    expect(
      computeDoor({
        ...base,
        isOwner: true,
        requireUpload: true,
        access: "teaser",
        gate: "upload",
      }),
    ).toEqual({ steps: [], autoOpen: false });
  });

  it("names mode, first visit: welcome, name, upload", () => {
    expect(computeDoor(base)).toEqual({
      steps: ["welcome", "name", "upload"],
      autoOpen: true,
    });
  });

  it("the welcome drops once seen and the rest stands", () => {
    expect(computeDoor({ ...base, welcomeSeen: true })).toEqual({
      steps: ["name", "upload"],
      autoOpen: true,
    });
  });

  /* ── the password ───────────────────────────────────────────────────── */

  it("password-only: the itinerary STOPS at the password (nothing behind it is knowable)", () => {
    expect(
      computeDoor({ ...base, access: "none", gate: "password" }),
    ).toEqual({ steps: ["welcome", "password"], autoOpen: true });
  });

  it("after the unlock's refresh the rest re-derives", () => {
    expect(
      computeDoor({ ...base, welcomeSeen: true, access: "full", gate: null }),
    ).toEqual({ steps: ["name", "upload"], autoOpen: true });
  });

  /* ── verified emails ────────────────────────────────────────────────── */

  it("verified mode: welcome, name, email (the name comes BEFORE the email)", () => {
    expect(
      computeDoor({ ...base, access: "teaser", gate: "account" }),
    ).toEqual({ steps: ["welcome", "name", "email"], autoOpen: true });
  });

  it("after the confirmation's refresh only the upload is left", () => {
    expect(
      computeDoor({
        ...base,
        welcomeSeen: true,
        hasName: true,
        access: "full",
        gate: null,
      }),
    ).toEqual({ steps: ["upload"], autoOpen: true });
  });

  it("a signed-in confirmed viewer with a profile name skips the name step", () => {
    expect(
      computeDoor({ ...base, welcomeSeen: true, hasName: true }),
    ).toEqual({ steps: ["upload"], autoOpen: true });
  });

  /* ── the upload step, and Require an upload to view ─────────────────── */

  it("a RETURNING guest skips the OFF upload step entirely", () => {
    expect(
      computeDoor({
        ...base,
        welcomeSeen: true,
        hasName: true,
        returning: true,
      }),
    ).toEqual({ steps: [], autoOpen: false });
  });

  it("the switch ON never lets a returning guest past it", () => {
    expect(
      computeDoor({
        ...base,
        welcomeSeen: true,
        hasName: true,
        returning: true,
        requireUpload: true,
        access: "teaser",
        gate: "upload",
      }),
    ).toEqual({ steps: ["upload"], autoOpen: true });
  });

  it("the soft skip drops the step OFF, and is never offered ON", () => {
    expect(
      computeDoor({ ...base, welcomeSeen: true, hasName: true, skipped: true }),
    ).toEqual({ steps: [], autoOpen: false });
    // ON, `skipped` can never be set by the UI (there is no skip to press), so the step stands
    // whatever a stale flag says: the server's own decision is what opens the album.
    expect(
      computeDoor({
        ...base,
        welcomeSeen: true,
        hasName: true,
        skipped: true,
        requireUpload: true,
        access: "teaser",
        gate: "upload",
      }).steps,
    ).toEqual(["upload"]);
  });

  it("a contribution closes the step, from either side", () => {
    // The server's answer (the cookie resolved a contributor) ...
    expect(
      computeDoor({
        ...base,
        welcomeSeen: true,
        hasName: true,
        requireUpload: true,
        hasContributed: true,
      }),
    ).toEqual({ steps: [], autoOpen: false });
    // ... and this visit's own completed upload, before any refresh has landed.
    expect(
      computeDoor({
        ...base,
        welcomeSeen: true,
        hasName: true,
        requireUpload: true,
        contributed: true,
      }),
    ).toEqual({ steps: [], autoOpen: false });
  });

  it("closed uploads never ask for one, switch or no switch", () => {
    expect(
      computeDoor({
        ...base,
        welcomeSeen: true,
        hasName: true,
        uploadsOpen: false,
        requireUpload: true,
      }),
    ).toEqual({ steps: [], autoOpen: false });
  });

  /* ── the two switches together, and the two edges ───────────────────── */

  it("both switches: the welcome, the password, then the rest", () => {
    // Locked and unconfirmed: the password alone.
    expect(
      computeDoor({ ...base, access: "none", gate: "password" }).steps,
    ).toEqual(["welcome", "password"]);
    // Unlocked, still unconfirmed: the name then the email.
    expect(
      computeDoor({
        ...base,
        welcomeSeen: true,
        access: "teaser",
        gate: "account",
        requireUpload: true,
      }).steps,
    ).toEqual(["name", "email"]);
    // Confirmed, still owing a photograph.
    expect(
      computeDoor({
        ...base,
        welcomeSeen: true,
        hasName: true,
        access: "teaser",
        gate: "upload",
        requireUpload: true,
      }).steps,
    ).toEqual(["upload"]);
  });

  it("THE MID-VISIT FLIP: a named session on an event now requiring verified emails is [email]", () => {
    expect(
      computeDoor({
        ...base,
        welcomeSeen: true,
        hasName: true,
        returning: true,
        access: "teaser",
        gate: "account",
      }),
    ).toEqual({ steps: ["email"], autoOpen: true });
  });

  it("THE DEMO: the role step then the upload, and no name is ever asked", () => {
    expect(computeDoor({ ...base, isDemo: true })).toEqual({
      steps: ["welcome", "upload"],
      autoOpen: true,
    });
  });

  it("a returning guest with a name and a contribution meets nothing", () => {
    expect(
      computeDoor({
        ...base,
        welcomeSeen: true,
        hasName: true,
        returning: true,
        hasContributed: true,
        requireUpload: true,
      }),
    ).toEqual({ steps: [], autoOpen: false });
  });

  /* ── the sheet opens whenever a step exists ─────────────────────────── */

  it("autoOpen is TRUE whenever a step exists (the 'browse the teaser first' exemption is retired)", () => {
    // The door has no exit, so the sheet opens for every step, never only the welcome and the
    // password: a returning guest of an account-gated event is never left to find "See all N".
    const accountOnly = computeDoor({
      ...base,
      welcomeSeen: true,
      hasName: true,
      returning: true,
      access: "teaser",
      gate: "account",
    });
    expect(accountOnly.steps).toEqual(["email"]);
    expect(accountOnly.autoOpen).toBe(true);
    // And false exactly when there is nothing to show.
    expect(
      computeDoor({ ...base, welcomeSeen: true, hasName: true, returning: true })
        .autoOpen,
    ).toBe(false);
  });
});

/**
 * UPLOADED, THEN REMOVED. On a Require-an-upload-to-view event a guest's own delete takes their
 * contribution back, and the page must hand them the door WITH its upload step, never a teaser with
 * no way through. The browser's own half (`contributed`, true all visit) closes the step only until
 * the server has answered since it; the sequence below is the renders one visit actually meets.
 */
describe("contributionAnswered: the door comes back after your own last delete", () => {
  // A named, welcomed guest on a require-upload event whose uploads are open.
  const gated = { ...base, welcomeSeen: true, hasName: true, requireUpload: true };

  /** One render: the bit carried from the last render, and the door `computeDoor` draws. */
  function render(
    answered: boolean,
    frame: { contributed: boolean; gate: "upload" | null },
  ) {
    const next = contributionAnswered({
      answered,
      contributed: frame.contributed,
      gate: frame.gate,
      requireUpload: true,
    });
    const door = computeDoor({
      ...gated,
      gate: frame.gate,
      access: frame.gate === "upload" ? "teaser" : "full",
      hasContributed: frame.gate !== "upload",
      contributed: frame.contributed && !next,
    });
    return { answered: next, steps: door.steps };
  }

  it("uploaded, then removed: the upload step returns once the server takes it back", () => {
    // 1. Arrival: the server holds the guest at the upload step.
    let r = render(false, { contributed: false, gate: "upload" });
    expect(r.steps).toEqual(["upload"]);
    // 2. Their first photograph completes, BEFORE any refresh: the stale gate still says upload,
    //    and the browser's own half drops the step at once.
    r = render(r.answered, { contributed: true, gate: "upload" });
    expect(r.steps).toEqual([]);
    // 3. The refresh lands: the server counted it.
    r = render(r.answered, { contributed: true, gate: null });
    expect(r.steps).toEqual([]);
    expect(r.answered).toBe(true);
    // 4. They remove it themselves; the refresh says upload again, and the door has its step.
    r = render(r.answered, { contributed: true, gate: "upload" });
    expect(r.steps).toEqual(["upload"]);
  });

  it("never retires the browser's half while the switch is off (the soft step must not come back)", () => {
    expect(
      contributionAnswered({
        answered: false,
        contributed: true,
        gate: null,
        requireUpload: false,
      }),
    ).toBe(false);
  });

  it("is sticky: once answered, it stays answered", () => {
    expect(
      contributionAnswered({
        answered: true,
        contributed: true,
        gate: "upload",
        requireUpload: true,
      }),
    ).toBe(true);
  });
});
