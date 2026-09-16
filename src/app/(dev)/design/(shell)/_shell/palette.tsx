"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CornerDownLeft, Search } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import {
  KIND_LABEL,
  type SearchEntry,
  searchLab,
} from "@/app/(dev)/design/_data/search";
import { LAB_SHORTCUTS } from "@/app/(dev)/design/_data/state";
import { useKeyed, usePalette, useSearchIndex } from "./shell-context";
import { Kbd } from "./kbd";

/**
 * THE COMMAND PALETTE (the Library x Lab round, 2026-09-15): ⌘K over the one
 * search index (_data/search.ts), which is the only place in the lab where a
 * rule, a landmine, a component, a board, a doc heading and a glossary term
 * are all reachable by the same four keystrokes.
 *
 * Motion by frequency: the palette is OCCASIONAL, so it takes the standard
 * 200ms fade + zoom the dialog already carries; the rows inside it are
 * high-frequency and change instantly (a highlight, no transition), because a
 * cursor that eases between rows while you hold the arrow key reads as lag.
 *
 * Arrow keys move, Home and End jump, Enter goes, Escape closes. The list is
 * one flat sequence across the groups, so holding Down walks the whole result
 * set rather than stopping at a heading.
 */
const START: { label: string; href: string; hint: string }[] = [
  { label: "The bible", href: "/design/library/rules", hint: "What binds you" },
  {
    label: "Every component",
    href: "/design/library",
    hint: "The index and its contracts",
  },
  { label: "The desk", href: "/design/lab", hint: "Every standing board" },
  {
    label: "Glossary",
    href: "/design/library/glossary",
    hint: "The words this app uses",
  },
];

export function Palette() {
  const { open, setOpen } = usePalette();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        aria-label="Search the library and the lab"
        className="top-[12vh] max-h-[76vh] w-full max-w-[calc(100%-1.5rem)] translate-y-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        {/* The body MOUNTS FRESH each time the dialog opens (radix renders no
            content while closed), so the query and the cursor start clean with
            no reset effect: a setState-in-effect here would cascade a render
            on every open. */}
        <Body onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function Body({ onClose }: { onClose: () => void }) {
  const index = useSearchIndex();
  const router = useRouter();
  const to = useKeyed();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  const groups = useMemo(() => searchLab(index, query), [index, query]);
  const rows: SearchEntry[] = useMemo(
    () => groups.flatMap((g) => g.entries),
    [groups],
  );
  const showStart = query.trim() === "";
  const count = showStart ? START.length : rows.length;

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [active, query]);

  const go = (href: string) => {
    onClose();
    router.push(to(href));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (count === 0) return;
    if (e.key === "ArrowDown" || (e.key === "n" && e.ctrlKey)) {
      e.preventDefault();
      setActive((i) => (i + 1) % count);
    } else if (e.key === "ArrowUp" || (e.key === "p" && e.ctrlKey)) {
      e.preventDefault();
      setActive((i) => (i - 1 + count) % count);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(count - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(showStart ? START[active].href : rows[active].href);
    }
  };

  let cursor = -1;

  return (
    // The whole panel is one keyboard surface (`display: contents`, so the
    // dialog's own grid still owns the rows): the arrows and Enter have to work
    // while the focus is in the field, which is where it always is.
    <div className="contents" onKeyDown={onKeyDown}>
      <DialogTitle className="sr-only">Search</DialogTitle>
      <DialogDescription className="sr-only">
        Every rule, component, board, policy, landmine, doc heading and glossary
        term in one index.
      </DialogDescription>
      <div className="flex items-center gap-2.5 border-b border-border px-3.5">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            // A new query always starts at the first hit. Done here, in the
            // one event that changes the result set, rather than in an effect
            // that would cascade a render behind every keystroke.
            setActive(0);
          }}
          placeholder="Search rules, components, boards, docs"
          aria-label="Search"
          // The field keeps the focus and the arrows move a cursor inside the
          // list, so a screen reader hears the highlighted row only through
          // `aria-activedescendant`; without it the list was silent and the
          // whole palette read as an empty text box (the sweep, 2026-09-16).
          role="combobox"
          aria-expanded
          aria-controls="lab-palette-results"
          aria-activedescendant={
            count > 0 ? `lab-palette-row-${active}` : undefined
          }
          className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {query && (
          <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
            {rows.length}
          </span>
        )}
      </div>

      <div
        ref={listRef}
        id="lab-palette-results"
        role="listbox"
        className="overflow-y-auto overscroll-contain px-1.5 py-1.5"
      >
        {showStart ? (
          <Group label="Start here">
            {START.map((s, i) => (
              <Row
                key={s.href}
                at={i}
                active={active === i}
                onHover={() => setActive(i)}
                onPick={() => go(s.href)}
                title={s.label}
                context={s.hint}
              />
            ))}
          </Group>
        ) : rows.length === 0 ? (
          <p className="px-3 py-10 text-center text-[13px] text-muted-foreground">
            Nothing matches &ldquo;{query.trim()}&rdquo;.
          </p>
        ) : (
          groups.map((g) => (
            <Group key={g.kind} label={KIND_LABEL[g.kind]}>
              {g.entries.map((entry) => {
                cursor += 1;
                const at = cursor;
                return (
                  <Row
                    key={entry.key}
                    at={at}
                    active={active === at}
                    onHover={() => setActive(at)}
                    onPick={() => go(entry.href)}
                    title={entry.title}
                    context={entry.context}
                    tail={entry.kind === "rule" ? entry.id : undefined}
                  />
                );
              })}
            </Group>
          ))
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border px-3.5 py-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Kbd>
            <CornerDownLeft className="size-3" />
          </Kbd>
          Open
        </span>
        <span className="flex items-center gap-1">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          Move
        </span>
        {LAB_SHORTCUTS.filter((s) => s.keys !== "⌘K").map((s) => (
          <span key={s.keys} className="hidden items-center gap-1 sm:flex">
            <Kbd>{s.keys}</Kbd>
            {s.does}
          </span>
        ))}
      </div>
    </div>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pt-2 first:pt-0">
      <p className="px-2.5 pt-1 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
      </p>
      <ul>{children}</ul>
    </div>
  );
}

function Row({
  at,
  active,
  onHover,
  onPick,
  title,
  context,
  tail,
}: {
  /** The row's place in the one flat sequence; the field points at it. */
  at: number;
  active: boolean;
  onHover: () => void;
  onPick: () => void;
  title: string;
  context?: string;
  tail?: string;
}) {
  return (
    <li>
      <button
        type="button"
        id={`lab-palette-row-${at}`}
        role="option"
        aria-selected={active}
        data-active={active}
        onMouseMove={onHover}
        onClick={onPick}
        // No transition: the cursor must keep up with a held arrow key.
        className={cn(
          "flex w-full items-baseline gap-2 rounded-md px-2.5 py-1.5 text-left",
          active ? "bg-muted text-foreground" : "text-foreground/90",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium">
            {title}
          </span>
          {context && (
            <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
              {context}
            </span>
          )}
        </span>
        {tail && (
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {tail}
          </span>
        )}
      </button>
    </li>
  );
}
