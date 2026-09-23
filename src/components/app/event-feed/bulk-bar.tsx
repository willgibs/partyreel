"use client";

import { useSyncExternalStore } from "react";
import { X, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  TooltipSlide,
  TooltipSlideGroup,
} from "@/components/shared/tooltip-slide";
import { cn } from "@/lib/utils";

/**
 * THE ONE BULK BAR (`app-vocabulary` r1, `bulk-toolbar=icon`): `ReviewActions`
 * and `GalleryBulkBar`'s shared select-mode cluster — All/Clear · the count ·
 * one icon per verb · Cancel — authored once and parameterized by an
 * `actions` prop, so a future bulk bar (a third surface, a fifth verb) is a
 * new array, never a new component. His three notes, in order:
 *
 *   1. Icons, both bars. "The note about every action on a photograph living
 *      in the lightbox was mobile only. Desktop should still support hover on
 *      cards." Desktop's hover-reveal tile chips are untouched (glass-wiring's
 *      file); this is the SELECT-mode cluster alone.
 *   2. "Tooltip should appear immediately on hover rather than delayed" — the
 *      root `TooltipProvider` is 0 now (providers.tsx); this bar additionally
 *      wraps its own with `skipDelayDuration=600`, wider than the site's 300,
 *      so scanning across several icons in one pass never re-waits even
 *      between them.
 *   3. The side-by-side tooltip (`shared/tooltip-slide.tsx`): moving across
 *      the row slides the label between neighbours instead of swapping it.
 *
 * ★ MOUNTED BEHIND A HYDRATED FLAG. This bar lives inside surfaces the
 * server renders on first paint (the Review room's header, the Gallery's
 * select-mode row) — NOT behind a client-only dynamic import like the
 * lightbox — and `architecture.md`'s own incident is exactly this shape:
 * wrapping ~50 SSR'd tile actions in radix Tooltips silently broke host-page
 * hydration in prod. So the FIRST paint (server and the client's hydrating
 * render, which must match it) never mounts a radix Tooltip at all: every
 * icon carries a plain native `title` until one tick after mount, then swaps
 * to the sliding tooltip. The swap is a later, ordinary re-render — never the
 * hydration pass itself — so it cannot repeat that regression.
 */

export type BulkBarActionColor =
  | "reel"
  | "like"
  | "warning"
  | "save"
  | "destructive";

const COLOR_CLASS: Record<BulkBarActionColor, string> = {
  reel: "text-reel",
  like: "text-like",
  warning: "text-warning",
  save: "text-save",
  destructive: "text-destructive",
};

export type BulkBarAction = {
  /** Stable across renders — the tooltip-slide group keys on array order,
   *  React keys on this. */
  id: string;
  /** Both the accessible name and the tooltip's text. */
  label: string;
  icon: LucideIcon;
  color?: BulkBarActionColor;
  disabled?: boolean;
  onRun: () => void;
  /** Delete's shape: a named confirm dialog instead of running at once.
   *  Confirming calls onRun; the dialog closes either way. */
  confirm?: {
    title: React.ReactNode;
    description: React.ReactNode;
    confirmLabel: React.ReactNode;
    cancelLabel?: React.ReactNode;
  };
};

// True once mounted on the client, false on the server and on the client's
// FIRST (hydrating) render — the same useSyncExternalStore shape
// use-prefers-reduced-motion.ts uses for the identical reason: a setState
// call inside a useEffect is a cascading extra render
// (react-hooks/set-state-in-effect) and, worse, happens too late anyway —
// what matters here is that the HYDRATING render matches the server's, which
// a subscription-based read guarantees and an effect-driven one does not
// (an effect fires AFTER the hydrating render commits, but so does this;
// the difference is this never schedules a synchronous setState, so React
// never treats it as a render this component CAUSED). The subscribe
// function is a no-op: hydrated only ever goes false -> true, once, so
// there is nothing to notify a second time.
function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

// The house press feedback for an icon-only control over a photograph's own
// chrome (host-media-grid.tsx's tile overlay, like-button.tsx, the lightbox's
// pill — bible 12): a stronger 10% squish than the shared <Button>'s own 3%,
// so it needs `!` to win against Button's baked-in active:not-aria-[haspopup]
// rule (a plain class of the same specificity loses to that :not() selector).
const ICON_BUTTON = cn(
  "flex size-7 items-center justify-center rounded-[calc(var(--radius-action)*0.7)] outline-none",
  "transition-[color,background-color,transform] duration-150 ease-emphasis",
  "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
  "active:scale-90! motion-reduce:active:scale-100!",
  "disabled:pointer-events-none disabled:opacity-50",
);

/**
 * The one icon button, everywhere in the bar. It is the `asChild` TARGET of
 * both `TooltipSlide` and (Delete's shape) `DialogTrigger`, and each layer's
 * `asChild` clone MERGES its own props (a `ref`, `onClick`, `aria-expanded`,
 * the pointer/focus handlers a tooltip tracks hover with) onto whatever it
 * wraps. ★ A component that does not SPREAD those merged props onto its real
 * `<button>` silently swallows them — the click that should open Delete's
 * dialog, the ref the tooltip positions itself from — with no error, which is
 * exactly the failure mode an intermediate wrapper component invites and a
 * bare host element never has. `onRun` (this glyph's own verb, a DIFFERENT
 * name from the native `onClick` on purpose) and any `onClick` a wrapper
 * injects both run — composed, never one replacing the other — so Delete's
 * shape (no `onRun`, `DialogTrigger`'s injected `onClick` opens it) and the
 * plain verbs (an `onRun`, no wrapper to inject anything) are the same
 * component with nothing to special-case.
 */
function GlyphButton({
  icon: Icon,
  label,
  color,
  onRun,
  interactive,
  className,
  onClick,
  ...rest
}: {
  icon: LucideIcon;
  label: string;
  color?: BulkBarActionColor;
  /** This glyph's own verb. Omitted for Delete's shape, whose click instead
   *  comes from the `DialogTrigger` wrapping it. */
  onRun?: () => void;
  interactive: boolean;
} & React.ComponentPropsWithRef<"button">) {
  return (
    <button
      type="button"
      aria-label={label}
      title={interactive ? undefined : label}
      onClick={(event) => {
        onRun?.();
        onClick?.(event);
      }}
      className={cn(ICON_BUTTON, color && COLOR_CLASS[color], className)}
      {...rest}
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}

function BulkBarActionButton({
  action,
  index,
  interactive,
}: {
  action: BulkBarAction;
  index: number;
  interactive: boolean;
}) {
  const glyph = action.confirm ? (
    <GlyphButton
      icon={action.icon}
      label={action.label}
      color={action.color}
      disabled={action.disabled}
      interactive={interactive}
    />
  ) : (
    <GlyphButton
      icon={action.icon}
      label={action.label}
      color={action.color}
      disabled={action.disabled}
      onRun={action.onRun}
      interactive={interactive}
    />
  );

  if (!action.confirm) {
    return interactive ? (
      <TooltipSlide index={index} label={action.label}>
        {glyph}
      </TooltipSlide>
    ) : (
      glyph
    );
  }

  // Delete's tooltip nests its dialog trigger, exactly as the lightbox does
  // (media-lightbox.tsx: <Dialog><ActionTooltip><DialogTrigger asChild>).
  const trigger = <DialogTrigger asChild>{glyph}</DialogTrigger>;
  return (
    <Dialog>
      {interactive ? (
        <TooltipSlide index={index} label={action.label}>
          {trigger}
        </TooltipSlide>
      ) : (
        trigger
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{action.confirm.title}</DialogTitle>
          <DialogDescription>{action.confirm.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">
              {action.confirm.cancelLabel ?? "Cancel"}
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="destructive" onClick={action.onRun}>
              {action.confirm.confirmLabel}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BulkBar({
  count,
  allSelected,
  busy,
  onSelectAll,
  onCancel,
  actions,
}: {
  count: number;
  allSelected: boolean;
  busy?: boolean;
  onSelectAll: () => void;
  onCancel: () => void;
  actions: BulkBarAction[];
}) {
  const hydrated = useHydrated();

  const row = (
    <div className="flex items-center gap-1 sm:gap-1.5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={busy}
        onClick={onSelectAll}
      >
        {allSelected ? "Clear" : "All"}
      </Button>
      <span className="px-0.5 text-xs tabular-nums text-muted-foreground">
        {count}
      </span>
      {actions.map((action, i) => (
        <BulkBarActionButton
          key={action.id}
          action={action}
          index={i}
          interactive={hydrated}
        />
      ))}
      {hydrated ? (
        <TooltipSlide index={actions.length} label="Cancel selection">
          <GlyphButton
            icon={X}
            label="Cancel selection"
            disabled={busy}
            onRun={onCancel}
            interactive
          />
        </TooltipSlide>
      ) : (
        <GlyphButton
          icon={X}
          label="Cancel selection"
          disabled={busy}
          onRun={onCancel}
          interactive={false}
        />
      )}
    </div>
  );

  if (!hydrated) return row;

  return (
    <TooltipProvider delayDuration={0} skipDelayDuration={600}>
      <TooltipSlideGroup>{row}</TooltipSlideGroup>
    </TooltipProvider>
  );
}
