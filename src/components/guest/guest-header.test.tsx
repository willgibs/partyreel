// @contract-for: src/components/guest/guest-header.tsx
// @contract-for: src/components/guest/guest-name-menu.tsx
/**
 * The one thing `framing=tag` (docs/design/rulings.md, the sixth batch,
 * 2026-09-20) is a FUNCTION rather than a look: the Demo mark's PRESENCE, on
 * every guest screen of the demo, on the one header every such screen shares.
 * The pin stops there — the header pinning itself to the top under it is a
 * layout treatment (verified live, `testing-verification.md`'s blind spot),
 * never a class name this file should freeze.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      // Signed out: the CTA renders, never the account menu — the Demo mark
      // pin below must hold on the CTA branch, which every anonymous demo
      // visitor (the overwhelming majority) actually sees.
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      signOut: vi.fn(),
    },
  }),
}));

import { GuestHeader } from "@/components/guest/guest-header";

describe("GuestHeader: the Demo mark", () => {
  it("never appears for a real event", () => {
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
    expect(screen.queryByText("Demo")).not.toBeInTheDocument();
  });

  it("appears beside the wordmark for the demo", () => {
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" isDemo />);
    expect(screen.getByText("Demo")).toBeInTheDocument();
  });

  it("the event-less profile header (/u/[slug]) stays plain (isDemo defaults false)", () => {
    render(<GuestHeader />);
    expect(screen.queryByText("Demo")).not.toBeInTheDocument();
  });
});

/**
 * THE HEADER'S THIRD STATE (the identity reshape, 2026-09-21).
 *
 * The header knew a stranger and an account holder. The commonest person at a
 * name-only party is neither, and what is pinned is that the header KNOWS them
 * (their name, marked) and offers the three moves that are actually theirs.
 * Which icons, which order and the words of the door are precedent.
 */
describe("GuestHeader: a guest with a name and no account", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("wears the stranger's CTA until this device has typed a name", () => {
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
    expect(screen.getByRole("link", { name: /start for free/i })).toBeVisible();
  });

  it("names them, marks the name, and offers the three moves", async () => {
    localStorage.setItem("pr_guest_name_tok-1", "Sam");
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
    const trigger = await screen.findByRole("button", {
      name: /your name on this album/i,
    });
    expect(screen.queryByRole("link", { name: /start for free/i })).toBeNull();
    fireEvent.pointerDown(trigger, { ctrlKey: false, button: 0 });
    await waitFor(() =>
      expect(screen.getByText(/name not verified/i)).toBeVisible(),
    );
    for (const row of [
      /confirm your email/i,
      /change name/i,
      /^sign in$/i,
    ]) {
      expect(screen.getByRole("menuitem", { name: row })).toBeInTheDocument();
    }
  });

  it("never claims a name on a page with no event behind it (/u/[slug])", () => {
    localStorage.setItem("pr_guest_name_tok-1", "Sam");
    render(<GuestHeader />);
    expect(screen.getByRole("link", { name: /start for free/i })).toBeVisible();
  });
});
