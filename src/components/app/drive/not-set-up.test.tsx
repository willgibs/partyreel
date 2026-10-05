/**
 * "NOT SET UP YET" IS SAID FIRST, EVERYWHERE, IN ONE SET OF WORDS (red-team 55's three NITs: Your events' list let her
 * pick albums before saying it, What's using space asked Drive's status of a host who never used it, and Account said
 * nothing). Drive not being set up on this deployment (`driveConfigured()`) is a state every place meets alike, so the
 * four doors read one status poll, one sentence, and no place goes on to a choice.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AlbumPreview } from "@/lib/drive/press";

import { AlbumPicker } from "./album-picker";
import { refusalWords, returnWords } from "./drive-client";
import { NOT_SET_UP } from "./not-set-up";
import { DriveStorageDoor } from "./storage-door";
import { resetDriveStatus } from "./use-drive-status";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const ALBUM: AlbumPreview = {
  eventId: "6f1c2b0e-3b0a-4a53-9a34-0f3f9a9d1d11",
  name: "Maya & Jay",
  eventDate: null,
  eventEndDate: null,
  items: 3,
  bytes: 3_000_000,
  photos: 3,
  clips: 0,
  newItems: 3,
  newBytes: 3_000_000,
  sentBefore: null,
  unfinished: null,
};

/** The status read's answer, and the albums', by address; every address asked is kept. */
function stubDrive(configured: boolean) {
  const asked: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      asked.push(url);
      if (url.startsWith("/api/drive/status")) {
        return {
          ok: true,
          json: async () => ({
            configured,
            connection: null,
            sends: [],
            now: new Date().toISOString(),
          }),
        };
      }
      if (url.startsWith("/api/drive/albums")) {
        return {
          ok: true,
          json: async () => ({ ok: true, albums: [ALBUM], more: false }),
        };
      }
      return { ok: false, json: async () => ({}) };
    }),
  );
  return asked;
}

beforeEach(() => {
  resetDriveStatus();
});

afterEach(() => {
  document.cookie = "pr_drive=; Max-Age=0; path=/";
  resetDriveStatus();
  vi.unstubAllGlobals();
});

function Picker() {
  return (
    <AlbumPicker
      covers={new Map()}
      trigger={(open) => <button onClick={open}>Send to Drive door</button>}
    />
  );
}

describe("Your events' send list", () => {
  it("★ says Drive isn't set up before any choice, and lists no album for nothing", async () => {
    const asked = stubDrive(false);
    render(<Picker />);
    await userEvent.click(
      screen.getByRole("button", { name: "Send to Drive door" }),
    );
    expect(await screen.findByText(NOT_SET_UP.title)).toBeInTheDocument();
    expect(screen.getByText(NOT_SET_UP.detail)).toBeInTheDocument();
    // No album to pick, no switch to set, nothing to press on to; the popup's own Close is the way out.
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByText("Maya & Jay")).toBeNull();
    expect(screen.queryByRole("switch")).toBeNull();
    expect(screen.queryByRole("button", { name: /Send to Drive$/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(asked.some((url) => url.startsWith("/api/drive/albums"))).toBe(
      false,
    );
  });

  it("lists the albums once Drive is there, asking for them once", async () => {
    const asked = stubDrive(true);
    render(<Picker />);
    await userEvent.click(
      screen.getByRole("button", { name: "Send to Drive door" }),
    );
    expect(await screen.findByText("Maya & Jay")).toBeInTheDocument();
    expect(screen.queryByText(NOT_SET_UP.title)).toBeNull();
    expect(screen.getByRole("switch")).toBeInTheDocument();
    expect(asked.filter((url) => url.startsWith("/api/drive/albums"))).toEqual([
      "/api/drive/albums?hidden=0",
    ]);
  });

  it("goes on to its list where the status could not be read: no verdict, and the press says what it finds", async () => {
    const asked: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input);
        asked.push(url);
        if (url.startsWith("/api/drive/status")) throw new Error("offline");
        return {
          ok: true,
          json: async () => ({ ok: true, albums: [ALBUM], more: false }),
        };
      }),
    );
    render(<Picker />);
    await userEvent.click(
      screen.getByRole("button", { name: "Send to Drive door" }),
    );
    expect(await screen.findByText("Maya & Jay")).toBeInTheDocument();
    expect(screen.queryByText(NOT_SET_UP.title)).toBeNull();
  });

  it("asks for a fresh list at every opening, and for none when she only steps back from the press", async () => {
    const asked = stubDrive(true);
    render(<Picker />);
    const door = screen.getByRole("button", { name: "Send to Drive door" });
    await userEvent.click(door);
    await userEvent.click(await screen.findByRole("checkbox"));
    await userEvent.click(
      screen.getByRole("button", { name: /Send to Drive$/ }),
    );
    // The press's own step is up; stepping back to the list reads nothing again.
    await userEvent.click(
      await screen.findByRole("button", { name: /Your albums/ }),
    );
    expect(await screen.findByText("Maya & Jay")).toBeInTheDocument();
    expect(
      asked.filter((url) => url.startsWith("/api/drive/albums")),
    ).toHaveLength(1);
    // Closed and opened again: a fresh read.
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByText("Maya & Jay")).toBeNull());
    await userEvent.click(door);
    expect(await screen.findByText("Maya & Jay")).toBeInTheDocument();
    expect(
      asked.filter((url) => url.startsWith("/api/drive/albums")),
    ).toHaveLength(2);
  });
});

describe("What's using space's send line", () => {
  it("★ asks Drive's status of a host who uses Drive only: the hint cookie gates the read, as the strip's and the tile's do", async () => {
    const asked = stubDrive(true);
    render(<DriveStorageDoor eventId={ALBUM.eventId} albumName="Maya & Jay" />);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(asked).toEqual([]);
  });

  it("asks once for a host who has the hint", async () => {
    document.cookie = "pr_drive=1; path=/";
    const asked = stubDrive(true);
    render(<DriveStorageDoor eventId={ALBUM.eventId} albumName="Maya & Jay" />);
    await waitFor(() => expect(asked).toEqual(["/api/drive/status"]));
  });

  it("still says it where she presses Send to Drive, hint or no", async () => {
    const asked = stubDrive(false);
    render(<DriveStorageDoor eventId={ALBUM.eventId} albumName="Maya & Jay" />);
    await userEvent.click(
      screen.getByRole("button", { name: /Send to Drive/ }),
    );
    expect(await screen.findByText(NOT_SET_UP.title)).toBeInTheDocument();
    expect(asked).toEqual(["/api/drive/status"]);
  });
});

describe("one sentence", () => {
  it("is the press's refusal's and the return's, whole", () => {
    expect(refusalWords({ ok: false, code: "unavailable" }).title).toBe(
      NOT_SET_UP.title,
    );
    expect(returnWords("unavailable").title).toBe(NOT_SET_UP.title);
  });
});
