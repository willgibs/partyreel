import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A PORTAL LINK TO A RECORD THAT IS GONE DRAWS ITS OWN 404 (crumbs-28, from `stale-link`). The account and album pages
 * threw `notFound()`, which Next serves as its error shell: an empty body until the script has run. They draw the
 * portal's own not-found now, in the HTML, headed by the not-found's own metadata (one home, `not-found.metadata.ts`).
 * The title reads the record, so it passes the portal's gate first, as the page does, and reads nothing before MFA.
 *
 * ★ AND SO DOES A LINK WHOSE ID IS NOT AN ID (build 33's red-team). `/admin/albums/not-a-uuid` reached the reads,
 * Postgres refused the cast (22P02), and the page answered 500 with "Something went wrong" and filed an error each hit.
 * The id's shape is asked after the gate and before any read, so a mangled link is a record that is not there.
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
const readCoveredItems = vi.fn();
vi.mock("@/lib/db/queries/reports", () => ({
  readCoveredItems: (...a: unknown[]) => readCoveredItems(...a),
}));
const later = vi.hoisted(() => vi.fn());
vi.mock("@/lib/r2/grid-items", () => ({ toModerationFeedItems: later }));
vi.mock("@/lib/lifecycle/account-deletion", () => ({
  getAccountDeletionState: later,
}));
vi.mock("@/components/admin/moderation-grid", () => ({
  ModerationGrid: () => null,
}));
// The album page hands the grid its Server Actions as props (crumbs-78); their module's `server-only` chain does not
// resolve in jsdom, like the account control's below.
vi.mock("@/app/admin/albums/actions", () => ({
  removeMediaByOperatorAction: vi.fn(),
  restoreMediaAction: vi.fn(),
}));
vi.mock("@/app/admin/accounts/[id]/delete-account-control", () => ({
  DeleteAccountControl: () => null,
}));

const album = await import("./albums/[eventId]/page");
const account = await import("./accounts/[id]/page");
const { adminNotFoundMetadata } = await import("./not-found.metadata");
const { metadata: boundaryMetadata } = await import("./not-found");

/**
 * A record's id as a link carries it: well formed, naming nothing that is there. (Reshaped on purpose, build 33: these
 * tests used "gone-event" and "gone-id", which a page now answers without a read at all, so they no longer reached the
 * read whose "nothing there" they pin; the scar they keep is the same.)
 */
const GONE = "736ead6a-5b1c-4d2e-9f30-4a5b6c7d8e9f";

const RECORDS = [
  {
    name: "an album",
    draw: (id: string) =>
      album.default({ params: Promise.resolve({ eventId: id }) }),
    head: (id: string) =>
      album.generateMetadata({ params: Promise.resolve({ eventId: id }) }),
    read: getAlbumForModeration,
    title: "Album",
  },
  {
    name: "an account",
    draw: (id: string) => account.default({ params: Promise.resolve({ id }) }),
    head: (id: string) =>
      account.generateMetadata({ params: Promise.resolve({ id }) }),
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
  readCoveredItems.mockResolvedValue(new Set());
});

async function expectNotFoundDrawn(page: React.ReactNode) {
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
}

describe.each(RECORDS)("the portal, for $name that is gone", (record) => {
  it("★ draws the portal's own not-found in its HTML, never throwing for Next's error shell", async () => {
    await expectNotFoundDrawn(await record.draw(GONE));
    expect(later).not.toHaveBeenCalled();
  });

  it("★ is titled as the 404 it is, from the not-found's own metadata", async () => {
    expect(await record.head(GONE)).toBe(adminNotFoundMetadata);
  });

  it("keeps its own title for a record that is there", async () => {
    record.read.mockResolvedValue({ found: true });
    expect(await record.head(GONE)).toEqual({ title: record.title });
  });

  it("reads no record for its title before the gate has passed, nor before MFA", async () => {
    gate.aal = "aal1";
    expect(await record.head(GONE)).toEqual({ title: record.title });
    expect(record.read).not.toHaveBeenCalled();
    requireAdmin.mockRejectedValue(new Error("NEXT_HTTP_ERROR_FALLBACK;404"));
    await expect(record.head(GONE)).rejects.toThrow();
    expect(record.read).not.toHaveBeenCalled();
  });
});

describe.each(RECORDS)(
  "the portal, for $name whose id is not an id",
  (record) => {
    const MALFORMED = [
      "not-a-uuid",
      "12345",
      "g36ead6a-5b1c-4d2e-9f30-4a5b6c7d8e9f",
      "'",
    ];

    beforeEach(() => {
      // What PostgREST answers a uuid column handed anything else, as each read throws it.
      const refused = () =>
        Promise.reject(new Error("invalid input syntax for type uuid (22P02)"));
      getAlbumForModeration.mockImplementation(refused);
      getAccountDetail.mockImplementation(refused);
      readCoveredItems.mockImplementation(refused);
    });

    it.each(MALFORMED)(
      "★ %j draws the not-found and reads nothing, never the 500",
      async (id) => {
        await expectNotFoundDrawn(await record.draw(id));
        expect(record.read).not.toHaveBeenCalled();
        expect(readCoveredItems).not.toHaveBeenCalled();
      },
    );

    it.each(MALFORMED)("★ %j is titled as the 404 it is", async (id) => {
      expect(await record.head(id)).toBe(adminNotFoundMetadata);
      expect(record.read).not.toHaveBeenCalled();
    });

    it("still passes the gate first: nothing is drawn for a request it turns away", async () => {
      gate.aal = "aal1";
      expect(await record.draw("not-a-uuid")).toBeNull();
      requireAdmin.mockRejectedValue(new Error("NEXT_HTTP_ERROR_FALLBACK;404"));
      await expect(record.draw("not-a-uuid")).rejects.toThrow();
    });
  },
);

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
