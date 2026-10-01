/**
 * THE CREDIT'S FACE AND DOOR, RESOLVED (crumbs-38; ROADMAP: "the viewer's credit takes a face and a door from an
 * `uploaderFace` ... that `getUploaderIdentities` and the item mappers do not resolve yet").
 *
 * Pinned, against profiles-social.md's consent line ("a door only to a page its owner published, a face only where
 * the album already shows one, never an address"): a confirmed sender wears their photograph and `seedFor`'s colour
 * (never an account id), a door only where a handle published a page; a typed name and nobody wear nothing; the
 * host wears the byline's face; on a GUEST's view a person the event blocked wears nothing (on no list, so no face
 * the album shows), while the host's view keeps it; the rule's owner (an account id) never leaves; a failed read
 * leaves the plain disc, captured, never a failed album; the window's people are read once, by account.
 *
 * HER OWN FACE, ON HER OWN PAGE (crumbs-45; build 36's red-team found a "?" disc on the owner's own upload in her
 * Uploads): her name, photograph and colour, never a door (she is on her page); no name, no face; read from her own
 * row through her own client, never the admin's; a failed read leaves the plain credit, captured.
 */
import { createHash } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
} from "@/lib/db/testing/fake-postgrest";
import {
  resolveUploaderIdentity,
  type UploaderIdentity,
} from "@/lib/media/uploader-identity";

let fake: FakePostgrest;
const captured: unknown[][] = [];

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(fake),
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: (...args: unknown[]) => captured.push(args),
  captureWarning: () => {},
}));
// The block list's one read (`event_blocked_guest_ids`, a uuid[] from SQL), answered here, its asks recorded.
const blockedAsked: string[] = [];
vi.mock("@/lib/db/queries/event-blocks", () => ({
  getBlockedGuestIds: async (eventId: string) => {
    blockedAsked.push(eventId);
    return new Set(["g-blocked"]);
  },
}));
vi.mock("@/lib/supabase/avatar-storage", () => ({
  getAvatarUrl: async (id: string, marker: string | null) =>
    marker ? `https://cdn.test/avatars/${id}/avatar.webp?v=${marker}` : null,
}));

const { ownUploadCredit, withUploaderFaces } = await import("./uploader-faces");

const seed = (id: string) => createHash("sha256").update(id).digest("hex");
const HOST = "u-host";

/** An identity by the one rule, from a media row's guest. */
function sender(
  guestId: string,
  over: {
    user_id?: string | null;
    verified_at?: string | null;
    display_name?: string | null;
    profile?: string | null;
  },
): UploaderIdentity {
  return resolveUploaderIdentity(
    {
      guest_id: guestId,
      guests: {
        user_id: over.user_id ?? null,
        email: null,
        display_name: over.display_name ?? null,
        verified_at: over.verified_at ?? null,
        profiles:
          over.profile === undefined ? null : { display_name: over.profile },
      },
    },
    "Will",
  );
}

const CONFIRMED = "2026-09-21T15:00:00.000000+00:00";

function identities(): Map<string, UploaderIdentity> {
  return new Map([
    // A confirmed guest with a photograph and a page.
    [
      "m-leah",
      sender("g-leah", {
        user_id: "u-leah",
        verified_at: CONFIRMED,
        profile: "Leah",
      }),
    ],
    // A confirmed guest with neither: the colour's disc, no door.
    [
      "m-sam",
      sender("g-sam", {
        user_id: "u-sam",
        verified_at: CONFIRMED,
        profile: "Sam",
      }),
    ],
    // A typed name, a real account behind it: no face, whatever the account holds.
    [
      "m-maya",
      sender("g-maya", {
        user_id: "u-leah",
        display_name: "Maya J.",
        profile: "Leah",
      }),
    ],
    // The host's own upload.
    [
      "m-host",
      resolveUploaderIdentity({ guest_id: null, guests: null }, "Will"),
    ],
    // A confirmed guest the event blocked (a photograph of theirs the host restored).
    [
      "m-blocked",
      sender("g-blocked", {
        user_id: "u-blocked",
        verified_at: CONFIRMED,
        profile: "Bo",
      }),
    ],
  ]);
}

beforeEach(() => {
  captured.length = 0;
  blockedAsked.length = 0;
  fake = createFakePostgrest({
    tables: {
      profiles: [
        { id: "u-leah", slug: "leah", avatar_updated_at: "2026-09-01" },
        { id: "u-sam", slug: null, avatar_updated_at: null },
        { id: "u-blocked", slug: "bo", avatar_updated_at: "2026-09-02" },
        { id: HOST, slug: "will", avatar_updated_at: "2026-09-03" },
      ],
      events: [
        {
          id: "ev-1",
          host_id: HOST,
          profiles: { slug: "will", avatar_updated_at: "2026-09-03" },
        },
      ],
    },
  });
});

describe("the credit's face and door", () => {
  it("★ a confirmed sender wears their photograph and colour, and a door only to a published page", async () => {
    const out = await withUploaderFaces("ev-1", identities(), "guest");
    expect(out.get("m-leah")?.face).toEqual({
      avatarUrl: "https://cdn.test/avatars/u-leah/avatar.webp?v=2026-09-01",
      seed: seed("u-leah"),
      href: "/u/leah",
    });
    // No photograph: the colour's disc. No handle: no door.
    expect(out.get("m-sam")?.face).toEqual({
      avatarUrl: null,
      seed: seed("u-sam"),
      href: null,
    });
  });

  it("★ a typed name wears no face, even with an account behind it", async () => {
    const out = await withUploaderFaces("ev-1", identities(), "guest");
    expect(out.get("m-maya")?.face).toBeNull();
    expect(out.get("m-maya")?.displayName).toBe("Maya J.");
  });

  it("the host's own upload wears the byline's face, and the host's page as its door", async () => {
    const out = await withUploaderFaces("ev-1", identities(), "guest");
    expect(out.get("m-host")?.face).toEqual({
      avatarUrl: `https://cdn.test/avatars/${HOST}/avatar.webp?v=2026-09-03`,
      seed: seed(HOST),
      href: "/u/will",
    });
  });

  it("★ on a guest's view, a person the event blocked keeps the plain disc and no door; the host's view keeps the face", async () => {
    const guest = await withUploaderFaces("ev-1", identities(), "guest");
    expect(guest.get("m-blocked")?.face).toBeNull();
    // The name stands as it always did: only the face and the door are withheld.
    expect(guest.get("m-blocked")?.displayName).toBe("Bo");

    const host = await withUploaderFaces("ev-1", identities(), "host");
    expect(host.get("m-blocked")?.face?.href).toBe("/u/bo");
    // The host's view never asks the block list at all: one ask, the guest's.
    expect(blockedAsked).toEqual(["ev-1"]);
  });

  it("★ never lets the rule's owner (an account id) travel past it, and never carries an address", async () => {
    const out = await withUploaderFaces("ev-1", identities(), "guest");
    for (const who of out.values()) {
      expect(Object.keys(who).sort()).toEqual([
        "displayName",
        "email",
        "face",
        "isHost",
        "isVerified",
      ]);
      if (who.face) {
        // A face is its three drawn fields: the photograph's public URL (the avatar bucket's own address, the
        // one every Guests list already paints), the hash and the door. No id field rides beside them.
        expect(Object.keys(who.face).sort()).toEqual([
          "avatarUrl",
          "href",
          "seed",
        ]);
      }
    }
  });

  it("reads the window's people once, by account, two columns", async () => {
    await withUploaderFaces("ev-1", identities(), "guest");
    const profileReads = fake.requests.filter((r) => r.name === "profiles");
    expect(profileReads).toHaveLength(1);
    expect(decodeURIComponent(profileReads[0].url)).toContain(
      "select=id,slug,avatar_updated_at",
    );
  });

  it("a failed read leaves the plain disc for the window, captured, never a failed album", async () => {
    delete fake.tables.profiles;
    const out = await withUploaderFaces("ev-1", identities(), "guest");
    expect([...out.values()].every((who) => who.face === null)).toBe(true);
    expect(out.get("m-leah")?.displayName).toBe("Leah");
    expect(captured.at(-1)?.[2]).toMatchObject({
      seam: "uploader_faces_fail_open",
      eventId: "ev-1",
    });
  });

  it("asks nothing when nobody in the window can wear a face", async () => {
    const out = await withUploaderFaces(
      "ev-1",
      new Map([["m-maya", identities().get("m-maya")!]]),
      "guest",
    );
    expect(out.get("m-maya")?.face).toBeNull();
    expect(fake.requests).toEqual([]);
  });
});

describe("her own face, on her own page", () => {
  const ME = "u-will";
  /** Her own client: her row, through `profiles_select_own`. */
  function mine(row: Record<string, unknown> | null) {
    const client = createFakePostgrest({
      tables: { profiles: row ? [{ id: ME, ...row }] : [] },
      user: { id: ME },
    });
    return {
      client,
      auth: {
        supabase: asSupabase(client) as never,
        user: { id: ME } as never,
      },
    };
  }

  it("★ wears her name, her photograph and her colour, and never a door: she is on her page", async () => {
    const { auth, client } = mine({
      display_name: "Will Gibson",
      avatar_updated_at: "2026-09-03",
    });
    expect(await ownUploadCredit(auth)).toEqual({
      name: "Will Gibson",
      face: {
        avatarUrl: `https://cdn.test/avatars/${ME}/avatar.webp?v=2026-09-03`,
        seed: seed(ME),
        href: null,
      },
    });
    // Her own row, through her own client: the admin client is never asked about her.
    expect(client.requests.map((r) => r.name)).toEqual(["profiles"]);
    expect(fake.requests).toEqual([]);
  });

  it("no photograph is her colour's disc, and no name is no face at all", async () => {
    expect(
      await ownUploadCredit(
        mine({ display_name: "Will Gibson", avatar_updated_at: null }).auth,
      ),
    ).toEqual({
      name: "Will Gibson",
      face: { avatarUrl: null, seed: seed(ME), href: null },
    });
    for (const display_name of [null, "   "]) {
      expect(
        await ownUploadCredit(
          mine({ display_name, avatar_updated_at: "2026-09-03" }).auth,
        ),
      ).toEqual({ name: null, face: null });
    }
  });

  it("asks nothing signed out", async () => {
    const { client } = mine(null);
    expect(
      await ownUploadCredit({
        supabase: asSupabase(client) as never,
        user: null,
      }),
    ).toEqual({ name: null, face: null });
    expect(client.requests).toEqual([]);
  });

  it("a failed read leaves the plain credit, captured, never a failed page", async () => {
    const { auth, client } = mine(null);
    delete client.tables.profiles;
    expect(await ownUploadCredit(auth)).toEqual({ name: null, face: null });
    expect(captured.at(-1)?.[2]).toMatchObject({
      seam: "own_upload_credit_fail_open",
    });
  });
});
