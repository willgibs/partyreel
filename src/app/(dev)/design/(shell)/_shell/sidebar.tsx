"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

import { setLabPref, useLabPrefs } from "@/components/dev/board/lab-prefs";
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
 * sections and items from the nav, with prefix matching so a nested page
 * lights its item (a component permalink lights its family, a rule its
 * group), sections that hold the active item open, the others as declared, a
 * local filter over label, note, id and keywords, and the badges the nav
 * carries as data. Below `lg` it is the panel the top bar's menu opens.
 */
export function Sidebar({
  open,
  onNavigate,
}: {
  open: boolean;
  onNavigate: () => void;
}) {
  const nav = useNav();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [manual, setManual] = useState<Record<string, boolean>>({});
  const { editorRoot } = useLabPrefs();

  const areaId = areaOf(pathname);
  const filtered = useMemo(() => filterNav(nav, query), [nav, query]);
  const area: NavArea | undefined = filtered.find((a) => a.id === areaId);
  const hit = activeItem(nav, pathname);
  const filtering = query.trim().length > 0;

  const isOpen = (s: NavSection) => {
    if (filtering) return true;
    if (manual[s.id] !== undefined) return manual[s.id];
    if (hit && hit.section.id === s.id) return true;
    return !s.collapsed;
  };

  return (
    <aside
      id="lab-sidebar"
      className={cn(
        "lab-sidebar border-border bg-background lg:border-r",
        open ? "block border-b" : "hidden lg:block",
      )}
    >
      <div className="flex h-full flex-col">
        <div role="search" className="shrink-0 px-3 pt-3 pb-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Filter the ${areaId}`}
              aria-label={`Filter the ${areaId}`}
              className="h-8 w-full rounded-md border border-border bg-card pr-2 pl-8 text-[13px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>
        </div>
        <nav
          aria-label={area?.label ?? "Sections"}
          className="min-h-0 flex-1 overflow-y-auto px-2 pb-4"
        >
          {!area || area.sections.length === 0 ? (
            <p
              role="status"
              className="px-3 py-6 text-center text-[13px] text-muted-foreground"
            >
              Nothing matches &ldquo;{query}&rdquo;.
            </p>
          ) : (
            area.sections.map((s) => {
              const expanded = isOpen(s);
              return (
                <section key={s.id} className="pt-3 first:pt-1">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() =>
                      setManual((m) => ({ ...m, [s.id]: !expanded }))
                    }
                    className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-1 text-left text-[11px] font-semibold tracking-wider text-foreground/80 uppercase hover:bg-muted/60"
                  >
                    <span>{s.label}</span>
                    <span className="flex items-center gap-1 text-[10px] font-normal tracking-normal text-muted-foreground normal-case">
                      {s.items.length}
                      <ChevronDown
                        className={cn(
                          "size-3 transition-transform",
                          !expanded && "-rotate-90",
                        )}
                      />
                    </span>
                  </button>
                  {expanded && (
                    <ul className="mt-0.5">
                      {s.items.map((it) => (
                        <Row
                          key={it.href}
                          item={it}
                          active={hit?.item.href === it.href}
                          onNavigate={onNavigate}
                        />
                      ))}
                    </ul>
                  )}
                </section>
              );
            })
          )}
        </nav>
        <div className="shrink-0 border-t border-border px-3 py-2 pl-12 lg:pl-3">
          <label className="block">
            <span className="text-[10px] text-muted-foreground">
              Editor root (empty: source links go to GitHub)
            </span>
            <input
              type="text"
              value={editorRoot}
              onChange={(e) => setLabPref("editorRoot", e.target.value)}
              placeholder="/Users/you/partyreel"
              spellCheck={false}
              className="mt-1 h-7 w-full rounded-md border border-border bg-card px-2 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </label>
        </div>
      </div>
    </aside>
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
    <li>
      <LabLink
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        title={item.note}
        className={cn(
          "flex items-center gap-2 rounded-md py-1.5 pr-2 pl-3 text-[13px] transition-colors",
          active
            ? "bg-muted font-medium text-foreground"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
      >
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {item.badge && <Tag badge={item.badge} />}
      </LabLink>
    </li>
  );
}
