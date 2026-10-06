import { describe, expect, it } from "vitest";

import { NAV } from "@/lib/admin/nav";
import {
  matchPalette,
  PALETTE_ACTIONS,
  paletteSurfaces,
  tokenize,
} from "@/lib/admin/palette";

/**
 * THE PALETTE'S INDEX (admin-wiring, 2026-09-20).
 *
 * Two things are pinned and they are both about TRUTH rather than ranking: that
 * every surface in the nav is reachable from search (a thirteenth surface added
 * to `nav.ts` and forgotten here would be invisible to ⌘K), and that no action
 * in the index performs anything. The second is the one that matters:
 * `destructive=sheet` was ruled because the portal's most expensive acts were
 * its cheapest clicks, and an index whose "Pause the purge sweep" row fired the
 * switch would be a new cheapest click behind four letters and Enter.
 */

describe("the index", () => {
  it("offers every surface the nav knows, and invents none", () => {
    const hrefs = paletteSurfaces().map((e) => e.href);
    expect(hrefs).toEqual(NAV.map((item) => item.href));
  });

  it("points every action at a real surface, with an anchor to land on", () => {
    const surfaces = new Set(NAV.map((item) => item.href));
    for (const action of PALETTE_ACTIONS) {
      const [path, hash] = action.href.split("#");
      expect(surfaces.has(path), `${action.id} points at ${path}`).toBe(true);
      expect(hash, `${action.id} has no anchor to scroll to`).toBeTruthy();
    }
  });

  // ★ crumbs-75: the spend watch's two switches are reached by name, each on its own row of the watch's card
  // (`spend-watch-card.test.tsx` holds the rows to these anchors).
  it("★ names the spend watch's two switches, each jumping to its own row", () => {
    const byId = new Map(PALETTE_ACTIONS.map((a) => [a.id, a]));
    expect(byId.get("action-guest-uploads")?.href).toBe(
      "/admin/jobs#switch-uploads_enabled",
    );
    expect(byId.get("action-lifecycle-mail")?.href).toBe(
      "/admin/jobs#switch-lifecycle_mail_enabled",
    );
    expect(
      matchPalette(PALETTE_ACTIONS, "guest uploads").map((e) => e.id),
    ).toEqual(["action-guest-uploads"]);
    expect(
      matchPalette(PALETTE_ACTIONS, "lifecycle mail").map((e) => e.id),
    ).toEqual(["action-lifecycle-mail"]);
    expect(
      matchPalette(PALETTE_ACTIONS, "spend watch").map((e) => e.id),
    ).toEqual(["action-guest-uploads", "action-lifecycle-mail"]);
  });

  // ★ drive-crumbs: Drive's admin section is reached by name, on the card `drive-section.tsx` renders as `drive`.
  it("★ names Send to Google Drive, jumping to its card", () => {
    const byId = new Map(PALETTE_ACTIONS.map((a) => [a.id, a]));
    expect(byId.get("action-drive")?.href).toBe("/admin/exports#drive");
    for (const query of ["drive", "google", "pause drive", "breaker"]) {
      expect(matchPalette(PALETTE_ACTIONS, query)[0]?.id, query).toBe(
        "action-drive",
      );
    }
  });

  it("makes every action a DESTINATION and never a call", () => {
    // The whole module is data: no function on an entry means there is nothing
    // for a palette row to invoke even by accident.
    for (const entry of [...paletteSurfaces(), ...PALETTE_ACTIONS]) {
      for (const value of Object.values(entry)) {
        expect(typeof value, `${entry.id} carries a callable`).not.toBe(
          "function",
        );
      }
    }
  });
});

describe("the ranker", () => {
  it("shows the whole list, unfiltered, before anything is typed", () => {
    expect(matchPalette(paletteSurfaces(), "", 8)).toHaveLength(8);
    expect(matchPalette(paletteSurfaces(), "   ", 3)).toHaveLength(3);
  });

  it("narrows on a second word rather than widening (AND, not OR)", () => {
    const one = matchPalette(PALETTE_ACTIONS, "pause");
    const two = matchPalette(PALETTE_ACTIONS, "pause downloads");
    expect(one.length).toBeGreaterThan(two.length);
    expect(two.map((e) => e.id)).toEqual(["action-downloads"]);
  });

  it("puts a label that STARTS with the term above one that merely contains it", () => {
    const hits = matchPalette(paletteSurfaces(), "re");
    // "Reports" begins with it; "Announcements" only contains it.
    expect(hits[0].label.toLowerCase().startsWith("re")).toBe(true);
  });

  it("finds a word inside a label, so a term need not be its first", () => {
    expect(matchPalette(PALETTE_ACTIONS, "sweep").map((e) => e.id)).toContain(
      "action-purge-run",
    );
  });

  it("matches a keyword nobody sees, for the words an operator actually uses", () => {
    expect(
      matchPalette(PALETTE_ACTIONS, "kill switch").map((e) => e.id),
    ).toContain("action-downloads");
  });

  it("returns nothing rather than everything when a term matches nothing", () => {
    expect(matchPalette(paletteSurfaces(), "xyzzy")).toEqual([]);
  });

  it("keeps the list stable while somebody types", () => {
    // Ties break on declaration order, so a row never jumps under a cursor
    // because two entries scored the same.
    const first = matchPalette(paletteSurfaces(), "a");
    const again = matchPalette(paletteSurfaces(), "a");
    expect(first.map((e) => e.id)).toEqual(again.map((e) => e.id));
  });
});

describe("tokenize", () => {
  it("drops the whitespace a real query is full of", () => {
    expect(tokenize("  purge   sweep ")).toEqual(["purge", "sweep"]);
    expect(tokenize("   ")).toEqual([]);
  });
});
