import { act, fireEvent, render, screen } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SUPPORT_EMAIL } from "@/lib/constants/site";

import { ContactFacts } from "./contact-facts";

// sonner is mocked globally (vitest.setup.ts): `toast` is a spy here.

function stubClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("the plain address, a fact beside the form", () => {
  it("is a mailto link on the support address, with the reply time beside it", () => {
    render(<ContactFacts />);
    expect(screen.getByRole("link", { name: SUPPORT_EMAIL })).toHaveAttribute(
      "href",
      `mailto:${SUPPORT_EMAIL}`,
    );
    expect(screen.getByText("Usually within a day")).toBeInTheDocument();
  });

  it("copies the address and says so for a moment", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    render(<ContactFacts />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Copy email address" }),
      );
    });
    expect(writeText).toHaveBeenCalledWith(SUPPORT_EMAIL);
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1900);
    });
    expect(
      screen.getByRole("button", { name: "Copy email address" }),
    ).toBeInTheDocument();
  });

  it("shows the address in a toast when the clipboard refuses", async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error("denied")));
    render(<ContactFacts />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Copy email address" }),
      );
    });
    expect(toast).toHaveBeenCalledWith(SUPPORT_EMAIL, expect.any(Object));
    expect(
      screen.getByRole("button", { name: "Copy email address" }),
    ).toBeInTheDocument();
  });
});
