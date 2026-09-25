/**
 * THE FIRST PAINT HYDRATES WITH THE PLAN THE SERVER DREW (album-window-plan.ts, `decodeFirstPaint`).
 * The rows engine prices a row with logs and powers, which the server's engine and a browser's round
 * differently in the last bit, so a first paint laid again in the hydration broke a row where the
 * server had not on about one load in ten of the scale probe: a React hydration error, and the album
 * thrown away and drawn again. Here the "server" and the "browser" lay different plans for the same
 * list on purpose (the stand-in for those last bits), and the hydration has to draw the server's.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

import type { GridMedia } from "@/components/app/media-grid";
import { MasonryColumns } from "@/components/shared/masonry";

const engine = vi.hoisted(() => ({ side: "server" as "server" | "browser" }));

vi.mock("@/components/shared/media-lightbox.lazy", () => ({
  MediaLightboxLazy: () => null,
  preloadMediaLightbox: () => {},
}));

// The browser's engine, a last bit apart from the server's: its first break in every class lands one
// photograph later, which is exactly the shape of the mismatch the scale probe hit.
vi.mock("@/components/shared/album-window-plan", async (importOriginal) => {
  const real =
    await importOriginal<
      typeof import("@/components/shared/album-window-plan")
    >();
  return {
    ...real,
    firstPaintPlan: (...args: Parameters<typeof real.firstPaintPlan>) => {
      const plan = real.firstPaintPlan(...args);
      if (engine.side === "server") return plan;
      const [list] = args;
      const ids = list.slice(0, plan.count).map((it) => it.id);
      const first = ids.findIndex((id) => plan.breaksAfter.has(id));
      const breaksAfter = new Map(plan.breaksAfter);
      const classes = breaksAfter.get(ids[first])!;
      breaksAfter.delete(ids[first]);
      breaksAfter.set(ids[first + 1], [
        ...(breaksAfter.get(ids[first + 1]) ?? []),
        ...classes,
      ]);
      return { ...plan, breaksAfter };
    },
  };
});

const album: GridMedia[] = Array.from({ length: 120 }, (_, i) => ({
  id: `p${i}`,
  type: "photo",
  url: `/p${i}.jpg`,
  width: 640,
  height: 480,
}));

const Album = () => (
  <MasonryColumns
    items={album}
    layout="rows"
    rowStep={1}
    rowRhythm="double"
    rhythmSeed={7}
    photoAddress={false}
  />
);

/** The server's render, then the browser's hydration of it; the recoverable errors it reported. */
async function serveThenHydrate(edit: (html: string) => string = (h) => h) {
  engine.side = "server";
  const html = edit(renderToString(<Album />));
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.append(container);
  engine.side = "browser";
  const errors: unknown[] = [];
  let root!: ReturnType<typeof hydrateRoot>;
  await act(async () => {
    root = hydrateRoot(container, <Album />, {
      onRecoverableError: (error) => errors.push(error),
    });
  });
  return { errors, html, unmount: () => act(() => root.unmount()) };
}

afterEach(() => {
  document.body.innerHTML = "";
  engine.side = "server";
});

describe("the first paint hydrates with the server's own plan", () => {
  it("writes its plan on the grid it draws", () => {
    const html = renderToString(<Album />);
    expect(html).toMatch(/data-rows-plan-id="[^"]+"/);
    expect(html).toMatch(/data-rows-plan="\{/);
  });

  it("draws the server's breaks where the browser's engine would lay its own: no hydration error", async () => {
    const { errors, unmount } = await serveThenHydrate();
    expect(errors).toEqual([]);
    await unmount();
  });

  it("without the server's plan the two engines' first paints disagree (the scar this pins)", async () => {
    // Hydration mismatches are reported as recoverable errors and logged; this one is expected.
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    const { errors, unmount } = await serveThenHydrate((html) =>
      html.replace(/ data-rows-plan="[^"]*"/, ""),
    );
    expect(errors.length).toBeGreaterThan(0);
    expect(String(errors[0])).toMatch(/[Hh]ydrat/);
    await unmount();
    quiet.mockRestore();
  });
});
