/**
 * SEND TO GOOGLE DRIVE, AS THE PORTAL SAYS IT (drive-export.md, "Operators"): each send's state and each connection's,
 * the acts an operator is offered on each, and the OAuth client's own health. Pure, so the section and its test read
 * the same words, and so every state a send or a connection can reach has its control: no hand-run SQL.
 */
import type { BadgeTone } from "@/lib/admin/tone";

import type { TableTone } from "@/components/ui/table";

export type AdminWord = { label: string; badge: BadgeTone; row?: TableTone };

/** Why a send paused, in the operator's words (the migration's `pause_reason` vocabulary). */
export const PAUSE_WORDS: Record<string, string> = {
  drive_full: "Her Drive is full",
  daily_limit: "Google's day (carries on)",
  disconnected: "Connection lost",
  folder_gone: "Folder in her bin",
  domain_policy: "Her admin's policy",
  failing: "Lanes dying",
  breaker: "Account breaker",
  operator: "Paused by an operator",
};

/** Why a send stopped. */
export const STOP_WORDS: Record<string, string> = {
  canceled: "She canceled",
  operator: "An operator canceled",
  disconnected: "She disconnected",
  account_changed: "Another Google account",
  album_deleted: "Album deleted",
  expired: "Waited 30 days",
  failed_to_start: "Never started",
};

type SendFacts = {
  status: string;
  pauseReason: string | null;
  stopReason: string | null;
  stuckSince: string | null;
  itemsFailed: number;
};

export function sendWord(send: SendFacts): AdminWord {
  if (
    send.stuckSince &&
    (send.status === "sending" || send.status === "checking")
  ) {
    return { label: "Stuck", badge: "destructive", row: "destructive" };
  }
  switch (send.status) {
    case "preparing":
      return { label: "Making folders", badge: "info" };
    case "sending":
      return { label: "Sending", badge: "info" };
    case "checking":
      return { label: "Checking", badge: "info" };
    case "paused": {
      const label = PAUSE_WORDS[send.pauseReason ?? ""] ?? "Paused";
      // A pause that carries on by itself is no operator's business; one an operator or the breaker made is a
      // decision; the rest wait on her, and any of them can be the one to look at.
      if (send.pauseReason === "daily_limit" || send.pauseReason === "operator")
        return { label, badge: "outline" };
      if (send.pauseReason === "breaker" || send.pauseReason === "failing")
        return { label, badge: "warning", row: "warning" };
      return { label, badge: "warning" };
    }
    case "done":
      return { label: "Done", badge: "success" };
    case "partly_done":
      return {
        label: `${send.itemsFailed} failed`,
        badge: "warning",
        row: "warning",
      };
    case "canceled":
      return {
        label: STOP_WORDS[send.stopReason ?? ""] ?? "Canceled",
        badge: "secondary",
      };
    case "stopped":
      return {
        label: STOP_WORDS[send.stopReason ?? ""] ?? "Stopped",
        badge: "warning",
        row: "warning",
      };
    default:
      return { label: send.status, badge: "secondary" };
  }
}

export type SendActId = "resume" | "retry" | "cancel";

/** What an operator can do to a send: resume any pause, retry what failed, cancel what has not finished. */
export function sendActs(send: { status: string }): SendActId[] {
  const acts: SendActId[] = [];
  if (send.status === "paused") acts.push("resume");
  if (send.status === "partly_done") acts.push("retry");
  if (["preparing", "sending", "paused", "checking"].includes(send.status))
    acts.push("cancel");
  return acts;
}

type ConnectionFacts = {
  status: "connected" | "failing" | "revoked";
  operatorPausedAt: string | null;
  laneFailures: number;
  breakerSends: number;
};

export function connectionWord(c: ConnectionFacts): AdminWord {
  if (c.operatorPausedAt)
    return { label: "Paused by an operator", badge: "outline" };
  if (c.breakerSends > 0)
    return { label: "Breaker standing", badge: "warning", row: "warning" };
  if (c.laneFailures >= 3)
    return { label: "Lanes dying", badge: "destructive", row: "destructive" };
  if (c.status === "revoked")
    return { label: "Lost access", badge: "secondary" };
  if (c.status === "failing")
    return { label: "Refresh failing", badge: "warning" };
  return { label: "Connected", badge: "success" };
}

export type ConnectionActId =
  | "pause"
  | "resume"
  | "lift_breaker"
  | "disconnect";

/**
 * What an operator can do to a connection: pause a runaway one whole; resume what an operator or dying lanes paused;
 * lift a standing breaker; disconnect for an account's recovery (revoked at Google, as hers is).
 */
export function connectionActs(c: ConnectionFacts): ConnectionActId[] {
  const acts: ConnectionActId[] = [];
  if (!c.operatorPausedAt && c.status !== "revoked") acts.push("pause");
  if (c.operatorPausedAt || c.laneFailures >= 3) acts.push("resume");
  if (c.breakerSends > 0) acts.push("lift_breaker");
  acts.push("disconnect");
  return acts;
}

/**
 * Google deletes an OAuth client unused for six months (mailing the project's owner 30 days before): attention past
 * 150 days. With no connection at all there is nothing to measure from (before launch), which the section says in
 * words rather than as an alarm that would stand until the first host connects.
 */
export const CLIENT_IDLE_ATTENTION_DAYS = 150;

export function clientHealth(
  lastUsedAt: string | null,
  nowMs: number,
): { attention: boolean; days: number | null } {
  if (!lastUsedAt) return { attention: false, days: null };
  const days = Math.floor(
    (nowMs - Date.parse(lastUsedAt)) / (24 * 60 * 60 * 1000),
  );
  return { attention: days >= CLIENT_IDLE_ATTENTION_DAYS, days };
}

/** What the operator types to revoke every connection (a wrong-act guard: every host must reconnect after it). */
export const REVOKE_ALL_PHRASE = "revoke every connection";
