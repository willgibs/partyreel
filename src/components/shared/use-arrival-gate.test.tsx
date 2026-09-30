import { useEffect } from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GridMedia } from "@/components/app/media-grid";
import {
  ARRIVAL_DECODE_WAIT_MS,
  ARRIVAL_HOLD_MAX,
  useArrivalGate,
} from "@/components/shared/use-arrival-gate";
import { ARRIVAL_GLOW_MS } from "@/lib/shared/arrival";
import { setReducedMotion } from "../../../vitest.setup";

/**
 * A GUEST'S LIVE ARRIVAL LANDS COMPLETE, OR NOT UNTIL IT CAN (crumbs-23, build 26's red-team).
 *
 * The rows push an arrival, and `MediaTile` shows a photograph that is complete when its <img> mounts at
 * once (`data-instant`), so the push reveals a photograph. Nothing had fetched an arrival before the album
 * pushed it (and a delta brings no link at all: `url: ""` until a window asks), so it mounted with
 * `complete: false` and faded in 0.3s after the wipe. The gate holds each arrival out of the rows until
 * its link has landed and its photograph is decoded into the document, then lets it in; a photograph that
 * fails or takes long is let in anyway and fades as it always did.
 *
 * jsdom loads no images, so `Image` is stood in for by a class whose `decode()` the test settles: what is
 * pinned is WHEN the rows are handed an arrival and WHAT the browser is asked to hold for it, never a frame.
 */

type Decode = {
  src: string;
  decoding: string;
  resolve: () => void;
  reject: () => void;
};
let decodes: Decode[] = [];

class FakeImage {
  decoding = "";
  src = "";
  decode() {
    return new Promise<void>((resolve, reject) => {
      decodes.push({
        src: this.src,
        decoding: this.decoding,
        resolve,
        reject: () => reject(new Error("EncodingError")),
      });
    });
  }
}

beforeEach(() => {
  decodes = [];
  vi.useFakeTimers();
  vi.stubGlobal("Image", FakeImage);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  setReducedMotion(false);
});

/** A photograph of the album: linked (its preview and original, as a link brings them) or not yet. */
function photo(id: string, linked = true): GridMedia {
  return {
    id,
    type: "photo",
    url: linked ? `https://r2.test/o/${id}` : "",
    previewUrl: linked ? `https://r2.test/t/${id}` : null,
    width: 640,
    height: 480,
  };
}
function video(id: string, linked = true, preview = false): GridMedia {
  return {
    id,
    type: "video",
    url: linked ? `https://r2.test/o/${id}.mp4` : "",
    previewUrl: linked && preview ? `https://r2.test/t/${id}` : null,
  };
}

function Harness({
  items,
  arrivals,
  needLinks,
}: {
  items: GridMedia[];
  arrivals?: readonly string[];
  needLinks?: (ids: readonly string[]) => void;
}) {
  const gate = useArrivalGate(items, arrivals, needLinks);
  return (
    <ul data-testid="rows" data-count={gate.items.length}>
      {gate.items.map((item) => (
        <li key={item.id} data-glow={gate.glow.has(item.id) ? "" : undefined}>
          {item.id}
        </li>
      ))}
    </ul>
  );
}
const rows = () => screen.getByTestId("rows");
const shown = () => [...rows().children].map((li) => li.textContent as string);
const glowing = () =>
  [...rows().children]
    .filter((li) => li.hasAttribute("data-glow"))
    .map((li) => li.textContent as string);

/** Let the clock run `ms` (timers and every promise they release). */
const wait = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

const SEED = [photo("a"), photo("b")];

describe("an arrival is held out of the rows until its photograph is decoded", () => {
  it("★ asks for its link, decodes the very address its tile will draw, and lets it in only then", async () => {
    const needLinks = vi.fn();
    const view = render(
      <Harness items={SEED} arrivals={[]} needLinks={needLinks} />,
    );
    expect(shown()).toEqual(["a", "b"]);

    // A delta brings the manifest's tuple alone: no link, so nothing to fetch yet.
    view.rerender(
      <Harness
        items={[photo("c", false), ...SEED]}
        arrivals={["c"]}
        needLinks={needLinks}
      />,
    );
    expect(shown()).toEqual(["a", "b"]);
    expect(needLinks).toHaveBeenCalledWith(["c"]);
    expect(decodes).toHaveLength(0);

    // The link lands: the photograph the tile will draw is the PREVIEW, so that is what is decoded
    // (the browser hands a new <img> a photograph it holds only for the address it fetched).
    view.rerender(
      <Harness
        items={[photo("c"), ...SEED]}
        arrivals={["c"]}
        needLinks={needLinks}
      />,
    );
    expect(decodes).toHaveLength(1);
    expect(decodes[0].src).toBe("https://r2.test/t/c");
    expect(decodes[0].decoding).toBe("async");
    expect(shown()).toEqual(["a", "b"]);

    // Decoded: the rows are handed a photograph the browser already holds.
    await act(async () => decodes[0].resolve());
    expect(shown()).toEqual(["c", "a", "b"]);
    // It was asked for once, however many renders it was held through.
    expect(needLinks).toHaveBeenCalledTimes(1);
  });

  it("a photograph with no preview is decoded from its original: that is the address its tile draws", async () => {
    const view = render(<Harness items={SEED} arrivals={[]} />);
    const bare = { ...photo("c"), previewUrl: null };
    view.rerender(<Harness items={[bare, ...SEED]} arrivals={["c"]} />);
    expect(decodes[0].src).toBe("https://r2.test/o/c");
  });

  it("★ lets an arrival whose photograph cannot be decoded in at once, to fade as it always did", async () => {
    const view = render(<Harness items={SEED} arrivals={[]} />);
    view.rerender(<Harness items={[photo("c"), ...SEED]} arrivals={["c"]} />);
    expect(shown()).toEqual(["a", "b"]);
    await act(async () => decodes[0].reject());
    expect(shown()).toEqual(["c", "a", "b"]);
  });

  it("★ never waits longer than the wait, for a photograph that is slow or a link that never comes", async () => {
    const view = render(<Harness items={SEED} arrivals={[]} />);
    // Two arrivals: one whose link never lands, one whose photograph never decodes.
    view.rerender(
      <Harness
        items={[photo("d", false), photo("c"), ...SEED]}
        arrivals={["c", "d"]}
      />,
    );
    expect(shown()).toEqual(["a", "b"]);
    await wait(ARRIVAL_DECODE_WAIT_MS - 1);
    expect(shown()).toEqual(["a", "b"]);
    await wait(1);
    expect(shown()).toEqual(["d", "c", "a", "b"]);
  });

  it("holds each arrival for its own wait: a later one is not let in by an earlier one's clock", async () => {
    const view = render(<Harness items={SEED} arrivals={[]} />);
    view.rerender(<Harness items={[photo("c"), ...SEED]} arrivals={["c"]} />);
    await wait(1500);
    view.rerender(
      <Harness
        items={[photo("d"), photo("c"), ...SEED]}
        arrivals={["c", "d"]}
      />,
    );
    await wait(500); // c's wait ends here
    expect(shown()).toEqual(["d", "c", "a", "b"].filter((id) => id !== "d"));
    await wait(1500); // d's ends here
    expect(shown()).toEqual(["d", "c", "a", "b"]);
  });

  it("a video with no preview draws no <img>: it waits for its link and decodes nothing", async () => {
    const view = render(<Harness items={SEED} arrivals={[]} />);
    view.rerender(
      <Harness items={[video("v", false), ...SEED]} arrivals={["v"]} />,
    );
    expect(shown()).toEqual(["a", "b"]);
    view.rerender(
      <Harness items={[video("v", true), ...SEED]} arrivals={["v"]} />,
    );
    await wait(0);
    expect(decodes).toHaveLength(0);
    expect(shown()).toEqual(["v", "a", "b"]);
  });

  it("a video WITH a preview is decoded from its poster still, as its tile draws it", async () => {
    const view = render(<Harness items={SEED} arrivals={[]} />);
    view.rerender(
      <Harness items={[video("v", true, true), ...SEED]} arrivals={["v"]} />,
    );
    expect(decodes[0].src).toBe("https://r2.test/t/v");
  });
});

describe("a burst is not held whole", () => {
  it("★ holds at most ARRIVAL_HOLD_MAX at once and lets the rest straight in, glowing", async () => {
    const view = render(<Harness items={SEED} arrivals={[]} />);
    const burst = Array.from(
      { length: ARRIVAL_HOLD_MAX + 3 },
      (_, i) => `n${i}`,
    );
    view.rerender(
      <Harness
        items={[...burst.map((id) => photo(id)), ...SEED]}
        arrivals={burst}
      />,
    );
    // The first twelve wait for their photographs (twelve requests, not fifteen); the last three are in.
    expect(decodes).toHaveLength(ARRIVAL_HOLD_MAX);
    expect(shown()).toEqual([...burst.slice(ARRIVAL_HOLD_MAX), "a", "b"]);
    await wait(0);
    expect(glowing()).toEqual(burst.slice(ARRIVAL_HOLD_MAX));
    // As they decode, the held ones follow.
    await act(async () => decodes.forEach((d) => d.resolve()));
    expect(shown()).toEqual([...burst, "a", "b"]);
  });
});

describe("only what the album's grammar calls an arrival is held", () => {
  it("★ never holds the seed, nor anything a filter, a step or a resize brings the rows", () => {
    const view = render(<Harness items={SEED} arrivals={[]} />);
    // The Yours filter toggled off brings photographs new to the rows, none an arrival.
    view.rerender(
      <Harness
        items={[photo("x", false), photo("y"), ...SEED]}
        arrivals={[]}
      />,
    );
    expect(shown()).toEqual(["x", "y", "a", "b"]);
    expect(decodes).toHaveLength(0);
  });

  it("★ never holds an arrival the Yours filter hides, nor lays it late when the filter opens", () => {
    // The provider names "c" an arrival, but the filtered list the rows are given has no "c".
    const view = render(<Harness items={SEED} arrivals={[]} />);
    view.rerender(<Harness items={SEED} arrivals={["c"]} />);
    expect(shown()).toEqual(["a", "b"]);
    expect(decodes).toHaveLength(0);
    // The filter opens a moment later: "c" is judged already, so it is simply there.
    view.rerender(
      <Harness items={[photo("c", false), ...SEED]} arrivals={["c"]} />,
    );
    expect(shown()).toEqual(["c", "a", "b"]);
    expect(decodes).toHaveLength(0);
  });

  it("★ lets in at once a held arrival that turns out to be this device's own (it left the arrivals)", () => {
    const view = render(<Harness items={SEED} arrivals={[]} />);
    view.rerender(
      <Harness items={[photo("c", false), ...SEED]} arrivals={["c"]} />,
    );
    expect(shown()).toEqual(["a", "b"]);
    // Its own landing was noted a beat after the manifest brought it: the grammar takes it out of the arrivals.
    view.rerender(
      <Harness items={[photo("c", false), ...SEED]} arrivals={[]} />,
    );
    expect(shown()).toEqual(["c", "a", "b"]);
    // ...and it takes no glow: an own landing sweeps.
    expect(glowing()).toEqual([]);
  });

  it("stops waiting for an arrival that leaves the album (hidden, removed) and never lets it in", async () => {
    const view = render(<Harness items={SEED} arrivals={[]} />);
    view.rerender(<Harness items={[photo("c"), ...SEED]} arrivals={["c"]} />);
    view.rerender(<Harness items={SEED} arrivals={["c"]} />);
    await act(async () => decodes[0].resolve());
    expect(shown()).toEqual(["a", "b"]);
  });

  it("★ holds nothing under reduced motion: nothing is pushed and nothing fades, so nothing waits", () => {
    setReducedMotion(true);
    const view = render(<Harness items={SEED} arrivals={[]} />);
    view.rerender(
      <Harness items={[photo("c", false), ...SEED]} arrivals={["c"]} />,
    );
    expect(shown()).toEqual(["c", "a", "b"]);
    expect(decodes).toHaveLength(0);
  });

  it("an arrival already standing when the album first draws is its opening paint: shown, glowing, never held", async () => {
    render(<Harness items={[photo("c"), ...SEED]} arrivals={["c"]} />);
    await wait(0);
    expect(shown()).toEqual(["c", "a", "b"]);
    expect(glowing()).toEqual(["c"]);
    expect(decodes).toHaveLength(0);
  });

  it("does nothing at all where the surface names no arrivals", () => {
    const view = render(<Harness items={SEED} />);
    view.rerender(<Harness items={[photo("c", false), ...SEED]} />);
    expect(shown()).toEqual(["c", "a", "b"]);
  });
});

describe("the glow is lit when the photograph lands", () => {
  it("★ lights a let-in arrival for its whole life from that moment, not from the delta", async () => {
    const view = render(<Harness items={SEED} arrivals={[]} />);
    view.rerender(<Harness items={[photo("c"), ...SEED]} arrivals={["c"]} />);
    // Held for 1.5 seconds: a hold that began at the delta would have but half a second of light left.
    await wait(1500);
    expect(glowing()).toEqual([]);
    await act(async () => decodes[0].resolve());
    await wait(0);
    expect(glowing()).toEqual(["c"]);
    await wait(ARRIVAL_GLOW_MS - 1);
    expect(glowing()).toEqual(["c"]);
    await wait(1);
    expect(glowing()).toEqual([]);
  });

  it("holds the glow per id: two arrivals a beat apart each get a whole life", async () => {
    const view = render(<Harness items={SEED} arrivals={[]} />);
    view.rerender(<Harness items={[photo("c"), ...SEED]} arrivals={["c"]} />);
    await act(async () => decodes[0].resolve());
    await wait(1000);
    view.rerender(
      <Harness
        items={[photo("d"), photo("c"), ...SEED]}
        arrivals={["c", "d"]}
      />,
    );
    await act(async () => decodes[1].resolve());
    await wait(0);
    expect(glowing().sort()).toEqual(["c", "d"]);
    await wait(1000); // c's life is over, d's has a second left
    expect(glowing()).toEqual(["d"]);
  });
});

describe("what the rows are handed", () => {
  it("is the very list it was given while nothing is held, so an equal poll re-lays nothing", () => {
    const items = [...SEED];
    const handed = { current: [] as GridMedia[] };
    function Probe() {
      const gate = useArrivalGate(items, []);
      useEffect(() => {
        handed.current = gate.items;
      });
      return null;
    }
    const view = render(<Probe />);
    expect(handed.current).toBe(items);
    view.rerender(<Probe />);
    expect(handed.current).toBe(items);
  });
});
