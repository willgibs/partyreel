import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const route = vi.hoisted(() => ({ pathname: "/" as string | null }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));

import { FooterFaqLink } from "./footer-faq-link";

/**
 * THE FOOTER'S FAQ LINK FOLLOWS THE READER'S PAGE (crumbs-34). It was the home's `/#faq` on every
 * route, so on /pricing it left the page's own questions for the home's. The routing table is
 * `marketing-nav.test.ts`'s; this holds that the link wears it, as a real `<a href>`.
 */
function hrefOn(pathname: string | null): string | null {
  route.pathname = pathname;
  const { unmount } = render(<FooterFaqLink>FAQ</FooterFaqLink>);
  const href = screen.getByRole("link", { name: "FAQ" }).getAttribute("href");
  unmount();
  return href;
}

describe("FooterFaqLink", () => {
  // An events page joined /pricing here (mkt-polish): its band carries the anchor now, so the
  // link that sent a wedding page's reader to the home's questions stays on the wedding page's.
  it("stays on the page's own FAQ where the page has one", () => {
    expect(hrefOn("/pricing")).toBe("#faq");
    expect(hrefOn("/events/weddings")).toBe("#faq");
  });

  it("goes to the home's FAQ from every other page", () => {
    expect(hrefOn("/")).toBe("/#faq");
    expect(hrefOn("/about")).toBe("/#faq");
  });

  it("takes the default where no router answers (a test, a not-found shell)", () => {
    expect(hrefOn(null)).toBe("/#faq");
  });

  it("wears the className it is handed, as the footer's other links do", () => {
    route.pathname = "/";
    render(<FooterFaqLink className="block py-1">FAQ</FooterFaqLink>);
    expect(screen.getByRole("link", { name: "FAQ" }).className).toContain(
      "block",
    );
  });
});
