import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * THE PHONE MENU DESCRIBES NOTHING, AND SAYS SO (build 19's red-team, 2026-09-29): its panel pointed
 * `aria-describedby` at a Description that never rendered, and Radix warned "Missing `Description`"
 * on every open. A menu's rows are its whole content, so the panel opts out the way Radix documents
 * (`aria-describedby={undefined}`): no reference to a missing element, and no warning.
 *
 * AND ITS FOOT COUNTS ITS PRESSES (mkt-polish): the bar's cluster carried `trackAttrs` while the
 * menu's foot, which is the phone's whole cluster (the bar shows Start free alone there), carried none.
 */

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

const { MarketingNavMobile } = await import("./mobile-menu");

afterEach(() => {
  vi.restoreAllMocks();
});

async function openMenu() {
  const user = userEvent.setup();
  render(<MarketingNavMobile />);
  await user.click(screen.getByRole("button", { name: "Open menu" }));
  return screen.findByRole("dialog", { name: "Menu" });
}

function expectCounted(link: HTMLElement, cta: string) {
  expect(link, cta).toHaveAttribute("data-track", "cta_click");
  expect(link, cta).toHaveAttribute("data-track-cta", cta);
  expect(link, cta).toHaveAttribute("data-track-location", "phone-menu");
}

describe("the marketing phone menu", () => {
  it("★ opens with a name, no dangling description, and no Radix warning", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const panel = await openMenu();
    expect(panel).not.toHaveAttribute("aria-describedby");
    const said = [...warn.mock.calls, ...error.mock.calls]
      .flat()
      .map(String)
      .join("\n");
    expect(said).not.toMatch(/Missing `Description`/);
    expect(said).not.toMatch(/DialogTitle/);
  });

  it("counts its foot's presses as the bar's are counted, under its own location", async () => {
    const panel = await openMenu();
    expectCounted(
      within(panel).getByRole("link", { name: "Log in" }),
      "log-in",
    );
    expectCounted(
      within(panel).getByRole("link", { name: "Start free" }),
      "start-free",
    );
  });

  it("counts a returning host's Dashboard the same way", async () => {
    // The presence hint reads the auth cookie's shape (`session-hint.tsx`).
    document.cookie = "sb-test-auth-token=x; path=/";
    try {
      const panel = await openMenu();
      expectCounted(
        within(panel).getByRole("link", { name: "Dashboard" }),
        "dashboard",
      );
    } finally {
      document.cookie =
        "sb-test-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  });
});
