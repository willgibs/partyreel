/**
 * THE HOST'S LOOK FROM A PHOTOGRAPH'S CREDIT (event-safety `entry=all`): on a host's surface (the
 * provider), a guest's named photograph opens its sender's look, with Block naming the PHOTOGRAPH
 * (the database decides who sent it); everywhere else the credit is what it was. The look itself is
 * stubbed here (its own contract is guest-peek.test.tsx's): what is pinned is who gets one.
 */
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  FaceCredit,
  type ViewerMedia,
} from "@/components/shared/media-lightbox-parts/credit";
import { TooltipProvider } from "@/components/ui/tooltip";

const { looks } = vi.hoisted(() => ({
  looks: [] as {
    target: unknown;
    email: unknown;
    name: unknown;
    canFollow: unknown;
  }[],
}));
vi.mock("@/components/social/guest-peek", () => ({
  GuestPeek: ({
    item,
    email,
    canFollow,
    block,
    children,
  }: {
    item: { displayName: string | null };
    email?: string | null;
    canFollow: boolean;
    block?: { target: unknown };
    children: ReactNode;
  }) => {
    looks.push({
      target: block?.target,
      email,
      name: item.displayName,
      canFollow,
    });
    return <div data-testid="look">{children}</div>;
  },
}));

const { HostCreditLookProvider } = await import("./credit-look");

const photo = (over: Partial<ViewerMedia> = {}): ViewerMedia =>
  ({
    id: "m-1",
    uploaderName: "Sam",
    isVerified: true,
    isHost: false,
    uploaderEmail: "sam@example.com",
    uploaderFace: { href: "/u/sam", avatarUrl: null, seed: "s" },
    ...over,
  }) as ViewerMedia;

function credit(
  item: ViewerMedia,
  { host = true, own = false, provided = true } = {},
) {
  looks.length = 0;
  const node = <FaceCredit item={item} viewerIsHost={host} isOwn={own} />;
  // The app's shell provides tooltips (a page link wears one); the credit's surfaces all sit in it.
  return render(
    <TooltipProvider>
      {provided ? (
        <HostCreditLookProvider>{node}</HostCreditLookProvider>
      ) : (
        node
      )}
    </TooltipProvider>,
  );
}

describe("the credit's look", () => {
  it("★ on a host's surface a guest's name opens the look, and Block names the photograph", () => {
    credit(photo());
    const trigger = screen.getByRole("button", { name: "Sam" });
    expect(screen.getByTestId("look")).toContainElement(trigger);
    expect(looks).toEqual([
      {
        target: { kind: "media", mediaId: "m-1" },
        email: "sam@example.com",
        name: "Sam",
        canFollow: false,
      },
    ]);
    // The name is the look's door now, not a link to the page.
    expect(screen.queryByRole("link", { name: "Sam" })).toBeNull();
  });

  it("a typed name opens the look too (a names-only guest is a person the host may block)", () => {
    credit(
      photo({ isVerified: false, uploaderEmail: null, uploaderFace: null }),
    );
    expect(screen.getByRole("button", { name: "Sam" })).toBeInTheDocument();
    expect(looks[0]?.target).toEqual({ kind: "media", mediaId: "m-1" });
  });

  it("★ the guest album (no provider) keeps the plain credit: its page link, and no look", () => {
    credit(photo(), { provided: false, host: false });
    expect(screen.getByRole("link", { name: "Sam" })).toHaveAttribute(
      "href",
      "/u/sam",
    );
    expect(screen.queryByTestId("look")).toBeNull();
  });

  it("no look for a viewer who is not the host, for the host's own upload, or for your own", () => {
    for (const [item, opts] of [
      [photo(), { host: false }],
      [photo({ isHost: true }), {}],
      [photo(), { own: true }],
    ] as const) {
      const { unmount } = credit(item, opts);
      expect(screen.queryByTestId("look")).toBeNull();
      expect(looks).toEqual([]);
      unmount();
    }
  });
});
