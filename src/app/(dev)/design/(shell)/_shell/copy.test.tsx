/**
 * "COPY LINK" COPIES THIS EXACT VIEW, A BOARD'S OWN SWITCHES INCLUDED (lab-sitting, from ROADMAP's line:
 * "`CopyLink` builds from the six lab params, so a board's own switches (`?welcome=gate&was=dom`) never ride
 * the copied link, against `board-state.tsx`'s 'the URL is the share format'").
 *
 * A board writes each of its controls to the address under the control's own id (`useBoardState`), so a
 * note about "the shut door when Lena is turned away" is a link only when those ids ride it. The copy used
 * to rebuild the query from the lab's six params alone and dropped every one of them. The key is still the
 * page's own (the proxy's, never a stale one in the bar), and the lab's params lead in their order.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  installNextHistory,
  NextRouterStandIn,
  type NextHistory,
} from "@/lib/test-utils/next-history";

import type { BoardSpec } from "@/components/lab/board-spec";
import { useBoardState } from "@/components/lab/board-state";

import { CopyLink } from "./copy";
import { ShellProvider } from "./shell-context";

vi.mock("next/navigation", async () => {
  const { nextNavigation } = await import("@/lib/test-utils/next-history");
  return { ...nextNavigation, useRouter: () => ({ replace: vi.fn() }) };
});

const SPEC = {
  controls: [
    {
      id: "welcome",
      label: "The welcome at",
      options: [
        { id: "public", label: "A Public album" },
        { id: "gate", label: "A password gate" },
      ],
      default: "public",
    },
    {
      id: "was",
      label: "Who was in",
      options: [
        { id: "priya", label: "Priya" },
        { id: "dom", label: "Dom" },
      ],
      default: "priya",
    },
  ],
} as unknown as BoardSpec;

function Board() {
  const { setState } = useBoardState(SPEC);
  return (
    <button
      type="button"
      onClick={() => setState({ welcome: "gate", was: "dom" })}
    >
      the gate, with Dom
    </button>
  );
}

let next: NextHistory;
let copied: string[] = [];
beforeEach(() => {
  next = installNextHistory();
  copied = [];
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: (text: string) => {
        copied.push(text);
        return Promise.resolve();
      },
    },
  });
});
afterEach(() => {
  next.uninstall();
  window.history.replaceState(null, "", "/");
});

function view(designKey: string | null) {
  return render(
    <NextRouterStandIn>
      <ShellProvider nav={[]} index={[]} designKey={designKey}>
        <Board />
        <CopyLink />
      </ShellProvider>
    </NextRouterStandIn>,
  );
}

const copy = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /copy link/i }));
  });
  return new URL(copied.at(-1) ?? "");
};

describe("Copy link", () => {
  it("★ carries the board's own switches, the session and the section", async () => {
    next.land(
      "/design/lab/locked-door?key=k&session=locked-door.family#locked-door-family",
    );
    view("k");
    fireEvent.click(screen.getByRole("button", { name: "the gate, with Dom" }));
    await act(async () => {});
    const url = await copy();
    expect(url.origin).toBe(window.location.origin);
    expect(url.pathname).toBe("/design/lab/locked-door");
    expect(url.hash).toBe("#locked-door-family");
    expect(url.searchParams.get("welcome")).toBe("gate");
    expect(url.searchParams.get("was")).toBe("dom");
    expect(url.searchParams.get("session")).toBe("locked-door.family");
    expect(url.searchParams.get("key")).toBe("k");
    // The lab's own params lead, in their order; the board's follow as the bar holds them.
    expect([...url.searchParams.keys()]).toEqual([
      "key",
      "session",
      "welcome",
      "was",
    ]);
  });

  it("names the page's own key, never one the bar was left holding", async () => {
    next.land("/design/lab/locked-door?key=stale&welcome=gate");
    view("k");
    const url = await copy();
    expect(url.searchParams.get("key")).toBe("k");
    expect(url.searchParams.get("welcome")).toBe("gate");
  });
});
