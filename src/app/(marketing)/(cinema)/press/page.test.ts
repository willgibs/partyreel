import { describe, expect, it, vi } from "vitest";

import { ABOUT_PRESS_HREF } from "@/lib/constants/about";

// `redirect` throws a NEXT_REDIRECT in Next; the double records the address and throws the same way, so
// the page's own `never` return type is honoured.
const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn((to: string): never => {
    throw new Error(`NEXT_REDIRECT ${to}`);
  }),
}));
vi.mock("next/navigation", () => ({ redirect }));

import PressPage from "./page";

/**
 * /press IS A DOOR (about-press r1): it answers with a redirect to the press kit band on /about and
 * draws nothing. `redirect()` is what answers 307 (never `permanentRedirect`, a 308 the CDN and every
 * phone would keep), and the destination is the one address every Press door reads.
 */
describe("the /press route", () => {
  it("redirects to the press kit band, and nowhere else", () => {
    expect(() => PressPage()).toThrow(`NEXT_REDIRECT ${ABOUT_PRESS_HREF}`);
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/about#press");
  });
});
