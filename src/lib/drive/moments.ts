/**
 * A SEND, AT EVERY MOMENT, IN ITS WORDS (the board's `MOMENTS`, wired; Will's desk-2 picks: `progress = album`, `hard =
 * in-place` with a flag she cannot miss, `done = done-only`). One table, so the album's strip, the dashboard's light,
 * the app-wide flag and Take it home can never say two things about one moment: each send's light and word
 * (status=lights), its title in plain sentence case, the meter, its facts, a line, and its one act (or none).
 *
 * ★ A STOP SAYS ITS ONE ACT: Check again, Get more space, Reconnect, Send to a new folder, Retry. A pause that carries
 * on by itself (Google's day) says so and asks nothing. Ours to fix (a dying lane, the breaker, an operator) says we
 * are on it, never asks her to do what she cannot.
 *
 * ★ DONE IS DONE: "In your Drive, every one checked", Open in Drive. Nothing here suggests deleting what was sent
 * (PRICING.md: "Export is an off-ramp, never a one-click exit"); deleting stays where it already is. "Every one checked"
 * is said only of a send that sent something (`checkedAll`): the database closes that one only through its closing
 * check (20261005180000), and a send with nothing sent had nothing to check.
 *
 * ★ A STOPPED SEND TELLS WHAT LANDED: files already on their way at her Cancel still land, so while a lane holds any
 * (`landing`) its numbers say "so far" and Send again waits, never a number frozen at the press.
 *
 * Pure (the clock passed in): Vitest pins every moment.
 */
import { formatCount } from "@/lib/format/count";
import { formatBytes } from "@/lib/utils";

/** A send as her pages read it (the status route's view of her own row). */
export type SendView = {
  id: string;
  eventId: string | null;
  albumName: string;
  status:
    | "preparing"
    | "sending"
    | "paused"
    | "checking"
    | "done"
    | "partly_done"
    | "canceled"
    | "stopped";
  pauseReason: string | null;
  stopReason: string | null;
  resumeAt: string | null;
  /** Hidden and waiting ones went too (her choice at the press). */
  includeHidden: boolean;
  itemsTotal: number;
  itemsSent: number;
  itemsKept: number;
  itemsSkipped: number;
  itemsFailed: number;
  bytesTotal: number;
  bytesSent: number;
  folderUrl: string | null;
  createdAt: string;
  startedAt: string | null;
  lastProgressAt: string | null;
  closedAt: string | null;
  /** Her stop's flag is due (set at a stop that needs her, not yet shown). */
  flagDue: boolean;
  /**
   * A canceled or stopped send a lane still holds files of: the ones already on their way at the stop are still
   * landing, so its numbers still move (the status route asks the items; absent reads as no).
   */
  landing?: boolean;
};

/** ★ "Every one checked" follows a check that ran: a done send that sent anything closed only through its check. */
export function checkedAll(
  send: Pick<SendView, "status" | "itemsSent">,
): boolean {
  return send.status === "done" && send.itemsSent > 0;
}

export type DriveTone = "sending" | "paused" | "done" | "stopped";

export type DriveActId =
  | "cancel"
  | "check"
  | "more_space"
  | "reconnect"
  | "refolder"
  | "retry"
  | "open"
  | "send_again"
  | "see_which";

export type DriveAct = { id: DriveActId; label: string; lead?: boolean };

export type DriveMoment = {
  tone: DriveTone;
  /** The light's word, in the camera's capitals by its Badge. */
  word: string;
  title: string;
  /** Where it lands in her Drive. */
  where: string;
  /** Percent, for the meter; absent where nothing measures. */
  meter?: number;
  facts: string;
  line?: string;
  acts: DriveAct[];
};

/** Unfinished: the send still has work, or waits on her or us. */
export function isUnfinished(send: Pick<SendView, "status">): boolean {
  return (
    send.status === "preparing" ||
    send.status === "sending" ||
    send.status === "paused" ||
    send.status === "checking"
  );
}

/** How long without progress reads as "taking longer than usual" (the lanes report every 10 seconds). */
export const SLOW_AFTER_MS = 15 * 60 * 1000;

function pct(done: number, total: number): number {
  if (total <= 0) return 100;
  return Math.max(0, Math.min(100, Math.floor((done / total) * 100)));
}

/** "about 16 minutes left", from the send's own pace, once it has one worth reading (a minute of progress). */
export function timeLeftWords(send: SendView, nowMs: number): string | null {
  const from = Date.parse(send.startedAt ?? send.createdAt);
  const elapsed = nowMs - from;
  if (!Number.isFinite(from) || elapsed < 60_000 || send.bytesSent <= 0)
    return null;
  const left = Math.max(send.bytesTotal - send.bytesSent, 0);
  if (left === 0) return null;
  const minutes = Math.ceil(left / (send.bytesSent / elapsed) / 60_000);
  if (minutes <= 1) return "about a minute left";
  if (minutes < 55) return `about ${minutes} minutes left`;
  const hours = Math.round(minutes / 60);
  if (hours <= 1) return "about an hour left";
  if (hours < 36) return `about ${hours} hours left`;
  return `about ${Math.round(hours / 24)} days left`;
}

/** When Google's day lets it go on, in her own zone ("9:14 PM tomorrow"). */
export function resumeWords(
  resumeAt: string | null,
  nowMs: number,
  zone?: string,
): string {
  if (!resumeAt) return "tomorrow";
  const at = new Date(resumeAt);
  const sameDay =
    new Date(nowMs).toLocaleDateString("en-US", { timeZone: zone }) ===
    at.toLocaleDateString("en-US", { timeZone: zone });
  const time = at.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: zone,
  });
  return sameDay ? `${time} today` : `${time} tomorrow`;
}

const n = (value: number) => formatCount(value);

/**
 * A STOP THAT WAITS ON HER, IN ITS TITLE: the strip's title and the bell's row are one string (her Drive full, the
 * access lost, the folder in her bin, her admin's policy; a send that ended with files short).
 */
export function stopTitle(reason: string, albumName: string): string {
  switch (reason) {
    case "drive_full":
      return "Your Google Drive is full";
    case "disconnected":
      return "Partyreel lost access to your Google Drive";
    case "folder_gone":
      return `The ${albumName} folder is in your Drive's bin`;
    case "domain_policy":
      return "Your organization's Google admin doesn't let Partyreel add files";
    default:
      return "Some files didn't reach your Google Drive";
  }
}

/** The stops the bell carries while they stand (a pause that resumes by itself, or ours to fix, never). */
export const BELL_STOPS = [
  "drive_full",
  "disconnected",
  "folder_gone",
  "domain_policy",
] as const;

/** The moment one send is at, in its words and its acts. */
export function momentOf(
  send: SendView,
  nowMs: number,
  zone?: string,
): DriveMoment {
  const where = `My Drive › Partyreel › ${send.albumName}`;
  const total = send.itemsTotal;
  const settled = send.itemsSent + send.itemsSkipped + send.itemsFailed;
  const meter = pct(settled, total);
  const sentOf = `${n(send.itemsSent)} of ${n(total)}`;
  const left = formatBytes(Math.max(send.bytesTotal - send.bytesSent, 0));

  switch (send.status) {
    case "preparing":
      return {
        tone: "sending",
        word: "Starting",
        title: "Getting your Drive ready",
        where,
        meter: 0,
        facts: `${n(total)} · ${formatBytes(send.bytesTotal)}`,
        line: "You can close this page: we'll email you when it's done.",
        acts: [{ id: "cancel", label: "Cancel" }],
      };
    case "sending": {
      const lastMove = Date.parse(
        send.lastProgressAt ?? send.startedAt ?? send.createdAt,
      );
      const slow =
        Number.isFinite(lastMove) && nowMs - lastMove > SLOW_AFTER_MS;
      const eta = slow ? null : timeLeftWords(send, nowMs);
      const kept =
        send.itemsKept > 0 ? ` · ${n(send.itemsKept)} already there` : "";
      return {
        tone: "sending",
        word: "Sending",
        title: "Sending to Google Drive",
        where,
        meter,
        facts: `${sentOf} · ${formatBytes(send.bytesSent)} of ${formatBytes(send.bytesTotal)}${kept}${eta ? ` · ${eta}` : ""}`,
        line: slow
          ? "Taking longer than usual. It carries on by itself, and we'll email you."
          : "You can close this page: we'll email you when it's done.",
        acts: [{ id: "cancel", label: "Cancel" }],
      };
    }
    case "checking":
      return {
        tone: "sending",
        word: "Checking",
        title: "Checking every file in your Drive",
        where,
        meter: Math.max(meter, 99),
        facts: `${sentOf} in your Drive · ${formatBytes(send.bytesSent)}`,
        line: "Almost done: each one is matched against ours.",
        acts: [],
      };
    case "paused":
      return pausedMoment(send, where, meter, sentOf, left, nowMs, zone);
    case "done": {
      const skipped =
        send.itemsSkipped > 0
          ? ` · ${n(send.itemsSkipped)} left the album while sending`
          : "";
      if (!checkedAll(send)) {
        // Nothing went (every original left the album on the way): nothing to check, and nothing claimed checked.
        return {
          tone: "done",
          word: "Nothing to send",
          title: `Nothing of ${send.albumName} was left to send`,
          where,
          facts:
            send.itemsSkipped > 0
              ? `${n(send.itemsSkipped)} left the album while sending`
              : "The album had nothing to send",
          acts: [],
        };
      }
      return {
        tone: "done",
        word: "In your Drive",
        title: `${send.albumName} is in your Google Drive`,
        where,
        facts: `${sentOf} · ${formatBytes(send.bytesSent)} · every one checked${skipped}`,
        acts: send.folderUrl ? [{ id: "open", label: "Open in Drive" }] : [],
      };
    }
    case "partly_done":
      return {
        tone: "paused",
        word: "Partly done",
        title: `${sentOf} are in your Drive`,
        where,
        meter: 99,
        facts: `${n(send.itemsFailed)} couldn't be sent`,
        line: "Retry them now, or see which.",
        acts: [
          {
            id: "retry",
            label:
              send.itemsFailed === 1
                ? "Retry it"
                : `Retry the ${n(send.itemsFailed)}`,
            lead: true,
          },
          { id: "see_which", label: "See which" },
          ...(send.folderUrl
            ? [{ id: "open" as const, label: "Open in Drive" }]
            : []),
        ],
      };
    case "canceled":
      return send.landing
        ? landingMoment(send, where, sentOf, canceledTitle(send))
        : canceledMoment(send, where, sentOf);
    case "stopped":
      if (send.landing && send.stopReason !== "failed_to_start")
        return landingMoment(send, where, sentOf, "Stopped after too long");
      return {
        tone: "stopped",
        word: "Stopped",
        title:
          send.stopReason === "failed_to_start"
            ? "That send didn't start"
            : "Stopped after too long",
        where,
        facts:
          send.stopReason === "failed_to_start"
            ? "Google didn't let us make its folder. Nothing was sent."
            : `${sentOf} are in your Drive. Sending again takes only the rest.`,
        acts: [{ id: "send_again", label: "Send again", lead: true }],
      };
  }
}

/**
 * A stopped send whose files already on their way are still landing: what reached her Drive so far, said as it moves,
 * and no Send again until they have landed (a send pressed now would send them a second time).
 */
function landingMoment(
  send: SendView,
  where: string,
  sentOf: string,
  title: string,
): DriveMoment {
  return {
    tone: "stopped",
    word: "Stopping",
    title,
    where,
    facts:
      send.itemsSent > 0
        ? `${sentOf} reached your Drive so far`
        : "Nothing has reached your Drive yet",
    line: "The files already on their way are still landing.",
    acts: [],
  };
}

function pausedMoment(
  send: SendView,
  where: string,
  meter: number,
  sentOf: string,
  left: string,
  nowMs: number,
  zone?: string,
): DriveMoment {
  const base = { tone: "paused" as const, where, meter };
  switch (send.pauseReason) {
    case "drive_full":
      return {
        ...base,
        word: "Paused",
        title: stopTitle("drive_full", send.albumName),
        facts: `${sentOf} sent · ${left} still to send`,
        line: "Make room in your Drive, or get more from Google, then check again. Nothing is lost.",
        acts: [
          { id: "check", label: "Check again", lead: true },
          { id: "more_space", label: "Get more space" },
        ],
      };
    case "daily_limit":
      return {
        ...base,
        word: "Paused until tomorrow",
        title: "Google takes 750 GB a day per account",
        facts: `${formatBytes(send.bytesSent)} of ${formatBytes(send.bytesTotal)} sent · the rest goes at ${resumeWords(send.resumeAt, nowMs, zone)}`,
        line: "Nothing to do: it carries on by itself, and we'll email you when it's done.",
        acts: [{ id: "cancel", label: "Cancel" }],
      };
    case "disconnected":
      return {
        ...base,
        word: "Paused",
        title: stopTitle("disconnected", send.albumName),
        facts: `${sentOf} sent`,
        line: "Connect again and it carries on where it stopped.",
        acts: [
          { id: "reconnect", label: "Reconnect", lead: true },
          { id: "cancel", label: "Cancel" },
        ],
      };
    case "folder_gone":
      return {
        ...base,
        word: "Paused",
        title: stopTitle("folder_gone", send.albumName),
        facts: `${sentOf} sent`,
        line: "Restore it in Drive and check again, or send the rest to a new folder.",
        acts: [
          { id: "check", label: "Check again", lead: true },
          { id: "refolder", label: "Send to a new folder" },
          { id: "cancel", label: "Cancel" },
        ],
      };
    case "domain_policy":
      return {
        ...base,
        word: "Paused",
        title: stopTitle("domain_policy", send.albumName),
        facts: `${sentOf} sent`,
        line: "Ask them to allow it, or connect another Google account.",
        acts: [
          { id: "reconnect", label: "Use another account", lead: true },
          { id: "cancel", label: "Cancel" },
        ],
      };
    case "breaker":
      return {
        ...base,
        word: "Paused",
        title: "Sending to Drive is paused on your account",
        facts: `${sentOf} sent`,
        line: "We've been told and will look within a day. Nothing is lost.",
        acts: [{ id: "cancel", label: "Cancel" }],
      };
    default:
      // A dying lane or an operator's pause: ours to fix, never hers to try.
      return {
        ...base,
        word: "Paused",
        title: "Sending stopped on our side",
        facts: `${sentOf} sent`,
        line: "We're looking into it, and it carries on where it stopped. Nothing is lost.",
        acts: [{ id: "cancel", label: "Cancel" }],
      };
  }
}

/**
 * The words of a canceled send, by who stopped it. ★ None for a Disconnect's or another account's connect
 * (`disconnected`, `account_changed`): each ends its sends and starts a new connection row, and every place reads only
 * the connection she has now (`this-connection.ts` drops the sends made before it), so no place draws those. A reason
 * with no words of its own says only that the send stopped, never that she canceled it.
 */
const CANCELED_TITLES: Record<string, string> = {
  canceled: "You canceled this send",
  operator: "We stopped this send",
  album_deleted: "This send stopped when the album was deleted",
};

function canceledTitle(send: SendView): string {
  return CANCELED_TITLES[send.stopReason ?? "canceled"] ?? "This send stopped";
}

function canceledMoment(
  send: SendView,
  where: string,
  sentOf: string,
): DriveMoment {
  return {
    tone: "stopped",
    word: "Canceled",
    title: canceledTitle(send),
    where,
    facts:
      send.itemsSent > 0
        ? `${sentOf} reached your Drive and stay there. Sending again takes only the rest.`
        : "Nothing reached your Drive.",
    acts:
      send.stopReason === "album_deleted"
        ? []
        : [{ id: "send_again", label: "Send again" }],
  };
}

/**
 * The dashboard tile's light for an album's send: a running one's percent, a stop's word, a fresh done. None for a
 * send closed more than a day ago, canceled, stopped quietly, or done with nothing sent.
 */
export function tileLight(
  send: SendView,
): { label: string; tone: DriveTone } | null {
  if (
    send.status === "sending" ||
    send.status === "preparing" ||
    send.status === "checking"
  ) {
    const settled = send.itemsSent + send.itemsSkipped + send.itemsFailed;
    return {
      label: `Sending ${pct(settled, send.itemsTotal)}%`,
      tone: "sending",
    };
  }
  if (send.status === "paused") return { label: "Paused", tone: "paused" };
  if (send.status === "partly_done")
    return { label: "Partly done", tone: "paused" };
  if (checkedAll(send)) return { label: "In your Drive", tone: "done" };
  return null;
}

/** Which of an album's sends its places show: the unfinished one, else the newest. */
export function sendForAlbum(
  sends: readonly SendView[],
  eventId: string,
): SendView | null {
  const mine = sends.filter((s) => s.eventId === eventId);
  return mine.find(isUnfinished) ?? mine[0] ?? null;
}
