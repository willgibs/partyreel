"use client";

import {
  type ComponentType,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Bell,
  Check,
  Download,
  ImageUp,
  ListChecks,
  Maximize2,
  QrCode,
  Settings,
  X,
} from "lucide-react";

import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { Frame, useLabPrefs } from "@/components/lab";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { EVENT } from "./fixtures";

/**
 * THE PAIRING, DRAWN ON THE REAL BUTTON, round two.
 *
 * ★ HEIGHT NEVER MOVES (measured, not assumed). All three options change a
 * size's TEXT (onto the caption/working/reading steps, round one's own
 * mapping: xs+sm caption, default+lg working, cta reading) and, for two of
 * them, its ICON; height stays each size's OWN shipped `h-*`/`size-*` because
 * every icon this round ever proposes — even step-up's biggest, cta's 18px —
 * still fits its current box with room on every side. So `size={...}` alone
 * gives every row its real height, corner and padding, unedited; the only
 * className this file ever adds is the text step and, where an option says
 * so, the icon's own `size-*`. Nothing here touches button.tsx.
 *
 * ★ THE THREE OPTIONS, AS NUMBERS (text/icon, px). `text`: 12/12, 14/14,
 * 16/16 — the icon IS the text. `step-up`: 12/14, 14/16, 16/18 — the icon is
 * always one Tailwind icon-step over (a constant +2px). `today`: the icon
 * button.tsx already ships (xs 12, sm 14, default/lg/cta 16) under the NEW
 * text — which is exactly the mismatch he saw: sm's new 12px text beside its
 * old, untouched 14px icon.
 *
 * ★ A COINCIDENCE WORTH SAYING OUT LOUD. sm, default, lg and cta's TODAY icon
 * (14, 16, 16, 16) already equals step-up's formula at three of those four
 * (sm's 14 IS one notch over 12; default and lg's 16 IS one notch over 14).
 * Only xs (flush at 12/12 today) and cta (flush at 16/16 today) actually MOVE
 * under step-up. So step-up and today draw sm's Download identically — not a
 * bug, the proof that step-up reaches his "mismatched" pairing by a stated
 * rule rather than by button.tsx's own inheritance accident — and diverge
 * everywhere else.
 */
export type Pairing = "text" | "step-up" | "today";

type Tier = "caption" | "working" | "reading";
type NamedSize =
  | "xs"
  | "sm"
  | "default"
  | "lg"
  | "cta"
  | "icon"
  | "icon-xs"
  | "icon-sm"
  | "icon-lg";

const TIER_OF: Record<NamedSize, Tier> = {
  xs: "caption",
  sm: "caption",
  default: "working",
  lg: "working",
  cta: "reading",
  "icon-xs": "caption",
  "icon-sm": "caption",
  icon: "working",
  "icon-lg": "working",
};

/** The step every size's TEXT wears in all three options (round one, ruled). */
const TIER_TEXT: Record<Tier, { cls: string; px: number }> = {
  caption: { cls: "text-caption", px: 12 },
  working: { cls: "text-working", px: 14 },
  reading: { cls: "text-reading", px: 16 },
};

/** `text`: the icon at the same Tailwind step as the text (12/14/16 -> size-3/3.5/4). */
const AT_STEP: Record<number, string> = {
  12: "size-3",
  14: "size-3.5",
  16: "size-4",
};
/** `step-up`: the icon one Tailwind icon-step over (12->14->16->18). */
const ONE_OVER: Record<number, string> = {
  12: "size-3.5",
  14: "size-4",
  16: "size-4.5",
};
/** `today`: exactly what button.tsx ships now (read off it, never edited). */
const TODAY_ICON: Record<NamedSize, string> = {
  xs: "size-3",
  sm: "size-3.5",
  default: "size-4",
  lg: "size-4",
  cta: "size-4",
  icon: "size-4",
  "icon-xs": "size-3",
  "icon-sm": "size-4",
  "icon-lg": "size-4",
};

function textClass(size: NamedSize): string {
  return TIER_TEXT[TIER_OF[size]].cls;
}
function iconClass(size: NamedSize, pairing: Pairing): string {
  if (pairing === "today") return TODAY_ICON[size];
  const px = TIER_TEXT[TIER_OF[size]].px;
  return pairing === "text" ? AT_STEP[px] : ONE_OVER[px];
}

/* ── the two widths, exactly as round one declared them ──────────────────── */

export const WIDTHS = {
  "1440": { w: 1440, h: 900, name: "a desktop" },
  "375": { w: 375, h: 812, name: "a phone" },
} as const;
export type WidthId = keyof typeof WIDTHS;
export const widthOf = (v: string | undefined): WidthId =>
  v === "375" ? "375" : "1440";

/* ── the measurement: text, icon, height and gap, read off the real box ──── */

export type ButtonProbe = {
  label: string;
  sel: string;
  /** No visible label beside the icon: an icon-only button has no gap to
   *  speak of (one flex child, no `gap-*` in its own cva row) and its
   *  inherited font-size is ambient page context, never a step this ask
   *  sets, so neither is worth printing. */
  iconOnly?: boolean;
};

/** A number, or "–" for one this box genuinely has none of (an icon-only
 *  button's gap: one flex child, nothing to space it from). */
const px = (n: number) =>
  Number.isFinite(n) ? (Math.round(n * 10) / 10).toString() : "–";

/**
 * Reads text size, icon size, box height and the flex gap off a real
 * `data-slot="button"` element inside the frame's own window (the same
 * reason `type-ladder-policy.test.ts`'s scan and round one's `Measured` both
 * insist on the computed value rather than the class name: a className is
 * what was WRITTEN, this is what RENDERS).
 *
 * ★ `token` MUST CHANGE ACROSS A SWAP, EVEN THOUGH `probes` NEVER DOES. On the
 * plain board page (never the stepped review, which mounts every option in
 * its own keyed div) switching `pairs` from one option to another re-renders
 * this SAME mounted tree with new classes rather than remounting it: React
 * keys on type and position, and `BoardSection` hands the evidence back as a
 * single unkeyed child. `PAIR_PROBES` is a module constant, so `[probes]`
 * alone never re-fires this effect on that swap, and since the three options
 * share one box height by construction (the file head's note), the
 * ResizeObserver never fires either: the caption froze on whichever option
 * was live in the first 1.5s after mount. `token` (the frame's own id, unique
 * per pairing and width) forces the effect to tear down and re-run `read()`
 * the moment either one changes.
 */
function MeasuredButtons({
  probes,
  token,
  onMeasure,
  children,
}: {
  probes: readonly ButtonProbe[];
  /** Changes whenever the drawn content does, even when `probes` itself is a
   *  stable reference (see the WHY above). */
  token: string;
  onMeasure: (text: string) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const report = useRef(onMeasure);
  useEffect(() => {
    report.current = onMeasure;
  });

  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win) return;
    const read = () => {
      const parts: string[] = [];
      for (const p of probes) {
        const node = el.querySelector<HTMLElement>(p.sel);
        if (!node) continue;
        const s = win.getComputedStyle(node);
        const height = node.getBoundingClientRect().height;
        const svg = node.querySelector("svg");
        const icon = svg ? svg.getBoundingClientRect().width : Number.NaN;
        const iconBit = `icon ${px(icon)} · h ${px(height)}`;
        if (p.iconOnly) {
          parts.push(`${p.label} ${iconBit}`);
        } else {
          const text = parseFloat(s.fontSize);
          const gap = parseFloat(s.columnGap);
          parts.push(
            `${p.label} text ${px(text)} · ${iconBit} · gap ${px(gap)}`,
          );
        }
      }
      if (parts.length > 0)
        report.current(`${parts.join(" · ")}, measured in the frame`);
    };
    read();
    const timers = [160, 700, 1500].map((ms) => win.setTimeout(read, ms));
    const ro = new win.ResizeObserver(read);
    ro.observe(el);
    return () => {
      timers.forEach((t) => win.clearTimeout(t));
      ro.disconnect();
    };
    // `token` is read for its CHANGES only, never inside `read()` itself: see
    // the WHY above the component.
  }, [probes, token]);

  return <div ref={ref}>{children}</div>;
}

/* ── the frame, fitted the way the lab is (round one's Fit, unchanged) ───── */

function Fit({ w, children }: { w: number; children: ReactNode }) {
  const { fit } = useLabPrefs();
  const zoomed = fit === "zoom";
  const box = useRef<HTMLDivElement | null>(null);
  const [room, setRoom] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el || !zoomed) return;
    const sync = () => setRoom(el.getBoundingClientRect().width);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [zoomed]);

  const k = zoomed && room ? Math.min(1, room / w) : 1;
  return (
    <div
      ref={box}
      data-stage-fit={zoomed ? "zoom" : "true"}
      className={zoomed ? "min-w-0 overflow-hidden" : "min-w-0 overflow-x-auto"}
    >
      <div style={{ width: w, zoom: k }}>{children}</div>
    </div>
  );
}

/** One pairing option, at one width, with its numbers read off it. */
function PairFrame({
  id,
  width,
  title,
  probes,
  children,
}: {
  id: string;
  width: WidthId;
  title: string;
  probes: readonly ButtonProbe[];
  children: ReactNode;
}) {
  const { w, h: full } = WIDTHS[width];
  const h = Math.min(full, 620);
  const [caption, setCaption] = useState("measuring");
  // Unique per pairing AND width, so it doubles as MeasuredButtons' change
  // token: the one thing guaranteed to differ whenever the drawn content does.
  const frameId = `${id}-${width}`;
  return (
    <Fit w={w}>
      <Frame
        id={frameId}
        w={w}
        h={h}
        title={`${title}, ${WIDTHS[width].name}`}
        caption={caption}
      >
        <MeasuredButtons probes={probes} token={frameId} onMeasure={setCaption}>
          {children}
        </MeasuredButtons>
      </Frame>
    </Fit>
  );
}

/* ── the rows, each the real <Button> in the place it ships ──────────────── */

type ButtonSize =
  | "xs"
  | "sm"
  | "default"
  | "lg"
  | "cta"
  | "icon"
  | "icon-xs"
  | "icon-sm"
  | "icon-lg";

/** A labelled action: the real Button, wearing this option's text and icon.
 *  `probe` is a bare `data-probe` marker (never `data-size` alone: a frame
 *  holds more than one button of the same size, and `data-probe` is what lets
 *  a selector name ONE of them without depending on DOM order). */
function PairedButton({
  pairing,
  size,
  variant = "outline",
  icon: Icon,
  className,
  probe,
  children,
}: {
  pairing: Pairing;
  size: ButtonSize;
  variant?: "default" | "outline" | "secondary";
  /** Left out where production carries no icon (Save/Invite): the row still
   *  wears the option's TEXT step, just nothing to measure an icon on. */
  icon?: ComponentType<{ className?: string }>;
  className?: string;
  probe?: string;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      data-probe={probe}
      className={cn(textClass(size), className)}
    >
      {Icon ? <Icon className={iconClass(size, pairing)} /> : null}
      {children}
    </Button>
  );
}

/** An icon-only action: the four icon sizes, none of them carrying text. */
function PairedIconButton({
  pairing,
  size,
  icon: Icon,
  label,
  probe,
}: {
  pairing: Pairing;
  size: "icon" | "icon-xs" | "icon-sm" | "icon-lg";
  icon: ComponentType<{ className?: string }>;
  label: string;
  probe: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      aria-label={label}
      data-probe={probe}
    >
      <Icon className={iconClass(size, pairing)} />
    </Button>
  );
}

/**
 * EVERY BUTTON SIZE, IN THE PLACE IT SHIPS, wearing one pairing option: the
 * guest's `lg` block, the marketing/pricing `cta`, the host's `default`
 * command strip, the Gallery header's `sm` pair (`GalleryDownloadAllButton`,
 * `GallerySelectButton` — same label, same icon, same variant, reconstructed
 * because both read a provider or a network this lab cannot mount), a review
 * tile's `xs` pair, the four icon-only sizes together, and — unchanged, for
 * comparison — the guest album's own hand-rolled Download (`live-gallery.tsx`,
 * not a `<Button>` at all, so no option here touches it).
 */
export function ButtonPairSurfaces({
  width,
  pairing,
}: {
  width: WidthId;
  pairing: Pairing;
}) {
  const phone = width === "375";
  return (
    <div className="min-h-full bg-background px-6 py-8 text-foreground">
      <div
        className={`mx-auto grid max-w-5xl gap-6 ${phone ? "" : "grid-cols-2"}`}
      >
        {/* The guest's action block: lg. */}
        <div className="rounded-lg border border-border p-4">
          <h1 className="font-heading text-subsection">{EVENT.name}</h1>
          <p className="mt-1 text-reading text-muted-foreground">
            {EVENT.photos} photos and videos from {EVENT.guests} guests
          </p>
          <div className="mt-4">
            <PairedButton
              pairing={pairing}
              size="lg"
              variant="default"
              icon={ImageUp}
              className="w-full"
            >
              Add photos
            </PairedButton>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <PairedButton pairing={pairing} size="lg">
                Save
              </PairedButton>
              <PairedButton pairing={pairing} size="lg">
                Invite
              </PairedButton>
            </div>
          </div>
        </div>

        {/* The 44px cta: a pricing or contact submit. */}
        <div className="rounded-lg border border-border p-4">
          <p className="text-label text-muted-foreground uppercase">
            Free forever
          </p>
          <p className="mt-2 text-reading text-muted-foreground">
            One event, fifty photographs, no card. Upgrade whenever you need
            the room.
          </p>
          <Button
            type="button"
            size="cta"
            data-probe="cta"
            className={cn(textClass("cta"), "mt-4 w-full")}
          >
            <QrCode className={iconClass("cta", pairing)} />
            Start for free
          </Button>
        </div>

        {/* The host's command strip: default. */}
        <div className="rounded-lg border border-border p-4">
          <h2 className="text-label text-muted-foreground uppercase">
            The host&rsquo;s event page
          </h2>
          <div
            className={`mt-3 flex gap-2 ${phone ? "flex-col" : "flex-row items-center"}`}
          >
            <PairedButton
              pairing={pairing}
              size="default"
              variant="default"
              icon={QrCode}
              className={phone ? "" : "flex-1"}
              probe="default-share"
            >
              Share
            </PairedButton>
            <div className="flex gap-2">
              <PairedButton
                pairing={pairing}
                size="default"
                icon={ImageUp}
                className="flex-1"
              >
                Add photos
              </PairedButton>
              <PairedButton pairing={pairing} size="default" icon={Settings}>
                Settings
              </PairedButton>
            </div>
          </div>
        </div>

        {/* The Gallery header's sm pair (the named mismatch), the guest
            album's raw Download beside it for comparison, and a review
            tile's xs pair. */}
        <div className="space-y-3 rounded-lg border border-border p-4">
          <FeedSectionHeader
            label="Gallery"
            count={128}
            action={
              <div className="flex items-center gap-1.5">
                <PairedButton
                  pairing={pairing}
                  size="sm"
                  icon={Download}
                  probe="sm-download"
                >
                  Download
                </PairedButton>
                <PairedButton pairing={pairing} size="sm" icon={ListChecks}>
                  Select
                </PairedButton>
              </div>
            }
          />
          {/* live-gallery.tsx's own markup, byte for byte: not a <Button>,
              so no pairing option ever touches it. */}
          <div className="flex justify-end">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-save active:scale-[0.98]"
            >
              <Download className="size-4" /> Download all
            </button>
          </div>
          <div className="relative overflow-hidden rounded-xl">
            {/* A plain toned box stands in for a photograph: the review
                chips' backdrop is context, never the evidence. */}
            <div
              aria-hidden
              className="aspect-[16/10] w-full bg-gradient-to-br from-muted to-muted-foreground/20"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/70 to-transparent p-2.5">
              <PairedButton
                pairing={pairing}
                size="xs"
                variant="secondary"
                icon={Check}
                probe="xs-approve"
              >
                Approve
              </PairedButton>
              <PairedButton
                pairing={pairing}
                size="xs"
                variant="secondary"
                icon={X}
              >
                Hide
              </PairedButton>
              <span className="text-micro font-medium text-white/80">
                Waiting for review
              </span>
            </div>
          </div>
        </div>

        {/* The four icon-only sizes, together. */}
        <div className="rounded-lg border border-border p-4">
          <h2 className="text-label text-muted-foreground uppercase">
            Icon-only, every size
          </h2>
          <div className="mt-3 flex items-center gap-3">
            <PairedIconButton
              pairing={pairing}
              size="icon-xs"
              icon={X}
              label="Remove filter (icon-xs)"
              probe="icon-xs"
            />
            <PairedIconButton
              pairing={pairing}
              size="icon-sm"
              icon={Settings}
              label="Settings (icon-sm)"
              probe="icon-sm"
            />
            <PairedIconButton
              pairing={pairing}
              size="icon"
              icon={Bell}
              label="Notifications (icon)"
              probe="icon"
            />
            <PairedIconButton
              pairing={pairing}
              size="icon-lg"
              icon={Maximize2}
              label="Expand (icon-lg)"
              probe="icon-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** What each option's frame measures: the flagship sm mismatch, xs, default, cta and one icon-only. */
export const PAIR_PROBES: readonly ButtonProbe[] = [
  { label: "sm Download", sel: '[data-probe="sm-download"]' },
  { label: "xs Approve", sel: '[data-probe="xs-approve"]' },
  { label: "default Share", sel: '[data-probe="default-share"]' },
  { label: "cta", sel: '[data-probe="cta"]' },
  { label: "icon-sm", sel: '[data-probe="icon-sm"]', iconOnly: true },
];

export { PairFrame };
