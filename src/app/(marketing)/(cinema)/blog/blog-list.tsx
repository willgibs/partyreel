"use client";

import { Rss } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";

import { CoverMorphDelegate } from "@/components/marketing/blog/cover-morph";
import { PostCard } from "@/components/marketing/blog/post-card";
import { PostMeta } from "@/components/marketing/blog/post-meta";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Container } from "@/components/shared/container";
import type { BlogListItem } from "@/lib/content/blog";
import {
  BLOG_LIBRARY_LINE,
  type BlogTagId,
  getBlogTag,
} from "@/lib/content/blog-tags";
import {
  normalizeTag,
  pageNumbers,
  paginate,
  splitLibrary,
  type TagCount,
  tagCounts,
} from "@/lib/content/blog-index";
import { readCssMs } from "@/lib/shared/read-css-ms";
import { useFlip } from "@/lib/shared/use-flip";
import { cn } from "@/lib/utils";

/**
 * THE BLOG INDEX (the composite Will ruled on 2026-08-28, from the four blog-identity lab
 * directions, on the record at git show 3ffe0d56:docs/decisions/design-record.md, #blog-identity): the Cutting Room as the base, the Broadsheet's small masthead and drawn rule as the
 * page intro (reading "Blog", his word), the margin index made STICKY, and the library as a two-
 * to-three column wall of media-forward cards instead of full-width slabs.
 *
 * WHY THIS IS ONE CLIENT ISLAND rather than a server page with a client list: the ruled hero rule
 * couples the two halves. The staged lead exists ONLY in the unfiltered view (see blog-index.ts for
 * why an always-lifted hero renders empty tags), so picking a tag has to collapse something that
 * lives on the cinema stage while the grid below reflows. Splitting that across a server/client
 * boundary would need a side-channel just to hide the hero. Client components still server-render
 * into the initial HTML, so the LCP cover and every title ship in the document either way.
 *
 * Distinctness from /help is the round's hard constraint (both hubs now open on the dark stage):
 * /help opens with a centered question and an instrument row, this opens asymmetric on the lead
 * story with a media wall beneath. No search field, no emblems, and the rail is words and numerals
 * only - an icon column here is the one move that would pull it back toward /help's emblem strip.
 */

/** The FLIP's key for the unfiltered view; see the orderKey note in LibraryGrid. */
const ALL = "__all__";

/** The staged lead's develop slot. Library cards cap BELOW it so the lead always lands last. */
const LEAD_DEVELOP_INDEX = 6;

/**
 * The address bar as an external store.
 *
 * NEVER `useSearchParams`: on this static route it would demand a Suspense boundary or deopt the
 * page (the /contact + motion-tuner precedent). And never a mount effect that setStates either -
 * the repo's react-hooks lint bans setState-in-effect, and rightly: the URL is an external system,
 * which is exactly what useSyncExternalStore is for. The server snapshot is null, so SSR and the
 * hydrating render both produce the unfiltered first page and React corrects on the client pass
 * with no mismatch (the usePrefersReducedMotion pattern).
 */
function subscribeToUrl(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function useUrlParam(key: string): string | null {
  return useSyncExternalStore(
    subscribeToUrl,
    () => new URLSearchParams(window.location.search).get(key),
    () => null,
  );
}

/** What is on screen for a given (tag, page): the staged lead plus the visible slice. */
type View = { tag: BlogTagId | null; page: number };

export function BlogList({ posts }: { posts: BlogListItem[] }) {
  const tags = useMemo(() => tagCounts(posts), [posts]);

  // `undefined` = the reader has not touched the controls, so the URL decides. A plain value cannot
  // tell "untouched" from "explicitly cleared back to Everything".
  const [override, setOverride] = useState<View | undefined>(undefined);
  const urlView: View = {
    tag: normalizeTag(useUrlParam("tag"), posts),
    page: Number(useUrlParam("page") ?? 1),
  };
  const view = override ?? urlView;

  /** Slugs mid-exit. Non-empty means beat 1 is running and the set has NOT committed yet. */
  const [exiting, setExiting] = useState<readonly string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scopeRef = useRef<HTMLDivElement | null>(null);
  const libraryRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => () => clearTimeout(timer.current ?? undefined), []);

  const resolve = useCallback(
    (next: View) => {
      const { lead, library } = splitLibrary(posts, next.tag);
      // paginate CLAMPS, so a stale ?page= or a filter that shrinks the set under the reader still
      // lands on a real page rather than an empty grid.
      return { lead, page: paginate(library, next.page) };
    },
    [posts],
  );

  const current = resolve(view);

  const go = useCallback(
    (next: View, { scrollToLibrary = false } = {}) => {
      if (next.tag === view.tag && next.page === current.page.page) return;
      clearTimeout(timer.current ?? undefined);

      const after = resolve(next);
      const surviving = new Set(after.page.items.map((post) => post.slug));
      const leaving = [
        ...(current.lead && !surviving.has(current.lead.slug)
          ? [current.lead.slug]
          : []),
        ...current.page.items
          .filter((post) => !surviving.has(post.slug))
          .map((post) => post.slug),
      ];

      const commit = () => {
        setExiting([]);
        setOverride({ tag: next.tag, page: after.page.page });
        // replaceState, not push: a filter and a page are views of one page, and a chip row that
        // stacks a history entry per click turns Back into an unusable undo log.
        const url = new URL(window.location.href);
        if (next.tag) url.searchParams.set("tag", next.tag);
        else url.searchParams.delete("tag");
        if (after.page.page > 1)
          url.searchParams.set("page", String(after.page.page));
        else url.searchParams.delete("page");
        window.history.replaceState(null, "", url);
        // Paging keeps the reader in the library; without this a click on "2" leaves them staring
        // at the hero while the grid they were reading silently swaps out below the fold.
        if (scrollToLibrary) {
          libraryRef.current?.scrollIntoView({
            block: "start",
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "auto"
              : "smooth",
          });
        }
      };

      // A superset (nothing removed) has no beat 1 to wait for. Neither does reduced
      // motion: the exit is animation-only, so waiting out its clock there would be a
      // dead pause before the set changes. The review queue sets the same precedent -
      // it never writes [data-exiting] under reduce, it just commits.
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (leaving.length === 0 || reduce) {
        commit();
        return;
      }
      setExiting(leaving);
      timer.current = setTimeout(
        commit,
        readCssMs("--mkt-set-exit-ms", 140, scopeRef.current),
      );
    },
    [current, resolve, view.tag],
  );

  const isExiting = (slug: string) => exiting.includes(slug);
  const { lead, page } = current;
  const activeTag = view.tag ? getBlogTag(view.tag) : null;

  return (
    <div ref={scopeRef}>
      {/* One island for every card on the page. */}
      <CoverMorphDelegate />
      {/* ── The cinema stage: masthead, then the featured card. ─────────────────────────── */}
      <section className="pt-14 pb-0 sm:pt-20">
        <Container>
          {/* THE MASTHEAD (Broadsheet's, ruled in): a small title and a drawn rule, not a display
              headline, so the featured article owns the stage. `Blog` stays the h1 even though the
              article title is visually larger: it is what the page IS, it never collapses under a
              filter the way the featured card does, and it keeps the document outline stable in
              every view. The article title below is an h2 at the article type ramp. */}
          <div className="flex items-baseline justify-between gap-4">
            <h1 className="font-heading text-lg sm:text-xl">Blog</h1>
            <a
              href="/blog/feed.xml"
              className="group inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              <Rss
                className="size-3 transition-transform duration-150 group-hover:scale-110 motion-reduce:transition-none"
                aria-hidden
              />
              Subscribe
            </a>
          </div>
          <span
            data-mkt-rule
            aria-hidden
            className="mt-3 block h-px w-full bg-foreground/25"
          />

          {/* The featured card STRADDLES the cinema->paper cut on negative margin (the ratified
              move: /help's emblem strip, the home album). Real layout, never a translate, so the
              article arrives out of the night into the daylight the library reads in. */}
          {lead && (
            <div
              data-mkt-exiting={isExiting(lead.slug) ? "" : undefined}
              className="relative z-10 mt-8 -mb-16 sm:-mb-20"
            >
              <FeaturedCard post={lead} />
            </div>
          )}
        </Container>
      </section>

      {/* ── The paper chapter: the rail and the library. ────────────────────────────────── */}
      <PaperChapter className="border-t-0">
        <section className="pb-16 lg:pt-24 lg:pb-20">
          {/* STRADDLE CLEARANCE. A fixed height, deliberately NOT top padding on the section:
              PaperChapter force-compresses a direct child section's `py` to py-14 below lg
              (`max-lg:[&>section]:py-14`, higher specificity than a child utility), which silently
              ate the clearance and let the featured card land ON the rail on phones. A height on an
              inner element is outside that selector's reach. */}
          <div aria-hidden className="h-[4.5rem]" />
          <Container>
            <div className="grid gap-8 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-12">
              <TagRail
                tags={tags}
                total={posts.length}
                active={view.tag}
                onSelect={(tag) => go({ tag, page: 1 })}
              />

              <div
                ref={libraryRef}
                className="min-w-0 scroll-mt-[calc(var(--mkt-header-h,4rem)+1.5rem)]"
              >
                {/* THE HEADING LOCKUP: the tag's LABEL over its one-line description, and the
                    unfiltered view carries a line too. A constant block height is load-bearing:
                    if picking a tag added a line here, every card below would shift and the
                    two-axis FLIP would animate the shift as a jolt. The description is keyed on
                    the view so it re-mounts and takes the shared set-change enter beat with the
                    cards, and it sits OUTSIDE the aria-live readout so a keyed re-mount never
                    double-announces. line-clamp-2 + a two-line floor below lg, where the count
                    shares the row and an 80-char line can wrap once. */}
                <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-3">
                  <div className="min-w-0">
                    <h2 className="font-heading text-xl sm:text-2xl">
                      {activeTag ? activeTag.label : "The library"}
                    </h2>
                    <p
                      key={view.tag ?? ALL}
                      data-mkt-entering
                      className="mt-1 line-clamp-2 min-h-[2lh] text-sm text-pretty text-muted-foreground lg:min-h-0"
                    >
                      {activeTag ? activeTag.description : BLOG_LIBRARY_LINE}
                    </p>
                  </div>
                  <p
                    aria-live="polite"
                    className="text-xs text-muted-foreground tabular-nums"
                  >
                    {page.pageCount > 1
                      ? `Showing ${page.from}–${page.to} of ${page.total}`
                      : page.total === 1
                        ? "One post"
                        : `${page.total} posts`}
                  </p>
                </div>

                <LibraryGrid
                  items={page.items}
                  orderKey={`${view.tag ?? ALL}:${page.page}`}
                  isExiting={isExiting}
                />

                <Pager
                  page={page.page}
                  pageCount={page.pageCount}
                  onGo={(n) =>
                    go({ tag: view.tag, page: n }, { scrollToLibrary: true })
                  }
                />
              </div>
            </div>
          </Container>
        </section>
      </PaperChapter>
    </div>
  );
}

/**
 * The grid. The FLIP registers on the WRAPPER while the exit/enter hooks sit on the card inside it,
 * so the FLIP's inline `transition: transform` can never clobber the exit's transition property.
 * orderKey carries the page as well as the tag, so paging reorganizes rather than jump-cuts.
 */
function LibraryGrid({
  items,
  orderKey,
  isExiting,
}: {
  items: BlogListItem[];
  orderKey: string;
  isExiting: (slug: string) => boolean;
}) {
  const register = useFlip(orderKey);

  return (
    <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((post, index) => (
        <li
          key={post.slug}
          ref={register(post.slug)}
          // A lone survivor (a one-post tag) would sit in the corner of a two-column grid; let it
          // take the row at sm, and a single cell again once the wall is three wide. `only:` is
          // true by construction whenever the DOM holds one card, mid-transition included.
          className="min-w-0 sm:only:col-span-2 xl:only:col-span-1"
        >
          <div
            data-mkt-entering
            data-mkt-exiting={isExiting(post.slug) ? "" : undefined}
          >
            {/* ★ The develop stagger is CAPPED below the lead's slot so the lead lands LAST (the
                eye lands where the reading starts). Uncapped, a twelve-card page would land its
                last six cards after the hero, and every filter or page change would replay a
                second-long muted hole in the bottom row. */}
            <PostCard
              post={post}
              index={Math.min(index, LEAD_DEVELOP_INDEX - 1)}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Pagination, built ahead of need (Will's call) and INVISIBLE until a set overflows: a tag with
 * twelve posts or fewer renders no control at all. Numerals are Inter with
 * tabular-nums rather than mono, matching the byline decision - mono is for numerals that align in
 * a column, and these are a control, not a table.
 */
function Pager({
  page,
  pageCount,
  onGo,
}: {
  page: number;
  pageCount: number;
  onGo: (page: number) => void;
}) {
  if (pageCount <= 1) return null;
  const numbers = pageNumbers(page, pageCount);

  return (
    <nav
      aria-label="Pagination"
      // The control appears the moment a set overflows (pick Everything from a short tag): the
      // shared enter beat fades it in with the cards instead of letting it pop.
      data-mkt-entering
      className="mt-10 flex items-center justify-center gap-1 border-t pt-6"
    >
      <PagerStep
        label="Previous"
        disabled={page === 1}
        onClick={() => onGo(page - 1)}
      />
      <ol className="flex items-center gap-1">
        {numbers.map((n, i) =>
          n === null ? (
            <li
              key={`gap-${i}`}
              aria-hidden
              className="px-1 text-sm text-faint"
            >
              &hellip;
            </li>
          ) : (
            <li key={n}>
              <button
                type="button"
                onClick={() => onGo(n)}
                aria-current={n === page ? "page" : undefined}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-sm tabular-nums",
                  "transition-[color,background-color] duration-150",
                  n === page
                    ? "bg-foreground font-medium text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {n}
              </button>
            </li>
          ),
        )}
      </ol>
      <PagerStep
        label="Next"
        disabled={page === pageCount}
        onClick={() => onGo(page + 1)}
      />
    </nav>
  );
}

function PagerStep({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-2.5 py-1 text-sm transition-colors duration-150",
        disabled
          ? "cursor-not-allowed text-faint"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

/**
 * THE MARGIN INDEX, sticky at lg+ (Will's ruling). A ruled ledger in the body margin: words and
 * numerals only (the registry LABEL, never an icon; an icon column is the one move that collapses
 * this into /help's emblem strip), counts from the FULL set so a row's number is a promise about
 * what it will show, in REGISTRY order so the rail never reshuffles as posts land.
 * Active state is a 2px ink bar in the gutter, never a fill - a filled pill would make the control
 * the loudest object on a page whose subject is photographs.
 *
 * Below lg it becomes a horizontal snap scroller (the proven /help phone pattern) rather than a
 * wrapping hedge, which is what six rows plus Everything turn into on a
 * phone.
 */
function TagRail({
  tags,
  total,
  active,
  onSelect,
}: {
  tags: TagCount[];
  total: number;
  active: BlogTagId | null;
  onSelect: (tag: BlogTagId | null) => void;
}) {
  return (
    <nav
      aria-label="Filter posts by tag"
      // min-w-0 is load-bearing, not tidiness: a grid item defaults to min-width:auto, so the
      // horizontal tag scroller below could not clip and stretched the whole page to 763px at a
      // 375px viewport (a body-level horizontal scrollbar on every phone).
      className="min-w-0 lg:sticky lg:top-[var(--mkt-rail-top)] lg:self-start"
    >
      <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
        Browse
      </p>
      <div className="mt-3 flex [scrollbar-width:none] gap-x-4 overflow-x-auto pb-1 lg:flex-col lg:gap-x-0 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
        <RailRow
          label="Everything"
          count={total}
          active={active === null}
          onClick={() => onSelect(null)}
        />
        {tags.map((tag) => (
          <RailRow
            key={tag.id}
            label={tag.label}
            count={tag.count}
            active={active === tag.id}
            onClick={() => onSelect(tag.id)}
          />
        ))}
      </div>
    </nav>
  );
}

function RailRow({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  // Below lg the rail is a horizontal snap scroller, and a ?tag= deep link can select a row that
  // sits off-screen to the right. A ref callback (not an effect: no setState, and it runs on mount
  // and on every re-render where `active` flips) nudges the RAIL's own scrollLeft, never
  // scrollIntoView: that scrolls the window too ("block: nearest" is not a vertical no-op), and
  // on hydration the active row is "Everything", which would yank every /blog load down to the
  // rail on a short laptop viewport. On the lg column the rail has no overflow, so this is a no-op.
  const reveal = useCallback(
    (node: HTMLButtonElement | null) => {
      const rail = node?.parentElement;
      if (!node || !rail || !active) return;
      const left = node.offsetLeft;
      const right = left + node.offsetWidth;
      if (
        left < rail.scrollLeft ||
        right > rail.scrollLeft + rail.clientWidth
      ) {
        rail.scrollLeft = Math.max(0, left - 16);
      }
    },
    [active],
  );

  return (
    <button
      ref={reveal}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative flex shrink-0 snap-start items-baseline justify-between gap-3 py-1.5 text-left text-[13px] whitespace-nowrap",
        "transition-colors duration-150 lg:w-full lg:border-t lg:pl-3 lg:first:border-t-0",
        active
          ? "font-medium text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-1 bottom-1 left-0 hidden w-0.5 bg-foreground transition-opacity duration-150 lg:block",
          active ? "opacity-100" : "opacity-0",
        )}
      />
      {label}
      <span className="text-[11px] text-faint tabular-nums">{count}</span>
    </button>
  );
}

/**
 * The staged lead. Same grammar as PostCard at feature scale, and the highest develop index so its
 * plate resolves LAST - the eye lands where the reading starts.
 *
 * ★ The title runs the ARTICLE type ramp (4xl/5xl/6xl, clamped to a reading measure), not a card
 * scale: Will's note was that it visually functions as the page's H1, so it should be set like the
 * H1 on the post it links to. Semantically it stays an h2 under the masthead's `Blog` - see the
 * masthead comment for why the small one keeps the h1.
 */
function FeaturedCard({ post }: { post: BlogListItem }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      data-cover-morph=""
      // 21:9 on desktop, the Cutting Room's signature letterbox: at container width a 16:9 hero
      // measured 684px against an 820px viewport, so the fold held the masthead and nothing else.
      // The crop is also the one aspect no other marketing surface uses (frames run 4:3, 16:9, 1:1,
      // 4/5, 16:10), and it plays against the library's portrait cards instead of echoing them.
      className="group relative block aspect-4/5 overflow-hidden bg-muted transition-transform duration-200 ease-emphasis focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white active:scale-[0.995] motion-reduce:transition-none sm:aspect-21/9"
    >
      <span
        data-mkt-develop
        data-cover-plate=""
        className="absolute inset-0"
        style={{ "--i": LEAD_DEVELOP_INDEX } as CSSProperties}
      >
        <Image
          src={post.cover.src}
          alt=""
          fill
          sizes="(max-width: 1280px) 100vw, 1200px"
          priority
          className="object-cover transition-transform duration-500 ease-emphasis group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          style={{ objectPosition: post.cover.objectPosition }}
        />
      </span>
      <span
        aria-hidden
        className="absolute inset-0 bg-linear-to-t from-black/90 via-black/45 to-black/10 transition-opacity duration-[180ms] ease-emphasis group-hover:opacity-85 motion-reduce:transition-none"
      />
      <span className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 sm:p-8 md:p-10">
        <span className="text-[11px] font-medium tracking-[0.14em] text-white/70 uppercase">
          Latest
        </span>
        <h2 className="line-clamp-3 max-w-3xl font-heading text-chapter text-balance text-white">
          {post.title}
        </h2>
        <span className="hidden max-w-xl text-sm text-pretty text-white/75 sm:block">
          {post.description}
        </span>
        <PostMeta post={post} className="mt-1" />
      </span>
    </Link>
  );
}
