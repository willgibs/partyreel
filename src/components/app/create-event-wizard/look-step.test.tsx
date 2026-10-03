/**
 * THE LOOK STEP OPENS ON ITS PHOTOGRAPH (red-team 46's NIT): the room's screen (the print sample's card) was black for
 * about a second after Continue, because its photograph was a lazy `next/image` that began its fetch only when the step
 * mounted. It is our own marketing still through the optimizer (never user media, `media-cost-policy.test.ts`), so the
 * step asks for it eagerly, and the page asks for it before the step: the name step is where she spends the seconds.
 */
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const preload = vi.hoisted(() => vi.fn());
vi.mock("react-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-dom")>()),
  preload,
}));
// The codes are pictures here: what the step is about is where its photograph stands.
vi.mock("@/components/app/styled-qr", () => ({
  StyledQr: () => <div data-testid="styled-qr" />,
}));

import { LookStep } from "./look-step";

function mount() {
  return render(
    <LookStep
      look="classic"
      onLook={() => {}}
      name="Maya & Jay's Wedding"
      siteUrl="https://partyreel.com"
      joinUrl="https://partyreel.com/e/sample"
    />,
  );
}

const photograph = (container: HTMLElement) =>
  container.querySelector<HTMLImageElement>(
    "[data-look-picture='room-screen'] img",
  )!;

describe("★ the room's screen opens on its photograph", () => {
  it("★ draws it eagerly, at high priority and decoded with the step, never lazily", () => {
    const img = photograph(mount().container);
    expect(img).not.toBeNull();
    expect(img.getAttribute("loading")).toBe("eager");
    expect(img.getAttribute("fetchpriority")).toBe("high");
    expect(img.getAttribute("decoding")).toBe("sync");
  });

  it("is our own marketing still through the optimizer, the one allowed use of it", () => {
    const img = photograph(mount().container);
    expect(img.getAttribute("srcset")).toContain("/_next/image?url=");
    expect(img.getAttribute("srcset")).toContain("mkt-party-dj-01.jpg");
  });

  it("★ is asked for before the step, as the very file the step then draws", () => {
    const img = photograph(mount().container);
    // At the module's first load, with the page that holds the wizard: she is still naming the event.
    expect(preload).toHaveBeenCalledTimes(1);
    const [href, options] = preload.mock.calls[0]!;
    expect(options).toMatchObject({
      as: "image",
      imageSrcSet: img.getAttribute("srcset"),
      imageSizes: img.getAttribute("sizes"),
    });
    expect(String(href)).toContain("/_next/image?url=");
  });
});
