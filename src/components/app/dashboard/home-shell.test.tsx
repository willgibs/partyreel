import Link from "next/link";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HomeShell } from "./home-shell";

/**
 * THE PAGE'S ROOT HEARS WHICH EVENT SHE OPENED (host-dashboard r3): one listener, every link into an event, a stamp
 * that never waits for nor breaks the press. Pinned as function: what stamps, what does not, how often.
 */

const noteEventOpenedAction = vi.hoisted(() =>
  vi.fn(async (_id: string) => {}),
);
vi.mock("@/app/(app)/dashboard/actions", () => ({ noteEventOpenedAction }));

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const C = "33333333-3333-4333-8333-333333333333";
const D = "44444444-4444-4444-8444-444444444444";

beforeEach(() => {
  noteEventOpenedAction.mockReset();
  noteEventOpenedAction.mockResolvedValue(undefined);
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-04T10:00:00.000Z"));
});

afterEach(() => vi.useRealTimers());

function draw() {
  return render(
    <HomeShell>
      <Link href={`/dashboard/${A}`}>
        <span>Quiet party</span>
      </Link>
      <Link href={`/dashboard/${B}/print`}>Print</Link>
      <Link href="/dashboard/new">New event</Link>
      <Link href="/e/qr-friend">Friend&apos;s wedding</Link>
      <button type="button">Not a link</button>
    </HomeShell>,
  );
}

describe("a press into an event", () => {
  it("stamps the event a link goes into, the press landing on the link or on anything inside it", () => {
    draw();
    fireEvent.click(screen.getByText("Quiet party"));
    expect(noteEventOpenedAction).toHaveBeenCalledTimes(1);
    expect(noteEventOpenedAction).toHaveBeenCalledWith(A);
  });

  it("stamps a room of an event too: an act is a way into it", () => {
    draw();
    fireEvent.click(screen.getByRole("link", { name: "Print" }));
    expect(noteEventOpenedAction).toHaveBeenCalledWith(B);
  });

  it("stamps nothing for create, a guest album or a press that is no link", () => {
    draw();
    fireEvent.click(screen.getByRole("link", { name: "New event" }));
    fireEvent.click(screen.getByRole("link", { name: /friend's wedding/i }));
    fireEvent.click(screen.getByRole("button", { name: "Not a link" }));
    expect(noteEventOpenedAction).not.toHaveBeenCalled();
  });

  it("counts a press, a press back and a press again as one open, and a later one as the next", () => {
    render(
      <HomeShell>
        <Link href={`/dashboard/${C}`}>Again</Link>
      </HomeShell>,
    );
    const link = screen.getByRole("link", { name: "Again" });
    fireEvent.click(link);
    vi.advanceTimersByTime(2_000);
    fireEvent.click(link);
    expect(noteEventOpenedAction).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(4_000);
    fireEvent.click(link);
    expect(noteEventOpenedAction).toHaveBeenCalledTimes(2);
  });

  it("never lets a failed stamp break the press that caused it", async () => {
    noteEventOpenedAction.mockRejectedValue(new Error("offline"));
    render(
      <HomeShell>
        <Link href={`/dashboard/${D}`}>Failing</Link>
      </HomeShell>,
    );
    expect(() =>
      fireEvent.click(screen.getByRole("link", { name: "Failing" })),
    ).not.toThrow();
    await Promise.resolve();
    expect(noteEventOpenedAction).toHaveBeenCalledWith(D);
  });
});

describe("the root", () => {
  it("is the wide page, drawn once", () => {
    const { container } = draw();
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("data-app-wide");
    expect(root).toHaveAttribute("data-home");
  });
});
