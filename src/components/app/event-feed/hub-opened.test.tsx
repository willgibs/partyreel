import { readFileSync } from "node:fs";
import { join } from "node:path";

import { StrictMode } from "react";
import { act, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HubOpened } from "./hub-opened";

/**
 * THE HUB COUNTS AS AN OPEN (crumbs-69). Recent and Last opened read `events.host_opened_at`, which only a press from
 * her dashboard stamped, so a deep link, the bell or an email never reached either. The hub stamps itself, through the
 * same action `HomeShell` calls, and the cost is the point: ONE Server Function call a hub visit, never a poll. Each of
 * these fails silently in production: a missing mount moves nothing, a doubled call doubles the hub's cost on every
 * visit, and a poll turns a left-open tab into a steady stream of Server Function calls.
 */
const noteEventOpenedAction = vi.hoisted(() =>
  vi.fn(async (_eventId: unknown) => {}),
);
vi.mock("@/app/(app)/dashboard/actions", () => ({ noteEventOpenedAction }));

const EVENT = "6f1c2c9e-5a3b-4d11-9a0a-1d2f3a4b5c6d";
const OTHER = "0b7e9a54-8f2d-4c63-b1e0-5a9d3c7f2e18";

beforeEach(() => {
  noteEventOpenedAction.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("HubOpened", () => {
  it("★ stamps the hub's event once, on mount, and renders nothing", async () => {
    const { container } = render(<HubOpened eventId={EVENT} />);
    await waitFor(() =>
      expect(noteEventOpenedAction).toHaveBeenCalledWith(EVENT),
    );
    expect(noteEventOpenedAction).toHaveBeenCalledTimes(1);
    expect(container).toBeEmptyDOMElement();
  });

  it("asks once under Strict Mode's doubled effects too", async () => {
    render(
      <StrictMode>
        <HubOpened eventId={EVENT} />
      </StrictMode>,
    );
    await waitFor(() => expect(noteEventOpenedAction).toHaveBeenCalled());
    expect(noteEventOpenedAction).toHaveBeenCalledTimes(1);
  });

  it("★ is one call a visit and never a poll: a hub left open and re-rendered asks nothing more", async () => {
    vi.useFakeTimers();
    const { rerender } = render(<HubOpened eventId={EVENT} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(noteEventOpenedAction).toHaveBeenCalledTimes(1);

    // The page re-renders on every revalidation while it stands (a host's act in a room), and the tab comes back to the
    // front after an evening: neither is a new visit.
    rerender(<HubOpened eventId={EVENT} />);
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("online"));
      await vi.advanceTimersByTimeAsync(3 * 60 * 60_000);
    });
    expect(noteEventOpenedAction).toHaveBeenCalledTimes(1);
  });

  it("opens the next event when it is handed another, never the same one twice", async () => {
    const { rerender } = render(<HubOpened eventId={EVENT} />);
    await waitFor(() => expect(noteEventOpenedAction).toHaveBeenCalledTimes(1));
    rerender(<HubOpened eventId={OTHER} />);
    await waitFor(() => expect(noteEventOpenedAction).toHaveBeenCalledTimes(2));
    rerender(<HubOpened eventId={OTHER} />);
    expect(noteEventOpenedAction.mock.calls).toEqual([[EVENT], [OTHER]]);
  });

  it("a fresh mount is a new visit: Back into the hub stamps it again", async () => {
    const first = render(<HubOpened eventId={EVENT} />);
    await waitFor(() => expect(noteEventOpenedAction).toHaveBeenCalledTimes(1));
    first.unmount();
    render(<HubOpened eventId={EVENT} />);
    await waitFor(() => expect(noteEventOpenedAction).toHaveBeenCalledTimes(2));
  });

  it("a failed stamp stays quiet: the next visit stamps again, and nothing reaches the page", async () => {
    noteEventOpenedAction.mockRejectedValueOnce(new Error("offline"));
    const { container } = render(<HubOpened eventId={EVENT} />);
    await waitFor(() => expect(noteEventOpenedAction).toHaveBeenCalledTimes(1));
    // Let the rejection settle: an unhandled one fails the run.
    await act(async () => {});
    expect(container).toBeEmptyDOMElement();
  });
});

/**
 * WHAT ONLY THE HUB'S PAGE CAN SAY: it is a server component over a session and a dozen reads, so the wiring is read off
 * its source (as `hub-wiring.test.ts` reads the rest). A hub that never mounts the stamp counts nothing.
 */
describe("the hub's page", () => {
  const PAGE = readFileSync(
    join(process.cwd(), "src/app/(app)/dashboard/[eventId]/page.tsx"),
    "utf8",
  );

  it("★ mounts the stamp for the event it found, and only once it has found one", () => {
    expect(PAGE).toMatch(
      /import \{ HubOpened \} from "@\/components\/app\/event-feed\/hub-opened";/,
    );
    const mounts = PAGE.match(/<HubOpened eventId=\{event\.id\} \/>/g);
    expect(mounts, "one mount, handed the event's id").toHaveLength(1);
    // A gone or foreign event draws the not-found and is never stamped (the action would find no row, a wasted call).
    expect(PAGE.indexOf("<HubOpened")).toBeGreaterThan(
      PAGE.indexOf("if (!event) return <AppNotFoundScreen />;"),
    );
  });
});
