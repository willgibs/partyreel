import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps, ReactNode, Ref } from "react";
import { describe, expect, it, vi } from "vitest";

/**
 * THE WORDMARK'S DOOR TO `/` PREFETCHES ON INTENT, NEVER ON SIGHT (crumbs-50).
 *
 * The logo is in view from the first paint, so its viewport prefetch fetched the home's payload into every
 * other marketing page, and React preloaded the home's three sheets (the hero's, the river's, the
 * backdrop's) from it and drew none: three "preloaded but not used" warnings a load on /pricing, /about and
 * /help (measured on `next start`, which jsdom cannot reach). What is held here is the prop the whole fix
 * rests on, since `next/link` runs no prefetch in jsdom: `prefetch={false}` (never, on sight or on hover)
 * until a pointer arrives or focus lands, `next/link`'s own default after, and nothing else about the chrome
 * changes: every other link is exactly what it was, and the 404's quiet page still fetches on the press.
 *
 * `next/link` is stood in for by an anchor that says what it was asked (`data-prefetch`).
 */
const status = vi.hoisted(() => ({ pending: false }));

vi.mock("next/link", () => ({
  useLinkStatus: () => ({ pending: status.pending }),
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

const { ChromeLink, HomeLink, QuietChromePrefetch } =
  await import("./chrome-link");

const prefetchOf = (name: string) =>
  screen.getByRole("link", { name }).getAttribute("data-prefetch");

describe("a chrome link", () => {
  it("prefetches as next/link always did, with no prop of its own", () => {
    render(<ChromeLink href="/pricing">Pricing</ChromeLink>);
    expect(prefetchOf("Pricing")).toBe("undefined");
  });

  it("★ that asks for intent prefetches nothing on sight", () => {
    render(
      <ChromeLink href="/" prefetchOnIntent>
        Home
      </ChromeLink>,
    );
    expect(prefetchOf("Home")).toBe("false");
  });

  it("★ takes next/link's default the moment a pointer arrives", () => {
    render(
      <ChromeLink href="/" prefetchOnIntent>
        Home
      </ChromeLink>,
    );
    fireEvent.pointerEnter(screen.getByRole("link", { name: "Home" }));
    expect(prefetchOf("Home")).toBe("undefined");
  });

  it("★ takes it when focus lands, for the keyboard", () => {
    render(
      <ChromeLink href="/" prefetchOnIntent>
        Home
      </ChromeLink>,
    );
    fireEvent.focus(screen.getByRole("link", { name: "Home" }));
    expect(prefetchOf("Home")).toBe("undefined");
  });

  it("keeps a prefetch the caller asked for, once there is intent", () => {
    render(
      <ChromeLink href="/" prefetchOnIntent prefetch>
        Home
      </ChromeLink>,
    );
    expect(prefetchOf("Home")).toBe("false");
    fireEvent.pointerEnter(screen.getByRole("link", { name: "Home" }));
    expect(prefetchOf("Home")).toBe("true");
  });

  it("still hears the caller's own handlers", () => {
    const enter = vi.fn();
    const focus = vi.fn();
    render(
      <ChromeLink
        href="/"
        prefetchOnIntent
        onPointerEnter={enter}
        onFocus={focus}
      >
        Home
      </ChromeLink>,
    );
    const link = screen.getByRole("link", { name: "Home" });
    fireEvent.pointerEnter(link);
    fireEvent.focus(link);
    expect(enter).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalledTimes(1);
  });

  it("on the quiet page fetches on the press alone, intent or not", () => {
    render(
      <QuietChromePrefetch>
        <ChromeLink href="/" prefetchOnIntent>
          Home
        </ChromeLink>
        <ChromeLink href="/pricing">Pricing</ChromeLink>
      </QuietChromePrefetch>,
    );
    fireEvent.pointerEnter(screen.getByRole("link", { name: "Home" }));
    fireEvent.focus(screen.getByRole("link", { name: "Home" }));
    expect(prefetchOf("Home")).toBe("false");
    expect(prefetchOf("Pricing")).toBe("false");
  });
});

describe("the wordmark's door to the home", () => {
  it("★ is the home, named for what it is, and fetches nothing on sight", () => {
    status.pending = false;
    render(<HomeLink>Logo</HomeLink>);
    const link = screen.getByRole("link", { name: "Partyreel home" });
    expect(link.getAttribute("href")).toBe("/");
    expect(link.getAttribute("data-prefetch")).toBe("false");
    fireEvent.pointerEnter(link);
    expect(link.getAttribute("data-prefetch")).toBe("undefined");
  });

  it("★ answers a press that has not landed, and says nothing once it has", () => {
    // `useLinkStatus` is true between the press and the history update: with the home no longer fetched on
    // sight, that wait is the one place the chrome's navigation is not instant, so the link says so.
    status.pending = true;
    const { container, rerender } = render(<HomeLink>Logo</HomeLink>);
    expect(container.querySelector("[data-link-pending]")).not.toBeNull();
    status.pending = false;
    rerender(<HomeLink>Logo</HomeLink>);
    expect(container.querySelector("[data-link-pending]")).toBeNull();
  });

  it("still takes the caller's own class and handlers", () => {
    status.pending = false;
    const enter = vi.fn();
    render(
      <HomeLink className="shrink-0" onPointerEnter={enter}>
        Logo
      </HomeLink>,
    );
    const link = screen.getByRole("link", { name: "Partyreel home" });
    expect(link.className).toContain("shrink-0");
    fireEvent.pointerEnter(link);
    expect(enter).toHaveBeenCalledTimes(1);
  });
});
