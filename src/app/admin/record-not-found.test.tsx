import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A PORTAL LINK TO A RECORD THAT IS GONE DRAWS ITS OWN 404 (crumbs-28, from `stale-link`). The account and album pages
 * threw `notFound()`, which Next serves as its error shell: an empty body until the script has run. They draw the
 * portal's own not-found now, in the HTML, headed by the not-found's own metadata (one home, `not-found.metadata.ts`).
 * The title reads the record, so it passes the portal's gate first, as the page does, and reads nothing before MFA.
 */
vi.mock("server-only", () => ({}));
const gate = vi.hoisted(() => ({ aal: "aal2" as "aal1" | "aal2" }));
const requireAdmin = vi.fn();
vi.mock("@/lib/auth/admin-context", () => ({
  requireAdmin: (...a: unknown[]) => requireAdmin(...a),
}));
const getAlbumForModeration = vi.fn();
vi.mock("@/lib/db/queries/moderation", () => ({
  getAlbumForModeration: (...a: unknown[]) => getAlbumForModeration(...a),
}));
const getAccountDetail = vi.fn();
vi.mock("@/lib/db/queries/accounts", () => ({
  getAccountDetail: (...a: unknown[]) => getAccountDetail(...a),
}));
const later = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db/queries/reports", () => ({
  readCoveredItems: async () => new Set(),
}));
vi.mock("@/lib/r2/grid-items", () => ({ toModerationFeedItems: later }));
vi.mock("@/lib/lifecycle/account-deletion", () => ({
  getAccountDeletionState: later,
}));
vi.mock("@/components/admin/moderation-grid", () => ({
  ModerationGrid: () => null,
}));
vi.mock("@/app/admin/accounts/[id]/delete-account-control", () => ({
  DeleteAccountControl: () => null,
}));

const album = await import("./albums/[eventId]/page");
const account = await import("./accounts/[id]/page");
const { adminNotFoundMetadata } = await import("./not-found.metadata");
const { metadata: boundaryMetadata } = await import("./not-found");

const RECORDS = [
  {
    name: "an album",
    draw: () =>
      album.default({ params: Promise.resolve({ eventId: "gone-event" }) }),
    head: () =>
      album.generateMetadata({
        params: Promise.resolve({ eventId: "gone-event" }),
      }),
    read: getAlbumForModeration,
    title: "Album",
  },
  {
    name: "an account",
    draw: () => account.default({ params: Promise.resolve({ id: "gone-id" }) }),
    head: () =>
      account.generateMetadata({ params: Promise.resolve({ id: "gone-id" }) }),
    read: getAccountDetail,
    title: "Account",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  gate.aal = "aal2";
  requireAdmin.mockImplementation(async () => ({ aal: gate.aal }));
  getAlbumForModeration.mockResolvedValue(null);
  getAccountDetail.mockResolvedValue(null);
});

describe.each(RECORDS)("the portal, for $name that is gone", (record) => {
  it("★ draws the portal's own not-found in its HTML, never throwing for Next's error shell", async () => {
    const page = await record.draw();
    render(<>{page}</>);
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "We couldn't find that page",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to overview" }),
    ).toHaveAttribute("href", "/admin");
    expect(later).not.toHaveBeenCalled();
  });

  it("★ is titled as the 404 it is, from the not-found's own metadata", async () => {
    expect(await record.head()).toBe(adminNotFoundMetadata);
  });

  it("keeps its own title for a record that is there", async () => {
    record.read.mockResolvedValue({ found: true });
    expect(await record.head()).toEqual({ title: record.title });
  });

  it("reads no record for its title before the gate has passed, nor before MFA", async () => {
    gate.aal = "aal1";
    expect(await record.head()).toEqual({ title: record.title });
    expect(record.read).not.toHaveBeenCalled();
    requireAdmin.mockRejectedValue(new Error("NEXT_HTTP_ERROR_FALLBACK;404"));
    await expect(record.head()).rejects.toThrow();
    expect(record.read).not.toHaveBeenCalled();
  });
});

describe("the portal's not-found boundary", () => {
  it("heads a thrown notFound() with the same words, one home for both", () => {
    expect(boundaryMetadata).toBe(adminNotFoundMetadata);
    expect(adminNotFoundMetadata.title).toBe("Page not found");
    expect(adminNotFoundMetadata.robots).toEqual({
      index: false,
      follow: false,
    });
  });
});
