/**
 * ★ OUR PROMISE NAMES THE BOX BEFORE GOOGLE SHOWS IT (crumbs-82; the Drive re-walk's finding). Google lists Drive's
 * permission as a checkbox, and it starts unticked, so a first Continue came back as `needs_permission` (the app recovers
 * in place, telling her to tick it), while the promise's last line said only "to allow this next" and nothing of a box.
 * The promise says it, in the recovery's own words, so the two never name the box two ways.
 */
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Popup, PopupContent } from "@/components/ui/popup";

import { returnWords } from "./drive-client";
import { DriveSendSteps } from "./send-steps";
import { resetDriveStatus } from "./use-drive-status";

const ALBUM = "6f1c2b0e-3b0a-4a53-9a34-0f3f9a9d1d11";

beforeEach(() => {
  // Not connected: the status answers no connection, so the step is our promise.
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => ({
        configured: true,
        connection: null,
        sends: [],
        now: new Date().toISOString(),
      }),
    })),
  );
});

afterEach(() => {
  resetDriveStatus();
  vi.unstubAllGlobals();
});

function promise() {
  return render(
    <Popup open onOpenChange={() => {}}>
      <PopupContent kind="list">
        <DriveSendSteps
          eventIds={[ALBUM]}
          includeHidden={false}
          source="panel"
          returnPath="/dashboard/e1"
          upLabel="Take it home"
          onBack={() => {}}
          onDone={() => {}}
          desk
        />
      </PopupContent>
    </Popup>,
  );
}

describe("the promise before Google", () => {
  it("★ says to tick the box that lets Partyreel add files, as the return from Google does", async () => {
    promise();
    const line = await screen.findByText(
      /Google asks you to choose an account/,
    );
    expect(line).toHaveTextContent(
      "Google asks you to choose an account, then to tick the box that lets Partyreel add files.",
    );
    expect(line.textContent).not.toMatch(/allow this/);
    // The recovery's own words, so a first Continue that left the box unticked finds the same box named twice.
    const recovery = returnWords("needs_permission").title;
    expect(line.textContent!.toLowerCase()).toContain(
      recovery.replace(/\.$/, "").toLowerCase(),
    );
  });

  it("still offers Continue to Google and Not now", async () => {
    promise();
    expect(
      await screen.findByRole("button", { name: "Continue to Google" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Not now" })).toBeInTheDocument();
  });
});
