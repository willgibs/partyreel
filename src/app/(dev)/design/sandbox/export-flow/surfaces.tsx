"use client";

import { type ReactNode, useEffect } from "react";

import {
  Check,
  CircleCheck,
  Download,
  Image as ImageIcon,
  ImageUp,
  Loader2,
  OctagonX,
  Share2,
  TriangleAlert,
  X,
} from "lucide-react";

import { GallerySelectButton } from "@/components/app/event-feed/gallery-actions";
import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { GalleryDownloadAllButton } from "@/components/app/export/download-all-button";
import { ExportDialog } from "@/components/app/export/export-dialog";
import { HostSelectionProvider } from "@/components/app/host-selection-provider";
import { ViewMenu } from "@/components/shared/view-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatMediaCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import { EVENT, STILLS, type Still } from "./fixtures";

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
 * The real `GalleryDownloadAllButton` and the real guest Download all are
 * rendered on this board because they ARE the doors being judged. Both mount
 * `ExportDialog`, which calls `useExportDownload()` with no seam: a summary
 * fetch fires the moment the menu opens, and the mint fires on a row. A closed
 * menu is inert and every trigger here is drawn inert (`pointer-events-none`),
 * but a stray keyboard focus or a future demo pass that presses inside a
 * preview would be a real request against a real event.
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

/** A real control drawn as furniture: visible, never pressable, never counted. */
function Inert({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none contents" aria-hidden>
      {children}
    </div>
  );
}

/* ── the album's photographs ─────────────────────────────────────────────── */

/**
 * THE ALBUM'S ROWS, QUOTED (`gallery-rows.tsx` on `AlbumRows`): justified by
 * flex-grow on each photograph's own ratio, so a row shares one height and
 * fills the width, at the default step's count for the box (`ROW_CLASSES`: two
 * a row under 480, four in the host's 1,120 px column, five in the guest's
 * full-bleed one).
 *
 * ★ WHY NOT THE SHIPPED GRID. The masonry this board first drew on aborts
 * every image that has not finished (`abortUnfinishedImages`) when its
 * columns re-lay, which inside a frame is before a lazy photograph ever
 * loads: every tile drew blank. These are plain eager images at the product's
 * own gap and corner tokens, the ground and nothing more.
 */
export function AlbumRows({
  perRow,
  picked,
}: {
  perRow: number;
  /** The `picked` option's ticked stills. */
  picked?: ReadonlySet<string>;
}) {
  const rows: Still[][] = [];
  for (let i = 0; i + perRow <= STILLS.length; i += perRow)
    rows.push(STILLS.slice(i, i + perRow));
  return (
    <div
      aria-hidden
      className="pointer-events-none flex flex-col"
      style={{ gap: "var(--gap-gallery)" }}
    >
      {rows.map((row, i) => (
        <div key={i} className="flex" style={{ gap: "var(--gap-gallery)" }}>
          {row.map((s) => (
            <div
              key={s.id}
              className="relative min-w-0 overflow-hidden bg-muted"
              style={{
                flexGrow: s.ratio,
                flexBasis: 0,
                aspectRatio: s.ratio,
                borderRadius: "var(--radius-tile)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a stand-in still, not a presigned URL */}
              <img src={s.src} alt="" className="size-full object-cover" />
              {picked?.has(s.id) ? (
                <span
                  data-xf-picked
                  className="absolute top-2 left-2 flex size-5 items-center justify-center rounded-full bg-foreground text-background"
                >
                  <Check className="size-3" />
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── the two grounds ─────────────────────────────────────────────────────── */

/**
 * THE HOST'S EVENT PAGE, AT ITS ALBUM (`event-gallery.tsx`): the section named
 * for what it holds ("Album" and its count, `FeedSectionHeader`), and the row's
 * four controls, Add photos, Download, Select and View, real down to the
 * buttons. `GallerySelectButton` renders nothing without a provider, so it is
 * wrapped exactly as the page wraps it. The hub's cards above the album are
 * left out: nothing on this board is asked of them.
 */
export function HostGround({
  screen,
  count,
  download,
  under,
  children,
}: {
  screen: ScreenId;
  count: number;
  /** Replaces the real Download trigger (a state of it, or it with its menu). */
  download?: ReactNode;
  /** A line the `line` answer to the wait hangs under the header. */
  under?: ReactNode;
  children?: ReactNode;
}) {
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
          {EVENT.date}, {EVENT.guests} guests
        </p>
        <section aria-label="Album" className="mt-5 space-y-2.5" data-xf-door>
          <HostSelectionProvider>
            <FeedSectionHeader
              label="Album"
              count={count}
              action={
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  <Inert>
                    <Button type="button" variant="outline" size="sm">
                      <ImageUp /> Add photos
                    </Button>
                  </Inert>
                  {download ?? (
                    <Inert>
                      <GalleryDownloadAllButton eventId="lab-fixture" />
                    </Inert>
                  )}
                  <Inert>
                    <GallerySelectButton />
                    <ViewMenu groups={[]} />
                  </Inert>
                </div>
              }
            />
          </HostSelectionProvider>
          {under}
          <AlbumRows perRow={screen === "1440" ? 4 : 2} />
        </section>
      </div>
      {children}
    </div>
  );
}

/**
 * THE GUEST'S ALBUM PAGE (`event-experience.tsx` over `live-gallery.tsx`): the
 * words on their column (the name, the byline, the count, Add photos over
 * Invite), then the album at the window's width, led by its own row: the count
 * on the left, Download all and View on the right, copied byte for byte from
 * the row's inline JSX. The Highlight reel tile between them is left out: it
 * would push the album's row below a phone's fold, and nothing here asks of it.
 */
export function GuestGround({
  screen,
  count,
  download,
  row,
  under,
  picked,
  children,
}: {
  screen: ScreenId;
  count: number;
  /** Replaces the real Download all trigger (a state of it, or it with its menu). */
  download?: ReactNode;
  /** Replaces the album's whole row, for the option that selects before it takes. */
  row?: ReactNode;
  /** A line the `line` answer to the wait hangs under the album's row. */
  under?: ReactNode;
  /** The `picked` option's ticked stills. */
  picked?: ReadonlySet<string>;
  children?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="w-full max-w-2xl px-5 pt-8">
        <header>
          <h1 className="font-heading text-page text-balance">{EVENT.name}</h1>
          <p className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="text-faint">Hosted by</span>
              <Avatar seed="xf-host" size="sm">
                <AvatarFallback>{EVENT.host.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">{EVENT.host}</span>
            </span>
            <span aria-hidden className="text-faint">
              ·
            </span>
            <span>{EVENT.date}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatMediaCount(count)} from {EVENT.guests} guests
          </p>
        </header>
        <Inert>
          <div className="mt-4">
            <Button type="button" size="lg" className="w-full">
              <ImageUp /> Add photos
            </Button>
            <div className="mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-full"
              >
                <Share2 /> Invite
              </Button>
            </div>
          </div>
        </Inert>
      </div>
      <div className="px-3 sm:px-5">
        <section className="mt-8" data-xf-door>
          {row ?? (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-1.5">
              <p className="px-0.5 text-working text-muted-foreground tabular-nums">
                {formatMediaCount(count)}
              </p>
              <div className="ml-auto flex items-center gap-1.5">
                {download ?? (
                  <Inert>
                    <GuestDownloadAll />
                  </Inert>
                )}
                <Inert>
                  <ViewMenu groups={[]} />
                </Inert>
              </div>
            </div>
          )}
          {under}
          <AlbumRows perRow={screen === "1440" ? 5 : 2} picked={picked} />
        </section>
      </div>
      {children}
    </div>
  );
}

/** The guest row's real trigger, as `live-gallery.tsx` writes it inline. */
function GuestDownloadAll() {
  return (
    <ExportDialog scope="guest" albumKey="lab-fixture">
      <button
        type="button"
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-save active:scale-[0.98]"
      >
        <Download className="size-4" /> Download all
      </button>
    </ExportDialog>
  );
}

/**
 * THE DOWNLOAD, WITH ITS MENU OPEN UNDER IT (a desk's menu is anchored to the
 * button that asked). The real trigger stays, inert; the menu is the quoted
 * one in its desk shape, inside the trigger's own box.
 */
export function TriggerWithMenu({ who, menu }: { who: Who; menu: ReactNode }) {
  return (
    <span className="relative inline-flex">
      <Inert>
        {who === "host" ? (
          <GalleryDownloadAllButton eventId="lab-fixture" />
        ) : (
          <GuestDownloadAll />
        )}
      </Inert>
      {menu}
    </span>
  );
}

/* ── the wait's three places ─────────────────────────────────────────────── */

/**
 * SONNER'S TOAST, QUOTED WHERE THE APP PUTS IT: top centre, five rem down, the
 * phone's full width less 16 px a side (`ui/sonner.tsx`, `toasts` r1
 * `where=top`), in the state tones `globals.css` maps (success green, error
 * red, a loading toast neutral). A real toast portals to the lab page's own
 * Toaster, so the box is reproduced (export-flow.css) and drawn still: a
 * toast a reader cannot catch is a toast they cannot judge. An error persists
 * with its close, as the app's patched `toast.error` does.
 */
export function Toast({
  screen,
  tone,
  action,
  children,
}: {
  screen: ScreenId;
  tone: "loading" | "success" | "warning" | "error";
  /** Sonner's action button: the one thing a toast can offer. */
  action?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="xf-toast"
      data-screen={screen}
      data-tone={tone}
      data-xf-toast
    >
      {tone === "error" ? (
        <span className="xf-toast-close" aria-hidden>
          <X className="size-3" />
        </span>
      ) : null}
      {tone === "loading" ? (
        <Loader2 className="size-4 shrink-0 animate-spin" />
      ) : tone === "success" ? (
        <CircleCheck className="size-4 shrink-0" />
      ) : tone === "warning" ? (
        <TriangleAlert className="size-4 shrink-0" />
      ) : (
        <OctagonX className="size-4 shrink-0" />
      )}
      <span className="xf-toast-title" data-xf-said>
        {children}
      </span>
      {action ? (
        <button type="button" tabIndex={-1} className="xf-toast-button">
          {action}
        </button>
      ) : null}
    </div>
  );
}

/**
 * THE QUIET LINE, in the album's own grammar for a line under its row (the
 * guest's "Showing yours · Show all", `live-gallery.tsx`): muted words, a dot,
 * and an act in the foreground, no box and no fill. NEW: nothing in the
 * product says a download here today.
 */
export function WaitLine({
  icon,
  action,
  children,
}: {
  icon: "spin" | "done" | "warn";
  action?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-2 text-sm" data-xf-line>
      {icon === "spin" ? (
        <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
      ) : icon === "done" ? (
        <Check className="size-4 shrink-0 text-success" />
      ) : (
        <TriangleAlert className="size-4 shrink-0 text-warning" />
      )}
      <span className="min-w-0 text-muted-foreground" data-xf-said>
        {children}
      </span>
      {action ? (
        <>
          <span aria-hidden className="text-faint">
            ·
          </span>
          <button
            type="button"
            tabIndex={-1}
            className="shrink-0 rounded-md font-medium underline-offset-4"
          >
            {action}
          </button>
        </>
      ) : null}
    </div>
  );
}

/**
 * THE DOWNLOAD THAT WAS TAPPED, CARRYING THE WAIT (`wait=button`): the same
 * control in the same place, its icon and words the state. NEW: the shipped
 * trigger never changes after a tap.
 *
 * ★ A BUSY BUTTON IS NOT A WAY OUT. While it spins the button does nothing
 * (`data-xf-busy`), so the readers that count what a finger can still use
 * skip it; its act, when it has one, is the small button beside it.
 */
export function DownloadState({
  who,
  icon,
  label,
  act,
}: {
  who: Who;
  icon: "spin" | "done" | "warn";
  label: string;
  /** The one act beside it: `stuck=cancel`'s Cancel, a short zip's Try again. */
  act?: string;
}) {
  const glyph =
    icon === "spin" ? (
      <Loader2 className="animate-spin" />
    ) : icon === "done" ? (
      <Check className="text-success" />
    ) : (
      <TriangleAlert className="text-warning" />
    );
  const busy = icon === "spin" ? "" : undefined;
  return (
    <span className="inline-flex items-center gap-1" data-xf-button>
      {who === "host" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          tabIndex={-1}
          data-xf-busy={busy}
        >
          {glyph}
          <span data-xf-said>{label}</span>
        </Button>
      ) : (
        <button
          type="button"
          tabIndex={-1}
          data-xf-busy={busy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground [&>svg]:size-4 [&>svg]:shrink-0"
        >
          {glyph}
          <span data-xf-said>{label}</span>
        </button>
      )}
      {act ? (
        <Button type="button" variant="ghost" size="sm" tabIndex={-1}>
          {act}
        </Button>
      ) : null}
    </span>
  );
}

/* ── the select bar, for the option that picks before it takes ───────────── */

/** The gallery bulk bar's own shape (`gallery-actions.tsx`), narrowed to the
 *  one verb this option is about. */
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
        <span className="px-0.5 text-xs text-muted-foreground tabular-nums">
          {n}
        </span>
        <Button type="button" size="sm" tabIndex={-1}>
          <Download /> Download
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" tabIndex={-1}>
          <X />
        </Button>
      </div>
    </div>
  );
}

/* ── the phone's own sheet ───────────────────────────────────────────────── */

/**
 * THE SYSTEM SHARE SHEET, quoted, for `phone=batch`: every file handed to the
 * sheet at once, so its header names the batch rather than a zip and its own
 * Save leads the rows, the native path into the phone's library a zip can
 * never reach. Not ours to design; drawn so the option that leaves the
 * choosing to it can be judged beside the ones that do not.
 */
export function ShareSheet({ size, items }: { size: string; items: number }) {
  const rows = [`Save ${items} Items`, "AirDrop", "Messages", "Save to Files"];
  return (
    <div className="xf-sheet" data-xf-sheet>
      <div className="flex items-center gap-2.5 border-b border-border pb-3">
        <ImageIcon
          className="size-8 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{items} Items</p>
          <p className="text-xs text-muted-foreground tabular-nums">{size}</p>
        </div>
        <Share2 className="ml-auto size-4 text-muted-foreground" aria-hidden />
      </div>
      <div className="flex flex-col pt-1">
        {rows.map((r, i) => (
          <span
            key={r}
            data-xf-lead={i === 0 ? "" : undefined}
            className={cn(
              "border-b border-border/60 py-2.5 text-sm last:border-0",
              i === 0 && "font-medium text-save",
            )}
          >
            {r}
          </span>
        ))}
      </div>
    </div>
  );
}
