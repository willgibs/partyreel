// @contract-for: src/components/guest/guest-header.tsx
/**
 * The one thing `framing=tag` (docs/design/rulings.md, the sixth batch,
 * 2026-09-20) is a FUNCTION rather than a look: the Demo mark's PRESENCE, on
 * every guest screen of the demo, on the one header every such screen shares.
 * The pin stops there — the header pinning itself to the top under it is a
 * layout treatment (verified live, `testing-verification.md`'s blind spot),
 * never a class name this file should freeze.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
