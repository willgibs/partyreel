/**
 * THE CREDIT DRAWS NO STAND-IN, AND HER OWN UPLOAD WEARS HER FACE (crumbs-45; build 36's red-team: the owner's feed
 * viewer credited his own upload with a "?" disc, "? Host · RT36 T told"). Pinned: a host credit with no name draws
 * no disc at all, the Host badge saying who; her own event's upload in her Uploads (her name and face, no door, hers)
 * reads "You" beside her face and links nowhere, the page she is on; and the album's credit of a host keeps the
 * byline's face and its door, as before.
 */
import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";

import { FaceCredit, type ViewerMedia } from "./credit";

const photo = (extra: Partial<ViewerMedia>): ViewerMedia => ({
  id: "m1",
  type: "photo",
  url: "u-m1",
  ...extra,
});

function credit(item: ViewerMedia, isOwn = false): HTMLElement {
  render(
    <TooltipProvider>
      <FaceCredit item={item} viewerIsHost={false} isOwn={isOwn} />
    </TooltipProvider>,
  );
  return document.querySelector("[data-lightbox-credit]") as HTMLElement;
}

describe("the credit's face", () => {
  it("★ a host with no name draws no disc, never a '?': the Host badge says who", () => {
    const el = credit(
      photo({ isHost: true, uploaderName: null, eventName: "RT36 T told" }),
    );
    expect(el.querySelector("[data-slot='avatar']")).toBeNull();
    expect(within(el).queryByText("?")).toBeNull();
    expect(within(el).getByText("Host")).toBeInTheDocument();
    expect(within(el).getByText("RT36 T told")).toBeInTheDocument();
  });

  it("★ her own event's upload in her Uploads reads You beside her face, and opens nothing", () => {
    const el = credit(
      photo({
        isHost: true,
        uploaderName: "Will Gibson",
        uploaderFace: { avatarUrl: null, seed: "seed-will", href: null },
        eventName: "RT36 T told",
      }),
      true,
    );
    expect(within(el).getByText("You")).toBeInTheDocument();
    // Her colour's disc with her initial: the face the byline wears, never a "?".
    expect(within(el).getByText("W")).toBeInTheDocument();
    expect(within(el).queryByText("?")).toBeNull();
    expect(within(el).getByText("Host")).toBeInTheDocument();
    // No door to the page she is on.
    expect(
      within(el)
        .queryAllByRole("link")
        .map((a) => a.getAttribute("href")),
    ).toEqual([]);
  });

  // The name-only guest's hashvatar (small-fixes): a typed name's own row's colour beside the mark, never a
  // photograph and never a door, whatever a face on the item might carry.
  it("★ a typed name wears her own row's colour with the mark beside it, and opens nothing", () => {
    const el = credit(
      photo({
        uploaderName: "Maya J.",
        isVerified: false,
        uploaderFace: { avatarUrl: null, seed: "seed-g-maya", href: null },
      }),
    );
    const disc = el.querySelector("[data-slot='avatar']") as HTMLElement;
    // jsdom cannot store the mesh gradient, so a seeded root is read off its blend mode (avatar.test.tsx says why).
    expect(disc.style.backgroundBlendMode).not.toBe("");
    expect(within(el).getByText("M")).toBeInTheDocument();
    expect(within(el).getByText("Maya J.")).toBeInTheDocument();
    expect(within(el).queryAllByRole("link")).toEqual([]);
  });

  it("★ never lends an unproved name a photograph or a door, even if a face on the item carries them", () => {
    const el = credit(
      photo({
        uploaderName: "Maya J.",
        isVerified: false,
        uploaderFace: {
          avatarUrl: "https://cdn.test/avatars/u/avatar.webp",
          seed: "seed-g-maya",
          href: "/u/maya",
        },
      }),
    );
    expect(el.querySelector("img")).toBeNull();
    expect(within(el).queryAllByRole("link")).toEqual([]);
  });

  it("a typed name with no face on the item keeps the plain disc", () => {
    const el = credit(photo({ uploaderName: "Maya J.", isVerified: false }));
    const disc = el.querySelector("[data-slot='avatar']") as HTMLElement;
    expect(disc.style.backgroundBlendMode).toBe("");
  });

  it("the album's credit of a host keeps the byline's face and its door", () => {
    const el = credit(
      photo({
        isHost: true,
        uploaderName: "Will Gibson",
        uploaderFace: { avatarUrl: null, seed: "seed-will", href: "/u/willg" },
      }),
    );
    expect(within(el).getByText("W")).toBeInTheDocument();
    expect(
      within(el).getByRole("link", { name: "Will Gibson" }),
    ).toHaveAttribute("href", "/u/willg");
  });
});
