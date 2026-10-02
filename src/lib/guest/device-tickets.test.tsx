/**
 * PUTTING GUEST TICKETS DOWN ON THE DEVICE.
 *
 * Two acts, one store. A SIGN-OUT puts down every ticket this browser holds, with the names and
 * address flags beside them and the name prefill, so the next person on a shared phone starts
 * clean. A REFUSED TICKET (`session_other_account`) puts down that event's alone, and the prefill
 * only when it is that same ticket's name, so the person at the door is never offered the last
 * owner's name. Neither touches anything that is not a ticket.
 *
 * ★ THE SHARED PHONE'S ANSWERS GO WITH THEIR TICKETS (shared-claims): a "Not mine" is remembered on
 * the album whose ticket it answered, so the ticket put down takes its answer with it, and the next
 * person on the phone starts with neither.
 *
 * ★ AND SO DOES THE WELCOME (crumbs-43, reshaped on purpose: these pins held `pr_welcome_` among the
 * survivors, "not tickets"). The welcome carries the consent line every guest passes once, so "seen"
 * is the person's, and the next person on a shared phone skipped it, consent line and all. The scar
 * kept: what is not a person's (the device id, the theme) still survives every act below; the expired
 * reason dropped: that the welcome was the phone's.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { storedKeysWithPrefixes } from "@/lib/guest/session-tokens";
import {
  forgetStoredGuest,
  GUEST_NAME_LAST_KEY,
} from "@/lib/guest/use-stored-name";
import {
  dropGuestTicket,
  forgetGuestTickets,
  leaveAllGuestSessions,
} from "@/lib/guest/use-stored-session";

const QR_A = "qr-a";
const QR_B = "qr-b";

function seedTwoTickets() {
  localStorage.setItem(`pr_session_${QR_A}`, "a".repeat(64));
  localStorage.setItem(`pr_session_${QR_B}`, "b".repeat(64));
  localStorage.setItem(`pr_guest_name_${QR_A}`, "Hi Will");
  localStorage.setItem(`pr_guest_name_${QR_B}`, "Sam");
  localStorage.setItem(GUEST_NAME_LAST_KEY, "Hi Will");
  localStorage.setItem(`pr_guest_email_attached_${QR_B}`, "1");
  // An account's "Not mine" to each ticket (claim-ask.ts): answers beside tickets, not tickets.
  localStorage.setItem(`pr_not_mine_${QR_A}`, JSON.stringify(["acct-1"]));
  localStorage.setItem(`pr_not_mine_${QR_B}`, JSON.stringify(["acct-1"]));
  // Each album's welcome, seen by the person holding its ticket (use-welcome-seen.ts).
  localStorage.setItem(`pr_welcome_${QR_A}`, "1");
  localStorage.setItem(`pr_welcome_${QR_B}`, "1");
  // Not a person's: these must survive every act below.
  localStorage.setItem("pr_device_id", "device-1");
  localStorage.setItem("theme", "dark");
}

function leaveCalls() {
  return vi
    .mocked(global.fetch)
    .mock.calls.filter(([url]) => url === "/api/guests/leave")
    .map(([, init]) => JSON.parse(String((init as RequestInit).body)));
}

beforeEach(() => {
  localStorage.clear();
  global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);
});

describe("storedKeysWithPrefixes", () => {
  it("collects every key under the prefixes BEFORE anything is removed", () => {
    seedTwoTickets();
    expect(storedKeysWithPrefixes(["pr_session_"]).sort()).toEqual(
      [`pr_session_${QR_A}`, `pr_session_${QR_B}`].sort(),
    );
  });
});

describe("the sign-out: every ticket on the device", () => {
  it("★ forgetGuestTickets clears every token, name, address flag, the prefill and every welcome, and nothing else", () => {
    seedTwoTickets();
    forgetGuestTickets();
    for (const key of [
      `pr_session_${QR_A}`,
      `pr_session_${QR_B}`,
      `pr_guest_name_${QR_A}`,
      `pr_guest_name_${QR_B}`,
      GUEST_NAME_LAST_KEY,
      `pr_guest_email_attached_${QR_B}`,
      `pr_not_mine_${QR_A}`,
      `pr_not_mine_${QR_B}`,
      `pr_welcome_${QR_A}`,
      `pr_welcome_${QR_B}`,
    ]) {
      expect(localStorage.getItem(key), key).toBeNull();
    }
    expect(localStorage.getItem("pr_device_id")).toBe("device-1");
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("forgetGuestTickets is the device half alone: no network", () => {
    seedTwoTickets();
    forgetGuestTickets();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("★ leaveAllGuestSessions also asks the server to expire EVERY ticket cookie", () => {
    seedTwoTickets();
    leaveAllGuestSessions();
    expect(localStorage.getItem(`pr_session_${QR_A}`)).toBeNull();
    expect(leaveCalls()).toEqual([{ all: true }]);
  });

  it("a fetch that throws never breaks a sign-out", () => {
    global.fetch = vi.fn(() => {
      throw new Error("offline");
    });
    seedTwoTickets();
    expect(() => leaveAllGuestSessions()).not.toThrow();
    expect(localStorage.getItem(`pr_session_${QR_B}`)).toBeNull();
  });
});

describe("a refused ticket: that event's alone", () => {
  it("★ dropGuestTicket puts down the token, its name and its flag, and expires that event's cookie", async () => {
    seedTwoTickets();
    localStorage.setItem(`pr_guest_email_attached_${QR_A}`, "1");
    await dropGuestTicket(QR_A);
    expect(localStorage.getItem(`pr_session_${QR_A}`)).toBeNull();
    expect(localStorage.getItem(`pr_guest_name_${QR_A}`)).toBeNull();
    expect(localStorage.getItem(`pr_guest_email_attached_${QR_A}`)).toBeNull();
    expect(localStorage.getItem(`pr_not_mine_${QR_A}`)).toBeNull();
    // The person who saw this album's welcome is not the one at the door now.
    expect(localStorage.getItem(`pr_welcome_${QR_A}`)).toBeNull();
    expect(leaveCalls()).toEqual([{ qr_token: QR_A }]);
    // The other event's ticket is somebody's too, and it is not this refusal's to touch.
    expect(localStorage.getItem(`pr_session_${QR_B}`)).toBe("b".repeat(64));
    expect(localStorage.getItem(`pr_guest_name_${QR_B}`)).toBe("Sam");
    expect(localStorage.getItem(`pr_not_mine_${QR_B}`)).toBe('["acct-1"]');
    expect(localStorage.getItem(`pr_welcome_${QR_B}`)).toBe("1");
    expect(localStorage.getItem("pr_device_id")).toBe("device-1");
  });

  it("keeps the welcome for the person at the door's name step, who has just passed it", async () => {
    seedTwoTickets();
    await dropGuestTicket(QR_A, { keepWelcome: true });
    expect(localStorage.getItem(`pr_session_${QR_A}`)).toBeNull();
    expect(localStorage.getItem(`pr_welcome_${QR_A}`)).toBe("1");
  });

  it("★ the prefill goes with it when it IS that ticket's name, so the door never offers the last owner's", () => {
    seedTwoTickets();
    forgetStoredGuest(QR_A);
    expect(localStorage.getItem(GUEST_NAME_LAST_KEY)).toBeNull();
  });

  it("a prefill typed somewhere else stays: nothing says it is not this person's", () => {
    seedTwoTickets();
    localStorage.setItem(GUEST_NAME_LAST_KEY, "Sam");
    forgetStoredGuest(QR_A);
    expect(localStorage.getItem(GUEST_NAME_LAST_KEY)).toBe("Sam");
  });

  it("the cookie expiry is AWAITED, so a re-join's fresh cookie can never be overtaken by it", async () => {
    let release!: () => void;
    global.fetch = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          release = () => resolve({ ok: true } as Response);
        }),
    );
    seedTwoTickets();
    let settled = false;
    const dropping = dropGuestTicket(QR_A).then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    release();
    await dropping;
    expect(settled).toBe(true);
  });
});
