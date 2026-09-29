/**
 * THE FEEDBACK BEACON'S ONE READ: the summary's jsonb, parsed row by row (a changed shape drops a
 * row rather than drawing a wrong number), and a failed read THROWS, because "No feedback yet" is
 * the one answer a broken read must never impersonate.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  FakeRpcError,
  type FakePostgrest,
} from "@/lib/db/testing/fake-postgrest";

const state = vi.hoisted(() => ({ fake: null as FakePostgrest | null }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(state.fake!),
}));

const { getArticleFeedbackSummary, parseArticleFeedbackSummary } =
  await import("@/lib/db/queries/article-feedback");

const SUMMARY = [
  {
    slug: "you-cant-sign-in",
    helpful: 1,
    not_helpful: 0,
    last_at: "2026-09-29T00:35:22.600046+00:00",
  },
  {
    slug: "an-upload-wont-finish",
    helpful: 1,
    not_helpful: 2,
    last_at: "2026-09-28T23:45:22.600046+00:00",
  },
];

beforeEach(() => {
  state.fake = null;
});

describe("parseArticleFeedbackSummary", () => {
  it("keeps the SQL's order, newest click first", () => {
    expect(parseArticleFeedbackSummary(SUMMARY)).toEqual([
      {
        slug: "you-cant-sign-in",
        helpful: 1,
        notHelpful: 0,
        lastAt: "2026-09-29T00:35:22.600046+00:00",
      },
      {
        slug: "an-upload-wont-finish",
        helpful: 1,
        notHelpful: 2,
        lastAt: "2026-09-28T23:45:22.600046+00:00",
      },
    ]);
  });

  it("drops a row whose shape changed rather than drawing a wrong number", () => {
    expect(
      parseArticleFeedbackSummary([
        { slug: "a", helpful: -1, not_helpful: 0, last_at: "x" },
        { slug: "b", helpful: 1.5, not_helpful: 0, last_at: "x" },
        { slug: 3, helpful: 1, not_helpful: 0, last_at: "x" },
        { slug: "c", helpful: 1, not_helpful: 0 },
        null,
        "d",
        { slug: "e", helpful: "2", not_helpful: "0", last_at: "x" },
      ]),
    ).toEqual([{ slug: "e", helpful: 2, notHelpful: 0, lastAt: "x" }]);
  });

  it("reads anything that is not a list as no rows", () => {
    expect(parseArticleFeedbackSummary(null)).toEqual([]);
    expect(parseArticleFeedbackSummary({ slug: "a" })).toEqual([]);
  });
});

describe("getArticleFeedbackSummary", () => {
  it("reads the one jsonb answer of article_feedback_summary", async () => {
    // PostgREST hands a jsonb array back as the body itself, which is what the fake's array
    // answer resolves to as well.
    state.fake = createFakePostgrest({
      rpc: { article_feedback_summary: () => SUMMARY },
    });
    const rows = await getArticleFeedbackSummary();
    expect(rows.map((r) => r.slug)).toEqual([
      "you-cant-sign-in",
      "an-upload-wont-finish",
    ]);
    expect(state.fake.requests).toHaveLength(1);
    expect(state.fake.requests[0]).toMatchObject({
      target: "rpc",
      name: "article_feedback_summary",
    });
  });

  it("throws on a failed read, never answering with an empty page", async () => {
    state.fake = createFakePostgrest({
      rpc: {
        article_feedback_summary: () => {
          throw new FakeRpcError(
            "PGRST202",
            "function not in the schema cache",
          );
        },
      },
    });
    await expect(getArticleFeedbackSummary()).rejects.toThrow(
      /article_feedback_summary/,
    );
  });
});
