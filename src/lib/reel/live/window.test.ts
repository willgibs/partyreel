/**
 * THE WINDOW's pins — the handover, above all.
 *
 * The claim the whole rolling composer rests on: at `handoverFrame` the two plans agree about the
 * picture, so the swap is invisible and no two plans are ever composited. That is three properties:
 * no transition in flight at the handover frame, the shared clip planned identically in both
 * windows, and the next window resuming at the phase that clip had already reached.
 */
import { describe, expect, it } from "vitest";

import { frameStateAt } from "@/lib/reel/engine/timeline";
import { THEME_IDS } from "@/lib/reel/engine/themes";

import type { LiveMediaItem } from "./items";
import {
  buildCutaway,
  buildWindow,
  cutawayTheme,
  resolveLiveStyleId,
  themeFor,
  type ReelLook,
} from "./window";

const LOOK: ReelLook = { styleId: "classic", surface: "hand" };

function item(i: number, over: Partial<LiveMediaItem> = {}): LiveMediaItem {
  return {
    id: `m${i}`,
    type: "photo",
    url: `/u/${i}.jpg`,
    previewUrl: `/p/${i}.webp`,
    status: "approved",
    width: 1200,
    height: 1600,
    ...over,
  };
}

const TAKE = Array.from({ length: 24 }, (_, i) => item(i));
const BY_ID = new Map(TAKE.map((i) => [i.id, i]));
const itemFor = (id: string) => BY_ID.get(id);

const windowAt = (startIndex: number, size = 6, look: ReelLook = LOOK) =>
  buildWindow({
    index: startIndex,
    loopIndex: 0,
    startIndex,
    ids: TAKE.slice(startIndex, startIndex + size).map((i) => i.id),
    itemFor,
    seed: 4242,
    look,
  })!;

describe("buildWindow", () => {
  it("reads the clip from the LATEST item (a photo's preview, a video's poster)", () => {
    const win = buildWindow({
      index: 0,
      loopIndex: 0,
      startIndex: 0,
      ids: ["m0", "vid"],
      itemFor: (id) =>
        id === "vid"
          ? item(9, { id: "vid", type: "video", url: "/v.mp4", previewUrl: "/poster.webp" })
          : BY_ID.get(id),
      seed: 1,
      look: LOOK,
    })!;
    expect(win.props.clips[0].url).toBe("/p/0.webp");
    expect(win.props.clips[1].url).toBe("/poster.webp"); // never the raw file
    expect(win.props.clips[1].type).toBe("video");
  });

  it("drops an id the payload no longer resolves, without a hole in the plan", () => {
    const win = buildWindow({
      index: 0,
      loopIndex: 0,
      startIndex: 0,
      ids: ["m0", "vanished", "m2"],
      itemFor,
      seed: 1,
      look: LOOK,
    })!;
    expect(win.ids).toEqual(["m0", "m2"]);
    expect(win.plan.clips).toHaveLength(2);
  });

  it("plays MOODS only; a treatment falls back to the default mood", () => {
    expect(resolveLiveStyleId("polaroid")).toBe("classic");
    expect(resolveLiveStyleId("filmstrip")).toBe("classic");
    expect(resolveLiveStyleId("dreamy")).toBe("dreamy");
    expect(resolveLiveStyleId("nonsense")).toBe("classic");
    expect(windowAt(0, 6, { ...LOOK, styleId: "carddeck" }).props.styleId).toBe("classic");
  });

  it("gives a video its motion window only when Include videos is on", () => {
    const withVideo = (includeVideos: boolean) =>
      buildWindow({
        index: 0,
        loopIndex: 0,
        startIndex: 0,
        ids: ["vid"],
        itemFor: () =>
          item(1, { id: "vid", type: "video", previewUrl: "/poster.webp", durationSeconds: 30 }),
        seed: 1,
        look: { ...LOOK, includeVideos },
      })!;
    expect(withVideo(false).props.clips[0].trimDurationSec).toBeUndefined();
    expect(withVideo(true).props.clips[0].trimDurationSec).toBeGreaterThan(0);
  });

  it("never holds a video longer than the video is", () => {
    const win = buildWindow({
      index: 0,
      loopIndex: 0,
      startIndex: 0,
      ids: ["short"],
      itemFor: () =>
        item(1, { id: "short", type: "video", previewUrl: "/p.webp", durationSeconds: 1.5 }),
      seed: 1,
      look: { ...LOOK, includeVideos: true },
    })!;
    expect(win.props.clips[0].trimDurationSec).toBe(1.5);
  });
});

describe("the handover", () => {
  it("lands where NO transition is in flight (two plans are never composited)", () => {
    for (const styleId of THEME_IDS) {
      for (const surface of ["hand", "wall"] as const) {
        const win = windowAt(0, 6, { styleId, surface });
        const state = frameStateAt(win.plan, win.handoverFrame);
        expect(state.transition, `${styleId}/${surface}`).toBeNull();
        expect(state.under).toBeNull();
        // And it is the LAST clip — the one the next window opens on.
        expect(state.top.clipIndex).toBe(win.plan.clips.length - 1);
        expect(win.handoverFrame).toBeLessThan(win.plan.totalFrames);
      }
    }
  });

  it("hands the shared clip over as the SAME clip, at the phase it had reached", () => {
    for (const styleId of THEME_IDS) {
      const a = windowAt(0, 6, { styleId, surface: "wall" });
      const b = windowAt(5, 6, { styleId, surface: "wall" });
      expect(a.overlapIndex).toBe(5);
      expect(b.ids[0]).toBe(a.ids[5]);
      // The same plan for that clip: the motion, and the hold it is a fraction of.
      expect(b.plan.clips[0].motion).toEqual(a.plan.clips[5].motion);
      // And the resume frame is exactly the local frame the clip was at when we swapped.
      const outgoing = frameStateAt(a.plan, a.handoverFrame);
      const incoming = frameStateAt(b.plan, a.handoverOffset);
      expect(incoming.top.localFrame).toBe(outgoing.top.localFrame);
      expect(incoming.top.clipIndex).toBe(0);
      expect(incoming.transition).toBeNull();
    }
  });

  it("hands over as EARLY in the hold as the rule allows", () => {
    const win = windowAt(0);
    const last = win.plan.clips.length - 1;
    expect(win.handoverOffset).toBe(win.plan.gaps[last - 1].durationInFrames);
    // One frame earlier and the entering transition would still be running.
    expect(frameStateAt(win.plan, win.handoverFrame - 1).transition).not.toBeNull();
  });

  it("a one-clip window holds to the end and shares nothing", () => {
    const win = buildWindow({
      index: 0,
      loopIndex: 0,
      startIndex: 0,
      ids: ["m0"],
      itemFor,
      seed: 1,
      look: LOOK,
    })!;
    expect(win.overlapIndex).toBeNull();
    expect(win.handoverOffset).toBe(0);
    expect(win.handoverFrame).toBe(win.plan.totalFrames - 1);
  });
});

describe("the cutaway (a drop is immediate)", () => {
  it("leaves through the style's SHORTEST transition, starting on the next frame", () => {
    const look: ReelLook = { styleId: "warm", surface: "hand" };
    const cut = buildCutaway({
      index: 3,
      loopIndex: 0,
      startIndex: 3,
      ids: ["m3", "m4", "m5"],
      itemFor,
      seed: 4242,
      look,
    })!;
    const shortest = Math.min(
      ...themeFor(look).transitions.map((t) => t.durationSec),
    );
    expect(cut.plan.gaps[0].durationInFrames).toBeLessThanOrEqual(
      Math.max(2, Math.round(shortest * 24)),
    );
    // Resuming there puts the departing clip on its way out on the very first frame drawn.
    const state = frameStateAt(cut.plan, cut.resumeFrame);
    expect(state.under?.clipIndex).toBe(0);
    expect(state.top.clipIndex).toBe(1);
    expect(state.transition?.progress).toBe(0);
    // And it is gone within the transition's own frames.
    const after = frameStateAt(cut.plan, cut.resumeFrame + cut.plan.gaps[0].durationInFrames);
    expect(after.under).toBeNull();
    expect(after.top.clipIndex).toBe(1);
  });

  it("picks the shortest transition of a multi-kind palette", () => {
    const theme = cutawayTheme(themeFor({ styleId: "punchy", surface: "wall" }));
    expect(theme.transitions).toHaveLength(1);
    expect(theme.transitions[0].kind).toBe("cut");
    expect(theme.holdJitter).toBe(0);
  });

  it("holds when there is nothing left to cut to", () => {
    const cut = buildCutaway({
      index: 0,
      loopIndex: 0,
      startIndex: 0,
      ids: ["m0"],
      itemFor,
      seed: 1,
      look: LOOK,
    })!;
    expect(cut.resumeFrame).toBe(0);
  });
});
