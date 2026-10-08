import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * HER NEWEST PHOTOGRAPHS' PREVIEWS, FOR THE LIGHT OF HER PAGE'S INVITATION (`account-moments` r2, `invite=plate`). Pinned:
 * it asks the RPC (which answers for `auth.uid()`) for a bounded few rows; keeps the six newest PHOTOGRAPHS that have a
 * preview, in the order the function gave them (clips and previewless uploads are passed over, never replaced by an
 * original); signs previews and nothing else, with the stable link; hands over her seed as a hash and never her id;
 * answers nothing for nobody; and throws a failed read for the caller to decide.
 */

vi.mock("server-only", () => ({}));

type Row = {
  type: "photo" | "video";
  preview_key: string | null;
  original_key: string;
};
let user: { id: string } | null = { id: "her-id" };
let rows: Row[] = [];
let error: unknown = null;
const asked: Record<string, unknown>[] = [];
const signed: { key: string; stable?: boolean }[] = [];

vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({
    user,
    supabase: {
      rpc: async (name: string, args: Record<string, unknown>) => {
        expect(name).toBe("get_my_uploads");
        asked.push(args);
        return { data: error ? null : rows, error };
      },
    },
  }),
}));
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: async (args: { key: string; stable?: boolean }) => {
    signed.push(args);
    return `signed:${args.key}`;
  },
}));
vi.mock("@/lib/avatar/seed", () => ({
  seedFor: (id: string) => `seed-of-${id}`,
}));

const { getInviteLight, INVITE_LIGHT_PHOTOS } = await import("./invite-light");

const photo = (n: number, preview: boolean = true): Row => ({
  type: "photo",
  preview_key: preview ? `preview-${n}` : null,
  original_key: `original-${n}`,
});

beforeEach(() => {
  user = { id: "her-id" };
  rows = [];
  error = null;
  asked.length = 0;
  signed.length = 0;
});

describe("getInviteLight", () => {
  it("★ asks for a bounded few rows, never her whole roll", async () => {
    await getInviteLight();
    expect(asked).toHaveLength(1);
    expect(asked[0]).toEqual({ p_limit: 18 });
  });

  it("keeps the six newest photographs that have a preview, in the function's order", async () => {
    rows = Array.from({ length: 12 }, (_, i) => photo(i));
    const light = await getInviteLight();
    expect(INVITE_LIGHT_PHOTOS).toBe(6);
    expect(light!.photos).toEqual([
      "signed:preview-0",
      "signed:preview-1",
      "signed:preview-2",
      "signed:preview-3",
      "signed:preview-4",
      "signed:preview-5",
    ]);
  });

  it("★ passes over a clip and an upload with no preview, and signs previews only, never an original", async () => {
    rows = [
      photo(0, false),
      { type: "video", preview_key: "poster-1", original_key: "clip-1" },
      photo(2),
      photo(3),
    ];
    const light = await getInviteLight();
    expect(light!.photos).toEqual(["signed:preview-2", "signed:preview-3"]);
    expect(signed.map((s) => s.key)).toEqual(["preview-2", "preview-3"]);
    // The stable link, so a view's links repeat inside a window instead of minting a new one each time.
    expect(signed.every((s) => s.stable === true)).toBe(true);
  });

  it("is her seed with no photographs for a roll that has none: the plate is lit by her colour then", async () => {
    const light = await getInviteLight();
    expect(light).toEqual({ photos: [], seed: "seed-of-her-id" });
  });

  it("hands over the hash that colours her and never her id", async () => {
    const light = await getInviteLight();
    expect(JSON.stringify(light)).not.toContain('"her-id"');
    expect(light!.seed).toBe("seed-of-her-id");
  });

  it("★ answers nothing for nobody, and asks nothing", async () => {
    user = null;
    expect(await getInviteLight()).toBeNull();
    expect(asked).toEqual([]);
  });

  it("throws a failed read for the caller to decide", async () => {
    error = new Error("rpc failed");
    await expect(getInviteLight()).rejects.toThrow("rpc failed");
    expect(signed).toEqual([]);
  });
});
