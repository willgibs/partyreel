"use client";

import type { ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  Clock,
  Gauge,
  ImageUp,
  ListChecks,
  Loader2,
  XCircle,
} from "lucide-react";

import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  CLAIMS,
  CLAIMS_DESCRIPTION,
  CLAIMS_TITLE,
  EVENT,
  GUESTS,
  STORAGE,
  UPLOADS,
  UPLOADS_WAITING,
  UPLOAD_WORDS,
  type UploadStatus,
} from "./fixtures";
import {
  ClaimsBanner,
  Dashboard,
  GuestAlbum,
  GuestNames,
  HostBar,
  StorageMeter,
} from "./grounds";
import { type PhoneScene, Scenes } from "./scene";
import {
  BottomSheet,
  CentredDialog,
  type Parts,
  PhoneScreen,
  SidePanel,
  type Size,
} from "./surfaces";

/**
 * LISTS TO WORK THROUGH: the guest list at 240 (`profile-page.view-all`'s own
 * screen), her uploads (`guest-door` is building the tracker), the photos
 * waiting to be claimed (`identity-claims` r1's review), and Maya's largest
 * files (`host-storage.where`, on the laptop's knob). Each list is written
 * once (`listParts`) and every option lays the same list out its own way.
 *
 * ★ EVERY OPTION OF THE TWO QUESTIONS THAT MOVED HERE IS ONE OF THESE FIVE:
 * view-all's sheet, page, centred and in place are `sheet`, `page`, `centred`
 * and `inline`; where's account page, the album's own list and the sheet from
 * the meter are `page`, `inline` and `sheet` (in place, storage is the one
 * event's list under the album's View, as `where=album` drew it).
 */

export type ListOption = "sheet" | "panel" | "page" | "centred" | "inline";
export type ListScreen = "guests" | "uploads" | "claims" | "storage";

export const listAtOf = (v: string | undefined): ListScreen =>
  v === "uploads" || v === "claims" || v === "storage" ? v : "guests";

const OPTION_TITLE: Record<ListOption, string> = {
  sheet: "The one Sheet",
  panel: "A side panel, its own screen in a hand",
  page: "A page of its own",
  centred: "A capped centred list",
  inline: "In place",
};

const SCREEN_TITLE: Record<ListScreen, string> = {
  guests: "the guest list at 240",
  uploads: "her uploads",
  claims: "photos waiting to be claimed",
  storage: "Maya's largest files",
};

/* ── the lists themselves ────────────────────────────────────────────────── */

const STATUS_ICON: Record<UploadStatus, typeof Check> = {
  sending: Loader2,
  held: Clock,
  approved: Check,
  refused: XCircle,
};

const STATUS_TONE: Record<UploadStatus, string> = {
  sending: "text-muted-foreground",
  held: "text-warning",
  approved: "text-success",
  refused: "text-muted-foreground",
};

function Thumb({ url, size = 44 }: { url: string; size?: number }) {
  return (
    <span
      className="block shrink-0 overflow-hidden bg-black/10"
      style={{ width: size, height: size, borderRadius: "var(--radius-tile)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a fixture still standing in for a presigned photograph */}
      <img src={url} alt="" className="size-full object-cover" />
    </span>
  );
}

function UploadRows() {
  return (
    <div
      data-pop-rows=""
      data-pop-noun="uploads"
      className="divide-y divide-border/60"
    >
      {UPLOADS.map((u) => {
        const Icon = STATUS_ICON[u.status];
        return (
          <div
            key={u.id}
            data-pop-row=""
            className="flex items-center gap-3 py-2.5"
          >
            <Thumb url={u.url} />
            <p
              className={cn(
                "flex min-w-0 flex-1 items-center gap-1.5 text-sm",
                STATUS_TONE[u.status],
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className="truncate text-foreground">
                {UPLOAD_WORDS[u.status]}
              </span>
            </p>
          </div>
        );
      })}
    </div>
  );
}

/** claims-card.tsx's rows: the event, its meta line, Claim or Not mine. */
function ClaimRows() {
  return (
    <div
      data-pop-rows=""
      data-pop-noun="events"
      className="divide-y divide-border/60"
    >
      {CLAIMS.map((c, i) => (
        <div key={c.id} data-pop-row="" className="space-y-2 py-3">
          <div className="flex items-center gap-3">
            <div className="flex shrink-0 -space-x-2">
              {c.photos.slice(0, 2).map((p) => (
                <span
                  key={p}
                  className="block ring-2 ring-popover"
                  style={{ borderRadius: "var(--radius-tile)" }}
                >
                  <Thumb url={p} size={32} />
                </span>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{c.name}</p>
              <p className="truncate text-xs text-muted-foreground">{c.meta}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              tabIndex={-1}
              size="sm"
              variant={i === 0 ? "default" : "outline"}
              className="flex-1"
            >
              {i === 0 && <Check />} Claim
            </Button>
            <Button
              type="button"
              tabIndex={-1}
              size="sm"
              variant="outline"
              className="flex-1"
            >
              Not mine
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function StorageRows({ oneEvent = false }: { oneEvent?: boolean }) {
  const rows = oneEvent
    ? STORAGE.rows.filter((r) => r.event === EVENT.name)
    : STORAGE.rows;
  return (
    <div
      data-pop-rows=""
      data-pop-noun="files"
      className="divide-y divide-border/60"
    >
      {rows.map((r) => (
        <div
          key={r.id}
          data-pop-row=""
          className="flex items-center gap-3 py-2.5"
        >
          <span
            className="size-4 shrink-0 rounded-[4px] border border-input"
            aria-hidden
          />
          <Thumb url={r.still} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{r.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {`${r.length} · ${oneEvent ? r.by : `${r.event} · ${r.by}`} · ${r.when}`}
            </p>
          </div>
          <span className="shrink-0 text-sm font-medium tabular-nums">
            {r.size}
          </span>
        </div>
      ))}
    </div>
  );
}

function listParts(screen: ListScreen, names = 80): Parts {
  switch (screen) {
    case "guests":
      return {
        title: "Guests",
        description: `${GUESTS.length} people added photos to ${EVENT.name}.`,
        body: <GuestNames count={names} className="pb-4" />,
      };
    case "uploads":
      return {
        title: "Your uploads",
        description: `${UPLOADS_WAITING} are waiting for ${EVENT.host}. Everything else is in, or on its way.`,
        body: <UploadRows />,
      };
    case "claims":
      return {
        title: CLAIMS_TITLE,
        description: CLAIMS_DESCRIPTION,
        body: <ClaimRows />,
        act: { label: "Finish" },
        cancel: "Claim all",
      };
    case "storage":
      return {
        title: "Storage",
        description: `${STORAGE.used} of ${STORAGE.cap}, largest first across every event.`,
        body: <StorageRows />,
      };
  }
}

/* ── what each list opens from ───────────────────────────────────────────── */

/** guest-door's tracker (`tracker=button`): a round button beside Add photos,
 *  its badge the number of hers waiting for the host. */
function AddWithTracker({ open }: { open?: ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Button type="button" size="lg" className="flex-1" tabIndex={-1}>
          <ImageUp /> Add photos
        </Button>
        <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card shadow-layer">
          <ListChecks className="size-4" aria-hidden />
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background tabular-nums">
            {UPLOADS_WAITING}
          </span>
        </span>
      </div>
      {open}
    </div>
  );
}

/** The ground each list opens over, with `inPlace` where the option puts it. */
function ground(
  screen: ListScreen,
  size: Size,
  overlay?: ReactNode,
  inPlace?: ReactNode,
) {
  switch (screen) {
    case "guests":
      return (
        <GuestAlbum
          size={size}
          view="foot"
          guests={inPlace}
          overlay={overlay}
        />
      );
    case "uploads":
      return (
        <GuestAlbum
          size={size}
          view="top"
          add={{ replace: <AddWithTracker open={inPlace} /> }}
          overlay={overlay}
        />
      );
    case "claims":
      return (
        <Dashboard
          size={size}
          who="priya"
          banner={
            <ClaimsBanner spot={inPlace ? { replace: inPlace } : undefined} />
          }
          overlay={overlay}
        />
      );
    case "storage":
      return (
        <Dashboard
          size={size}
          banner={
            <StorageMeter used={STORAGE.used} cap={STORAGE.cap} pct={94} />
          }
          overlay={overlay}
        />
      );
  }
}

/* ── the five shapes ─────────────────────────────────────────────────────── */

/** A page of its own: the app's own chrome, a back link, the list in flow. */
function ListPage({ screen, size }: { screen: ListScreen; size: Size }) {
  const parts = listParts(screen, size === "desk" ? 240 : 120);
  const guest = screen === "guests" || screen === "uploads";
  const back = guest ? EVENT.name : "Dashboard";
  return (
    <div
      data-pop-ground=""
      className="min-h-screen bg-background text-foreground"
    >
      {guest ? (
        <header className="flex items-center gap-3 border-b border-border/60 px-5 py-3">
          <span className="flex size-8 items-center justify-center rounded-full">
            <ArrowLeft className="size-4" aria-hidden />
          </span>
          <p className="truncate text-sm text-muted-foreground">{back}</p>
        </header>
      ) : (
        <HostBar
          size={size}
          trail={["Dashboard", String(parts.title)]}
          who={screen === "claims" ? "priya" : "maya"}
        />
      )}
      <main
        data-pop-surface="page"
        className={cn(
          "mx-auto w-full px-5 py-6",
          size === "desk" ? "max-w-5xl" : "max-w-2xl",
        )}
      >
        <PageHeading>{parts.title}</PageHeading>
        <p className="mt-1.5 mb-5 text-sm text-muted-foreground">
          {parts.description}
        </p>
        {parts.body}
        {parts.act && (
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" tabIndex={-1} variant="outline">
              {parts.cancel}
            </Button>
            <Button type="button" tabIndex={-1} data-pop-primary="">
              {parts.act.label}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

/** In place: the control that asked becomes the list where it stands. */
function InPlace({ screen, size }: { screen: ListScreen; size: Size }) {
  if (screen === "storage") {
    // `where=album`: one event's own list, under the album's View menu, the
    // grid become a details list sorted largest first.
    return (
      <div
        data-pop-ground=""
        className="min-h-screen bg-background text-foreground"
      >
        <HostBar size={size} trail={[EVENT.name]} />
        <main className="mx-auto max-w-5xl px-5 py-6">
          <PageHeading>{EVENT.name}</PageHeading>
          <div className="mt-5 mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Album, largest first</p>
            <span className="flex h-7 items-center gap-1 rounded-md border px-2.5 text-xs">
              <Gauge className="size-3.5" aria-hidden /> View: Details
            </span>
          </div>
          <div data-pop-surface="inline">
            <StorageRows oneEvent />
          </div>
        </main>
      </div>
    );
  }
  const node =
    screen === "guests" ? (
      <div data-pop-surface="inline" className="space-y-2">
        <GuestNames count={24} />
        <span className="flex h-8 w-fit items-center rounded-full border border-dashed border-border px-3 text-sm text-muted-foreground">
          Show 24 more
        </span>
      </div>
    ) : screen === "uploads" ? (
      <div data-pop-surface="inline" className="mt-3 rounded-xl border p-3">
        <p className="text-sm font-medium">Your uploads</p>
        <UploadRows />
      </div>
    ) : (
      <div data-pop-surface="inline" className="rounded-xl border bg-card p-4">
        <p className="font-heading text-card-title font-medium">
          {CLAIMS_TITLE}
        </p>
        <p className="text-sm text-muted-foreground">{CLAIMS_DESCRIPTION}</p>
        <ClaimRows />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" tabIndex={-1} size="sm" variant="outline">
            Claim all
          </Button>
          <Button type="button" tabIndex={-1} size="sm" data-pop-primary="">
            Finish
          </Button>
        </div>
      </div>
    );
  return ground(screen, size, undefined, node);
}

function draw(option: ListOption, screen: ListScreen, size: Size): ReactNode {
  if (option === "page") return <ListPage screen={screen} size={size} />;
  if (option === "inline") return <InPlace screen={screen} size={size} />;
  const parts = listParts(screen);
  const back =
    screen === "guests" || screen === "uploads" ? "Album" : "Dashboard";
  const surface =
    option === "centred" ? (
      <CentredDialog parts={parts} width="lg" scrollBody />
    ) : size === "desk" ? (
      <SidePanel parts={parts} />
    ) : option === "sheet" ? (
      <BottomSheet parts={parts} />
    ) : (
      <PhoneScreen parts={parts} bar="back" back={back} />
    );
  return ground(screen, size, surface);
}

const PHONES: readonly ListScreen[] = ["guests", "uploads", "claims"];

export function ListsPreview({
  option,
  at,
}: {
  option: ListOption;
  at: ListScreen;
}) {
  const phones: PhoneScene[] = PHONES.map((screen) => ({
    title: SCREEN_TITLE[screen],
    node: draw(option, screen, "phone"),
  }));
  return (
    <Scenes
      id={`lists-${option}-${at}`}
      title={OPTION_TITLE[option]}
      laptop={draw(option, at, "desk")}
      laptopTitle={SCREEN_TITLE[at]}
      phones={phones}
    />
  );
}
