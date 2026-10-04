"use client";

/**
 * HER SAVE (take-home r1: `guest=select`, `save=light`): what the foot's Save does with her picks.
 *
 *  - On a phone that can hand files to its own sheet, a quick choice rises to the thumb (`ResponsiveMenu`, the
 *    product's one quick choice): Save to Photos, at phone size, beside Save to Files, the originals as one zip,
 *    EACH WITH ITS SIZE ("24 photos · 13 MB" beside "Originals · 70 MB"). His note on the pick: "subtly preview
 *    the file size beside images versus files options so they can clearly see that saving to files seems to be a
 *    more high quality download if needed". The sizes are the server's (`step: "summary"` with her ids), asked as
 *    the choice opens; the rows act at once and never wait for them.
 *  - At a desk (the board's carried `desk`), and anywhere no sheet can take a file, Save is the originals' zip,
 *    through the download's own walk (`export-walk.ts`), no question asked.
 *
 * Photos goes through the take-home engine (`take-home-save.ts`), whose state turns the shutter: its ring fills as
 * her photographs arrive, a press stops it, Ready asks for the press that opens the sheet, and a check closes
 * select mode once everything went. Her picks travel as ids (the server narrows them to what she can see); all of
 * the album is asked as the album, so a selection past one request's ids still means everything.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { FolderDown, ImageDown } from "lucide-react";
import { toast } from "sonner";

import { exportToasts } from "@/components/app/export/export-toast";
import {
  createTakeHomeSaver,
  type SaveState,
  type TakeHomeSaver,
} from "@/components/app/export/take-home-save";
import { useExportDownload } from "@/components/app/export/use-export-download";
import type { GridMedia } from "@/components/app/media-grid";
import {
  guestSelect,
  useGuestSelect,
  type GuestSaveRun,
} from "@/components/guest/live-gallery-select";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
  ResponsiveMenuNote,
} from "@/components/ui/responsive-menu";
import { BULK_LIMIT_MESSAGE, MAX_BULK_ITEMS } from "@/lib/event/bulk-selection";
import type { ExportSummary } from "@/lib/export/build-manifest";
import {
  fitsOneSave,
  saveHints,
  setNoun,
  sheetCanSave,
  takeHomeSizes,
  TOO_MANY_FOR_PHOTOS,
  type TakeHomeSizes,
} from "@/lib/export/take-home";
import { downloadPlaceFor } from "@/lib/export/walk";
import { detectPlatform } from "@/lib/media/share-save";

/** How long the shutter holds its check once everything went, before select mode closes (the dock's own beat). */
const DONE_HOLD_MS = 1600;

let saves = 0;

/** The engine's state, as the shutter draws it. */
function runOf(state: SaveState): GuestSaveRun {
  switch (state.kind) {
    case "getting":
      return { kind: "getting", progress: state.progress };
    case "ready":
      return { kind: "ready" };
    case "done":
      return { kind: "done" };
    default:
      // Minting the links is the first of the wait: the ring stands at its start.
      return state.kind === "asking"
        ? { kind: "getting", progress: 0 }
        : { kind: "idle" };
  }
}

/** A plain download of one file: a top-level link (its attachment name is signed into it). */
function downloadFile(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function GuestSaveChoice({
  qrToken,
  items,
}: {
  qrToken: string;
  /** The album as she sees it: her picks' kinds, and whether she picked all of it. */
  items: readonly GridMedia[];
}) {
  const { startDownload } = useExportDownload();
  const [open, setOpen] = useState(false);
  const [sizes, setSizes] = useState<TakeHomeSizes | null>(null);
  const [failed, setFailed] = useState(false);
  const [place, setPlace] = useState<"files" | "downloads">("files");
  const ask = useRef(0);

  // One engine for the page's life: its state turns the shutter, and a check closes select mode.
  const saverRef = useRef<TakeHomeSaver | null>(null);
  const doneTimer = useRef<number | null>(null);
  const saver = useCallback((): TakeHomeSaver => {
    if (!saverRef.current) {
      saverRef.current = createTakeHomeSaver({
        fetch: (input, init) => fetch(input, init),
        nav: navigator,
        toast: exportToasts,
        download: downloadFile,
        newId: () => `save-${++saves}`,
        onState: (state) => {
          guestSelect.setRun(runOf(state));
          if (state.kind === "done") {
            doneTimer.current = window.setTimeout(
              () => guestSelect.exit(),
              DONE_HOLD_MS,
            );
          }
        },
      });
    }
    return saverRef.current;
  }, []);
  useEffect(
    () => () => {
      if (doneTimer.current !== null) window.clearTimeout(doneTimer.current);
      saverRef.current?.stop();
    },
    [],
  );

  /** What a request names: her ids, or the album as the album when she picked all of it. */
  const setOf = useCallback(
    (picks: readonly string[]): Record<string, unknown> | null => {
      const picked = new Set(picks);
      if (
        picks.length >= items.length &&
        items.every((i) => picked.has(i.id))
      ) {
        return { qr_token: qrToken, set: "album" };
      }
      if (picks.length > MAX_BULK_ITEMS) return null;
      return { qr_token: qrToken, ids: [...picks] };
    },
    [items, qrToken],
  );

  /** The originals, as one zip, through the download's own walk; select mode ends as it starts. */
  const originals = useCallback(
    (picks: readonly string[]) => {
      const set = setOf(picks);
      if (!set) {
        toast.error(BULK_LIMIT_MESSAGE);
        return;
      }
      void startDownload("guest", { ...set, types: "all" });
      guestSelect.exit();
    },
    [setOf, startDownload],
  );

  // The foot's Save: stop a Save under way, open the sheet when it is ready, else ask how to save.
  useEffect(
    () =>
      guestSelect.onPress(() => {
        const { run, picks } = guestSelect.get();
        if (run.kind === "getting") {
          // A stop she means asks first (E6); the engine says what it did, so nothing here draws a word.
          saver().cancel();
          return;
        }
        if (run.kind === "ready") {
          saver().tap();
          return;
        }
        if (picks.length === 0 || run.kind === "done") return;
        if (!sheetCanSave(navigator)) {
          originals(picks);
          return;
        }
        const set = setOf(picks);
        if (!set) {
          toast.error(BULK_LIMIT_MESSAGE);
          return;
        }
        // The choice opens at once; its sizes follow from the server.
        setPlace(
          downloadPlaceFor(detectPlatform(navigator)) === "downloads"
            ? "downloads"
            : "files",
        );
        setSizes(null);
        setFailed(false);
        setOpen(true);
        const id = ++ask.current;
        void fetch("/api/export/guest", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ step: "summary", ...set }),
        })
          .then(async (res) => {
            const body = (await res.json().catch(() => null)) as {
              ok?: boolean;
              summary?: ExportSummary;
              selection?: ExportSummary;
            } | null;
            if (ask.current !== id) return;
            const summary = body?.selection ?? body?.summary;
            if (res.ok && body?.ok && summary) setSizes(takeHomeSizes(summary));
            else setFailed(true);
          })
          .catch(() => {
            if (ask.current === id) setFailed(true);
          });
      }),
    [originals, saver, setOf],
  );

  const { picks } = useGuestSelect();
  const kinds = new Map(items.map((i) => [i.id, i.type]));
  const photos = picks.filter((id) => kinds.get(id) !== "video").length;
  const clips = picks.length - photos;
  const noun = setNoun(photos, clips);
  const hints = sizes ? saveHints(sizes) : null;
  // A set past one Save: Photos waits (all or none), and the originals take every one.
  const tooMany = !!sizes && !fitsOneSave(sizes);

  return (
    <ResponsiveMenu
      open={open}
      onOpenChange={setOpen}
      anchor="pressed"
      title={`Save ${noun}`}
      showTitle
      align="center"
    >
      <ResponsiveMenuItem
        icon={<ImageDown />}
        hint={hints?.photos ?? "·"}
        disabled={tooMany}
        onSelect={() => {
          const set = setOf(guestSelect.get().picks);
          // Inside the tap: the engine's reads start now, and a sheet that is ready in time opens in it.
          if (set) void saver().start("guest", { ...set, size: "phone" });
        }}
      >
        Save to Photos
      </ResponsiveMenuItem>
      <ResponsiveMenuItem
        icon={<FolderDown />}
        hint={hints?.originals ?? "·"}
        onSelect={() => originals(guestSelect.get().picks)}
      >
        {place === "downloads" ? "Save to Downloads" : "Save to Files"}
      </ResponsiveMenuItem>
      <ResponsiveMenuNote>
        {failed
          ? "Couldn't add up the sizes. Either way still saves."
          : tooMany
            ? TOO_MANY_FOR_PHOTOS
            : sizes
              ? "Photos takes phone size, sharp in any post. The originals keep every pixel."
              : "Adding up the sizes"}
      </ResponsiveMenuNote>
    </ResponsiveMenu>
  );
}
