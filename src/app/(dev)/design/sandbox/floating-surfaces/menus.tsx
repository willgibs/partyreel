"use client";

import {
  CornerDownLeft,
  Download,
  Eye,
  Globe,
  LifeBuoy,
  Link2,
  Lock,
  LogOut,
  MailCheck,
  Monitor,
  Moon,
  Play,
  QrCode,
  Search,
  Settings,
  Sun,
  Trash2,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import type { Direction } from "./directions";

/**
 * THE DIRECTIONS AS WORKING COMPONENTS (round four, 2026-09-15).
 *
 * A direction's material, radius and motion are a paste (directions.ts). Its
 * ANATOMY and its MODEL cannot be: no CSS block adds a header rail, an icon
 * rail or a search field, and none can delete a submenu. So the anatomy lives
 * here, composed on the real primitives, and every one of these is a working
 * menu (keyboard, focus, dismissal, the real portal) rather than a picture of
 * one. A ruling for `card` or `command` is a change to
 * `src/components/ui/dropdown-menu.tsx` that the wiring round lands; this file
 * is the shape of that change, standing up.
 *
 * Nothing under `src/components/ui/` is edited. Where a direction needs markup
 * the primitive has no slot for, it is composed from the outside.
 */

export type MenuRow = {
  id: string;
  label: string;
  icon: LucideIcon;
  /** The trailing column: a value, a state, a count. */
  meta?: string;
  variant?: "destructive";
  /** A nested branch. `card` and `glass` open it as a submenu; `command`
   *  deletes it and flattens the rows into a group of their own, which IS the
   *  argument of that direction. */
  sub?: { label: string; rows: MenuRow[] };
};

export type MenuModel = {
  /** The subject of the menu, which only the card direction draws. */
  title: string;
  meta?: string;
  groups: { label: string; rows: MenuRow[] }[];
  /** The rows that sit under a rule of their own. */
  footer?: MenuRow[];
  /** What the command direction's field says before you type. */
  placeholder: string;
};

export const EVENT_MENU: MenuModel = {
  title: "Ana and Theo",
  meta: "218 photos",
  placeholder: "Search this event",
  groups: [
    {
      label: "Share",
      rows: [
        { id: "link", label: "Copy the guest link", icon: Link2 },
        { id: "qr", label: "Show the QR code", icon: QrCode },
      ],
    },
    {
      label: "The album",
      rows: [
        {
          id: "download",
          label: "Download everything",
          icon: Download,
          meta: "1.2 GB",
        },
        { id: "reel", label: "Slideshow settings", icon: Play },
        {
          id: "who",
          label: "Who can upload",
          icon: Eye,
          meta: "Anyone",
          sub: {
            label: "Who can upload",
            rows: [
              { id: "anyone", label: "Anyone with the link", icon: Globe },
              {
                id: "verified",
                label: "Guests who verify an email",
                icon: MailCheck,
              },
              { id: "nobody", label: "Nobody, uploads are closed", icon: Lock },
            ],
          },
        },
      ],
    },
  ],
  footer: [
    { id: "delete", label: "Delete the event", icon: Trash2, variant: "destructive" },
  ],
};

export const ACCOUNT_MENU: MenuModel = {
  title: "Will Gibson",
  meta: "will@partyreel.com",
  placeholder: "Search your account",
  groups: [
    {
      label: "Account",
      rows: [
        { id: "events", label: "Your events", icon: User, meta: "4" },
        { id: "billing", label: "Plan and billing", icon: Users, meta: "Pro" },
      ],
    },
    {
      label: "Partyreel",
      rows: [
        {
          id: "appearance",
          label: "Appearance",
          icon: Settings,
          meta: "System",
          sub: {
            label: "Appearance",
            rows: [
              { id: "light", label: "Light", icon: Sun },
              { id: "dark", label: "Dark", icon: Moon },
              { id: "system", label: "System", icon: Monitor },
            ],
          },
        },
        { id: "help", label: "Help and guides", icon: LifeBuoy },
      ],
    },
  ],
  footer: [{ id: "signout", label: "Sign out", icon: LogOut }],
};

/* -- THE ROWS --------------------------------------------------------------
   Three anatomies, one row component, because the difference between the
   directions IS the row: today's is an icon and a label in a flex line, the
   card's is a three-column grid with a rail and a trailing value, the glass
   one is a full-bleed line with the icon at 60 percent. */

function RowBody({
  row,
  direction,
}: {
  row: MenuRow;
  direction: Direction;
}) {
  const Icon = row.icon;
  if (direction === "card") {
    return (
      <span className="grid w-full grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-2">
        <Icon className="size-4 opacity-70" />
        <span className="truncate">{row.label}</span>
        {row.meta ? (
          <span className="text-xs text-muted-foreground tabular-nums">
            {row.meta}
          </span>
        ) : (
          <span />
        )}
      </span>
    );
  }
  if (direction === "glass") {
    return (
      <span className="flex w-full items-center gap-2.5">
        <Icon className="size-4 opacity-55" />
        <span className="truncate">{row.label}</span>
        {row.meta ? (
          <span className="ml-auto text-xs opacity-55">{row.meta}</span>
        ) : null}
      </span>
    );
  }
  return (
    <>
      <Icon />
      <span className="truncate">{row.label}</span>
      {row.meta ? (
        <span className="ml-auto text-xs text-muted-foreground">
          {row.meta}
        </span>
      ) : null}
    </>
  );
}

function Rows({
  rows,
  direction,
  subOpen,
}: {
  rows: MenuRow[];
  direction: Direction;
  /** Hold one submenu open so its entrance and its corner can be judged. */
  subOpen?: string;
}) {
  return (
    <>
      {rows.map((row) =>
        row.sub ? (
          <DropdownMenuSub key={row.id} open={subOpen === row.id}>
            <DropdownMenuSubTrigger
              className={cn(direction === "glass" && "px-2.5")}
            >
              <RowBody row={row} direction={direction} />
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent
              className={cn("flt-panel min-w-56", direction === "card" && "p-1")}
              sideOffset={6}
            >
              {direction === "card" ? (
                <DropdownMenuLabel className="px-1.5 pt-0.5 pb-1.5 text-[11px] tracking-wide uppercase opacity-70">
                  {row.sub.label}
                </DropdownMenuLabel>
              ) : null}
              <Rows rows={row.sub.rows} direction={direction} />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ) : (
          <DropdownMenuItem
            key={row.id}
            variant={row.variant}
            className={cn(direction === "glass" && "px-2.5")}
          >
            <RowBody row={row} direction={direction} />
          </DropdownMenuItem>
        ),
      )}
    </>
  );
}

/* -- THE PANEL -------------------------------------------------------------
   One component, four anatomies. `today` is the anatomy that ships: a single
   label, a flat list, a separator and the destructive row inline. */

export function MenuPanel({
  direction,
  model,
  open,
  triggerLabel,
  triggerIcon: TriggerIcon,
  align = "start",
  side = "bottom",
  width = 264,
  subOpen,
  phone = false,
}: {
  direction: Direction;
  model: MenuModel;
  open: boolean;
  triggerLabel: string;
  triggerIcon?: LucideIcon;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom";
  width?: number;
  subOpen?: string;
  phone?: boolean;
}) {
  if (direction === "command") {
    return (
      <CommandPanel
        model={model}
        open={open}
        triggerLabel={triggerLabel}
        triggerIcon={TriggerIcon}
        align={align}
        side={side}
        width={width}
        phone={phone}
      />
    );
  }

  const flat = model.groups.flatMap((g) => g.rows);

  return (
    <DropdownMenu open={open} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm">
          {TriggerIcon ? <TriggerIcon /> : null}
          {triggerLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className={cn(
          "flt-panel",
          direction === "card" && "p-0",
          direction === "glass" && "p-1.5",
        )}
        style={{ width }}
        align={align}
        side={side}
        sideOffset={6}
        avoidCollisions={false}
      >
        {direction === "card" ? (
          <>
            {/* THE HEADER ROW: what this menu is about. A menu with no subject
                makes the reader carry it, which on the event page means
                remembering which of four events the overflow belongs to. */}
            <div className="flex items-baseline justify-between gap-3 border-b border-border px-3 py-2">
              <p className="truncate text-sm font-semibold tracking-tight">
                {model.title}
              </p>
              {model.meta ? (
                <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {model.meta}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-0.5 p-1.5">
              {model.groups.map((g, i) => (
                <div key={g.label} className={cn(i > 0 && "mt-1.5")}>
                  <DropdownMenuLabel className="px-1.5 pb-1 text-[11px] tracking-wide uppercase opacity-70">
                    {g.label}
                  </DropdownMenuLabel>
                  <Rows rows={g.rows} direction={direction} subOpen={subOpen} />
                </div>
              ))}
            </div>
            {model.footer?.length ? (
              // THE FOOTER RAIL: the action that cannot be undone gets its own
              // ground, not just a separator. A destructive row one pixel from
              // "Download everything" is a menu that is asking for it.
              <div className="flex flex-col gap-0.5 border-t border-border bg-muted/40 p-1.5">
                <Rows rows={model.footer} direction={direction} />
              </div>
            ) : null}
          </>
        ) : direction === "glass" ? (
          <>
            {model.groups.map((g, i) => (
              <div key={g.label} className={cn(i > 0 && "mt-2")}>
                <DropdownMenuLabel className="px-2.5 pb-0.5 text-[11px] opacity-55">
                  {g.label}
                </DropdownMenuLabel>
                <Rows rows={g.rows} direction={direction} subOpen={subOpen} />
              </div>
            ))}
            {model.footer?.length ? (
              <div className="mt-2">
                <DropdownMenuSeparator />
                <Rows rows={model.footer} direction={direction} />
              </div>
            ) : null}
          </>
        ) : (
          <>
            {/* TODAY, as it ships: one label, a flat list, a separator, and the
                destructive row in the same column as everything else. */}
            <DropdownMenuLabel>{model.title}</DropdownMenuLabel>
            <Rows rows={flat} direction={direction} subOpen={subOpen} />
            {model.footer?.length ? (
              <>
                <DropdownMenuSeparator />
                <Rows rows={model.footer} direction={direction} />
              </>
            ) : null}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* -- THE COMMAND SURFACE ---------------------------------------------------
   The third direction, and the only one that is a MODEL rather than a look.
   There is no submenu: a branch is flattened into a group of its own, and the
   way to it is two letters rather than a hover and a wait. Real behaviour, not
   a picture of it: the field filters, the arrows move, Enter runs, Escape
   clears then closes.

   Built on the real Popover, so the portal, the dismissal and the positioning
   are the primitive's. The field is a plain input rather than ui/input.tsx: an
   Input carries a border, a height and a focus ring, which are exactly the
   three things a field that IS the panel's header must not have. */

type Flat = { row: MenuRow; group: string };

function flatten(model: MenuModel): Flat[] {
  const out: Flat[] = [];
  for (const g of model.groups) {
    for (const row of g.rows) {
      if (row.sub) {
        // The branch is deleted and its rows join the list under their own
        // name. This is the direction's whole argument, in four lines.
        for (const child of row.sub.rows) out.push({ row: child, group: row.sub.label });
      } else {
        out.push({ row, group: g.label });
      }
    }
  }
  for (const row of model.footer ?? []) out.push({ row, group: "Danger" });
  return out;
}

export function CommandBody({
  model,
  phone = false,
  autoFocus = false,
  initialQuery = "",
}: {
  model: MenuModel;
  phone?: boolean;
  autoFocus?: boolean;
  /** Seed the field, so a board can show the model doing the thing it claims:
   *  two letters standing in for a hover, a wait and a second panel. */
  initialQuery?: string;
}) {
  const all = useMemo(() => flatten(model), [model]);
  const [query, setQuery] = useState(initialQuery);
  const [active, setActive] = useState(0);
  const [ran, setRan] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (f) =>
        f.row.label.toLowerCase().includes(q) ||
        f.group.toLowerCase().includes(q),
    );
  }, [all, query]);

  // Keep the active row in view when the arrows walk past the fold.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (hits.length ? (i + 1) % hits.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (hits.length ? (i - 1 + hits.length) % hits.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = hits[active];
      if (hit) {
        setRan(hit.row.id);
        window.setTimeout(() => setRan(null), 900);
      }
    } else if (e.key === "Escape" && query) {
      // Escape clears the field before it closes the surface: a host who
      // mistyped should not lose the panel as well.
      e.stopPropagation();
      setQuery("");
      setActive(0);
    }
  };

  // The group headings are derived, not accumulated during the render: a
  // variable reassigned while rendering is a lie under a concurrent re-render
  // (and the lint rule that names it is right).
  const shown = hits.map((f, i) => ({
    ...f,
    head: i === 0 || hits[i - 1].group !== f.group,
  }));

  return (
    <div className="flex min-h-0 flex-col" onKeyDown={onKeyDown}>
      {/* THE FIELD IS THE HEADER. It sits on the panel's own ground with a rule
          under it, so the panel has one edge rather than a box inside a box. */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <Search className="size-4 shrink-0 opacity-50" />
        <input
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => {
            // The active row resets with the query in the SAME handler rather
            // than in an effect: a setState inside an effect that watches the
            // query costs a cascading render, and the reset belongs to the
            // keystroke that caused it.
            setQuery(e.target.value);
            setActive(0);
          }}
          placeholder={model.placeholder}
          aria-label={model.placeholder}
          className="w-full bg-transparent text-sm outline-hidden placeholder:text-muted-foreground"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActive(0);
            }}
            className="shrink-0 text-xs text-muted-foreground transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-foreground"
          >
            Clear
          </button>
        ) : null}
      </div>

      <div
        ref={listRef}
        role="listbox"
        aria-label={model.title}
        className={cn(
          "flex min-h-0 flex-col gap-0.5 overflow-y-auto p-1.5",
          phone ? "max-h-none" : "max-h-72",
        )}
      >
        {hits.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            Nothing here matches that. Try a shorter word.
          </p>
        ) : null}
        {shown.map((f, i) => {
          const Icon = f.row.icon;
          const head = f.head;
          const isActive = i === active;
          return (
            <div key={`${f.group}-${f.row.id}`}>
              {head ? (
                <p
                  className={cn(
                    "px-2 pb-1 text-[11px] tracking-wide text-muted-foreground uppercase",
                    i > 0 && "pt-2",
                  )}
                >
                  {f.group}
                </p>
              ) : null}
              <button
                type="button"
                role="option"
                aria-selected={isActive}
                data-active={isActive}
                onMouseEnter={() => setActive(i)}
                onClick={() => {
                  setRan(f.row.id);
                  window.setTimeout(() => setRan(null), 900);
                }}
                style={{ borderRadius: "var(--flt-r-item, var(--radius-md))" }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-2 text-left text-sm transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                  phone ? "py-2.5" : "py-1.5",
                  isActive && "bg-accent text-accent-foreground",
                  f.row.variant === "destructive" && "text-destructive",
                )}
              >
                <Icon className="size-4 shrink-0 opacity-70" />
                <span className="truncate">{f.row.label}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {ran === f.row.id ? "Done" : (f.row.meta ?? "")}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* THE HINT RAIL. The model moves discoverability from the tree to the
          field, so the panel has to say what the keys do or it has moved it
          nowhere. */}
      {phone ? null : (
        <div className="flex items-center gap-3 border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Kbd>up</Kbd>
            <Kbd>down</Kbd> to move
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd>
              <CornerDownLeft className="size-3" />
            </Kbd>{" "}
            to run
          </span>
          <span className="ml-auto inline-flex items-center gap-1">
            <Kbd>esc</Kbd> to close
          </span>
        </div>
      )}
    </div>
  );
}

/** A keycap. The body face at a small size on a muted plate: the kill-mono
 *  sweep left one label face and one body face, and a keycap is a value that
 *  must look like a value, which is what the plate is for. */
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-[4px] bg-muted px-1 text-[10px] leading-none font-medium text-foreground/70">
      {children}
    </span>
  );
}

function CommandPanel({
  model,
  open,
  triggerLabel,
  triggerIcon: TriggerIcon,
  align,
  side,
  width,
  phone,
}: {
  model: MenuModel;
  open: boolean;
  triggerLabel: string;
  triggerIcon?: LucideIcon;
  align: "start" | "center" | "end";
  side: "top" | "bottom";
  width: number;
  phone: boolean;
}) {
  return (
    <Popover open={open} modal={false}>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="sm">
          {TriggerIcon ? <TriggerIcon /> : null}
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="flt-panel overflow-hidden p-0"
        style={{ width: Math.max(width, 300) }}
        align={align}
        side={side}
        sideOffset={6}
        avoidCollisions={false}
      >
        <CommandBody model={model} phone={phone} />
      </PopoverContent>
    </Popover>
  );
}

/* -- THE HEADER'S MEGA-MENU ------------------------------------------------
   The marketing nav panel, the one surface rule 15 was named for, in each
   direction. It is also where the command direction shows its own limit, which
   is why it is on the board: a search field over four marketing links is
   over-built, and the board says so instead of hiding it. */

export const FEATURE_LINKS: {
  id: string;
  label: string;
  line: string;
  icon: LucideIcon;
}[] = [
  {
    id: "qr",
    label: "One QR code",
    line: "One link carries the whole event.",
    icon: QrCode,
  },
  {
    id: "noapp",
    label: "No app, no account",
    line: "Guests upload from the camera roll.",
    icon: Users,
  },
  {
    id: "review",
    label: "The host reviews",
    line: "You decide what reaches the album.",
    icon: Eye,
  },
  {
    id: "reel",
    label: "The reel",
    line: "A film of the night, made for you.",
    icon: Play,
  },
];

export function HeaderPanelBody({ direction }: { direction: Direction }) {
  if (direction === "command") {
    return (
      <div style={{ width: 340 }}>
        <CommandBody
          model={{
            title: "Partyreel",
            placeholder: "Search the site",
            groups: [
              {
                label: "Features",
                rows: FEATURE_LINKS.map((f) => ({
                  id: f.id,
                  label: f.label,
                  icon: f.icon,
                })),
              },
              {
                label: "Pricing",
                rows: [
                  { id: "free", label: "What is free", icon: Globe },
                  { id: "pro", label: "What Pro adds", icon: Users },
                ],
              },
            ],
          }}
        />
      </div>
    );
  }
  if (direction === "glass") {
    return (
      <div className="grid grid-cols-2 gap-0.5 p-1.5" style={{ width: 460 }}>
        {FEATURE_LINKS.map((f) => (
          <a
            key={f.id}
            href="#"
            onClick={(e) => e.preventDefault()}
            className="flex items-start gap-2.5 px-2.5 py-2 transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-accent/60"
            style={{ borderRadius: "var(--flt-r-item, var(--radius-md))" }}
          >
            <f.icon className="mt-0.5 size-4 shrink-0 opacity-55" />
            <span className="min-w-0">
              <span className="block text-sm font-medium">{f.label}</span>
              <span className="block truncate text-xs opacity-60">
                {f.line}
              </span>
            </span>
          </a>
        ))}
      </div>
    );
  }
  if (direction === "card") {
    return (
      <div style={{ width: 480 }}>
        <div className="flex items-baseline justify-between border-b border-border px-3 py-2">
          <p className="text-sm font-semibold tracking-tight">Features</p>
          <p className="text-xs text-muted-foreground">Everything a host gets</p>
        </div>
        <div className="grid grid-cols-2 gap-1 p-1.5">
          {FEATURE_LINKS.map((f) => (
            <a
              key={f.id}
              href="#"
              onClick={(e) => e.preventDefault()}
              className="grid grid-cols-[20px_minmax(0,1fr)] items-start gap-x-2 gap-y-0.5 px-2 py-2 transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-accent"
              style={{ borderRadius: "var(--flt-r-item, var(--radius-md))" }}
            >
              <f.icon className="mt-0.5 size-4 opacity-70" />
              <span className="text-sm font-medium">{f.label}</span>
              <span />
              <span className="text-xs text-muted-foreground">{f.line}</span>
            </a>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-1 p-2" style={{ width: 420 }}>
      {FEATURE_LINKS.map((f) => (
        <a
          key={f.id}
          href="#"
          onClick={(e) => e.preventDefault()}
          className="rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
        >
          {f.label}
        </a>
      ))}
    </div>
  );
}
