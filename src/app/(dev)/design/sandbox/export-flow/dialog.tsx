"use client";

import type { ReactNode } from "react";

import {
  Check,
  Copy,
  Download,
  Image as ImageIcon,
  Layers,
  Link2,
  Loader2,
  Video,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  type ExportSummary,
  type ExportTypeFilter,
  MAX_EXPORT_BYTES,
  MAX_EXPORT_ITEMS,
} from "@/lib/export/build-manifest";
import { cn, formatBytes } from "@/lib/utils";

import { type Album, EVENT, hasHidden, totalFor } from "./fixtures";

/**
 * THE DOWNLOAD DIALOG, REPRODUCED SO IT CAN BE DRAWN INSIDE A FRAME.
 *
 * ★ WHY IT IS NOT THE SHIPPED COMPONENT. `ExportDialog` is a radix `Dialog`:
 * its content portals to `document.body` of the realm the script runs in, which
 * for a lab frame is the BOARD PAGE, not the picture. An open real dialog would
 * cover the whole desk and appear in no capture. Opening it would also call
 * `useExportDownload().fetchSummary`, which is a request this lane must never
 * make. So the SHELL is quoted (export-flow.css) and the body below is the
 * shipped body's markup, class for class and string for string, driven by a
 * fixture summary instead of the endpoint.
 *
 * ★ THE STRINGS ARE THE APP'S. "Download album", "Pick what to bundle into your
 * copy.", the three chip labels, "Include hidden items", "Nothing selected",
 * "Adding it up" and the over-cap sentence are quoted verbatim, because
 * `mock-parity.test.ts` pins four of them between the marketing mock and the
 * app and a paraphrase here would quietly judge copy nobody ships. Anything
 * NEW an option proposes is new copy and is marked as such in its option.
 *
 * ★ THE ARITHMETIC IS THE APP'S TOO. `totalFor` in fixtures.ts is the shipped
 * `totalFor`, and the size is `formatBytes` over a real byte count, so a foot
 * on this board says what the real foot would say for the same album.
 */

/* ── the quoted shell ────────────────────────────────────────────────────── */

export function Shell({
  children,
  tall,
}: {
  children: ReactNode;
  tall?: boolean;
}) {
  return (
    <>
      <div className="xf-scrim" aria-hidden />
      <div
        className="xf-dialog"
        data-xf-dialog
        role="dialog"
        aria-label="Download album"
        style={tall ? { maxWidth: "28rem" } : undefined}
      >
        {children}
        <Button
          variant="ghost"
          className="absolute top-2 right-2"
          size="icon-sm"
          tabIndex={-1}
        >
          <X />
          <span className="sr-only">Close</span>
        </Button>
      </div>
    </>
  );
}

/** `DialogHeader` + `DialogTitle` + `DialogDescription`, class for class. */
export function Head({
  title = "Download album",
  description = "Pick what to bundle into your copy.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-heading text-card-title leading-none font-medium">
        {title}
      </p>
      <p className="text-sm text-muted-foreground" data-xf-desc>
        {description}
      </p>
    </div>
  );
}

/* ── the chips ───────────────────────────────────────────────────────────── */

const CHIPS: { key: ExportTypeFilter; label: string; Icon: typeof Layers }[] = [
  { key: "all", label: "Everything", Icon: Layers },
  { key: "photo", label: "Photos", Icon: ImageIcon },
  { key: "video", label: "Videos", Icon: Video },
];

export type ChipMode = "three" | "two" | "why";

export function ChipRow({
  summary,
  types,
  includeHidden = false,
  mode = "three",
}: {
  summary: ExportSummary;
  types: ExportTypeFilter;
  includeHidden?: boolean;
  mode?: ChipMode;
}) {
  const chips = mode === "two" ? CHIPS.slice(0, 2) : CHIPS;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {chips.map(({ key, label, Icon }) => {
          const active = types === key;
          const count = totalFor(summary, key, includeHidden).count;
          const inert = mode === "why" && key === "video";
          return (
            <button
              key={key}
              type="button"
              aria-pressed={inert ? undefined : active}
              disabled={inert}
              data-xf-chip={key}
              data-xf-inert={inert ? "" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg border px-2 py-3 text-center transition-[transform,border-color,background-color] duration-150 ease-emphasis active:scale-[0.97] motion-reduce:active:scale-100",
                active && !inert
                  ? "border-primary bg-accent"
                  : "border-border hover:bg-accent/50",
                inert && "pointer-events-none opacity-45",
              )}
            >
              <Icon
                className={cn(
                  "size-5",
                  active && !inert ? "text-foreground" : "text-muted-foreground",
                )}
              />
              <span className="text-sm font-medium">{label}</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {count}
              </span>
            </button>
          );
        })}
      </div>
      {mode === "why" && (
        <p className="text-xs text-muted-foreground" data-xf-said>
          Videos come with the rest of the album.{" "}
          <span className="font-medium text-foreground underline underline-offset-2">
            See all
          </span>
        </p>
      )}
    </div>
  );
}

/* ── the host's switch ───────────────────────────────────────────────────── */

export function HiddenRow({
  summary,
  checked,
}: {
  summary: ExportSummary;
  checked: boolean;
}) {
  if (!hasHidden(summary)) return null;
  return (
    <label className="flex items-center justify-between gap-3 border-t border-border pt-3.5">
      <span className="text-sm text-muted-foreground">Include hidden items</span>
      <Switch checked={checked} aria-label="Include hidden items" />
    </label>
  );
}

/* ── the foot ────────────────────────────────────────────────────────────── */

export type CapMode = "bite" | "near" | "split";

const partsFor = (count: number) => Math.ceil(count / MAX_EXPORT_ITEMS);

export function Foot({
  summary,
  types,
  includeHidden = false,
  cap = "bite",
  loading = false,
  /** The `phone` decision's new copy: the button names where the file lands. */
  saysWhere = false,
  /** The `stuck` decision draws the same foot mid-request. */
  busy = false,
}: {
  summary: ExportSummary;
  types: ExportTypeFilter;
  includeHidden?: boolean;
  cap?: CapMode;
  loading?: boolean;
  saysWhere?: boolean;
  busy?: boolean;
}) {
  const result = totalFor(summary, types, includeHidden);
  const over =
    result.count > MAX_EXPORT_ITEMS || result.bytes > MAX_EXPORT_BYTES;
  const empty = result.count === 0;
  const parts = partsFor(result.count);
  // "Close" is the last tenth before the ceiling, which is where a line that
  // warns is still a warning rather than a refusal.
  const near = !over && result.count > MAX_EXPORT_ITEMS * 0.9;
  const refuses = over && cap !== "split";

  return (
    <div className="mt-1 flex items-center justify-between gap-3" data-xf-foot>
      {refuses ? (
        <p className="text-sm text-warning" data-xf-warn>
          {cap === "near"
            ? `${result.count.toLocaleString("en-US")} items, over the ${MAX_EXPORT_ITEMS.toLocaleString("en-US")} an album can send at once. Pick photos or videos to split it up.`
            : "Too large to download all at once. Pick photos or videos to split it up."}
        </p>
      ) : (
        <div>
          <span className="text-2xl font-medium tabular-nums" data-xf-size>
            {loading ? "…" : formatBytes(result.bytes)}
          </span>
          <div
            className="text-xs tabular-nums text-muted-foreground"
            data-xf-count
          >
            {loading
              ? "Adding it up"
              : empty
                ? "Nothing selected"
                : `${result.count.toLocaleString("en-US")} ${result.count === 1 ? "item" : "items"}`}
            {cap === "split" && over
              ? `, in ${parts} zips`
              : cap === "near" && near
                ? `, near the ${MAX_EXPORT_ITEMS.toLocaleString("en-US")} limit`
                : ""}
          </div>
        </div>
      )}
      <Button
        type="button"
        disabled={busy || loading || empty || refuses}
        data-xf-go
      >
        {busy ? <Loader2 className="animate-spin" /> : <Download />}
        {cap === "split" && over
          ? `Download ${parts} zips`
          : saysWhere
            ? "Download to Files"
            : "Download"}
      </Button>
    </div>
  );
}

/* ── what the `object` decision adds above the chips ─────────────────────── */

/**
 * NEW COPY, and the only promise in the product that outlives every zip.
 *
 * ★ TWO ROWS, NOT THREE COLUMNS. The first pass put the sentence, the address
 * and Copy link side by side; at 375 the button's min-content pushed the
 * dialog's grid column past the panel and every row below it overflowed the
 * box. Caught by reading the capture, which is the point of taking them.
 */
export function KeepsakeLead() {
  return (
    <div
      className="rounded-lg border border-border bg-muted/40 p-3"
      data-xf-lead
    >
      <div className="flex items-start gap-2.5">
        <Link2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="min-w-0 text-sm font-medium">
          This album stays where it is.
        </p>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {EVENT.url}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          tabIndex={-1}
        >
          <Copy /> Copy link
        </Button>
      </div>
    </div>
  );
}

/* ── what the `means` decision adds above the chips ──────────────────────── */

export function BundleRows({
  album,
  chosen,
}: {
  album: Album;
  chosen: "mine" | "album";
}) {
  const mine = totalFor(album.mine, "all", false);
  const all = totalFor(album.summary, "all", false);
  const rows = [
    {
      id: "mine" as const,
      label: `The ${mine.count} you added`,
      sub: formatBytes(mine.bytes),
    },
    {
      id: "album" as const,
      label: "The whole album",
      sub: `${all.count.toLocaleString("en-US")} items, ${formatBytes(all.bytes)}`,
    },
  ];
  return (
    <div className="flex flex-col gap-1.5" data-xf-bundles>
      {rows.map((r) => {
        const active = chosen === r.id;
        return (
          <button
            key={r.id}
            type="button"
            aria-pressed={active}
            className={cn(
              "flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-[border-color,background-color] duration-150 ease-emphasis",
              active
                ? "border-primary bg-accent"
                : "border-border hover:bg-accent/50",
            )}
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium">{r.label}</span>
              <span className="block text-xs tabular-nums text-muted-foreground">
                {r.sub}
              </span>
            </span>
            {active ? (
              <Check className="size-4 shrink-0 text-foreground" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* ── the dialog as the wait lives in it ──────────────────────────────────── */

/**
 * The `panel` answer to `wait`, and the surface `stuck` and `hollow` then have
 * somewhere to be said. NEW COPY throughout: today nothing in the product ever
 * describes a download in progress.
 */
export function WorkBody({
  summary,
  types,
  percent,
  state,
}: {
  summary: ExportSummary;
  types: ExportTypeFilter;
  percent: number;
  state: "working" | "done" | "empty" | "partial" | "failed";
}) {
  const result = totalFor(summary, types, false);
  const kept = Math.max(0, result.count - 6);
  const line =
    state === "working"
      ? `Zipping ${result.count.toLocaleString("en-US")} items, ${formatBytes(result.bytes)}`
      : state === "done"
        ? `${result.count.toLocaleString("en-US")} items, ${formatBytes(result.bytes)}`
        : state === "partial"
          ? `${kept.toLocaleString("en-US")} of ${result.count.toLocaleString("en-US")} items are in the file. Six could not be found.`
          : state === "empty"
            ? `Nothing was in it. All ${result.count.toLocaleString("en-US")} items had gone by the time the zip was made.`
            : "The album changed while your zip was being made.";

  return (
    <div className="flex flex-col gap-3" data-xf-work>
      <div className="flex items-center gap-2.5">
        {state === "working" ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
        ) : state === "done" ? (
          <Check className="size-4 shrink-0 text-success" />
        ) : (
          <X className="size-4 shrink-0 text-warning" />
        )}
        <p className="text-sm font-medium" data-xf-said>
          {state === "working"
            ? "Building your zip"
            : state === "done"
              ? "Saved to your downloads"
              : state === "partial"
                ? "Saved, with pieces missing"
                : state === "empty"
                  ? "Your zip came back empty"
                  : "That download did not happen"}
        </p>
      </div>
      <p className="text-xs tabular-nums text-muted-foreground">{line}</p>
      {state === "working" && (
        <div
          className="h-1 overflow-hidden rounded-full bg-muted"
          data-xf-bar
          role="progressbar"
          aria-valuenow={percent}
        >
          <div
            className="h-full rounded-full bg-foreground"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
      <div className="flex justify-end gap-2">
        {state === "working" ? (
          <Button type="button" variant="outline" size="sm" tabIndex={-1}>
            Cancel
          </Button>
        ) : state === "done" ? (
          <Button type="button" variant="outline" size="sm" tabIndex={-1}>
            Done
          </Button>
        ) : (
          <Button type="button" size="sm" tabIndex={-1}>
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
