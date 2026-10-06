import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps, ReactNode, Ref } from "react";
import { describe, expect, it, vi } from "vitest";

/**
 * THE DEMO'S WELCOME, ITS "START YOUR OWN" (guest-requests): the welcome door is the demo's first screen, so its link to
 * the marketing home is in view from the first paint, where a plain `next/link` prefetched the home on sight (six
 * requests and three unused sheets a load: `event-experience.demo-links.test.ts` has the measure). It prefetches on
 * intent, through the button that draws it: `prefetch={false}` until a pointer arrives or focus lands, `next/link`'s own
 * default after. `next/link` is stood in for by an anchor that says what it was asked (`data-prefetch`), as
 * `chrome-link.test.tsx` does, since `next/link` runs no prefetch in jsdom.
 */
vi.mock("next/link", () => ({
  useLinkStatus: () => ({ pending: false }),
  default: ({
    prefetch,
    href,
    children,
    ref,
    ...rest
  }: Omit<ComponentProps<"a">, "href"> & {
    prefetch?: boolean | null;
    href: string;
    children?: ReactNode;
    ref?: Ref<HTMLAnchorElement>;
  }) => (
    <a ref={ref} href={href} data-prefetch={String(prefetch)} {...rest}>
      {children}
    </a>
  ),
}));

const { RoleWords } = await import("./welcome");

const startYourOwn = () => screen.getByRole("link", { name: "Start your own" });

describe("the demo's welcome", () => {
  it("★ its Start your own leads to the home and prefetches nothing on sight", () => {
    render(<RoleWords eventName="Maya & Jay" hostName="Maya" />);
    expect(startYourOwn().getAttribute("href")).toBe("/");
    expect(startYourOwn().getAttribute("data-prefetch")).toBe("false");
  });

  it("★ fetches the home the moment a pointer arrives (a finger's touch-down is one)", () => {
    render(<RoleWords eventName="Maya & Jay" />);
    fireEvent.pointerEnter(startYourOwn());
    expect(startYourOwn().getAttribute("data-prefetch")).toBe("undefined");
  });

  it("and when focus lands, for the keyboard", () => {
    render(<RoleWords eventName="Maya & Jay" />);
    fireEvent.focus(startYourOwn());
    expect(startYourOwn().getAttribute("data-prefetch")).toBe("undefined");
  });
});
