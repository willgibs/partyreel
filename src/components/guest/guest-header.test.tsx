// @contract-for: src/components/guest/guest-header.tsx
// @contract-for: src/components/guest/guest-name-menu.tsx
/**
 * The one thing `framing=tag` (the sixth batch,
 * 2026-09-20) is a FUNCTION rather than a look: the Demo mark's PRESENCE, on
 * every guest screen of the demo, on the one header every such screen shares.
 * The pin stops there — the header pinning itself to the top under it is a
 * layout treatment (verified live, `testing-verification.md`'s blind spot),
 * never a class name this file should freeze.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { markPendingSave, saveEvent } from "@/lib/events/save-event";
import { claimAnonymousUploads } from "@/lib/guest/claim-uploads";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

/* The name menu's door, reduced to the one act it hands back (`onVerified`),
   so the pin is what the MENU does with a confirmation. The door's own
   machinery is its own contract (account-door.test.tsx). */
const { order } = vi.hoisted(() => ({ order: [] as string[] }));
vi.mock("@/components/auth/account-door", () => ({
  DOOR_WEAR: {
    save: { heading: "Keep your photos", reason: "Confirm it." },
    signin: { heading: "Sign in", reason: "Sign in." },
  },
  AccountDoor: ({ onVerified }: { onVerified: () => Promise<void> }) => (
    <button type="button" onClick={() => void onVerified()}>
      Finish confirming
    </button>
  ),
}));
vi.mock("@/lib/guest/claim-uploads", () => ({
  claimAnonymousUploads: vi.fn(async () => {
    order.push("claim");
  }),
}));
vi.mock("@/lib/events/save-event", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/events/save-event")>()),
  markPendingSave: vi.fn(),
  saveEvent: vi.fn(async () => {
    order.push("save");
    return true;
  }),
}));
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

  /** Open the name menu; the trigger only appears once a name is stored. */
  async function openMenu() {
    const trigger = await screen.findByRole("button", {
      name: /your name on this album/i,
    });
    fireEvent.pointerDown(trigger, { ctrlKey: false, button: 0 });
    return trigger;
  }

  it("names them, marks the name, and offers the three moves", async () => {
    localStorage.setItem("pr_guest_name_tok-1", "Sam");
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
    await openMenu();
    expect(screen.queryByRole("link", { name: /start for free/i })).toBeNull();
    // The PUBLIC word, read from the mark itself so the two cannot drift.
    await waitFor(() => expect(screen.getByText("Unverified")).toBeVisible());
    for (const row of [/confirm your email/i, /change name/i, /^sign in$/i]) {
      expect(screen.getByRole("menuitem", { name: row })).toBeInTheDocument();
    }
  });

  /* ────────────────────────────────────────────────────────────────────────
     THE TWO STATES OF A GUEST'S OWN MENU (Will, 2026-09-22). Publicly every
     unconfirmed guest is one thing; here, and ONLY here, they are told whether
     the address they typed is still unconfirmed. The pins are the two labels
     and the two rows, both derived from one device flag and never from an
     address, because no address is ever stored.
     ──────────────────────────────────────────────────────────────────────── */
  it("with no address: 'Unverified', and the row offers to ADD one", async () => {
    localStorage.setItem("pr_guest_name_tok-1", "Sam");
    localStorage.setItem("pr_session_tok-1", "sess-1");
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
    await openMenu();
    await waitFor(() => expect(screen.getByText("Unverified")).toBeVisible());
    expect(
      screen.getByRole("menuitem", { name: /add your email/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /confirm your email/i }),
    ).toBeNull();
  });

  it("with one attached: 'Email not confirmed', and the row offers to CONFIRM it", async () => {
    localStorage.setItem("pr_guest_name_tok-1", "Sam");
    localStorage.setItem("pr_session_tok-1", "sess-1");
    localStorage.setItem("pr_guest_email_attached_tok-1", "1");
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
    await openMenu();
    await waitFor(() =>
      expect(screen.getByText("Email not confirmed")).toBeVisible(),
    );
    expect(
      screen.getByRole("menuitem", { name: /confirm your email/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /add your email/i }),
    ).toBeNull();
    // ...and the public word is absent here, because this menu knows something
    // the album deliberately does not.
    expect(screen.queryByText("Unverified")).toBeNull();
  });

  it("never offers 'Add your email' without a row to put one on", async () => {
    localStorage.setItem("pr_guest_name_tok-1", "Sam");
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
    await openMenu();
    await waitFor(() => expect(screen.getByText("Unverified")).toBeVisible());
    expect(
      screen.queryByRole("menuitem", { name: /add your email/i }),
    ).toBeNull();
  });

  it("never claims a name on a page with no event behind it (/u/[slug])", () => {
    localStorage.setItem("pr_guest_name_tok-1", "Sam");
    render(<GuestHeader />);
    expect(screen.getByRole("link", { name: /start for free/i })).toBeVisible();
  });
});

/**
 * CONFIRMING FROM THE MENU KEEPS THE EVENT, as the offer card's door does and
 * in its words ("this event stays in your account"): the uploads claimed, THEN
 * the event saved, which is what puts it on the dashboard rather than only in
 * Events you joined. The intent is written before the door opens, because
 * Google and a magic link leave the page and the event page finishes the save
 * on the way back. Sign in promises less (the photographs join the account),
 * so it claims and saves nothing.
 */
describe("GuestNameMenu: confirming keeps the event", () => {
  beforeEach(() => {
    localStorage.clear();
    order.length = 0;
    vi.clearAllMocks();
  });

  async function openDoor(row: RegExp) {
    const trigger = await screen.findByRole("button", {
      name: /your name on this album/i,
    });
    fireEvent.pointerDown(trigger, { ctrlKey: false, button: 0 });
    fireEvent.click(await screen.findByRole("menuitem", { name: row }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Finish confirming" }),
    );
  }

  it("Confirm your email: the intent first, then the claim, then the save", async () => {
    localStorage.setItem("pr_guest_name_tok-1", "Sam");
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
    await openDoor(/confirm your email/i);
    await waitFor(() =>
      expect(saveEvent).toHaveBeenCalledWith({
        eventId: "evt-1",
        qrToken: "tok-1",
      }),
    );
    expect(markPendingSave).toHaveBeenCalledWith("evt-1");
    expect(order).toEqual(["claim", "save"]);
    expect(toast.success).toHaveBeenCalledWith("Saved to your dashboard.");
  });

  it("Sign in: the photographs claimed, and no save it never promised", async () => {
    localStorage.setItem("pr_guest_name_tok-1", "Sam");
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
    await openDoor(/^sign in$/i);
    await waitFor(() => expect(claimAnonymousUploads).toHaveBeenCalled());
    expect(saveEvent).not.toHaveBeenCalled();
    expect(markPendingSave).not.toHaveBeenCalled();
  });
});
