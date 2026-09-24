// @contract-for: src/components/shared/not-found-screen.tsx
// @contract-for: src/components/shared/error-digest.tsx
// @contract-for: src/components/shared/route-error.tsx
// @contract-for: src/components/guest/guest-bar.tsx
// @contract-for: src/components/admin/admin-not-found-screen.tsx

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CircleAlert } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { ErrorDigest } from "@/components/shared/error-digest";
import { HelpLine, NotFoundScreen } from "@/components/shared/not-found-screen";

/**
 * ONE GRAMMAR FOR EVERY FAILURE PAGE (Will's eight verdicts, 2026-09-19,
 * verbatim).
 *
 * What this file guards is FUNCTION, never look: which screens report and which
 * must not, which screens carry a correlation code and which cannot have one,
 * that a refused clipboard never becomes a thrown screen, that every failure
 * page offers a way to a person, and that the two session-less chromes stay
 * session-less. Not a single number, word or class is pinned here: bible 10
 * keeps the copy open and Will retunes a look without asking a test.
 *
 * The source scans exist because the regressions they catch are SILENT. A
 * captureError that drifts down into the shared primitive files a Sentry issue
 * for every real 404 in the product and nothing on screen changes; a crash
 * boundary that loses its capture reports nothing and nothing on screen changes
 * either. Both are invisible until somebody reads the issue stream.
 */

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

/**
 * A file's CODE, with its comments gone. Every scan below runs on this rather
 * than the raw source, because these files are heavily commented WITH the words
 * being scanned for: the primitive's own doc comment explains why captureError
 * must never live in it, and the failure bar's explains why it does not mount
 * GuestHeader. A scan that reads prose refuses the explanation as if it were
 * the offence.
 */
function code(rel: string): string {
  return read(rel)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      return !t.startsWith("//") && !t.startsWith("*");
    })
    .join("\n");
}

/** The five boundaries that MUST report a render crash. */
const CRASH_FILES = [
  "src/app/error.tsx",
  "src/app/global-error.tsx",
  "src/app/(app)/error.tsx",
  "src/app/(guest)/error.tsx",
  "src/app/(auth)/error.tsx",
  "src/app/admin/error.tsx",
  "src/app/(marketing)/error.tsx",
  "src/components/shared/route-error.tsx",
  "src/components/marketing/marketing-route-error.tsx",
];

/**
 * Every file that draws a failure screen, and the way out to a person it must
 * pass. ★ The marketing 404 is the one exception, and it is named rather than
 * omitted: `Visit the help center` is a full ACTION on that screen and
 * `contact us` sits in its footnote, so a `help` line would name /help twice,
 * three lines apart, on the one screen `ways-out=guided` was generalizing FROM.
 * A call stated in the errors-wiring Handoff, Will's to overrule; if he does,
 * this row moves up into the list above it.
 */
const FAILURE_FILES = [
  "src/app/(app)/not-found.tsx",
  "src/app/admin/not-found.tsx",
  "src/app/(guest)/e/[token]/not-found.tsx",
  "src/components/shared/route-error.tsx",
  "src/components/marketing/marketing-route-error.tsx",
];
const NO_HELP_LINE = {
  "src/components/marketing/marketing-not-found.tsx":
    "the help center is one of its two actions and contact is in its footnote",
  // The private lock and the admin host's refused path are dead ends for a
  // reader with no session and no event: each offers one way out and no
  // support line, which is the shape Will ruled on both steps.
  "src/app/(guest)/e/[token]/page.tsx": "the private lock offers one way home",
  "src/components/admin/admin-not-found-screen.tsx":
    "a stranger on the admin host gets the portal and nothing else",
};

describe("the digest: a crash carries a code, a 404 cannot", () => {
  it("renders no code and no Copy without a digest", () => {
    render(
      <NotFoundScreen
        icon={CircleAlert}
        title="We couldn't find that event"
        description="It may have been deleted."
        actions={null}
      />,
    );
    expect(screen.queryByRole("button", { name: /copy/i })).toBeNull();
    expect(screen.queryByText(/helps us find what happened/i)).toBeNull();
  });

  it("renders the code, the Copy control and the sentence with one", () => {
    render(
      <NotFoundScreen
        icon={CircleAlert}
        title="Something went wrong"
        description="That is on us."
        actions={null}
        digest="f3a91c7e"
      />,
    );
    expect(
      screen.getByText(/This helps us find what happened if you tell us/i),
    ).toBeTruthy();
    const button = screen.getByRole("button", { name: /copy error code/i });
    expect(button.textContent).toContain("f3a91c7e");
  });

  it("copies the digest and confirms it in a live region", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    render(<ErrorDigest digest="f3a91c7e" />);

    await userEvent.click(screen.getByRole("button", { name: /copy/i }));
    expect(writeText).toHaveBeenCalledWith("f3a91c7e");
    expect(await screen.findByRole("button", { name: /copied/i })).toBeTruthy();
    vi.unstubAllGlobals();
  });

  it("survives a clipboard that rejects, and still shows the code", async () => {
    // An iframe with no clipboard-write permission, a locked-down profile, or
    // any insecure context. A failed copy must never throw on a screen whose
    // whole job is to survive a crash.
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    render(<ErrorDigest digest="f3a91c7e" />);

    await userEvent.click(screen.getByRole("button", { name: /copy/i }));
    expect(writeText).toHaveBeenCalled();
    expect(screen.getByText("f3a91c7e")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /copied/i })).toBeNull();
    vi.unstubAllGlobals();
  });

  it("survives a missing clipboard API entirely", async () => {
    vi.stubGlobal("navigator", { ...navigator, clipboard: undefined });
    render(<ErrorDigest digest="f3a91c7e" />);
    await userEvent.click(screen.getByRole("button", { name: /copy/i }));
    expect(screen.getByText("f3a91c7e")).toBeTruthy();
    vi.unstubAllGlobals();
  });
});

describe("the screen: one picture, and one way to a person", () => {
  it("draws the visual in the icon's place, never both", () => {
    render(
      <NotFoundScreen
        visual={<div data-testid="strip" />}
        title="We lost this page"
        description="The link may be broken."
        actions={null}
      />,
    );
    expect(screen.getByTestId("strip")).toBeTruthy();
    // The icon circle is the only other thing that can occupy slot 0.
    expect(document.querySelectorAll("[style*='--nf-i: 0']").length).toBe(1);
  });

  it("gives the help line its own stagger slot, below the actions", () => {
    render(
      <NotFoundScreen
        icon={CircleAlert}
        title="Something went wrong"
        description="That is on us."
        actions={<button type="button">Try again</button>}
        help={<HelpLine href="/help">Visit the help center</HelpLine>}
      />,
    );
    const help = screen.getByText(/Still stuck/i).closest("[style]");
    expect(help?.getAttribute("style")).toContain("--nf-i: 3");
  });

  it("renders the admin's line without a link, since no runbook exists yet", () => {
    render(<HelpLine>Check the runbook</HelpLine>);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText(/Check the runbook/)).toBeTruthy();
  });
});

describe("what reports, and what must never", () => {
  it("keeps Sentry out of the shared primitive, so a 404 files nothing", () => {
    const src = code("src/components/shared/not-found-screen.tsx");
    expect(src).not.toMatch(/@sentry/);
    expect(src).not.toMatch(/captureError/);
  });

  it("keeps Sentry out of the digest leaf and both failure chromes", () => {
    for (const rel of [
      "src/components/shared/error-digest.tsx",
      "src/components/guest/guest-bar.tsx",
      "src/components/admin/admin-not-found-screen.tsx",
    ]) {
      const src = code(rel);
      expect(src, rel).not.toMatch(/@sentry|captureError/);
    }
  });

  it("reports from every crash boundary", () => {
    for (const rel of CRASH_FILES) {
      const src = code(rel);
      // Either it captures itself, or it mounts one of the two wrappers that do.
      expect(/captureError|RouteError|MarketingRouteError/.test(src), rel).toBe(
        true,
      );
    }
  });
});

describe("every failure page offers a way to a person", () => {
  it("passes a help line, or is one of the three named exceptions", () => {
    for (const rel of FAILURE_FILES) {
      expect(code(rel), rel).toContain("help=");
    }
    for (const rel of Object.keys(NO_HELP_LINE)) {
      expect(code(rel), rel).not.toContain("help={<HelpLine");
    }
  });

  it("finds the failure files at all", () => {
    // The round-0 rule: a scan that reads nothing is a broken scan.
    expect(FAILURE_FILES.length + Object.keys(NO_HELP_LINE).length).toBe(8);
  });
});

describe("the two session-less chromes stay session-less", () => {
  it("asks no database and mounts no server action", () => {
    for (const rel of [
      "src/components/guest/guest-bar.tsx",
      "src/components/admin/admin-not-found-screen.tsx",
    ]) {
      const src = code(rel);
      expect(src, rel).not.toMatch(/supabase|requireAdmin|signOutAction/i);
      expect(src, rel).not.toMatch(/\bfetch\(/);
    }
  });

  it("keeps the real guest header off both guest failure screens", () => {
    // GuestHeader resolves a session on mount and fetches /api/me/menu with an
    // eventId neither screen has; a crash boundary must not go asking the
    // network for the data whose absence may be what crashed the page.
    for (const rel of [
      "src/app/(guest)/error.tsx",
      "src/app/(guest)/e/[token]/not-found.tsx",
    ]) {
      const src = code(rel);
      expect(src, rel).toContain("GuestBar");
      expect(src, rel).not.toContain("GuestHeader");
    }
  });
});
