"use client";

import { useRef, useState } from "react";
import { Slot } from "radix-ui";

import { Image as ImageIcon, Layers, UserRound, Video } from "lucide-react";

import {
  ResponsiveMenu,
  ResponsiveMenuItem,
  ResponsiveMenuNote,
  ResponsiveMenuToggle,
} from "@/components/ui/responsive-menu";
import {
  type ExportSummary,
  type ExportTypeFilter,
  MAX_EXPORT_BYTES,
  MAX_EXPORT_ITEMS,
} from "@/lib/export/build-manifest";
import { type DownloadPlace, downloadPlaceFor } from "@/lib/export/walk";
import { formatCount } from "@/lib/format/count";
import { detectPlatform } from "@/lib/media/share-save";
import { formatBytes } from "@/lib/utils";

import {
  type ExportMenuSummary,
  type ExportScope,
  useExportDownload,
} from "./use-export-download";

/**
 * "DOWNLOAD", AS A QUICK CHOICE (`popups` r1, `choices=menu`, Will 2026-09-27): at a desk a menu under
 * the Download that asked, like any menu; in a hand the rows rise to the thumb as the phone's own
 * chooser does, Cancel beneath (`ui/responsive-menu.tsx`).
 *
 * ★ A ROW IS THE ACT. Everything, Photos or Videos starts that bundle at once: the menu closes, and the
 * download's own toast carries it from there (`export-walk.ts`). Each row carries what it would take
 * home, the count and the size, from the summary endpoint the menu asks as it opens. The host's
 * Include hidden items flips in place and changes what every row is worth.
 *
 * `export-flow` r1's answers, in the menu:
 *  - `means=mine`: a guest who has added something here gets YOURS at the top, the set View's Yours
 *    already names, counted and filtered by the server (her account and this browser's ticket,
 *    never an id list from here). Will: it "does support getting any pictures/videos you took live
 *    in-app".
 *  - `cap=split`: a row past one zip's 2,000 items or 20 GB is live like any other, and says so in
 *    no label ("Nobody in my family would understand 'in 2 zips'"). The walk says the parts once
 *    it starts, in plain words; the note under the rows mentions them only when a row needs them.
 *  - `phone` (built as the board's zip): on a phone the note says where the file goes, Files or
 *    Downloads, and on an iPhone where a single photograph's way into Photos is.
 */

type Bucket = { count: number; bytes: number };
const ZERO: Bucket = { count: 0, bytes: 0 };

function bucketFor(
  summary: ExportSummary | null,
  type: "photo" | "video",
  includeHidden: boolean,
): Bucket {
  if (!summary) return ZERO;
  const s = summary.shown[type];
  if (!includeHidden) return s;
  const h = summary.hidden[type];
  return { count: s.count + h.count, bytes: s.bytes + h.bytes };
}

function totalFor(
  summary: ExportSummary | null,
  types: ExportTypeFilter,
  includeHidden: boolean,
): Bucket {
  const photo = bucketFor(summary, "photo", includeHidden);
  const video = bucketFor(summary, "video", includeHidden);
  if (types === "photo") return photo;
  if (types === "video") return video;
  return {
    count: photo.count + video.count,
    bytes: photo.bytes + video.bytes,
  };
}

/** Past one zip's ceilings: this row will come home in parts. */
const inParts = (b: Bucket) =>
  b.count > MAX_EXPORT_ITEMS || b.bytes > MAX_EXPORT_BYTES;

const hintFor = (b: Bucket) =>
  `${formatCount(b.count)} · ${formatBytes(b.bytes)}`;

const CHIPS: { key: ExportTypeFilter; label: string; Icon: typeof Layers }[] = [
  { key: "all", label: "Everything", Icon: Layers },
  { key: "photo", label: "Photos", Icon: ImageIcon },
  { key: "video", label: "Videos", Icon: Video },
];

/**
 * THE LINE UNDER THE ROWS: the act's terms. Where a file goes (a desk knows; a phone is told), then
 * the parts when a row needs them, then, on an iPhone, the way a single photograph reaches Photos.
 */
export function downloadMenuNote({
  loading,
  failed,
  place,
  anyInParts,
}: {
  loading: boolean;
  failed: boolean;
  place: DownloadPlace;
  anyInParts: boolean;
}): string {
  if (loading) return "Adding it up";
  if (failed) return "Couldn't add it up. Close and try again.";
  const where =
    place === "files"
      ? "Each saves to your Files app"
      : place === "downloads"
        ? "Each saves to your Downloads"
        : "Each downloads as one file";
  const parts = anyInParts ? ", a big album in parts" : "";
  const photos =
    place === "files"
      ? " To keep a photo in Photos, open it and tap Save."
      : "";
  return `${where}${parts}.${photos}`;
}

export function ExportDialog({
  scope,
  albumKey,
  isHost = false,
  children,
}: {
  scope: ExportScope;
  /** event_id for host, qr_token for guest — the album the API resolves. */
  albumKey: string;
  /** Host gets the "Include hidden" control (guests only ever see their visible set). */
  isHost?: boolean;
  /** The trigger element (a Button): the menu opens under it. */
  children: React.ReactNode;
}) {
  const { fetchSummary, startDownload } = useExportDownload();
  const triggerRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<ExportMenuSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [includeHidden, setIncludeHidden] = useState(false);
  const [place, setPlace] = useState<DownloadPlace>("desk");

  // Reset + fetch the breakdown when the menu opens (in the open EVENT, not an effect —
  // synchronous setState in an effect cascades renders). A request id guards against a stale summary
  // landing after a rapid close/reopen.
  const reqId = useRef(0);
  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;
    setIncludeHidden(false);
    setMenu(null);
    setLoading(true);
    // Read on the tap, in the browser: the note names this device's own place for a file.
    setPlace(downloadPlaceFor(detectPlatform(navigator)));
    const id = ++reqId.current;
    const body =
      scope === "host" ? { event_id: albumKey } : { qr_token: albumKey };
    void fetchSummary(scope, body).then((got) => {
      if (reqId.current !== id) return;
      setMenu(got);
      setLoading(false);
    });
  }

  const summary = menu?.summary ?? null;
  const hasHidden =
    !!summary && summary.hidden.photo.count + summary.hidden.video.count > 0;
  const showHiddenToggle = isHost && hasHidden;

  // YOURS leads, for a guest with something of hers here; the server says whether she has.
  const yours =
    scope === "guest" && menu?.yours
      ? totalFor(menu.yours, "all", false)
      : null;
  const rows = CHIPS.map((chip) => ({
    ...chip,
    total: totalFor(summary, chip.key, includeHidden),
  }));
  const anyInParts =
    rows.some((row) => inParts(row.total)) || (!!yours && inParts(yours));
  const note = downloadMenuNote({
    loading,
    failed: !loading && !summary,
    place,
    anyInParts,
  });

  function download(types: ExportTypeFilter, set: "album" | "yours" = "album") {
    const mintBody =
      scope === "host"
        ? { event_id: albumKey, types, include_hidden: includeHidden }
        : set === "yours"
          ? { qr_token: albumKey, types: "all", set: "yours" }
          : { qr_token: albumKey, types };
    // The menu has already closed (the row is the act); the toast carries the wait.
    void startDownload(scope, mintBody);
  }

  return (
    <>
      <Slot.Root
        ref={triggerRef}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => handleOpenChange(!open)}
      >
        {children}
      </Slot.Root>
      <ResponsiveMenu
        open={open}
        onOpenChange={handleOpenChange}
        anchor={triggerRef}
        title="Download album"
        showTitle
        align="end"
      >
        {yours && yours.count > 0 ? (
          <ResponsiveMenuItem
            icon={<UserRound />}
            hint={hintFor(yours)}
            onSelect={() => download("all", "yours")}
          >
            Yours
          </ResponsiveMenuItem>
        ) : null}
        {rows.map(({ key, label, Icon, total }) => (
          <ResponsiveMenuItem
            key={key}
            icon={<Icon />}
            hint={summary ? hintFor(total) : "·"}
            disabled={!summary || total.count === 0}
            onSelect={() => download(key)}
          >
            {label}
          </ResponsiveMenuItem>
        ))}
        {showHiddenToggle && (
          <ResponsiveMenuToggle
            checked={includeHidden}
            onCheckedChange={setIncludeHidden}
          >
            Include hidden items
          </ResponsiveMenuToggle>
        )}
        <ResponsiveMenuNote>{note}</ResponsiveMenuNote>
      </ResponsiveMenu>
    </>
  );
}
