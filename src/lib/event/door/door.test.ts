import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  behindDoor,
  DOOR_GATES,
  DOORS,
  doorForStep,
  doorOf,
  gateOf,
  holdsEmailOn,
  stepOf,
  storedDoor,
} from "@/lib/event/door/door";

describe("the door and what the database stores", () => {
  it("round-trips every door through its stored pair", () => {
    for (const door of DOORS) {
      const { visibility, gate } = storedDoor(door);
      expect(doorOf(visibility, gate)).toBe(door);
    }
  });

  it("stores a gated album as private with its gate, and Only me as private with none", () => {
    expect(storedDoor("closed")).toEqual({ visibility: "private", gate: "closed" });
    expect(storedDoor("private")).toEqual({ visibility: "private", gate: null });
    expect(storedDoor("password")).toEqual({ visibility: "password", gate: null });
  });

  it("★ fails closed: an unknown visibility or gate reads as Only me", () => {
    expect(doorOf("ajar", null)).toBe("private");
    expect(doorOf("private", "moat")).toBe("private");
    expect(doorOf("private", undefined)).toBe("private");
    // A gate on an album the link opens is no shape the CHECK allows; the album reads as its visibility.
    expect(doorOf("open", "closed")).toBe("open");
  });

  it("names step one and the gate", () => {
    expect(stepOf("open")).toBe("public");
    expect(stepOf("private")).toBe("only_me");
    for (const door of ["password", "approve", "invite", "closed"] as const) {
      expect(stepOf(door)).toBe("private");
      expect(gateOf(door)).toBe(door);
    }
    expect(gateOf("open")).toBeNull();
    expect(gateOf("private")).toBeNull();
  });

  it("holds the email step on exactly where a gate keys on an address", () => {
    expect(DOORS.filter(holdsEmailOn)).toEqual(["approve", "invite"]);
  });

  it("keeps the contents of the password and the three gates behind the door", () => {
    expect(DOORS.filter(behindDoor)).toEqual(["password", "approve", "invite", "closed"]);
  });

  it("lands step one's Private on the gate kept, a dormant password, else only people already in", () => {
    expect(doorForStep("private", "approve", false)).toBe("approve");
    expect(doorForStep("private", "open", true)).toBe("password");
    expect(doorForStep("private", "private", false)).toBe("closed");
    expect(doorForStep("public", "closed", false)).toBe("open");
    expect(doorForStep("only_me", "invite", false)).toBe("private");
  });
});

describe("the gates are the database's own", () => {
  it("DOOR_GATES is public.event_gate, value for value", () => {
    const migrations = join(process.cwd(), "supabase", "migrations");
    const sql = readdirSync(migrations)
      .filter((f) => f.endsWith(".sql"))
      .sort()
      .map((f) => readFileSync(join(migrations, f), "utf8").replace(/--[^\n]*/g, ""))
      .join("\n");
    const created = sql.match(
      /create type public\.event_gate as enum \(([^)]*)\);/,
    );
    expect(created, "no migration creates public.event_gate").not.toBeNull();
    const values = created![1].split(",").map((v) => v.trim().replace(/^'|'$/g, ""));
    expect(values).toEqual([...DOOR_GATES]);
    // No later file adds a value this build would not know (doorOf would read it as Only me).
    expect(sql).not.toMatch(/alter type public\.event_gate add value/);
  });
});
