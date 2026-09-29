import { describe, expect, it } from "vitest";

import { extractHeadings, getArticle } from "@/lib/content/help";
import {
  HELP_CENTER_HREF,
  NOT_APPROVED_HELP_HREF,
  UPLOAD_FAILED_HELP_HREF,
} from "@/lib/content/help-links";

/**
 * THE PRODUCT'S DOORS INTO HELP land where they say (help-center r1 `from-product=contextual`): a
 * renamed article or section fails here rather than on a guest's tap in the middle of a failed run.
 */
function resolves(href: string): { slug: string; anchor: string | null } {
  const [path, anchor = null] = href.split("#");
  const slug = path.replace(/^\/help\//, "");
  const article = getArticle(slug);
  expect(article, `${href}: no article "${slug}"`).not.toBeNull();
  if (anchor) {
    const ids = extractHeadings(article!.body).map((h) => h.id);
    expect(ids, `${href}: no heading "${anchor}"`).toContain(anchor);
  }
  return { slug, anchor };
}

describe("the product's doors into help", () => {
  it("sends the menus' standing row to the help center", () => {
    expect(HELP_CENTER_HREF).toBe("/help");
  });

  it("sends a failed upload to the article on uploads that will not finish", () => {
    expect(resolves(UPLOAD_FAILED_HELP_HREF).slug).toBe(
      "an-upload-wont-finish",
    );
  });

  it("sends a refused photo to the section that says what Not approved means", () => {
    const { slug, anchor } = resolves(NOT_APPROVED_HELP_HREF);
    expect(slug).toBe("a-photo-is-missing-from-the-album");
    expect(anchor).not.toBeNull();
    const body = getArticle(slug)!.body;
    // The section it lands on is the one that names the tracker's own word.
    const section = body.slice(body.indexOf("## The host turned it down"));
    expect(section).toContain("<UiLabel>Not approved</UiLabel>");
  });
});
