import { Suspense, use, useState, type ComponentType } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * TRY AGAIN TRIES AGAIN (crumbs-30, from crumbs-28). Every crash screen's Try again called the boundary's `reset`,
 * which re-renders what the router already holds without asking the server again, so a crash a Server Component
 * threw came straight back and the button looked dead. Next 16.2 hands `error.js` an `unstable_retry`, the router's
 * refresh and the reset in one transition (its docs: use it over `reset` in most cases); every screen's Try again is
 * that now, the five groups', the root's (which shares the screen) and `global-error`'s (its own button). While the
 * page is asked for again the button says so and waits, the album card's own words (`album-boundary.tsx`), so a retry
 * that fails again is seen to have been tried.
 *
 * Pinned twice: each screen hands its press to `unstable_retry` and never to `reset`, and one screen inside Next's own
 * boundary, where a crash in one payload is drawn from the next once the page is asked for again.
 */
const captureError = vi.hoisted(() => vi.fn());
vi.mock("@/lib/observability/sentry", () => ({ captureError }));

type Crash = Error & { digest?: string };
type ScreenProps = {
  error: Crash;
  reset: () => void;
  unstable_retry: () => void;
};

const SCREENS: [string, () => Promise<{ default: ComponentType<never> }>][] = [
  ["the host app's", () => import("@/app/(app)/error")],
  ["sign-in's", () => import("@/app/(auth)/error")],
  ["the guest pages'", () => import("@/app/(guest)/error")],
  ["the marketing site's", () => import("@/app/(marketing)/error")],
  ["the portal's", () => import("@/app/admin/error")],
  ["the root's (a crash in a group's own layout)", () => import("@/app/error")],
];

function crash(): Crash {
  return Object.assign(new Error("relation media timed out"), {
    digest: "4242",
  });
}

/** Each screen as Next draws it: the error, the boundary's reset and its retry, whatever the screen's own props say. */
function drawn(Screen: ComponentType<never>, props: ScreenProps) {
  const Any = Screen as unknown as ComponentType<ScreenProps>;
  return <Any {...props} />;
}

beforeEach(() => {
  captureError.mockClear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe.each(SCREENS)("%s crash screen", (_, load) => {
  it("★ Try again asks for the page again (the router's refresh with the reset), never the bare reset", async () => {
    const { default: Screen } = await load();
    const reset = vi.fn();
    const retry = vi.fn();
    render(drawn(Screen, { error: crash(), reset, unstable_retry: retry }));
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(reset).not.toHaveBeenCalled();
  });
});

describe("inside Next's own boundary", () => {
  /** The page as the router holds it: this payload, whose Server Component threw, until the router asks again. */
  function Page({ payload }: { payload: Promise<string> }) {
    return <p>{use(payload)}</p>;
  }

  function failed(): Promise<string> {
    const payload = Promise.reject(crash());
    payload.catch(() => {});
    return payload;
  }

  /**
   * The router as it renders: a refresh hands the page the next payload in the same transition as the reset, and
   * while that payload is on its way the render waits above the boundary (the app's own Suspense, long revealed), so
   * the screen stands until the answer lands, as the router's pending state keeps it in the app.
   */
  async function mount(Screen: ComponentType<never>, next: Promise<string>) {
    const refresh = vi.fn();
    // Made once, outside the render: a first mount that suspends is thrown away and mounts again.
    const first = failed();
    function Router() {
      const [payload, setPayload] = useState(first);
      const router = {
        refresh: () => {
          refresh();
          setPayload(next);
        },
      };
      return (
        <AppRouterContext.Provider value={router as never}>
          <ErrorBoundary errorComponent={Screen as never}>
            <Page payload={payload} />
          </ErrorBoundary>
        </AppRouterContext.Provider>
      );
    }
    await act(async () => {
      render(
        <Suspense fallback={<p>loading</p>}>
          <Router />
        </Suspense>,
      );
    });
    return { refresh };
  }

  it("★ a crash a Server Component threw is drawn from the next payload once Try again asks for the page", async () => {
    const { default: AppError } = await import("@/app/(app)/error");
    let land: (page: string) => void = () => {};
    const next = new Promise<string>((resolve) => {
      land = resolve;
    });
    const { refresh } = await mount(AppError, next);
    expect(
      screen.getByRole("heading", { name: "Something went wrong" }),
    ).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    });
    expect(refresh).toHaveBeenCalledTimes(1);
    // The router is asking: the screen stands, and its button says it is trying and waits.
    const trying = screen.getByRole("button", { name: "Trying again…" });
    expect(trying).toBeDisabled();

    await act(async () => {
      land("the page, drawn again");
    });
    expect(
      await screen.findByText("the page, drawn again"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Something went wrong" }),
    ).toBeNull();
  });

  it("a retry that crashes again says so again, and can be tried again", async () => {
    const { default: AppError } = await import("@/app/(app)/error");
    const { refresh } = await mount(AppError, failed());
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("heading", { name: "Something went wrong" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
  });
});
