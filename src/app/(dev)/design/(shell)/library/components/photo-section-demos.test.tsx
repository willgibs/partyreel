import type { ReactNode } from "react";

import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PhotoSectionDemo } from "./photo-section-demos";

/**
 * THE PHOTOGRAPH SECTION IS DRAWN IN THE VIEWPORT IT IS FULL-BLEED IN (`photo-section-demos.tsx`): one laptop-wide frame per
 * specimen, never a box in the Library's column, because the section's plates say `sizes="100vw"` and a narrower box makes
 * that claim false (Next warned of it for each photograph on two pages). Pinned: one frame, the laptop's, with the source
 * the specimen names, and the bare instance that exists to separate two chapters stands on the photograph with no plate.
 */
vi.mock("@/components/lab", () => ({
  Frame: (props: { id: string; w: number; h: number; children: ReactNode }) => (
    <figure data-testid={props.id} data-w={props.w} data-h={props.h}>
      {props.children}
    </figure>
  ),
  Measured: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  document.body.inert = false;
});

describe("the section stands in a laptop-wide frame", () => {
  it("★ one frame at the laptop's width, the source the specimen names, the plate on the photograph", () => {
    const { container } = render(<PhotoSectionDemo source="scroll" />);
    const frame = container.querySelector<HTMLElement>("figure")!;
    expect(frame.getAttribute("data-testid")).toBe("photo-section-scroll-desk");
    expect(frame.dataset.w).toBe("1440");
    expect(container.querySelectorAll("figure")).toHaveLength(1);
    expect(
      container.querySelector(".bkd")?.getAttribute("data-bkd-source"),
    ).toBe("scroll");
    expect(container.querySelector(".bkd-plate")).toBeTruthy();
  });

  it("★ the bare instance has no plate: it separates two chapters", () => {
    const { container } = render(
      <PhotoSectionDemo source="pointer" copy={false} />,
    );
    expect(container.querySelector(".bkd")).toBeTruthy();
    expect(container.querySelector(".bkd-plate")).toBeNull();
  });

  it("every plate is the real one: six photographs, each full-bleed and lazy as production draws them", () => {
    const { container } = render(<PhotoSectionDemo source="pointer" />);
    const plates =
      container.querySelectorAll<HTMLImageElement>(".bkd-frame img");
    expect(plates).toHaveLength(6);
    for (const img of plates) {
      expect(img.getAttribute("sizes")).toBe("100vw");
      expect(img.getAttribute("loading")).toBe("lazy");
    }
  });
});
