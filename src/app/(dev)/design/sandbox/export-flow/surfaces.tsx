"use client";

import { type ReactNode, useEffect } from "react";

import {
  ArrowDownToLine,
  Check,
  Download,
  Folder,
  Loader2,
  Share2,
  Smartphone,
  X,
} from "lucide-react";

import { GalleryDownloadAllButton } from "@/components/app/export/download-all-button";
import { ExportDialog } from "@/components/app/export/export-dialog";
import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { GallerySelectButton } from "@/components/app/event-feed/gallery-actions";
import { HostSelectionProvider } from "@/components/app/host-selection-provider";
import { GuestMasonry } from "@/components/guest/guest-masonry";
import { MasonryColumns } from "@/components/shared/masonry";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { EVENT, TILES } from "./fixtures";

export const SCREENS = {
  "375": { w: 375, h: 812, name: "a phone" },
  "1440": { w: 1440, h: 900, name: "a laptop" },
} as const;
export type ScreenId = keyof typeof SCREENS;
export const screenOf = (v: string | undefined): ScreenId =>
  v === "1440" ? "1440" : "375";

export type Who = "host" | "guest";
export const whoOf = (v: string | undefined): Who =>
  v === "guest" ? "guest" : "host";

/* ── the guard ───────────────────────────────────────────────────────────── */

/**
 * ★ NOTHING ON THIS BOARD MAY MINT, AND THIS IS THE BELT TO THE BRACES.
 *
 * The real `GalleryDownloadAllButton` and the real guest link are rendered on
 * this board because they ARE the doors being judged. Both mount `ExportDialog`,
 * which calls `useExportDownload()` with no seam: a summary fetch fires the
 * moment the dialog opens, and the mint fires on Download. A closed dialog is
 * inert and every trigger here is drawn inert (`pointer-events-none`), but a
 * stray keyboard focus or a future demo pass that presses inside a preview
 * would be a real request against a real event.
 *
 * So while any preview is mounted, `window.fetch` refuses anything addressed to
 * `/api/export` and passes everything else through untouched, and the original
 * is restored when the last preview unmounts (ref-counted, because a board
 * draws every option at once). The refusal is a rejected promise, which is
 * exactly what `fetchSummary` and `startDownload` already catch.
 */
let depth = 0;
let original: typeof fetch | null = null;

export function NoMint() {
  useEffect(() => {
    if (depth === 0) {
      original = window.fetch;
      const pass = original;
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
        if (url.includes("/api/export")) {
          return Promise.reject(
            new Error("export-flow: a lab preview never calls the export API"),
          );
        }
        return pass(input, init);
      }) as typeof fetch;
    }
    depth += 1;
    return () => {
      depth -= 1;
      if (depth === 0 && original) {
        window.fetch = original;
        original = null;
      }
    };
  }, []);
  return null;
}

/** A real trigger drawn as furniture: visible, never pressable. */
function Inert({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none contents" aria-hidden>
      {children}
    </div>
  );
}

/* ── the two grounds ─────────────────────────────────────────────────────── */

/**
 * THE GUEST ALBUM, with the shipped Download all row copied byte for byte from
 * `live-gallery.tsx` (it is inline JSX at its real call site, not a component
 * to import) around the REAL `ExportDialog` trigger.
 */
export function GuestAlbum({
  screen,
  count,
  row,
  grid,
  children,
}: {
  screen: ScreenId;
  count: number;
  /** Replaces the shipped Download all row, for the options that change it. */
  row?: ReactNode;
  /** Replaces the masonry, for the option that puts the album in select mode. */
  grid?: ReactNode;
  children?: ReactNode;
}) {
  const items = TILES.slice(0, Math.min(count, TILES.length));
  return (
    <div className="min-h-screen bg-background">
      <div
        className={cn(
          "mx-auto px-4 pt-5 pb-24",
          screen === "1440" ? "max-w-3xl" : "max-w-full",
        )}
      >
        <h1 className="font-heading text-xl font-medium">{EVENT.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {count.toLocaleString("en-US")} in the album
        </p>
        <section className="mt-3">
          {row ?? (
            <div className="mb-3 flex justify-end" data-xf-door>
              <Inert>
                <ExportDialog scope="guest" albumKey="lab-fixture">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-save active:scale-[0.98]"
                  >
                    <Download className="size-4" /> Download all
                  </button>
                </ExportDialog>
              </Inert>
            </div>
          )}
          <div className="pointer-events-none">
            {grid ?? <GuestMasonry items={items} />}
          </div>
        </section>
      </div>
      {children}
    </div>
  );
}

/**
 * THE HOST EVENT PAGE'S GALLERY SECTION, real down to both buttons either side
 * of the header. `GallerySelectButton` renders nothing without a provider, so
 * it is wrapped exactly as `EventFeed` wraps it.
 */
export function HostGallery({
  screen,
  count,
  under,
  action,
  children,
}: {
  screen: ScreenId;
  count: number;
  /** The quiet line the `line` answer to the wait puts under the header. */
  under?: ReactNode;
  /** Replaces the shipped action cluster, for the options that change it. */
  action?: ReactNode;
  children?: ReactNode;
}) {
  const items = TILES.slice(0, Math.min(count, TILES.length));
  return (
    <div className="min-h-screen bg-background">
      <div
        className={cn(
          "mx-auto px-4 pt-5 pb-24",
          screen === "1440" ? "max-w-6xl" : "max-w-full",
        )}
      >
        <h1 className="font-heading text-xl font-medium">{EVENT.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          15 August 2026, 34 guests
        </p>
        <div className="mt-5" data-xf-door>
          <HostSelectionProvider>
            <FeedSectionHeader
              label="Gallery"
              count={count}
              action={
                action ?? (
                  <Inert>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <GalleryDownloadAllButton eventId="lab-fixture" />
                      <GallerySelectButton />
                    </div>
                  </Inert>
                )
              }
            />
          </HostSelectionProvider>
        </div>
        {under}
        <div className="pointer-events-none mt-3">
          <MasonryColumns items={items} />
        </div>
      </div>
      {children}
    </div>
  );
}

/* ── the quoted toast ────────────────────────────────────────────────────── */

export function Toast({
  screen,
  tone = "loading",
  children,
}: {
  screen: ScreenId;
  tone?: "loading" | "success" | "error";
  children: ReactNode;
}) {
  return (
    <div className="xf-toast" data-screen={screen} data-tone={tone} data-xf-toast>
      {tone === "loading" ? (
        <Loader2 className="size-4 shrink-0 animate-spin" />
      ) : tone === "success" ? (
        <Check className="size-4 shrink-0" />
      ) : (
        <X className="size-4 shrink-0" />
      )}
      <span data-xf-said>{children}</span>
    </div>
  );
}

/* ── the quiet line under the header ─────────────────────────────────────── */

export function UnderLine({
  icon = "spin",
  children,
  action,
}: {
  icon?: "spin" | "done" | "warn";
  children: ReactNode;
  action?: string;
}) {
  return (
    <div
      className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2"
      data-xf-line
    >
      {icon === "spin" ? (
        <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
      ) : icon === "done" ? (
        <Check className="size-3.5 shrink-0 text-success" />
      ) : (
        <X className="size-3.5 shrink-0 text-warning" />
      )}
      <p className="min-w-0 flex-1 text-xs text-muted-foreground" data-xf-said>
        {children}
      </p>
      {action ? (
        <span className="shrink-0 text-xs font-medium underline underline-offset-2">
          {action}
        </span>
      ) : null}
    </div>
  );
}

/* ── the select bar, for the options that pick before they take ──────────── */

/** The gallery bulk bar's own shape (`gallery-actions.tsx`), narrowed to the
 *  one verb these options are about. */
export function SelectBar({ n }: { n: number }) {
  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div
        className="pointer-events-none flex items-center gap-1 rounded-full border border-border bg-popover px-2 py-1.5 shadow-layer"
        data-xf-bar
      >
        <Button type="button" variant="ghost" size="sm" tabIndex={-1}>
          All
        </Button>
        <span className="px-0.5 text-xs tabular-nums text-muted-foreground">
          {n}
        </span>
        <Button type="button" size="sm" tabIndex={-1} data-xf-go>
          <Download /> Download
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" tabIndex={-1}>
          <X />
        </Button>
      </div>
    </div>
  );
}

/* ── the phone's own chrome ──────────────────────────────────────────────── */

/** Safari's foot bar with its download arrow lit. Not ours to design; drawn so
 *  the option that says nothing can be judged beside the ones that do. */
export function IosBar({ lit }: { lit?: boolean }) {
  return (
    <div className="xf-ios-bar" data-xf-ios>
      <Smartphone className="size-4 opacity-60" aria-hidden />
      <span className="text-xs">{EVENT.url}</span>
      <ArrowDownToLine
        className={cn("size-4", lit ? "text-save" : "opacity-40")}
        aria-hidden
      />
    </div>
  );
}

export function ShareSheet({ size }: { size: string }) {
  const rows = ["AirDrop", "Messages", "Save to Files"];
  return (
    <div className="xf-sheet" data-xf-sheet>
      <div className="flex items-center gap-2.5 border-b border-border pb-3">
        <Folder className="size-8 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            mia-and-theos-wedding.zip
          </p>
          <p className="text-xs tabular-nums text-muted-foreground">{size}</p>
        </div>
        <Share2 className="ml-auto size-4 text-muted-foreground" aria-hidden />
      </div>
      <div className="flex flex-col pt-1">
        {rows.map((r) => (
          <span
            key={r}
            className="border-b border-border/60 py-2.5 text-sm last:border-0"
          >
            {r}
          </span>
        ))}
      </div>
    </div>
  );
}
