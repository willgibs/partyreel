"use client";

/**
 * THE SEND, ON THE ALBUM IT SENDS (Will, desk 2: `progress = album`; `hard = in-place`; `done = done-only`): a strip at
 * the album's head with the send's light and word, its title, where it lands, the meter, its facts and its one act.
 * She can close the tab: the strip says so, and picks the send up on her next visit from the status store.
 *
 *  - A stop turns the strip to its light, its words and its one act (Check again, Reconnect, Send to a new folder,
 *    Retry); a pause that carries on by itself says so and asks nothing. The stops that need her also flag themselves
 *    app-wide (`drive-flag.tsx`), once a stop.
 *  - Done is done: "In your Drive, every one checked", Open in Drive. Nothing here suggests deleting what was sent.
 *
 * It stands for a day after a send closes, then the album is the album again.
 */
import { useEffect, useState } from "react";
import { ExternalLink, FolderUp, Loader2, RotateCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Popup,
  PopupContent,
  PopupFooter,
  PopupHeader,
} from "@/components/ui/popup";
import { albumPath, hasDriveHint } from "@/lib/drive/links";
import {
  momentOf,
  sendForAlbum,
  type DriveAct,
  type DriveActId,
  type SendView,
} from "@/lib/drive/moments";
import { formatBytes } from "@/lib/utils";

import {
  actOn,
  connectHref,
  GOOGLE_STORAGE_URL,
  pressSend,
  refusalWords,
} from "./drive-client";
import { DriveLight, DriveMeter } from "./drive-parts";
import { refreshDriveStatus, useDriveStatus } from "./use-drive-status";

const ICONS: Partial<Record<DriveActId, React.ReactNode>> = {
  check: <RotateCw />,
  retry: <RotateCw />,
  reconnect: <FolderUp />,
  refolder: <FolderUp />,
  send_again: <FolderUp />,
  more_space: <ExternalLink />,
  open: <ExternalLink />,
};

/** What a failed act says, in her words. */
function actWords(code: string | null | undefined, free?: number | null, needs?: number): string {
  switch (code) {
    case "still_full":
      return free !== null && free !== undefined && needs !== undefined
        ? `Still full: ${formatBytes(free)} free, ${formatBytes(needs)} to go.`
        : "Your Drive is still full.";
    case "still_in_bin":
      return "The folder is still in your Drive's bin.";
    case "disconnected":
      return "Partyreel lost access to your Google Drive. Reconnect first.";
    case "busy":
      return "Your Drive connection is busy for a moment. Try again.";
    case "dropped":
      return "Your connection dropped. Check your signal, then try again.";
    case "already_sending":
      return "This album is already sending again, and that send takes these files too.";
    default:
      return "Couldn't do that just now. Try again in a moment.";
  }
}

/** Which of an album's failed or skipped files these were: a page at a time, the names her Drive would have given. */
function WhichList({ send }: { send: SendView }) {
  const [items, setItems] = useState<{ name: string | null; reason: string | null }[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    void fetch(`/api/drive/exports/${send.id}/items?state=failed`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as {
          ok?: boolean;
          items?: { name: string | null; reason: string | null }[];
        } | null;
        if (!alive) return;
        if (body?.ok) setItems(body.items ?? []);
        else setFailed(true);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [send.id]);
  if (failed) return <p className="text-xs text-muted-foreground">Couldn&rsquo;t list them just now.</p>;
  if (items === null) return <p className="text-xs text-muted-foreground">Listing them</p>;
  return (
    <ul data-drive-which="" className="flex flex-col gap-1 text-xs text-muted-foreground">
      {items.map((i, n) => (
        <li key={n} className="flex flex-wrap gap-x-2">
          <span className="font-medium text-foreground">{i.name ?? "A file"}</span>
          <span>{i.reason ?? "Google wouldn't take it"}</span>
        </li>
      ))}
    </ul>
  );
}

export function SendStripFor({ send, nowMs }: { send: SendView; nowMs: number }) {
  const moment = momentOf(send, nowMs);
  const [busy, setBusy] = useState<DriveActId | null>(null);
  const [asking, setAsking] = useState(false);
  const [which, setWhich] = useState(false);

  const run = async (act: DriveAct) => {
    switch (act.id) {
      case "open":
        if (send.folderUrl) window.open(send.folderUrl, "_blank", "noopener,noreferrer");
        return;
      case "more_space":
        window.open(GOOGLE_STORAGE_URL, "_blank", "noopener,noreferrer");
        return;
      case "reconnect":
        window.location.assign(connectHref(send.eventId ? albumPath(send.eventId) : "/dashboard"));
        return;
      case "see_which":
        setWhich((w) => !w);
        return;
      case "cancel":
        setAsking(true);
        return;
      case "send_again": {
        if (!send.eventId) return;
        setBusy(act.id);
        const answer = await pressSend([send.eventId], send.includeHidden);
        setBusy(null);
        if (!answer.ok) toast.error(refusalWords(answer).title, { description: refusalWords(answer).detail });
        void refreshDriveStatus();
        return;
      }
      default: {
        setBusy(act.id);
        const answer = await actOn(send.id, act.id);
        setBusy(null);
        if (!answer.ok) toast.warning(actWords(answer.code, answer.free, answer.needs));
        void refreshDriveStatus();
      }
    }
  };

  const stop = async () => {
    setAsking(false);
    setBusy("cancel");
    const answer = await actOn(send.id, "cancel");
    setBusy(null);
    if (!answer.ok) toast.warning(actWords(answer.code));
    void refreshDriveStatus();
  };

  return (
    <div
      data-drive-strip={send.status}
      className="flex flex-col gap-2 rounded-float bg-card p-3 ring-1 ring-foreground/10"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <DriveLight tone={moment.tone}>{moment.word}</DriveLight>
        <span className="min-w-0 text-sm font-medium text-pretty">{moment.title}</span>
        <span className="hidden min-w-0 truncate text-xs text-muted-foreground sm:inline">{moment.where}</span>
        {moment.acts.length > 0 ? (
          <span className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
            {moment.acts.map((act) => (
              <Button
                key={act.id}
                type="button"
                size="sm"
                variant={act.lead ? "default" : act.id === "cancel" ? "ghost" : "outline"}
                disabled={busy !== null}
                onClick={() => void run(act)}
              >
                {busy === act.id ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden /> : ICONS[act.id]}
                {act.label}
              </Button>
            ))}
          </span>
        ) : null}
      </div>
      {moment.meter !== undefined ? <DriveMeter value={moment.meter} /> : null}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
        <span>{moment.facts}</span>
        {moment.line ? <span className="text-pretty">{moment.line}</span> : null}
      </div>
      {which ? <WhichList send={send} /> : null}
      <Popup open={asking} onOpenChange={setAsking}>
        <PopupContent kind="confirm">
          <PopupHeader
            title={`Stop sending ${send.albumName}?`}
            description="What already reached your Drive stays there. Sending again later takes only the rest."
          />
          <PopupFooter>
            <Button variant="outline" onClick={() => setAsking(false)}>
              Keep sending
            </Button>
            <Button variant="destructive" onClick={() => void stop()}>
              Stop sending
            </Button>
          </PopupFooter>
        </PopupContent>
      </Popup>
    </div>
  );
}

/**
 * The album's strip, or nothing: its send that matters now (unfinished, or closed in the last day). Only a host who
 * uses Drive listens (the hint cookie: `links.ts`), so the hub of a host who never sent asks nothing.
 */
export function DriveSendStrip({ eventId }: { eventId: string }) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the hint is the browser's cookie, read after mount
    setActive(hasDriveHint());
  }, []);
  return active ? <DriveSendStripListening eventId={eventId} /> : null;
}

function DriveSendStripListening({ eventId }: { eventId: string }) {
  const { status } = useDriveStatus();
  const send = status ? sendForAlbum(status.sends, eventId) : null;
  if (!send || !status) return null;
  // A send canceled because the album was deleted, or one that failed to start long ago, says nothing on the album.
  if (send.status === "canceled" && send.stopReason === "album_deleted") return null;
  return <SendStripFor send={send} nowMs={Date.parse(status.now)} />;
}
