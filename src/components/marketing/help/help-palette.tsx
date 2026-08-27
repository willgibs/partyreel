"use client";

import { ArrowUpRight, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { portalSkinProps } from "@/components/marketing/chrome/portal-skin";
import { MissingFrameStrip } from "@/components/marketing/marketing-not-found";
import { Kbd } from "@/components/shared/kbd";
import type { HelpSearchItem } from "@/lib/content/help";
import {
  matchDestinations,
  rankHelpSearch,
  segmentMatches,
  tokenizeQuery,
} from "@/lib/content/help-search-rank";
import { cn } from "@/lib/utils";

// ── The help search palette (R6) ───────────────────────────────────────────────
// The help center's primary interface: a ranked command palette over the whole
// library, ⌘K from anywhere under /help, with section-level deep links and a
// "Pages" tail that hands people onward to the wider site. Composed directly on
// the radix Dialog primitive (the media-lightbox precedent) rather than
// ui/dialog's centered card: this panel is top-aligned, list-shaped, and owns
// its focus/keyboard model. The portal escapes the (paper) skin wrapper, so
// Overlay + Content both carry portalSkinProps("paper") — the forced-light rule.
//
// The ranking/segmentation logic is pure and lives in help-search-rank.ts
// (fs-free); this file imports help.ts as a TYPE only — a value import would
// pull node:fs into the client bundle.

type QuickLink = { label: string; href: string };

type PaletteContextValue = { open: () => void };

const PaletteContext = createContext<PaletteContextValue | null>(null);

function useHelpPalette(): PaletteContextValue {
  const ctx = useContext(PaletteContext);
  if (!ctx) {
    throw new Error(
      "HelpSearchTrigger must render inside HelpPaletteProvider (help/layout.tsx)",
    );
  }
  return ctx;
}

const noopSubscribe = () => () => {};

/**
 * ⌘ vs Ctrl for the kbd hints. useSyncExternalStore with a server snapshot of
 * `true` (⌘): no hydration mismatch, and non-Mac clients correct in the same
 * hydration pass (the header-shell useMountScrolled pattern).
 */
function useIsMac(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => /Mac|iPhone|iPad/.test(navigator.platform),
    () => true,
  );
}

type PaletteOption = {
  kind: "article" | "page" | "suggested";
  id: string;
  href: string;
  /** Article title or destination label. */
  label: string;
  /** Section deep-link, only when a heading was the sole reason for the match. */
  anchor: { id: string; text: string } | null;
  categoryTitle: string | null;
};

export function HelpPaletteProvider({
  index,
  quickLinks,
  children,
}: {
  index: HelpSearchItem[];
  quickLinks: readonly QuickLink[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  // Set while an Enter/click navigation is closing the dialog: radix's
  // close-autofocus would scroll the trigger back into view AFTER the new
  // page's hash scroll and strand the reader on the trigger (the classic
  // palette bug) — we suppress focus restore for navigations only, so a plain
  // Escape still returns focus to the trigger like a well-behaved dialog.
  const navigatingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasQuery = tokenizeQuery(query).length > 0;
  const results = useMemo(
    () => (hasQuery ? rankHelpSearch(index, query, 8) : []),
    [index, query, hasQuery],
  );
  const pages = useMemo(
    () => (hasQuery ? matchDestinations(query) : []),
    [query, hasQuery],
  );

  const options = useMemo<PaletteOption[]>(() => {
    if (!hasQuery) {
      return quickLinks.map((link) => ({
        kind: "suggested",
        id: `help-opt-suggested-${link.href.replaceAll("/", "-")}`,
        href: link.href,
        label: link.label,
        anchor: null,
        categoryTitle: null,
      }));
    }
    return [
      ...results.map<PaletteOption>((result) => ({
        kind: "article",
        // Composite id: heading ids repeat ACROSS articles ("The short version"
        // is everywhere), so the option id must carry the slug too or
        // aria-activedescendant can point at the wrong node.
        id: `help-opt-${result.item.slug}${result.anchor ? `--${result.anchor.id}` : ""}`,
        href: `/help/${result.item.slug}${result.anchor ? `#${result.anchor.id}` : ""}`,
        label: result.item.title,
        anchor: result.anchor,
        categoryTitle: result.item.categoryTitle,
      })),
      ...pages.map<PaletteOption>((page) => ({
        kind: "page",
        id: `help-opt-page-${page.href.replaceAll("/", "-")}`,
        href: page.href,
        label: page.label,
        anchor: null,
        categoryTitle: null,
      })),
    ];
  }, [hasQuery, quickLinks, results, pages]);

  // Render-time clamp (options shrink as the query narrows).
  const active = options.length > 0 ? Math.min(activeIndex, options.length - 1) : 0;
  const activeId = options[active]?.id;

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const openPalette = useCallback(() => {
    setIsOpen(true);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) openPalette();
      else close();
    },
    [openPalette, close],
  );

  // ⌘K / Ctrl+K toggles from anywhere under /help. preventDefault matters:
  // Ctrl+K is Chrome's omnibox search and ⌘K is Firefox's search-bar focus.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k" &&
        !event.repeat &&
        !event.defaultPrevented
      ) {
        event.preventDefault();
        setIsOpen((open) => {
          if (open) {
            setQuery("");
            setActiveIndex(0);
          }
          return !open;
        });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Keep the active option visible while arrowing through a scrolled list.
  useEffect(() => {
    if (!isOpen || !activeId) return;
    document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
  }, [isOpen, activeId]);

  const navigate = useCallback(
    (option: PaletteOption) => {
      navigatingRef.current = true;
      close();
      const [path, hash] = option.href.split("#");
      if (path === pathname) {
        // Same page: replaceState + scrollIntoView beats router.push (which
        // would re-render for nothing); scrollIntoView honors the headings'
        // scroll-margin-top, so sections land clear of the sticky header.
        requestAnimationFrame(() => {
          if (hash) {
            history.replaceState(null, "", `#${hash}`);
            document.getElementById(hash)?.scrollIntoView({ block: "start" });
          }
        });
      } else {
        // Close first, push a frame later, so RemoveScroll's body lock is gone
        // before the new page (and any #hash scroll) lands.
        requestAnimationFrame(() => router.push(option.href));
      }
    },
    [close, pathname, router],
  );

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (options.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex(Math.min(active + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(Math.max(active - 1, 0));
    } else if (event.key === "Home" && !event.shiftKey) {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End" && !event.shiftKey) {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = options[active];
      if (option) navigate(option);
    }
  }

  const skin = portalSkinProps("paper");
  const resultCount = results.length + pages.length;
  const firstPageIndex = results.length;

  return (
    <PaletteContext.Provider value={{ open: openPalette }}>
      {children}
      <DialogPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            data-mkt=""
            className={cn(
              skin.className,
              "fixed inset-0 isolate z-50 bg-black/15 duration-200 ease-emphasis supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 data-closed:duration-150",
            )}
          />
          <DialogPrimitive.Content
            data-mkt=""
            aria-describedby={undefined}
            onCloseAutoFocus={(event) => {
              if (navigatingRef.current) {
                event.preventDefault();
                navigatingRef.current = false;
              }
            }}
            className={cn(
              skin.className,
              "fixed top-[12vh] left-1/2 z-50 w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-float border bg-popover text-popover-foreground shadow-float ring-1 ring-foreground/10 duration-200 ease-emphasis outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-open:slide-in-from-top-2 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:duration-150",
            )}
          >
            <DialogPrimitive.Title className="sr-only">
              Search the help center
            </DialogPrimitive.Title>

            <div className="flex h-14 items-center gap-3 border-b px-4">
              <Search
                aria-hidden
                className="size-[18px] shrink-0 text-muted-foreground"
              />
              <input
                ref={inputRef}
                role="combobox"
                aria-expanded
                aria-controls="help-palette-list"
                aria-activedescendant={activeId}
                aria-autocomplete="list"
                aria-label="Search the help center"
                autoFocus
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onInputKeyDown}
                placeholder="Search the help center..."
                className="h-full flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
              />
              {query.length > 0 && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery("");
                    setActiveIndex(0);
                    inputRef.current?.focus();
                  }}
                  className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <div
              id="help-palette-list"
              role="listbox"
              aria-label="Search results"
              className="max-h-[min(26rem,55vh)] overflow-y-auto p-2"
            >
              {!hasQuery && (
                <p className="px-3 pt-2 pb-1.5 text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  Suggested
                </p>
              )}
              {hasQuery && resultCount === 0 && (
                <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
                  <MissingFrameStrip label="0" />
                  <p className="text-sm text-muted-foreground">
                    No matches for &ldquo;{query}&rdquo;. Try fewer words, or
                    ask a person.
                  </p>
                  <Link
                    href="/contact"
                    onClick={() => {
                      navigatingRef.current = true;
                      close();
                    }}
                    className="text-sm font-medium text-foreground underline decoration-border underline-offset-4 transition-colors duration-150 hover:decoration-foreground"
                  >
                    Contact us
                  </Link>
                </div>
              )}
              {options.map((option, optionIndex) => (
                <span key={option.id} className="block">
                  {option.kind === "page" && optionIndex === firstPageIndex && (
                    <p className="px-3 pt-3 pb-1.5 text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                      Pages
                    </p>
                  )}
                  <Link
                    id={option.id}
                    role="option"
                    aria-selected={optionIndex === active}
                    href={option.href}
                    onClick={(event) => {
                      // Modifier clicks keep native behavior (new tab).
                      if (event.metaKey || event.ctrlKey || event.shiftKey)
                        return;
                      event.preventDefault();
                      navigate(option);
                    }}
                    onMouseMove={() => setActiveIndex(optionIndex)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm select-none",
                      optionIndex === active && "bg-muted",
                    )}
                  >
                    {option.kind === "page" && (
                      <ArrowUpRight
                        aria-hidden
                        className="size-4 shrink-0 text-muted-foreground"
                      />
                    )}
                    {option.kind === "suggested" && (
                      <Search
                        aria-hidden
                        className="size-4 shrink-0 text-muted-foreground"
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-foreground">
                        {option.kind === "article"
                          ? segmentMatches(option.label, query).map(
                              (segment, i) => (
                                <span
                                  key={i}
                                  className={cn(
                                    segment.match && "font-semibold",
                                  )}
                                >
                                  {segment.text}
                                </span>
                              ),
                            )
                          : option.label}
                      </span>
                      {option.anchor && (
                        <span className="block truncate text-xs text-muted-foreground">
                          &#8627; {option.anchor.text}
                        </span>
                      )}
                    </span>
                    {option.categoryTitle && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {option.categoryTitle}
                      </span>
                    )}
                  </Link>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-4 border-t bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Kbd>&#8593;</Kbd>
                <Kbd>&#8595;</Kbd> Navigate
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>&#8629;</Kbd> Open
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>esc</Kbd> Close
              </span>
              {hasQuery && (
                <span className="ml-auto tabular-nums">
                  {resultCount} {resultCount === 1 ? "result" : "results"}
                </span>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </PaletteContext.Provider>
  );
}

/**
 * The two palette triggers. "hero" is the index page's input-shaped search
 * field; "compact" is the article page's slim pill. Both are real buttons that
 * open the shared palette; the kbd chip shows the platform's actual shortcut.
 */
export function HelpSearchTrigger({
  variant = "hero",
  className,
}: {
  variant?: "hero" | "compact";
  className?: string;
}) {
  const { open } = useHelpPalette();
  const isMac = useIsMac();
  const shortcut = isMac ? "⌘K" : "Ctrl K";

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={open}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-full border bg-card px-3.5 text-sm text-muted-foreground transition-colors duration-150 hover:border-foreground/25 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none",
          className,
        )}
      >
        <Search aria-hidden className="size-4" />
        Search
        <Kbd className="ml-0.5">{shortcut}</Kbd>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      className={cn(
        // The desk elevation: the search field is the page's primary
        // instrument, so it carries the float shadow at rest (R6 polish).
        "flex h-14 w-full max-w-xl items-center gap-3.5 rounded-full border bg-card px-6 pr-3 text-left shadow-float ring-1 ring-foreground/5 transition-[border-color,transform] duration-150 hover:-translate-y-px hover:border-foreground/25 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none motion-reduce:transition-none",
        className,
      )}
    >
      <Search aria-hidden className="size-[18px] shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate text-[15px] text-muted-foreground">
        Search the help center...
      </span>
      <Kbd>{shortcut}</Kbd>
    </button>
  );
}
