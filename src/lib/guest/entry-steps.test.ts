import { describe, expect, it } from "vitest";

import {
  computeDoor,
  contributionAnswered,
  doorBack,
  type DoorPath,
  type EntryStep,
} from "@/lib/guest/entry-steps";

/**
 * THE DOOR AS AN ITINERARY. Every permutation of its rules, read as the cases the sheet actually
 * meets: the chooser present or absent in each, each way in, identify ending a verification
 * event's door, the demo and the owner outside it all.
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
  isVerified: false,
  path: null as DoorPath | null,
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
    expect(
      computeDoor({
        ...base,
        isOwner: true,
        access: "teaser",
        gate: "account",
      }),
    ).toEqual({ steps: [], autoOpen: false });
  });

  /* ── the chooser (name-only events) ─────────────────────────────────── */

  it("name-only, first visit: welcome, the chooser, upload", () => {
    expect(computeDoor(base)).toEqual({
      steps: ["welcome", "chooser", "upload"],
      autoOpen: true,
    });
  });

  it("the welcome drops once seen and the chooser leads", () => {
    expect(computeDoor({ ...base, welcomeSeen: true })).toEqual({
      steps: ["chooser", "upload"],
      autoOpen: true,
    });
  });

  it("each way in replaces the chooser with its own step, and the upload still follows", () => {
    const at = (path: DoorPath) =>
      computeDoor({ ...base, welcomeSeen: true, path }).steps;
    expect(at("guest")).toEqual(["name", "upload"]);
    expect(at("create")).toEqual(["identify", "upload"]);
    expect(at("login")).toEqual(["signin", "upload"]);
  });

  it("no chooser for a guest who already has a name here", () => {
    expect(
      computeDoor({ ...base, welcomeSeen: true, hasName: true }).steps,
    ).toEqual(["upload"]);
    // A stale pick changes nothing once the name exists.
    expect(
      computeDoor({ ...base, welcomeSeen: true, hasName: true, path: "login" })
        .steps,
    ).toEqual(["upload"]);
  });

  it("no chooser for a confirmed account: with a name it meets the upload, without one the name", () => {
    expect(
      computeDoor({
        ...base,
        welcomeSeen: true,
        isVerified: true,
        hasName: true,
      }).steps,
    ).toEqual(["upload"]);
    expect(
      computeDoor({ ...base, welcomeSeen: true, isVerified: true }).steps,
    ).toEqual(["name", "upload"]);
    // Even a pick left over from before the confirmation cannot bring the chooser's steps back.
    expect(
      computeDoor({
        ...base,
        welcomeSeen: true,
        isVerified: true,
        path: "create",
      }).steps,
    ).toEqual(["name", "upload"]);
  });

  /* ── the password ───────────────────────────────────────────────────── */

  it("password-only: the itinerary STOPS at the password (nothing behind it is knowable)", () => {
    expect(computeDoor({ ...base, access: "none", gate: "password" })).toEqual({
      steps: ["welcome", "password"],
      autoOpen: true,
    });
    // Not even a pick made earlier reaches past it.
    expect(
      computeDoor({ ...base, access: "none", gate: "password", path: "guest" })
        .steps,
    ).toEqual(["welcome", "password"]);
  });

  it("after the unlock's refresh the chooser follows", () => {
    expect(
      computeDoor({ ...base, welcomeSeen: true, access: "full", gate: null }),
    ).toEqual({ steps: ["chooser", "upload"], autoOpen: true });
  });

  /* ── verification events ────────────────────────────────────────────── */

  it("verification: welcome, then identify, and identify ENDS the door (no chooser)", () => {
    expect(computeDoor({ ...base, access: "teaser", gate: "account" })).toEqual(
      { steps: ["welcome", "identify"], autoOpen: true },
    );
    // With the switch for an upload on as well, the server still has no opinion past the email.
    expect(
      computeDoor({
        ...base,
        welcomeSeen: true,
        access: "teaser",
        gate: "account",
        requireUpload: true,
      }).steps,
    ).toEqual(["identify"]);
  });

  it("a verification event ignores any way in: one path for newcomers and members alike", () => {
    for (const path of ["guest", "create", "login"] as const) {
      expect(
        computeDoor({
          ...base,
          welcomeSeen: true,
          access: "teaser",
          gate: "account",
          path,
        }).steps,
      ).toEqual(["identify"]);
    }
  });

  it("after the confirmation's refresh only the upload is left", () => {
    expect(
      computeDoor({
        ...base,
        welcomeSeen: true,
        hasName: true,
        isVerified: true,
        access: "full",
        gate: null,
      }),
    ).toEqual({ steps: ["upload"], autoOpen: true });
  });

  it("THE MID-VISIT FLIP: a named session on an event now requiring verified emails is [identify]", () => {
    expect(
      computeDoor({
        ...base,
        welcomeSeen: true,
        hasName: true,
        returning: true,
        access: "teaser",
        gate: "account",
      }),
    ).toEqual({ steps: ["identify"], autoOpen: true });
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

  it("the switch ON with no name yet: the chooser, then the upload", () => {
    expect(
      computeDoor({
        ...base,
        welcomeSeen: true,
        requireUpload: true,
        access: "teaser",
        gate: "upload",
      }).steps,
    ).toEqual(["chooser", "upload"]);
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
    // The chooser is then the last step, and each way in the last in its turn.
    expect(
      computeDoor({ ...base, welcomeSeen: true, uploadsOpen: false }).steps,
    ).toEqual(["chooser"]);
    expect(
      computeDoor({
        ...base,
        welcomeSeen: true,
        uploadsOpen: false,
        path: "create",
      }).steps,
    ).toEqual(["identify"]);
  });

  /* ── the two switches together, and the two edges ───────────────────── */

  it("both switches: the welcome, the password, then identify, then the upload", () => {
    // Locked and unconfirmed: the password alone.
    expect(
      computeDoor({ ...base, access: "none", gate: "password" }).steps,
    ).toEqual(["welcome", "password"]);
    // Unlocked, still unconfirmed: identify, and nothing behind it.
    expect(
      computeDoor({
        ...base,
        welcomeSeen: true,
        access: "teaser",
        gate: "account",
        requireUpload: true,
      }).steps,
    ).toEqual(["identify"]);
    // Confirmed, still owing a photograph.
    expect(
      computeDoor({
        ...base,
        welcomeSeen: true,
        hasName: true,
        isVerified: true,
        access: "teaser",
        gate: "upload",
        requireUpload: true,
      }).steps,
    ).toEqual(["upload"]);
  });

  it("THE DEMO: the role step then the upload; no chooser and no name are ever asked", () => {
    expect(computeDoor({ ...base, isDemo: true })).toEqual({
      steps: ["welcome", "upload"],
      autoOpen: true,
    });
    expect(computeDoor({ ...base, isDemo: true, path: "login" }).steps).toEqual(
      ["welcome", "upload"],
    );
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
    // The door has no exit, so the sheet opens for every step: a returning guest of an
    // account-gated event is never left to find "See all N".
    const accountOnly = computeDoor({
      ...base,
      welcomeSeen: true,
      hasName: true,
      returning: true,
      access: "teaser",
      gate: "account",
    });
    expect(accountOnly.steps).toEqual(["identify"]);
    expect(accountOnly.autoOpen).toBe(true);
    // And false exactly when there is nothing to show.
    expect(
      computeDoor({
        ...base,
        welcomeSeen: true,
        hasName: true,
        returning: true,
      }).autoOpen,
    ).toBe(false);
  });
});

/**
 * THE BACK CHEVRON. The welcome and the name are views over the machine; the chooser is a real
 * input, so going back to it clears the pick.
 */
describe("doorBack", () => {
  const at = (
    current: EntryStep | null,
    over: Partial<Parameters<typeof doorBack>[0]> = {},
  ) =>
    doorBack({
      current,
      path: null,
      gate: null,
      isVerified: false,
      isDemo: false,
      ...over,
    });

  it("nothing sits behind the welcome, or behind no step at all", () => {
    expect(at("welcome")).toBeNull();
    expect(at(null)).toBeNull();
  });

  it("the password and the chooser go back to the welcome", () => {
    expect(at("password")).toBe("welcome");
    expect(at("chooser")).toBe("welcome");
  });

  it("each way in goes back to the chooser that picked it", () => {
    expect(at("name", { path: "guest" })).toBe("chooser");
    expect(at("identify", { path: "create" })).toBe("chooser");
    expect(at("signin", { path: "login" })).toBe("chooser");
  });

  it("a verification event's identify goes back to the welcome: it has no chooser", () => {
    expect(at("identify", { gate: "account" })).toBe("welcome");
    // Even with a pick left over from before the host turned the switch on.
    expect(at("identify", { gate: "account", path: "create" })).toBe("welcome");
  });

  it("a confirmed account's name goes back to the welcome, never to a chooser it never saw", () => {
    expect(at("name", { isVerified: true })).toBe("welcome");
    expect(at("name", { isVerified: true, path: "create" })).toBe("welcome");
  });

  it("the upload goes back to the name it followed; the demo's and a confirmed account's to the welcome", () => {
    expect(at("upload")).toBe("name");
    expect(at("upload", { path: "guest" })).toBe("name");
    expect(at("upload", { isDemo: true })).toBe("welcome");
    expect(at("upload", { isVerified: true })).toBe("welcome");
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
  const gated = {
    ...base,
    welcomeSeen: true,
    hasName: true,
    requireUpload: true,
  };

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
