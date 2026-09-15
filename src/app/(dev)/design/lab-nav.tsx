"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { FlaskConical, Menu, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { type LabZone, type Status, ZONES } from "./catalog";
import { withDesignKey } from "@/lib/design-gate/links";
import { ThemeToggle } from "./theme-toggle";

/**
 * THE WORKBENCH SIDEBAR. One persistent rail, driven entirely by catalog.ts, with
 * a deliberate three-tier hierarchy so organizers and items never blur (Will's
 * note): ZONES are bold dividers, GROUPS are quiet captions, and ITEMS are the
 * only clickable rows (a leading status dot marks them as navigable + records
 * their state). A live search filters the growing library; the theme toggle is
 * the lab's single theme control.
 *
 * The rail reads the gate key from the URL (useSearchParams - layouts can't see
 * searchParams) and themes in the REAL app tokens (no mono), so it matches the
 * shipped chrome and follows next-themes. Desktop: sticky rail. Mobile: a top bar
 * + a collapsible panel.
 */
export function LabNav() {
  const pathname = usePathname();
  const key = useSearchParams().get("key");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const to = (href: string) => withDesignKey(href, key);
  const active = (href: string) =>
    href === "/design" ? pathname === "/design" : pathname === href;
  const close = () => setOpen(false);

  // Filter the catalog by the search query; drop emptied groups + zones.
  const zones = useMemo(() => filterZones(ZONES, query), [query]);

  return (
    <div className="lab-nav bg-background text-foreground lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-r lg:border-border">
      {/* Mobile bar: title + collapse toggle. */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
        <Link
          href={to("/design")}
          onClick={close}
          className="flex items-center gap-2 text-sm font-semibold"
        >
          <FlaskConical className="size-4" />
          Design lab
        </Link>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="lab-nav-panel"
          aria-label={open ? "Close navigation" : "Open navigation"}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      <div
        id="lab-nav-panel"
        className={cn(
          "flex-col lg:flex lg:min-h-0 lg:flex-1",
          open ? "flex" : "hidden",
        )}
      >
        {/* Desktop header. */}
        <div className="hidden shrink-0 px-4 pt-5 lg:block">
          <Link
            href={to("/design")}
            className="flex items-center gap-2 text-sm font-semibold"
          >
            <FlaskConical className="size-4" />
            Design lab
          </Link>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Live design reference + UI prototyping
          </p>
        </div>

        {/* Search. */}
        <div role="search" className="shrink-0 px-3 pt-3 pb-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search the library"
              className="h-8 w-full rounded-md border border-border bg-card pr-2 pl-8 text-[13px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>
        </div>

        {/* The catalog. */}
        <nav
          aria-label="Design lab"
          className="min-h-0 flex-1 overflow-y-auto px-2 pb-4"
        >
          {zones.length === 0 ? (
            <p
              role="status"
              className="px-3 py-6 text-center text-[13px] text-muted-foreground"
            >
              Nothing matches &ldquo;{query}&rdquo;.
            </p>
          ) : (
            zones.map((zone) => (
              <section key={zone.id} className="pt-3 first:pt-1">
                <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-foreground/80 uppercase">
                  {zone.label}
                </p>
                {zone.groups.map((group) => (
                  <div key={group.label} className="pt-1.5">
                    <p className="px-3 pb-0.5 text-[11px] font-medium text-muted-foreground">
                      {group.label}
                    </p>
                    <ul>
                      {group.entries.map((entry) => (
                        <li key={entry.href}>
                          <Link
                            href={to(entry.href)}
                            onClick={close}
                            aria-current={
                              active(entry.href) ? "page" : undefined
                            }
                            className={cn(
                              "flex items-center gap-2.5 rounded-md py-1.5 pr-2 pl-3 text-[13px] transition-colors",
                              active(entry.href)
                                ? "bg-muted font-medium text-foreground"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                            )}
                          >
                            <StatusDot status={entry.status} />
                            <span className="min-w-0 flex-1 truncate">
                              {entry.label}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            ))
          )}
        </nav>

        {/* Footer: the single theme control. */}
        <div className="flex shrink-0 items-center justify-between border-t border-border px-4 py-3">
          <span className="text-[11px] text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

/** A leading dot whose treatment records the entry's state (and marks it
 *  clickable). The dot is decorative; the meaningful states get an sr-only label
 *  so status reaches AT, not by color alone (WCAG 1.4.1). */
function StatusDot({ status }: { status: Status }) {
  const srLabel =
    status === "shipped"
      ? "Shipped"
      : status === "exploring"
        ? "Exploring"
        : null;
  return (
    <>
      <span
        aria-hidden
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          status === "shipped" && "bg-foreground",
          status === "exploring" && "border border-muted-foreground",
          status === "reference" && "bg-muted-foreground/40",
        )}
      />
      {srLabel && <span className="sr-only">{srLabel}: </span>}
    </>
  );
}

function filterZones(zones: LabZone[], query: string): LabZone[] {
  const q = query.trim().toLowerCase();
  if (!q) return zones;
  return zones
    .map((zone) => ({
      ...zone,
      groups: zone.groups
        .map((group) => ({
          ...group,
          entries: group.entries.filter((e) =>
            e.label.toLowerCase().includes(q),
          ),
        }))
        .filter((group) => group.entries.length > 0),
    }))
    .filter((zone) => zone.groups.length > 0);
}
