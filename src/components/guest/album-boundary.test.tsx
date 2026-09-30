import { Component, Suspense, use, useState, type ReactNode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE ALBUM'S FAILURE IS THE ALBUM'S ALONE (crumbs-28, from `owner-album`). A seed that genuinely fails (a read error,
 * not a refusal) threw where the album renders and reached the guest route's error screen, taking the header, the
 * door and the upload with it. The album's own boundary keeps it to the album: the rest stands, the album says it
 * could not load, and Try again asks the page for a fresh seed (the router's refresh) and draws the album once it
 * lands. It reports what it caught, and never draws the error's message.
 *
 * `event-experience.album.test.tsx` pins the page wearing it; this pins the boundary itself.
 */
const captureError = vi.hoisted(() => vi.fn());
vi.mock("@/lib/observability/sentry", () => ({ captureError }));

const { AlbumBoundary } = await import("./album-boundary");

/** The album as the page streams it: a seed `use()`d behind its Suspense. */
function Album({ seed }: { seed: Promise<string> }) {
  return <p>album: {use(seed)}</p>;
}

function failed(message = "read failed: relation media timed out") {
  const seed = Promise.reject(
    Object.assign(new Error(message), { digest: "1234567" }),
  );
  seed.catch(() => {});
  return seed;
}

/**
 * The page as the router renders it: its seed is the render's, and the router's refresh renders it again, which hands
 * the album the seed that render streams (`next`), in the same transition the boundary's reset rides.
 */
function Page({
  first,
  next,
  refresh,
}: {
  first: Promise<string>;
  next: () => Promise<string>;
  refresh: () => void;
}) {
  const [seed, setSeed] = useState(first);
  const router = {
    refresh: () => {
      refresh();
      setSeed(next());
    },
  };
  return (
    <AppRouterContext.Provider value={router as never}>
      <h1>Maya&rsquo;s 30th</h1>
      <button type="button">Add photos</button>
      <AlbumBoundary>
        <Suspense fallback={<p>loading the album</p>}>
          <Album seed={seed} />
        </Suspense>
      </AlbumBoundary>
    </AppRouterContext.Provider>
  );
}

async function mount(
  seed: Promise<string>,
  next: () => Promise<string> = () => failed(),
) {
  const refresh = vi.fn();
  await act(async () => {
    render(<Page first={seed} next={next} refresh={refresh} />);
  });
  return { refresh };
}

beforeEach(() => {
  vi.clearAllMocks();
  // React logs the error it caught; that is not what is pinned.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("the album's boundary", () => {
  it("★ keeps a failed seed to the album: the page stands, and the album says it could not load", async () => {
    await mount(failed());
    expect(screen.getByRole("heading", { name: /Maya/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add photos" })).toBeEnabled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The album didn’t load",
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
  });

  it("never draws the error's own words", async () => {
    await mount(failed("relation media timed out at host db-7"));
    expect(document.body.textContent).not.toMatch(/relation|db-7/);
  });

  it("★ Try again asks the page for a fresh seed, and draws the album once it lands", async () => {
    const { refresh } = await mount(failed(), () =>
      Promise.resolve("24 photographs"),
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText("album: 24 photographs"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
    // The page stood throughout.
    expect(screen.getByRole("heading", { name: /Maya/ })).toBeInTheDocument();
  });

  it("a retry that fails again says so again, and can be tried again", async () => {
    const { refresh } = await mount(failed());
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The album didn’t load",
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
  });

  it("reports what it caught, with the digest a person can quote", async () => {
    await mount(failed());
    expect(captureError).toHaveBeenCalledWith(
      "render:guest",
      expect.any(Error),
      expect.objectContaining({ digest: "1234567", seam: "album" }),
    );
  });

  it("never takes Next's own navigation throws: a notFound() passes to its boundary", async () => {
    const notFound = Object.assign(new Error("NEXT_HTTP_ERROR_FALLBACK;404"), {
      digest: "NEXT_HTTP_ERROR_FALLBACK;404",
    });
    const seed = Promise.reject(notFound);
    seed.catch(() => {});
    let caughtAbove: unknown = null;
    class Above extends Component<{ children: ReactNode }, { gone: boolean }> {
      state = { gone: false };
      static getDerivedStateFromError() {
        return { gone: true };
      }
      componentDidCatch(error: unknown) {
        caughtAbove = error;
      }
      render() {
        return this.state.gone ? (
          <p>the page&rsquo;s own not-found</p>
        ) : (
          this.props.children
        );
      }
    }
    await act(async () => {
      render(
        <Above>
          <Page first={seed} next={() => seed} refresh={vi.fn()} />
        </Above>,
      );
    });
    expect(screen.getByText("the page’s own not-found")).toBeInTheDocument();
    expect(caughtAbove).toBe(notFound);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(captureError).not.toHaveBeenCalled();
  });

  it("a seed that lands draws the album with no word of failure", async () => {
    await mount(Promise.resolve("3 photographs"));
    expect(await screen.findByText("album: 3 photographs")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(captureError).not.toHaveBeenCalled();
  });
});
