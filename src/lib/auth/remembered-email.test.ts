import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  forgetRememberedDoor,
  hasPasskeyHint,
  markPasskeyOffered,
  maskEmail,
  passkeyOffered,
  readRememberedDoor,
  rememberDoor,
  rememberPasskey,
} from "@/lib/auth/remembered-email";

/**
 * WHAT THE DEVICE REMEMBERS, AND WHAT IT MUST SURVIVE (`return=tap`, Will
 * 2026-09-20, wired as the fallback under the passkey).
 *
 * Three functions are pinned, and every one of them is a failure mode rather
 * than a preference:
 *
 *  1. A MALFORMED VALUE IS NOTHING. This lives in the visitor's own storage, so
 *     it is attacker-writable by definition and must be parsed like untrusted
 *     input. A door that crashed on a hand-edited key would be a denial of
 *     service anyone could aim at themselves and then report as "login broken".
 *  2. NO STORAGE IS A WORKING OUTCOME. Private windows, blocked site data and
 *     the server render all make `localStorage` absent or THROWING (reading the
 *     property throws, it does not return undefined). A door that cannot open
 *     is worse than a door that forgot you.
 *  3. THE MASK NEVER HANDS OVER THE ADDRESS. The whole point of showing it on a
 *     signed-out page is recognition, not disclosure.
 */

class FakeStorage {
  private map = new Map<string, string>();
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  clear() {
    this.map.clear();
  }
  key(i: number) {
    return [...this.map.keys()][i] ?? null;
  }
  get length() {
    return this.map.size;
  }
}

let store: FakeStorage;

beforeEach(() => {
  store = new FakeStorage();
  vi.stubGlobal("localStorage", store);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the remembered door", () => {
  it("remembers an address and the method that worked", () => {
    rememberDoor({ email: "nadia@example.com", method: "google" });
    expect(readRememberedDoor()).toEqual({
      email: "nadia@example.com",
      method: "google",
    });
  });

  it("forgets everything, including the passkey hint, on Not you", () => {
    rememberDoor({ email: "nadia@example.com", method: "code" });
    rememberPasskey();
    markPasskeyOffered();
    forgetRememberedDoor();
    expect(readRememberedDoor()).toBeNull();
    expect(hasPasskeyHint()).toBe(false);
    expect(passkeyOffered()).toBe(false);
  });

  it("reads a hand-edited value as nothing rather than trusting it", () => {
    for (const junk of [
      "not json at all",
      "{}",
      '{"email":"nadia@example.com"}',
      '{"email":"nadia@example.com","method":"sudo"}',
      '{"email":"not-an-address","method":"code"}',
      '{"email":42,"method":"code"}',
      "null",
    ]) {
      store.setItem("pr_door_last", junk);
      expect(readRememberedDoor(), junk).toBeNull();
    }
  });

  it("writes nothing for an empty address", () => {
    rememberDoor({ email: "", method: "password" });
    expect(readRememberedDoor()).toBeNull();
  });
});

describe("no storage at all", () => {
  it("remembers nothing when the store is missing", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(readRememberedDoor()).toBeNull();
    expect(hasPasskeyHint()).toBe(false);
    expect(() => rememberDoor({ email: "a@b.co", method: "code" })).not.toThrow();
    expect(() => forgetRememberedDoor()).not.toThrow();
  });

  it("remembers nothing when every call throws", () => {
    vi.stubGlobal("localStorage", {
      getItem() {
        throw new Error("site data blocked");
      },
      setItem() {
        throw new Error("site data blocked");
      },
      removeItem() {
        throw new Error("site data blocked");
      },
    });
    expect(readRememberedDoor()).toBeNull();
    expect(() => rememberPasskey()).not.toThrow();
    expect(hasPasskeyHint()).toBe(false);
  });
});

describe("the mask", () => {
  it("keeps the shape and gives away one letter", () => {
    expect(maskEmail("nadia@gmail.com")).toBe("n••••@gmail.com");
    expect(maskEmail("jo@partyreel.com")).toBe("j•@partyreel.com");
  });

  it("never reveals the whole local part, however long", () => {
    const masked = maskEmail("averyverylongaddress@example.com");
    expect(masked).not.toContain("averyverylongaddress");
    expect(masked.endsWith("@example.com")).toBe(true);
  });

  it("leaves anything that is not an address alone", () => {
    expect(maskEmail("")).toBe("");
    expect(maskEmail("@nope.com")).toBe("@nope.com");
    expect(maskEmail("a@b.co")).toBe("a@b.co");
  });
});
