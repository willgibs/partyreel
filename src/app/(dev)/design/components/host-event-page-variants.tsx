import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Images,
  ImageUp,
  Plus,
  QrCode,
  ScanLine,
  Settings,
  Trash2,
  Undo2,
  Users,
} from "lucide-react";

import { EVENT_NAME, PHOTOS } from "../screens/sample-photos";
import { Variant } from "./variant-frame";

/**
 * Touchpoint: the GALLERY-FIRST EVENT PAGE made concrete (Phase 5 S3·S0). The
 * gallery-first DIRECTION is already ratified (`host-event` decision 1). This
 * round makes it real and resolves the two open build forks, in three groups:
 *
 *   A. Whole-page composition - 3 takes on the gallery-first architecture
 *      (command-strip arrangement + header/stats treatment). React to the page.
 *   B. Settings entry - route / drawer / dialog (Will wants to feel it).
 *   C. Deleted placement - behind-settings / command-strip / gallery-toggle.
 *
 * The settled add-pattern (a command-strip Add at the top + the floating Add
 * that appears on scroll, never both) is shown for context throughout. Label is
 * "Deleted" everywhere (the 2026-06-20 rename, not "Trash").
 *
 * Emil management-tool contract (annotated per take): the host app is a
 * high-frequency tool - press feedback ONLY on moderation, no entrance/stagger
 * theater, instant switches; the share/settings surfaces keep the system
 * timings (origin-aware sheets, centered dialogs). Motion spends nothing here.
 */
export function HostEventPageVariants() {
  return (
    <div className="space-y-12 py-4">
      <Group
        eyebrow="A. Whole-page composition"
        blurb="The overall gallery-first architecture: how the command strip is arranged and how the header carries identity vs. stats. The masonry-with-moderation-badges gallery is the page body in every take."
      >
        <Variant
          n={1}
          name="Editorial + inline strip"
          rationale="Minimal left-editorial header (name + a quiet meta line), then ONE command strip (Share, the amber review chip, settings), then the guest-matched Add above the gallery. Calmest, most guest-cohesive. Motion: press feedback only; the gallery never staggers."
        >
          <PhonePage>
            <EditorialHeader />
            <CommandStrip />
            <AddBar />
            <GalleryBody />
            <FloatingAdd />
          </PhonePage>
        </Variant>

        <Variant
          n={2}
          name="Stat line + merged row"
          rationale="The header trades the meta line for a glanceable stat line (items / contributors / views); actions merge into one compact row (Add primary, then Share, the amber review chip, settings). Densest - more is actionable above the fold. Motion: numbers never animate."
        >
          <PhonePage>
            <EditorialHeader stat />
            <MergedActionRow />
            <GalleryBody />
            <FloatingAdd />
          </PhonePage>
        </Variant>

        <Variant
          n={3}
          name="Share-forward"
          rationale="Sharing is the host's job-to-be-done, so it leads: a share card (mini QR + link + copy) under the header, a thin utility row (review + settings), then Add + gallery. Best when growth is the priority. Motion: the share card opens the suite with the system dialog timing."
        >
          <PhonePage>
            <EditorialHeader />
            <ShareCard />
            <UtilityRow />
            <AddBar />
            <GalleryBody count={6} />
            <FloatingAdd />
          </PhonePage>
        </Variant>
      </Group>

      <Group
        eyebrow="B. Settings entry"
        blurb="The same gallery-first page; settings open three different ways. The pick shapes the S4 dirty-guard (a route gives native back + room; a sheet/dialog keeps the gallery behind but scopes the guard in-component)."
      >
        <Variant
          n={1}
          name="Dedicated route"
          rationale="Settings is its own page (/[eventId]/settings) with a back chevron - the form gets full height, deep-linkable, and the browser back button is the honest exit (the dirty guard arms beforeunload + intercepts the back). Best for a long form. Motion: a standard route push, no theater."
        >
          <PhonePage pad={false}>
            <RouteScreen title="Settings">
              <SettingsForm />
            </RouteScreen>
          </PhonePage>
        </Variant>

        <Variant
          n={2}
          name="Drawer over gallery"
          rationale="A bottom sheet glides up over the dimmed gallery - the event stays in view behind it, dismiss by drag or backdrop. Keeps you on the page. Motion: the iOS drawer curve, exits faster than it enters; the guard is scoped to the sheet."
        >
          <PhonePage>
            <DimmedBackdrop />
            <BottomSheet title="Settings">
              <SettingsForm condensed />
            </BottomSheet>
          </PhonePage>
        </Variant>

        <Variant
          n={3}
          name="Centered dialog"
          rationale="A centered modal holds the settings, the gallery dimmed behind. Tightest focus, but the form scrolls inside a smaller frame. Motion: scales from center (modals are not trigger-anchored), system dialog timing."
        >
          <PhonePage>
            <DimmedBackdrop />
            <CenteredDialog title="Settings">
              <SettingsForm condensed />
            </CenteredDialog>
          </PhonePage>
        </Variant>
      </Group>

      <Group
        eyebrow="C. Deleted placement"
        blurb="Where the recovery bin lives (label: Deleted). Every take reaches the same surface: the deleted masonry with a countdown pill + restore / delete-forever controls."
      >
        <Variant
          n={1}
          name="Behind settings"
          rationale="A 'Deleted' row inside settings, with its count - tucked away, never competing with the gallery. Cleanest command strip, but recovery is two taps deep. Motion: a standard row tap into the bin."
        >
          <PhonePage pad={false}>
            <RouteScreen title="Settings">
              <SettingsList highlightDeleted />
            </RouteScreen>
          </PhonePage>
        </Variant>

        <Variant
          n={2}
          name="Command-strip entry"
          rationale="A small Deleted chip (icon + count) joins the command strip, shown ONLY when the bin is non-empty - one tap to recovery, and it disappears when there's nothing to recover. Motion: the chip is press-only; opening the bin is instant."
        >
          <PhonePage>
            <EditorialHeader />
            <CommandStrip deletedCount={3} />
            <SectionLabel>Deleted</SectionLabel>
            <DeletedGrid />
          </PhonePage>
        </Variant>

        <Variant
          n={3}
          name="Gallery view-toggle"
          rationale="A segmented toggle (Gallery / Deleted) swaps the masonry to the bin in place - recovery feels like a view of the same gallery, not a separate screen. Motion: the toggle is instant (no slide), per the management-tool contract."
        >
          <PhonePage>
            <EditorialHeader />
            <ViewToggle />
            <DeletedGrid count={6} />
          </PhonePage>
        </Variant>
      </Group>
    </div>
  );
}

/* ── Layout scaffolding ──────────────────────────────────────────────────── */

function Group({
  eyebrow,
  blurb,
  children,
}: {
  eyebrow: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
        {eyebrow}
      </p>
      <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{blurb}</p>
      <div
        aria-hidden
        className="mt-5 grid gap-8 md:grid-cols-2 xl:grid-cols-3"
      >
        {children}
      </div>
    </section>
  );
}

/** The phone canvas: a full-bleed column (status-bar inset at top). */
function PhonePage({
  children,
  pad = true,
}: {
  children: React.ReactNode;
  pad?: boolean;
}) {
  return (
    <div
      className={`absolute inset-0 flex flex-col overflow-hidden ${pad ? "px-4 pt-12" : "pt-9"}`}
    >
      {children}
    </div>
  );
}

/* ── Shared composition pieces (hand-built; mirror the ratified specs) ────── */

function EditorialHeader({ stat }: { stat?: boolean }) {
  return (
    <div>
      <p data-dir-display className="text-xl leading-snug">
        {EVENT_NAME}
      </p>
      {stat ? (
        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Images className="size-3" />
            128
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3" />
            24
          </span>
          <span className="flex items-center gap-1">
            <ScanLine className="size-3" />
            342
          </span>
        </div>
      ) : (
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          June 14, 2026 · Open · 128 items
        </p>
      )}
    </div>
  );
}

/** The single management surface: Share / amber review / settings (+ Deleted). */
function CommandStrip({ deletedCount }: { deletedCount?: number }) {
  return (
    <div className="mt-3 flex items-center gap-1.5">
      <button
        data-dir-press
        className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-action-sm)] bg-primary text-[11px] font-semibold text-primary-foreground"
      >
        <QrCode className="size-3.5" />
        Share
      </button>
      <button
        data-dir-press
        className="flex h-9 items-center justify-center rounded-[var(--radius-action-sm)] px-2.5 text-[11px] font-semibold"
        style={{
          background: "var(--warning)",
          color: "var(--warning-foreground)",
        }}
      >
        3 to review
      </button>
      {deletedCount ? (
        <button
          data-dir-press
          aria-label="Deleted"
          className="flex h-9 shrink-0 items-center gap-1 rounded-[var(--radius-action-sm)] border border-border bg-card px-2 text-[11px] font-medium text-muted-foreground"
        >
          <Trash2 className="size-3.5" />
          {deletedCount}
        </button>
      ) : null}
      <button
        data-dir-press
        aria-label="Settings"
        className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-action-sm)] border border-border bg-card text-muted-foreground"
      >
        <Settings className="size-4" />
      </button>
    </div>
  );
}

/** The guest-matched Add (top), the settled add-pattern's anchored half. */
function AddBar() {
  return (
    <button
      data-dir-press
      className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-[var(--radius-action-sm)] border border-dashed border-border bg-card/60 text-[12px] font-medium"
    >
      <ImageUp className="size-4" />
      Add photos
    </button>
  );
}

/** A2's dense single row: Add primary, then Share / review / settings. */
function MergedActionRow() {
  return (
    <div className="mt-3 flex items-center gap-1.5">
      <button
        data-dir-press
        className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-action-sm)] bg-primary text-[11px] font-semibold text-primary-foreground"
      >
        <ImageUp className="size-3.5" />
        Add
      </button>
      <button
        data-dir-press
        aria-label="Share"
        className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-action-sm)] border border-border bg-card text-muted-foreground"
      >
        <QrCode className="size-4" />
      </button>
      <button
        data-dir-press
        className="flex h-9 items-center justify-center rounded-[var(--radius-action-sm)] px-2.5 text-[11px] font-semibold"
        style={{
          background: "var(--warning)",
          color: "var(--warning-foreground)",
        }}
      >
        3
      </button>
      <button
        data-dir-press
        aria-label="Settings"
        className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-action-sm)] border border-border bg-card text-muted-foreground"
      >
        <Settings className="size-4" />
      </button>
    </div>
  );
}

/** A3's share card: mini QR + link + copy; tapping opens the share suite. */
function ShareCard() {
  return (
    <div data-dir-card className="mt-3 flex items-center gap-2.5 p-2.5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-tile)] bg-white p-1 ring-1 ring-border">
        <ScanLine className="size-6 text-black" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium">
          partyreel.com/e/maya-and-jay
        </p>
        <p className="text-[9px] text-muted-foreground">
          QR, link and printable card
        </p>
      </div>
      <button
        data-dir-press
        className="h-7 shrink-0 rounded-[var(--radius-action-sm)] border border-border px-2.5 text-[10px] font-medium"
      >
        Copy
      </button>
    </div>
  );
}

/** A3's thin utility row under the share card. */
function UtilityRow() {
  return (
    <div className="mt-2 flex items-center gap-1.5">
      <button
        data-dir-press
        className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-action-sm)] text-[11px] font-semibold"
        style={{
          background: "var(--warning)",
          color: "var(--warning-foreground)",
        }}
      >
        3 to review
      </button>
      <button
        data-dir-press
        aria-label="Settings"
        className="flex h-8 shrink-0 items-center gap-1 rounded-[var(--radius-action-sm)] border border-border bg-card px-2.5 text-[11px] font-medium text-muted-foreground"
      >
        <Settings className="size-3.5" />
        Settings
      </button>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </p>
  );
}

/** The ratified masonry, host edition: moderation badges, no stagger. */
function GalleryBody({ count = 8 }: { count?: number }) {
  return (
    <div className="mt-3 min-h-0 flex-1 overflow-hidden">
      <Masonry count={count} withBadges />
    </div>
  );
}

function Masonry({
  count,
  withBadges,
}: {
  count: number;
  withBadges?: boolean;
}) {
  const ratios = [
    "aspect-[3/4]",
    "aspect-square",
    "aspect-[4/5]",
    "aspect-[3/4]",
  ];
  return (
    <div className="columns-2 gap-[3px]">
      {PHOTOS.slice(0, count).map((src, i) => (
        <div
          key={src}
          className={`relative mb-[3px] overflow-hidden ${ratios[i % 4]}`}
          style={{ borderRadius: "var(--radius-tile)" }}
        >
          <Image src={src} alt="" fill sizes="160px" className="object-cover" />
          {withBadges && i === 1 && (
            <span
              className="absolute top-1 left-1 rounded-full px-1.5 py-0.5 text-[8px] font-semibold"
              style={{
                background: "var(--warning)",
                color: "var(--warning-foreground)",
              }}
            >
              pending
            </span>
          )}
          {withBadges && i === 2 && (
            <div className="absolute top-1 right-1 flex gap-0.5">
              <span className="flex size-4.5 items-center justify-center rounded-full bg-black/50">
                <Eye className="size-2.5 text-white" />
              </span>
              <span className="flex size-4.5 items-center justify-center rounded-full bg-black/50">
                <Trash2 className="size-2.5 text-white" />
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** The recovery bin: countdown pill + restore / delete-forever, riding ratios. */
function DeletedGrid({ count = 8 }: { count?: number }) {
  const ratios = [
    "aspect-square",
    "aspect-[3/4]",
    "aspect-[4/5]",
    "aspect-square",
  ];
  return (
    <div className="mt-2 min-h-0 flex-1 overflow-hidden">
      <div className="columns-2 gap-[3px]">
        {PHOTOS.slice(3, 3 + count).map((src, i) => (
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
    </div>
  );
}

/** C3's in-place swap control: Gallery / Deleted, instant (no slide). */
function ViewToggle() {
  return (
    <div className="mt-3 inline-flex rounded-[var(--radius-action-sm)] border border-border bg-card p-0.5 text-[11px] font-medium">
      <span className="rounded-[calc(var(--radius-action-sm)-2px)] px-3 py-1 text-muted-foreground">
        Gallery
      </span>
      <span
        data-dir-press
        className="rounded-[calc(var(--radius-action-sm)-2px)] bg-foreground px-3 py-1 text-background"
      >
        Deleted
      </span>
    </div>
  );
}

/* ── The settled floating Add (appears on scroll; never with the top Add) ─── */

function FloatingAdd() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
      <span
        data-dir-press
        className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-[12px] font-semibold text-primary-foreground shadow-lg"
      >
        <Plus className="size-4" />
        Add photos
      </span>
    </div>
  );
}

/* ── Settings-surface mocks (route / sheet / dialog) ─────────────────────── */

function RouteScreen({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 pb-3">
        <ChevronLeft className="size-5 text-muted-foreground" />
        <p data-dir-display className="text-lg leading-none">
          {title}
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden px-4">{children}</div>
    </div>
  );
}

function DimmedBackdrop() {
  return (
    <>
      <div className="pointer-events-none opacity-40">
        <EditorialHeader />
        <CommandStrip />
        <AddBar />
        <GalleryBody />
      </div>
      <div className="absolute inset-0 bg-black/45" />
    </>
  );
}

function BottomSheet({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-background p-4 shadow-2xl ring-1 ring-border">
      <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-border" />
      <p data-dir-display className="text-lg leading-none">
        {title}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function CenteredDialog({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <div className="w-full rounded-2xl bg-background p-4 shadow-2xl ring-1 ring-border">
        <p data-dir-display className="text-lg leading-none">
          {title}
        </p>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

/* ── Settings form + list mocks (card-sections; Inter functional headings) ── */

function SettingsForm({ condensed }: { condensed?: boolean }) {
  return (
    <div className={condensed ? "space-y-2.5" : "space-y-3"}>
      <FormCard heading="Details" line="Name, description and date">
        <FieldRow label="Event name" value={EVENT_NAME} />
      </FormCard>
      <FormCard heading="Visibility & access" line="Who can open this event">
        <ToggleRow label="Require a password" on={false} />
      </FormCard>
      {!condensed && (
        <FormCard heading="Guest uploads" line="What guests can add">
          <ToggleRow label="Accepting uploads" on />
          <ToggleRow label="Review before showing" on />
        </FormCard>
      )}
    </div>
  );
}

function SettingsList({ highlightDeleted }: { highlightDeleted?: boolean }) {
  const rows = [
    "Details",
    "Visibility & access",
    "Guest uploads",
  ];
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <ListRow key={r} label={r} />
      ))}
      <ListRow
        label="Deleted"
        count={3}
        highlight={highlightDeleted}
      />
    </div>
  );
}

function FormCard({
  heading,
  line,
  children,
}: {
  heading: string;
  line: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-dir-card
      className="rounded-xl border border-border bg-card p-3"
    >
      {/* Functional heading: Inter (NOT the serif CardTitle) per the system rule. */}
      <p className="text-[12px] font-semibold">{heading}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">{line}</p>
      <div className="mt-2.5 space-y-2">{children}</div>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] text-muted-foreground">{label}</p>
      <div className="mt-1 flex h-8 items-center rounded-[var(--radius-action-sm)] border border-border px-2.5 text-[11px]">
        {value}
      </div>
    </div>
  );
}

function ToggleRow({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-[11px]">{label}</p>
      <span
        className={`flex h-4 w-7 items-center rounded-full p-0.5 ${on ? "justify-end bg-primary" : "justify-start bg-border"}`}
      >
        <span className="size-3 rounded-full bg-background" />
      </span>
    </div>
  );
}

function ListRow({
  label,
  count,
  highlight,
}: {
  label: string;
  count?: number;
  highlight?: boolean;
}) {
  return (
    <div
      data-dir-press
      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${
        highlight ? "border-foreground bg-card" : "border-border bg-card"
      }`}
    >
      <span className="flex items-center gap-2 text-[12px] font-medium">
        {label === "Deleted" && (
          <Trash2 className="size-3.5 text-muted-foreground" />
        )}
        {label}
      </span>
      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {count ? <span>{count}</span> : null}
        <ChevronRight className="size-3.5" />
      </span>
    </div>
  );
}
