"use client";

/**
 * KEEP AND POST: THE HOST'S TWO SETS (take-home r1, `host=two`, Will's note: "host benefits massively from everything
 * at full quality, could also include an optimized download option (like to grab everything on a phone for quick
 * social posts, not the version that gets saved to a backup hard drive to keep forever later)").
 *
 * Her album's Download opens a panel of two, each named for what it is for and pictured by the album itself (bible
 * 6), with its facts and its one act:
 *  - ORIGINALS, "full size, to keep for good": every photograph and clip as taken, one zip (the walk's own parts
 *    past one zip's ceilings).
 *  - PHONE SIZE, "light enough to post tonight": the photographs at 2048 px (each one's phone-size copy, its
 *    original where it has none). On a phone whose own sheet takes files it SAVES them into Photos (the take-home
 *    engine, a sheet of up to 100 MB at a time); at a desk, and past one Save's 2,000, it downloads as a zip.
 * Clips come as they were taken, said once under both; Include hidden items, only when anything is hidden or waiting,
 * changes what both sets take and weigh. At a desk the originals lead (a drive is where a desk keeps them); in a
 * hand phone size leads (her phone is where she posts from).
 *
 * ★ THE PRODUCT'S PLAN POPUP is where it opens (`popup-kinds.ts`: wide at a desk, the whole screen in a hand), the
 * nearest kind the table has to the board's panel; the sizes and pictures are the server's (`step: "summary"`),
 * asked as it opens.
 */
import { useCallback, useRef, useState } from "react";
import { Download, ImageDown } from "lucide-react";

import { exportToasts } from "@/components/app/export/export-toast";
import {
  createTakeHomeSaver,
  type TakeHomeSaver,
} from "@/components/app/export/take-home-save";
import { useExportDownload } from "@/components/app/export/use-export-download";
import { Button } from "@/components/ui/button";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupHeader,
  PopupTrigger,
} from "@/components/ui/popup";
import { DESK_QUERY } from "@/components/ui/popup-kinds";
import { Switch } from "@/components/ui/switch";
import type { ExportSummary } from "@/lib/export/build-manifest";
import {
  SAVE_MAX_ITEMS,
  sheetCanSave,
  takeHomeSizes,
} from "@/lib/export/take-home";
import { formatCount, formatMediaCount } from "@/lib/format/count";
import { PHONE_MAX_EDGE } from "@/lib/media/preview-size";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn, formatBytes } from "@/lib/utils";

let saves = 0;

/** A plain download of one file (a clip too heavy for any sheet). */
function downloadFile(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

type Read = { summary: ExportSummary; pictures: string[] };

export function TakeHomePanel({
  eventId,
  children,
}: {
  eventId: string;
  /** The trigger (the album's Download button). */
  children: React.ReactNode;
}) {
  const desk = useMediaQuery(DESK_QUERY);
  const { startDownload } = useExportDownload();
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<Read | null>(null);
  const [failed, setFailed] = useState(false);
  const [includeHidden, setIncludeHidden] = useState(false);
  const [canSheet, setCanSheet] = useState(false);
  const ask = useRef(0);
  const saverRef = useRef<TakeHomeSaver | null>(null);

  const saver = useCallback((): TakeHomeSaver => {
    saverRef.current ??= createTakeHomeSaver({
      fetch: (input, init) => fetch(input, init),
      nav: navigator,
      toast: exportToasts,
      download: downloadFile,
      newId: () => `host-save-${++saves}`,
    });
    return saverRef.current;
  }, []);

  // Asked in the open EVENT, never an effect (a synchronous setState in an effect cascades renders), with a
  // request id so a stale answer after a quick close and reopen is dropped.
  function changeOpen(next: boolean) {
    setOpen(next);
    if (!next) return;
    setIncludeHidden(false);
    setRead(null);
    setFailed(false);
    setCanSheet(sheetCanSave(navigator));
    const id = ++ask.current;
    void fetch("/api/export/host", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ step: "summary", event_id: eventId }),
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as {
          ok?: boolean;
          summary?: ExportSummary;
          pictures?: string[];
        } | null;
        if (ask.current !== id) return;
        if (res.ok && body?.ok && body.summary) {
          setRead({ summary: body.summary, pictures: body.pictures ?? [] });
        } else setFailed(true);
      })
      .catch(() => {
        if (ask.current === id) setFailed(true);
      });
  }

  const sizes = read ? takeHomeSizes(read.summary, includeHidden) : null;
  const hasHidden =
    !!read &&
    read.summary.hidden.photo.count + read.summary.hidden.video.count > 0;
  // Phone size saves into Photos where this phone's sheet can take files and one Save holds the set.
  const savesToPhotos =
    canSheet && !!sizes && sizes.photos > 0 && sizes.photos <= SAVE_MAX_ITEMS;

  const originals = () => {
    void startDownload("host", {
      event_id: eventId,
      types: "all",
      include_hidden: includeHidden,
    });
    setOpen(false);
  };
  const phoneSize = () => {
    const body = {
      event_id: eventId,
      types: "photo",
      include_hidden: includeHidden,
      size: "phone",
    };
    if (savesToPhotos) void saver().start("host", body);
    else void startDownload("host", body);
    setOpen(false);
  };

  const originalsCard = (
    <SetCard
      key="originals"
      name="Originals"
      purpose="Full size, to keep for good."
      facts={
        sizes
          ? `${formatCount(sizes.photos + sizes.clips)} · ${formatBytes(sizes.original)} · a zip`
          : failed
            ? "Couldn't add it up"
            : "Adding it up"
      }
      pictures={read?.pictures ?? []}
      from={0}
      lead={desk}
      wide={desk}
      act={
        <Button
          type="button"
          variant={desk ? "default" : "outline"}
          size="sm"
          disabled={!sizes || sizes.photos + sizes.clips === 0}
          onClick={originals}
        >
          <Download /> Download
        </Button>
      }
    />
  );
  const phoneCard = (
    <SetCard
      key="phone"
      name="Phone size"
      purpose="Light enough to post tonight."
      facts={
        sizes
          ? `${formatCount(sizes.photos)} ${sizes.photos === 1 ? "photo" : "photos"} · ${formatBytes(sizes.photosPhone)} · ${formatCount(PHONE_MAX_EDGE)} px`
          : failed
            ? "Couldn't add it up"
            : "Adding it up"
      }
      pictures={read?.pictures ?? []}
      from={1}
      lead={!desk}
      wide={desk}
      act={
        <Button
          type="button"
          variant={desk ? "outline" : "default"}
          size="sm"
          disabled={!sizes || sizes.photos === 0}
          onClick={phoneSize}
        >
          {savesToPhotos ? <ImageDown /> : <Download />}
          {savesToPhotos ? "Save" : "Download"}
        </Button>
      }
    />
  );

  return (
    <Popup open={open} onOpenChange={changeOpen}>
      <PopupTrigger asChild>{children}</PopupTrigger>
      <PopupContent kind="plan" data-take-home="">
        <PopupHeader
          title="Take it home"
          description={
            sizes
              ? formatMediaCount(sizes.photos + sizes.clips)
              : "Your album, two ways"
          }
        />
        <PopupBody className="flex flex-col gap-3">
          <div
            className={cn("gap-3", desk ? "grid grid-cols-2" : "flex flex-col")}
          >
            {desk ? [originalsCard, phoneCard] : [phoneCard, originalsCard]}
          </div>
          {sizes && sizes.clips > 0 && (
            <p className="text-xs text-pretty text-muted-foreground">
              {`Clips come as they were taken: ${formatCount(sizes.clips)} · ${formatBytes(sizes.clipBytes)}, with the originals.`}
            </p>
          )}
          {hasHidden && (
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                Include hidden items
              </span>
              <Switch
                checked={includeHidden}
                onCheckedChange={setIncludeHidden}
                aria-label="Include hidden items"
              />
            </label>
          )}
        </PopupBody>
      </PopupContent>
    </Popup>
  );
}

/**
 * ONE OF THE TWO SETS: the album's own picture, its name, what it is for, its facts and its one act. The set a
 * screen leads with wears the primary act; the other stands beside it in outline.
 */
function SetCard({
  name,
  purpose,
  facts,
  pictures,
  from,
  lead,
  wide,
  act,
}: {
  name: string;
  purpose: string;
  facts: string;
  pictures: readonly string[];
  /** Where in the album's pictures this set's mosaic starts, so the two read as two. */
  from: number;
  lead: boolean;
  wide: boolean;
  act: React.ReactNode;
}) {
  return (
    <div
      data-set-card={name}
      data-lead={lead ? "" : undefined}
      className="flex flex-col gap-2.5 rounded-float bg-card p-2 ring-1 ring-foreground/10"
    >
      <Mosaic pictures={pictures} from={from} wide={wide} />
      <div
        className={cn(
          "flex gap-3 px-1.5 pb-1",
          wide ? "flex-col gap-0.5" : "items-center",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-heading text-lg">{name}</span>
          <span className="text-sm text-pretty text-muted-foreground">
            {purpose}
          </span>
          <span
            data-set-facts=""
            className="text-xs text-muted-foreground tabular-nums"
          >
            {facts}
          </span>
        </div>
        <div className={cn("shrink-0", wide && "mt-3 self-start")}>{act}</div>
      </div>
    </div>
  );
}

/**
 * A SET'S PICTURE, THE ALBUM ITSELF: its newest photographs in rows of one height (two rows of three in a desk's
 * card, one row of four across a hand's), or the muted ground while they arrive.
 */
function Mosaic({
  pictures,
  from,
  wide,
}: {
  pictures: readonly string[];
  from: number;
  wide: boolean;
}) {
  const n = wide ? 6 : 4;
  return (
    <span
      aria-hidden
      className={cn(
        "grid gap-0.5 overflow-hidden rounded-[calc(var(--radius-float)-4px)] bg-muted",
        wide ? "aspect-[3/2] grid-cols-3 grid-rows-2" : "h-16 grid-cols-4",
      )}
    >
      {Array.from({ length: n }, (_, k) => {
        // Each card its own run of the album's pictures (the second starts halfway), never one picture twice
        // in a card: an album with fewer pictures than cells leaves the rest on the muted ground.
        const enough = pictures.length >= n;
        const src = enough
          ? pictures[(from * 3 + k) % pictures.length]
          : k < pictures.length
            ? pictures[(from + k) % pictures.length]
            : null;
        return src ? (
          // eslint-disable-next-line @next/next/no-img-element -- a presigned tile, never next/image (media-cost-policy)
          <img
            key={k}
            src={src}
            alt=""
            draggable={false}
            className="size-full min-h-0 object-cover"
          />
        ) : (
          <span key={k} className="size-full bg-muted" />
        );
      })}
    </span>
  );
}
