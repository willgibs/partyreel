/**
 * THE HOST'S EVENT WRITE PATCHES EXACTLY WHAT THE SAVE CARRIED.
 *
 * `updateEvent` writes every key that is defined, so the schema in front of it decides what a
 * save touches. A one-field save (the QR designer's `{ qr_style }`, the review room's
 * `{ moderation_mode }`) must reach the database as that one column: any other key in the patch
 * is a setting the host never moved (a password album opened, paused uploads reopened, held
 * uploads approved). A recording fake stands in for the query builder, because the PATCH is the
 * contract and no type-check verifies it.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateEventSchema } from "@/lib/validation/event";

vi.mock("server-only", () => ({}));

const patches: Record<string, unknown>[] = [];
const reads: string[] = [];

function eventsBuilder() {
  const builder = {
    update(patch: Record<string, unknown>) {
      patches.push(patch);
      return builder;
    },
    select(columns: string) {
      reads.push(columns);
      return builder;
    },
    eq: () => builder,
    is: () => builder,
    single: () => Promise.resolve({ data: { id: "event-1" }, error: null }),
    maybeSingle: () =>
      Promise.resolve({
        data: { event_password_hash: "$2b$hash" },
        error: null,
      }),
  };
  return builder;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        getUser: () =>
          Promise.resolve({ data: { user: { id: "host-1" } }, error: null }),
      },
      from: () => eventsBuilder(),
    }),
}));

const { updateEvent } = await import("@/lib/db/mutations/events");

beforeEach(() => {
  patches.length = 0;
  reads.length = 0;
});

describe("updateEvent: the patch is the save, nothing more", () => {
  it("writes one column for a QR style save", async () => {
    const result = await updateEvent(
      "event-1",
      updateEventSchema.parse({ qr_style: "rounded" }),
    );
    expect(result.ok).toBe(true);
    expect(patches).toEqual([{ qr_style: "rounded" }]);
  });

  it("writes one column for the review room's switch", async () => {
    await updateEvent(
      "event-1",
      updateEventSchema.parse({ moderation_mode: "hold_for_approval" }),
    );
    expect(patches).toEqual([{ moderation_mode: "hold_for_approval" }]);
  });

  it("writes an empty patch for an empty save (it invents no setting)", async () => {
    await updateEvent("event-1", updateEventSchema.parse({}));
    expect(patches).toEqual([{}]);
  });

  it("writes every field a whole-form save sends, each as sent", async () => {
    await updateEvent(
      "event-1",
      updateEventSchema.parse({
        name: "Backyard party",
        description: "",
        event_date: "",
        visibility: "private",
        accepting_uploads: false,
        require_verified_email: false,
        require_upload_to_view: true,
        moderation_mode: "hold_for_approval",
        max_upload_bytes: null,
      }),
    );
    expect(patches).toEqual([
      {
        name: "Backyard party",
        description: null,
        event_date: null,
        visibility: "private",
        accepting_uploads: false,
        require_verified_email: false,
        require_upload_to_view: true,
        moderation_mode: "hold_for_approval",
        max_upload_bytes: null,
      },
    ]);
  });
});
