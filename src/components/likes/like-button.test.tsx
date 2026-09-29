import { render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LikeButton, useLikeAction } from "@/components/likes/like-button";
import { LocalLikesProvider } from "@/components/likes/likes-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * NO HEART WHERE THE LIKE WOULD BE REFUSED (a ROADMAP carry-over from `crumbs-8`). The Uploads feed marks
 * an upload to an album that reads private to her `likeable: false`, because `like_media` likes nothing
 * there but the host's: neither the viewer's button nor the desk's glyph is offered on it. Every other
 * item, which carries no mark, keeps its heart exactly as before.
 */

function Likes({ children }: { children: React.ReactNode }) {
  // The lightbox's button wears the app's tooltip, whose provider the root layout mounts.
  return (
    <TooltipProvider>
      <LocalLikesProvider>{children}</LocalLikesProvider>
    </TooltipProvider>
  );
}

describe("the like verb", () => {
  it("★ offers no button on an item a like would be refused on", () => {
    render(
      <Likes>
        <LikeButton item={{ id: "closed", likeable: false }} />
      </Likes>,
    );
    expect(screen.queryByRole("button", { name: /like/i })).toBeNull();
  });

  it("keeps the button on every item that carries no mark", () => {
    render(
      <Likes>
        <LikeButton item={{ id: "open" }} />
        <LikeButton item={{ id: "also-open", likeable: true }} />
      </Likes>,
    );
    expect(screen.getAllByRole("button", { name: "Like" })).toHaveLength(2);
  });

  it("offers no desk glyph on it either", () => {
    const { result } = renderHook(() => useLikeAction(), { wrapper: Likes });
    expect(result.current({ id: "closed", likeable: false })).toBeNull();
    expect(result.current({ id: "open" })).toMatchObject({
      id: "like",
      like: true,
    });
  });
});
