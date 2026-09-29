import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * WHERE THE HELP PALETTE LIVES (help-center r1 `search=visible`, Will: "admin can create its own
 * component version of the command palette ... this help palette should have zero conflicts with
 * where they get used (admin vs main platform)"). The mount stays local; the header's Resources
 * panel, the footer's Resources column and the phone menu ring it (help-search-signal.ts) and never
 * mount a second one; and the admin portal never touches it, so its own palette (admin-palette.tsx,
 * on ui/command-palette) is the only ⌘K there.
 *
 * Two halves: the source says where it mounts (a static scan, so a new mount is a decision someone
 * makes here), and the bell does what it says in a real render.
 */

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name))
      out.push(path);
  }
  return out;
}

const SOURCES = walk(SRC).map((path) => ({
  file: relative(ROOT, path),
  text: readFileSync(path, "utf8"),
}));

/** Files that render the provider (a JSX use, not a mention in a comment). */
function mountsOf(): string[] {
  return SOURCES.filter(({ text }) => /<HelpPaletteProvider\b/.test(text)).map(
    ({ file }) => file,
  );
}

describe("the help palette's mounts", () => {
  it("mounts under /help and on /contact, and nowhere else in the product", () => {
    const product = mountsOf().filter(
      // The lab's boards draw it inside their own frames; they are not the product.
      (file) => !file.startsWith("src/app/(dev)/"),
    );
    expect(product.sort()).toEqual([
      "src/app/(marketing)/(cinema)/help/layout.tsx",
      "src/app/(marketing)/(paper)/contact/page.tsx",
    ]);
  });

  it("never reaches the admin portal, which keeps its own palette", () => {
    const admin = SOURCES.filter(
      ({ file }) =>
        file.startsWith("src/app/admin/") ||
        file.startsWith("src/components/admin/") ||
        file.startsWith("src/lib/admin/"),
    );
    expect(admin.length).toBeGreaterThan(0);
    for (const { file, text } of admin) {
      expect(text, file).not.toMatch(/marketing\/help\//);
      expect(text, file).not.toMatch(/HelpPaletteProvider|HelpSearchTrigger/);
    }
  });

  it("keeps the chrome's Search rows on the bell, never a second provider", () => {
    const chrome = SOURCES.filter(({ file }) =>
      file.startsWith("src/components/marketing/chrome/"),
    );
    const rows = chrome.filter(({ text }) => /<HelpSearchLink\b/.test(text));
    expect(rows.map(({ file }) => file).sort()).toEqual([
      "src/components/marketing/chrome/marketing-footer.tsx",
      "src/components/marketing/chrome/mega-panel.tsx",
      "src/components/marketing/chrome/mobile-menu.tsx",
    ]);
    for (const { file, text } of chrome) {
      expect(text, file).not.toMatch(/help-palette/);
    }
  });
});

/* ── The bell, in a real render ────────────────────────────────────────────────────────── */

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/help",
}));

const { HelpPaletteProvider, HelpSearchTrigger } =
  await import("@/components/marketing/help/help-palette");
const { HelpSearchLink } =
  await import("@/components/marketing/help/help-search-link");
const { markHelpSearchArrival, requestHelpSearch } =
  await import("@/components/marketing/help/help-search-signal");

const QUICK = [
  {
    label: "What's on the free plan?",
    href: "/help/what-the-free-plan-includes",
  },
];

/** The arrival is read on the next frame (help-palette.tsx says why). */
async function nextFrame() {
  await act(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  });
}

function Palette({ children }: { children?: React.ReactNode }) {
  return (
    <HelpPaletteProvider index={[]} quickLinks={QUICK}>
      <HelpSearchTrigger variant="hero" />
      {children}
    </HelpPaletteProvider>
  );
}

beforeEach(() => {
  push.mockReset();
  window.history.replaceState(null, "", "/help");
});

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("the bell", () => {
  it("goes unanswered where no palette is mounted, so the row goes to /help", () => {
    expect(requestHelpSearch()).toBe(false);
    render(<HelpSearchLink>Search</HelpSearchLink>);
    const link = screen.getByRole("link", { name: "Search" });
    expect(link.getAttribute("href")).toBe("/help?search");
  });

  it("is answered in place by a mounted palette, which opens on its Suggested list", () => {
    render(<Palette />);
    let answered = false;
    act(() => {
      answered = requestHelpSearch();
    });
    expect(answered).toBe(true);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("What's on the free plan?")).toBeTruthy();
  });

  it("stops listening when the palette leaves, so a later page cannot answer for it", () => {
    const { unmount } = render(<Palette />);
    unmount();
    expect(requestHelpSearch()).toBe(false);
  });

  it("opens the palette on a Search row's click without leaving the page", () => {
    render(
      <Palette>
        <HelpSearchLink>Search</HelpSearchLink>
      </Palette>,
    );
    fireEvent.click(screen.getByRole("link", { name: "Search" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
  });

  it("opens on arrival from ?search, then takes the query off the address", async () => {
    window.history.replaceState(null, "", "/help?search");
    render(<Palette />);
    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(window.location.search).toBe("");
  });

  it("opens on a client arrival marked by the row, and only once", async () => {
    markHelpSearchArrival();
    const first = render(<Palette />);
    expect(await screen.findByRole("dialog")).toBeTruthy();
    first.unmount();
    render(<Palette />);
    await nextFrame();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("stays shut on a plain visit", async () => {
    render(<Palette />);
    await nextFrame();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
