"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, PencilLine, Search } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { setLabPref, useLabPrefs } from "@/components/lab/lab-prefs";
import { cn } from "@/lib/utils";

import {
  activeItem,
  areaOf,
  filterNav,
  type NavArea,
  type NavItem,
  type NavSection,
} from "@/app/(dev)/design/_data/catalog";
import { LabLink, useNav } from "./shell-context";
import { Tag } from "./tag";

/**
 * THE SIDEBAR (the Library x Lab round, 2026-09-15): the active area's
 * sections and items, with prefix matching so a nested page lights its item (a
 * component permalink lights its family, a rule its group), sections that hold
 * the active item open, a local filter over label, note, id and keywords, and
 * the badges the nav carries as data.
 *
 * DENSITY AND MOTION. Navigation is the highest-frequency thing in the shell,
 * so its own feedback is instant: the active rail and the row tint have no
 * transition at all, and only a hovered row's colour eases (90ms). The one
 * thing that MOVES is a section opening, which is occasional and has to show
 * the reader where the new rows came from: 180ms on the emphasis curve, as a
 * `grid-template-rows` 0fr -> 1fr collapse (design.css `.lab-disclosure`),
 * which animates to the content's real height with no measurement and no
 * layout thrash. Reduced motion drops it to an instant toggle.
 *
 * A collapsed section stays MOUNTED (and `inert`, so its links leave the tab
 * order): the filter has to see every item, and re-mounting 38 rows on every
 * disclosure is the jank the animation was meant to avoid.
 *
 * Below `lg` the whole tree is a Sheet (ui/sheet.tsx) rather than a block that
 * pushes the page down: a phone has one column, and a nav that shoves the
 * content out of view when you open it is worse than no nav at all.
 */
export function Sidebar({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <>
      <aside
        id="lab-sidebar"
        className="lab-sidebar hidden border-border bg-background lg:block lg:border-r"
      >
        <Tree onNavigate={() => {}} />
      </aside>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[86vw] gap-0 p-0 sm:max-w-xs lg:hidden"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            The library and the lab, by section.
          </SheetDescription>
          <Tree onNavigate={() => onOpenChange(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}

function Tree({ onNavigate }: { onNavigate: () => void }) {
  const nav = useNav();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [manual, setManual] = useState<Record<string, boolean>>({});

  const areaId = areaOf(pathname);
  const filtered = useMemo(() => filterNav(nav, query), [nav, query]);
  const area: NavArea | undefined = filtered.find((a) => a.id === areaId);
  const hit = activeItem(nav, pathname);
  const filtering = query.trim().length > 0;
  const areaLabel = nav.find((a) => a.id === areaId)?.label ?? "Sections";

  // A section the reader opened by hand stays open; the rest follow the route,
  // so walking into a component permalink opens its family and nothing else.
  const isOpen = (s: NavSection) => {
    if (filtering) return true;
    if (manual[s.id] !== undefined) return manual[s.id];
    if (hit && hit.section.id === s.id) return true;
    return !s.collapsed;
  };

  const sections = nav.find((a) => a.id === areaId)?.sections ?? [];
  const shown = new Map(area?.sections.map((s) => [s.id, s]) ?? []);

  return (
    <div className="flex h-full flex-col">
      <div role="search" className="shrink-0 px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Filter ${areaLabel}`}
            aria-label={`Filter ${areaLabel}`}
            className="h-8 w-full rounded-md border border-border bg-card pr-2 pl-8 text-[13px] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </div>
      </div>
      <nav
        aria-label={areaLabel}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-4"
      >
        {filtering && shown.size === 0 ? (
          <p
            role="status"
            className="px-3 py-6 text-center text-[13px] text-muted-foreground"
          >
            Nothing matches &ldquo;{query.trim()}&rdquo;.
          </p>
        ) : (
          sections.map((declared) => {
            if (filtering && !shown.has(declared.id)) return null;
            const s = shown.get(declared.id) ?? declared;
            const expanded = isOpen(s);
            return (
              <SidebarSection
                key={s.id}
                section={s}
                expanded={expanded}
                onToggle={() => setManual((m) => ({ ...m, [s.id]: !expanded }))}
                activeHref={hit?.item.href}
                onNavigate={onNavigate}
              />
            );
          })
        )}
      </nav>
      <EditorRoot />
    </div>
  );
}

function SidebarSection({
  section,
  expanded,
  onToggle,
  activeHref,
  onNavigate,
}: {
  section: NavSection;
  expanded: boolean;
  onToggle: () => void;
  activeHref?: string;
  onNavigate: () => void;
}) {
  return (
    <section className="pt-3 first:pt-1">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={`lab-section-${section.id}`}
        onClick={onToggle}
        className="group flex w-full items-center gap-2 rounded-md px-2.5 py-1 text-left text-[11px] font-semibold tracking-[0.06em] text-foreground/75 uppercase transition-colors duration-90 hover:bg-muted/60 hover:text-foreground"
      >
        <ChevronDown
          className={cn(
            "lab-chevron size-3 shrink-0 text-muted-foreground",
            !expanded && "-rotate-90",
          )}
        />
        <span className="min-w-0 flex-1 truncate">{section.label}</span>
        <span className="shrink-0 text-[10px] font-normal tracking-normal text-muted-foreground tabular-nums opacity-0 transition-opacity duration-90 group-hover:opacity-100">
          {section.items.length}
        </span>
      </button>
      <div
        id={`lab-section-${section.id}`}
        className="lab-disclosure"
        data-open={expanded}
        inert={!expanded}
      >
        {/* No padding on the disclosure's own child: a grid item's padding
            survives `grid-template-rows: 0fr` and leaves a closed section
            taller than nothing. */}
        <ul className="min-h-0 overflow-hidden">
          {section.items.map((it) => (
            <Row
              key={it.href}
              item={it}
              active={activeHref === it.href}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

function Row({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <li className="relative">
      {/* The rail is the active mark: a 2px stem in the gutter, no transition,
          so the highlight lands the instant the route does. */}
      {active && (
        <span
          aria-hidden
          className="absolute top-1 bottom-1 left-0 w-0.5 rounded-full bg-foreground"
        />
      )}
      <LabLink
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        title={item.note}
        className={cn(
          "flex items-center gap-2 rounded-md py-1.5 pr-2 pl-3.5 text-[13px]",
          active
            ? "bg-muted font-medium text-foreground"
            : "text-muted-foreground transition-colors duration-90 hover:bg-muted/50 hover:text-foreground",
        )}
      >
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {item.badge && <Tag badge={item.badge} />}
      </LabLink>
    </li>
  );
}

/**
 * The reader's repo path, so a source reference opens in their editor from a
 * Vercel alias as well as from localhost. A disclosure, not a standing field:
 * it is set once and then never looked at again, and a text input parked at the
 * foot of the nav was reading as part of the navigation.
 */
function EditorRoot() {
  const { editorRoot } = useLabPrefs();
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div className="shrink-0 border-t border-border px-3 py-2 pl-12 lg:pl-3">
      {open ? (
        <label className="block">
          <span className="text-[10px] text-muted-foreground">
            Editor root (empty: source links go to GitHub)
          </span>
          <input
            ref={inputRef}
            type="text"
            value={editorRoot}
            onChange={(e) => setLabPref("editorRoot", e.target.value)}
            onBlur={() => setOpen(false)}
            onKeyDown={(e) => e.key === "Enter" && setOpen(false)}
            placeholder="/Users/you/partyreel"
            spellCheck={false}
            className="mt-1 h-7 w-full rounded-md border border-border bg-card px-2 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </label>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-1.5 rounded-md py-0.5 text-left text-[10px] text-muted-foreground transition-colors duration-90 hover:text-foreground"
        >
          <PencilLine className="size-3 shrink-0" />
          <span className="min-w-0 flex-1 truncate">
            {editorRoot || "Set an editor root"}
          </span>
        </button>
      )}
    </div>
  );
}
