"use client";

/**
 * THE BROWSER'S HALF OF SEND TO GOOGLE DRIVE: the press, her acts, the final press's facts, the round trip through
 * Google, and every refusal in her words. One home, so Take it home, the album's strip, Your events' picker, the
 * storage door and Account never word one outcome two ways.
 *
 * ★ THE ROUND TRIP REMEMBERS WHAT SHE WAS SENDING, IN THIS TAB ONLY. Google's consent is a full page away; before she
 * leaves, what she meant to send (which albums, hidden or not, from where) waits in sessionStorage
 * (`pr-drive-intent`, fifteen minutes), and the page she lands back on opens the final press with it. Blocked storage
 * costs her one press again, never a wrong send: nothing is sent until she presses on her return.
 */
import type { AlbumPreview } from "@/lib/drive/press";
import type { DriveReturn } from "@/lib/drive/oauth-cookie";
import type { PressAnswer, PressRefusal } from "@/lib/drive/press";
import { formatBytes } from "@/lib/utils";

export type { AlbumPreview };

export const DRIVE_INTENT_KEY = "pr-drive-intent";
const INTENT_TTL_MS = 15 * 60 * 1000;

export type DriveIntent = {
  v: 1;
  source: "panel" | "picker" | "storage";
  events: string[];
  includeHidden: boolean;
  at: number;
};

/** Keep what she meant to send across Google's consent (this tab only). */
export function rememberIntent(intent: Omit<DriveIntent, "v" | "at">): void {
  try {
    sessionStorage.setItem(
      DRIVE_INTENT_KEY,
      JSON.stringify({ ...intent, v: 1, at: Date.now() }),
    );
  } catch {
    // A press again on her return does the same.
  }
}

/** What she meant to send, once, if it is fresh and well formed; the store is cleared either way. */
export function takeIntent(): DriveIntent | null {
  try {
    const raw = sessionStorage.getItem(DRIVE_INTENT_KEY);
    sessionStorage.removeItem(DRIVE_INTENT_KEY);
    if (!raw) return null;
    const i = JSON.parse(raw) as Partial<DriveIntent>;
    if (
      i.v !== 1 ||
      typeof i.at !== "number" ||
      Date.now() - i.at > INTENT_TTL_MS ||
      !Array.isArray(i.events) ||
      !i.events.every(
        (e) => typeof e === "string" && /^[0-9a-f-]{36}$/i.test(e),
      ) ||
      (i.source !== "panel" && i.source !== "picker" && i.source !== "storage")
    ) {
      return null;
    }
    return {
      v: 1,
      source: i.source,
      events: i.events,
      includeHidden: i.includeHidden === true,
      at: i.at,
    };
  } catch {
    return null;
  }
}

/** Peek without taking (a page that must decide whether the intent is its own). */
export function peekIntent(): DriveIntent | null {
  try {
    const raw = sessionStorage.getItem(DRIVE_INTENT_KEY);
    if (!raw) return null;
    const i = JSON.parse(raw) as DriveIntent;
    return i.v === 1 && Date.now() - i.at <= INTENT_TTL_MS ? i : null;
  } catch {
    return null;
  }
}

/** The connect's address, landing back on `next` (one of the sign-in return shapes, checked on the server). */
export function connectHref(next: string): string {
  return `/api/drive/connect?next=${encodeURIComponent(next)}`;
}

/** Her browser's zone, for the files' names (when each arrived, in her own time). */
function zone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** THE PRESS: one album, or several. Never throws: a dropped line is a refusal in words. */
export async function pressSend(
  eventIds: string[],
  includeHidden: boolean,
): Promise<PressAnswer> {
  try {
    const res = await fetch("/api/drive/exports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event_ids: eventIds,
        include_hidden: includeHidden,
        tz: zone(),
      }),
    });
    const body = (await res.json().catch(() => null)) as PressAnswer | null;
    if (body && typeof body === "object" && "ok" in body) return body;
    return { ok: false, code: "google_unreachable" };
  } catch {
    return { ok: false, code: "google_unreachable" };
  }
}

export type ActAnswer = {
  ok: boolean;
  code?: string | null;
  status?: string | null;
  free?: number | null;
  needs?: number;
};

/** One of her acts on one send. */
export async function actOn(
  jobId: string,
  act: "cancel" | "check" | "refolder" | "retry" | "seen",
): Promise<ActAnswer> {
  try {
    const res = await fetch(`/api/drive/exports/${jobId}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ act }),
    });
    return (
      ((await res.json().catch(() => null)) as ActAnswer | null) ?? {
        ok: false,
        code: "unknown",
      }
    );
  } catch {
    return { ok: false, code: "dropped" };
  }
}

/** The final press's facts for these albums, or null when they could not be read. */
export async function readPreview(
  eventIds: string[],
  includeHidden: boolean,
): Promise<Record<string, AlbumPreview> | null> {
  try {
    const res = await fetch(
      `/api/drive/preview?events=${eventIds.join(",")}&hidden=${includeHidden ? 1 : 0}`,
      {
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as {
      ok?: boolean;
      albums?: Record<string, AlbumPreview>;
    };
    return body.ok ? (body.albums ?? {}) : null;
  } catch {
    return null;
  }
}

/** What a press's refusal says, in her words, with the one act it offers. */
export function refusalWords(answer: Extract<PressAnswer, { ok: false }>): {
  title: string;
  detail?: string;
} {
  const words: Record<PressRefusal, { title: string; detail?: string }> = {
    bad_request: { title: "Couldn't start that send." },
    unauthorized: { title: "Sign in again to send." },
    unavailable: { title: "Send to Google Drive isn't set up yet." },
    rate_limited: {
      title: "That's a lot of sends at once.",
      detail: "Try again in a minute.",
    },
    not_connected: { title: "Connect Google Drive first." },
    disconnected: {
      title: "Partyreel lost access to your Google Drive.",
      detail: "Reconnect, and anything paused carries on where it stopped.",
    },
    paused: {
      title: "Sending to Drive is paused on your account.",
      detail: "We've been told and will look within a day.",
    },
    busy: {
      title: "Your Drive connection is busy for a moment.",
      detail: "Try again.",
    },
    google_unreachable: {
      title: "Couldn't reach Google just now.",
      detail: "Try again in a moment.",
    },
    drive_full:
      answer.free !== undefined && answer.needs !== undefined
        ? {
            title: `Your Drive has ${formatBytes(answer.free)} free. This needs ${formatBytes(answer.needs)}.`,
            detail:
              "Make room in your Drive, or get more from Google, then try again.",
          }
        : { title: "Your Google Drive is full." },
    domain_policy: {
      title:
        "Your organization's Google admin doesn't let Partyreel add files.",
      detail: "Ask them to allow it, or connect another Google account.",
    },
  };
  return words[answer.code] ?? { title: "Couldn't start that send." };
}

/** What one album of a press says when it did not start. */
export function albumRefusalWords(code: string | undefined): string {
  switch (code) {
    case "breaker":
      return "Sending to Drive is paused on your account. We've been told and will look within a day.";
    case "switch_off":
      return "Sending to Drive is paused for a moment. Try again later.";
    case "not_found":
      return "That album can't be sent: it's in Deleted, or not yours.";
    case "drive_full":
      return "Your Google Drive is full.";
    case "domain_policy":
      return "Your organization's Google admin doesn't let Partyreel add files.";
    default:
      return "Couldn't make its folder in your Drive. Press Send again to try once more.";
  }
}

/** What a return from Google says (`?drive=`), on the page she lands on. */
export function returnWords(word: DriveReturn): {
  title: string;
  detail?: string;
  good: boolean;
} {
  switch (word) {
    case "connected":
      return { title: "Google Drive is connected.", good: true };
    case "switched":
      return {
        title: "Google Drive is connected.",
        detail:
          "A send to your other Google account stopped when you connected this one.",
        good: true,
      };
    case "declined":
      return {
        title: "Nothing was connected.",
        detail: "You chose not to allow it at Google.",
        good: false,
      };
    case "needs_permission":
      return {
        title: "Tick the box that lets Partyreel add files.",
        detail:
          "Without it, Partyreel has nowhere to put your albums. It still sees only what it puts there.",
        good: false,
      };
    case "unavailable":
      return { title: "Send to Google Drive isn't set up yet.", good: false };
    default:
      return {
        title: "Couldn't connect Google Drive.",
        detail: "Try again in a moment.",
        good: false,
      };
  }
}

/** Read and clear `?drive=` from the address (the page keeps it no longer than its first look). */
export function takeReturnWord(): DriveReturn | null {
  try {
    const url = new URL(window.location.href);
    const word = url.searchParams.get("drive");
    if (!word) return null;
    url.searchParams.delete("drive");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
    const known = [
      "connected",
      "switched",
      "declined",
      "needs_permission",
      "failed",
      "unavailable",
    ];
    return known.includes(word) ? (word as DriveReturn) : null;
  } catch {
    return null;
  }
}

/** Google's own page for more room (Get more space). */
export const GOOGLE_STORAGE_URL = "https://one.google.com/storage";

/** Where she removes Partyreel at Google herself (a Disconnect Google did not confirm). */
export const GOOGLE_CONNECTIONS_URL =
  "https://myaccount.google.com/connections";
