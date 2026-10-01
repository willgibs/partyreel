import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { getArticle } from "@/lib/content/help";

/**
 * THE DOORS THE HELP NAMES ARE WHERE IT SAYS (crumbs-34). `help-ui-labels.test.ts` holds that every
 * quoted label exists SOMEWHERE in the app; it cannot hold WHERE, and the help-sync lines the ROADMAP
 * kept were all that gap: Add photos sent to "a row of buttons under the event name and a floating
 * button" after it moved into the album's own header, and "buying happens on the pricing page" after the
 * app opened its own plans from the Plan card and the storage meter. So the two surfaces those articles
 * point at are held here against the source that draws them, and the retired wordings are refused.
 */
const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");
const body = (slug: string) => {
  const article = getArticle(slug);
  expect(article, `no article ${slug}`).not.toBeNull();
  return article!.body;
};
const labelsIn = (text: string) =>
  [...text.matchAll(/<UiLabel>([\s\S]*?)<\/UiLabel>/g)].map((m) => m[1]);

/** The section of an article from its `## heading` to the next one. */
function section(slug: string, heading: string): string {
  const text = body(slug);
  const start = text.indexOf(`## ${heading}`);
  expect(start, `${slug} has no "## ${heading}"`).toBeGreaterThan(-1);
  return text.slice(start).split(/\n## /)[0];
}

describe("the host album's header, as the help describes it", () => {
  // The header is the album's own: Add photos, Download, Select and one View menu (Tile size, Sort, Filter).
  const header = [
    "src/components/app/event-feed/event-gallery.tsx",
    "src/components/app/event-feed/gallery-actions.tsx",
    "src/components/app/export/download-all-button.tsx",
    "src/components/shared/view-menu.tsx",
  ]
    .map(read)
    .join("\n");

  it("every control the event page article names in its album paragraph is drawn there", () => {
    const labels = labelsIn(section("your-event-page-explained", "The album"));
    expect(labels).toEqual(
      expect.arrayContaining(["Add photos", "Download", "Select", "View"]),
    );
    for (const label of labels) {
      expect(header, `"${label}" is not in the album's header`).toContain(
        label,
      );
    }
  });

  it("the add-your-own-photos article sends a host to that header, and to the panel it opens", () => {
    const text = section("add-your-own-photos", "Adding a batch");
    expect(text).toContain("album's own header");
    const panel = read("src/components/app/host-upload.tsx");
    for (const label of labelsIn(text)) {
      expect(
        header + panel,
        `"${label}" is not in the album's header or its upload panel`,
      ).toContain(label);
    }
  });

  it("no article describes the retired control row", () => {
    for (const slug of ["your-event-page-explained", "add-your-own-photos"]) {
      expect(body(slug), slug).not.toMatch(
        /row of buttons under the event name|floating button|a control for tile size|<UiLabel>Deleted<\/UiLabel> toggle/,
      );
    }
  });
});

describe("the plan's doors, as the billing articles describe them", () => {
  const plan = read("src/app/(app)/account/page.tsx");
  const meter = read("src/components/app/dashboard/storage-meter.tsx");
  const menu = read("src/components/app/user-menu.tsx");
  const portal = read("src/components/app/manage-billing-button.tsx");

  it("the Plan card carries Upgrade or Change plan, Manage billing and Renew, and the menu opens it", () => {
    expect(plan).toContain('"Upgrade"');
    expect(plan).toContain('"Change plan"');
    expect(plan).toContain("<ManageBillingButton />");
    expect(plan).toContain("Renew {planById");
    expect(plan).toContain('id="plan"');
    expect(menu).toContain('href="/account#plan"');
    expect(menu).toContain("Plan and storage");
    expect(portal).toContain("Manage billing");
  });

  it("the storage meter carries Need more? or Change plan, Renew Event Pass and Manage billing", () => {
    expect(meter).toContain("Need more?");
    expect(meter).toContain("Change plan");
    expect(meter).toContain("Renew Event Pass");
    expect(meter).toContain("<ManageBillingButton />");
  });

  it("the articles that say where to buy name the app's doors, never the pricing page alone", () => {
    for (const slug of [
      "upgrade-downgrade-or-cancel",
      "what-the-free-plan-includes",
      "what-happens-when-storage-fills-up",
      "payments-receipts-and-invoices",
      "how-long-an-event-pass-lasts",
    ]) {
      const text = body(slug);
      expect(text, slug).toMatch(
        /<UiLabel>(?:Upgrade|Need more\?|Change plan)<\/UiLabel>/,
      );
    }
    // Billing's home is the Plan card; the storage meter is a second door, never "the only" one.
    expect(body("your-dashboard-explained")).toContain(
      "<UiLabel>Plan and storage</UiLabel>",
    );
    expect(body("your-dashboard-explained")).not.toMatch(/only billing/i);
    expect(body("payments-receipts-and-invoices")).not.toContain(
      "<Path>Dashboard › storage meter › Manage billing</Path>",
    );
  });
});
