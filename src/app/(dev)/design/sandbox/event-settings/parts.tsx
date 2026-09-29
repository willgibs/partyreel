"use client";

import { type ReactNode } from "react";
import {
  ChevronRight,
  Lock,
  type LucideIcon,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { HOLD_STEPS_SEC } from "@/lib/reel/defaults";
import {
  resolveTheme,
  THEME_IDS,
  THEME_LABELS,
  type ThemeId,
} from "@/lib/reel/engine/themes";
import { cn } from "@/lib/utils";

import { LOOK_STILL } from "./fixtures";

/**
 * THE SETTINGS' FURNITURE, ONE IDIOM FOR EVERY NEW STRUCTURE: a group is one
 * card of rows split by hairlines (production's card surface and its ring), a
 * row is its name and one line on the left and its control on the right, and a
 * choice is production's own segmented material (`visibility-selector.tsx`'s
 * muted track and lifted segment), stood on end where its labels are long. So
 * the four new structures differ from each other only in how they are
 * ARRANGED, never in how a switch looks, and today's cards are quoted apart
 * (`today.tsx`).
 *
 * ★ EVERY SETTING MARKS ITSELF `data-set-setting`, and an idle one
 * `data-set-idle`, which is what the frames' captions count (`scene.tsx`).
 *
 * ★ NOTHING IS WIRED: every control is still and `tabIndex={-1}`.
 */

/** How a setting that does nothing right now is drawn, when it is drawn at all. */
export type IdleDraw = "greyed" | "live";

/** One group of rows on the card surface. */
export function GroupCard({
  children,
  className,
  group,
}: {
  children: ReactNode;
  className?: string;
  /** What `holds` counts (`data-set-group`). */
  group?: string;
}) {
  return (
    <div
      data-set-group={group}
      className={cn(
        "divide-y divide-border overflow-hidden rounded-lg bg-card text-card-foreground ring-1 ring-foreground/10",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** The quiet shield `ConfirmSwitch` wears after a label: this one asks first. */
function Guarded() {
  return (
    <ShieldCheck
      aria-hidden
      className="ml-1.5 inline size-3.5 align-[-2px] text-muted-foreground"
    />
  );
}

/**
 * A SWITCH ROW: the setting's name, one line, its switch. `held` is another
 * choice holding it on (drawn on and still, the reason under it: the board's
 * `held-on` call). `idle` is the idle ask's two drawn answers: `greyed` dims it
 * and says what brings it back, `live` keeps it working with a note.
 */
export function SwitchRow({
  label,
  line,
  checked,
  guarded = false,
  held,
  idle,
  idleWhy,
  reach = false,
  className,
}: {
  label: string;
  line?: ReactNode;
  checked: boolean;
  guarded?: boolean;
  held?: string | null;
  idle?: IdleDraw;
  /** Greyed: what brings it back. Live: when it applies. */
  idleWhy?: string;
  reach?: boolean;
  className?: string;
}) {
  const greyed = idle === "greyed";
  return (
    <div
      data-set-setting=""
      data-set-idle={idle ? "" : undefined}
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-3",
        className,
      )}
    >
      <div className={cn("min-w-0 space-y-0.5", greyed && "opacity-50")}>
        <p className="text-sm font-medium">
          {label}
          {guarded && <Guarded />}
        </p>
        {line ? (
          <p className="text-caption text-pretty text-muted-foreground">
            {line}
          </p>
        ) : null}
        {held || (idle && idleWhy) ? (
          <p className="text-caption text-pretty text-muted-foreground">
            {held ?? idleWhy}
          </p>
        ) : null}
      </div>
      <span data-set-reach={reach ? "" : undefined} className="flex shrink-0">
        <Switch
          checked={checked}
          disabled={Boolean(held) || greyed}
          tabIndex={-1}
        />
      </span>
    </div>
  );
}

/** A row whose control sits under its name (a field, the swatches, the steps). */
export function StackRow({
  label,
  line,
  idle,
  idleWhy,
  children,
  className,
}: {
  /** Left out where the group's own title already asks it (the ladder). */
  label?: string;
  line?: ReactNode;
  idle?: IdleDraw;
  idleWhy?: string;
  children: ReactNode;
  className?: string;
}) {
  const greyed = idle === "greyed";
  return (
    <div
      data-set-setting=""
      data-set-idle={idle ? "" : undefined}
      className={cn("space-y-2.5 px-4 py-3", className)}
    >
      <div className={cn("space-y-0.5", greyed && "opacity-50")}>
        {label ? <p className="text-sm font-medium">{label}</p> : null}
        {line ? (
          <p className="text-caption text-pretty text-muted-foreground">
            {line}
          </p>
        ) : null}
        {idle && idleWhy ? (
          <p className="text-caption text-pretty text-muted-foreground">
            {idleWhy}
          </p>
        ) : null}
      </div>
      <div className={cn(greyed && "pointer-events-none opacity-40")}>
        {children}
      </div>
    </div>
  );
}

/**
 * A FIELD, STILL: production's own `Input` and `Textarea`, read-only and out of
 * the tab order, so the frame answers their `md:text-sm` at its real width the
 * way the settings form does.
 */
export function Field({
  value,
  tall = false,
  type,
}: {
  value: string;
  tall?: boolean;
  type?: "date";
}) {
  if (tall) return <Textarea readOnly tabIndex={-1} rows={2} value={value} />;
  return <Input readOnly tabIndex={-1} type={type} value={value} />;
}

/** `uploads-section.tsx`'s native select, still, on production's classes. */
export function SelectQuote({ value }: { value: string }) {
  return (
    <select
      tabIndex={-1}
      defaultValue={value}
      className="h-8 w-full min-w-0 cursor-pointer rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none md:text-sm dark:bg-input/30"
    >
      <option value={value}>{value}</option>
    </select>
  );
}

/**
 * A CHOICE IN PRODUCTION'S OWN MATERIAL (`visibility-selector.tsx`): the muted
 * track and the lifted segment, across when its labels are short and stood on
 * end when they are not (four labels this long do not fit 28rem across,
 * event-safety's first-draft finding).
 */
export function Choice<T extends string>({
  options,
  value,
  across = false,
  reach,
}: {
  options: readonly { id: T; label: string; Icon?: LucideIcon }[];
  value: T;
  across?: boolean;
  /** The option the host is about to press (the frame's reach). */
  reach?: T;
}) {
  return (
    <div
      data-set-control=""
      className={cn(
        "gap-1 rounded-lg bg-muted p-1",
        across ? "grid auto-cols-fr grid-flow-col" : "flex flex-col",
      )}
    >
      {options.map(({ id, label, Icon }) => (
        <span
          key={id}
          data-state={id === value ? "on" : "off"}
          data-set-reach={reach === id ? "" : undefined}
          className={cn(
            "flex min-w-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground",
            across && "justify-center gap-1.5 px-2",
            "data-[state=on]:bg-background data-[state=on]:text-foreground",
          )}
        >
          {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden /> : null}
          <span className="truncate">{label}</span>
        </span>
      ))}
    </div>
  );
}

/** One look, shown (`highlight-reel-card.tsx`'s `MoodSwatch`, redrawn from the same engine grade). */
function Swatch({ id, on }: { id: ThemeId; on: boolean }) {
  const theme = resolveTheme(id);
  const paper = theme.backdrop === "paper" ? theme.signature?.paper : undefined;
  const inset = paper ? (theme.signature?.inset ?? 0.08) : 0;
  return (
    <span className="flex min-w-0 flex-col items-center gap-1">
      <span
        className={cn(
          "relative block aspect-video w-full overflow-hidden rounded-[var(--radius-tile)] ring-offset-2 ring-offset-card",
          on && "ring-2 ring-foreground",
        )}
        style={{
          background: paper ?? theme.background,
          padding: inset ? `${inset * 100}%` : undefined,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- a local still standing in for the event's own photo */}
        <img
          src={LOOK_STILL}
          alt=""
          className="size-full object-cover"
          style={{ filter: theme.grade }}
        />
      </span>
      <span
        className={cn(
          "w-full truncate text-center text-xs text-muted-foreground",
          on && "font-medium text-foreground",
        )}
      >
        {THEME_LABELS[id]}
      </span>
    </span>
  );
}

/** The reel's eight looks, four across (the card's own grid). */
export function Looks({ value }: { value: ThemeId }) {
  return (
    <div data-set-control="" className="grid grid-cols-4 gap-2">
      {THEME_IDS.map((id) => (
        <Swatch key={id} id={id} on={id === value} />
      ))}
    </div>
  );
}

/** The hold's steps, as the card's own segmented row. */
export function HoldSteps({ value }: { value: number }) {
  return (
    <div data-set-control="" className="flex rounded-lg bg-muted p-0.5">
      {HOLD_STEPS_SEC.map((step) => (
        <span
          key={step}
          data-state={step === value ? "on" : "off"}
          className="flex h-7 flex-1 items-center justify-center rounded-md text-xs text-muted-foreground tabular-nums data-[state=on]:bg-background data-[state=on]:font-medium data-[state=on]:text-foreground data-[state=on]:shadow-lift"
        >
          {step}
        </span>
      ))}
    </div>
  );
}

/**
 * A ROW THAT OPENS ITS GROUP (the summary's): its glyph on a quiet tile, its
 * name, the one sentence of where things stand, and the chevron. `open` is the
 * in-place answer, the row drawn opened with its settings under it.
 */
export function NavRow({
  Icon,
  title,
  sentence,
  open = false,
  reach = false,
  children,
}: {
  Icon: LucideIcon;
  title: string;
  sentence: string;
  open?: boolean;
  reach?: boolean;
  children?: ReactNode;
}) {
  return (
    <div data-set-row="">
      <div
        data-set-reach={reach ? "" : undefined}
        className={cn("flex items-center gap-3 px-4 py-3", open && "pb-2")}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{title}</span>
          <span className="block text-caption text-pretty text-muted-foreground">
            {sentence}
          </span>
        </span>
        <ChevronRight
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-muted-foreground",
            open && "rotate-90",
          )}
        />
      </div>
      {open ? <div className="pb-1">{children}</div> : null}
    </div>
  );
}

/**
 * DELETE, AS A QUIET ROW AT THE FOOT (the board's `delete` call): the red of
 * the destructive button, its own card, and a line saying what it does; it
 * still opens today's centred confirm (`confirm=dialog`), which is not drawn.
 */
export function DeleteRow({ line = true }: { line?: boolean }) {
  return (
    <div className="space-y-1.5">
      <GroupCard>
        <span className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-destructive">
          <Trash2 className="size-4" aria-hidden />
          Delete event
        </span>
      </GroupCard>
      {line ? (
        <p className="px-1 text-caption text-muted-foreground">
          It moves to Deleted, where you can restore it for 30 days.
        </p>
      ) : null}
    </div>
  );
}

/**
 * TODAY'S LOCK CHIP, QUOTED (`pricing/lock-chip.tsx`): a button naming the
 * control and the plan that opens it. The real one is a Tooltip over a
 * PricingSheet, both portals, so its classes are drawn here.
 */
export function LockChipQuote({
  name,
  reach = false,
}: {
  name: string;
  reach?: boolean;
}) {
  return (
    <span
      data-set-reach={reach ? "" : undefined}
      className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-action-sm border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground"
    >
      <Lock className="size-3" aria-hidden />
      {name}
      <span className="text-faint">Pro</span>
    </span>
  );
}

/** A page's own note under its groups: how it saves (the board's `saves` call). */
export function SavesNote() {
  return (
    <p className="px-1 text-caption text-muted-foreground">
      Changes save as you make them.
    </p>
  );
}
