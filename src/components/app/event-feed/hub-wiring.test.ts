import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * WHAT ONLY THE HUB'S PAGE CAN SAY ABOUT HER REEL (Will's Q5): the page is a server component over a session and a
 * dozen reads, so what is pinned here is how it wires the reel she plays on her own page. Each of these fails silently: a
 * reel mounted outside the album's store never finds its manifest (the Reel card would push `?reel` and nothing would
 * play), and a reel that reads its own switch instead of the page's face keeps playing after Settings turned it off.
 */
const PAGE = readFileSync(
  join(process.cwd(), "src/app/(app)/dashboard/[eventId]/page.tsx"),
  "utf8",
);

describe("her reel, on the hub's page", () => {
  it("★ stands inside the album's store, after the head: it reads the hub's own manifest and links", () => {
    const store = PAGE.indexOf("<HostAlbumProvider");
    const head = PAGE.indexOf("<HubCover");
    const reel = PAGE.indexOf("<HubReel");
    const end = PAGE.indexOf("</HostAlbumProvider>");
    expect(store, "the album's store").toBeGreaterThan(-1);
    expect(reel, "the reel inside the store").toBeGreaterThan(store);
    expect(reel, "after the head").toBeGreaterThan(head);
    expect(reel, "before the store ends").toBeLessThan(end);
  });

  it("is told whether there is a reel by the page's own face of the host's switch and the platform lever", () => {
    const props = PAGE.slice(PAGE.indexOf("<HubReel"));
    const handed = props.slice(0, props.indexOf("/>"));
    expect(handed).toContain('reelOn={reelFace.state !== "off"}');
  });

  it("starts on the host's own defaults and keys this device's picks as the guest page does", () => {
    const props = PAGE.slice(PAGE.indexOf("<HubReel"));
    const handed = props.slice(0, props.indexOf("/>"));
    expect(handed).toContain("styleId: event.reel_style_id");
    expect(handed).toContain("holdSec: event.reel_hold_sec");
    expect(handed).toContain("qrToken={event.qr_token}");
    // The code on the plate encodes the permanent link, as every code does.
    expect(handed).toContain("joinUrl={eventLink}");
  });
});
