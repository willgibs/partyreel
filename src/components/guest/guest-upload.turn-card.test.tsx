import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps, ReactNode, Ref } from "react";
import { describe, expect, it, vi } from "vitest";

/**
 * THE DEMO'S TURN CARD, ITS "START YOUR OWN" (guest-requests): the card stands over the visitor's own photograph the
 * moment it lands, in view, so a plain `next/link` would prefetch the marketing home on sight (its route tree, head and
 * segments, and the home's sheets the album never draws). It prefetches on intent, through the button that draws it:
 * `prefetch={false}` until a pointer arrives or focus lands. `next/link` is stood in for by an anchor that says what it
 * was asked (`data-prefetch`), as `chrome-link.test.tsx` does.
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
// The post-upload slot's own reads (the viewer's account) are its own file's to pin, and never reached by this card.
vi.mock("@/components/guest/claim-handle-prompt", () => ({
  ClaimHandlePrompt: () => null,
}));

const { TurnCard } = await import("./guest-upload");

const startYourOwn = () => screen.getByRole("link", { name: "Start your own" });

describe("the demo's turn card", () => {
  it("★ its Start your own leads to the home and prefetches nothing on sight", () => {
    render(<TurnCard />);
    expect(startYourOwn().getAttribute("href")).toBe("/");
    expect(startYourOwn().getAttribute("data-prefetch")).toBe("false");
  });

  it("★ fetches the home the moment a pointer arrives", () => {
    render(<TurnCard />);
    fireEvent.pointerEnter(startYourOwn());
    expect(startYourOwn().getAttribute("data-prefetch")).toBe("undefined");
  });
});
