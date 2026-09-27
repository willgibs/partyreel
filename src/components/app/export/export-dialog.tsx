"use client";

import { useRef, useState } from "react";
import { Slot } from "radix-ui";

import { Image as ImageIcon, Layers, Video } from "lucide-react";

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
import { formatCount } from "@/lib/format/count";
import { formatBytes } from "@/lib/utils";

import { type ExportScope, useExportDownload } from "./use-export-download";

/**
 * "DOWNLOAD", AS A QUICK CHOICE (`popups` r1, `choices=menu`, Will
 * 2026-09-27): at a desk a menu under the Download that asked, like any menu;
 * in a hand the three bundles rise to the thumb as the phone's own chooser
 * does, Cancel beneath (`ui/responsive-menu.tsx`).
 *
 * ★ A ROW IS THE ACT. Everything, Photos or Videos starts that bundle at once:
 * the menu closes, and the download's own toast says it is being prepared and
 * when it starts (`use-export-download.ts`). Each row carries what it would
 * take home, the count and the size, from the summary endpoint the menu asks
 * as it opens; a bundle over the export limit is a row that cannot be pressed,
 * and the note under the rows says why. The host's Include hidden items flips
 * in place and changes what every row is worth.
 *
 * ★ `export-flow`'s `object` ask ("Should Download open a sheet of bundles, or
 * simply start?") is this answer's to settle: its `menu` option, reached by the
 * kind. The Handoff names it for the desk.
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

const CHIPS: { key: ExportTypeFilter; label: string; Icon: typeof Layers }[] = [
  { key: "all", label: "Everything", Icon: Layers },
  { key: "photo", label: "Photos", Icon: ImageIcon },
  { key: "video", label: "Videos", Icon: Video },
];

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
  const [summary, setSummary] = useState<ExportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [includeHidden, setIncludeHidden] = useState(false);

  // Reset + fetch the breakdown when the menu opens (in the open EVENT, not an effect —
  // synchronous setState in an effect cascades renders). A request id guards against a stale summary
  // landing after a rapid close/reopen.
  const reqId = useRef(0);
  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;
    setIncludeHidden(false);
    setSummary(null);
    setLoading(true);
    const id = ++reqId.current;
    const body =
      scope === "host" ? { event_id: albumKey } : { qr_token: albumKey };
    void fetchSummary(scope, body).then((s) => {
      if (reqId.current !== id) return;
      setSummary(s);
      setLoading(false);
    });
  }

  const hasHidden =
    !!summary &&
    summary.hidden.photo.count + summary.hidden.video.count > 0;
  const showHiddenToggle = isHost && hasHidden;

  const rows = CHIPS.map((chip) => {
    const total = totalFor(summary, chip.key, includeHidden);
    return {
      ...chip,
      total,
      over: total.count > MAX_EXPORT_ITEMS || total.bytes > MAX_EXPORT_BYTES,
    };
  });
  const anyOver = rows.some((row) => row.over);
  const note = loading
    ? "Adding it up"
    : !summary
      ? "Couldn't add it up. Close and try again."
      : anyOver
        ? "Too large to download all at once. Pick photos or videos to split it up."
        : "Each downloads as one file.";

  function download(types: ExportTypeFilter) {
    const mintBody =
      scope === "host"
        ? { event_id: albumKey, types, include_hidden: includeHidden }
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
        {rows.map(({ key, label, Icon, total, over }) => (
          <ResponsiveMenuItem
            key={key}
            icon={<Icon />}
            hint={
              summary
                ? `${formatCount(total.count)} · ${formatBytes(total.bytes)}`
                : "·"
            }
            disabled={!summary || total.count === 0 || over}
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
