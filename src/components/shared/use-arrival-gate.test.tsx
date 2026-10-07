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
 * The rows lay an arrival, and `MediaTile` shows a photograph that is complete when its <img> mounts at
 * once (`data-instant`). Nothing had fetched an arrival before the album laid it (and a delta brings no
 * link at all: `url: ""` until a window asks), so it mounted with `complete: false` and faded in 0.3s. The
 * gate holds each arrival out of the rows until its link has landed and its photograph is decoded into the
 * document, and a batch until its slowest (guest-moments r1, `batch=settle`), then lets it in; a photograph
 * that fails or takes long is let in anyway and fades as it always did.
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
  own,
}: {
  items: GridMedia[];
  arrivals?: readonly string[];
  needLinks?: (ids: readonly string[]) => void;
  own?: readonly string[];
}) {
  const gate = useArrivalGate(items, arrivals, needLinks, own);
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

/**
 * ★ A BATCH LANDS WHOLE, AT ITS SLOWEST PHOTOGRAPH (guest-moments r1, Will's `batch=settle`): what one answer brings
 * goes into the rows together, so the top of the album opens once and every photograph of it stands whole. Let in
 * one by one, a batch of six re-laid the top six times in a second, and the slow one came in after the rest.
 */
describe("a batch lands whole", () => {
  it("★ waits for its slowest photograph, then goes in at once, every one glowing", async () => {
    const view = render(<Harness items={SEED} arrivals={[]} />);
    view.rerender(
      <Harness
        items={[photo("e"), photo("d"), photo("c"), ...SEED]}
        arrivals={["c", "d", "e"]}
      />,
    );
    expect(decodes).toHaveLength(3);
    // Two of three drawn: the batch still waits, nothing of it in the rows.
    await act(async () => {
      decodes[0].resolve();
      decodes[2].resolve();
    });
    expect(shown()).toEqual(["a", "b"]);
    // The slowest draws: all three go in together.
    await act(async () => decodes[1].resolve());
    expect(shown()).toEqual(["e", "d", "c", "a", "b"]);
    await wait(0);
    expect(glowing().sort()).toEqual(["c", "d", "e"]);
  });

  it("★ lets in at its wait whatever of it has not drawn, with the rest of it, never after it", async () => {
    const view = render(<Harness items={SEED} arrivals={[]} />);
    view.rerender(
      <Harness
        items={[photo("d"), photo("c"), ...SEED]}
        arrivals={["c", "d"]}
      />,
    );
    await act(async () => decodes[0].resolve());
    expect(shown()).toEqual(["a", "b"]);
    await wait(ARRIVAL_DECODE_WAIT_MS);
    expect(shown()).toEqual(["d", "c", "a", "b"]);
  });

  it("a photograph that cannot be decoded holds its batch no longer", async () => {
    const view = render(<Harness items={SEED} arrivals={[]} />);
    view.rerender(
      <Harness
        items={[photo("d"), photo("c"), ...SEED]}
        arrivals={["c", "d"]}
      />,
    );
    await act(async () => {
      decodes[0].reject();
      decodes[1].resolve();
    });
    expect(shown()).toEqual(["d", "c", "a", "b"]);
  });

  it("goes in once its last unready photograph leaves the album (hidden while it waited)", async () => {
    const view = render(<Harness items={SEED} arrivals={[]} />);
    view.rerender(
      <Harness
        items={[photo("d"), photo("c"), ...SEED]}
        arrivals={["c", "d"]}
      />,
    );
    await act(async () => decodes[0].resolve());
    // "d" is hidden by the host before it draws: "c" no longer waits for it.
    view.rerender(
      <Harness items={[photo("c"), ...SEED]} arrivals={["c", "d"]} />,
    );
    expect(shown()).toEqual(["c", "a", "b"]);
  });

  /* ★ RESHAPED (album-moments-wiring): this pinned "holds at most ARRIVAL_HOLD_MAX at once and lets the rest straight
     in". The cap's reason stands (a burst must not send for a hundred photographs together, ahead of what she is
     looking at), so nothing past it is fetched here; what expired is letting the rest in at once, which re-laid the
     top twice (the rest now, the held a beat later) where `batch=settle` asks the batch to land as one. */
  it("★ fetches at most ARRIVAL_HOLD_MAX at once; the rest wait unfetched with their batch, and it goes in whole", async () => {
    const view = render(<Harness items={SEED} arrivals={[]} />);
    const burst = Array.from(
      { length: ARRIVAL_HOLD_MAX + 3 },
      (_, i) => `n${i}`,
    );
    const needLinks = vi.fn();
    view.rerender(
      <Harness
        items={[...burst.map((id) => photo(id)), ...SEED]}
        arrivals={burst}
        needLinks={needLinks}
      />,
    );
    // Twelve requests, not fifteen, and only the twelve's links asked for: the rest are the window's to ask.
    expect(decodes).toHaveLength(ARRIVAL_HOLD_MAX);
    expect(needLinks).toHaveBeenCalledWith(burst.slice(0, ARRIVAL_HOLD_MAX));
    expect(shown()).toEqual(["a", "b"]);
    // As the twelve decode, the whole burst goes in, glowing.
    await act(async () => decodes.forEach((d) => d.resolve()));
    expect(shown()).toEqual([...burst, "a", "b"]);
    await wait(0);
    expect(glowing().sort()).toEqual([...burst].sort());
  });
});

/**
 * ★ HER OWN NEVER WAITS AT THE DOOR, AND GLOWS AS ANYONE'S DOES (guest-moments r1, Will's `own=glow`). Her landing is
 * drawn already (her very file), so held like a stranger's it would only vanish from the rows for the hold.
 */
describe("her own landing", () => {
  it("★ stands at once and glows, never held, never fetched", async () => {
    const view = render(<Harness items={SEED} arrivals={[]} own={[]} />);
    view.rerender(
      <Harness items={[photo("mine"), ...SEED]} arrivals={[]} own={["mine"]} />,
    );
    expect(shown()).toEqual(["mine", "a", "b"]);
    expect(decodes).toHaveLength(0);
    await wait(0);
    expect(glowing()).toEqual(["mine"]);
    await wait(ARRIVAL_GLOW_MS);
    expect(glowing()).toEqual([]);
  });

  it("lights a batch of hers whole, as a batch of anyone's", async () => {
    const view = render(<Harness items={SEED} arrivals={[]} own={[]} />);
    view.rerender(
      <Harness
        items={[photo("m2"), photo("m1"), ...SEED]}
        arrivals={[]}
        own={["m2", "m1"]}
      />,
    );
    await wait(0);
    expect(glowing().sort()).toEqual(["m1", "m2"]);
  });

  it("is lit once: a later render that still names her landing replays nothing", async () => {
    const view = render(
      <Harness items={[photo("mine"), ...SEED]} arrivals={[]} own={[]} />,
    );
    view.rerender(
      <Harness items={[photo("mine"), ...SEED]} arrivals={[]} own={["mine"]} />,
    );
    await wait(ARRIVAL_GLOW_MS);
    view.rerender(
      <Harness
        items={[photo("mine"), photo("x"), ...SEED]}
        arrivals={[]}
        own={["mine"]}
      />,
    );
    await wait(0);
    expect(glowing()).toEqual([]);
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

  // ★ RESHAPED (album-moments-wiring): the scar is that it goes in at once; it ended "it takes no glow: an own landing
  // sweeps", a reason the sweep's retirement expired (guest-moments r1, `own=glow`): hers takes the one light.
  it("★ lets in at once, lit, a held arrival that turns out to be this device's own (it left the arrivals)", async () => {
    const view = render(<Harness items={SEED} arrivals={[]} own={[]} />);
    view.rerender(
      <Harness
        items={[photo("c", false), ...SEED]}
        arrivals={["c"]}
        own={[]}
      />,
    );
    expect(shown()).toEqual(["a", "b"]);
    // Its own landing was noted a beat after the manifest brought it: the grammar takes it out of the arrivals.
    view.rerender(
      <Harness
        items={[photo("c", false), ...SEED]}
        arrivals={[]}
        own={["c"]}
      />,
    );
    expect(shown()).toEqual(["c", "a", "b"]);
    await wait(0);
    expect(glowing()).toEqual(["c"]);
  });

  it("stops waiting for an arrival that leaves the album (hidden, removed) and never lets it in", async () => {
    const view = render(<Harness items={SEED} arrivals={[]} />);
    view.rerender(<Harness items={[photo("c"), ...SEED]} arrivals={["c"]} />);
    view.rerender(<Harness items={SEED} arrivals={["c"]} />);
    await act(async () => decodes[0].resolve());
    expect(shown()).toEqual(["a", "b"]);
  });

  /* ★ RESHAPED (album-moments-wiring): this pinned "holds nothing under reduced motion: nothing is pushed and nothing
     fades, so nothing waits". That reason expired with the push: the hold moves nothing, and under guest-moments r1's
     `batch=settle` it is what keeps a place from standing empty (measured: let straight in, a batch stood as grey
     places for 150 ms). The scar kept: reduced motion changes nothing about WHEN an arrival may stand. */
  it("★ holds under reduced motion too: the hold is no motion, and a photograph stands whole there as anywhere", async () => {
    setReducedMotion(true);
    const view = render(<Harness items={SEED} arrivals={[]} />);
    view.rerender(<Harness items={[photo("c"), ...SEED]} arrivals={["c"]} />);
    expect(shown()).toEqual(["a", "b"]);
    await act(async () => decodes[0].resolve());
    expect(shown()).toEqual(["c", "a", "b"]);
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
