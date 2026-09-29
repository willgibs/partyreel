import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * THE PHONE MENU DESCRIBES NOTHING, AND SAYS SO (build 19's red-team, 2026-09-29): its panel pointed
 * `aria-describedby` at a Description that never rendered, and Radix warned "Missing `Description`"
 * on every open. A menu's rows are its whole content, so the panel opts out the way Radix documents
 * (`aria-describedby={undefined}`): no reference to a missing element, and no warning.
 */

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

const { MarketingNavMobile } = await import("./mobile-menu");

afterEach(() => {
  vi.restoreAllMocks();
});

describe("the marketing phone menu", () => {
  it("★ opens with a name, no dangling description, and no Radix warning", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<MarketingNavMobile />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));

    const panel = await screen.findByRole("dialog", { name: "Menu" });
    expect(panel).not.toHaveAttribute("aria-describedby");
    const said = [...warn.mock.calls, ...error.mock.calls]
      .flat()
      .map(String)
      .join("\n");
    expect(said).not.toMatch(/Missing `Description`/);
    expect(said).not.toMatch(/DialogTitle/);
  });
});
