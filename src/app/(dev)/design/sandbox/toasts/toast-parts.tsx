"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  CircleCheckIcon,
  Copy,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { FloatingAddButton } from "@/components/shared/floating-add-button";

import { COPY_FAILED, EVENT_NAME, SCENE_IMAGE, SCENE_IMAGE_2 } from "./fixtures";

/**
 * THE TOAST VOCABULARY, REPLICATED RATHER THAN WIRED. `ui/sonner.tsx` is a
 * real sonner Toaster fixed to the browser's own viewport, so it cannot sit
 * INSIDE a scaled 375/1440 frame the way `Frame` needs it to: a real toast
 * would render relative to whatever window the reader's browser actually is,
 * breaking out of the canvas being judged. So every toast here is a faithful
 * LOCAL replica: the same icons as `ui/sonner.tsx`, the same tokens as
 * `globals.css`'s state-coloured rule (`bg-success`/`bg-warning`/
 * `bg-destructive`, the same `color-mix` border), `rounded-float` and
 * `shadow-layer` for the same corner and the same light. Nothing here is a
 * new colour; `material=ink` reuses the real dark tokens by scoping a plain
 * `.dark` wrapper around a card, never a hand-typed value.
 */

export type ToastKind = "success" | "warning" | "error" | "info" | "loading" | "default";
export type ToastMaterial = "card" | "ink" | "shadow";

const ICON: Record<Exclude<ToastKind, "default">, React.ReactNode> = {
  success: <CircleCheckIcon className="size-4" aria-hidden />,
  warning: <TriangleAlertIcon className="size-4" aria-hidden />,
  error: <OctagonXIcon className="size-4" aria-hidden />,
  info: <InfoIcon className="size-4" aria-hidden />,
  loading: <Loader2Icon className="size-4 animate-spin" aria-hidden />,
};

/** `globals.css`'s state-coloured rule, verbatim: success/warning/error carry a
 *  fill and a `color-mix` border; info/loading/default keep the neutral popover
 *  ("Plain/info toasts keep the neutral --normal-* treatment"). */
const TONE: Record<ToastKind, string> = {
  success:
    "bg-success text-success-foreground border-[color-mix(in_oklch,var(--success),black_12%)]",
  warning:
    "bg-warning text-warning-foreground border-[color-mix(in_oklch,var(--warning),black_12%)]",
  // The real rule's own literal (globals.css): oklch(0.99 0 0), not a token -
  // replicated to the byte rather than "fixed" here, off this lane's `owns`.
  error:
    "bg-destructive text-[oklch(0.99_0_0)] border-[color-mix(in_oklch,var(--destructive),black_12%)]",
  info: "bg-popover text-popover-foreground border-border",
  loading: "bg-popover text-popover-foreground border-border",
  default: "bg-popover text-popover-foreground border-border",
};

export function ToastMock({
  kind,
  title,
  description,
  action,
  material = "card",
  dismissible,
  onDismiss,
  className,
  style,
}: {
  kind: ToastKind;
  title: string;
  description?: string;
  /** A label only: every option this board draws either has one slot or none. */
  action?: string;
  material?: ToastMaterial;
  /** `life=persist`'s own affordance: production swipes, a lab tile presses. */
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={cn(material === "ink" && "dark", className)} style={style}>
      <div
        role="status"
        className={cn(
          "flex w-[356px] max-w-[calc(100vw-2rem)] items-start gap-2.5 rounded-float border p-4 text-sm shadow-layer",
          material === "shadow" && "border-transparent",
          TONE[kind],
        )}
      >
        {kind !== "default" && <span className="mt-0.5 shrink-0">{ICON[kind]}</span>}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="font-medium leading-snug">{title}</p>
          {description && (
            <p className="text-[13px] leading-snug opacity-80">{description}</p>
          )}
        </div>
        {action && (
          <button
            type="button"
            className="ml-1 shrink-0 self-center rounded-full bg-current/15 px-2.5 py-1 text-xs font-semibold"
          >
            {action}
          </button>
        )}
        {dismissible && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="ml-1 shrink-0 self-start rounded-full bg-current/15 px-1.5 py-0.5 text-[10px] font-semibold"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

/* ── The scene's own chrome: what already lives at the foot and the top ──── */

/** The real component (`shared/floating-add-button.tsx`), unmodified: the
 *  guest's own foot-of-phone control, present whenever `where` is judged. */
export function GuestFloatingAdd() {
  return <FloatingAddButton show uploadingCount={0} onClick={() => {}} />;
}

/** The lightbox's `AttributionPill` (`media-lightbox.tsx`), replicated: it is
 *  not exported, so its look travels here rather than its function. Same
 *  glass utilities, same position (bottom-center, inset from the edge). */
export function GuestCreditPill() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
      <span className="glass glass-mark-lit rounded-full px-3 py-1 text-[11px] font-medium text-white/90">
        Uploaded by a guest · {EVENT_NAME}
      </span>
    </div>
  );
}

/** `event-feed-action-bar.tsx`'s own wrapper, replicated at the pill level: a
 *  `fixed inset-x-0 bottom-0 … justify-center` surface, bottom-CENTER on every
 *  width (never bottom-right) - the fact `where` and `foot` both argue from. */
export function HostActionBarPill() {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-background/95 px-3 py-2 text-xs font-medium shadow-layer backdrop-blur">
      <span className="rounded-full bg-primary px-3 py-1.5 text-primary-foreground">
        Approve all
      </span>
      <span className="text-muted-foreground">12 pending</span>
    </div>
  );
}

/** A slim header, standing in for the guest's sticky Add bar and the host's
 *  crumb trail: what `where=top` tucks a toast beneath. */
export function TopBar({ label }: { label: string }) {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 text-xs font-medium text-muted-foreground backdrop-blur">
      <span>{label}</span>
      <span className="size-6 rounded-full bg-muted" />
    </div>
  );
}

/** A believable backdrop with no toast in it: two stills, never the subject. */
export function AlbumBackdrop({ dense = false }: { dense?: boolean }) {
  const cols = dense ? "grid-cols-3" : "grid-cols-2";
  return (
    <div className={cn("grid gap-1 p-1", cols)}>
      {[SCENE_IMAGE, SCENE_IMAGE_2, SCENE_IMAGE, SCENE_IMAGE_2, SCENE_IMAGE, SCENE_IMAGE_2].map(
        (src, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- a lab fixture, never a real <Image>
          <img
            key={i}
            src={src}
            alt=""
            className="aspect-square w-full rounded-sm object-cover"
          />
        ),
      )}
    </div>
  );
}

/* ── The rule this board opens on: if the control can show it, no toast ──── */

/** Today: `copy-share-link.tsx`, unmodified and live - press it. It flips its
 *  own icon AND fires a toast, which is the redundancy the board's first line
 *  names ("`CopyShareLink` flips its icon and toasts today"). */
export { CopyShareLink } from "@/components/app/copy-share-link";

/** The rule applied: the same button, the icon its only word. A local twin,
 *  never an edit of the real file (outside this lane's `owns`), so the
 *  contrast is honest about which half is shipped and which is proposed. */
export function CopyShareLinkRedesigned({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // The control cannot show a clipboard failure by flipping state (there is
      // nothing to flip TO), so this is the one case the halving rule spares:
      // a toast is the only messenger left. The real, global Toaster (mounted
      // in `layout.tsx` on every route, this lab page included) draws it.
      toast.error(COPY_FAILED);
    }
  }
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <div className="flex gap-2">
      <div className="flex h-9 flex-1 items-center rounded-md border border-input bg-transparent px-3 text-xs text-muted-foreground">
        partyreel.com/e/9k2f…
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy share link"
        className="flex size-9 items-center justify-center rounded-md border border-input text-sm transition-colors hover:bg-accent"
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}

export const RULE_COPY_URL = "https://partyreel.com/e/9k2f7q";
