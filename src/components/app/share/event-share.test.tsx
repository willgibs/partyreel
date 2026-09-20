// @contract-for: src/components/app/share/event-share-provider.tsx
// @contract-for: src/components/app/share/event-code-door.tsx
// @contract-for: src/components/app/share/event-code-modal.tsx
// @contract-for: src/components/app/share/event-link-row.tsx
// @contract-for: src/components/app/share/event-share-sheet.tsx
// @contract-for: src/components/app/share/event-sheets.tsx
// @contract-for: src/components/app/share/use-copy-link.ts

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EventLinkRow } from "@/components/app/share/event-link-row";
import { CODE_MORPH_NAME } from "@/components/app/share/event-share-provider";

/**
 * SHARING, AS ONE SURFACE AND ONE OBJECT (Will's `share=room` with his override
 * to a sheet, and his `event=hub` note: "Get the QR and sharing more infusion
 * to the album UI visually").
 *
 * What this guards is FUNCTION, and specifically the four ways this wiring can
 * break SILENTLY:
 *
 *  1. The morph's NAME is a string shared between TypeScript and a stylesheet.
 *     A rename on one side drops the timing with no error at all — the lesson
 *     `marketing-css-policy.test.ts` was written from, applied to the app's
 *     first view transition.
 *  2. A code or a copy control that encodes the PRETTY url instead of the
 *     permanent one. A slug can be released; a code already printed on a table
 *     card cannot be reprinted, so this one is a data-loss bug wearing a
 *     cosmetic disguise.
 *  3. The sheets losing the URL, or the mini-modal gaining one.
 *  4. Two elements carrying the morph's name at once, which the browser
 *     resolves by silently skipping the transition.
 *
 * No class, size, word or duration is pinned.
 */

const ROOT = process.cwd();
const DIR = "src/components/app/share";
const read = (file: string) => readFileSync(join(ROOT, DIR, file), "utf8");

describe("the code's morph", () => {
  it("binds one name across the module and the stylesheet", () => {
    const css = read("share.css");
    expect(
      css.includes(`::view-transition-group(${CODE_MORPH_NAME})`),
      "share.css does not target the name the provider hands out",
    ).toBe(true);
  });

  it("scopes every view-transition rule to that name, never to a wildcard", () => {
    // `::view-transition-*` are DOCUMENT-GLOBAL. A wildcard here would own the
    // two marketing morphs and every future one in the product.
    //
    // Comments are stripped first: the sheet's own prose NAMES the wildcard in
    // order to explain why it is banned, and a scan that reads the explanation
    // as the offence is a test that can only be passed by deleting the reason.
    const css = read("share.css").replace(/\/\*[\s\S]*?\*\//g, "");
    const groups = [...css.matchAll(/::view-transition-[a-z-]+\(([^)]+)\)/g)].map(
      (m) => m[1].trim(),
    );
    expect(groups.length, "found the view-transition rules at all").toBeGreaterThan(0);
    expect(
      groups.filter((g) => g !== CODE_MORPH_NAME),
      "a view-transition rule that is not scoped to this morph's own name",
    ).toEqual([]);
  });

  it("hands the name to exactly one element at a time", () => {
    // The provider decides by what is ON SCREEN, so the three call sites all
    // ask the same question and only one can answer yes.
    const provider = read("event-share-provider.tsx");
    expect(
      /owner === morphOwner \? CODE_MORPH_NAME : undefined/.test(provider),
      "morphNameFor stopped being a single-owner decision",
    ).toBe(true);
    for (const [file, owner] of [
      ["event-code-door.tsx", "header"],
      ["event-code-modal.tsx", "modal"],
    ] as const) {
      expect(
        read(file).includes(`morphNameFor("${owner}")`),
        `${file} does not take its name from the provider`,
      ).toBe(true);
    }
  });

  it("never starts a transition under reduced motion", () => {
    const provider = read("event-share-provider.tsx");
    expect(
      /if \(!start \|\| reduced\)/.test(provider),
      "the reduced-motion guard left the morph",
    ).toBe(true);
  });
});

describe("what the sharing surfaces encode", () => {
  it("gives the code and every copy control the PERMANENT link", () => {
    // The pretty url is for reading aloud. Anything a guest can keep — a
    // scanned code, a pasted link — must be the qr_token url.
    const modal = read("event-code-modal.tsx");
    expect(
      /<StyledQr[\s\S]{0,200}value=\{joinUrl\}/.test(modal),
      "the mini-modal's code stopped encoding the permanent link",
    ).toBe(true);
    expect(
      /useCopyLink\(joinUrl\)/.test(modal),
      "the mini-modal copies something other than the permanent link",
    ).toBe(true);
    expect(
      /useCopyLink\(permanentUrl\)/.test(read("event-link-row.tsx")),
      "the link row copies the pretty url",
    ).toBe(true);
    expect(
      /useCopyLink\(joinUrl\)/.test(read("event-share-sheet.tsx")),
      "the share sheet copies something other than the permanent link",
    ).toBe(true);
  });

  it("shows the readable link and copies the permanent one", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(
      <EventLinkRow
        prettyUrl="https://partyreel.com/sarah-and-tom"
        permanentUrl="https://partyreel.com/e/tok_123"
      />,
    );
    // What a host READS.
    expect(screen.getAllByText(/sarah-and-tom/).length).toBeGreaterThan(0);
    await userEvent.click(
      screen.getByRole("button", { name: /copy the link/i }),
    );
    // What lands on the clipboard.
    expect(writeText).toHaveBeenCalledWith("https://partyreel.com/e/tok_123");
  });

  it("confirms a copy in place and says so once in a live region", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const { container } = render(
      <EventLinkRow
        prettyUrl="https://partyreel.com/e/tok_123"
        permanentUrl="https://partyreel.com/e/tok_123"
      />,
    );
    const live = container.querySelector("[aria-live]");
    expect(live, "the copy control has no live region").toBeTruthy();
    expect(live!.textContent).toBe("");
    await userEvent.click(
      screen.getByRole("button", { name: /copy the link/i }),
    );
    await waitFor(() => expect(live!.textContent).toMatch(/copied/i));
  });

  it("claims nothing when the clipboard refuses", async () => {
    // An insecure origin and a denied permission both reject. A control that
    // flashes "Copied" over a clipboard that never changed is worse than one
    // that does nothing.
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.assign(navigator, { clipboard: { writeText } });
    const { container } = render(
      <EventLinkRow
        prettyUrl="https://partyreel.com/e/tok_123"
        permanentUrl="https://partyreel.com/e/tok_123"
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /copy the link/i }),
    );
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(container.querySelector("[aria-live]")!.textContent).toBe("");
  });
});

describe("what rides the URL, and what does not", () => {
  it("puts the two sheets in history and keeps the mini-modal out of it", () => {
    const provider = read("event-share-provider.tsx");
    expect(
      /openSheet[\s\S]{0,400}history\.pushState/.test(provider),
      "opening a sheet no longer writes a history entry",
    ).toBe(true);
    // The code's open/close path must never touch history: a peek at a QR is
    // not a destination, and Back should leave the album, not close a modal.
    const openCode = provider.slice(provider.indexOf("const openCode"));
    const codeBlock = openCode.slice(0, openCode.indexOf("const morphOwner"));
    expect(
      /history\./.test(codeBlock),
      "the mini-modal started writing history entries",
    ).toBe(false);
  });

  it("keeps our marker a FIELD on the state Next merges, never the state itself", () => {
    // Next patches pushState to copy __NA + its internals tree onto whatever
    // object it is handed, and its popstate handler RELOADS THE PAGE when __NA
    // is missing. Replacing the state wholesale would turn the sheet's Back
    // into a full page reload.
    const provider = read("event-share-provider.tsx");
    expect(
      /pushState\(\s*\{ \[HISTORY_MARKER\]: true \}/.test(provider),
      "the history marker is no longer passed as a field on a state object",
    ).toBe(true);
    expect(
      /window\.history\.state[\s\S]{0,120}HISTORY_MARKER/.test(provider),
      "closing no longer checks whether the entry behind it is ours",
    ).toBe(true);
  });

  it("mounts the sheets outside the album, so the album survives them", () => {
    // Radix portals them; what matters here is that they are not rendered
    // INSIDE a section that a filter or a room could unmount.
    const sheets = read("event-sheets.tsx");
    expect(/EventShareSheet/.test(sheets) && /EventSettingsSheet/.test(sheets)).toBe(
      true,
    );
    const page = readFileSync(
      join(ROOT, "src/app/(app)/dashboard/[eventId]/page.tsx"),
      "utf8",
    );
    const sheetsAt = page.indexOf("<EventSheets");
    const galleryAt = page.indexOf("</EventGallery>");
    expect(sheetsAt, "the hub does not mount the sheets").toBeGreaterThan(-1);
    expect(
      sheetsAt > galleryAt,
      "the sheets moved inside the album's subtree",
    ).toBe(true);
  });

  it("opens with the page on a deep link, resolved on the server", () => {
    const page = readFileSync(
      join(ROOT, "src/app/(app)/dashboard/[eventId]/page.tsx"),
      "utf8",
    );
    expect(
      /initialSheet=\{resolveEventSheet\(room\)\}/.test(page),
      "?room= is no longer resolved server-side into the island's initial state",
    ).toBe(true);
  });
});
