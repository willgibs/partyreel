"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Globe,
  Images,
  ImageUp,
  QrCode,
  Settings,
  Trash2,
  Undo2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { EVENT_NAME, PHOTOS } from "../screens/sample-photos";

/**
 * Interactive islands for the GALLERY-FIRST BUILD round (Phase 5 S3·3b). The
 * composition DIRECTION is ratified (`host-event` + `host-event-page` decision
 * 1); this round resolves the one genuinely-NEW interaction by letting Will
 * FEEL it rather than read a static mock (the toast-demo precedent):
 *
 *   - HostReviewDemo: the pending REVIEW surface in its two open forms -
 *     `inline` (the teaser expands in place, header/strip stay = "still on the
 *     page") vs `focused` (a full takeover, the page hidden behind). Both carry
 *     the SAME bulk-select + sticky bulk bar so the only variable Will judges is
 *     the surface, not the controls. Moderation switches are INSTANT (the Emil
 *     management-tool contract: no theater).
 *   - HostSettingsTransitionDemo: the dedicated settings ROUTE with the ratified
 *     "view-transition feel" (a lean crossfade, the ONE place motion is spent)
 *     and the Deleted bin sitting BEHIND settings (ratified placement).
 *
 * NO production imports - hand-built from sample-photos + lucide, so the lab
 * stays isolated and can't regress the app. The real Toaster is mounted in the
 * root layout, so toasts fire live.
 */

type PendingItem = { id: string; src: string; ratio: string };

const PENDING: PendingItem[] = [
  { id: "rv-1", src: PHOTOS[1], ratio: "aspect-[3/4]" },
  { id: "rv-2", src: PHOTOS[3], ratio: "aspect-square" },
  { id: "rv-3", src: PHOTOS[6], ratio: "aspect-[4/5]" },
  { id: "rv-4", src: PHOTOS[7], ratio: "aspect-[3/4]" },
  { id: "rv-5", src: PHOTOS[8], ratio: "aspect-square" },
];

/* ── The review surface (the open fork: inline vs focused) ────────────────── */

export function HostReviewDemo({ mode }: { mode: "inline" | "focused" }) {
  const [pending, setPending] = useState<PendingItem[]>(PENDING);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function act(kind: "approve" | "hide") {
    if (selected.size === 0) return;
    const remaining = pending.filter((p) => !selected.has(p.id));
    const n = selected.size;
    setPending(remaining);
    setSelected(new Set());
    toast.success(
      kind === "approve"
        ? `Approved ${n} ${n === 1 ? "photo" : "photos"}`
        : "Hidden from everyone",
    );
    if (remaining.length === 0) setOpen(false);
  }

  function approveAll() {
    const n = pending.length;
    setPending([]);
    setSelected(new Set());
    toast.success(`Approved all ${n}`);
    setOpen(false);
  }

  function reset() {
    setPending(PENDING);
    setSelected(new Set());
    setOpen(false);
  }

  const reviewing = pending.length > 0;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* The page (always rendered; the focused overlay covers it). */}
      <div className="flex h-full flex-col px-4 pt-12">
        <MiniHeader />
        <MiniStrip />
        {!reviewing ? (
          <CaughtUp onReset={reset} />
        ) : mode === "inline" && open ? (
          <ReviewPanel
            pending={pending}
            selected={selected}
            onToggle={toggle}
            onAct={act}
            onApproveAll={approveAll}
            onClose={() => setOpen(false)}
          />
        ) : (
          <>
            <ReviewTeaser count={pending.length} onOpen={() => setOpen(true)} />
            <div className="mt-3 min-h-0 flex-1 overflow-hidden">
              <MiniMasonry />
            </div>
          </>
        )}
      </div>

      {/* The focused takeover (instant, per the management-tool contract). */}
      {mode === "focused" && open && reviewing && (
        <ReviewPanel
          focused
          pending={pending}
          selected={selected}
          onToggle={toggle}
          onAct={act}
          onApproveAll={approveAll}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

/** The pending TEASER: a labeled horizontal strip with a faded right edge,
 *  present only when reviews exist (it leaves the command strip on purpose). */
function ReviewTeaser({
  count,
  onOpen,
}: {
  count: number;
  onOpen: () => void;
}) {
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
          {count} to review
        </p>
        <button
          data-dir-press
          onClick={onOpen}
          className="flex items-center gap-0.5 text-[11px] font-semibold"
          style={{ color: "var(--warning)" }}
        >
          Review all
          <ChevronRight className="size-3" />
        </button>
      </div>
      <div className="relative mt-1.5">
        <div className="flex gap-1.5 overflow-x-hidden">
          {PENDING.slice(0, count).map((it) => (
            <button
              key={it.id}
              data-dir-press
              onClick={onOpen}
              className="relative aspect-square w-16 shrink-0 overflow-hidden"
              style={{ borderRadius: "var(--radius-tile)" }}
            >
              <Image
                src={it.src}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
              <span
                className="absolute top-1 left-1 rounded-full px-1 py-0.5 text-[7px] font-semibold"
                style={{
                  background: "var(--warning)",
                  color: "var(--warning-foreground)",
                }}
              >
                new
              </span>
            </button>
          ))}
        </div>
        {/* The faded right edge (mask-image in production; a gradient reads the
            same here). */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" />
      </div>
    </div>
  );
}

/** The select grid + sticky bulk bar, shared by both forms. `focused` makes it
 *  a full takeover (its own header); otherwise it expands inside the page. */
function ReviewPanel({
  pending,
  selected,
  onToggle,
  onAct,
  onApproveAll,
  onClose,
  focused,
}: {
  pending: PendingItem[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onAct: (kind: "approve" | "hide") => void;
  onApproveAll: () => void;
  onClose: () => void;
  focused?: boolean;
}) {
  return (
    <div
      className={
        focused
          ? "absolute inset-0 flex flex-col bg-background pt-10"
          : "mt-3 flex min-h-0 flex-1 flex-col"
      }
    >
      {focused ? (
        <div className="flex items-center gap-1.5 px-4 pb-2">
          <button
            data-dir-press
            onClick={onClose}
            aria-label="Back"
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground"
          >
            <ChevronLeft className="size-5" />
          </button>
          <p data-dir-display className="text-base leading-none">
            Review {pending.length}
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between pb-1.5">
          <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
            Reviewing {pending.length}
          </p>
          <button
            data-dir-press
            onClick={onClose}
            className="text-[11px] font-semibold text-muted-foreground"
          >
            Done
          </button>
        </div>
      )}

      <div className={`min-h-0 flex-1 overflow-hidden ${focused ? "px-4" : ""}`}>
        <div className="columns-2 gap-[3px]">
          {pending.map((it) => (
            <SelectTile
              key={it.id}
              item={it}
              selected={selected.has(it.id)}
              onToggle={() => onToggle(it.id)}
            />
          ))}
        </div>
      </div>

      <BulkBar
        count={selected.size}
        total={pending.length}
        onAct={onAct}
        onApproveAll={onApproveAll}
      />
    </div>
  );
}

function SelectTile({
  item,
  selected,
  onToggle,
}: {
  item: PendingItem;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      data-dir-press
      onClick={onToggle}
      className={`relative mb-[3px] block w-full overflow-hidden ${item.ratio}`}
      style={{ borderRadius: "var(--radius-tile)" }}
    >
      <Image src={item.src} alt="" fill sizes="160px" className="object-cover" />
      <span
        className={`absolute inset-0 transition-colors duration-150 ${selected ? "bg-black/40" : "bg-transparent"}`}
      />
      <span
        className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full border-2 transition-colors duration-150"
        style={
          selected
            ? { borderColor: "#fff", background: "var(--success)" }
            : { borderColor: "rgba(255,255,255,0.85)", background: "rgba(0,0,0,0.3)" }
        }
      >
        {selected && <Check className="size-3 text-white" />}
      </span>
    </button>
  );
}

/** The sticky bottom bulk bar: contextual (selected actions vs. approve-all). */
function BulkBar({
  count,
  total,
  onAct,
  onApproveAll,
}: {
  count: number;
  total: number;
  onAct: (kind: "approve" | "hide") => void;
  onApproveAll: () => void;
}) {
  return (
    <div className="border-t border-border bg-background/90 px-4 py-2.5 backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        {count > 0 ? (
          <>
            <span className="text-[11px] font-medium">{count} selected</span>
            <div className="flex items-center gap-1.5">
              <button
                data-dir-press
                onClick={() => onAct("hide")}
                className="flex h-8 items-center gap-1 rounded-[var(--radius-action-sm)] border border-border px-2.5 text-[11px] font-semibold"
                style={{ color: "var(--warning)" }}
              >
                <EyeOff className="size-3.5" />
                Hide
              </button>
              <button
                data-dir-press
                onClick={() => onAct("approve")}
                className="flex h-8 items-center gap-1 rounded-[var(--radius-action-sm)] px-3 text-[11px] font-semibold text-white"
                style={{ background: "var(--success)" }}
              >
                <Check className="size-3.5" />
                Approve
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="text-[11px] text-muted-foreground">
              Tap photos to select
            </span>
            <button
              data-dir-press
              onClick={onApproveAll}
              className="flex h-8 items-center gap-1 rounded-[var(--radius-action-sm)] px-3 text-[11px] font-semibold text-white"
              style={{ background: "var(--success)" }}
            >
              <Check className="size-3.5" />
              Approve all {total}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function CaughtUp({ onReset }: { onReset: () => void }) {
  return (
    <div className="mt-3 flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-center">
      <span
        className="flex size-11 items-center justify-center rounded-full"
        style={{ background: "var(--success)" }}
      >
        <Check className="size-5 text-white" />
      </span>
      <p className="text-[12px] font-medium">All caught up</p>
      <p className="text-[10px] text-muted-foreground">
        Nothing waiting to review
      </p>
      <button
        onClick={onReset}
        className="mt-1 text-[10px] font-medium text-muted-foreground underline underline-offset-2"
      >
        Replay demo
      </button>
    </div>
  );
}

/* ── The settings route + crossfade + Deleted-behind-settings ─────────────── */

type Screen = "gallery" | "settings" | "deleted";

export function HostSettingsTransitionDemo() {
  const [screen, setScreen] = useState<Screen>("gallery");
  const [fading, setFading] = useState(false);

  function go(next: Screen) {
    setFading(true);
    setTimeout(() => {
      setScreen(next);
      setFading(false);
    }, 130);
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className={`absolute inset-0 transition-opacity duration-150 ease-out ${fading ? "opacity-0" : "opacity-100"}`}
      >
        {screen === "gallery" && (
          <div className="flex h-full flex-col px-4 pt-12">
            <MiniHeader />
            <MiniStrip onSettings={() => go("settings")} />
            <div className="mt-3 min-h-0 flex-1 overflow-hidden">
              <MiniMasonry />
            </div>
          </div>
        )}
        {screen === "settings" && (
          <RouteScreen title="Settings" onBack={() => go("gallery")}>
            <SettingsBody onDeleted={() => go("deleted")} />
          </RouteScreen>
        )}
        {screen === "deleted" && (
          <RouteScreen title="Deleted" onBack={() => go("settings")}>
            <DeletedBody />
          </RouteScreen>
        )}
      </div>
    </div>
  );
}

function RouteScreen({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col pt-10">
      <div className="flex items-center gap-1.5 px-4 pb-3">
        <button
          data-dir-press
          onClick={onBack}
          aria-label="Back"
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground"
        >
          <ChevronLeft className="size-5" />
        </button>
        <p data-dir-display className="text-lg leading-none">
          {title}
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
    </div>
  );
}

function SettingsBody({ onDeleted }: { onDeleted: () => void }) {
  return (
    <div className="space-y-2.5">
      <FormCard heading="Details" line="Name, description and date" />
      <FormCard heading="Visibility & access" line="Open, no password" />
      <FormCard heading="Guest uploads" line="Accepting, review before showing" />
      {/* Deleted lives BEHIND settings (ratified placement): the retrieval path
          is where a host actually looks for it, and it never crowds the page. */}
      <button
        data-dir-press
        onClick={onDeleted}
        className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5"
      >
        <span className="flex items-center gap-2 text-[12px] font-medium">
          <Trash2 className="size-3.5 text-muted-foreground" />
          Deleted
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          3
          <ChevronRight className="size-3.5" />
        </span>
      </button>
    </div>
  );
}

function FormCard({ heading, line }: { heading: string; line: string }) {
  return (
    <div data-dir-card className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <div>
          {/* Functional heading: Inter (NOT the serif), per the system rule. */}
          <p className="text-[12px] font-semibold">{heading}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">{line}</p>
        </div>
        <ChevronRight className="size-4 text-muted-foreground" />
      </div>
    </div>
  );
}

function DeletedBody() {
  const ratios = ["aspect-square", "aspect-[3/4]", "aspect-[4/5]", "aspect-square"];
  return (
    <div className="columns-2 gap-[3px]">
      {PHOTOS.slice(3, 9).map((src, i) => (
        <div
          key={src}
          className={`relative mb-[3px] overflow-hidden ${ratios[i % 4]}`}
          style={{ borderRadius: "var(--radius-tile)" }}
        >
          <Image
            src={src}
            alt=""
            fill
            sizes="160px"
            className="object-cover opacity-90"
          />
          <span className="absolute top-1 left-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[8px] font-semibold text-white">
            {29 - i}d
          </span>
          <div className="absolute top-1 right-1 flex gap-0.5">
            <span className="flex size-4.5 items-center justify-center rounded-full bg-black/55">
              <Undo2 className="size-2.5 text-white" />
            </span>
            <span className="flex size-4.5 items-center justify-center rounded-full bg-black/55">
              <Trash2 className="size-2.5 text-white" />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Shared mini composition pieces (the ratified page, in miniature) ─────── */

function MiniHeader() {
  return (
    <div>
      <p data-dir-display className="text-lg leading-snug">
        {EVENT_NAME}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
        <span>Jun 14</span>
        <span aria-hidden className="text-muted-foreground/50">
          ·
        </span>
        <span className="flex items-center gap-1">
          <Images className="size-2.5" />
          128
        </span>
        <span className="flex items-center gap-1">
          <Users className="size-2.5" />
          24
        </span>
        <span aria-hidden className="text-muted-foreground/50">
          ·
        </span>
        <span className="flex items-center gap-1">
          <Globe className="size-2.5" />
          Open
        </span>
      </div>
    </div>
  );
}

function MiniStrip({ onSettings }: { onSettings?: () => void }) {
  return (
    <div className="mt-3 space-y-1.5">
      <button
        data-dir-press
        className="flex h-9 w-full items-center justify-center gap-1.5 rounded-[var(--radius-action-sm)] bg-primary text-[11px] font-semibold text-primary-foreground"
      >
        <QrCode className="size-3.5" />
        Share
      </button>
      <div className="flex items-center gap-1.5">
        <button
          data-dir-press
          className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-action-sm)] border border-border bg-card text-[11px] font-medium"
        >
          <ImageUp className="size-3.5" />
          Add photos
        </button>
        <button
          data-dir-press
          onClick={onSettings}
          aria-label="Settings"
          className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-action-sm)] border border-border bg-card text-muted-foreground"
        >
          <Settings className="size-4" />
        </button>
      </div>
    </div>
  );
}

function MiniMasonry() {
  const ratios = ["aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[3/4]"];
  return (
    <div className="columns-2 gap-[3px]">
      {PHOTOS.slice(0, 6).map((src, i) => (
        <div
          key={src}
          className={`relative mb-[3px] overflow-hidden ${ratios[i % 4]}`}
          style={{ borderRadius: "var(--radius-tile)" }}
        >
          <Image src={src} alt="" fill sizes="160px" className="object-cover" />
        </div>
      ))}
    </div>
  );
}
