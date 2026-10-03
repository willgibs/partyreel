/**
 * THE PRODUCT'S MEDIA QUERIES READ THE PAGE'S OWN WINDOW, AS THEY ALWAYS HAVE
 * (lab-frame). `useMediaQuery` also reads a window a provider hands it, and
 * the only provider is the design lab's portalled `Frame`; these pins hold the
 * product's side to what it was before the provider existed: the global
 * `window.matchMedia`, one `change` subscription taken and given back, and a
 * server render that never guesses (false).
 */
import { act, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MediaWindowProvider, useMediaQuery } from "./use-media-query";

/** A window whose queries answer `matches` until `flip` says otherwise. */
function fakeWindow(matches: boolean) {
  const listeners = new Set<() => void>();
  let now = matches;
  const mql = {
    get matches() {
      return now;
    },
    addEventListener: vi.fn((_: string, fn: () => void) => listeners.add(fn)),
    removeEventListener: vi.fn((_: string, fn: () => void) =>
      listeners.delete(fn),
    ),
  };
  // Only what the hook reads of a MediaQueryList.
  const matchMedia = vi.fn(() => mql as unknown as MediaQueryList);
  return {
    win: { matchMedia } as unknown as Window,
    matchMedia,
    mql,
    flip(next: boolean) {
      now = next;
      listeners.forEach((fn) => fn());
    },
  };
}

function Probe({ query }: { query: string }) {
  return <p>{String(useMediaQuery(query))}</p>;
}

describe("useMediaQuery, the product's side", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads the page's own window, subscribes once and gives it back", () => {
    const page = fakeWindow(true);
    const spy = vi
      .spyOn(window, "matchMedia")
      .mockImplementation(page.matchMedia);
    const { container, unmount } = render(<Probe query="(min-width: 640px)" />);
    expect(container.textContent).toBe("true");
    expect(spy).toHaveBeenCalledWith("(min-width: 640px)");
    expect(page.mql.addEventListener).toHaveBeenCalledTimes(1);
    expect(page.mql.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );

    act(() => page.flip(false));
    expect(container.textContent).toBe("false");

    unmount();
    expect(page.mql.removeEventListener).toHaveBeenCalledTimes(1);
  });

  it("never guesses on the server", () => {
    expect(renderToString(<Probe query="(min-width: 640px)" />)).toBe(
      "<p>false</p>",
    );
  });
});

describe("useMediaQuery inside a window it is handed (the lab's frame)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("answers for the handed window, never the page's", () => {
    const page = fakeWindow(true);
    const pageSpy = vi
      .spyOn(window, "matchMedia")
      .mockImplementation(page.matchMedia);
    const frame = fakeWindow(false);
    const { container } = render(
      <MediaWindowProvider value={frame.win}>
        <Probe query="(min-width: 640px)" />
      </MediaWindowProvider>,
    );
    expect(container.textContent).toBe("false");
    expect(frame.matchMedia).toHaveBeenCalledWith("(min-width: 640px)");
    expect(pageSpy).not.toHaveBeenCalled();

    // A frame resized across the breakpoint is heard through its own window.
    act(() => frame.flip(true));
    expect(container.textContent).toBe("true");
  });
});
