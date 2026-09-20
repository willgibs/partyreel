import { describe, expect, it } from "vitest";

import type { GridMedia } from "@/components/app/media-grid";
import {
  newArrivalIds,
  reconcileGalleryItems,
} from "@/lib/guest/reconcile-gallery-items";

// A presigned gallery row. `sig` stands in for the SigV4 signature that rolls
// when the 30-min presign bucket rolls.
function media(id: string, sig: string, extra: Partial<GridMedia> = {}) {
  return {
    id,
    type: "photo",
    url: `https://r2/${id}/original.jpg?sig=${sig}`,
    previewUrl: `https://r2/${id}/preview.webp?sig=${sig}`,
    downloadUrl: `https://r2/${id}/original.jpg?sig=${sig}&dl=1`,
    ...extra,
  } as GridMedia;
}

describe("reconcileGalleryItems", () => {
  it("keeps object IDENTITY when the row is unchanged (no <img> reload)", () => {
    const prev = [media("a", "s1"), media("b", "s1")];
    const next = [media("a", "s1"), media("b", "s1")];
    const out = reconcileGalleryItems(prev, next);
    // Identity, not just equality: React must see no changed prop at all.
    expect(out[0]).toBe(prev[0]);
    expect(out[1]).toBe(prev[1]);
  });

  it("ADOPTS the refreshed URLs when the presign bucket rolls", () => {
    // THE 90-MINUTE BUG: the old reconcile returned prev here, so the gallery
    // kept signatures that were already counting down to expiry.
    const prev = [media("a", "s1")];
    const next = [media("a", "s2")];
    const out = reconcileGalleryItems(prev, next);
    expect(out[0]).toBe(next[0]);
    expect(out[0].url).toContain("sig=s2");
    expect(out[0].downloadUrl).toContain("sig=s2");
  });

  it("adopts a changed non-URL field too (late-resolving attribution)", () => {
    const prev = [media("a", "s1")];
    const next = [media("a", "s1", { uploaderName: "Sam" })];
    expect(reconcileGalleryItems(prev, next)[0]).toBe(next[0]);
  });

  it("takes brand-new items straight from the server", () => {
    const prev = [media("a", "s1")];
    const next = [media("b", "s1"), media("a", "s1")];
    const out = reconcileGalleryItems(prev, next);
    expect(out.map((m) => m.id)).toEqual(["b", "a"]);
    expect(out[0]).toBe(next[0]);
    expect(out[1]).toBe(prev[0]);
  });

  it("drops removed items and follows the server's order", () => {
    const prev = [media("a", "s1"), media("b", "s1"), media("c", "s1")];
    const next = [media("c", "s1"), media("a", "s1")];
    expect(reconcileGalleryItems(prev, next).map((m) => m.id)).toEqual([
      "c",
      "a",
    ]);
  });

  it("mixes identity-keeping and adoption in one pass", () => {
    const prev = [media("a", "s1"), media("b", "s1")];
    const next = [media("a", "s1"), media("b", "s2")];
    const out = reconcileGalleryItems(prev, next);
    expect(out[0]).toBe(prev[0]); // unchanged, kept
    expect(out[1]).toBe(next[1]); // rolled, adopted
  });

  it("treats an absent optional field and undefined alike", () => {
    // The JSON round-trip drops absent optionals; that must not read as a diff
    // and force a pointless adoption every poll.
    const prev = [media("a", "s1", { downloadUrl: undefined })];
    const withoutKey = media("a", "s1");
    delete (withoutKey as Partial<GridMedia>).downloadUrl;
    expect(reconcileGalleryItems(prev, [withoutKey])[0]).toBe(prev[0]);
  });

  it("empty server payload clears the gallery", () => {
    expect(reconcileGalleryItems([media("a", "s1")], [])).toEqual([]);
  });
});

/**
 * THE ARRIVAL (Will, `live=land`, 2026-09-20). What the glow is allowed to mean:
 * this photograph was not on the screen a moment ago. Never "it is recent",
 * never "this tab uploaded it".
 */
describe("newArrivalIds", () => {
  it("reports exactly what was not on screen a moment ago", () => {
    const prev = [media("a", "s1")];
    const next = [media("c", "s1"), media("b", "s1"), media("a", "s1")];
    expect(newArrivalIds(prev, next)).toEqual(new Set(["c", "b"]));
  });

  it("the FIRST snapshot never glows: a seeded album is not an arrival", () => {
    // The album's own entrance stagger is the motion for a page load; lighting
    // every tile on the seed would be a screen full of glow at first paint.
    expect(newArrivalIds([], [media("a", "s1"), media("b", "s1")])).toEqual(
      new Set(),
    );
  });

  it("a rolled presign is not an arrival", () => {
    // Every 30 minutes the bucket rolls and every row's URL changes. That is a
    // re-presign, not a photograph: nothing may light up.
    const prev = [media("a", "s1"), media("b", "s1")];
    const next = [media("a", "s2"), media("b", "s2")];
    expect(newArrivalIds(prev, next)).toEqual(new Set());
  });

  it("a REMOVED item is not an arrival, and neither is what is left", () => {
    const prev = [media("a", "s1"), media("b", "s1")];
    expect(newArrivalIds(prev, [media("b", "s1")])).toEqual(new Set());
  });

  it("catches a whole burst at once (a hidden tab catching up)", () => {
    const prev = [media("a", "s1")];
    const next = ["e", "d", "c", "b", "a"].map((id) => media(id, "s1"));
    expect(newArrivalIds(prev, next)).toEqual(new Set(["e", "d", "c", "b"]));
  });

  it("an unchanged poll reports nothing", () => {
    const prev = [media("a", "s1"), media("b", "s1")];
    expect(newArrivalIds(prev, prev)).toEqual(new Set());
  });
});
