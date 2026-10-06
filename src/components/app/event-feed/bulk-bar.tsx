"use client";

import { Fragment } from "react";
import { X, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popup,
  PopupClose,
  PopupContent,
  PopupFooter,
  PopupHeader,
  PopupTrigger,
} from "@/components/ui/popup";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  TooltipSlide,
  TooltipSlideGroup,
} from "@/components/shared/tooltip-slide";
import { formatCount } from "@/lib/format/count";
import { useHydrated } from "@/lib/shared/use-hydrated";
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

export type BulkBarActionColor = "like" | "warning" | "save" | "destructive";

const COLOR_CLASS: Record<BulkBarActionColor, string> = {
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

/**
 * ★ A THUMB'S FULL TARGET IN A HAND (crumbs-32, build 15's red-team: 28 by 28
 * there, Download 32px from Remove to Deleted): every control in the bar takes
 * the 44px the peek's verdicts take in a hand, and keeps a pointer's 28 at a
 * desk. The band the bar sits in holds the height its tools had at rest
 * (`FeedSectionHeader`: 28 where they fit one line, more where they wrap; a
 * header that grew or shrank as select mode opened bounced the album beneath
 * it), so in a hand a control is 44 wide and its target reaches 8px past its
 * box above and below (its own `::before`, part of it for every tap), to 44
 * tall with no pixel of layout moved. Exported so the test reads the rule from
 * here, never a copy.
 */
export const HAND_TARGET = cn(
  "relative max-sm:min-w-11",
  "max-sm:before:absolute max-sm:before:inset-x-0 max-sm:before:-inset-y-2",
);

/**
 * All / Clear is the shared `<Button>`, whose 1px transparent border insets
 * its `::before`'s box: 9px past that box is the same 8px past its edge
 * (measured at 375: 8px left it 42 tall).
 */
export const HAND_TARGET_BORDERED = cn(
  HAND_TARGET,
  "max-sm:before:-inset-y-[9px]",
);

// The house press feedback for an icon-only control over a photograph's own
// chrome (host-media-grid.tsx's tile overlay, like-button.tsx, the lightbox's
// pill — bible 5): a stronger 10% squish than the shared <Button>'s own 3%,
// so it needs `!` to win against Button's baked-in active:not-aria-[haspopup]
// rule (a plain class of the same specificity loses to that :not() selector).
const ICON_BUTTON = cn(
  "flex size-7 items-center justify-center rounded-[calc(var(--radius-action)*0.7)] outline-none",
  HAND_TARGET,
  "transition-[color,background-color,transform] duration-150 ease-emphasis",
  "hover:bg-muted focus-halo",
  "active:scale-90! motion-reduce:active:scale-100!",
  "disabled:pointer-events-none disabled:opacity-50",
);

/**
 * ★ THE DESTRUCTIVE VERB STANDS APART (crumbs-32): a hairline and a gap on
 * each side before it, so a thumb that misses Download lands on nothing, never
 * on a removal (the size list's Remove to Deleted runs at once, its Undo after).
 * The lightbox's own grouping rule (`Rule`), in the bar's muted ink.
 */
function Apart() {
  return (
    <span
      aria-hidden
      data-bulk-apart=""
      className="mx-1 h-5 w-px shrink-0 bg-border"
    />
  );
}

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
  // (media-lightbox.tsx: <Dialog><ActionTooltip><DialogTrigger asChild>). The
  // question is a CONFIRMATION (`popups` r1, `confirm=dialog`: "These are all
  // rarer destructive actions, so a focused confirmation over an undo is far
  // more helpful"), so it names its kind and the one table places it.
  const trigger = <PopupTrigger asChild>{glyph}</PopupTrigger>;
  return (
    <Popup>
      {interactive ? (
        <TooltipSlide index={index} label={action.label}>
          {trigger}
        </TooltipSlide>
      ) : (
        trigger
      )}
      <PopupContent kind="confirm">
        <PopupHeader
          title={action.confirm.title}
          description={action.confirm.description}
        />
        <PopupFooter>
          <PopupClose asChild>
            <Button variant="outline">
              {action.confirm.cancelLabel ?? "Cancel"}
            </Button>
          </PopupClose>
          <PopupClose asChild>
            <Button variant="destructive" onClick={action.onRun}>
              {action.confirm.confirmLabel}
            </Button>
          </PopupClose>
        </PopupFooter>
      </PopupContent>
    </Popup>
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
        className={HAND_TARGET_BORDERED}
      >
        {allSelected ? "Clear" : "All"}
      </Button>
      <span className="px-0.5 text-xs text-muted-foreground tabular-nums">
        {formatCount(count)}
      </span>
      {actions.map((action, i) => (
        <Fragment key={action.id}>
          {action.color === "destructive" && i > 0 ? <Apart /> : null}
          <BulkBarActionButton
            action={action}
            index={i}
            interactive={hydrated}
          />
        </Fragment>
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
