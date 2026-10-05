"use client";

/**
 * CONNECTING AND THE FINAL PRESS (Will, desk 2: `connect = promise`): the steps one level into Take it home, Your
 * events' picker and the storage door, the same popup's next page (`PopupHeader`'s `up`), as Settings' pages are.
 *
 *  - NOT CONNECTED: our promise first, before Google's own screen says "see, edit, create and delete": what Partyreel
 *    makes in her Drive (a Partyreel folder, an album to a folder, every original), what it can and cannot see (only
 *    what it puts there), and that she can disconnect any time. Continue to Google.
 *  - CONNECTED (and back from Google): the final press. Whose Drive and its room, what it sends, where it lands, how
 *    long, and that the page can close. Send. A wrong account or a full Drive is found here, before anything starts.
 *
 * A refusal says what happened and its one act in place (Get more space, Reconnect, Try again); nothing is sent until
 * she presses.
 */
import { useEffect, useMemo, useState } from "react";
import { EyeOff, FolderUp, Loader2, Unplug } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PopupBody, PopupFooter, PopupHeader } from "@/components/ui/popup";
import type { DriveReturn } from "@/lib/drive/oauth-cookie";
import type { AlbumPreview, PressAnswer, PressResult } from "@/lib/drive/press";
import { driveFolderName } from "@/lib/export/drive-names";
import { formatCount } from "@/lib/format/count";
import { cn, formatBytes } from "@/lib/utils";

import {
  albumRefusalWords,
  connectHref,
  GOOGLE_STORAGE_URL,
  pressSend,
  readPreview,
  refusalWords,
  rememberIntent,
  returnWords,
} from "./drive-client";
import { FolderPicture } from "./drive-parts";
import { refreshDriveStatus, useDriveStatus } from "./use-drive-status";

/** About how fast a send goes, for "Takes": 5 MB a second (Google's pace for one account, three lanes). */
const BYTES_PER_SECOND = 5 * 1024 * 1024;

/** Google's 750 GB a day; we stop at 700. */
const DAY_BYTES = 700 * 1024 ** 3;

/** "About 25 minutes", "About 3 hours", "About 2 days (Google takes 750 GB a day)". */
export function takesWords(bytes: number): string {
  if (bytes > DAY_BYTES) {
    const days = Math.ceil(bytes / DAY_BYTES);
    return `About ${days} days: Google takes 750 GB a day per account`;
  }
  const minutes = Math.max(1, Math.round(bytes / BYTES_PER_SECOND / 60));
  if (minutes < 2) return "About a minute";
  if (minutes < 55) return `About ${minutes} minutes`;
  const hours = Math.round(minutes / 60);
  return hours <= 1 ? "About an hour" : `About ${hours} hours`;
}

function PromiseLine({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground [&_svg]:size-4">
        {icon}
      </span>
      <span className="pt-1.5 text-sm text-pretty">{children}</span>
    </li>
  );
}

/** A refusal or a return's words, in place, with what to do. */
function Notice({
  title,
  detail,
  children,
}: {
  title: string;
  detail?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      role="status"
      data-drive-notice=""
      className="flex flex-col gap-1.5 rounded-float bg-warning/10 px-3 py-2.5 text-sm ring-1 ring-warning/40"
    >
      <span className="font-medium text-pretty">{title}</span>
      {detail ? (
        <span className="text-xs text-pretty text-muted-foreground">
          {detail}
        </span>
      ) : null}
      {children ? (
        <span className="mt-1 flex flex-wrap gap-1.5">{children}</span>
      ) : null}
    </div>
  );
}

export type SendDone = { started: PressResult[]; refused: PressResult[] };

export function DriveSendSteps({
  eventIds,
  includeHidden,
  source,
  returnPath,
  pictures = [],
  upLabel,
  onBack,
  onDone,
  returned = null,
  desk,
}: {
  eventIds: string[];
  includeHidden: boolean;
  source: "panel" | "picker" | "storage";
  /** Where Google sends her back: a page a sign-in may return to (`/dashboard/<id>`, `/dashboard`, `/account`). */
  returnPath: string;
  /** The album's own pictures, for the folder. */
  pictures?: readonly string[];
  /** Where the up arrow goes, in words ("Take it home"). */
  upLabel: string;
  onBack: () => void;
  onDone: (done: SendDone) => void;
  /** What a return from Google said, when she has just come back. */
  returned?: DriveReturn | null;
  desk: boolean;
}) {
  const { status, loaded } = useDriveStatus();
  const [preview, setPreview] = useState<Record<string, AlbumPreview> | null>(
    null,
  );
  const [previewFailed, setPreviewFailed] = useState(false);
  const [pressing, setPressing] = useState(false);
  const [refusal, setRefusal] = useState<Extract<
    PressAnswer,
    { ok: false }
  > | null>(null);
  const [partial, setPartial] = useState<PressResult[]>([]);

  const connection = status?.connection ?? null;
  const connected = Boolean(connection && connection.status !== "revoked");
  const key = eventIds.join(",");

  useEffect(() => {
    if (!connected) return;
    let alive = true;
    void readPreview(eventIds, includeHidden).then((p) => {
      if (!alive) return;
      if (p) setPreview(p);
      else setPreviewFailed(true);
    });
    return () => {
      alive = false;
    };
    // `key` stands for the ids: a new array of the same albums asks nothing again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, key, includeHidden]);

  const albums = useMemo(
    () =>
      eventIds
        .map((id) => preview?.[id])
        .filter((a): a is AlbumPreview => Boolean(a)),
    [preview, eventIds],
  );
  const one = eventIds.length === 1 ? (albums[0] ?? null) : null;
  const total = albums.reduce((n, a) => n + a.items, 0);
  const bytes = albums.reduce((n, a) => n + a.bytes, 0);
  const newItems = albums.reduce(
    (n, a) => n + (a.unfinished ? 0 : a.newItems),
    0,
  );
  const newBytes = albums.reduce(
    (n, a) => n + (a.unfinished ? 0 : a.newBytes),
    0,
  );
  const sentBefore = albums.some((a) => a.sentBefore);
  const allUnderWay = albums.length > 0 && albums.every((a) => a.unfinished);

  const goToGoogle = () => {
    rememberIntent({
      source,
      events: eventIds,
      includeHidden,
      path: returnPath,
    });
    window.location.assign(connectHref(returnPath));
  };

  const press = async () => {
    setPressing(true);
    setRefusal(null);
    setPartial([]);
    const answer = await pressSend(eventIds, includeHidden);
    setPressing(false);
    void refreshDriveStatus();
    if (!answer.ok) {
      setRefusal(answer);
      return;
    }
    const started = answer.results.filter(
      (r) => r.state === "started" || r.state === "open" || r.state === "empty",
    );
    const refused = answer.results.filter(
      (r) => r.state === "refused" || r.state === "failed",
    );
    if (refused.length > 0 && started.length === 0) {
      setPartial(refused);
      return;
    }
    onDone({ started, refused });
  };

  const header = (
    <PopupHeader
      title="Send to Google Drive"
      up={{ label: upLabel, onUp: onBack }}
    />
  );

  if (!loaded) {
    return (
      <>
        {header}
        <PopupBody className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2
            className="size-4 animate-spin motion-reduce:animate-none"
            aria-hidden
          />{" "}
          Checking your Google Drive
        </PopupBody>
      </>
    );
  }

  if (status && !status.configured) {
    return (
      <>
        {header}
        <PopupBody>
          <Notice
            title="Send to Google Drive isn't set up yet."
            detail="It's on its way. Download keeps every original meanwhile."
          />
        </PopupBody>
      </>
    );
  }

  const folderLabel = one
    ? `Partyreel / ${one.name}`
    : "Partyreel / an album to a folder";
  const back =
    returned && returned !== "connected" && returned !== "switched"
      ? returnWords(returned)
      : null;

  if (!connected) {
    return (
      <>
        {header}
        <PopupBody className="flex flex-col gap-4">
          {back ? <Notice title={back.title} detail={back.detail} /> : null}
          {connection?.status === "revoked" ? (
            <Notice
              title="Partyreel lost access to your Google Drive."
              detail="Connect it again, and anything paused carries on where it stopped."
            />
          ) : null}
          <FolderPicture pictures={pictures} wide={desk} label={folderLabel} />
          <ul className="flex flex-col gap-3">
            <PromiseLine icon={<FolderUp />}>
              {eventIds.length === 1
                ? "We make a Partyreel folder in your Drive and put this album in it, every original."
                : `We make a Partyreel folder in your Drive and put each of these ${formatCount(eventIds.length)} albums in its own folder, every original.`}
            </PromiseLine>
            <PromiseLine icon={<EyeOff />}>
              We can only see what we put there. Never anything else in your
              Drive.
            </PromiseLine>
            <PromiseLine icon={<Unplug />}>
              Disconnect any time in Account. What we sent stays in your Drive.
            </PromiseLine>
          </ul>
          <p className="text-xs text-pretty text-muted-foreground">
            Google asks you to choose an account and to allow this next.
          </p>
        </PopupBody>
        <PopupFooter>
          <Button variant="outline" onClick={onBack}>
            Not now
          </Button>
          <Button onClick={goToGoogle}>
            {back ? "Try again" : "Continue to Google"}
          </Button>
        </PopupFooter>
      </>
    );
  }

  const who = connection?.email ?? "Your Google account";
  const free = connection?.free ?? null;
  const into = one
    ? `My Drive › Partyreel › ${driveFolderName({ name: one.name, eventDate: one.eventDate, endDate: one.eventEndDate })}`
    : "My Drive › Partyreel, an album to a folder";
  const sends = !preview
    ? previewFailed
      ? "Couldn't add it up"
      : "Adding it up"
    : `${formatCount(total)} ${total === 1 ? "photo or video" : "photos & videos"} · ${formatBytes(bytes)}, the originals`;
  const label =
    newItems === 0 && total > 0
      ? "Check them again"
      : sentBefore && newItems < total
        ? `Send ${formatCount(newItems)} new · ${formatBytes(newBytes)}`
        : `Send ${formatBytes(newBytes || bytes)}`;

  return (
    <>
      {header}
      <PopupBody className="flex flex-col gap-3">
        {returned === "connected" || returned === "switched" ? (
          <p role="status" className="text-sm text-pretty">
            {returnWords(returned).title} {returnWords(returned).detail ?? ""}
          </p>
        ) : null}
        <div className="flex items-center gap-3 rounded-float bg-card p-3 ring-1 ring-foreground/10">
          <Avatar size="sm">
            <AvatarFallback className="text-[10px]">
              {(connection?.email ?? "G").slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">{who}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {free !== null
                ? `Connected · ${formatBytes(free)} free in this Drive`
                : "Connected"}
            </span>
          </span>
          <Button variant="ghost" size="sm" onClick={goToGoogle}>
            Change
          </Button>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-muted-foreground">Sends</dt>
          <dd className="tabular-nums">{sends}</dd>
          {sentBefore && newItems < total ? (
            <>
              <dt className="text-muted-foreground">Already there</dt>
              <dd className="tabular-nums">{`${formatCount(total - newItems)}, checked and kept as they are`}</dd>
            </>
          ) : null}
          <dt className="text-muted-foreground">Into</dt>
          <dd className="min-w-0 truncate">{into}</dd>
          <dt className="text-muted-foreground">Takes</dt>
          <dd>{preview ? takesWords(newBytes || bytes) : ""}</dd>
        </dl>
        {allUnderWay ? (
          <Notice
            title={
              eventIds.length === 1
                ? "This album is already on its way."
                : "These albums are already on their way."
            }
          />
        ) : null}
        {refusal ? (
          <Notice {...refusalWords(refusal)}>
            {refusal.code === "drive_full" ? (
              <Button asChild variant="outline" size="sm">
                <a
                  href={GOOGLE_STORAGE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get more space
                </a>
              </Button>
            ) : null}
            {refusal.code === "disconnected" ||
            refusal.code === "not_connected" ||
            refusal.code === "domain_policy" ? (
              <Button variant="outline" size="sm" onClick={goToGoogle}>
                {refusal.code === "domain_policy"
                  ? "Use another account"
                  : "Reconnect"}
              </Button>
            ) : null}
          </Notice>
        ) : null}
        {partial.length > 0 ? (
          <Notice
            title={
              partial.length === 1
                ? "That album didn't start."
                : `${formatCount(partial.length)} albums didn't start.`
            }
          >
            <span className="text-xs text-pretty text-muted-foreground">
              {albumRefusalWords(partial[0]?.code)}
            </span>
          </Notice>
        ) : null}
        <p className="text-xs text-pretty text-muted-foreground">
          You can close this page: it carries on, and we email you when every
          file is in your Drive and checked.
        </p>
      </PopupBody>
      <PopupFooter>
        {allUnderWay ? (
          <Button onClick={() => onDone({ started: [], refused: [] })}>
            Show its progress
          </Button>
        ) : (
          <Button
            onClick={() => void press()}
            disabled={pressing || !preview || total === 0}
            className={cn(pressing && "cursor-progress")}
          >
            {pressing ? (
              <Loader2
                className="animate-spin motion-reduce:animate-none"
                aria-hidden
              />
            ) : (
              <FolderUp />
            )}
            {pressing ? "Starting" : label}
          </Button>
        )}
      </PopupFooter>
    </>
  );
}
