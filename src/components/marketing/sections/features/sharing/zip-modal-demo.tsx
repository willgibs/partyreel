"use client";

import {
  Check,
  Download,
  Image as ImageIcon,
  Layers,
  Video,
} from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { Caption } from "@/components/marketing/system/caption";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn, formatBytes } from "@/lib/utils";

/**
 * THE SIGNATURE (sharing page): a working "Download album" config modal. It
 * QUOTES the shipped export dialog (export-dialog.tsx): the exact title +
 * description, the three chip-cards (icon over label over live count, active =
 * border-primary bg-accent), the host-only "Include hidden items" Switch row,
 * and the footer's big tabular size + "N items" line beside the primary
 * Download. Every selection recomputes the totals like the app does, and the
 * size lands with the number-pop recipe ([data-mkt-digits], marketing.css
 * chapter 2), which reduce-degrades to a plain swap. The Download button plays
 * a one-shot icon swap (09-icon-swap) instead of pretending to zip anything.
 *
 * The byte math is an art-directed fixture (a plausible wedding album), but it
 * formats through the REAL formatBytes, so the sizes read exactly as the app
 * would print them. Caps deliberately unmentioned (unmarketed).
 */

type TypeFilter = "all" | "photo" | "video";
type Bucket = { count: number; bytes: number };

const MB = 1024 * 1024;
const SUMMARY = {
  shown: {
    photo: { count: 186, bytes: 812 * MB },
    video: { count: 14, bytes: 430 * MB },
  },
  hidden: {
    photo: { count: 11, bytes: 58 * MB },
    video: { count: 1, bytes: 96 * MB },
  },
} as const;

function bucketFor(type: "photo" | "video", includeHidden: boolean): Bucket {
  const s = SUMMARY.shown[type];
  if (!includeHidden) return s;
  const h = SUMMARY.hidden[type];
  return { count: s.count + h.count, bytes: s.bytes + h.bytes };
}

function totalFor(types: TypeFilter, includeHidden: boolean): Bucket {
  const photo = bucketFor("photo", includeHidden);
  const video = bucketFor("video", includeHidden);
  if (types === "photo") return photo;
  if (types === "video") return video;
  return { count: photo.count + video.count, bytes: photo.bytes + video.bytes };
}

const CHIPS: { key: TypeFilter; label: string; Icon: typeof Layers }[] = [
  { key: "all", label: "Everything", Icon: Layers },
  { key: "photo", label: "Photos", Icon: ImageIcon },
  { key: "video", label: "Videos", Icon: Video },
];

/** The size re-pops per value: keyed remount refires the digit animation. */
function SizePop({ text }: { text: string }) {
  return (
    <span
      key={text}
      data-mkt-digits
      data-on="true"
      className="inline-flex items-baseline text-2xl font-medium tabular-nums"
    >
      {text.split("").map((ch, i) => (
        <span
          key={i}
          data-mkt-digit
          className="inline-block"
          style={{ "--i": i } as CSSProperties}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </span>
  );
}

export function ZipModalDemo() {
  const [types, setTypes] = useState<TypeFilter>("all");
  const [includeHidden, setIncludeHidden] = useState(false);
  const [swapped, setSwapped] = useState(false);
  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (swapTimer.current) clearTimeout(swapTimer.current);
    },
    [],
  );

  const result = totalFor(types, includeHidden);
  const sizeText = formatBytes(result.bytes);

  function onDownload() {
    if (swapTimer.current) clearTimeout(swapTimer.current);
    setSwapped(true);
    swapTimer.current = setTimeout(() => setSwapped(false), 1400);
  }

  return (
    <div role="group" aria-label="Download album demo">
      {/* The quiet stage: in the app this dialog floats over the gallery, so
          the mock gets a muted backdrop + the paper float shadow instead of
          sitting flush on the page. */}
      <div className="rounded-3xl border bg-muted/40 p-4 sm:p-8">
        <div className="mx-auto w-full max-w-[26rem] rounded-2xl border bg-card p-6 shadow-[var(--shadow-float)] ring-1 ring-foreground/5">
          <div className="flex flex-col gap-1.5">
            <p className="text-lg font-semibold">Download album</p>
            <p className="text-sm text-muted-foreground">
              Pick what to bundle into your copy.
            </p>
          </div>

          <div className="mt-4 flex gap-2">
            {CHIPS.map(({ key, label, Icon }) => {
              const active = types === key;
              const count = totalFor(key, includeHidden).count;
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
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <label className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3.5">
            <span className="text-sm text-muted-foreground">
              Include hidden items
            </span>
            <Switch
              checked={includeHidden}
              onCheckedChange={setIncludeHidden}
              aria-label="Include hidden items"
            />
          </label>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <SizePop text={sizeText} />
              <div className="text-xs text-muted-foreground tabular-nums">
                {result.count} items
              </div>
            </div>
            <Button type="button" onClick={onDownload}>
              <span
                className="mkt-icon-swap"
                data-state={swapped ? "b" : "a"}
                aria-hidden
              >
                <span className="mkt-icon" data-icon="a">
                  <Download />
                </span>
                <span className="mkt-icon" data-icon="b">
                  <Check />
                </span>
              </span>
              Download
            </Button>
          </div>
        </div>
      </div>
      <Caption className="mt-4 text-center">
        shown with the host extras · guests get the same modal, minus Include
        hidden
      </Caption>
    </div>
  );
}
