import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WelcomeToPro } from "./welcome-to-pro";

/**
 * THE RECEIPT NEVER CLAIMS A PLAN THE SERVER HAS NOT SEEN.
 *
 * `back=finish` and his note ("a modal could be a more delightful confirmation
 * than the box up top. They should be excited to join Pro"). What is pinned is
 * the correctness the retired `upgraded-toast.tsx` had bought, which is easy to
 * lose while making something delightful:
 *
 *  1. THE WEBHOOK RACE. The Stripe webhook is the SOLE writer of
 *     `profiles.tier` (billing-caps.md) and Stripe redirects the INSTANT
 *     payment succeeds, so the modal must be able to say "we have your money"
 *     without saying "you are on Pro". One congratulation for both states is
 *     the regression.
 *  2. IT HEALS RATHER THAN LYING QUIETLY: a pending receipt re-reads the
 *     server, and a settled one never does (an unbounded refresh against a
 *     webhook that never lands is the worse failure).
 *  3. ONCE PER ARRIVAL: closing strips the marker, so a reload cannot
 *     re-congratulate, and the strip happens on CLOSE rather than on mount
 *     (the page is a server component; replacing the URL on mount would unmount
 *     the modal mid-celebration).
 */

const replace = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh, push: vi.fn() }),
}));

afterEach(() => {
  replace.mockClear();
  refresh.mockClear();
  vi.useRealTimers();
});

function modal(props: Partial<React.ComponentProps<typeof WelcomeToPro>> = {}) {
  render(
    <WelcomeToPro
      applied
      planName="Pro"
      capBytes={100 * 1024 ** 3}
      nextUrl="/dashboard"
      door={{ label: "Go to your dashboard" }}
      {...props}
    />,
  );
  return screen.getByRole("dialog");
}

describe("it says only what the server can see", () => {
  it("celebrates the plan once the tier has actually moved", () => {
    const dialog = modal({ applied: true, planName: "Pro" });
    expect(dialog.getAttribute("data-welcome-to-pro")).toBe("applied");
    expect(dialog.textContent).toContain("Pro");
    // The receipt's facts are there, not just a cheer.
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);
  });

  it("claims the PAYMENT and never the plan while the webhook is in flight", () => {
    const dialog = modal({ applied: false });
    expect(dialog.getAttribute("data-welcome-to-pro")).toBe("pending");
    // Nothing may read as "you are on Pro" yet, and the entitlement list, which
    // describes what is already on, must not render.
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});

describe("a pending receipt heals itself, and a settled one rests", () => {
  it("re-reads the server while the tier has not landed", () => {
    vi.useFakeTimers();
    modal({ applied: false });
    expect(refresh).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2100);
    expect(refresh).toHaveBeenCalled();
  });

  it("never re-reads once the tier is applied", () => {
    vi.useFakeTimers();
    modal({ applied: true });
    vi.advanceTimersByTime(20000);
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("once per arrival", () => {
  it("strips the marker on CLOSE, not on mount", async () => {
    modal({ nextUrl: "/dashboard" });
    expect(replace).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole("button", { name: /go to your dashboard/i }),
    );
    expect(replace).toHaveBeenCalledWith("/dashboard", { scroll: false });
  });

  it("gives a door that really leaves an href instead of a close", () => {
    modal({ door: { label: "Go to your dashboard", href: "/dashboard" } });
    expect(
      screen.getByRole("link", { name: /go to your dashboard/i }),
    ).toHaveAttribute("href", "/dashboard");
  });
});
