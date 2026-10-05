"use client";

/**
 * WHAT'S USING SPACE OFFERS DRIVE (Will, desk 2: `doors = both`, "a full plan meets its way out where she looks"):
 * filtered to one album, a line that keeps every original of it in her own Google Drive, its press opening the same
 * promise and final press as Take it home's. Nothing here deletes or suggests deleting (`done = done-only`, the exit
 * dropped): deleting stays this list's own, as it always was.
 */
import { useState } from "react";
import { ExternalLink, FolderUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popup, PopupContent } from "@/components/ui/popup";
import { DESK_QUERY } from "@/components/ui/popup-kinds";
import { sendForAlbum, tileLight } from "@/lib/drive/moments";
import { useMediaQuery } from "@/lib/use-media-query";

import { DriveName } from "./drive-parts";
import { DriveSendSteps, type SendDone } from "./send-steps";
import { useDriveStatus } from "./use-drive-status";

function SentLine({ eventId }: { eventId: string }) {
  const { status } = useDriveStatus();
  const send = status ? sendForAlbum(status.sends, eventId) : null;
  const light = send ? tileLight(send) : null;
  if (!send || !light) return null;
  return (
    <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground tabular-nums">
      <span>
        {light.tone === "done"
          ? "In your Drive, every one checked"
          : light.label}
      </span>
      {send.status === "done" && send.folderUrl ? (
        <a
          href={send.folderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline"
        >
          Open in Drive <ExternalLink className="size-3" aria-hidden />
        </a>
      ) : null}
    </span>
  );
}

export function DriveStorageDoor({
  eventId,
  albumName,
}: {
  eventId: string;
  albumName: string;
}) {
  const desk = useMediaQuery(DESK_QUERY);
  const [open, setOpen] = useState(false);
  const done = (result: SendDone) => {
    setOpen(false);
    if (result.started.some((r) => r.state === "started")) {
      toast.success("Sending to Google Drive", {
        id: `drive-started-${eventId}`,
        description:
          "You can close this page: we'll email you when every file is in your Drive.",
      });
    }
  };
  return (
    <div
      data-drive-storage-door=""
      className="-mx-2 mb-2 flex flex-col gap-2 rounded-lg border border-border px-3 py-2.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <DriveName className="text-sm font-medium text-foreground" />
          <p className="text-xs text-pretty text-muted-foreground">{`Keep every original of ${albumName} in your own Drive.`}</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setOpen(true)}
        >
          <FolderUp /> Send to Drive
        </Button>
      </div>
      {open ? null : <SentLine eventId={eventId} />}
      <Popup open={open} onOpenChange={setOpen}>
        <PopupContent kind="plan" data-drive-storage="">
          <DriveSendSteps
            eventIds={[eventId]}
            includeHidden={false}
            source="storage"
            returnPath="/dashboard"
            upLabel="What's using space"
            onBack={() => setOpen(false)}
            onDone={done}
            desk={desk}
          />
        </PopupContent>
      </Popup>
    </div>
  );
}
