/**
 * THE EVENT ROWS' DELETE (crumbs-75): one event a statement, in event-id order, so an event's cascade into its album
 * rows never holds two albums against the album log's prune, which takes them in that same order. On the PostgREST
 * fake, which records every request: the order and the shape of each DELETE are what this pins.
 */
import { describe, expect, it, vi } from "vitest";

import { QueryFailedError } from "@/lib/db/must-query";
import {
  asSupabase,
  createFakePostgrest,
} from "@/lib/db/testing/fake-postgrest";
import { NO_DEADLINE, type Deadline } from "@/lib/lifecycle/sweep-budget";

vi.mock("server-only", () => ({}));

const { deleteEventsInIdOrder } =
  await import("@/lib/lifecycle/sweeps/delete-events");

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

function world(ids: number[]) {
  const fake = createFakePostgrest({
    tables: { events: ids.map((n) => ({ id: id(n) })) },
  });
  return { fake, client: asSupabase(fake) };
}

/** Every events DELETE the fake saw: its one filter each. */
function deletes(fake: ReturnType<typeof world>["fake"]) {
  return fake.requests
    .filter((r) => r.name === "events" && r.method === "DELETE")
    .map((r) => r.filters);
}

describe("deleteEventsInIdOrder", () => {
  it("★ deletes each event in a statement of its own, in ascending id order, whatever order it was handed", async () => {
    const { fake, client } = world([1, 2, 3, 4, 5, 6]);
    const out = await deleteEventsInIdOrder(
      client,
      [id(5), id(2), id(4), id(2), id(1)],
      NO_DEADLINE,
      "test: delete events",
    );
    expect(out).toEqual({ deleted: 4, done: true });
    expect(deletes(fake)).toEqual(
      [1, 2, 4, 5].map((n) => [{ column: "id", op: "eq", value: id(n) }]),
    );
    expect(fake.tables.events.map((e) => e.id)).toEqual([id(3), id(6)]);
  });

  it("asks the deadline before every event, and leaves the rest standing for the next run", async () => {
    const { fake, client } = world([1, 2, 3]);
    let asked = 0;
    const deadline: Deadline = { at: 0, passed: () => asked++ >= 2 };
    const out = await deleteEventsInIdOrder(
      client,
      [id(3), id(1), id(2)],
      deadline,
      "test: delete events",
    );
    expect(out).toEqual({ deleted: 2, done: false });
    expect(fake.tables.events.map((e) => e.id)).toEqual([id(3)]);
  });

  it("does nothing for nothing", async () => {
    const { fake, client } = world([1]);
    expect(
      await deleteEventsInIdOrder(client, [], NO_DEADLINE, "test"),
    ).toEqual({ deleted: 0, done: true });
    expect(deletes(fake)).toEqual([]);
  });

  it("throws a failed delete under its label, never counting it as gone", async () => {
    const { fake, client } = world([1, 2]);
    delete (fake.tables as Record<string, unknown>).events;
    const thrown = await deleteEventsInIdOrder(
      client,
      [id(1)],
      NO_DEADLINE,
      "test: delete events",
    ).catch((e: unknown) => e);
    expect(thrown).toBeInstanceOf(QueryFailedError);
    expect(String(thrown)).toMatch(/test: delete events/);
  });
});
