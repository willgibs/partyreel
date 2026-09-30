/**
 * THE HOUSE'S ONE HYDRATED FLAG. What it promises is what the eight hand-written copies each promised and
 * none pinned: the server and the HYDRATING render answer false (so the first paint is the HTML the server
 * wrote and React reports no mismatch), and the render after it answers true, once.
 */
import { act, render } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { useHydrated } from "./use-hydrated";

/** Every value the hook answered, in render order, and what it drew. */
function probe() {
  const seen: boolean[] = [];
  function Probe() {
    const hydrated = useHydrated();
    seen.push(hydrated);
    return <p>{hydrated ? "hydrated" : "server"}</p>;
  }
  return { seen, Probe };
}

describe("useHydrated", () => {
  it("answers false to the server", () => {
    const { seen, Probe } = probe();
    expect(renderToString(<Probe />)).toContain("server");
    expect(seen).toEqual([false]);
  });

  it("answers false while hydrating and true after, with nothing for React to report", async () => {
    const server = probe();
    const html = renderToString(<server.Probe />);
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);

    const browser = probe();
    const errors: unknown[] = [];
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, <browser.Probe />, {
        onRecoverableError: (error) => errors.push(error),
      });
    });

    // The hydrating render drew what the HTML says; the next one is the client's answer.
    expect(browser.seen[0]).toBe(false);
    expect(browser.seen.at(-1)).toBe(true);
    expect(container.textContent).toBe("hydrated");
    expect(errors).toEqual([]);

    await act(async () => root.unmount());
    container.remove();
  });

  it("answers true to a render that never hydrated", () => {
    const { seen, Probe } = probe();
    const { container } = render(<Probe />);
    expect(seen).toEqual([true]);
    expect(container.textContent).toBe("hydrated");
  });
});
