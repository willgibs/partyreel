"use client";

import { useEffect, useRef, useState } from "react";

import { Download, Image as ImageIcon, Layers, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  type ExportSummary,
  type ExportTypeFilter,
  MAX_EXPORT_BYTES,
  MAX_EXPORT_ITEMS,
} from "@/lib/export/build-manifest";
import { cn, formatBytes } from "@/lib/utils";

import { type ExportScope, useExportDownload } from "./use-export-download";

// The "Download all" config modal — design-lab Concept B ("tactile picker"): three chip-cards
// (Everything / Photos / Videos, each with its live count) drive the selection, the host gets an
// "Include hidden" switch, and the total size + item count sit BELOW as the *result* (footer-left)
// next to the Download button. Framing the total as a consequence of the config keeps focus on the
// choice and reads as a deliberate checkpoint (the guard against an accidental huge download). The
// breakdown comes authoritatively from the summary endpoint; every selection recomputes instantly
// client-side, and the size animates on change (the emil number-transition).

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
  /** The trigger element (a Button). */
  children: React.ReactNode;
}) {
  const { fetchSummary, startDownload } = useExportDownload();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<ExportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState<ExportTypeFilter>("all");
  const [includeHidden, setIncludeHidden] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset the selection + fetch the breakdown when the modal opens (in the open EVENT, not an effect —
  // synchronous setState in an effect cascades renders). A request id guards against a stale summary
  // landing after a rapid close/reopen.
  const reqId = useRef(0);
  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;
    setTypes("all");
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

  const result = totalFor(summary, types, includeHidden);
  const overCap =
    result.count > MAX_EXPORT_ITEMS || result.bytes > MAX_EXPORT_BYTES;
  const empty = result.count === 0;
  const sizeText = formatBytes(result.bytes);

  // Brief opacity dip when the result changes → the size reads as the consequence of the config.
  const sizeRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = sizeRef.current;
    if (!el) return;
    el.style.opacity = "0.4";
    const id = requestAnimationFrame(() => {
      el.style.opacity = "1";
    });
    return () => cancelAnimationFrame(id);
  }, [sizeText, result.count]);

  async function onDownload() {
    setSubmitting(true);
    const mintBody =
      scope === "host"
        ? { event_id: albumKey, types, include_hidden: includeHidden }
        : { qr_token: albumKey, types };
    const ok = await startDownload(scope, mintBody);
    setSubmitting(false);
    if (ok) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[26rem]">
        <DialogHeader>
          <DialogTitle>Download album</DialogTitle>
          <DialogDescription>
            Pick what to bundle into your copy.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          {CHIPS.map(({ key, label, Icon }) => {
            const active = types === key;
            const count = totalFor(summary, key, includeHidden).count;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => setTypes(key)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-lg border px-2 py-3 text-center transition-[transform,border-color,background-color] duration-150 ease-emphasis active:scale-[0.97] motion-reduce:active:scale-100",
                  active
                    ? "border-primary bg-accent"
                    : "border-border hover:bg-accent/50",
                )}
              >
                <Icon
                  className={cn(
                    "size-5",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                />
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {summary ? count : "·"}
                </span>
              </button>
            );
          })}
        </div>

        {showHiddenToggle && (
          <label className="flex items-center justify-between gap-3 border-t border-border pt-3.5">
            <span className="text-sm text-muted-foreground">
              Include hidden items
            </span>
            <Switch
              checked={includeHidden}
              onCheckedChange={setIncludeHidden}
              aria-label="Include hidden items"
            />
          </label>
        )}

        <div className="mt-1 flex items-center justify-between gap-3">
          {overCap ? (
            <p className="text-sm text-warning">
              Too large to download all at once. Pick photos or videos to split
              it up.
            </p>
          ) : (
            <div>
              <span
                ref={sizeRef}
                className="text-2xl font-medium tabular-nums transition-opacity duration-200"
              >
                {loading ? "…" : sizeText}
              </span>
              <div className="text-xs tabular-nums text-muted-foreground">
                {loading
                  ? "Adding it up"
                  : empty
                    ? "Nothing selected"
                    : `${result.count} ${result.count === 1 ? "item" : "items"}`}
              </div>
            </div>
          )}
          <Button
            type="button"
            onClick={onDownload}
            disabled={submitting || loading || empty || overCap}
          >
            <Download /> Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
