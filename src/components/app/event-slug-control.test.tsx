/**
 * THE CUSTOM LINK'S LINES REACH A SCREEN READER (milestone 30's production pass: the error line had no
 * live region and nothing tied it to the field). Held: the field is described by whichever line speaks
 * for it (the hint before anything is typed, the status after), the status stands in one live region
 * that is mounted before it has anything to say, and a refusal arrives inside it.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    rpc: vi.fn(async () => ({ data: true, error: null })),
  }),
}));
vi.mock("@/app/(app)/dashboard/actions", () => ({
  setEventSlugAction: vi.fn(),
  clearEventSlugAction: vi.fn(),
}));
vi.mock("@/components/app/pricing/pricing-sheet", () => ({
  PricingSheet: () => null,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const { EventSlugControl } = await import("./event-slug-control");

function mount() {
  render(
    <EventSlugControl
      eventId="event-1"
      siteUrl="https://partyreel.com"
      slug={null}
      locked={false}
    />,
  );
  return screen.getByRole("textbox", { name: "Custom link" });
}

describe("the custom link's lines", () => {
  it("before anything is typed, the field is described by its hint, and the live region stands empty", () => {
    const field = mount();
    const hint = document.getElementById(field.getAttribute("aria-describedby") ?? "");
    expect(hint?.textContent).toMatch(/friendly link to share/);
    const region = screen.getByRole("status");
    expect(region.getAttribute("aria-live")).toBe("polite");
    expect(region.textContent).toBe("");
  });

  it("★ a refusal arrives inside the live region, and the field names it", () => {
    const field = mount();
    fireEvent.change(field, { target: { value: "a" } });
    const region = screen.getByRole("status");
    expect(region.textContent).toMatch(/at least 3 characters/);
    expect(field.getAttribute("aria-invalid")).toBe("true");
    expect(field.getAttribute("aria-describedby")).toBe(region.id);
  });
});
