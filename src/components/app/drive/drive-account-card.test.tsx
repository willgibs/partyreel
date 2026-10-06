/**
 * ACCOUNT'S GOOGLE DRIVE CARD SAYS "NOT SET UP YET" IN WORDS WHERE DRIVE IS NOT SET UP (red-team 55's NIT, the brief's and
 * `env.ts`'s own expectation: "the panel, the dashboard and Account say 'not set up yet' in words"). It drew nothing, so
 * a host looking for the connection found no card and no reason, while the three doors said it. The card stands, with the
 * doors' sentence and no press: a Connect there could only come back as "isn't set up yet".
 *
 * ★ ITS "SENT" IS THIS CONNECTION'S (crumbs-82; the Drive re-walk's finding): after a reconnect it counted every send she
 * ever made, albums Your events' list showed with no state, so the sends before the connection in hand are one quiet
 * "Earlier" line and no part of Sent. RESHAPED ON PURPOSE: the card reads her sent rows now and splits them itself, so
 * the file's one mock of the folded totals is a mock of the rows.
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const state = { configured: false };
const reads = {
  connection: vi.fn(async (): Promise<unknown> => null),
  sends: vi.fn(async () => []),
  rows: vi.fn(async (): Promise<unknown[]> => []),
};
vi.mock("@/lib/env", () => ({ driveConfigured: () => state.configured }));
vi.mock("@/lib/db/queries/drive", () => ({
  readConnection: reads.connection,
  readMySends: reads.sends,
  readMySentRows: reads.rows,
}));
vi.mock("./actions", () => ({ disconnectDriveAction: vi.fn() }));

const { DriveAccountCard } = await import("./drive-account-card");
const { NOT_SET_UP } = await import("./not-set-up");
const { formatBytes } = await import("@/lib/utils");

const draw = async () =>
  render(await DriveAccountCard({ userId: "u1", zone: "UTC" }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Account's Google Drive card", () => {
  it("★ stands where Drive is not set up, with the doors' own sentence and nothing to press", async () => {
    state.configured = false;
    await draw();
    const card = document.querySelector("[data-drive-card]");
    expect(card?.getAttribute("data-drive-card")).toBe("unavailable");
    expect(card?.id).toBe("google-drive");
    expect(screen.getByText("Google Drive")).toBeInTheDocument();
    expect(screen.getByText(NOT_SET_UP.title)).toBeInTheDocument();
    expect(card?.textContent).toContain(NOT_SET_UP.detail);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    // Nothing of hers is read for a card with nothing to show.
    expect(reads.connection).not.toHaveBeenCalled();
    expect(reads.sends).not.toHaveBeenCalled();
  });

  it("offers Connect where Drive is set up and she has no connection", async () => {
    state.configured = true;
    await draw();
    expect(
      document
        .querySelector("[data-drive-card]")
        ?.getAttribute("data-drive-card"),
    ).toBe("none");
    expect(screen.queryByText(NOT_SET_UP.title)).toBeNull();
    expect(
      screen.getByRole("link", { name: "Connect Google Drive" }),
    ).toHaveAttribute("href", "/api/drive/connect?next=%2Faccount");
  });
});

/** The connection she has now, made at the second connect (after a Disconnect). */
const CONNECTION = {
  id: "c2",
  userId: "u1",
  status: "connected",
  email: "p3@example.com",
  name: null,
  rootFolderId: "root-2",
  createdAt: "2026-10-05T20:50:30.000Z",
  lastRefreshAt: null,
  refreshExpiresAt: null,
  operatorPausedAt: null,
  quota: { limit: null, usage: null, at: null },
};

/** A send that ended having landed something. */
const row = (
  eventId: string,
  bytesSent: number,
  itemsSent: number,
  createdAt: string,
  closedAt: string,
) => ({
  eventId,
  albumName: eventId,
  bytesSent,
  itemsSent,
  createdAt,
  closedAt,
});

/** The dl's value for a label, as a reader sees it. */
const valueOf = (label: string): string | null => {
  const dt = [...document.querySelectorAll("dt")].find(
    (el) => el.textContent === label,
  );
  return dt?.nextElementSibling?.textContent ?? null;
};

describe("Account's Sent, under a connection made after earlier sends", () => {
  const BEFORE = "2026-10-05T16:39:00.000Z";
  const AFTER = "2026-10-05T20:51:51.000Z";

  it("★ counts only the sends of this connection, and says the earlier ones apart, still where they went", async () => {
    state.configured = true;
    reads.connection.mockResolvedValue(CONNECTION);
    reads.rows.mockResolvedValue([
      // The first connection's: a whole album and a canceled one.
      row("walk", 1_679_247, 5, BEFORE, "2026-10-05T16:54:42Z"),
      row("arrival", 375_200, 14, BEFORE, "2026-10-05T17:05:40Z"),
      // This connection's: two albums, one sent twice (counted once).
      row("rewalk", 1_679_247, 5, AFTER, "2026-10-05T20:52:15Z"),
      row(
        "rewalk",
        1_679_247,
        5,
        "2026-10-05T20:55:13Z",
        "2026-10-05T20:55:22Z",
      ),
      row(
        "cancel",
        3_890_062,
        60,
        "2026-10-05T21:01:31Z",
        "2026-10-05T21:03:26Z",
      ),
    ]);
    await draw();
    expect(valueOf("Sent")).toBe(
      `2 albums · ${formatBytes(1_679_247 + 3_890_062)} · the last on October 5, 2026`,
    );
    expect(valueOf("Earlier")).toBe(
      `2 albums · ${formatBytes(1_679_247 + 375_200)}, sent before this connection. They stay where they went.`,
    );
  });

  it("draws no Earlier line where this connection is the only one there has been", async () => {
    state.configured = true;
    reads.connection.mockResolvedValue(CONNECTION);
    reads.rows.mockResolvedValue([
      row("rewalk", 1_679_247, 5, AFTER, "2026-10-05T20:52:15Z"),
    ]);
    await draw();
    expect(valueOf("Sent")).toContain("1 album · ");
    expect(valueOf("Earlier")).toBeNull();
  });

  it("reads Nothing yet while only the earlier connections have sent, and keeps their line", async () => {
    state.configured = true;
    reads.connection.mockResolvedValue(CONNECTION);
    reads.rows.mockResolvedValue([
      row("walk", 1_679_247, 5, BEFORE, "2026-10-05T16:54:42Z"),
    ]);
    await draw();
    expect(valueOf("Sent")).toBe("Nothing yet");
    expect(valueOf("Earlier")).toContain("1 album · ");
  });
});
