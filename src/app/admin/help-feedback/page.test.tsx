import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE BEACON'S ADMIN SURFACE (help-center r1 `feedback=beacon`: "visible only in admin"): the counts
 * per article, newest first, with the signal's health above them. Pinned: the seam (nothing renders
 * below AAL2), the order and the numbers as the summary gives them, a row that loses its reader
 * tinted, and a failed read said in words, never drawn as "No feedback yet".
 */
const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(async () => ({ aal: "aal2" as "aal1" | "aal2" })),
  getArticleFeedbackSummary: vi.fn(async () => [] as unknown[]),
  getJobSignals: vi.fn(async () => ({}) as Record<string, unknown>),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/admin-context", () => ({
  requireAdmin: mocks.requireAdmin,
}));
vi.mock("@/lib/db/queries/article-feedback", () => ({
  getArticleFeedbackSummary: mocks.getArticleFeedbackSummary,
}));
vi.mock("@/lib/db/queries/jobs", () => ({
  getJobSignals: mocks.getJobSignals,
}));
vi.mock("@/lib/content/help", () => ({
  getArticle: (slug: string) =>
    slug === "retired-article"
      ? null
      : {
          slug,
          frontmatter: {
            title:
              slug === "you-cant-sign-in"
                ? "You can't sign in"
                : "An upload won't finish",
            category: "troubleshooting",
          },
        },
  getCategory: () => ({ title: "Troubleshooting" }),
}));

const { default: HelpFeedbackPage } = await import("./page");

async function mount() {
  const page = await HelpFeedbackPage();
  return render(<>{page}</>);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAdmin.mockResolvedValue({ aal: "aal2" });
  mocks.getArticleFeedbackSummary.mockResolvedValue([]);
  mocks.getJobSignals.mockResolvedValue({
    help_feedback: { ok24h: 3, failed24h: 0 },
  });
});

describe("/admin/help-feedback", () => {
  it("renders nothing below AAL2, and reads nothing", async () => {
    mocks.requireAdmin.mockResolvedValue({ aal: "aal1" });
    expect(await HelpFeedbackPage()).toBeNull();
    expect(mocks.getArticleFeedbackSummary).not.toHaveBeenCalled();
  });

  it("lists each article's counts in the summary's order, newest click first", async () => {
    mocks.getArticleFeedbackSummary.mockResolvedValue([
      {
        slug: "you-cant-sign-in",
        helpful: 4,
        notHelpful: 1,
        lastAt: "2026-09-29T00:35:22.600046+00:00",
      },
      {
        slug: "an-upload-wont-finish",
        helpful: 1,
        notHelpful: 2,
        lastAt: "2026-09-28T23:45:22.600046+00:00",
      },
    ]);
    await mount();
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText("You can't sign in")).toBeTruthy();
    expect(within(rows[0]).getByText("80%")).toBeTruthy();
    expect(within(rows[1]).getByText("An upload won't finish")).toBeTruthy();
    // No outnumbers Yes: the row is tinted, and only that one.
    expect(rows[0].getAttribute("data-tone")).toBeNull();
    expect(rows[1].getAttribute("data-tone")).toBe("warning");
    // The portal is its own host, so the article opens on the site, in a new tab.
    const link = within(rows[1]).getByRole("link");
    expect(link.getAttribute("href")).toMatch(/\/help\/an-upload-wont-finish$/);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(screen.getByText(/5 Yes, 3 No, on 2 articles/)).toBeTruthy();
    expect(screen.getByText(/3 recorded/)).toBeTruthy();
  });

  it("keeps a retired article's counts, and says it is no longer published", async () => {
    mocks.getArticleFeedbackSummary.mockResolvedValue([
      {
        slug: "retired-article",
        helpful: 0,
        notHelpful: 1,
        lastAt: "2026-09-28T23:45:22.600046+00:00",
      },
    ]);
    await mount();
    expect(screen.getByText("retired-article")).toBeTruthy();
    expect(screen.getByText("No longer published")).toBeTruthy();
  });

  it("says so in words when there is simply nothing yet", async () => {
    await mount();
    expect(screen.getByText("No feedback yet.")).toBeTruthy();
  });

  it("never draws an unreadable count as an empty one", async () => {
    mocks.getArticleFeedbackSummary.mockRejectedValue(
      new Error(
        "admin/help-feedback: article_feedback_summary: function not found",
      ),
    );
    await mount();
    expect(screen.getByText("The feedback could not be read")).toBeTruthy();
    expect(screen.queryByText("No feedback yet.")).toBeNull();
    expect(screen.queryByRole("table")).toBeNull();
  });
});
